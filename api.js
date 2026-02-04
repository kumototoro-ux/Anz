/**
 * api.js - المحرك المركزي للربط مع Supabase
 * مبرمج ليتناسب مع: الدخول، الرئيسية، المواد، الغياب، والنتائج.
 */

// api.js
const SUPABASE_URL = 'https://olxodigikqbjznuycsqf.supabase.co'; // الرابط الذي أرسلته صح
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9seG9kaWdpa3FianpudXljc3FmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDcxNj...'; // المفتاح الطويل جداً
/**
 * دالة عامة لجلب بيانات الطالب من أي جدول
 * @param {string} tableName - اسم الجدول في Supabase (مثلاً: math, attendance, notice_term1)
 * @param {string} studentId - رقم هوية الطالب
 */
export async function getStudentData(tableName, studentId) {
    try {
        // في جدول الطلاب العمود اسمه id، في بقية الجداول اسمه student_id
        const queryColumn = (tableName === 'students') ? 'id' : 'student_id';
        
        // بناء الرابط مع فلتر رقم الهوية
        const url = `${SUPABASE_URL}/rest/v1/${tableName}?${queryColumn}=eq.${studentId}&select=*`;
        
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'apikey': SUPABASE_KEY,
                'Authorization': `Bearer ${SUPABASE_KEY}`,
                'Content-Type': 'application/json',
                'Prefer': 'return=representation'
            }
        });

        if (!response.ok) throw new Error("فشل الاتصال بقاعدة البيانات");

        const data = await response.json();
        
        if (data && data.length > 0) {
            return { success: true, data: data[0] };
        }
        return { success: false, message: "لم يتم العثور على سجلات" };

    } catch (error) {
        console.error(`خطأ في الجدول ${tableName}:`, error);
        return { success: false, error: error.message };
    }
}

/**
 * دالة تسجيل الدخول - تتحقق من وجود الطالب وكلمة مروره
 */
export async function loginUser(id, password) {
    const result = await getStudentData('students', id);
    
    if (result.success) {
        // التحقق من كلمة المرور (يفضل أن تكون الحروف متطابقة تماماً)
        if (String(result.data.password) === String(password)) {
            return { found: true, student: result.data };
        }
    }
    return { found: false };
}
