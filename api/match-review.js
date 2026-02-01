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
    const apiKey = process.env.DEEPSEEK_API_KEY;
    if (!apiKey) {
        res.status(500).json({ error: 'DEEPSEEK_API_KEY is not configured' });
        return;
    }
    let body;
    try {
        body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    } catch (e) {
        res.status(400).json({ error: 'Invalid JSON body' });
        return;
    }
    const { systemPrompt, userMessage } = body || {};
    if (!userMessage || typeof userMessage !== 'string') {
        res.status(400).json({ error: 'userMessage is required' });
        return;
    }
    const messages = [
        ...(systemPrompt && systemPrompt.trim() ? [{ role: 'system', content: systemPrompt.trim() }] : []),
        { role: 'user', content: userMessage }
    ];
    try {
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
        if (!response.ok) {
            const errMsg = data.error?.message || data.message || JSON.stringify(data);
            res.status(response.status).json({ error: errMsg });
            return;
        }
        const content = data.choices?.[0]?.message?.content ?? '';
        res.status(200).json({ review: content });
    } catch (err) {
        console.error('Match review proxy error:', err);
        res.status(500).json({ error: err.message || 'Failed to call Deepseek API' });
    }
}
