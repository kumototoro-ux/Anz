// login.js
import { loginUser } from "./api.js";

// متغيرات سهلة التعديل
const CONFIG = {
    systemName: "نظام مقياس التعليمي",
    contact: "9665XXXXXXXX"
};

document.addEventListener("DOMContentLoaded", () => {
    // تعبئة البيانات الأساسية
    document.getElementById("system-name").innerText = CONFIG.systemName;
    document.getElementById("support-number").innerText = CONFIG.contact;

    const loginForm = document.getElementById("loginForm");

    loginForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        
        const id = document.getElementById("studentId").value;
        const pass = document.getElementById("password").value;
        
        const btn = document.querySelector(".login-btn");
        btn.innerText = "جاري الدخول...";
        btn.disabled = true;

        try {
            const response = await loginUser(id, pass);
            
            if (response.found) {
                // حفظ بيانات الطالب في الجلسة
                localStorage.setItem("user", JSON.stringify(response.student));
                // الانتقال للصفحة الرئيسية
                window.location.href = "home.html";
            } else {
                alert("تأكد من بيانات الدخول");
                btn.innerText = "دخول";
                btn.disabled = false;
            }
        } catch (error) {
            console.error("Login error:", error);
            btn.innerText = "دخول";
            btn.disabled = false;
        }
    });
});
