document.addEventListener("DOMContentLoaded", () => {
    // جلب بيانات الطالب المخزنة
    const userData = JSON.parse(localStorage.getItem("user"));

    if (!userData) {
        window.location.href = "index.html";
        return;
    }

    // تعبئة البيانات في الصفحة
    document.getElementById("fullName").innerText = userData.name_ar || "اسم الطالب";
    document.getElementById("infoId").innerText = userData.id;
    document.getElementById("infoClass").innerText = userData.class || "غير محدد";
    document.getElementById("infoYear").innerText = userData.academic_year || "2026";
    document.getElementById("infoPhone").innerText = userData.phone || "لا يوجد رقم مسجل";

    // تحديث الصورة الرمزية بالحروف الأولى من الاسم
    const avatarImg = document.getElementById("userAvatar");
    const initials = userData.name_ar ? userData.name_ar.split(' ').map(n => n[0]).join('') : "U";
    avatarImg.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(userData.name_ar)}&background=1a73e8&color=fff&size=128`;
});
