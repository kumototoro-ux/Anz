import { getStudentData } from './api.js';

let abData = null; // لتخزين بيانات جدول AB
const MAX_PER_WEEK = 15;

async function loadAttendance() {
    const user = JSON.parse(localStorage.getItem("user"));
    if (!user) return;

    // جلب البيانات من جدول AB بناءً على رقم الطالب
    const response = await getStudentData('AB', user.ID);
    
    if (response.success) {
        abData = response.data;
        processAnalytics(abData);
        setupWeekSelector(abData);
    }
}

function processAnalytics(data) {
    let labels = [];
    let values = [];
    let totalAbsent = 0;

    // المرور على الأعمدة من 1 إلى 14
    for (let i = 1; i <= 14; i++) {
        let val = data[i]; 
        // الشرط الذكي: إذا كان العمود ليس فارغاً (يوجد درجة)
        if (val !== null && val !== undefined && val !== "") {
            let presentCount = parseInt(val);
            labels.push(`أسبوع ${i}`);
            values.push(presentCount);
            
            // حساب الغياب (15 - الحضور)
            totalAbsent += (MAX_PER_WEEK - presentCount);
        }
    }

    renderChart(labels, values);
    displaySmartMessage(totalAbsent);
}

function displaySmartMessage(total) {
    const box = document.getElementById('smart-alert');
    let title = "حالة الانضباط";
    let msg = "";
    let styleClass = "bg-white text-dark";
    let link = "";

    if (total >= 80) {
        title = "❌ القائمة السوداء";
        msg = "تم تحويلك للانتساب للمراجعة تواصل مع المشرف العام.";
        styleClass = "black-list-alert";
        link = "https://wa.me/966XXXXXXXXX"; // ضع رقم الواتس هنا
    } else if (total >= 40) {
        title = "⚠️ إنذار ثالث";
        msg = "تجاوزت 40 حصة غياب، تواصل مع المشرف العام فوراً.";
        styleClass = "bg-danger text-white";
        link = "https://wa.me/966XXXXXXXXX";
    } else if (total >= 30) {
        title = "🚨 إنذار ثانٍ";
        msg = "تنبيه قوي: غيابك زاد عن 30 حصة! سيتم استدعاء ولي أمرك.";
        styleClass = "bg-warning text-dark";
    } else if (total >= 20) {
        title = "🔔 تنبيه أول";
        msg = "غيابك وصل لـ 20 حصة، يرجى الالتزام بالحضور.";
        styleClass = "bg-info text-white";
    } else {
        msg = "مستواك في الحضور متميز جداً، استمر!";
        styleClass = "bg-success text-white";
    }

    box.className = `alert-box rounded-4 p-4 text-center ${styleClass}`;
    box.innerHTML = `
        <h4 class="fw-bold">${title}</h4>
        <p>إجمالي غيابك: ${total} حصة</p>
        <hr>
        <p class="small">${msg}</p>
        ${link ? `<a href="${link}" class="btn-whatsapp mt-2">واتساب المشرف العام</a>` : ""}
    `;
}

function renderChart(labels, values) {
    const ctx = document.getElementById('attendanceChart');
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'عدد حصص الحضور',
                data: values,
                borderColor: '#4e73df',
                backgroundColor: 'rgba(78, 115, 223, 0.1)',
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: { y: { min: 0, max: 15 } }
        }
    });
}

function setupWeekSelector(data) {
    const select = document.getElementById('weekSelector');
    for (let i = 1; i <= 14; i++) {
        if (data[i] !== null && data[i] !== "") {
            let opt = document.createElement('option');
            opt.value = i;
            opt.textContent = `الأسبوع ${i}`;
            select.appendChild(opt);
        }
    }

    select.addEventListener('change', (e) => {
        const val = e.target.value;
        const view = document.getElementById('week-detail-view');
        if (val) {
            const present = parseInt(data[val]);
            document.getElementById('week-present').textContent = present;
            document.getElementById('week-absent').textContent = MAX_PER_WEEK - present;
            view.classList.remove('d-none');
        } else {
            view.classList.add('d-none');
        }
    });
}

document.addEventListener('DOMContentLoaded', loadAttendance);
