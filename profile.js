import { getStudentData } from './api.js';

document.addEventListener("DOMContentLoaded", async () => {
    // 1. استرجاع بيانات المستخدم
    const user = JSON.parse(localStorage.getItem("user"));
    if (!user || !user.ID) {
        window.location.href = "index.html";
        return;
    }

    // 2. تفعيل القائمة الجانبية (هنا يتم الاستدعاء)
    await loadSidebar();

    // 3. طلب البيانات من api.js
    try {
        const response = await getStudentData('students', user.ID);

        if (response.success && response.data) {
            const sd = response.data;

            document.getElementById('nameAR').innerText = sd.Name_AR || 'لا يوجد اسم';
            document.getElementById('nameEN').innerText = sd.Name_EN || '';
            document.getElementById('userInitials').innerText = sd.Name_AR ? sd.Name_AR[0] : 'S';
            
            document.getElementById('val_ID').innerText = sd.ID;
            document.getElementById('val_BirthDate').innerText = sd.BirthDate || 'غير مسجل';
            document.getElementById('val_Nationality').innerText = sd.Nationality || 'غير مسجل';
            document.getElementById('val_Gender').innerText = (sd.Gender === 'Male' || sd.Gender === 'ذكر') ? 'ذكر' : 'أنثى';

            document.getElementById('val_StudentLevel').innerText = sd.StudentLevel || 'غير محدد';
            document.getElementById('val_Class').innerText = sd.Class || 'غير محدد';
            document.getElementById('val_Term').innerText = sd.Term || '---';
            document.getElementById('val_AcademicYear').innerText = sd.AcademicYear || '---';
            
            if(document.getElementById('mobileUserName')) {
                document.getElementById('mobileUserName').innerText = sd.Name_AR;
            }
        }
    } catch (error) {
        console.error("خطأ أثناء الاتصال بـ api.js:", error);
    }
});

// --- استبدل الدالة القديمة بهذه الدالة المحدثة تماماً ---
async function loadSidebar() {
    try {
        const response = await fetch('sidebar.html');
        const html = await response.text();
        document.getElementById('sidebar-placeholder').innerHTML = html;

        const menuToggle = document.getElementById('menuToggle');
        const sideNav = document.getElementById('sideNav');
        const overlay = document.getElementById('sidebarOverlay');

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

        // الجزء المسؤول عن تسجيل الخروج
        const logoutBtn = document.getElementById('logoutBtn');
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
