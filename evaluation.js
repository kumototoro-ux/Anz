import { getStudentData } from "./api.js";

let generalChart, subjectChart;

document.addEventListener("DOMContentLoaded", () => {
    initSelectors();
    loadGeneralData(); // تحميل التقييم العام افتراضياً
    
    document.getElementById("subjectWeekSelect").addEventListener("change", loadSubjectDetail);
    document.getElementById("subjectSelect").addEventListener("change", loadSubjectDetail);
});

// تعبئة الأسابيع من 1 لـ 12
function initSelectors() {
    const selects = ["generalWeekSelect", "subjectWeekSelect"];
    selects.forEach(id => {
        const el = document.getElementById(id);
        for(let i=1; i<=12; i++) {
            el.innerHTML += `<option value="${i}">الأسبوع ${i}</option>`;
        }
    });
}

// دالة تحليل الرسائل التشجيعية (ذكاء اصطناعي بسيط)
function getMotivation(score, type) {
    if (score >= 4.5) return "مذهل! أنت بطل هذا الأسبوع في " + type + ". استمر في التحليق!";
    if (score >= 3.5) return "أداء رائع في " + type + ". قليل من التركيز وتصل للدرجة الكاملة.";
    if (score > 0) return "بداية جيدة في " + type + ". ثق بنفسك وحاول مرة أخرى لتتحسن.";
    return "لم يتم رصد تقييم بعد. استعد جيداً!";
}

async function loadSubjectDetail() {
    const user = JSON.parse(localStorage.getItem("user"));
    const subject = document.getElementById("subjectSelect").value;
    const week = document.getElementById("subjectWeekSelect").value;
    
    const res = await getStudentData(subject, user.id);
    
    if (res.success) {
        const data = res.data;
        let scores = [];
        let labels = [];

        // المنطق الخاص بالقرآن الكريم
        if (subject === 'quran') {
            const pr = week <= 6 ? data.PR_1 : data.PR_2;
            scores = [pr, data[`HW_${week}`], data[`read_${week}`], data[`Taj_${week}`], data[`save_${week}`]];
            labels = ["المشاركة", "الواجب", "القراءة", "التجويد", "الحفظ"];
        } else {
            // بقية المواد
            const pr = week <= 6 ? data.PR_1 : data.PR_2;
            scores = [pr, data[`HW_${week}`], data[`QZ_${week}`]];
            labels = ["المشاركة", "الواجب", "الاختبار القصير"];
        }

        renderSubjectChart(labels, scores);
        updateMotivationalMessage(scores, labels);
    }
}

function renderSubjectChart(labels, scores) {
    const ctx = document.getElementById('subjectChart').getContext('2d');
    if (subjectChart) subjectChart.destroy();

    subjectChart = new Chart(ctx, {
        type: 'radar', // رادار شارت يعطي شكلاً رهيباً للتقييم
        data: {
            labels: labels,
            datasets: [{
                label: 'مستوى الأداء',
                data: scores,
                backgroundColor: 'rgba(26, 115, 232, 0.2)',
                borderColor: '#1a73e8',
                borderWidth: 2
            }]
        },
        options: {
            scales: { r: { max: 5, min: 0, ticks: { stepSize: 1 } } },
            plugins: { legend: { display: false } }
        }
    });
}

function updateMotivationalMessage(scores, labels) {
    const avg = scores.filter(s => s != null).reduce((a,b) => a+b, 0) / scores.length;
    const textEl = document.getElementById("motivationalText");
    const banner = document.getElementById("motivationalMessage");
    
    textEl.innerText = getMotivation(avg, "هذه المادة");
    banner.style.background = avg >= 4 ? "#e6f4ea" : "#e8f0fe";
}
