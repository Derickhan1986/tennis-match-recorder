//
// App configuration (Supabase, API URLs)
// 应用配置（Supabase、API 地址）
//
// Set these after deploying Supabase and Vercel (see SUPABASE_SETUP.md).
// 部署 Supabase 和 Vercel 后在此填写（见 SUPABASE_SETUP.md）。
//

window.SUPABASE_URL = window.SUPABASE_URL || 'https://aefxxgffuuduvzkgjttu.supabase.co';
window.SUPABASE_ANON_KEY = window.SUPABASE_ANON_KEY || 'sb_publishable_XI67irlFtdFbfWWX7a4Uaw_DWIOUcgv';
// Base URL for data API (upload/download). Same origin as Match Review API, e.g. https://your-app.vercel.app
window.DATA_API_URL = window.DATA_API_URL || (window.MATCH_REVIEW_API_URL ? window.MATCH_REVIEW_API_URL.replace(/\/api\/match-review\/?$/, '') : '');
