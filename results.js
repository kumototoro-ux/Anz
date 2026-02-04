import { getTermNotice } from "../../shared/api.js";

document.addEventListener("DOMContentLoaded", () => {
    // 1. التأكد من هوية الطالب المسجل
    const user = JSON.parse(localStorage.getItem("user"));
    if (!user) { 
        window.location.href = "../login/login.html"; 
        return; 
    }

    const termButtons = document.querySelectorAll(".term-btn");
    
    // تحميل الفصل الأول تلقائياً عند فتح الصفحة
    loadResults("Notice_Term1");

    // التنقل بين الفصل الأول والثاني
    termButtons.forEach(btn => {
        btn.addEventListener("click", (e) => {
            termButtons.forEach(b => b.classList.remove("active"));
            e.target.classList.add("active");
            loadResults(e.target.dataset.term);
        });
    });

    // دالة جلب البيانات من Google Sheets
    async function loadResults(termSheet) {
        document.getElementById("certificate").classList.add("hidden");
        document.getElementById("errorMessage").classList.add("hidden");

        const result = await getTermNotice(termSheet, user.ID);

        // نتحقق من وجود بيانات (الاعتماد على وجود قيمة في خانة الحضور كدليل على الرصد)
        if (result.found && result.data && result.data.Attendance !== undefined) {
            displayCertificate(result.data, termSheet);
        } else {
            // عرض رسالة الدعم الفني في حال عدم توفر البيانات
            document.getElementById("errorMessage").classList.remove("hidden");
        }
    }

    // دالة بناء الشهادة وعرض المواد
    function displayCertificate(data, termSheet) {
        document.getElementById("certificate").classList.remove("hidden");
        document.getElementById("certName").textContent = user.Name_AR;
        document.getElementById("certId").textContent = user.ID;
        document.getElementById("certClass").textContent = user.Class;
        document.getElementById("currentTermTitle").textContent = 
            termSheet === "Notice_Term1" ? "إشعار نتائج الفصل الدراسي الأول" : "إشعار نتائج الفصل الدراسي الثاني";

        // قائمة المواد الـ 11 الأساسية المشتركة بين الجميع
        const subjects = [
            { name: "القرآن الكريم", key: "Quran" },
            { name: "الدراسات الإسلامية", key: "Islamic" },
            { name: "اللغة العربية", key: "Arabic" },
            { name: "الدراسات الاجتماعية", key: "Social" },
            { name: "الرياضيات", key: "Math" },
            { name: "العلوم", key: "Science" },
            { name: "اللغة الإنجليزية", key: "English" },
            { name: "المهارات الرقمية", key: "Digital" },
            { name: "التربية الفنية", key: "Art" },
            { name: "التربية البدنية والصحية", key: "PE" },
            { name: "المهارات الحياتية والأسرية", key: "Life" }
        ];

        // 🌟 المنطق الذكي: إضافة التفكير الناقد فقط لطلاب الثالث متوسط
        if (user.Class === "الثالث متوسط") {
            subjects.push({ name: "التفكير الناقد", key: "Critical" });
        }

        const tbody = document.getElementById("resultsBody");
        tbody.innerHTML = "";

        // معالجة البيانات لكل مادة
        subjects.forEach(sub => {
            // جلب الدرجات مع التحقق من المسميات المختلفة (CW, Short, Oral, Final, Written)
            const cw = parseFloat(data[`${sub.key}_CW`]) || 0;
            const short = parseFloat(data[`${sub.key}_Short`]) || parseFloat(data[`${sub.key}_Oral`]) || 0;
            const final = parseFloat(data[`${sub.key}_Final`]) || parseFloat(data[`${sub.key}_Written`]) || 0;
            
            const total = cw + short + final;

            const row = `
                <tr>
                    <td class="subject-name">${sub.name}</td>
                    <td>${cw}</td>
                    <td>${short}</td>
                    <td>${final}</td>
                    <td class="total-cell">${total}</td>
                    <td class="grade-cell">${getGrade(total)}</td>
                </tr>
            `;
            tbody.innerHTML += row;
        });

        // تحديث الغياب والسلوك في أسفل الشهادة
        document.getElementById("certAttendance").textContent = data.Attendance || "0";
        document.getElementById("certBehavior").textContent = data.Behavior || "0";
    }

    // دالة تحديد التقدير
    function getGrade(score) {
        if (score >= 95) return "ممتاز مرتفع";
        if (score >= 90) return "ممتاز";
        if (score >= 85) return "جيد جداً مرتفع";
        if (score >= 80) return "جيد جداً";
        if (score >= 75) return "جيد مرتفع";
        if (score >= 70) return "جيد";
        if (score >= 60) return "مقبول";
        return "ضعيف";
    }
});
