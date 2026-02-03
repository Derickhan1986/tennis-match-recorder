//
// Match Review API – Vercel serverless proxy for Deepseek
// 比赛战报 API – 用于 Deepseek 的 Vercel serverless 代理
//
// Usage: POST /api/match-review with JSON body { systemPrompt, userMessage }
// 用法：POST /api/match-review，JSON 体为 { systemPrompt, userMessage }
// Environment: Set DEEPSEEK_API_KEY in Vercel project settings
// 环境：在 Vercel 项目设置中配置 DEEPSEEK_API_KEY
//

const DEEPSEEK_API = 'https://api.deepseek.com/chat/completions';

function cors(res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    return res;
}

// Get user from JWT. Supabase Auth may require apikey (anon) header; pass anonKey if available.
async function getUserFromToken(supabaseUrl, token, anonKey) {
    const headers = { Authorization: `Bearer ${token}` };
    if (anonKey) headers.apikey = anonKey;
    const r = await fetch(`${supabaseUrl}/auth/v1/user`, { headers });
    if (!r.ok) {
        const errText = await r.text();
        const host = supabaseUrl ? supabaseUrl.replace(/^https?:\/\//, '').split('/')[0] : '';
        console.log('[MatchReview API] Supabase /auth/v1/user failed: status=', r.status, 'host=', host, 'body=', errText.slice(0, 200));
        return null;
    }
    const d = await r.json();
    return d.id ? d : null;
}

async function getProfile(supabaseUrl, serviceKey, userId) {
    const r = await fetch(`${supabaseUrl}/rest/v1/profiles?id=eq.${userId}&select=role,credits`, {
        headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` }
    });
    if (!r.ok) return null;
    const d = await r.json();
    return d[0] || null;
}

// Deduct 1 credit for User role after successful Match Review. Throws if PATCH fails.
// 比赛战报成功后为 User 角色扣除 1 积分；PATCH 失败时抛出。
async function decrementCredits(supabaseUrl, serviceKey, userId) {
    const getRes = await fetch(`${supabaseUrl}/rest/v1/profiles?id=eq.${userId}&select=credits`, {
        headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` }
    });
    if (!getRes.ok) throw new Error('Failed to read credits');
    const rows = await getRes.json();
    const current = (rows[0] && rows[0].credits) != null ? rows[0].credits : 0;
    const patchRes = await fetch(`${supabaseUrl}/rest/v1/profiles?id=eq.${userId}`, {
        method: 'PATCH',
        headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ credits: Math.max(0, current - 1), updated_at: new Date().toISOString() })
    });
    if (!patchRes.ok) {
        const errText = await patchRes.text();
        console.error('decrementCredits PATCH failed:', patchRes.status, errText);
        throw new Error('Failed to deduct credit');
    }
}

