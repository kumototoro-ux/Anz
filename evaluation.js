import { getSubjectGrades } from "./api.js"; // مسار مباشر - صحيح

let myChart = null;

document.addEventListener("DOMContentLoaded", () => {
    const user = JSON.parse(localStorage.getItem("user"));
    
    // ⚠️ تصحيح المسار (نظام المجلد الواحد)
    if (!user) { 
        window.location.href = "login.html"; 
        return; 
    }

    const dropdown = document.getElementById("subjectDropdown");

    // 1. فلترة مادة التفكير الناقد (فقط لثالث متوسط)
    // تأكد أن الاسم في الشيت مطابق لـ "الثالث متوسط"
    if (user.Class === "الثالث متوسط") {
        const option = document.createElement("option");
        option.value = "Critical";
        option.text = "التفكير الناقد";
        dropdown.add(option);
    }

    dropdown.addEventListener("change", async (e) => {
        const subject = e.target.value;
        if (!subject) {
            document.getElementById("evaluationContent").classList.add("hidden");
            return;
        }

        const result = await getSubjectGrades(subject, user.ID);
        if (result.found) {
            processAndDisplayData(subject, result.data);
        } else {
            alert("لم يتم العثور على درجات لهذه المادة");
        }
    });
});

function processAndDisplayData(subject, data) {
    document.getElementById("evaluationContent").classList.remove("hidden");
    
    let weeks = [1, 2, 3, 4, 5, 6]; 
    let homeworks = [];
    let quizzes = [];
    let labels = weeks.map(w => `الأسبوع ${w}`);

    weeks.forEach(w => {
        // الربط مع مسميات الأعمدة في قوقل شيت (مثال: HW_1, QZ_1)
        let hw = parseFloat(data[`HW_${w}`]);
        let qz = (subject === "Quran") ? parseFloat(data[`save_${w}`]) : parseFloat(data[`QZ_${w}`]);
        
        homeworks.push(!isNaN(hw) ? hw : 0);
        quizzes.push(!isNaN(qz) ? qz : 0);
    });

    renderChart(labels, homeworks, quizzes, subject === "Quran" ? "درجات الحفظ" : "درجات الاختبارات");
    updateStats(homeworks, quizzes);
}

function renderChart(labels, hwData, qzData, qzLabel) {
    const ctx = document.getElementById('weeklyChart').getContext('2d');
    if (myChart) myChart.destroy(); 

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
            maintainAspectRatio: false, // مضاف لتحسين العرض في الجوال
            plugins: { legend: { position: 'top' } },
            scales: { y: { min: 0, max: 5 } }
        }
    });
}

function updateStats(hw, qz) {
    const total = [...hw, ...qz].filter(v => v > 0); // نحسب المتوسط فقط للدرجات المدخلة فعلياً
    const avg = total.length > 0 ? (total.reduce((a, b) => a + b, 0) / total.length) : 0;
    document.getElementById("avgGrade").textContent = avg.toFixed(1);
    
    const maxVal = Math.max(...(total.length > 0 ? total : [0]));
    document.getElementById("bestWeek").textContent = maxVal > 0 ? `درجة ${maxVal}` : "لا يوجد";
}
