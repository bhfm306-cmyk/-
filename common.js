// تحويل الأرقام العربية (الهندية) إلى أرقام إنجليزية تلقائياً عند الكتابة
const easternNumbers = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];

document.addEventListener('input', function(e) {
    // تطبيق التحويل على حقول الإدخال النصية وحقول الأرقام وكلمات المرور
    if (e.target.tagName === 'INPUT') {
        let val = e.target.value;
        let originalVal = val;
        
        for (let i = 0; i < 10; i++) {
            val = val.split(easternNumbers[i]).join(i);
        }
        
        // تحديث قيمة الحقل فقط إذا حدث تغيير
        if (val !== originalVal) {
            e.target.value = val;
        }
    }
});