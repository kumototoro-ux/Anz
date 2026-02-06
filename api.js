const SUPABASE_URL = 'https://olxodigikqbjznuycsqf.supabase.co';
const SUPABASE_KEY = 'sb_publishable_g7k3Dw8Q461GUjX-9_rbrA_ilsJ8NSc';

export async function getStudentData(tableName, studentId) {
    if (!studentId) return { success: false };
    try {
        const url = `${SUPABASE_URL}/rest/v1/${tableName}?ID=eq.${studentId}&select=*`;
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'apikey': SUPABASE_KEY,
                'Authorization': `Bearer ${SUPABASE_KEY}`,
                'Content-Type': 'application/json'
            }
        });
        const data = await response.json();
        return (data && data.length > 0) ? { success: true, data: data[0] } : { success: false };
    } catch (error) {
        console.error("API Error:", error);
        return { success: false };
    }
}

export async function loginUser(id, password) {
    const result = await getStudentData('students', id);
    if (result.success && String(result.data.Password).trim() === String(password).trim()) {
        localStorage.setItem("user", JSON.stringify(result.data));
        return { found: true, student: result.data };
    }
    return { found: false };
}
