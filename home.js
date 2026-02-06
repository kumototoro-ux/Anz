import { getStudentData } from './api.js';

document.addEventListener("DOMContentLoaded", async () => {
    
    // 1. التحقق من المستخدم وجلب بياناته من المتصفح
    const userData = JSON.parse(localStorage.getItem("user"));
    if (!userData || !userData.ID) { 
        window.location.href = "index.html"; 
        return; 
    }

    // --- الإصلاح هنا: تعريف المعرف بشكل صريح ليكون متاحاً للكود بالأسفل ---
    const studentId = userData.ID;

    // 2. تفعيل زر القائمة للجوال
    const menuBtn = document.getElementById('menuToggle');
    const sideNav = document.querySelector('.side-nav');
    const overlay = document.getElementById('sidebarOverlay');

    if (menuBtn && sideNav && overlay) {
        menuBtn.onclick = (e) => {
            e.stopPropagation();
            sideNav.classList.add('active');
            overlay.classList.add('active');
            document.body.style.overflow = 'hidden';
        };

        overlay.onclick = () => {
            sideNav.classList.remove('active');
            overlay.classList.remove('active');
            document.body.style.overflow = '';
        };
    }

    // 3. تحديث الواجهة والوقت
    updateDateTime();
    renderDailySchedule();
    renderAcademicCalendar();
    
    const welcomeMsg = document.getElementById("welcomeMessage");
    if(welcomeMsg) welcomeMsg.innerText = `مرحباً بك، ${userData.Name_AR || 'الطالب'}`;

    // 4. قاموس تعريب أسماء المواد
    const subjectNamesAr = {
        'Arabic': 'اللغة العربية', 'Art': 'التربية الفنية', 'Critical': 'التفكير الناقد',
        'Digital': 'المهارات الرقمية', 'English': 'اللغة الإنجليزية', 'Islamic': 'الدراسات الإسلامية',
        'Life': 'المهارات الحياتية', 'Math': 'الرياضيات', 'PE': 'التربية البدنية',
        'Quran': 'القرآن الكريم', 'Science': 'العلوم', 'Social': 'الدراسات الاجتماعية'
    };
    const subjectTables = Object.keys(subjectNamesAr);

    // 5. دالة حساب الدرجات (كما هي في كودك)
    const calcGrade = (tableName, data) => {
        if (!data) return 0;
        let points = 0, count = 0;
        if (tableName === 'Quran') {
            const types = ['HW', 'read', 'Taj', 'save'];
            types.forEach(t => {
                for(let i = 1; i <= 12; i++) {
                    if(data[`${t}_${i}`] !== null) { points += parseFloat(data[`${t}_${i}`]); count++; }
                }
            });
        } else {
            const keys = ['PR_1','PR_2', ...Array.from({length:12}, (_,i)=>`HW_${i+1}`), ...Array.from({length:12}, (_,i)=>`QZ_${i+1}`)];
            keys.forEach(k => { if(data[k] !== null) { points += parseFloat(data[k]); count++; } });
        }
        return count > 0 ? (points / count) : 0;
    };

    // 6. جلب ومعالجة البيانات
    try {
        // أ. معالجة الغياب
        const attendanceRes = await getStudentData('AB', studentId);
        if (attendanceRes.success) {
            let totalAtt = 0, totalAbs = 0, chartHTML = '';
            for(let i = 1; i <= 14; i++) {
                let val = attendanceRes.data[String(i)];
                if (val !== null) {
                    let attended = parseFloat(val);
                    let absent = 15 - attended;
                    totalAtt += attended; totalAbs += absent;
                    chartHTML += `
                        <div class="week-stat" style="margin-bottom: 12px; padding: 5px; border-radius: 8px;">
                            <div style="display:flex; justify-content:space-between; font-size:0.8rem; margin-bottom:4px;">
                                <span style="color: #5f6368;">الأسبوع ${i}</span>
                                <span style="font-weight:bold; color: #202124;">${attended} ح / 15</span>
                            </div>
                            <div style="height:8px; background:#eee; border-radius:4px; overflow:hidden; display:flex;">
                                <div style="width:${(attended/15)*100}%; background: linear-gradient(90deg, #34a853, #2ecc71);"></div>
                                <div style="width:${(absent/15)*100}%; background: #ea4335;"></div>
                            </div>
                        </div>`;
                }
            }
            if(document.getElementById("totalAttendanceSessions")) document.getElementById("totalAttendanceSessions").innerText = totalAtt;
            if(document.getElementById("totalAbsenceSessions")) document.getElementById("totalAbsenceSessions").innerText = totalAbs;
            if(document.getElementById("attendanceChart")) document.getElementById("attendanceChart").innerHTML = chartHTML;
        }

        // ب. إنشاء بطاقات المواد
        const subjectsContainer = document.getElementById("subjectsGradesContainer");
        let totalAllGrades = 0, subjectsFound = 0;
        if (subjectsContainer) subjectsContainer.innerHTML = '';

        for (const subject of subjectTables) {
            const res = await getStudentData(subject, studentId);
            if (res.success) {
                const grade = calcGrade(subject, res.data);
                totalAllGrades += grade;
                subjectsFound++;
                if (subjectsContainer) {
                    subjectsContainer.innerHTML += `
                        <div class="subject-mini-card animate-up" onclick="window.location.href='evaluation.html?subject=${subject}'">
                            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                                <span style="font-size:0.9rem; font-weight:700; color:#4a5568;">${subjectNamesAr[subject]}</span>
                                <span style="font-weight:800; color:#1a73e8;">${grade.toFixed(1)}%</span>
                            </div>
                            <div style="height:6px; background:#edf2f7; border-radius:3px; overflow:hidden;">
                                <div style="width:${grade}%; height:100%; background:linear-gradient(90deg, #1a73e8, #63b3ed); transition: width 1s ease-in-out;"></div>
                            </div>
                        </div>`;
                }
            }
        }
        if (subjectsFound > 0 && document.getElementById("generalGrade")) {
            document.getElementById("generalGrade").innerText = (totalAllGrades / subjectsFound).toFixed(1) + "%";
        }
    } catch (err) {
        console.error("خطأ في تحميل لوحة البيانات:", err);
    }
});

