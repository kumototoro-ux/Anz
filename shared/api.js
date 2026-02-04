// shared/api.js

// ⚠️ استبدل الرابط أدناه برابط الـ Web App الذي حصلت عليه من قوقل (Deploy URL)
const SCRIPT_URL = "https://script.google.com/macros/s/XXXXX/exec"; 

/**
 * الدالة المركزية لجلب البيانات من أي ورقة في قوقل شيت
 */
async function fetchData(sheetName, nationalId, action = "get") {
    try {
        const url = `${SCRIPT_URL}?sheet=${sheetName}&id=${nationalId}&action=${action}`;
        const response = await fetch(url);
        
        if (!response.ok) throw new Error("Network response was not ok");
        
        const result = await response.json();
        return result;
    } catch (error) {
        console.error(`خطأ في جلب بيانات من ورقة ${sheetName}:`, error);
        return { found: false, error: true };
    }
}

/* =============================================
   الوظائف المخصصة لكل صفحة
============================================= */

// 1. تسجيل الدخول والبحث عن طالب (من ورقة ID)
export async function loginStudent(nationalId) {
    return await fetchData("ID", nationalId, "login");
}

// 2. جلب بيانات الغياب (من ورقة AB)
export async function getAttendance(nationalId) {
    return await fetchData("AB", nationalId);
}

// 3. جلب بيانات مادة معينة (Quran, Math, Science, etc.)
export async function getSubjectGrades(subjectSheet, nationalId) {
    return await fetchData(subjectSheet, nationalId);
}

// 4. جلب إشعارات النتائج (Notice_Term1 أو Notice_Term2)
export async function getTermNotice(termSheet, nationalId) {
    return await fetchData(termSheet, nationalId);
}

// 5. جلب الاختبارات الشهرية (Monthly_Test)
export async function getMonthlyTests(nationalId) {
    return await fetchData("Monthly_Test", nationalId);
}
