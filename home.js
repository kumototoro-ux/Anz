import { getStudentData } from './api.js';

document.addEventListener("DOMContentLoaded", async () => {
    const userData = JSON.parse(localStorage.getItem("user"));
    if (!userData || !userData.ID) { window.location.href = "index.html"; return; }

    const studentId = userData.ID;

    // --- أولاً: دوال الحساب الذكية ---

    // حساب المواد العامة (رياضيات، علوم، إلخ)
    const calcGeneralGrade = (data) => {
        if (!data) return 0;
        let points = 0, count = 0;
        // جمع PR (1-2), HW (1-12), QZ (1-12)
        const keys = ['PR_1','PR_2', ...Array.from({length:12}, (_,i)=>`HW_${i+1}`), ...Array.from({length:12}, (_,i)=>`QZ_${i+1}`)];
        keys.forEach(k => { if(data[k] !== null) { points += parseFloat(data[k]); count++; } });
        return count > 0 ? (points / count) : 0;
    };

    // حساب القرآن (HW, read, Taj, save, PR)
    const calcQuranGrade = (data) => {
        if (!data) return 0;
        let points = 0, count = 0;
        const types = ['HW', 'read', 'Taj', 'save'];
        types.forEach(t => {
            for(let i=1; i<=12; i++) {
                let val = data[`${t}_${i}`];
                if(val !== null) { points += parseFloat(val); count++; }
            }
        });
        // إضافة المشاركة
        if(data.PR_1 !== null) { points += data.PR_1; count++; }
        if(data.PR_2 !== null) { points += data.PR_2; count++; }
        return count > 0 ? (points / count) : 0;
    };

    // حساب الغياب من جدول AB (الأسابيع 1-14)
    const calcAbsence = (data) => {
        if (!data) return 0;
        let total = 0;
        for(let i=1; i<=14; i++) { if(data[String(i)] !== null) total += parseFloat(data[String(i)]); }
        return total;
    };

    // --- ثانياً: جلب البيانات وعرضها ---

    try {
        const [math, quran, science, attendance] = await Promise.all([
            getStudentData('Math', studentId),
            getStudentData('Quran', studentId),
            getStudentData('Science', studentId),
            getStudentData('AB', studentId)
        ]);

        // عرض الغياب
        if (attendance.success) document.getElementById("absentCount").innerText = calcAbsence(attendance.data);

        // عرض الرياضيات
        let mGrade = 0;
        if (math.success) {
            mGrade = calcGeneralGrade(math.data);
            document.getElementById("mathGrade").innerText = mGrade.toFixed(1) + "%";
        }

        // عرض القرآن
        let qGrade = 0;
        if (quran.success) {
            qGrade = calcQuranGrade(quran.data);
            document.getElementById("quranGrade").innerText = qGrade.toFixed(1) + "%";
        }

        // التقييم العام (متوسط المواد)
        const generalAvg = (mGrade + qGrade) / 2; // أضف بقية المواد في المعادلة
        document.getElementById("generalGrade").innerText = generalAvg.toFixed(1) + "%";

    } catch (err) { console.error("Error loading dashboard:", err); }
});

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