// --- الدوال المساعدة (دوال الجداول والتقويم الخاصة بك كما هي) ---

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
    if (!container) return;
    const userData = JSON.parse(localStorage.getItem("user"));
    const studentLevel = userData?.Level || "أول متوسط"; 
    const daysMap = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];
    const currentDay = daysMap[new Date().getDay()];

    const allSchedules = {
        "أول متوسط": {
            "الأحد": [
                { time: "07:30", subject: "علوم", teacher: "أ. أنس" },
                { time: "08:05", subject: "قرآن", teacher: "الشيخ إسماعيل" },
                { time: "08:40", subject: "حاسب", teacher: "أ. أنس" },
                { time: "09:15", subject: "لغة عربية", teacher: "أ. خالد" },
                { time: "10:20", subject: "مهارات حياتية", teacher: "أ. خالد" }
            ],
            "الاثنين": [
                { time: "07:30", subject: "رياضيات", teacher: "أ. أنس" },
                { time: "08:05", subject: "توحيد", teacher: "الشيخ إسماعيل" },
                { time: "08:40", subject: "إنجليزي", teacher: "أ. أنس" },
                { time: "09:15", subject: "لغة عربية", teacher: "أ. خالد" },
                { time: "10:20", subject: "بدنية", teacher: "أ. أنس" }
            ],
            "الثلاثاء": [
                { time: "07:30", subject: "رياضيات", teacher: "أ. أنس" },
                { time: "08:05", subject: "تفسير", teacher: "الشيخ إسماعيل" },
                { time: "08:40", subject: "إنجليزي", teacher: "أ. أنس" },
                { time: "09:15", subject: "لغة عربية", teacher: "أ. خالد" },
                { time: "10:20", subject: "تربية فنية", teacher: "أ. أنس" }
            ],
            "الأربعاء": [
                { time: "07:30", subject: "رياضيات", teacher: "أ. أنس" },
                { time: "08:05", subject: "حديث", teacher: "الشيخ إسماعيل" },
                { time: "08:40", subject: "تقييم إنجليزي", teacher: "أ. أنس" },
                { time: "09:15", subject: "اجتماعيات", teacher: "أ. خالد" },
                { time: "10:20", subject: "تقييم فنية", teacher: "أ. أنس" }
            ],
            "الخميس": [
                { time: "07:30", subject: "تقييم رياضيات", teacher: "أ. أنس" },
                { time: "08:05", subject: "فقه", teacher: "الشيخ إسماعيل" },
                { time: "08:40", subject: "تقييم مهارات رقمية", teacher: "أ. أنس" },
                { time: "09:15", subject: "اجتماعيات", teacher: "أ. خالد" },
                { time: "10:20", subject: "تقييم بدنية", teacher: "أ. أنس" }
            ]
        },
        "ثاني متوسط": {
             "الأحد": [
                { time: "07:30", subject: "حاسب", teacher: "أ. أنس" },
                { time: "08:05", subject: "علوم", teacher: "أ. أنس" },
                { time: "08:40", subject: "قرآن", teacher: "الشيخ إسماعيل" },
                { time: "09:15", subject: "مهارات حياتية", teacher: "أ. خالد" },
                { time: "10:20", subject: "لغة عربية", teacher: "أ. خالد" }
            ],
            "الاثنين": [
                { time: "07:30", subject: "إنجليزي", teacher: "أ. أنس" },
                { time: "08:05", subject: "رياضيات", teacher: "أ. أنس" },
                { time: "08:40", subject: "توحيد", teacher: "الشيخ إسماعيل" },
                { time: "09:15", subject: "بدنية", teacher: "أ. أنس" },
                { time: "10:20", subject: "لغة عربية", teacher: "أ. خالد" }
            ],
            "الثلاثاء": [
                { time: "07:30", subject: "إنجليزي", teacher: "أ. أنس" },
                { time: "08:05", subject: "رياضيات", teacher: "أ. أنس" },
                { time: "08:40", subject: "تفسير", teacher: "الشيخ إسماعيل" },
                { time: "09:15", subject: "تربية فنية", teacher: "أ. أنس" },
                { time: "10:20", subject: "لغة عربية", teacher: "أ. خالد" }
            ],
            "الأربعاء": [
                { time: "07:30", subject: "تقييم إنجليزي", teacher: "أ. أنس" },
                { time: "08:05", subject: "رياضيات", teacher: "أ. أنس" },
                { time: "08:40", subject: "حديث", teacher: "الشيخ إسماعيل" },
                { time: "09:15", subject: "تقييم فنية", teacher: "أ. أنس" },
                { time: "10:20", subject: "اجتماعيات", teacher: "أ. خالد" }
            ],
            "الخميس": [
                { time: "07:30", subject: "تقييم مهارات رقمية", teacher: "أ. أنس" },
                { time: "08:05", subject: "تقييم رياضيات", teacher: "أ. أنس" },
                { time: "08:40", subject: "فقه", teacher: "الشيخ إسماعيل" },
                { time: "09:15", subject: "تقييم بدنية", teacher: "أ. أنس" },
                { time: "10:20", subject: "اجتماعيات", teacher: "أ. خالد" }
            ]
        },
        "ثالث متوسط": {
            "الأحد": [
                { time: "07:30", subject: "قرآن", teacher: "الشيخ إسماعيل" },
                { time: "08:05", subject: "حاسب", teacher: "أ. أنس" },
                { time: "08:40", subject: "علوم", teacher: "أ. أنس" },
                { time: "09:15", subject: "مهارات حياتية", teacher: "أ. خالد" },
                { time: "11:00", subject: "لغة عربية", teacher: "أ. خالد" }
            ],
            "الاثنين": [
                { time: "07:30", subject: "توحيد", teacher: "الشيخ إسماعيل" },
                { time: "08:05", subject: "إنجليزي", teacher: "أ. أنس" },
                { time: "08:40", subject: "رياضيات", teacher: "أ. أنس" },
                { time: "09:15", subject: "بدنية", teacher: "أ. أنس" },
                { time: "11:00", subject: "لغة عربية", teacher: "أ. خالد" }
            ],
            "الثلاثاء": [
                { time: "07:30", subject: "تفسير", teacher: "الشيخ إسماعيل" },
                { time: "08:05", subject: "إنجليزي", teacher: "أ. أنس" },
                { time: "08:40", subject: "رياضيات", teacher: "أ. أنس" },
                { time: "09:15", subject: "تربية فنية", teacher: "أ. أنس" },
                { time: "11:00", subject: "لغة عربية", teacher: "أ. خالد" }
            ],
            "الأربعاء": [
                { time: "07:30", subject: "حديث", teacher: "الشيخ إسماعيل" },
                { time: "08:05", subject: "تقييم إنجليزي", teacher: "أ. أنس" },
                { time: "08:40", subject: "رياضيات", teacher: "أ. أنس" },
                { time: "09:15", subject: "تقييم فنية", teacher: "أ. أنس" },
                { time: "11:00", subject: "اجتماعيات", teacher: "أ. خالد" }
            ],
            "الخميس": [
                { time: "07:30", subject: "فقه", teacher: "الشيخ إسماعيل" },
                { time: "08:05", subject: "تقييم مهارات رقمية", teacher: "أ. أنس" },
                { time: "08:40", subject: "تقييم رياضيات", teacher: "أ. أنس" },
                { time: "09:15", subject: "تقييم بدنية", teacher: "أ. أنس" },
                { time: "11:00", subject: "اجتماعيات", teacher: "أ. خالد" }
            ]
        }
    };

    const todaySchedule = allSchedules[studentLevel]?.[currentDay] || [];
    if (todaySchedule.length === 0) {
        container.innerHTML = `<div style="text-align:center; padding:20px; color:#999;">لا توجد حصص اليوم</div>`;
        return;
    }
    container.innerHTML = todaySchedule.map(item => `
        <div class="schedule-item animate-fade">
            <div class="sub-info">
                <span class="subject-name">${item.subject}</span>
                <span class="teacher-name">${item.teacher}</span>
            </div>
            <div class="time-badge">${item.time}</div>
        </div>`).join('');
}

