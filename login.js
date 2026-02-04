import { loginUser } from "./api.js";

// --- إعدادات قابلة للتعديل بسهولة ---
const SYSTEM_NAME = "نظام مقياس التعليمي"; // اسم النظام
const SUPPORT_CONTACT = "9665XXXXXXXX"; // رقم التواصل
// ----------------------------------

document.addEventListener("DOMContentLoaded", () => {
    // تحديث اسم النظام ورقم التواصل في الواجهة تلقائياً
    if(document.getElementById("system-name")) {
        document.getElementById("system-name").innerText = SYSTEM_NAME;
    }
    
    const loginForm = document.getElementById("loginForm");
    
    loginForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        
        const studentId = document.getElementById("studentId").value.trim();
        const password = document.getElementById("password").value.trim();
        
        // إظهار مؤشر تحميل (Loading) بلمسة جوجل
        const loginBtn = document.querySelector(".login-btn");
        loginBtn.innerText = "جاري التحقق...";
        loginBtn.disabled = true;

        const response = await loginUser(studentId, password);

        if (response.found) {
            // حفظ بيانات الطالب في المتصفح للانتقال بين الصفحات
            localStorage.setItem("user", JSON.stringify(response.student));
            localStorage.setItem("system_name", SYSTEM_NAME);
            
            window.location.href = "home.html"; // الانتقال للصفحة الرئيسية
        } else {
            alert("عذراً، رقم الهوية أو كلمة المرور غير صحيحة");
            loginBtn.innerText = "دخول";
            loginBtn.disabled = false;
        }
    });
});
