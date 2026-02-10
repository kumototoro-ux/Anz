import { getStudentData } from "./api.js";

document.addEventListener("DOMContentLoaded", async () => {
    // 1. التحقق من الدخول
    const user = JSON.parse(localStorage.getItem("user"));
    if (!user) { window.location.href = "index.html"; return; }

    // 2. تحميل القائمة الجانبية فوراً (كما في الصفحات السابقة)
    await loadSidebar();

    // 3. عرض ترحيب الطالب
    document.getElementById("userGreeting").innerText = `مرحباً، ${user.Name_AR || 'الطالب'}`;

    // 4. ربط أزرار الفصول
    const buttons = document.querySelectorAll(".term-btn");
    buttons.forEach(btn => {
        btn.addEventListener("click", () => fetchResults(btn.getAttribute("data-term"), user.ID));
    });
});

// دالة تحميل القائمة وتفعيل زر الخروج
async function loadSidebar() {
    try {
        const response = await fetch('sidebar.html');
        const html = await response.text();
        document.getElementById('sidebar-placeholder').innerHTML = html;

        const menuToggle = document.getElementById('menuToggle');
        const sideNav = document.getElementById('sideNav');
        const overlay = document.getElementById('sidebarOverlay');
        const logoutBtn = document.getElementById('logoutBtn');

        if (menuToggle && sideNav) {
            menuToggle.onclick = () => {
                sideNav.classList.toggle('active');
                if (overlay) overlay.classList.toggle('active');
            };
        }

        if (logoutBtn) {
            logoutBtn.onclick = () => {
                localStorage.clear();
                window.location.href = 'index.html';
            };
        }
    } catch (err) {
        console.error("خطأ في القائمة:", err);
    }
}

// دالة جلب البيانات (النتائج)
async function fetchResults(tableName, studentId) {
    document.getElementById("certificateArea").classList.add("hide");
    const res = await getStudentData(tableName, studentId);
    if (res.success && res.data) {
        showCertificate(res.data);
    }
}

function showCertificate(data) {
    const tbody = document.getElementById("resultsBody");
    tbody.innerHTML = "";
    Object.entries(data).forEach(([key, value]) => {
        const exclude = ["id", "student_id", "created_at", "ID"];
        if (!exclude.includes(key)) {
            tbody.innerHTML += `<tr><td>${key}</td><td>${value || '---'}</td></tr>`;
        }
    });
    document.getElementById("certificateArea").classList.remove("hide");
}
