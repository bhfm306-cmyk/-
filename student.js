const MAX_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 15;
let failedAttempts = parseInt(localStorage.getItem('failed_attempts') || '0');
let lockUntil = parseInt(localStorage.getItem('lock_until') || '0');

const form = document.getElementById('f');
const errDiv = document.getElementById('err');
const submitBtn = form.querySelector('button[type="submit"]');
const passInput = document.getElementById('p');
const eyeBtn = document.getElementById('eye');

if(eyeBtn) {
    eyeBtn.addEventListener('click', () => {
        const type = passInput.getAttribute('type') === 'password' ? 'text' : 'password';
        passInput.setAttribute('type', type);
        eyeBtn.innerHTML = type === 'password' 
            ? `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>`
            : `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>`;
    });
}

function showError(message, isLocked = false) {
    errDiv.style.display = 'block';
    errDiv.className = isLocked ? 'error-msg locked' : 'error-msg';
    errDiv.innerHTML = isLocked ? `🔒 ${message}` : message;
}

function checkLockStatus() {
    const now = new Date().getTime();
    if (lockUntil > now) {
        const remainingMinutes = Math.ceil((lockUntil - now) / 60000);
        showError(`تم حظر الجهاز مؤقتاً. حاول مجدداً بعد ${remainingMinutes} دقيقة.`, true);
        submitBtn.disabled = true;
        submitBtn.style.opacity = '0.5';
        return true;
    } else if (lockUntil > 0 && lockUntil <= now) {
        localStorage.removeItem('failed_attempts');
        localStorage.removeItem('lock_until');
        failedAttempts = 0; lockUntil = 0;
        submitBtn.disabled = false; submitBtn.style.opacity = '1';
        errDiv.style.display = 'none';
    }
    return false;
}
checkLockStatus();

function buildStudentCards(student) {
    const cardsGrid = document.getElementById('cards');
    cardsGrid.innerHTML = '';
    
    // بناء بطاقة كلاسيرا
    if (student.classeraUser) {
        cardsGrid.innerHTML += createCardHTML(student, 'classera');
    }
    // بناء بطاقة تيمز
    if (student.teamsUser) {
        cardsGrid.innerHTML += createCardHTML(student, 'teams');
    }
}

function createCardHTML(student, type) {
    let title, user, pass, colorCode;
    if (type === 'classera') {
        title = "حساب كلاسيرا"; user = student.classeraUser; pass = student.classeraPass; colorCode = "var(--color-primary)";
    } else {
        title = "حساب تيمز"; user = student.teamsUser; pass = student.teamsPass; colorCode = "var(--color-accent)";
    }
    return `
        <div style="background: #fff; padding: 10px; border-radius: 8px; color: #000;">
            <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid ${colorCode}; padding-bottom: 5px; margin-bottom: 8px;">
                 <span style="font-size: 0.7rem; font-weight: bold; color: #333;">مدارس الرواد - قرطبة</span>
                 <span style="background: ${colorCode}; color: #fff; padding: 2px 6px; border-radius: 4px; font-size: 0.7rem; font-weight: bold;">${title}</span>
            </div>
            <div style="margin-bottom: 8px;">
                <div style="font-size: 0.9rem; font-weight: bold;">${student.name}</div>
                <div style="font-size: 0.75rem; color: #555;">الصف: ${student.grade} | الفصل: ${student.class}</div>
            </div>
            <div style="background: #f8f9fa; border: 1px solid #e2e8f0; border-radius: 6px; padding: 6px;">
                 <div style="margin-bottom: 4px; font-size: 0.8rem;">
                     <span style="color: #666; display: inline-block; width: 65px;">المستخدم:</span> 
                     <strong style="color: #111; font-family: sans-serif;">${user}</strong>
                 </div>
                 <div style="font-size: 0.8rem;">
                     <span style="color: #666; display: inline-block; width: 65px;">المرور:</span> 
                     <strong style="color: #111; font-family: sans-serif;">${pass}</strong>
                 </div>
            </div>
        </div>
    `;
}

form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (checkLockStatus()) return;

    submitBtn.disabled = true;
    submitBtn.innerHTML = 'جاري التحقق...';
    errDiv.style.display = 'none';

    try {
        const username = document.getElementById('u').value.trim();
        const password = document.getElementById('p').value.trim();

        const response = await fetch('/.netlify/functions/api', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        
        const result = await response.json();

        if (response.ok && result.success) {
            localStorage.removeItem('failed_attempts'); failedAttempts = 0;
            document.getElementById('login').style.display = 'none';
            document.getElementById('view').style.display = 'block';
            document.getElementById('who').innerText = `أهلاً بك يا بطل: ${result.data.name}`;
            buildStudentCards(result.data);
        } else {
            failedAttempts++;
            localStorage.setItem('failed_attempts', failedAttempts);
            if (failedAttempts >= MAX_ATTEMPTS) {
                const lockTime = new Date().getTime() + (LOCKOUT_MINUTES * 60000);
                localStorage.setItem('lock_until', lockTime.toString());
                lockUntil = lockTime;
                checkLockStatus();
            } else {
                showError(result.message || `بيانات غير صحيحة. تبقى ${MAX_ATTEMPTS - failedAttempts} محاولات.`);
            }
        }
    } catch (error) {
        showError('حدث خطأ في الاتصال بالخادم.');
    } finally {
        if (!checkLockStatus()) { submitBtn.disabled = false; submitBtn.innerHTML = 'تسجيل الدخول'; }
    }
});

if(document.getElementById('prt')) document.getElementById('prt').addEventListener('click', () => window.print());
if(document.getElementById('out')) document.getElementById('out').addEventListener('click', () => window.location.reload());