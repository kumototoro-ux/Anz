import { getStudentData } from "./api.js";

// خريطة ترجمة المواد
const subjectsMap = {
    'Quran': { ar: 'القرآن الكريم', en: 'Holy Quran' },
    'Islamic': { ar: 'الدراسات الإسلامية', en: 'Islamic Studies' },
    'Arabic': { ar: 'اللغة العربية', en: 'Arabic Language' },
    'Social': { ar: 'الدراسات الاجتماعية', en: 'Social Studies' },
    'Math': { ar: 'الرياضيات', en: 'Mathematics' },
    'Science': { ar: 'العلوم', en: 'Science' },
    'English': { ar: 'اللغة الإنجليزية', en: 'English Language' },
    'Digital': { ar: 'المهارات الرقمية', en: 'Digital Skills' },
    'Art': { ar: 'التربية الفنية', en: 'Art Education' },
    'PE': { ar: 'التربية البدنية', en: 'Physical Education' },
    'Life': { ar: 'المهارات الحياتية', en: 'Life Skills' },
    'Critical': { ar: 'التفكير الناقد', en: 'Critical Thinking' }
};

document.addEventListener("DOMContentLoaded", async () => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (!user) { window.location.href = 'index.html'; return; }
    
    await loadSidebar(); // تحميل القائمة الجانبية
    document.getElementById("userGreeting").innerText = `مرحباً، ${user.Name_AR}`;

    // ربط أزرار الفصول
    document.querySelectorAll(".term-btn").forEach(btn => {
        btn.onclick = () => fetchAndDisplayResults(btn.dataset.term, user);
    });
});

async function fetchAndDisplayResults(tableName, user) {
    const res = await getStudentData(tableName, user.ID);
    
    if (res.success && res.data) {
        renderCertificate(res.data, user.Class, tableName);
    } else {
        alert("عذراً، لم يتم العثور على بيانات لهذا الفصل.");
    }
}

// دالة تحديد التقدير
function getGrade(score) {
    if (score >= 90) return { ar: 'ممتاز', en: 'Excellent' };
    if (score >= 80) return { ar: 'جيد جداً', en: 'Very Good' };
    if (score >= 70) return { ar: 'جيد', en: 'Good' };
    if (score >= 60) return { ar: 'مقبول', en: 'Pass' };
    return { ar: 'ضعيف', en: 'Weak' };
}

function renderCertificate(data, studentClass, tableName) {
    const tbody = document.getElementById("resultsBody");
    tbody.innerHTML = "";
    
    let totalSum = 0;
    let subjectsCount = 0;

    // معالجة البيانات: تجميع درجات كل مادة
    const subjectsList = Object.keys(subjectsMap);

    subjectsList.forEach(sub => {
        // شرط التفكير الناقد: لا يظهر إلا للثالث متوسط
        if (sub === 'Critical' && (!studentClass || !studentClass.includes("الثالث متوسط"))) return;

        let subTotal = 0;
        let details = [];

        // البحث عن الدرجات في الأعمدة (CW, Written, Short, Final, Oral)
        const types = [
            { key: 'CW', ar: 'أدوات تقييم', en: 'Assessment' },
            { key: 'Written', ar: 'تحريري', en: 'Written' },
            { key: 'Short', ar: 'قصير', en: 'Short' },
            { key: 'Final', ar: 'نهائي', en: 'Final' },
            { key: 'Oral', ar: 'شفهي', en: 'Oral' }
        ];

        types.forEach(t => {
            const colName = `${sub}_${t.key}`;
            if (data[colName] !== undefined && data[colName] !== null) {
                const val = parseFloat(data[colName]) || 0;
                subTotal += val;
                details.push(`${t.ar}: ${val}`);
            }
        });

        if (details.length > 0) {
            const grade = getGrade(subTotal);
            tbody.innerHTML += `
                <tr>
                    <td>
                        <strong>${subjectsMap[sub].ar}</strong><br>
                        <small>${subjectsMap[sub].en}</small>
                    </td>
                    <td><small>${details.join(' | ')}</small></td>
                    <td style="text-align:center;"><strong>${subTotal}</strong></td>
                    <td style="text-align:center;">
                        ${grade.ar}<br><small>${grade.en}</small>
                    </td>
                </tr>
            `;
            totalSum += subTotal;
            subjectsCount++;
        }
    });

    // تحديث البيانات العامة
    document.getElementById("certTermName").innerText = tableName === "Notice_Term1" ? "إشعار درجات الفصل الدراسي الأول" : "إشعار درجات الفصل الدراسي الثاني";
    document.getElementById("totalScore").innerText = totalSum;
    document.getElementById("averageScore").innerText = subjectsCount > 0 ? (totalSum / subjectsCount).toFixed(2) : "0";
    
    // المواظبة والسلوك
    document.getElementById("attVal").innerText = data.Attendance || "---";
    document.getElementById("behVal").innerText = data.Behavior || "---";

    // إظهار منطقة الشهادة
    document.getElementById("certificateArea").classList.remove("hide");
}

// دالة القائمة الجانبية (تأكد من وجودها)
async function loadSidebar() {
    try {
        const response = await fetch('sidebar.html');
        const html = await response.text();
        document.getElementById('sidebar-placeholder').innerHTML = html;
        const menuToggle = document.getElementById('menuToggle');
        const sideNav = document.getElementById('sideNav');
        const overlay = document.getElementById('sidebarOverlay');
        if (menuToggle && sideNav) {
            menuToggle.onclick = () => { sideNav.classList.toggle('active'); overlay.classList.toggle('active'); };
            overlay.onclick = () => { sideNav.classList.remove('active'); overlay.classList.remove('active'); };
        }
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) logoutBtn.onclick = () => { localStorage.clear(); window.location.href = 'index.html'; };
    } catch (err) { console.error(err); }
}