// Allow up to 60s for Deepseek to return (Vercel default is 10s on Hobby)
// 允许 Deepseek 最多 60 秒返回（Vercel 免费版默认 10 秒）
const handler = async function (req, res) {
    console.log('[MatchReview API] request received: method=', req.method, 'path=', req.url || req.path);
    cors(res);
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }
    if (req.method !== 'POST') {
        res.status(405).json({ error: 'Method not allowed' });
        return;
    }
    const apiKey = process.env.DEEPSEEK_API_KEY;
    if (!apiKey) {
        res.status(500).json({ error: 'DEEPSEEK_API_KEY is not configured' });
        return;
    }
    const auth = req.headers.authorization;
    const token = auth && auth.startsWith('Bearer ') ? auth.slice(7) : null;
    const supabaseUrl = process.env.SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const anonKey = process.env.SUPABASE_ANON_KEY || '';
    const supabaseHost = supabaseUrl ? supabaseUrl.replace(/^https?:\/\//, '').split('/')[0] : '';
    console.log('[MatchReview API] token present:', !!token, 'token length:', token ? token.length : 0, 'supabaseHost:', supabaseHost || '(none)', 'serviceKey:', !!serviceKey, 'anonKey:', !!anonKey);
    // Require login to use Match Review / 必须登录才能使用比赛战报
    if (!token || !supabaseUrl || !serviceKey) {
        console.log('[MatchReview API] 401: missing token or Supabase config (token=', !!token, 'url=', !!supabaseUrl, 'key=', !!serviceKey, ')');
        res.status(401).json({ error: 'Please log in to use Match Review' });
        return;
    }
    const user = await getUserFromToken(supabaseUrl, token, anonKey);
    console.log('[MatchReview API] user from token:', !!user, user ? 'userId=' + user.id : '');
    if (!user) {
        console.log('[MatchReview API] 401: getUserFromToken returned null');
        res.status(401).json({ error: 'Please log in to use Match Review' });
        return;
    }
    const profile = await getProfile(supabaseUrl, serviceKey, user.id);
    console.log('[MatchReview API] profile:', !!profile, profile ? 'role=' + profile.role + ' credits=' + profile.credits : '');
    if (!profile) {
        console.log('[MatchReview API] 401: getProfile returned null');
        res.status(401).json({ error: 'Please log in to use Match Review' });
        return;
    }
    if (profile.role === 'User') {
        const credits = profile.credits != null ? profile.credits : 0;
        if (credits < 1) {
            console.log('[MatchReview API] 429: insufficient credits');
            res.status(429).json({ error: 'Insufficient credits' });
            return;
        }
    }
    let body;
    try {
        body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    } catch (e) {
        console.log('[MatchReview API] 400: JSON parse error', e.message);
        res.status(400).json({ error: 'Invalid JSON body' });
        return;
    }
    const { systemPrompt, userMessage } = body || {};
    if (!userMessage || typeof userMessage !== 'string') {
        console.log('[MatchReview API] 400: userMessage missing');
        res.status(400).json({ error: 'userMessage is required' });
        return;
    }
    console.log('[MatchReview API] body ok, userMessage length=', userMessage.length);
    const messages = [
        ...(systemPrompt && systemPrompt.trim() ? [{ role: 'system', content: systemPrompt.trim() }] : []),
        { role: 'user', content: userMessage }
    ];
    try {
        console.log('[MatchReview API] calling Deepseek...');
        const response = await fetch(DEEPSEEK_API, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: 'deepseek-chat',
                messages,
                stream: false
            })
        });
        const data = await response.json();
        console.log('[MatchReview API] Deepseek status=', response.status, 'content length=', (data.choices?.[0]?.message?.content ?? '').length);
        if (!response.ok) {
            const errMsg = data.error?.message || data.message || JSON.stringify(data);
            console.log('[MatchReview API] Deepseek error:', errMsg);
            res.status(response.status).json({ error: errMsg });
            return;
        }
        const content = data.choices?.[0]?.message?.content ?? '';
        // Deduct 1 credit for User role (Admin/Pro unlimited) / User 扣 1 积分，Admin/Pro 不扣
        const userAgain = await getUserFromToken(supabaseUrl, token, anonKey);
        if (userAgain) {
            const profileAgain = await getProfile(supabaseUrl, serviceKey, userAgain.id);
            console.log('[MatchReview API] post-success profile: role=', profileAgain?.role, 'credits=', profileAgain?.credits);
            if (profileAgain && profileAgain.role === 'User') {
                console.log('[MatchReview API] deducting 1 credit for User userId=', userAgain.id);
                await decrementCredits(supabaseUrl, serviceKey, userAgain.id);
                console.log('[MatchReview API] credit deducted ok');
            } else {
                console.log('[MatchReview API] skip deduct: not User role or no profile');
            }
        }
        console.log('[MatchReview API] success, returning review length=', content.length);
        res.status(200).json({ review: content });
    } catch (err) {
        console.error('[MatchReview API] catch:', err.message, err.stack);
        res.status(500).json({ error: err.message || 'Failed to call Deepseek API' });
    }
};
handler.maxDuration = 60;
module.exports = handler;
