import { getStudentData } from "./api.js";

document.addEventListener("DOMContentLoaded", async () => {
    // 1. الأمان: إذا لم يسجل دخول يرجعه للرئيسية
    const user = JSON.parse(localStorage.getItem("user"));
    if (!user) {
        window.location.href = "index.html";
        return;
    }

    // 2. تحميل القائمة الجانبية (هذا الجزء هو الأهم)
    await loadSidebar();

    // 3. عرض اسم الطالب
    document.getElementById("userGreeting").innerText = `مرحباً، ${user.Name_AR || 'الطالب'}`;

    // 4. ربط أزرار الفصول الدراسية
    const buttons = document.querySelectorAll(".term-btn");
    buttons.forEach(btn => {
        btn.addEventListener("click", () => fetchResults(btn.getAttribute("data-term"), user.ID));
    });
});

// دالة تحميل القائمة وتفعيل زر تسجيل الخروج
async function loadSidebar() {
    try {
        const response = await fetch('sidebar.html');
        const html = await response.text();
        document.getElementById('sidebar-placeholder').innerHTML = html;

        const menuToggle = document.getElementById('menuToggle');
        const sideNav = document.getElementById('sideNav');
        const overlay = document.getElementById('sidebarOverlay');
        const logoutBtn = document.getElementById('logoutBtn');

        // تفعيل فتح وإغلاق القائمة للجوال
        if (menuToggle && sideNav && overlay) {
            menuToggle.onclick = () => {
                sideNav.classList.toggle('active');
                overlay.classList.toggle('active');
            };
            overlay.onclick = () => {
                sideNav.classList.remove('active');
                overlay.classList.remove('active');
            };
        }

        // تفعيل زر تسجيل الخروج
        if (logoutBtn) {
            logoutBtn.onclick = () => {
                localStorage.clear();
                window.location.href = 'index.html';
            };
        }
    } catch (err) {
        console.error("خطأ في تحميل القائمة الجانبية:", err);
    }
}

// دالة جلب النتائج (كما هي في كودك)
async function fetchResults(tableName, studentId) {
    document.getElementById("certificateArea").classList.add("hide");
    document.getElementById("errorArea").classList.add("hide");

    const res = await getStudentData(tableName, studentId);
    if (res.success && res.data) {
        showCertificate(res.data, tableName);
    } else {
        document.getElementById("errorArea").classList.remove("hide");
    }
}

function showCertificate(data, term) {
    const tbody = document.getElementById("resultsBody");
    tbody.innerHTML = "";
    document.getElementById("certTermName").innerText = (term === "notice_term1") ? "الفصل الدراسي الأول" : "الفصل الدراسي الثاني";

    let total = 0, count = 0;
    Object.entries(data).forEach(([key, value]) => {
        const exclude = ["id", "student_id", "created_at", "ID", "Student_ID"];
        if (!exclude.includes(key)) {
            tbody.innerHTML += `<tr><td>${key}</td><td>${value || '---'}</td></tr>`;
            if(value && !isNaN(value)) {
                total += parseFloat(value);
                count++;
            }
        }
    });

    document.getElementById("totalScore").innerText = total;
    document.getElementById("averageScore").innerText = count > 0 ? (total / count).toFixed(2) : "-";
    document.getElementById("certificateArea").classList.remove("hide");
}
