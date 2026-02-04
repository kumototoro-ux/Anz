/**
 * api.js - المحرك المركزي لنظام مقياس التعليمي
 * يربط بين واجهات المستخدم وقاعدة بيانات Supabase
 */

// إعدادات الربط بناءً على صورك السابقة
const SUPABASE_URL = 'https://olxodigikqbjznuycsqf.supabase.co';
const SUPABASE_KEY = 'sb_publishable_g7k3Dw8Q461GUjX-9_rbrA_ilsJ8NSc';

/**
 * دالة جلب البيانات الشاملة
 * تعمل مع كل جداول النظام (students, attendance, math, quran, notice_term1, etc.)
 */
export async function getStudentData(tableName, studentId) {
    try {
        // تحديد العمود المستهدف: في جدول الطلاب هو id، وفي البقية هو student_id
        const queryColumn = (tableName === 'students') ? 'ID' : 'student_id';
        
        // بناء الرابط البرمجي للطلب
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

        if (!response.ok) {
            throw new Error(`خطأ في استجابة الخادم: ${response.status}`);
        }

        const data = await response.json();
        
        // التحقق من وجود بيانات
        if (data && data.length > 0) {
            return { success: true, data: data[0] };
        } else {
            return { success: false, message: "لم يتم العثور على سجلات لهذا الطالب" };
        }

    } catch (error) {
        console.error(`[API Error] Table: ${tableName} | Error:`, error);
        return { success: false, error: true, message: error.message };
    }
}

/**
 * دالة تسجيل الدخول
 * تتحقق من مطابقة رقم الهوية وكلمة المرور من جدول students
 */
export async function loginUser(studentId, password) {
    try {
        const result = await getStudentData('students', studentId);
        
        if (result.success) {
            // مقارنة كلمة المرور (تحويل للكل لنص لضمان المطابقة)
            if (String(result.data.password) === String(password)) {
                return { found: true, student: result.data };
            }
        }
        return { found: false, message: "بيانات الدخول غير صحيحة" };
        
    } catch (error) {
        console.error("Login process error:", error);
        return { found: false, error: true };
    }
}

/**
 * ملاحظة أمنية:
 * المفتاح المستخدم هو Publishable Key وهو آمن للاستخدام في المتصفح (Browser)
 * طالما أن سياسات RLS في Supabase مضبوطة بشكل صحيح.
 */
