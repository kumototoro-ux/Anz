// api.js - المحرك الجديد للربط مع Supabase
const SUPABASE_URL = 'https://olxodigikqbjznuycsqf.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'; // ضع المفتاح الطويل كاملاً هنا

// دالة عامة لجلب البيانات من أي جدول (سواء مادة أو حضور أو إشعار)
export async function getStudentData(tableName, studentId) {
    try {
        // نستخدم student_id للبحث في كل الجداول ما عدا جدول الطلاب نستخدم id
        const queryColumn = (tableName === 'students') ? 'id' : 'student_id';
        
        const url = `${SUPABASE_URL}/rest/v1/${tableName}?${queryColumn}=eq.${studentId}&select=*`;
        
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'apikey': SUPABASE_KEY,
                'Authorization': `Bearer ${SUPABASE_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        const data = await response.json();
        
        if (data && data.length > 0) {
            return { success: true, data: data[0] };
        }
        return { success: false, message: "لا توجد بيانات لهذا الطالب" };
    } catch (error) {
        console.error("Fetch Error:", error);
        return { success: false, error: true };
    }
}

// دالة تسجيل الدخول
export async function loginUser(id, password) {
    const result = await getStudentData('students', id);
    if (result.success && result.data.password === password) {
        return { found: true, student: result.data };
    }
    return { found: false };
}
