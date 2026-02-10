import { getStudentData } from './api.js';

const MAX_SESSIONS = 15;
let globalData = null;

async function init() {
    const user = JSON.parse(localStorage.getItem("user"));
    if (!user) { window.location.href = 'index.html'; return; }

    // جلب القائمة الجانبية
    const sidebarRes = await fetch('sidebar.html');
    const sidebarData = await sidebarRes.text();
    document.getElementById('sidebar-container').innerHTML = sidebarData;
    
    activateSidebar();

    // جلب بيانات الغياب
    const res = await getStudentData('AB', user.ID);
    if (res.success) {
        globalData = res.data;
        renderAnalytics(globalData);
        populateSelector(globalData);
    }
}

function renderAnalytics(data) {
    let labels = [];
    let values = [];
    let totalAbsent = 0;

    for (let i = 1; i <= 14; i++) {
        if (data[i] !== null && data[i] !== undefined && data[i] !== "") {
            let present = parseInt(data[i]);
            labels.push(`أسبوع ${i}`);
            values.push(present);
            totalAbsent += (MAX_SESSIONS - present);
        }
    }

    updateChart(labels, values); // هذه دالتك الأصلية
    setSmartAlert(totalAbsent);  // هذه دالتك الأصلية التي تلون المربع
}

function setSmartAlert(total) {
    const box = document.getElementById('smart-alert');
    let title, msg, cssClass, btn = "";

    if (total >= 80) {
        title = "القائمة السوداء";
        msg = "سيتم نقلك للانتساب. تواصل مع المشرف العام فوراً.";
        cssClass = "status-critical";
        btn = `<a href="https://wa.me/966XXXXXXXXX" class="btn btn-light w-100 mt-3 fw-bold">واتساب المشرف</a>`;
    } else if (total >= 40) {
        title = "إنذار ثالث";
        msg = "تجاوزت 40 حصة غياب. تواصل مع الإدارة.";
        cssClass = "bg-danger text-white";
        btn = `<a href="https://wa.me/966XXXXXXXXX" class="btn btn-outline-light w-100 mt-3">تواصل الآن</a>`;
    } else if (total >= 20) {
        title = "تنبيه غياب";
        msg = "وصل غيابك لـ 20 حصة، يرجى الالتزام.";
        cssClass = "bg-warning text-dark";
    } else {
        title = "حضور متميز";
        msg = "أداؤك ممتاز في الحضور، استمر!";
        cssClass = "bg-success text-white";
    }

    box.className = `alert-box rounded-4 p-4 text-center ${cssClass}`;
    box.innerHTML = `
        <h4 class="fw-bold">${title}</h4>
        <div class="display-5 fw-bold">${total}</div>
        <p class="small">إجمالي الحصص الغائبة</p>
        <hr>
        <p class="small mb-0">${msg}</p>
        ${btn}
    `;
}

function populateSelector(data) {
    const select = document.getElementById('weekSelector');
    // إضافة الأسابيع التي تحتوي بيانات فقط
    for (let i = 1; i <= 14; i++) {
        if (data[i] !== null && data[i] !== "") {
            let opt = document.createElement('option');
            opt.value = i;
            opt.textContent = `الأسبوع الدراسي ${i}`;
            select.appendChild(opt);
        }
    }

    select.addEventListener('change', (e) => {
        const week = e.target.value;
        const view = document.getElementById('week-detail-view');
        if (week) {
            const p = parseInt(data[week]);
            document.getElementById('week-present').innerText = p;
            document.getElementById('week-absent').innerText = MAX_SESSIONS - p;
            view.classList.remove('d-none');
        } else {
            view.classList.add('d-none');
        }
    });
}

function updateChart(labels, values) {
    const ctx = document.getElementById('attendanceChart').getContext('2d');
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'عدد حصص الحضور',
                data: values,
                borderColor: '#4e73df',
                backgroundColor: 'rgba(78, 115, 223, 0.1)',
                fill: true,
                tension: 0.3
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: { y: { min: 0, max: 15 } }
        }
    });
}

document.addEventListener('DOMContentLoaded', init);

// تعريف دالة تشغيل القائمة داخل ملف الغياب نفسه
function activateSidebar() {
    const menuBtn = document.getElementById('menuToggle');
    const sideNav = document.getElementById('sideNav');
    const overlay = document.getElementById('sidebarOverlay');

    if (menuBtn && sideNav) {
        menuBtn.onclick = () => {
            sideNav.classList.add('active');
            if (overlay) overlay.classList.add('active');
        };
    }
    if (overlay) {
        overlay.onclick = () => {
            sideNav.classList.remove('active');
            overlay.classList.remove('active');
        };
    }
}
