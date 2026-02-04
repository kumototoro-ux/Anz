document.addEventListener("DOMContentLoaded", () => {
    // 1. جلب البيانات من الذاكرة
    const userData = JSON.parse(localStorage.getItem("user"));

    // 2. التحقق من وجود المستخدم
    if (!user) { window.location.href = "login.html"; return; } // تعديل المسار

    // 3. قائمة بالعناصر التي نريد تحديثها (يجب أن تطابق ID في HTML واسم العمود في قوقل شيت)
    const fields = [
        'ID', 'Name_AR', 'Name_EN', 'BirthDate', 
        'Nationality', 'Gender', 'StudentLevel', 
        'Class', 'Term', 'AcademicYear'
    ];

    // 4. توزيع البيانات تلقائياً
    fields.forEach(field => {
        const element = document.getElementById(`display_${field}`);
        if (element) {
            // معالجة خاصة للتاريخ إذا ظهر بشكل غريب من قوقل شيت
            let value = userData[field];
            if (field === 'BirthDate' && value) {
                value = new Date(value).toLocaleDateString('ar-SA');
            }
            element.textContent = value || "غير متوفر";
        }
    });
});
