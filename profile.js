document.addEventListener("DOMContentLoaded", () => {
    // 1. جلب البيانات من الذاكرة
    const userData = JSON.parse(localStorage.getItem("user"));

    // 2. التحقق من وجود المستخدم (تم تصحيح اسم المتغير هنا)
    if (!user) { 
    window.location.href = "index.html"; // بدلاً من login.html
    return; 
}

    // 3. قائمة بالعناصر (يجب أن تطابق ID في HTML واسم العمود في قوقل شيت)
    const fields = [
        'ID', 'Name_AR', 'Name_EN', 'BirthDate', 
        'Nationality', 'Gender', 'StudentLevel', 
        'Class', 'Term', 'AcademicYear'
    ];

    // 4. توزيع البيانات تلقائياً
    fields.forEach(field => {
        const element = document.getElementById(`display_${field}`);
        if (element) {
            let value = userData[field];
            
            // معالجة خاصة للتاريخ
            if (field === 'BirthDate' && value) {
                const dateObj = new Date(value);
                if (!isNaN(dateObj)) {
                    value = dateObj.toLocaleDateString('ar-SA');
                }
            }
            
            element.textContent = value || "غير متوفر";
        }
    });
});
