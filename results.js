import { getStudentData } from "./api.js";

document.addEventListener("DOMContentLoaded", () => {
    const user = JSON.parse(localStorage.getItem("user"));
    document.getElementById("userGreeting").innerText = `مرحباً، ${user.name_ar}`;

    const buttons = document.querySelectorAll(".term-btn");
    buttons.forEach(btn => {
        btn.addEventListener("click", () => fetchResults(btn.getAttribute("data-term"), user.id));
    });
});

async function fetchResults(tableName, studentId) {
    // إخفاء الأقسام السابقة
    document.getElementById("certificateArea").classList.add("hide");
    document.getElementById("errorArea").classList.add("hide");

    const res = await getStudentData(tableName, studentId);

    if (res.success && res.data) {
        showCertificate(res.data, tableName);
    } else {
        document.getElementById("errorArea").classList.remove("hide");
    }
}

function showCertificate(data, term) {
    const tbody = document.getElementById("resultsBody");
    tbody.innerHTML = "";
    
    document.getElementById("certTermName").innerText = (term === "notice_term1") ? "الفصل الدراسي الأول" : "الفصل الدراسي الثاني";

    // تصفية الأعمدة لعرض المواد فقط (تجنب id و student_id)
    const entries = Object.entries(data);
    let total = 0;
    let count = 0;

    entries.forEach(([key, value]) => {
        if (key !== "id" && key !== "student_id" && key !== "created_at") {
            tbody.innerHTML += `<tr><td>${key}</td><td>${value || 'لم ترصد'}</td></tr>`;
            if(!isNaN(value)) {
                total += parseFloat(value);
                count++;
            }
        }
    });

    document.getElementById("totalScore").innerText = total;
    document.getElementById("averageScore").innerText = count > 0 ? (total / count).toFixed(2) : "-";
    
    document.getElementById("certificateArea").classList.remove("hide");
}
