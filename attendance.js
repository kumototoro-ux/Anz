import { getAttendance } from "./api.js"; // مسار مباشر

document.addEventListener("DOMContentLoaded", async () => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (!user) { window.location.href = "../login/login.html"; return; }

    const tbody = document.getElementById("attendanceBody");
    const result = await getAttendance(user.ID);

    if (result && result.found) {
        const attendanceData = result.data; // البيانات من ورقة AB
        let weeksArray = [];

        // 1. تحويل البيانات لمصفوفة لسهولة الحساب (من الأسبوع 1 إلى 14)
        for (let i = 1; i <= 14; i++) {
            let attended = parseInt(attendanceData[i]) || 0;
            let absent = 15 - attended;
            weeksArray.push({ week: i, attended, absent });
        }

        // 2. العمليات الحسابية
        let totalAbsent = 0;
        let best = weeksArray[0];
        let worst = weeksArray[0];

        weeksArray.forEach(item => {
            totalAbsent += item.absent;
            if (item.attended > best.attended) best = item;
            if (item.attended < worst.attended) worst = item;

            // بناء صفوف الجدول
            const row = `
                <tr>
                    <td>الأسبوع ${item.week}</td>
                    <td><span class="count">${item.attended}</span> / 15</td>
                    <td class="absent-cell">${item.absent}</td>
                    <td>${getStatusBadge(item.attended)}</td>
                </tr>
            `;
            tbody.innerHTML += row;
        });

        // 3. عرض الإحصائيات في الكروت
        document.getElementById("bestWeek").textContent = `الأسبوع ${best.week} (${best.attended} حصة)`;
        document.getElementById("worstWeek").textContent = `الأسبوع ${worst.week} (${worst.attended} حصة)`;
        document.getElementById("totalAbsent").textContent = `${totalAbsent} حصة`;
    }
});

function getStatusBadge(attended) {
    if (attended >= 13) return '<span class="badge excelent">ممتاز</span>';
    if (attended >= 10) return '<span class="badge good">جيد</span>';
    return '<span class="badge warning">ضعيف</span>';
}
