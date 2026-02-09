//
// Referral claim API – grant 1 credit to referrer when referred user registers.
// 推荐兑现 API：被邀请人注册后为分享人增加 1 credit。
//
// POST /api/referral-claim with Authorization: Bearer <referred_user_jwt>, body: { referrerId }
// referredUserId is taken from JWT only (not from body). referrerId must be a valid profile id.
//

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function cors(res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
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

async function profileExists(supabaseUrl, serviceKey, userId) {
    const r = await fetch(`${supabaseUrl}/rest/v1/profiles?id=eq.${userId}&select=id`, {
        headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` }
    });
    if (!r.ok) return false;
    const d = await r.json();
    return Array.isArray(d) && d.length > 0;
}

async function incrementCredits(supabaseUrl, serviceKey, userId) {
    const getRes = await fetch(`${supabaseUrl}/rest/v1/profiles?id=eq.${userId}&select=credits`, {
        headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` }
    });
    if (!getRes.ok) throw new Error('Failed to read credits');
    const rows = await getRes.json();
    const current = (rows[0] && rows[0].credits) != null ? rows[0].credits : 0;
    const patchRes = await fetch(`${supabaseUrl}/rest/v1/profiles?id=eq.${userId}`, {
        method: 'PATCH',
        headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ credits: current + 1, updated_at: new Date().toISOString() })
    });
    if (!patchRes.ok) {
        const errText = await patchRes.text();
        console.error('[referral-claim] incrementCredits PATCH failed:', patchRes.status, errText);
        throw new Error('Failed to add credit');
    }
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
        res.status(401).json({ error: 'Please log in to claim referral' });
        return;
    }

    const referredUser = await getUserFromToken(supabaseUrl, token, anonKey);
    if (!referredUser) {
        res.status(401).json({ error: 'Invalid or expired session' });
        return;
    }
    const referredUserId = referredUser.id;

    let body;
    try {
        body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
    } catch (e) {
        res.status(400).json({ error: 'Invalid JSON body' });
        return;
    }
    const referrerId = body.referrerId;
    if (!referrerId || typeof referrerId !== 'string') {
        res.status(400).json({ error: 'Missing referrerId' });
        return;
    }
    const referrerIdTrimmed = referrerId.trim();
    if (!UUID_REGEX.test(referrerIdTrimmed) || !UUID_REGEX.test(referredUserId)) {
        res.status(400).json({ error: 'Invalid referrer or user id' });
        return;
    }
    if (referrerIdTrimmed === referredUserId) {
        res.status(400).json({ error: 'Cannot refer yourself' });
        return;
    }

    const referrerExists = await profileExists(supabaseUrl, serviceKey, referrerIdTrimmed);
    const referredExists = await profileExists(supabaseUrl, serviceKey, referredUserId);
    if (!referrerExists || !referredExists) {
        res.status(400).json({ error: 'Referrer or referred user not found' });
        return;
    }

    const headers = {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal'
    };
    const insertRes = await fetch(`${supabaseUrl}/rest/v1/referral_claims`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
            referrer_id: referrerIdTrimmed,
            referred_user_id: referredUserId
        })
    });

    if (insertRes.status === 409 || (insertRes.status === 400 && (await insertRes.text()).includes('duplicate'))) {
        res.status(200).json({ ok: true, alreadyClaimed: true });
        return;
    }
    if (!insertRes.ok) {
        const errText = await insertRes.text();
        console.error('[referral-claim] INSERT failed:', insertRes.status, errText);
        res.status(400).json({ error: 'Referral already claimed or failed' });
        return;
    }

    try {
        await incrementCredits(supabaseUrl, serviceKey, referrerIdTrimmed);
    } catch (e) {
        console.error('[referral-claim] incrementCredits error:', e);
        res.status(500).json({ error: 'Failed to grant credit' });
        return;
    }

    res.status(200).json({ ok: true });
};

module.exports = handler;
