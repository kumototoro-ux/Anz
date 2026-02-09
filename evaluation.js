import { getStudentData } from "./api.js";

let comparisonChart;

document.addEventListener("DOMContentLoaded", async () => {
    // 1. التحقق من الهوية (الربط الأساسي)
    const user = JSON.parse(localStorage.getItem("user"));
    if (!user || !user.ID) { // تأكدنا أن ID مطابقة لما في قاعدة البيانات
        window.location.href = "index.html";
        return;
    }

    // تفعيل القائمة الجانبية للجوال
    setupNavigation();

    // إظهار التفكير الناقد لطلاب ثالث متوسط فقط
    if (user.StudentLevel && user.StudentLevel.includes("ثالث متوسط")) {
        document.getElementById('criticalOption').style.display = 'block';
    }

    initWeekSelector();
    
    // تشغيل الجلب التلقائي عند تغيير الاختيارات
    document.getElementById("subjectSelect").onchange = loadData;
    document.getElementById("weekSelect").onchange = loadData;

    // تحميل أول مادة تلقائياً
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

    // الربط الفعلي: نرسل (اسم الجدول المادة، ID الطالب)
    const res = await getStudentData(subject, user.ID); 

    if (res.success && res.data) {
        processAndDisplay(res.data, week, subject);
    } else {
        showNoData();
    }
}

function processAndDisplay(data, week, subject) {
    let components = [];
    // جلب درجة المشاركة بناءً على الأسبوع (PR1 للفترة الأولى، PR2 للثانية)
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

    // التحقق الفعلي من وجود بيانات (ليست فارغة وليست صفر)
    const hasValues = components.some(c => c.val !== null && c.val !== undefined && c.val !== "");

    if (!hasValues) {
        showNoData();
        return;
    }

    hideNoData();
    renderBars(components);
    renderChart(data, week, subject);
}

function renderBars(components) {
    const container = document.getElementById('progressBarsContainer');
    container.innerHTML = '';
    
    components.forEach(comp => {
        const val = parseFloat(comp.val) || 0;
        const percent = (val / 5) * 100;
        let color = "#ea4335"; // أحمر
        if(percent >= 80) color = "#34a853"; // أخضر
        else if(percent >= 50) color = "#fbbc05"; // أصفر

        container.innerHTML += `
            <div style="margin-bottom:20px">
                <div style="display:flex; justify-content:space-between; margin-bottom:5px; font-weight:bold">
                    <span>${comp.label}</span>
                    <span>${val} / 5</span>
                </div>
                <div style="height:10px; background:#eee; border-radius:5px; overflow:hidden">
                    <div style="width:${percent}%; height:100%; background:${color}; transition: width 0.5s"></div>
                </div>
            </div>
        `;
    });
}

function renderComparisonChart(data, currentWeek, components) {
    const ctx = document.getElementById('comparisonChart').getContext('2d');
    if (comparisonChart) comparisonChart.destroy();

    // حساب متوسط كل أسبوع سابق للمقارنة
    const labels = [];
    const averages = [];

    for (let i = 1; i <= currentWeek; i++) {
        labels.push(`أسبوع ${i}`);
        let sum = 0, count = 0;
        
        components.forEach(c => {
            const val = (c.key === 'PR') ? (i <= 6 ? data.PR_1 : data.PR_2) : data[`${c.key}_${i}`];
            if (val != null) { sum += val; count++; }
        });
        averages.push(count > 0 ? (sum / count).toFixed(2) : 0);
    }

    comparisonChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'متوسط الأداء الأسبوعي',
                data: averages,
                borderColor: '#1a73e8',
                backgroundColor: 'rgba(26, 115, 232, 0.1)',
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            scales: { y: { max: 5, min: 0 } },
            plugins: { legend: { display: false } }
        }
    });
}

function generateSmartFeedback(components, data, week) {
    const avg = components.reduce((a, b) => a + (b.val || 0), 0) / components.length;
    let msg = "";
    
    if (avg >= 4.5) msg = "أداء استثنائي! أنت تسيطر على المادة بالكامل. حافظ على هذا المستوى المبهر.";
    else if (avg >= 3.5) msg = "مستوى جيد جداً، لديك بعض النقاط البسيطة لتصل للكمال. ركز على المهام القادمة.";
    else msg = "تحتاج لبذل جهد إضافي. مراجعة دروسك لهذا الأسبوع ستصنع فرقاً كبيراً في تقييمك القادم.";

    document.getElementById('feedbackText').innerText = msg;
}

function showNoData() {
    document.getElementById('dataContainer').style.display = 'none';
    document.getElementById('noDataMessage').style.display = 'block';
}

function hideNoData() {
    document.getElementById('dataContainer').style.display = 'block';
    document.getElementById('noDataMessage').style.display = 'none';
}

function setupNavigation() {
    const logoutBtn = document.getElementById('logoutBtn');
    if(logoutBtn) logoutBtn.onclick = () => {
        localStorage.clear();
        window.location.href = 'index.html';
    };
}
