import { getStudentData } from './api.js';

document.addEventListener("DOMContentLoaded", async () => {
    const userData = JSON.parse(localStorage.getItem("user"));
    if (!userData || !userData.ID) { 
        window.location.href = "index.html"; 
        return; 
    }

    const studentId = userData.ID;

    // --- 1. تشغيل الدوال الخدمية (الوقت والجدول) ---
    updateDateTime();
    renderDailySchedule();
    renderAcademicCalendar();
    
    // تحديث اسم الطالب في الواجهة
    const welcomeMsg = document.getElementById("welcomeMessage");
    if(welcomeMsg) welcomeMsg.innerText = `مرحباً بك، ${userData.Name_AR || 'الطالب'}`;

    // مصفوفة بأسماء كافة الجداول للمواد الـ 12 كما هي في Supabase
   // مصفوفة المواد مطابقة تماماً لأسماء الجداول في الصورة
const subjectTables = [
    'Arabic', 
    'Art', 
    'Critical', // التفكير الناقد (ثالث متوسط)
    'Digital', 
    'English', 
    'Islamic', 
    'Life',    // المهارات الحياتية
    'Math', 
    'PE',      // التربية البدنية
    'Quran', 
    'Science', 
    'Social'
];

    // --- 2. دوال الحساب الذكية ---
    const calcGrade = (tableName, data) => {
        if (!data) return 0;
        let points = 0, count = 0;

        if (tableName === 'Quran') {
            const types = ['HW', 'read', 'Taj', 'save'];
            types.forEach(t => {
                for(let i=1; i<=12; i++) {
                    if(data[`${t}_${i}`] !== null) { points += parseFloat(data[`${t}_${i}`]); count++; }
                }
            });
        } else {
            const keys = ['PR_1','PR_2', ...Array.from({length:12}, (_,i)=>`HW_${i+1}`), ...Array.from({length:12}, (_,i)=>`QZ_${i+1}`)];
            keys.forEach(k => { if(data[k] !== null) { points += parseFloat(data[k]); count++; } });
        }
        return count > 0 ? (points / count) : 0;
    };

    // --- 3. جلب البيانات من السيرفر ---
    try {
        // جلب بيانات الغياب
        const attendance = await getStudentData('AB', studentId);
        if (attendance.success) {
            let totalAbs = 0;
            for(let i=1; i<=14; i++) { 
                if(attendance.data[String(i)] !== null) totalAbs += parseFloat(attendance.data[String(i)]); 
            }
            const el = document.getElementById("absentCount");
            if(el) el.innerText = totalAbs;
        }

        // جلب وحساب المواد الـ 12
        let totalAllSubjects = 0;
        let subjectsFound = 0;

        for (const subject of subjectTables) {
            const res = await getStudentData(subject, studentId);
            if (res.success) {
                const grade = calcGrade(subject, res.data);
                const gradeEl = document.getElementById(`${subject}_Grade`);
                if (gradeEl) gradeEl.innerText = grade.toFixed(1) + "%";
                
                totalAllSubjects += grade;
                subjectsFound++;
            }
        }

        // حساب التقييم العام
        if (subjectsFound > 0) {
            const finalAvg = totalAllSubjects / subjectsFound;
            const generalEl = document.getElementById("generalGrade");
            if (generalEl) generalEl.innerText = finalAvg.toFixed(1) + "%";
        }

    } catch (err) { console.error("Error loading dashboard:", err); }
});

// --- الدوال الفرعية (خارج DOMContentLoaded) ---

function updateDateTime() {
    const now = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const dateText = document.getElementById("currentDateText");
    const dayName = document.getElementById("dayName");
    if(dateText) dateText.innerText = now.toLocaleDateString('ar-SA', options);
    if(dayName) dayName.innerText = now.toLocaleDateString('ar-SA', { weekday: 'long' });
}

function renderDailySchedule() {
    const container = document.getElementById("scheduleContainer");
    if(!container) return;

    const schedule = [
        { time: "08:00 ص", subject: "الرياضيات", teacher: "أ. محمد علي" },
        { time: "09:00 ص", subject: "اللغة العربية", teacher: "أ. أحمد سالم" },
        { time: "10:00 ص", subject: "العلوم", teacher: "أ. فهد منصور" }
    ];

    container.innerHTML = schedule.map(item => `
        <div class="schedule-item">
            <div class="sub-info">
                <span class="subject-name">${item.subject}</span>
                <span class="teacher-name">${item.teacher}</span>
            </div>
            <div class="time-badge">${item.time}</div>
        </div>
    `).join('');
}

function renderAcademicCalendar() {
    const weekContainer = document.getElementById("calendarContainer");
    if(!weekContainer) return;

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
