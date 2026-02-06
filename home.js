import { getStudentData } from "./api.js";

document.addEventListener("DOMContentLoaded", async () => {
    // 1. جلب بيانات الطالب من التخزين المحلي
    const rawData = localStorage.getItem("user");
    if (!rawData) {
        window.location.href = "index.html"; // العودة للدخول إذا لم توجد بيانات
        return;
    }

    const userData = JSON.parse(rawData);
    const studentId = userData.ID; // استخدام ID الكبير كما في قاعدة بياناتك

    // تحديث رسالة الترحيب والاسم في الواجهة
    const welcomeMsg = document.getElementById("welcomeMessage");
    if(welcomeMsg) welcomeMsg.innerText = `مرحباً بك، ${userData.Name_AR || 'الطالب'}`;

    // 2. طلب البيانات من الجداول (لاحظ مطابقة الحروف الكبيرة تماماً لصورك)
    // home.js داخل دالة DOMContentLoaded
try {
    const [attendanceRes, mathRes, scienceRes] = await Promise.all([
        getStudentData('AB', studentId), 
        getStudentData('Math', studentId),
        getStudentData('Science', studentId)
    ]);

    // عرض الغياب من جدول AB
    if (attendanceRes.success) {
        console.log("محتوى جدول الغياب:", attendanceRes.data);
        // تأكد من اسم عمود الغياب في Supabase (مثلاً Absent أو Total_Absence)
        const absentValue = attendanceRes.data.Absent || attendanceRes.data.absent_days || 0;
        document.getElementById("absentCount").innerText = absentValue;
    }

    // حساب التقييم العام (متوسط كافة المواد)
    let grades = [];
    if (mathRes.success) grades.push(parseFloat(mathRes.data.Total || 0));
    if (scienceRes.success) grades.push(parseFloat(scienceRes.data.Total || 0));
    // أضف أي مواد أخرى هنا...

    if (grades.length > 0) {
        const avg = grades.reduce((a, b) => a + b, 0) / grades.length;
        const generalEl = document.getElementById("generalGrade");
        if (generalEl) generalEl.innerText = avg.toFixed(1) + "%";
    }

} catch (err) {
    console.error("خطأ في العرض:", err);
}
}); // إغلاق دالة DOMContentLoaded - هذا القوس هو الذي كان مفقوداً غالباً

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
