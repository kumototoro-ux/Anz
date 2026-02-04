import { loginStudent } from "./api.js"; // تم التعديل هنا

document.addEventListener("DOMContentLoaded", () => {
    const loginForm = document.getElementById("loginForm");
    const idInput = document.getElementById("nationalId");
    const passInput = document.getElementById("password");
    const submitBtn = document.getElementById("submitBtn");

    loginForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        // جلب القيم وتنظيف الفراغات الجانبية فقط
        const userId = idInput.value.trim();
        const userPass = passInput.value.trim();

        if (!userId || !userPass) return;

        // تفعيل حالة التحميل
        submitBtn.disabled = true;
        submitBtn.querySelector('span').innerText = "جاري التحقق...";

        try {
            const result = await loginStudent(userId);

            if (result.found) {
                // التحقق من كلمة المرور (العمود Password في شيت ID)
                // نحول القيم لنصوص لضمان صحة المقارنة مهما كان نوعها في الشيت
                if (String(result.student.Password).trim() === userPass) {
                    
                    // حفظ بيانات الطالب بنجاح
                    localStorage.setItem("user", JSON.stringify(result.student));
                    
                    // التوجه للرئيسية
                    window.location.href = "home.html"; // تم التعديل هنا
                } else {
                    alert("⚠️ كلمة المرور غير صحيحة");
                    resetBtn();
                }
            } else {
                alert("⚠️ هذا المعرف غير مسجل في النظام");
                resetBtn();
            }
        } catch (error) {
            alert("❌ فشل الاتصال بالسيرفر، تأكد من إعدادات الـ API");
            resetBtn();
        }
    });

    function resetBtn() {
        submitBtn.disabled = false;
        submitBtn.querySelector('span').innerText = "دخول آمن";
        passInput.value = ""; // مسح الباسورد للأمان
    }
});
