import fetch from 'node-fetch';

// يجب أن تضع هذه المتغيرات في إعدادات Netlify (Environment Variables)
// لحماية بياناتك، لكن للتبسيط يمكنك وضعها هنا مباشرة إذا كان الحساب غير حساس جداً.
// احصل على مفتاح الـ API من Google Cloud Console
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY || 'ضع_مفتاح_API_الخاص_بك_هنا'; 
// احصل على معرف الشيت من رابط ملف الإكسل بعد /d/ وقبل /edit
const SPREADSHEET_ID = process.env.SPREADSHEET_ID || 'ضع_معرف_الشيت_الخاص_بك_هنا';
const RANGE = 'Students Data!A2:I'; // اسم الورقة والنطاق (من الصف الثاني لتجاوز العناوين)

export async function handler(event, context) {
    // 1. السماح بالطلبات (CORS)
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Content-Type': 'application/json'
    };

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    try {
        // 2. جلب البيانات من Google Sheets API
        const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${RANGE}?key=${GOOGLE_API_KEY}`;
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`Google Sheets API Error: ${response.statusText}`);
        }

        const data = await response.json();
        const rows = data.values || [];

        // 3. تحويل المصفوفات (الصفوف) إلى كائنات (Objects) مهيكلة للواجهة
        const students = rows.map(row => ({
            id: row[0] ? row[0].trim() : '',              // الهوية
            phone: row[1] ? row[1].trim() : '',           // الجوال
            name: row[2] || '',                           // الاسم
            grade: row[3] || '',                          // الصف
            class: row[4] || '',                          // الفصل
            classeraUser: row[5] || '',                   // بريد كلاسيرا
            classeraPass: row[6] || '',                   // مرور كلاسيرا
            teamsUser: row[7] || '',                      // بريد تيمز
            teamsPass: row[8] || ''                       // مرور تيمز
        })).filter(s => s.id !== ''); // استبعاد الصفوف الفارغة

        // 4. معالجة الطلب بناءً على المرسل (الطالب أم الإدارة)
        
        // إذا كان الطلب من صفحة الإدارة (GET request): أرسل كل الطلاب
        if (event.httpMethod === 'GET') {
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({ success: true, data: students })
            };
        }

        // إذا كان الطلب من صفحة الطالب (POST request): تحقق من الهوية والجوال
        if (event.httpMethod === 'POST') {
            const body = JSON.parse(event.body);
            const { username, password } = body;

            // البحث عن الطالب المطابق
            // username هو آخر 5 أرقام من الهوية
            const student = students.find(s => {
                const idLast5 = s.id.slice(-5);
                // مطابقة آخر 5 أرقام، ومطابقة رقم الجوال بالكامل
                return idLast5 === username && s.phone === password;
            });

            if (student) {
                return {
                    statusCode: 200,
                    headers,
                    body: JSON.stringify({ success: true, data: student })
                };
            } else {
                return {
                    statusCode: 401, // غير مصرح (بيانات خاطئة)
                    headers,
                    body: JSON.stringify({ success: false, message: 'بيانات غير صحيحة' })
                };
            }
        }

        return { statusCode: 405, headers, body: 'Method Not Allowed' };

    } catch (error) {
        console.error("Server Error:", error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ success: false, message: 'حدث خطأ في الخادم', error: error.message })
        };
    }
}