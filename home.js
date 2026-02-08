import { getStudentData } from './api.js';

document.addEventListener("DOMContentLoaded", async () => {
    
    // 1. التحقق من المستخدم
    const userData = JSON.parse(localStorage.getItem("user"));
    if (!userData || !userData.ID) { 
        window.location.href = "index.html"; 
        return; 
    }

    const studentId = userData.ID;

    // 2. تفعيل المنيو
    const menuBtn = document.getElementById('menuToggle');
    const sideNav = document.querySelector('.side-nav');
    const overlay = document.getElementById('sidebarOverlay');

    if (menuBtn && sideNav && overlay) {
        menuBtn.onclick = (e) => {
            e.preventDefault();
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

    // 3. تحديث الواجهة والترحيب والاسم الأول
    updateDateTime();
    renderDailySchedule();
    renderAcademicCalendar();
    
    const fullName = userData.Name_AR || 'الطالب';
    const firstName = fullName.split(' ')[0];
    
    const welcomeMsg = document.getElementById("welcomeMessage");
    if(welcomeMsg) welcomeMsg.innerText = `مرحباً بك، ${firstName}`;

    const mobileNameElement = document.getElementById('mobileUserName');
    if (mobileNameElement) mobileNameElement.innerText = firstName;

    // 4. قاموس المواد
    const subjectNamesAr = {
        'Arabic': 'اللغة العربية', 'Art': 'التربية الفنية', 'Critical': 'التفكير الناقد',
        'Digital': 'المهارات الرقمية', 'English': 'اللغة الإنجليزية', 'Islamic': 'الدراسات الإسلامية',
        'Life': 'المهارات الحياتية', 'Math': 'الرياضيات', 'PE': 'التربية البدنية',
        'Quran': 'القرآن الكريم', 'Science': 'العلوم', 'Social': 'الدراسات الاجتماعية'
    };
    const subjectTables = Object.keys(subjectNamesAr);

    // 5. دالة حساب الدرجات
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

   // 6. جلب البيانات والمعالجة
    try {
        const attendanceRes = await getStudentData('AB', studentId);
        
        if (attendanceRes.success) {
            let totalAtt = 0;
            let weeksCount = 0;
            let lastWeekAttVal = 0;
            const sessionsPerWeek = 25; // افتراض 25 حصة في الأسبوع كما في الأنظمة التعليمية

            // حساب البيانات من الأسابيع الـ 14
            for (let i = 1; i <= 14; i++) {
                let val = attendanceRes.data[String(i)];
                if (val !== null && val !== undefined && val !== "") {
                    weeksCount = i; // آخر أسبوع فيه بيانات
                    let attVal = parseFloat(val);
                    totalAtt += attVal;
                    lastWeekAttVal = attVal; // قيمة حضور آخر أسبوع فقط
                }
            }

            // أ- حساب النسبة المئوية لآخر أسبوع (للدائرة الصغيرة)
            const lastWeekRate = Math.round((lastWeekAttVal / sessionsPerWeek) * 100);
            
            // ب- حساب إجمالي الحضور التراكمي والمتوسط الذكي
            const totalPossibleSessions = weeksCount * sessionsPerWeek;
            const smartAvgRate = totalPossibleSessions > 0 
                ? ((totalAtt / totalPossibleSessions) * 100).toFixed(1) 
                : 0;

            // ج- تحديث العناصر في الواجهة
            const currentWeekNum = document.getElementById("currentWeekNum");
            const passedWeeksCount = document.getElementById("passedWeeksCount");
            const weekSessionsCount = document.getElementById("weekSessionsCount");
            const totalAttended = document.getElementById("totalAttended");
            const smartAvg = document.getElementById("smartAvg");
            const weekPercentText = document.getElementById("weekPercentText");
            const weekCircle = document.getElementById("weekCircle");

            if (currentWeekNum) currentWeekNum.innerText = weeksCount;
            if (passedWeeksCount) passedWeeksCount.innerText = weeksCount;
            if (weekSessionsCount) weekSessionsCount.innerText = lastWeekAttVal;
            if (totalAttended) totalAttended.innerText = totalAtt;
            if (smartAvg) smartAvg.innerText = smartAvgRate + "%";
            if (weekPercentText) weekPercentText.innerText = lastWeekRate + "%";
            
            // تحديث تصميم الدائرة (اللون الأخضر بناءً على نسبة الأسبوع)
            if (weekCircle) {
                weekCircle.style.background = `conic-gradient(#34a853 ${lastWeekRate}%, #f1f3f4 0deg)`;
            }
        }

        // --- معالجة درجات المواد ---
        const subjectsContainer = document.getElementById("subjectsGradesContainer");
        let allGradesData = []; 

        for (const subject of subjectTables) {
            const res = await getStudentData(subject, studentId);
            if (res.success) {
                const grade = calcGrade(subject, res.data);
                allGradesData.push({ id: subject, name: subjectNamesAr[subject], grade: grade });
            }
        }

        if (allGradesData.length > 0) {
            const totalAvg = allGradesData.reduce((acc, curr) => acc + curr.grade, 0) / allGradesData.length;
            if (document.getElementById("generalGrade")) {
                document.getElementById("generalGrade").innerText = totalAvg.toFixed(1) + "%";
            }
            
            const topSubjects = [...allGradesData].sort((a, b) => b.grade - a.grade).slice(0, 3);
            
            if (subjectsContainer) {
                subjectsContainer.innerHTML = `
                    <div style="grid-column: 1 / -1; margin-bottom: 10px;">
                        <p style="font-size: 0.8rem; color: var(--text-sub); margin-bottom: 15px;">أفضل أداء في المواد:</p>
                    </div>`;
                
                topSubjects.forEach(sub => {
                    subjectsContainer.innerHTML += `
                        <div class="subject-mini-card compact" onclick="window.location.href='evaluation.html?subject=${sub.id}'">
                            <div class="sub-card-info">
                                <span class="sub-name">${sub.name}</span>
                                <span class="sub-value">${sub.grade.toFixed(1)}%</span>
                            </div>
                            <div class="sub-progress-bar">
                                <div class="fill" style="width: ${sub.grade}%"></div>
                            </div>
                        </div>`;
                });
            }
        }
    } catch (err) {
        console.error("خطأ في تحميل لوحة البيانات:", err);
    }
    });
// --- الدوال المساعدة (تُكتب خارج DOMContentLoaded) ---

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
            "الأحد": [{time:"07:30", subject:"علوم", teacher:"أ. أنس"}, {time:"08:05", subject:"قرآن", teacher:"الشيخ إسماعيل"}, {time:"08:40", subject:"حاسب", teacher:"أ. أنس"}, {time:"09:15", subject:"لغة عربية", teacher:"أ. خالد"}, {time:"10:20", subject:"مهارات حياتية", teacher:"أ. خالد"}],
            "الاثنين": [{time:"07:30", subject:"رياضيات", teacher:"أ. أنس"}, {time:"08:05", subject:"توحيد", teacher:"الشيخ إسماعيل"}, {time:"08:40", subject:"إنجليزي", teacher:"أ. أنس"}, {time:"09:15", subject:"لغة عربية", teacher:"أ. خالد"}, {time:"10:20", subject:"بدنية", teacher:"أ. أنس"}],
            "الثلاثاء": [{time:"07:30", subject:"رياضيات", teacher:"أ. أنس"}, {time:"08:05", subject:"تفسير", teacher:"الشيخ إسماعيل"}, {time:"08:40", subject:"إنجليزي", teacher:"أ. أنس"}, {time:"09:15", subject:"لغة عربية", teacher:"أ. خالد"}, {time:"10:20", subject:"تربية فنية", teacher:"أ. أنس"}],
            "الأربعاء": [{time:"07:30", subject:"رياضيات", teacher:"أ. أنس"}, {time:"08:05", subject:"حديث", teacher:"الشيخ إسماعيل"}, {time:"08:40", subject:"تقييم إنجليزي", teacher:"أ. أنس"}, {time:"09:15", subject:"اجتماعيات", teacher:"أ. خالد"}, {time:"10:20", subject:"تقييم فنية", teacher:"أ. أنس"}],
            "الخميس": [{time:"07:30", subject:"تقييم رياضيات", teacher:"أ. أنس"}, {time:"08:05", subject:"فقه", teacher:"الشيخ إسماعيل"}, {time:"08:40", subject:"تقييم مهارات رقمية", teacher:"أ. أنس"}, {time:"09:15", subject:"اجتماعيات", teacher:"أ. خالد"}, {time:"10:20", subject:"تقييم بدنية", teacher:"أ. أنس"}]
        },
        "ثاني متوسط": {
            "الأحد": [{time:"07:30", subject:"حاسب", teacher:"أ. أنس"}, {time:"08:05", subject:"علوم", teacher:"أ. أنس"}, {time:"08:40", subject:"قرآن", teacher:"الشيخ إسماعيل"}, {time:"09:15", subject:"مهارات حياتية", teacher:"أ. خالد"}, {time:"10:20", subject:"لغة عربية", teacher:"أ. خالد"}],
            "الاثنين": [{time:"07:30", subject:"إنجليزي", teacher:"أ. أنس"}, {time:"08:05", subject:"رياضيات", teacher:"أ. أنس"}, {time:"08:40", subject:"توحيد", teacher:"الشيخ إسماعيل"}, {time:"09:15", subject:"بدنية", teacher:"أ. أنس"}, {time:"10:20", subject:"لغة عربية", teacher:"أ. خالد"}],
            "الثلاثاء": [{time:"07:30", subject:"إنجليزي", teacher:"أ. أنس"}, {time:"08:05", subject:"رياضيات", teacher:"أ. أنس"}, {time:"08:40", subject:"تفسير", teacher:"الشيخ إسماعيل"}, {time:"09:15", subject:"تربية فنية", teacher:"أ. أنس"}, {time:"10:20", subject:"لغة عربية", teacher:"أ. خالد"}],
            "الأربعاء": [{time:"07:30", subject:"تقييم إنجليزي", teacher:"أ. أنس"}, {time:"08:05", subject:"رياضيات", teacher:"أ. أنس"}, {time:"08:40", subject:"حديث", teacher:"الشيخ إسماعيل"}, {time:"09:15", subject:"تقييم فنية", teacher:"أ. أنس"}, {time:"10:20", subject:"اجتماعيات", teacher:"أ. خالد"}],
            "الخميس": [{time:"07:30", subject:"تقييم مهارات رقمية", teacher:"أ. أنس"}, {time:"08:05", subject:"تقييم رياضيات", teacher:"أ. أنس"}, {time:"08:40", subject:"فقه", teacher:"الشيخ إسماعيل"}, {time:"09:15", subject:"تقييم بدنية", teacher:"أ. أنس"}, {time:"10:20", subject:"اجتماعيات", teacher:"أ. خالد"}]
        },
        "ثالث متوسط": {
            "الأحد": [{time:"07:30", subject:"قرآن", teacher:"الشيخ إسماعيل"}, {time:"08:05", subject:"حاسب", teacher:"أ. أنس"}, {time:"08:40", subject:"علوم", teacher:"أ. أنس"}, {time:"09:15", subject:"مهارات حياتية", teacher:"أ. خالد"}, {time:"11:00", subject:"لغة عربية", teacher:"أ. خالد"}],
            "الاثنين": [{time:"07:30", subject:"توحيد", teacher:"الشيخ إسماعيل"}, {time:"08:05", subject:"إنجليزي", teacher:"أ. أنس"}, {time:"08:40", subject:"رياضيات", teacher:"أ. أنس"}, {time:"09:15", subject:"بدنية", teacher:"أ. أنس"}, {time:"11:00", subject:"لغة عربية", teacher:"أ. خالد"}],
            "الثلاثاء": [{time:"07:30", subject:"تفسير", teacher:"الشيخ إسماعيل"}, {time:"08:05", subject:"إنجليزي", teacher:"أ. أنس"}, {time:"08:40", subject:"رياضيات", teacher:"أ. أنس"}, {time:"09:15", subject:"تربية فنية", teacher:"أ. أنس"}, {time:"11:00", subject:"لغة عربية", teacher:"أ. خالد"}],
            "الأربعاء": [{time:"07:30", subject:"حديث", teacher:"الشيخ إسماعيل"}, {time:"08:05", subject:"تقييم إنجليزي", teacher:"أ. أنس"}, {time:"08:40", subject:"رياضيات", teacher:"أ. أنس"}, {time:"09:15", subject:"تقييم فنية", teacher:"أ. أنس"}, {time:"11:00", subject:"اجتماعيات", teacher:"أ. خالد"}],
            "الخميس": [{time:"07:30", subject:"فقه", teacher:"الشيخ إسماعيل"}, {time:"08:05", subject:"تقييم مهارات رقمية", teacher:"أ. أنس"}, {time:"08:40", subject:"تقييم رياضيات", teacher:"أ. أنس"}, {time:"09:15", subject:"تقييم بدنية", teacher:"أ. أنس"}, {time:"11:00", subject:"اجتماعيات", teacher:"أ. خالد"}]
        }
    };

    const todaySchedule = allSchedules[studentLevel]?.[currentDay] || [];
    container.innerHTML = todaySchedule.length === 0 ? `<div style="text-align:center; padding:20px; color:#999;">لا توجد حصص اليوم</div>` :
        todaySchedule.map(item => `
        <div class="schedule-item animate-fade">
            <div class="sub-info"><span class="subject-name">${item.subject}</span><span class="teacher-name">${item.teacher}</span></div>
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
    let currentWeekInfo = academicPlan.find(w => today >= w.start && today <= w.end) || academicPlan.find(w => today < w.start);
    if (weekNumberBadge && currentWeekInfo) weekNumberBadge.innerText = `الأسبوع ${currentWeekInfo.week} - ${currentWeekInfo.note}`;

    const startDate = currentWeekInfo ? new Date(currentWeekInfo.start) : new Date();
    const dayNames = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس"];
    
    let daysHtml = "";
    for (let i = 0; i < 5; i++) {
        const d = new Date(startDate);
        d.setDate(startDate.getDate() + i);
        const isToday = d.toDateString() === today.toDateString();
        daysHtml += `
            <div class="cal-day ${isToday ? 'active-day' : ''}" 
                 style="padding: 10px 5px; border-radius: 12px; text-align: center; 
                 ${isToday ? 'background: var(--primary); color: white; transform: scale(1.05);' : 'background: #f8f9fa; color: #5f6368; border: 1px solid #eee;'}">
                <div style="font-size: 0.7rem; margin-bottom: 4px;">${dayNames[i]}</div>
                <div style="font-size: 0.85rem; font-weight: bold;">${d.toLocaleDateString('ar-SA', { day: 'numeric', month: 'long' })}</div>
            </div>`;
    }
    weekContainer.innerHTML = `<div style="display:grid; grid-template-columns: repeat(5, 1fr); gap:8px;">${daysHtml}</div>`;
}
