//
// POST /api/data/share – share matches to a recipient by email. Deduct 1 credit (User). Anti-abuse: no duplicate pending same match to same recipient; rate limit 20/hour per sender.
//

function cors(res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    return res;
}

async function getUserFromToken(supabaseUrl, token, anonKey) {
    const headers = { Authorization: `Bearer ${token}` };
    if (anonKey) headers.apikey = anonKey;
    const res = await fetch(`${supabaseUrl}/auth/v1/user`, { headers });
    if (!res.ok) return null;
    const data = await res.json();
    return data.id ? data : null;
}

async function getProfile(supabaseUrl, serviceKey, userId) {
    const res = await fetch(`${supabaseUrl}/rest/v1/profiles?id=eq.${userId}&select=id,email,role,credits`, {
        headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` }
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data[0] || null;
}

async function getProfileByEmail(supabaseUrl, serviceKey, email) {
    const enc = encodeURIComponent(email.trim().toLowerCase());
    const res = await fetch(`${supabaseUrl}/rest/v1/profiles?email=eq.${enc}&select=id,email`, {
        headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` }
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data[0] || null;
}

async function getPendingSharesToRecipient(supabaseUrl, serviceKey, senderId, recipientId) {
    const res = await fetch(
        `${supabaseUrl}/rest/v1/match_shares?sender_id=eq.${senderId}&recipient_id=eq.${recipientId}&imported_at=is.null&refused_at=is.null&select=matches_json`,
        { headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` } }
    );
    if (!res.ok) return [];
    const rows = await res.json();
    return Array.isArray(rows) ? rows : [];
}

async function getSenderShareCountLastHour(supabaseUrl, serviceKey, senderId) {
    const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const res = await fetch(
        `${supabaseUrl}/rest/v1/match_shares?sender_id=eq.${senderId}&created_at=gte.${since}&select=id`,
        { headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` } }
    );
    if (!res.ok) return 0;
    const rows = await res.json();
    return Array.isArray(rows) ? rows.length : 0;
}

async function decrementCredits(supabaseUrl, serviceKey, userId) {
    const getRes = await fetch(`${supabaseUrl}/rest/v1/profiles?id=eq.${userId}&select=credits`, {
        headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` }
    });
    const rows = await getRes.json();
    const current = (rows[0] && rows[0].credits) != null ? rows[0].credits : 0;
    const res = await fetch(`${supabaseUrl}/rest/v1/profiles?id=eq.${userId}`, {
        method: 'PATCH',
        headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ credits: Math.max(0, current - 1), updated_at: new Date().toISOString() })
    });
    return res.ok;
}

const RATE_LIMIT_PER_HOUR = 20;

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
    const anonKey = process.env.SUPABASE_ANON_KEY || '';
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
    const user = await getUserFromToken(supabaseUrl, token, anonKey);
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
        body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
    } catch (e) {
        res.status(400).json({ error: 'Invalid JSON' });
        return;
    }
    const recipientEmail = body.recipientEmail && String(body.recipientEmail).trim();
    const matches = body.matches;
    const message = body.message != null ? String(body.message).trim() : null;
    if (!recipientEmail) {
        res.status(400).json({ error: 'recipientEmail is required' });
        return;
    }
    if (!Array.isArray(matches) || matches.length === 0) {
        res.status(400).json({ error: 'At least one match is required' });
        return;
    }
    const recipient = await getProfileByEmail(supabaseUrl, serviceKey, recipientEmail);
    if (!recipient) {
        res.status(400).json({ error: 'Recipient not found or not registered' });
        return;
    }
    if (recipient.id === user.id) {
        res.status(400).json({ error: 'Cannot share to yourself' });
        return;
    }
    const isUser = profile.role === 'User';
    if (isUser) {
        const credits = profile.credits != null ? profile.credits : 0;
        if (credits < 1) {
            res.status(429).json({ error: 'Insufficient credits' });
            return;
        }
    }
    const newMatchIds = new Set(matches.map((m) => m && m.id).filter(Boolean));
    const pending = await getPendingSharesToRecipient(supabaseUrl, serviceKey, user.id, recipient.id);
    for (const row of pending) {
        const arr = row.matches_json;
        if (!Array.isArray(arr)) continue;
        for (const m of arr) {
            if (m && m.id && newMatchIds.has(m.id)) {
                res.status(400).json({ error: 'You have already shared this match with this recipient; they have not yet imported or refused it.' });
                return;
            }
        }
    }
    const countLastHour = await getSenderShareCountLastHour(supabaseUrl, serviceKey, user.id);
    if (countLastHour >= RATE_LIMIT_PER_HOUR) {
        res.status(429).json({ error: 'Too many shares in the last hour. Try again later.' });
        return;
    }
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    const insertBody = {
        sender_id: user.id,
        recipient_id: recipient.id,
        players_json: [],
        matches_json: matches,
        message: message || null,
        expires_at: expiresAt
    };
    const insertRes = await fetch(`${supabaseUrl}/rest/v1/match_shares`, {
        method: 'POST',
        headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
        body: JSON.stringify(insertBody)
    });
    if (!insertRes.ok) {
        res.status(500).json({ error: 'Failed to save share' });
        return;
    }
    if (isUser) {
        await decrementCredits(supabaseUrl, serviceKey, user.id);
    }
    res.status(200).json({ ok: true });
};
