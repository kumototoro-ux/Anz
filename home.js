import { getStudentData } from "./api.js";

document.addEventListener("DOMContentLoaded", async () => {
    // 1. جلب البيانات من الذاكرة
    const rawData = localStorage.getItem("user");
    if (!rawData) {
        window.location.href = "index.html";
        return;
    }

    const userData = JSON.parse(rawData);
    const studentId = userData.ID; // استخدام ID الكبير

    if (!studentId) {
        console.error("الهوية ID غير موجودة في بيانات المستخدم المحفوظة");
        return;
    }

    // تحديث واجهة المستخدم
    document.getElementById("welcomeMessage").innerText = `مرحباً بك، ${userData.Name_AR || 'الطالب'}`;

    // 2. طلب البيانات من الجداول (تأكد من مطابقة حالة الأحرف لأسماء الجداول في Supabase)
    try {
    const [attendanceRes, mathRes, scienceRes] = await Promise.all([
        getStudentData('AB', studentId),      // جدول الغياب عندك اسمه AB (حسب الصورة)
        getStudentData('Math', studentId),    // أول حرف كبير
        getStudentData('Science', studentId)  // أول حرف كبير
    ]);
    
    console.log("تم جلب البيانات بنجاح من الجداول المحددة");
} catch (error) {
    console.error("خطأ في أسماء الجداول:", error);
}

// دالة لتحديث الوقت والتاريخ (روح قوقل)
function updateDateTime() {
    const now = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    document.getElementById("currentDateText").innerText = now.toLocaleDateString('ar-SA', options);
    document.getElementById("dayName").innerText = now.toLocaleDateString('ar-SA', { weekday: 'long' });
}

// دالة عرض جدول الحصص بناءً على اليوم
function renderDailySchedule() {
    const container = document.getElementById("scheduleContainer");
    const day = new Date().getDay(); // 0 لـ الأحد في بعض الأنظمة، تأكد من ترتيبك

    // مثال لبيانات الحصص (يمكنك وضعها في مصفوفة لكل صف)
    const schedule = [
        { time: "08:00 ص", subject: "الرياضيات", teacher: "أ. محمد علي" },
        { time: "09:00 ص", subject: "اللغة العربية", teacher: "أ. أحمد سالم" },
        { time: "10:00 ص", subject: "العلوم", teacher: "أ. فهد منصور" }
    ];

    container.innerHTML = schedule.map(item => `
        <div class="schedule-item animate-fade">
            <div class="sub-info">
                <span class="subject-name">${item.subject}</span>
                <span class="teacher-name">${item.teacher}</span>
            </div>
            <div class="time-badge">${item.time}</div>
        </div>
    `).join('');
}

// دالة التقويم الدراسي (الأسبوع الحالي)
function renderAcademicCalendar() {
    const weekContainer = document.getElementById("calendarContainer");
    document.getElementById("weekNumber").innerText = "الأسبوع السادس"; // حسابي أو يدوي

    const days = [
        { name: "الأحد", date: "1 فبراير" },
        { name: "الاثنين", date: "2 فبراير" },
        { name: "الثلاثاء", date: "3 فبراير" },
        { name: "الأربعاء", date: "4 فبراير", current: true },
        { name: "الخميس", date: "5 فبراير" }
    ];

    weekContainer.innerHTML = days.map(d => `
        <div class="cal-day ${d.current ? 'active-day' : ''}">
            <span class="day-n">${d.name}</span>
            <span class="day-d">${d.date}</span>
        </div>
    `).join('');
}
