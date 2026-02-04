import { getStudentData } from "./api.js";

document.addEventListener("DOMContentLoaded", async () => {
    const user = JSON.parse(localStorage.getItem("user"));
    const res = await getStudentData('attendance', user.id);

    if (res.success) {
        const data = res.data;
        const weeksData = [];
        const labels = [];

        // معالجة البيانات: لدينا 12 أسبوعاً، كل أسبوع من 15 حصة
        let lastRatedWeek = 0;
        
        for (let i = 1; i <= 12; i++) {
            let val = data[`week_${i}`];
            if (val !== null && val !== undefined && val !== "") {
                weeksData.push(val);
                labels.push(`الأسبوع ${i}`);
                lastRatedWeek = i;
            }
        }

        renderMainChart(labels, weeksData);
        renderLastWeekCard(lastRatedWeek, data[`week_${lastRatedWeek}`]);
        updateTotalSummary(weeksData);
    }
});

function renderMainChart(labels, data) {
    const ctx = document.getElementById('attendanceLineChart').getContext('2d');
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'عدد حصص الحضور',
                data: data,
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
                y: { max: 15, min: 0, ticks: { stepSize: 3 } }
            },
            plugins: { legend: { display: false } }
        }
    });
}

function renderLastWeekCard(weekNum, value) {
    document.getElementById("lastWeekLabel").innerText = `الأسبوع ${weekNum}`;
    const attendanceCount = parseInt(value);
    const absentCount = 15 - attendanceCount;
    const percent = Math.round((attendanceCount / 15) * 100);

    document.getElementById("attendancePercent").innerText = `${percent}%`;
    document.getElementById("presentHolidays").innerText = attendanceCount;
    document.getElementById("absentHolidays").innerText = absentCount;

    // تحديث الدائرة الملونة
    const circle = document.getElementById("progressCircle");
    circle.style.background = `conic-gradient(#34a853 ${percent}%, #f1f3f4 0%)`;
}

function updateTotalSummary(data) {
    const totalPossible = data.length * 15;
    const totalAttended = data.reduce((a, b) => a + parseInt(b), 0);
    const totalPercent = Math.round((totalAttended / totalPossible) * 100);

    let msg = "";
    if (totalPercent >= 95) msg = "ممتاز! حضورك مثالي ونفخر بانضباطك.";
    else if (totalPercent >= 85) msg = "جيد جداً، واصل الالتزام بالحضور لضمان الفهم الكامل للمواد.";
    else msg = "انتبه! نسبة غيابك بدأت تؤثر على مستواك، ننصحك بالالتزام أكثر.";

    document.getElementById("totalSummaryText").innerHTML = `
        <div class="motivation-box">
            <strong>نسبة الانضباط التراكمية: ${totalPercent}%</strong>
            <p>${msg}</p>
        </div>
    `;
}
