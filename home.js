document.addEventListener("DOMContentLoaded", () => {
    // 1. جلب البيانات من الذاكرة
    const userData = JSON.parse(localStorage.getItem("user"));

    // 2. التحقق: لو حاول أحد دخول الصفحة بدون تسجيل دخول يرجعه لصفحة Login
    if (!userData) {
        window.location.href = "../login/login.html";
        return;
    }

    // 3. عرض البيانات في الواجهة
    document.getElementById("welcomeMessage").textContent = `أهلاً بك، ${userData.Name_AR}`;
    document.getElementById("studentInfo").textContent = `${userData.StudentLevel} - ${userData.Class} | ${userData.Term}`;

    // 4. وظيفة تسجيل الخروج
    document.getElementById("logoutBtn").addEventListener("click", () => {
        localStorage.removeItem("user"); // مسح بيانات الطالب من الذاكرة
        window.location.href = "../login/login.html";
    });
});
