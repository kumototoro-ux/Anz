import { getStudentData } from "./api.js";

let comparisonChart; // متغير عالمي لحفظ الرسم البياني ومنع التكرار

document.addEventListener("DOMContentLoaded", async () => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (!user || !user.ID) {
        window.location.href = "index.html";
        return;
    }

    setupNavigation();

    if (user.StudentLevel && user.StudentLevel.includes("ثالث متوسط")) {
        document.getElementById('criticalOption').style.display = 'block';
    }

    initWeekSelector();
    
    document.getElementById("subjectSelect").onchange = loadData;
    document.getElementById("weekSelect").onchange = loadData;

    loadData();
});

function initWeekSelector() {
    const ws = document.getElementById("weekSelect");
    for(let i=1; i<=12; i++) {
        ws.innerHTML += `<option value="${i}">الأسبوع ${i}</option>`;
    }
}

async function loadData() {
    const user = JSON.parse(localStorage.getItem("user"));
    const subject = document.getElementById("subjectSelect").value;
    const week = parseInt(document.getElementById("weekSelect").value);

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
            { label: "المشاركة", val: prValue, key: 'PR' },
            { label: "واجبات ومهام", val: data[`HW_${week}`], key: 'HW' },
            { label: "قراءة القرآن", val: data[`read_${week}`], key: 'read' },
            { label: "تجويد القرآن", val: data[`Taj_${week}`], key: 'Taj' },
            { label: "حفظ القرآن", val: data[`save_${week}`], key: 'save' }
        ];
    } else {
        components = [
            { label: "المشاركة", val: prValue, key: 'PR' },
            { label: "واجبات ومهام", val: data[`HW_${week}`], key: 'HW' },
            { label: "اختبار قصير", val: data[`QZ_${week}`], key: 'QZ' }
        ];
    }

    const hasValues = components.some(c => c.val !== null && c.val !== undefined && c.val !== "");

    if (!hasValues) {
        showNoData();
        return;
    }

    hideNoData();
    renderBars(components);
    // تم تصحيح اسم الدالة هنا ليتطابق مع التعريف بالأسفل
    renderComparisonChart(data, week, components); 
    generateSmartFeedback(components);
}

function renderBars(components) {
    const container = document.getElementById('progressBarsContainer');
    container.innerHTML = '';
    
    components.forEach(comp => {
        const val = parseFloat(comp.val) || 0;
        const percent = (val / 5) * 100;
        let color = "#ea4335"; 
        if(percent >= 80) color = "#34a853"; 
        else if(percent >= 50) color = "#fbbc05"; 

        container.innerHTML += `
            <div style="margin-bottom:20px">
                <div style="display:flex; justify-content:space-between; margin-bottom:5px; font-weight:bold">
                    <span>${comp.label}</span>
                    <span>${val} / 5</span>
                </div>
                <div style="height:12px; background:#eee; border-radius:10px; overflow:hidden">
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

    // حساب المتوسط لكل أسبوع من 1 حتى الأسبوع المختار
    for (let i = 1; i <= currentWeek; i++) {
        labels.push(`أسبوع ${i}`);
        let sum = 0, count = 0;
        
        components.forEach(c => {
            let val;
            if (c.label === "المشاركة") {
                val = i <= 6 ? data.PR_1 : data.PR_2;
            } else {
                // استنتاج مفتاح العمود البرمجي (HW, QZ, read, etc)
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
                label: 'معدل الأداء الأسبوعي',
                data: averages,
                borderColor: '#1a73e8',
                backgroundColor: 'rgba(26, 115, 232, 0.1)',
                fill: true,
                tension: 0.4,
                pointRadius: 5,
                pointBackgroundColor: '#1a73e8'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: { 
                y: { max: 5, min: 0, ticks: { stepSize: 1 } } 
            },
            plugins: { legend: { display: false } }
        }
    });
}

function generateSmartFeedback(components) {
    const avg = components.reduce((a, b) => a + (parseFloat(b.val) || 0), 0) / components.length;
    const feedbackText = document.getElementById('feedbackText');
    
    if (avg >= 4.5) {
        feedbackText.innerHTML = "<strong>مستوى مذهل!</strong> أنت تسير على طريق التميز، استمر في هذا الأداء القوي.";
    } else if (avg >= 3.5) {
        feedbackText.innerHTML = "<strong>أداء جيد جداً!</strong> لديك مهارات رائعة، قليل من التركيز في المهام القادمة وسوف تصل للدرجة الكاملة.";
    } else {
        feedbackText.innerHTML = "<strong>تحتاج لمزيد من الاجتهاد!</strong> ننصحك بمراجعة دروس هذا الأسبوع والتواصل مع المعلم لرفع مستواك.";
    }
}

function showNoData() {
    if(document.getElementById('dataContainer')) document.getElementById('dataContainer').style.display = 'none';
    if(document.getElementById('noDataMessage')) document.getElementById('noDataMessage').style.display = 'block';
}

function hideNoData() {
    if(document.getElementById('dataContainer')) document.getElementById('dataContainer').style.display = 'block';
    if(document.getElementById('noDataMessage')) document.getElementById('noDataMessage').style.display = 'none';
}

function setupNavigation() {
    const logoutBtn = document.getElementById('logoutBtn');
    if(logoutBtn) logoutBtn.onclick = () => {
        localStorage.clear();
        window.location.href = 'index.html';
    };
}
