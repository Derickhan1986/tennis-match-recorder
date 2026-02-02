//
// Download user data (players + matches) from Supabase; User role deducts 1 credit
// 从 Supabase 下载用户数据（players + matches）；User 角色扣 1 credit
//

function cors(res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    return res;
}

async function getUserFromToken(supabaseUrl, token) {
    const res = await fetch(`${supabaseUrl}/auth/v1/user`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.id ? data : null;
}

async function getProfile(supabaseUrl, serviceKey, userId) {
    const res = await fetch(`${supabaseUrl}/rest/v1/profiles?id=eq.${userId}&select=id,email,role,credits`, {
        headers: {
            apikey: serviceKey,
            Authorization: `Bearer ${serviceKey}`,
            'Content-Type': 'application/json'
        }
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data[0] || null;
}

async function getUserData(supabaseUrl, serviceKey, userId) {
    const res = await fetch(`${supabaseUrl}/rest/v1/user_data?user_id=eq.${userId}&select=players_json,matches_json`, {
        headers: {
            apikey: serviceKey,
            Authorization: `Bearer ${serviceKey}`,
            'Content-Type': 'application/json'
        }
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data[0] || null;
}

async function decrementCredits(supabaseUrl, serviceKey, userId) {
    const getRes = await fetch(`${supabaseUrl}/rest/v1/profiles?id=eq.${userId}&select=credits`, {
        headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` }
    });
    const rows = await getRes.json();
    const current = (rows[0] && rows[0].credits) != null ? rows[0].credits : 0;
    const res = await fetch(`${supabaseUrl}/rest/v1/profiles?id=eq.${userId}`, {
        method: 'PATCH',
        headers: {
            apikey: serviceKey,
            Authorization: `Bearer ${serviceKey}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ credits: Math.max(0, current - 1), updated_at: new Date().toISOString() })
    });
    return res.ok;
}

module.exports = async function handler(req, res) {
    cors(res);
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }
    if (req.method !== 'GET') {
        res.status(405).json({ error: 'Method not allowed' });
        return;
    }
    const supabaseUrl = process.env.SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !serviceKey) {
        res.status(500).json({ error: 'Server not configured' });
        return;
    }
    const auth = req.headers.authorization;
    const token = auth && auth.startsWith('Bearer ') ? auth.slice(7) : null;
    if (!token) {
        res.status(401).json({ error: 'Authorization required' });
        return;
    }
    const user = await getUserFromToken(supabaseUrl, token);
    if (!user) {
        res.status(401).json({ error: 'Invalid token' });
        return;
    }
    const profile = await getProfile(supabaseUrl, serviceKey, user.id);
    if (!profile) {
        res.status(403).json({ error: 'Profile not found' });
        return;
    }
    const role = profile.role;
    const isUser = role === 'User';
    if (isUser) {
        const credits = profile.credits != null ? profile.credits : 0;
        if (credits < 1) {
            res.status(429).json({ error: 'Insufficient credits' });
            return;
        }
    }
    const row = await getUserData(supabaseUrl, serviceKey, user.id);
    if (isUser && row) {
        await decrementCredits(supabaseUrl, serviceKey, user.id);
    }
    const players = (row && row.players_json) || [];
    const matches = (row && row.matches_json) || [];
    res.status(200).json({ players, matches });
};
