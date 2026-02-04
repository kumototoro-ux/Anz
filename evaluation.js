import { getSubjectGrades } from "../../shared/api.js";

let myChart = null;

document.addEventListener("DOMContentLoaded", () => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (!user) { window.location.href = "../login/login.html"; return; }

    const dropdown = document.getElementById("subjectDropdown");

    // 1. فلترة مادة التفكير الناقد (فقط لثالث متوسط)
    if (user.Class === "الثالث متوسط") {
        const option = document.createElement("option");
        option.value = "Critical";
        option.text = "التفكير الناقد";
        dropdown.add(option);
    }

    dropdown.addEventListener("change", async (e) => {
        const subject = e.target.value;
        if (!subject) return;

        const result = await getSubjectGrades(subject, user.ID);
        if (result.found) {
            processAndDisplayData(subject, result.data);
        }
    });
});

function processAndDisplayData(subject, data) {
    document.getElementById("evaluationContent").classList.remove("hidden");
    
    let weeks = [1, 2, 3, 4, 5, 6]; // الأسابيع الحالية
    let homeworks = [];
    let quizzes = [];
    let labels = weeks.map(w => `أسبوع ${w}`);

    weeks.forEach(w => {
        // جمع الواجبات والاختبارات (تجاهل القيم الفارغة أو غير المدخلة)
        let hw = parseFloat(data[`HW_${w}`]);
        let qz = subject === "Quran" ? parseFloat(data[`save_${w}`]) : parseFloat(data[`QZ_${w}`]);
        
        homeworks.push(!isNaN(hw) ? hw : 0);
        quizzes.push(!isNaN(qz) ? qz : 0);
    });

    renderChart(labels, homeworks, quizzes, subject === "Quran" ? "درجات الحفظ" : "درجات الاختبارات");
    updateStats(homeworks, quizzes);
}

function renderChart(labels, hwData, qzData, qzLabel) {
    const ctx = document.getElementById('weeklyChart').getContext('2d');
    if (myChart) myChart.destroy(); // حذف الرسم القديم قبل رسم جديد

    myChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'الواجبات',
                    data: hwData,
                    borderColor: '#1a5d1a',
                    backgroundColor: 'rgba(26, 93, 26, 0.1)',
                    fill: true,
                    tension: 0.4
                },
                {
                    label: qzLabel,
                    data: qzData,
                    borderColor: '#f39c12',
                    backgroundColor: 'rgba(243, 156, 18, 0.1)',
                    fill: true,
                    tension: 0.4
                }
            ]
        },
        options: {
            responsive: true,
            plugins: { legend: { position: 'top' } },
            scales: { y: { min: 0, max: 5 } }
        }
    });
}

function updateStats(hw, qz) {
    const total = [...hw, ...qz];
    const avg = total.reduce((a, b) => a + b, 0) / total.length;
    document.getElementById("avgGrade").textContent = avg.toFixed(1);
    
    const maxVal = Math.max(...total);
    document.getElementById("bestWeek").textContent = maxVal > 0 ? `درجة ${maxVal}` : "لا يوجد";
}
