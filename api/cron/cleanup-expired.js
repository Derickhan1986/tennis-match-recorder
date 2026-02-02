//
// Cron: delete user_data rows where expires_at < now() (User temporary uploads after 7 days)
// 定时任务：删除 expires_at 已过期的 user_data 行（User 临时上传 7 天后）
//
// Call daily with secret: Authorization: Bearer <CRON_SECRET> or ?secret=<CRON_SECRET>
// 每日调用时需携带密钥：Authorization: Bearer <CRON_SECRET> 或 ?secret=<CRON_SECRET>
//

function cors(res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    return res;
}

function checkSecret(req) {
    const secret = process.env.CRON_SECRET;
    if (!secret) return false;
    const auth = req.headers.authorization;
    if (auth && auth.startsWith('Bearer ') && auth.slice(7) === secret) return true;
    const url = new URL(req.url || '', 'http://localhost');
    return url.searchParams.get('secret') === secret;
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
    if (!checkSecret(req)) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
    }
    const supabaseUrl = process.env.SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !serviceKey) {
        res.status(500).json({ error: 'Server not configured' });
        return;
    }
    const now = new Date().toISOString();
    const resDel = await fetch(`${supabaseUrl}/rest/v1/user_data?expires_at=lt.${now}`, {
        method: 'DELETE',
        headers: {
            apikey: serviceKey,
            Authorization: `Bearer ${serviceKey}`,
            'Content-Type': 'application/json'
        }
    });
    if (!resDel.ok) {
        const text = await resDel.text();
        res.status(500).json({ error: 'Cleanup failed', detail: text });
        return;
    }
    const countHeader = resDel.headers.get('Content-Range');
    const count = countHeader ? parseInt(countHeader.split('/')[1], 10) || 0 : 0;
    res.status(200).json({ deleted: count });
};
