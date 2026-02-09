import { getStudentData } from './api.js';

let attendanceData = null;
const MAX_SESSIONS = 15; // عدد الحصص الكلي في الأسبوع

async function initAttendance() {
    const user = JSON.parse(localStorage.getItem("user"));
    if (!user) return;

    const result = await getStudentData('AB', user.ID);
    if (result.success) {
        attendanceData = result.data;
        processData(attendanceData);
        populateWeeks(attendanceData);
    }
}

function processData(data) {
    let totalAbsent = 0;
    let weeksCount = 0;
    let chartLabels = [];
    let chartValues = [];

    // تحليل الأسابيع من 1 إلى 14
    for (let i = 1; i <= 14; i++) {
        let val = data[i]; // قيمة العمود (رقم الأسبوع)
        if (val !== null && val !== undefined && val !== "") {
            let present = parseInt(val);
            let absent = MAX_SESSIONS - present;
            totalAbsent += absent;
            weeksCount++;
            
            chartLabels.push(`أسبوع ${i}`);
            chartValues.push(present);
        }
    }

    renderChart(chartLabels, chartValues);
    generateSmartAlert(totalAbsent);
}

function generateSmartAlert(totalAbsent) {
    const alertBox = document.getElementById('smart-alert');
    let message = "";
    let statusClass = "bg-light text-dark";
    let showWhatsApp = false;

    if (totalAbsent >= 80) {
        message = "⚠️ تم وضع اسمك في القائمة السوداء! سيتم نقلك لقسم الانتساب. تواصل فوراً مع المشرف العام.";
        statusClass = "bg-dark text-white";
        showWhatsApp = true;
    } else if (totalAbsent >= 40) {
        message = "🚨 إنذار نهائي: غيابك تجاوز 40 حصة. تواصل مع المشرف العام فوراً لتفادي الإجراءات الصارمة.";
        statusClass = "bg-danger text-white";
        showWhatsApp = true;
    } else if (totalAbsent >= 30) {
        message = "📢 تنبيه قوي: غيابك تجاوز 30 حصة! هذا المستوى يهدد استمرارك في القسم الأونلاين.";
        statusClass = "bg-warning text-dark";
    } else if (totalAbsent >= 20) {
        message = "⚠️ تنبيه: غيابك تجاوز 20 حصة. يرجى الالتزام بالحضور لتحسين مستواك.";
        statusClass = "bg-info text-dark";
    } else {
        message = "✅ مستواك في الحضور ممتاز. استمر على هذا الانضباط!";
        statusClass = "bg-success text-white";
    }

    alertBox.className = `alert-box p-4 rounded-3 text-center ${statusClass}`;
    alertBox.innerHTML = `
        <h6 class="fw-bold">إجمالي الغياب: ${totalAbsent} حصة</h6>
        <p class="small">${message}</p>
        ${showWhatsApp ? `<a href="https://wa.me/966XXXXXXXXX" class="btn btn-light btn-sm mt-2 fw-bold">تواصل مع المشرف واتساب</a>` : ''}
    `;
}

// دالة التمثيل البياني باستخدام Chart.js
function renderChart(labels, values) {
    const ctx = document.getElementById('attendanceChart').getContext('2d');
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'عدد حصص الحضور',
                data: values,
                borderColor: '#4e73df',
                tension: 0.3,
                fill: true,
                backgroundColor: 'rgba(78, 115, 223, 0.05)'
            }]
        },
        options: { responsive: true, maintainAspectRatio: false }
    });
}
