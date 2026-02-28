//
// Shared inbox API: GET list (pending shares for recipient), GET ?id= (one share payload for import), POST { id, action: 'import'|'refuse' }.
//

function cors(res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
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

module.exports = async function handler(req, res) {
    cors(res);
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }
    if (req.method !== 'GET' && req.method !== 'POST') {
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
    const userId = user.id;

    if (req.method === 'GET') {
        const shareId = (req.query && req.query.id) || null;
        if (shareId) {
            const r = await fetch(
                `${supabaseUrl}/rest/v1/match_shares?id=eq.${shareId}&recipient_id=eq.${userId}&imported_at=is.null&refused_at=is.null&select=matches_json`,
                { headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` } }
            );
            if (!r.ok) {
                res.status(500).json({ error: 'Failed to fetch share' });
                return;
            }
            const rows = await r.json();
            if (!Array.isArray(rows) || rows.length === 0) {
                res.status(404).json({ error: 'Share not found or already handled' });
                return;
            }
            res.status(200).json({ matches: rows[0].matches_json || [] });
            return;
        }
        const listRes = await fetch(
            `${supabaseUrl}/rest/v1/match_shares?recipient_id=eq.${userId}&imported_at=is.null&refused_at=is.null&select=id,message,created_at,sender:profiles!sender_id(email)`,
            { headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` } }
        );
        if (!listRes.ok) {
            res.status(500).json({ error: 'Failed to fetch inbox' });
            return;
        }
        let items = await listRes.json();
        if (!Array.isArray(items)) items = [];
        res.status(200).json({ items });
        return;
    }

    if (req.method === 'POST') {
        let body;
        try {
            body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
        } catch (e) {
            res.status(400).json({ error: 'Invalid JSON' });
            return;
        }
        const id = body.id;
        const action = body.action;
        if (!id || (action !== 'import' && action !== 'refuse')) {
            res.status(400).json({ error: 'Body must include id and action (import or refuse)' });
            return;
        }
        const checkRes = await fetch(
            `${supabaseUrl}/rest/v1/match_shares?id=eq.${id}&recipient_id=eq.${userId}&imported_at=is.null&refused_at=is.null&select=id`,
            { headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` } }
        );
        const checkRows = await checkRes.json();
        if (!Array.isArray(checkRows) || checkRows.length === 0) {
            res.status(404).json({ error: 'Share not found or already handled' });
            return;
        }
        const now = new Date().toISOString();
        const patch = action === 'import' ? { imported_at: now } : { refused_at: now };
        const patchRes = await fetch(`${supabaseUrl}/rest/v1/match_shares?id=eq.${id}&recipient_id=eq.${userId}`, {
            method: 'PATCH',
            headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
            body: JSON.stringify(patch)
        });
        if (!patchRes.ok) {
            res.status(500).json({ error: 'Failed to update share' });
            return;
        }
        res.status(200).json({ ok: true });
    }
};
