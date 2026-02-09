import { getStudentData } from "./api.js";

let comparisonChart;

document.addEventListener("DOMContentLoaded", async () => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (!user) return window.location.href = "index.html";

    // تفعيل خيار التفكير الناقد للثالث متوسط فقط
    if(user.StudentLevel && user.StudentLevel.includes("الثالث متوسط")) {
        document.getElementById('criticalOption').style.display = 'block';
    }

    initWeekSelector();
    setupEventListeners();
    
    // التحميل الأولي
    loadData();
});

function initWeekSelector() {
    const ws = document.getElementById("weekSelect");
    for(let i=1; i<=12; i++) {
        ws.innerHTML += `<option value="${i}">الأسبوع ${i}</option>`;
    }
}

function setupEventListeners() {
    document.getElementById("subjectSelect").addEventListener("change", loadData);
    document.getElementById("weekSelect").addEventListener("change", loadData);
}

async function loadData() {
    const user = JSON.parse(localStorage.getItem("user"));
    const subject = document.getElementById("subjectSelect").value;
    const week = parseInt(document.getElementById("weekSelect").value);
    
    const res = await getStudentData(subject, user.id);
    
    if (res.success && res.data) {
        processAndDisplay(res.data, week, subject);
    } else {
        showNoData();
    }
}

function processAndDisplay(data, week, subject) {
    let components = [];
    const pr = week <= 6 ? (data.PR_1 || 0) : (data.PR_2 || 0);

    // تقسيم البيانات بناءً على نوع المادة
    if (subject === 'Quran') {
        components = [
            { label: "المشاركة", val: pr, key: 'PR' },
            { label: "واجبات ومهام", val: data[`HW_${week}`], key: 'HW' },
            { label: "قراءة القرآن", val: data[`read_${week}`], key: 'read' },
            { label: "تجويد القرآن", val: data[`Taj_${week}`], key: 'Taj' },
            { label: "حفظ القرآن", val: data[`save_${week}`], key: 'save' }
        ];
    } else {
        components = [
            { label: "المشاركة", val: pr, key: 'PR' },
            { label: "واجبات ومهام", val: data[`HW_${week}`], key: 'HW' },
            { label: "اختبار قصير", val: data[`QZ_${week}`], key: 'QZ' }
        ];
    }

    // التحقق هل الأسبوع الحالي فيه درجات فعلاً؟
    const hasData = components.some(c => c.val !== null && c.val !== undefined);
    
    if (!hasData) {
        showNoData();
        return;
    }

    hideNoData();
    renderProgressBars(components);
    renderComparisonChart(data, week, components);
    generateSmartFeedback(components, data, week);
}

function renderProgressBars(components) {
    const container = document.getElementById('progressBarsContainer');
    container.innerHTML = '';
    
    components.forEach(comp => {
        const value = comp.val || 0;
        const percent = (value / 5) * 100;
        const colorClass = percent >= 80 ? 'high' : percent >= 50 ? 'med' : 'low';

        container.innerHTML += `
            <div class="progress-item">
                <div class="progress-info">
                    <span>${comp.label}</span>
                    <strong>${value} / 5</strong>
                </div>
                <div class="progress-track">
                    <div class="progress-fill ${colorClass}" style="width: ${percent}%"></div>
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
    document.getElementById('scoresDisplayCard').style.display = 'none';
    document.getElementById('analysisCard').style.display = 'none';
    document.getElementById('noDataMessage').style.display = 'block';
}

function hideNoData() {
    document.getElementById('scoresDisplayCard').style.display = 'block';
    document.getElementById('analysisCard').style.display = 'flex';
    document.getElementById('noDataMessage').style.display = 'none';
}