function renderAcademicCalendar() {
    const weekContainer = document.getElementById("calendarContainer");
    const weekNumberBadge = document.getElementById("weekNumber");
    if(!weekContainer) return;

    const academicPlan = [
        { week: 1, start: new Date('2026-01-25'), end: new Date('2026-01-29'), note: "يوم دراسي" },
        { week: 2, start: new Date('2026-02-01'), end: new Date('2026-02-05'), note: "يوم دراسي" },
        { week: 3, start: new Date('2026-02-08'), end: new Date('2026-02-12'), note: "يوم دراسي" },
        { week: 4, start: new Date('2026-02-15'), end: new Date('2026-02-19'), note: "يوم دراسي" },
        { week: 5, start: new Date('2026-02-22'), end: new Date('2026-02-26'), note: "يوم دراسي" },
        { week: 6, start: new Date('2026-03-01'), end: new Date('2026-03-05'), note: "يوم دراسي" },
        { week: 7, start: new Date('2026-03-08'), end: new Date('2026-03-12'), note: "بداية إجازة رمضان" },
        { week: 8, start: new Date('2026-03-29'), end: new Date('2026-04-02'), note: "الاختبارات الشهرية" },
        { week: 9, start: new Date('2026-04-05'), end: new Date('2026-04-09'), note: "يوم دراسي" },
        { week: 10, start: new Date('2026-04-12'), end: new Date('2026-04-16'), note: "يوم دراسي" },
        { week: 11, start: new Date('2026-04-19'), end: new Date('2026-04-23'), note: "يوم دراسي" },
        { week: 12, start: new Date('2026-04-26'), end: new Date('2026-05-01'), note: "يوم دراسي" },
        { week: 13, start: new Date('2026-05-03'), end: new Date('2026-05-07'), note: "الاختبارات النهائية" }
    ];

    const today = new Date();
    let currentWeekInfo = academicPlan.find(w => today >= w.start && today <= w.end);
    if (!currentWeekInfo) currentWeekInfo = academicPlan.find(w => today < w.start);

    if (weekNumberBadge && currentWeekInfo) weekNumberBadge.innerText = `الأسبوع ${currentWeekInfo.week} - ${currentWeekInfo.note}`;

    const startDate = currentWeekInfo ? new Date(currentWeekInfo.start) : new Date();
    const dayNames = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس"];
    const daysArr = [];

    for (let i = 0; i < 5; i++) {
        const d = new Date(startDate);
        d.setDate(startDate.getDate() + i);
        daysArr.push({
            name: dayNames[i],
            date: d.toLocaleDateString('ar-SA', { day: 'numeric', month: 'long' }),
            isToday: d.toDateString() === today.toDateString()
        });
    }

    weekContainer.innerHTML = `
        <div style="display:grid; grid-template-columns: repeat(5, 1fr); gap:8px;">
            ${daysArr.map(d => `
                <div class="cal-day ${d.isToday ? 'active-day' : ''}" 
                     style="padding: 10px 5px; border-radius: 12px; text-align: center; transition: 0.3s; 
                     ${d.isToday ? 'background: var(--primary); color: white; transform: scale(1.05);' : 'background: #f8f9fa; color: #5f6368; border: 1px solid #eee;'}">
                    <div style="font-size: 0.7rem; margin-bottom: 4px;">${d.name}</div>
                    <div style="font-size: 0.85rem; font-weight: bold;">${d.date}</div>
                </div>`).join('')}
        </div>`;
}
