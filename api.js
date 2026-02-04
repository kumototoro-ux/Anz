/**
 * api.js - المحرك المركزي المحدث لنظام مقياس التعليمي
 * تم التعديل ليتوافق مع أسماء الأعمدة في صور قاعدة بياناتك (ID, Password)
 */

const SUPABASE_URL = 'https://olxodigikqbjznuycsqf.supabase.co';
const SUPABASE_KEY = 'sb_publishable_g7k3Dw8Q461GUjX-9_rbrA_ilsJ8NSc';

/**
 * دالة جلب البيانات الشاملة
 */
export async function getStudentData(tableName, studentId) {
    try {
        // تنبيه: استخدمنا ID بحروف كبيرة لتطابق صورتك لجدول students
        const queryColumn = (tableName === 'students') ? 'ID' : 'student_id';
        
        const url = `${SUPABASE_URL}/rest/v1/${tableName}?${queryColumn}=eq.${studentId}&select=*`;
        
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'apikey': SUPABASE_KEY,
                'Authorization': `Bearer ${SUPABASE_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`خطأ في الخادم: ${response.status}`);
        }

        const data = await response.json();
        
        if (data && data.length > 0) {
            return { success: true, data: data[0] };
        } else {
            return { success: false, message: "لم يتم العثور على سجلات" };
        }

    } catch (error) {
        console.error(`[API Error] Table: ${tableName}:`, error);
        return { success: false, error: true, message: error.message };
    }
}

/**
 * دالة تسجيل الدخول (تم تصحيح مسميات الأعمدة)
 */
export async function loginUser(studentId, password) {
    try {
        // نطلب البيانات من جدول الطلاب بناءً على الهوية
        const result = await getStudentData('students', studentId);
        
        if (result.success) {
            // انتبه: استخدمنا Password بحرف P كبير لتطابق صورتك لجدول السيرفر
            const dbPassword = result.data.Password; 
            
            // مقارنة دقيقة مع إزالة أي مسافات زائدة قد تكون دخلت بالخطأ
            if (String(dbPassword).trim() === String(password).trim()) {
                return { found: true, student: result.data };
            } else {
                console.log("كلمة المرور غير متطابقة");
            }
        }
        
        return { found: false, message: "بيانات الدخول غير صحيحة" };
        
    } catch (error) {
        console.error("Login process error:", error);
        return { found: false, error: true };
    }
}
