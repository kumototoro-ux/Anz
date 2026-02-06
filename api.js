const SUPABASE_URL = 'https://olxodigikqbjznuycsqf.supabase.co';
const SUPABASE_KEY = 'sb_publishable_g7k3Dw8Q461GUjX-9_rbrA_ilsJ8NSc';

export async function getStudentData(tableName, studentId) {
    if (!studentId) {
        console.error("خطأ: studentId غير معرف (undefined)");
        return { success: false, message: "الهوية مفقودة" };
    }

    try {
        // بما أن الهوية ID في كل الجداول كما ذكرت:
        const queryColumn = 'ID'; 
        const url = `${SUPABASE_URL}/rest/v1/${tableName}?${queryColumn}=eq.${studentId}&select=*`;
        
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'apikey': SUPABASE_KEY,
                'Authorization': `Bearer ${SUPABASE_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) throw new Error(`خطأ ${response.status}: تأكد من الجدول [${tableName}]`);

        const data = await response.json();
        return (data && data.length > 0) ? { success: true, data: data[0] } : { success: false };
    } catch (error) {
        console.error(`[API Error] Table: ${tableName}:`, error);
        return { success: false, error: true, message: error.message };
    }
}

export async function loginUser(id, password) {
    const result = await getStudentData('students', id);
    
    // تأكد من مطابقة الحرف P الكبير في Password كما في صورتك
    if (result.success && String(result.data.Password).trim() === String(password).trim()) {
        // حفظ بيانات الطالب في الذاكرة
        localStorage.setItem("user", JSON.stringify(result.data));
        return { found: true, student: result.data };
    }
    return { found: false };
}
