//
// GET /api/achievements – return unlocked achievement ids for the current user.
//

function cors(res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    return res;
}

async function getUserFromToken(supabaseUrl, token, anonKey) {
    const headers = { Authorization: `Bearer ${token}` };
    if (anonKey) headers.apikey = anonKey;
    const r = await fetch(`${supabaseUrl}/auth/v1/user`, { headers });
    if (!r.ok) return null;
    const d = await r.json();
    return d.id ? d : null;
}

const handler = async function (req, res) {
    cors(res);
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }
    if (req.method !== 'GET') {
        res.status(405).json({ error: 'Method not allowed' });
        return;
    }
    const auth = req.headers.authorization;
    const token = auth && auth.startsWith('Bearer ') ? auth.slice(7) : null;
    const supabaseUrl = process.env.SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const anonKey = process.env.SUPABASE_ANON_KEY || '';
    if (!token || !supabaseUrl || !serviceKey) {
        res.status(401).json({ error: 'Please log in' });
        return;
    }
    const user = await getUserFromToken(supabaseUrl, token, anonKey);
    if (!user) {
        res.status(401).json({ error: 'Invalid or expired session' });
        return;
    }
    const r = await fetch(`${supabaseUrl}/rest/v1/user_achievement_unlocks?user_id=eq.${user.id}&select=achievement_id`, {
        headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` }
    });
    if (!r.ok) {
        res.status(500).json({ error: 'Failed to load achievements' });
        return;
    }
    const rows = await r.json();
    const unlockedIds = Array.isArray(rows) ? rows.map((row) => row.achievement_id) : [];
    res.status(200).json({ unlockedIds });
};

module.exports = handler;
