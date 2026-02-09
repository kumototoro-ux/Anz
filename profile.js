import { getStudentData } from './api.js';

document.addEventListener("DOMContentLoaded", async () => {
    // 1. استرجاع بيانات المستخدم من التخزين المحلي للتعرف على الـ ID
    const user = JSON.parse(localStorage.getItem("user"));
    if (!user || !user.ID) {
        window.location.href = "index.html";
        return;
    }

    // 2. تفعيل القائمة الجانبية (نفس منطق الرئيسية)
    setupNavigation();

    // 3. طلب البيانات من api.js (من جدول students)
    try {
        const response = await getStudentData('students', user.ID);

        if (response.success && response.data) {
            const sd = response.data; // بيانات الطالب من القاعدة

            // تعبئة البيانات في HTML بناءً على أسماء الأعمدة المطلوبة
            document.getElementById('nameAR').innerText = sd.Name_AR || 'لا يوجد اسم';
            document.getElementById('nameEN').innerText = sd.Name_EN || '';
            document.getElementById('userInitials').innerText = sd.Name_AR ? sd.Name_AR[0] : 'S';
            
            // البيانات الشخصية
            document.getElementById('val_ID').innerText = sd.ID;
            document.getElementById('val_BirthDate').innerText = sd.BirthDate || 'غير مسجل';
            document.getElementById('val_Nationality').innerText = sd.Nationality || 'غير مسجل';
            document.getElementById('val_Gender').innerText = (sd.Gender === 'Male' || sd.Gender === 'ذكر') ? 'ذكر' : 'أنثى';

            // البيانات الأكاديمية
            document.getElementById('val_StudentLevel').innerText = sd.StudentLevel || 'غير محدد';
            document.getElementById('val_Class').innerText = sd.Class || 'غير محدد';
            document.getElementById('val_Term').innerText = sd.Term || '---';
            document.getElementById('val_AcademicYear').innerText = sd.AcademicYear || '---';
            
            // تحديث اسم المستخدم في شريط الجوال
            if(document.getElementById('mobileUserName')) {
                document.getElementById('mobileUserName').innerText = sd.Name_AR;
            }

        } else {
            console.error("لم يتم العثور على بيانات الطالب في الجدول");
        }
    } catch (error) {
        console.error("خطأ أثناء الاتصال بـ api.js:", error);
    }
});

// وظائف التنقل وتسجيل الخروج
function setupNavigation() {
    const menuToggle = document.getElementById('menuToggle');
    const sideNav = document.querySelector('.side-nav');
    const overlay = document.getElementById('sidebarOverlay');
    const logoutBtn = document.getElementById('logoutBtn');

    if (menuToggle) {
        menuToggle.onclick = () => {
            sideNav.classList.toggle('active');
            overlay.classList.toggle('active');
        };
    }

    if (overlay) {
        overlay.onclick = () => {
            sideNav.classList.remove('active');
            overlay.classList.remove('active');
        };
    }

    if (logoutBtn) {
        logoutBtn.onclick = () => {
            localStorage.clear();
            window.location.href = 'index.html';
        };
    }
}
