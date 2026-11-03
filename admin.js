let allStudents = [];
let filteredStudents = [];

const loginSection = document.getElementById('login');
const panelSection = document.getElementById('panel');
const form = document.getElementById('f');
const errDiv = document.getElementById('err');
const submitBtn = form.querySelector('button[type="submit"]');
const cardsGrid = document.getElementById('cards');
const statsGrid = document.getElementById('stats');
const searchInput = document.getElementById('q');
const gradeSelect = document.getElementById('g');
const countBadge = document.getElementById('cnt');

form.addEventListener('submit', async (e) => {
    e.preventDefault();
    submitBtn.disabled = true;
    submitBtn.innerHTML = 'جاري التحقق...';
    errDiv.style.display = 'none';

    const adminUser = document.getElementById('u').value;
    const adminPass = document.getElementById('p').value;

    if (adminUser === 'admin' && adminPass === 'Rowad@2026') {
        loginSection.style.display = 'none';
        panelSection.style.display = 'block';
        await fetchStudentsData();
    } else {
        errDiv.style.display = 'block';
        errDiv.innerHTML = 'اسم المستخدم أو كلمة المرور غير صحيحة.';
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'دخول آمن';
    }
});

async function fetchStudentsData() {
    try {
        const response = await fetch('/.netlify/functions/api');
        const result = await response.json();

        if (result.success) {
            allStudents = result.data;
            filteredStudents = [...allStudents];
            populateGradeFilter();
            updateDashboard();
        } else {
            throw new Error('فشل جلب البيانات');
        }
    } catch (error) {
        console.error(error);
        alert("فشل في تحميل بيانات الطلاب. يرجى التأكد من اتصال الخادم.");
    }
}

function populateGradeFilter() {
    const grades = new Set(allStudents.map(s => s.grade).filter(g => g));
    gradeSelect.innerHTML = '<option value="">كل الصفوف</option>';
    grades.forEach(grade => {
        const option = document.createElement('option');
        option.value = grade; option.textContent = `الصف ${grade}`;
        gradeSelect.appendChild(option);
    });
}

function updateDashboard() {
    const total = allStudents.length;
    const classeraCount = allStudents.filter(s => s.classeraUser).length;
    const teamsCount = allStudents.filter(s => s.teamsUser).length;

    statsGrid.innerHTML = `
        <div class="stat-card"><h4>إجمالي الطلاب</h4><span>${total}</span></div>
        <div class="stat-card"><h4>حسابات كلاسيرا</h4><span>${classeraCount}</span></div>
        <div class="stat-card"><h4>حسابات تيمز</h4><span>${teamsCount}</span></div>
    `;

    cardsGrid.innerHTML = '';
    filteredStudents.forEach(student => {
        if (student.classeraUser) cardsGrid.innerHTML += createCardHTML(student, 'classera');
        if (student.teamsUser) cardsGrid.innerHTML += createCardHTML(student, 'teams');
    });
    countBadge.textContent = `العدد: ${filteredStudents.length}`;
}

function createCardHTML(student, type) {
    let title = type === 'classera' ? 'حساب كلاسيرا' : 'حساب تيمز';
    let user = type === 'classera' ? student.classeraUser : student.teamsUser;
    let pass = type === 'classera' ? student.classeraPass : student.teamsPass;
    let colorCode = type === 'classera' ? 'var(--color-primary)' : 'var(--color-accent)';

    return `
        <div style="background: #fff; padding: 4mm; color: #000;">
            <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid ${colorCode}; padding-bottom: 5px; margin-bottom: 8px;">
                 <span style="font-size: 0.7rem; font-weight: bold;">مدارس الرواد - قرطبة</span>
                 <span style="background: ${colorCode}; color: #fff; padding: 2px 6px; border-radius: 4px; font-size: 0.7rem;">${title}</span>
            </div>
            <div style="margin-bottom: 8px;">
                <div style="font-size: 0.9rem; font-weight: bold;">${student.name}</div>
                <div style="font-size: 0.75rem; color: #555;">الصف: ${student.grade} | الفصل: ${student.class}</div>
            </div>
            <div style="background: #f8f9fa; border: 1px solid #e2e8f0; border-radius: 6px; padding: 6px;">
                 <div style="margin-bottom: 4px; font-size: 0.8rem;"><span style="color: #666; display: inline-block; width: 65px;">المستخدم:</span> <strong style="font-family: sans-serif;">${user}</strong></div>
                 <div style="font-size: 0.8rem;"><span style="color: #666; display: inline-block; width: 65px;">المرور:</span> <strong style="font-family: sans-serif;">${pass}</strong></div>
            </div>
        </div>
    `;
}

searchInput.addEventListener('input', applyFilters);
gradeSelect.addEventListener('change', applyFilters);

function applyFilters() {
    const query = searchInput.value.toLowerCase();
    const grade = gradeSelect.value;
    filteredStudents = allStudents.filter(s => {
        return (s.name.toLowerCase().includes(query) || (s.id && s.id.includes(query))) && (grade === "" || s.grade === grade);
    });
    updateDashboard();
}

if (document.getElementById('prt')) document.getElementById('prt').addEventListener('click', () => window.print());
if (document.getElementById('out')) document.getElementById('out').addEventListener('click', () => window.location.reload());