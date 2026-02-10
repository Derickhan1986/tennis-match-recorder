//
// POST /api/achievement-claim – claim one achievement (idempotent).
// Body: { achievementId: 'call_to_arm' }
//

const VALID_IDS = ['call_to_arm', 'first_show', 'being_supportive', 'post_game', 'big_server', 'big_target', 'friendship', 'long_term_run', 'grand_slam'];

function cors(res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
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
    if (req.method !== 'POST') {
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
    let body;
    try {
        body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
    } catch (e) {
        res.status(400).json({ error: 'Invalid JSON body' });
        return;
    }
    const achievementId = body.achievementId && String(body.achievementId).trim();
    if (!achievementId || !VALID_IDS.includes(achievementId)) {
        res.status(400).json({ error: 'Invalid or unknown achievement id' });
        return;
    }

    if (achievementId === 'post_game') {
        const ruRes = await fetch(`${supabaseUrl}/rest/v1/review_usage?user_id=eq.${user.id}&select=id`, {
            headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` }
        });
        if (!ruRes.ok) {
            res.status(500).json({ error: 'Failed to verify' });
            return;
        }
        const ruRows = await ruRes.json();
        if (!Array.isArray(ruRows) || ruRows.length === 0) {
            res.status(400).json({ error: 'Use Match Review at least once to unlock this achievement' });
            return;
        }
    }

    if (achievementId === 'friendship') {
        const refRes = await fetch(`${supabaseUrl}/rest/v1/referral_claims?referrer_id=eq.${user.id}&select=referrer_id`, {
            headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` }
        });
        if (!refRes.ok) {
            res.status(500).json({ error: 'Failed to verify' });
            return;
        }
        const refRows = await refRes.json();
        if (!Array.isArray(refRows) || refRows.length === 0) {
            res.status(400).json({ error: 'Share the app and have someone sign up via your link to unlock' });
            return;
        }
    }

    const insertRes = await fetch(`${supabaseUrl}/rest/v1/user_achievement_unlocks`, {
        method: 'POST',
        headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
        body: JSON.stringify({ user_id: user.id, achievement_id: achievementId })
    });
    if (insertRes.status === 409 || insertRes.status === 201) {
        res.status(200).json({ ok: true });
        return;
    }
    if (!insertRes.ok) {
        const errText = await insertRes.text();
        if (insertRes.status === 400 && (errText.includes('duplicate') || errText.includes('unique'))) {
            res.status(200).json({ ok: true });
            return;
        }
        res.status(500).json({ error: 'Failed to claim achievement' });
        return;
    }
    res.status(200).json({ ok: true });
};

module.exports = handler;
