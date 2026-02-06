// login.js
import { loginUser } from "./api.js";

const CONFIG = {
    systemName: "نظام مقياس التعليمي",
    contact: "9665XXXXXXXX"
};

document.addEventListener("DOMContentLoaded", () => {
    // تعبئة البيانات الأساسية
    const systemNameEl = document.getElementById("system-name");
    const supportNumEl = document.getElementById("support-number");
    const errorDiv = document.getElementById("errorMessage");

    if (systemNameEl) systemNameEl.innerText = CONFIG.systemName;
    if (supportNumEl) supportNumEl.innerText = CONFIG.contact;

    const loginForm = document.getElementById("loginForm");

    loginForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        
        // مسح بيانات الجلسة القديمة لضمان دخول نظيف
        localStorage.removeItem("user");
        if (errorDiv) errorDiv.style.display = 'none';
        
        const id = document.getElementById("studentId").value.trim();
        const pass = document.getElementById("password").value.trim();
        
        const btn = document.querySelector(".login-btn");
        const originalText = btn.innerHTML;
        
        btn.innerHTML = "<span>جاري الدخول...</span>";
        btn.disabled = true;

        try {
            const response = await loginUser(id, pass);
            
            if (response.found) {
                // حفظ بيانات الطالب كاملة (التي تحتوي على ID و Name_AR)
                localStorage.setItem("user", JSON.stringify(response.student));
                window.location.href = "home.html";
            } else {
                // إظهار رسالة الخطأ في العنصر المخصص بدلاً من الـ Alert
                if (errorDiv) {
                    errorDiv.innerText = "رقم الهوية أو كلمة المرور غير صحيحة";
                    errorDiv.style.display = 'block';
                } else {
                    alert("تأكد من بيانات الدخول");
                }
                btn.innerHTML = originalText;
                btn.disabled = false;
            }
        } catch (error) {
            console.error("Login error:", error);
            if (errorDiv) {
                errorDiv.innerText = "حدث خطأ في الاتصال بالسيرفر";
                errorDiv.style.display = 'block';
            }
            btn.innerHTML = originalText;
            btn.disabled = false;
        }
    });
});
