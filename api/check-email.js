//
// POST /api/check-email – check if an email is already registered (profiles table).
// Body: { email: "user@example.com" }. Returns { exists: true | false }.
// No auth required; used before registration to avoid duplicate signup.
//

function cors(res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res;
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
    let body;
    try {
        body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
    } catch (e) {
        res.status(400).json({ error: 'Invalid JSON' });
        return;
    }
    const email = body.email && String(body.email).trim().toLowerCase();
    if (!email) {
        res.status(400).json({ error: 'Email is required' });
        return;
    }
    const enc = encodeURIComponent(email);
    const r = await fetch(`${supabaseUrl}/rest/v1/profiles?email=eq.${enc}&select=id`, {
        headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` }
    });
    if (!r.ok) {
        res.status(500).json({ error: 'Failed to check email' });
        return;
    }
    const rows = await r.json();
    const exists = Array.isArray(rows) && rows.length > 0;
    res.status(200).json({ exists });
};
