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

    // 3. مصفوفة المواد (حسب جداولك في Supabase)
    const subjectTables = [
        'Arabic', 'Art', 'Critical', 'Digital', 'English', 'Islamic', 
        'Life', 'Math', 'PE', 'Quran', 'Science', 'Social'
    ];

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

                    // إنشاء أشرطة الرسم البياني
                    chartHTML += `
                        <div class="week-stat" style="margin-bottom: 10px;">
                            <div style="display:flex; justify-content:space-between; font-size:0.8rem; margin-bottom:4px;">
                                <span>الأسبوع ${i}</span>
                                <span style="font-weight:bold;">${attended} ح / 15</span>
                            </div>
                            <div style="height:8px; background:#eee; border-radius:4px; overflow:hidden; display:flex;">
                                <div style="width:${(attended/15)*100}%; background:#4CAF50;"></div>
                                <div style="width:${(absent/15)*100}%; background:#f44336;"></div>
                            </div>
                        </div>
                    `;
                }
            }
            // تحديث البطاقة في HTML
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

        // تنظيف الحاوية قبل الإضافة
        if (subjectsContainer) subjectsContainer.innerHTML = '';

        for (const subject of subjectTables) {
            const res = await getStudentData(subject, studentId);
            
            if (res.success) {
                const grade = calcGrade(subject, res.data);
                totalAllGrades += grade;
                subjectsFound++;

                // إضافة البطاقة تلقائياً للواجهة
                if (subjectsContainer) {
                    subjectsContainer.innerHTML += `
                        <div class="subject-mini-card" style="background:#fff; padding:12px; border-radius:10px; border:1px solid #eee; box-shadow: 0 2px 4px rgba(0,0,0,0.02);">
                            <div style="font-size:0.75rem; color:#888; margin-bottom:5px;">${subject}</div>
                            <div style="font-size:1.1rem; font-weight:800; color:#34495e;">${grade.toFixed(1)}%</div>
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
        <div class="schedule-item" style="display:flex; justify-content:space-between; align-items:center; padding:10px 0; border-bottom:1px solid #eee;">
            <div class="sub-info">
                <div style="font-weight:700; color:#2c3e50;">${item.subject}</div>
                <div style="font-size:0.8rem; color:#7f8c8d;">${item.teacher}</div>
            </div>
            <div style="background:#e8f4fd; color:#3498db; padding:4px 10px; border-radius:20px; font-size:0.8rem;">${item.time}</div>
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
            <div style="padding:10px 5px; border-radius:8px; ${d.current ? 'background:#3498db; color:#fff;' : 'background:#f8f9fa;'}">
                <div style="font-size:0.7rem;">${d.name}</div>
                <div style="font-size:0.8rem; font-weight:bold;">${d.date}</div>
            </div>
        `).join('')}
    </div>`;
}
