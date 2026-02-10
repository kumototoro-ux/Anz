import { getStudentData } from './api.js';

let studentAbData = null;
const WEEKLY_LIMIT = 15; // السقف الأعلى للحصص في الأسبوع

async function initializeAttendance() {
    const user = JSON.parse(localStorage.getItem("user"));
    if (!user) return;

    // جلب البيانات من جدول AB
    const response = await getStudentData('AB', user.ID);
    
    if (response.success) {
        studentAbData = response.data;
        processStats(studentAbData);
        fillWeekSelector(studentAbData);
    }
}

function processStats(data) {
    let weeksLabels = [];
    let presenceValues = [];
    let cumulativeAbsence = 0;

    // فحص الأعمدة من 1 إلى 14
    for (let i = 1; i <= 14; i++) {
        let val = data[i];
        // الذكاء: لا يدخل ضمن المقارنة إلا إذا وجد رقم (درجة)
        if (val !== null && val !== undefined && val !== "") {
            let present = parseInt(val);
            weeksLabels.push(`أسبوع ${i}`);
            presenceValues.push(present);
            
            // حساب الغياب التراكمي
            cumulativeAbsence += (WEEKLY_LIMIT - present);
        }
    }

    drawChart(weeksLabels, presenceValues);
    updateSmartUI(cumulativeAbsence);
}

function updateSmartUI(total) {
    const box = document.getElementById('smart-alert');
    let title = "الوضع الدراسي";
    let message = "";
    let className = "bg-white";
    let whatsappBtn = "";

    // منطق التنبيهات المتدرج الذي طلبته
    if (total >= 80) {
        title = "🛑 القائمة السوداء";
        message = "تم نقل اسمك لقسم الانتساب للمراجعة. تواصل مع المشرف العام فوراً.";
        className = "black-list-alert";
        whatsappBtn = `<a href="https://wa.me/966XXXXXXXXX" class="btn-whatsapp mt-3">تواصل مع المشرف العام</a>`;
    } else if (total >= 40) {
        title = "⚠️ تنبيه نهائي";
        message = "غيابك تجاوز 40 حصة. تواصل مع المشرف العام قبل اتخاذ إجراءات فصلك.";
        className = "bg-danger text-white";
        whatsappBtn = `<a href="https://wa.me/966XXXXXXXXX" class="btn-whatsapp mt-3">تواصل الآن</a>`;
    } else if (total >= 30) {
        title = "📢 إنذار قوي";
        message = "تجاوزت 30 حصة غياب! سيتم استدعاء ولي أمرك للمناقشة.";
        className = "bg-warning text-dark";
    } else if (total >= 20) {
        title = "🔔 تنبيه حضور";
        message = "غيابك وصل لـ 20 حصة. نأمل منك الالتزام بالحضور لتحسين مستواك.";
        className = "bg-info text-dark";
    } else {
        title = "✅ مستوى متميز";
        message = "حضورك وانضباطك يعكسان حرصك على النجاح. استمر!";
        className = "bg-success text-white";
    }

    box.className = `alert-box rounded-4 p-4 text-center ${className}`;
    box.innerHTML = `
        <h5 class="fw-bold">${title}</h5>
        <div class="display-6 fw-bold mb-2">${total}</div>
        <p class="small">إجمالي الحصص الغائبة</p>
        <hr>
        <p class="small mb-0">${message}</p>
        ${whatsappBtn}
    `;
}

function drawChart(labels, values) {
    const ctx = document.getElementById('attendanceChart').getContext('2d');
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'حصص الحضور',
                data: values,
                borderColor: '#4e73df',
                backgroundColor: 'rgba(78, 115, 223, 0.1)',
                borderWidth: 3,
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: { y: { min: 0, max: 15 } }
        }
    });
}

function fillWeekSelector(data) {
    const select = document.getElementById('weekSelector');
    for (let i = 1; i <= 14; i++) {
        if (data[i] !== null && data[i] !== "") {
            let opt = document.createElement('option');
            opt.value = i;
            opt.textContent = `الأسبوع ${i}`;
            select.appendChild(opt);
        }
    }

    select.onchange = (e) => {
        const val = e.target.value;
        const view = document.getElementById('week-detail-view');
        if (val) {
            const present = parseInt(data[val]);
            document.getElementById('week-present').innerText = present;
            document.getElementById('week-absent').innerText = WEEKLY_LIMIT - present;
            view.classList.remove('d-none');
        } else {
            view.classList.add('d-none');
        }
    };
}

document.addEventListener('DOMContentLoaded', initializeAttendance);
