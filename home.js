import { getStudentData } from './api.js';

document.addEventListener("DOMContentLoaded", async () => {
    // 1. التحقق من وجود المستخدم
    const userData = JSON.parse(localStorage.getItem("user"));
    if (!userData || !userData.ID) { 
        window.location.href = "index.html"; 
        return; 
    }

    const studentId = userData.ID;

    // 2. تحديث الواجهة والوقت
    updateDateTime();
    renderDailySchedule();
    renderAcademicCalendar();
    
    const welcomeMsg = document.getElementById("welcomeMessage");
    if(welcomeMsg) welcomeMsg.innerText = `مرحباً بك، ${userData.Name_AR || 'الطالب'}`;

    // 3. قاموس تعريب أسماء المواد (للعرض فقط)
    const subjectNamesAr = {
        'Arabic': 'اللغة العربية',
        'Art': 'التربية الفنية',
        'Critical': 'التفكير الناقد',
        'Digital': 'المهارات الرقمية',
        'English': 'اللغة الإنجليزية',
        'Islamic': 'الدراسات الإسلامية',
        'Life': 'المهارات الحياتية',
        'Math': 'الرياضيات',
        'PE': 'التربية البدنية',
        'Quran': 'القرآن الكريم',
        'Science': 'العلوم',
        'Social': 'الدراسات الاجتماعية'
    };

    const subjectTables = Object.keys(subjectNamesAr);

    // --- دالة حساب درجات المواد ---
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

    // --- جلب ومعالجة البيانات ---
    try {
        // أ. معالجة الغياب (تحويل الدرجات إلى حصص حضور/غياب من 15)
        const attendanceRes = await getStudentData('AB', studentId);
        if (attendanceRes.success) {
            let totalAtt = 0;
            let totalAbs = 0;
            let chartHTML = '';

            for(let i = 1; i <= 14; i++) {
                let val = attendanceRes.data[String(i)];
                if (val !== null) {
                    let attended = parseFloat(val);
                    let absent = 15 - attended;
                    totalAtt += attended;
                    totalAbs += absent;

                    chartHTML += `
                        <div class="week-stat" style="margin-bottom: 12px; padding: 5px; border-radius: 8px; transition: background 0.3s;">
                            <div style="display:flex; justify-content:space-between; font-size:0.8rem; margin-bottom:4px;">
                                <span style="color: #5f6368;">الأسبوع ${i}</span>
                                <span style="font-weight:bold; color: #202124;">${attended} ح / 15</span>
                            </div>
                            <div style="height:8px; background:#eee; border-radius:4px; overflow:hidden; display:flex;">
                                <div style="width:${(attended/15)*100}%; background: linear-gradient(90deg, #34a853, #2ecc71);"></div>
                                <div style="width:${(absent/15)*100}%; background: #ea4335;"></div>
                            </div>
                        </div>
                    `;
                }
            }
            const attEl = document.getElementById("totalAttendanceSessions");
            const absEl = document.getElementById("totalAbsenceSessions");
            const chartContainer = document.getElementById("attendanceChart");
            
            if(attEl) attEl.innerText = totalAtt;
            if(absEl) absEl.innerText = totalAbs;
            if(chartContainer) chartContainer.innerHTML = chartHTML;
        }

        // ب. إنشاء بطاقات المواد الـ 12 وحساب التقييم
        const subjectsContainer = document.getElementById("subjectsGradesContainer");
        let totalAllGrades = 0;
        let subjectsFound = 0;

        if (subjectsContainer) subjectsContainer.innerHTML = '';

        for (const subject of subjectTables) {
            const res = await getStudentData(subject, studentId);
            
            if (res.success) {
                const grade = calcGrade(subject, res.data);
                totalAllGrades += grade;
                subjectsFound++;

                if (subjectsContainer) {
                    // تم إضافة شريط تقدم ملون لكل بطاقة مادة
                    subjectsContainer.innerHTML += `
                        <div class="subject-mini-card animate-up" 
                             onclick="window.location.href='evaluation.html?subject=${subject}'">
                            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                                <span style="font-size:0.9rem; font-weight:700; color:#4a5568;">${subjectNamesAr[subject]}</span>
                                <span style="font-weight:800; color:#1a73e8;">${grade.toFixed(1)}%</span>
                            </div>
                            <div style="height:6px; background:#edf2f7; border-radius:3px; overflow:hidden;">
                                <div style="width:${grade}%; height:100%; background:linear-gradient(90deg, #1a73e8, #63b3ed); transition: width 1s ease-in-out;"></div>
                            </div>
                        </div>
                    `;
                }
            }
        }

        // ج. تحديث التقييم العام
        if (subjectsFound > 0) {
            const finalAvg = totalAllGrades / subjectsFound;
            const generalEl = document.getElementById("generalGrade");
            if (generalEl) generalEl.innerText = finalAvg.toFixed(1) + "%";
        }

    } catch (err) {
        console.error("خطأ في تحميل لوحة البيانات:", err);
    }
});

// --- الدوال الفرعية المساعدة ---

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
        <div class="schedule-item animate-fade" style="display:flex; justify-content:space-between; align-items:center; padding:12px 0; border-bottom:1px solid #eee;">
            <div class="sub-info">
                <div style="font-weight:700; color:#2c3e50;">${item.subject}</div>
                <div style="font-size:0.8rem; color:#7f8c8d;">${item.teacher}</div>
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

    weekContainer.innerHTML = `<div style="display:grid; grid-template-columns: repeat(5, 1fr); gap:5px; text-align:center;">
        ${days.map(d => `
            <div class="cal-day ${d.current ? 'active-day' : ''}">
                <div style="font-size:0.7rem;">${d.name}</div>
                <div style="font-size:0.8rem; font-weight:bold;">${d.date}</div>
            </div>
        `).join('')}
    </div>`;
}
