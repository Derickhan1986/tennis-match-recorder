//
// Upload user data (players + matches) to Supabase, per-user; optional permanent (1 credit for User)
// 上传用户数据（players + matches）到 Supabase，按用户；可选永久保存（User 扣 1 credit）
//

function cors(res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
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

async function upsertUserData(supabaseUrl, serviceKey, userId, playersJson, matchesJson, expiresAt) {
    const body = {
        user_id: userId,
        players_json: playersJson,
        matches_json: matchesJson,
        updated_at: new Date().toISOString(),
        expires_at: expiresAt || null
    };
    const res = await fetch(`${supabaseUrl}/rest/v1/user_data`, {
        method: 'POST',
        headers: {
            apikey: serviceKey,
            Authorization: `Bearer ${serviceKey}`,
            'Content-Type': 'application/json',
            Prefer: 'resolution=merge-duplicates'
        },
        body: JSON.stringify(body)
    });
    return res.ok;
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
    if (req.method !== 'POST') {
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
    let body;
    try {
        body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    } catch (e) {
        res.status(400).json({ error: 'Invalid JSON' });
        return;
    }
    const { players = [], matches = [], permanent = false } = body;
    const role = profile.role;
    const isUser = role === 'User';
    const expiresAt = isUser && !permanent
        ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
        : null;
    if (isUser && permanent) {
        const credits = profile.credits != null ? profile.credits : 0;
        if (credits < 1) {
            res.status(429).json({ error: 'Insufficient credits' });
            return;
        }
    }
    const ok = await upsertUserData(supabaseUrl, serviceKey, user.id, players, matches, expiresAt);
    if (!ok) {
        res.status(500).json({ error: 'Failed to save data' });
        return;
    }
    if (isUser && permanent) {
        await decrementCredits(supabaseUrl, serviceKey, user.id);
    }
    res.status(200).json({ expires_at: expiresAt });
};
