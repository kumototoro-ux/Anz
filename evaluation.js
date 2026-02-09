import { getStudentData } from "./api.js";

let comparisonChart; 

document.addEventListener("DOMContentLoaded", async () => {
    // 1. استرجاع بيانات الطالب
    const user = JSON.parse(localStorage.getItem("user"));
    if (!user || !user.ID) {
        window.location.href = "index.html";
        return;
    }

    // --- تفعيل القائمة في الجوال ---
    const menuToggle = document.getElementById('menuToggle');
    const sideNav = document.querySelector('.side-nav');

    if (menuToggle && sideNav) {
        menuToggle.onclick = (e) => {
            e.stopPropagation();
            sideNav.classList.toggle('active');
        };
    }

    if (mainContent && sideNav) {
        mainContent.addEventListener('click', () => {
            if (window.innerWidth <= 992) {
                sideNav.classList.remove('active');
            }
        });
    }
    // إغلاق القائمة عند الضغط على المحتوى الرئيسي
    const mainContent = document.querySelector('.main-content');
    if (mainContent) {
        mainContent.onclick = () => {
            if (sideNav) sideNav.classList.remove('active');
        };
    }

    // 2. التحقق من مادة التفكير الناقد (تم تصحيح المنطق)
    const level = user.StudentLevel ? String(user.StudentLevel) : "";
    if ((level.includes("ثالث") || level.includes("3")) && level.includes("متوسط")) {
        const criticalOpt = document.getElementById('criticalOption');
        if (criticalOpt) criticalOpt.style.display = 'block';
    }

    initWeekSelector();
    
    const subSelect = document.getElementById("subjectSelect");
    const weekSelect = document.getElementById("weekSelect");

    if (subSelect) subSelect.onchange = loadData;
    if (weekSelect) weekSelect.onchange = loadData;

    loadData();
    setupLogout(); 
});

// دالة تسجيل الخروج
function setupLogout() {
    const logoutBtn = document.getElementById('logoutBtn');
    if(logoutBtn) {
        logoutBtn.onclick = () => {
            localStorage.clear();
            window.location.href = 'index.html';
        };
    }
}

function initWeekSelector() {
    const ws = document.getElementById("weekSelect");
    if (!ws) return;
    ws.innerHTML = ""; // مسح المحتوى القديم
    for(let i=1; i<=12; i++) {
        ws.innerHTML += `<option value="${i}">الأسبوع ${i}</option>`;
    }
}

async function loadData() {
    const user = JSON.parse(localStorage.getItem("user"));
    const subSelect = document.getElementById("subjectSelect");
    const weekSelect = document.getElementById("weekSelect");

    if (!subSelect || !weekSelect) return;

    const subject = subSelect.value;
    const week = parseInt(weekSelect.value);

    const res = await getStudentData(subject, user.ID); 

    if (res.success && res.data) {
        processAndDisplay(res.data, week, subject);
    } else {
        showNoData();
    }
}

function processAndDisplay(data, week, subject) {
    let components = [];
    const prValue = week <= 6 ? data.PR_1 : data.PR_2;

    if (subject === 'Quran') {
        components = [
            { label: "المشاركة", val: prValue },
            { label: "واجبات ومهام", val: data[`HW_${week}`] },
            { label: "قراءة القرآن", val: data[`read_${week}`] },
            { label: "تجويد القرآن", val: data[`Taj_${week}`] },
            { label: "حفظ القرآن", val: data[`save_${week}`] }
        ];
    } else {
        components = [
            { label: "المشاركة", val: prValue },
            { label: "واجبات ومهام", val: data[`HW_${week}`] },
            { label: "اختبار قصير", val: data[`QZ_${week}`] }
        ];
    }

    const hasValues = components.some(c => c.val !== null && c.val !== undefined && c.val !== "");

    if (!hasValues) {
        showNoData();
        return;
    }

    hideNoData();
    renderBars(components);
    renderComparisonChart(data, week, components); 
    generateSmartFeedback(components);
}

function renderBars(components) {
    const container = document.getElementById('progressBarsContainer');
    if (!container) return;
    container.innerHTML = '';
    
    components.forEach(comp => {
        const val = parseFloat(comp.val) || 0;
        const percent = (val / 5) * 100;
        let color = "#ea4335"; 
        if(percent >= 80) color = "#34a853"; 
        else if(percent >= 50) color = "#fbbc05"; 

        container.innerHTML += `
            <div style="margin-bottom:15px">
                <div style="display:flex; justify-content:space-between; margin-bottom:5px; font-weight:bold; font-size:0.9rem;">
                    <span>${comp.label}</span>
                    <span>${val} / 5</span>
                </div>
                <div style="height:10px; background:#eee; border-radius:10px; overflow:hidden">
                    <div style="width:${percent}%; height:100%; background:${color}; transition: width 0.8s ease-out"></div>
                </div>
            </div>
        `;
    });
}

function renderComparisonChart(data, currentWeek, components) {
    const canvas = document.getElementById('comparisonChart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    if (comparisonChart) comparisonChart.destroy();

    const labels = [];
    const averages = [];

    for (let i = 1; i <= currentWeek; i++) {
        labels.push(`أسبوع ${i}`);
        let sum = 0, count = 0;
        
        components.forEach(c => {
            let val;
            if (c.label === "المشاركة") {
                val = i <= 6 ? data.PR_1 : data.PR_2;
            } else {
                const key = (c.label === "واجبات ومهام") ? "HW" : 
                            (c.label === "اختبار قصير") ? "QZ" :
                            (c.label === "قراءة القرآن") ? "read" :
                            (c.label === "تجويد القرآن") ? "Taj" : "save";
                val = data[`${key}_${i}`];
            }
            
            if (val != null && val !== "") { 
                sum += parseFloat(val); 
                count++; 
            }
        });
        averages.push(count > 0 ? (sum / count).toFixed(2) : 0);
    }

    comparisonChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'معدل الأداء',
                data: averages,
                borderColor: '#1a73e8',
                backgroundColor: 'rgba(26, 115, 232, 0.1)',
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: { y: { max: 5, min: 0 } },
            plugins: { legend: { display: false } }
        }
    });
}

function generateSmartFeedback(components) {
    const validComps = components.filter(c => c.val !== null && c.val !== "");
    const avg = validComps.reduce((a, b) => a + (parseFloat(b.val) || 0), 0) / (validComps.length || 1);
    const feedbackText = document.getElementById('feedbackText');
    if (!feedbackText) return;

    if (avg >= 4.5) {
        feedbackText.innerHTML = "<strong>مستوى مذهل!</strong> أنت تسير على طريق التميز.";
    } else if (avg >= 3.5) {
        feedbackText.innerHTML = "<strong>أداء جيد جداً!</strong> قليل من التركيز وستصل للكمال.";
    } else {
        feedbackText.innerHTML = "<strong>تحتاج لاجتهاد!</strong> ننصحك بمراجعة دروس هذا الأسبوع.";
    }
}

function showNoData() {
    const dc = document.getElementById('dataContainer');
    const nd = document.getElementById('noDataMessage');
    if(dc) dc.style.display = 'none';
    if(nd) nd.style.display = 'block';
}

function hideNoData() {
    const dc = document.getElementById('dataContainer');
    const nd = document.getElementById('noDataMessage');
    if(dc) dc.style.display = 'grid';
    if(nd) nd.style.display = 'none';
}
