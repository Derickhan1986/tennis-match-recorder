# Supabase Setup for Tennis Match Recorder
# 网球比赛记录器 Supabase 设置指南

This guide explains how to create a Supabase project and run the schema for user auth, credits, and per-user match data.
本指南说明如何创建 Supabase 项目并执行表结构（用户认证、积分、按用户比赛数据）。

---

## Step 1: Create a Supabase project
## 第一步：创建 Supabase 项目

1. Go to [https://supabase.com](https://supabase.com) and sign in.
2. Click **New Project**.
3. Choose organization, set **Project name** (e.g. `tennis-match-recorder`), set **Database password** (save it), choose region, then click **Create new project**.
4. Wait until the project is ready.

---

## Step 2: Run the schema
## 第二步：执行表结构

1. In the Supabase dashboard, open **SQL Editor**.
2. Copy the contents of [supabase/schema.sql](supabase/schema.sql) and paste into a new query.
3. Click **Run**. This creates `profiles`, `user_data`, RLS policies, and the trigger that creates a profile when a user signs up.

---

## Step 3: Get API keys and URL
## 第三步：获取 API 密钥和 URL

1. In the dashboard, go to **Project Settings** (gear icon) → **API**.
2. Copy and save:
   - **Project URL** (e.g. `https://xxxxx.supabase.co`)
   - **anon public** key (for frontend; safe to expose)
   - **service_role** key (for backend only; never expose in frontend)

---

## Step 4: Configure the app
## 第四步：配置应用

**Frontend** (browser):

- Edit [js/config.js](js/config.js) and set:
  - `window.SUPABASE_URL` = your Project URL
  - `window.SUPABASE_ANON_KEY` = your anon public key
  - (Optional) `window.DATA_API_URL` = base URL of your Vercel app (e.g. `https://your-app.vercel.app`). If not set, the app uses the same base as `MATCH_REVIEW_API_URL` from [js/app.js](js/app.js) when available.

**Backend** (Vercel) – 按下面 “Step 4 详细步骤” 操作。

---

## Step 4 详细步骤：在 Vercel 里配置环境变量
## Step 4 (detailed): Configure environment variables in Vercel

1. 打开浏览器，访问 **https://vercel.com**，登录你的账号。
2. 在 **Dashboard** 里找到并点击你的 Tennis 项目（例如 `tennis-match-recorder`）。
3. 点击顶部的 **Settings** 标签。
4. 在左侧菜单里点击 **Environment Variables**。
5. 在 **Key** 和 **Value** 里逐个添加下面这些变量（每填完一对就点 **Save**，再继续添加下一个）：

   | Key | Value | 说明 |
   |-----|--------|------|
   | `SUPABASE_URL` | `https://aefxxgffuuduvzkgjttu.supabase.co` | 你在 Step 3 复制的 Project URL（换成你自己的） |
   | `SUPABASE_ANON_KEY` | 粘贴 Supabase API 页里的 **anon** (public) 密钥 | Match Review 用 JWT 校验用户时 Supabase Auth 需要此头；与前端 config 里的 anon key 一致 |
   | `SUPABASE_SERVICE_ROLE_KEY` | 粘贴 Supabase API 页里的 **service_role** 密钥 | 一长串字符，不要复制 anon，要 **service_role** |
   | `DEEPSEEK_API_KEY` | 你的 Deepseek API Key | 若已有 Match Review，这里应已存在，不用改 |
   | `CRON_SECRET` | 任意一串随机字符（如 `mySecret123` 或更长） | 用于每日清理接口的校验，自己记住即可 |

   - **Key** 必须和上表完全一致（区分大小写）。
   - **Value** 不要有多余空格或换行。
   - 每个变量添加后，**Environment** 可以选 **Production**、**Preview**、**Development** 全选，或只选 Production。

6. 全部添加完后，需要**重新部署**一次，环境变量才会生效：
   - 点击顶部的 **Deployments** 标签；
   - 找到最新一次部署，右侧点 **⋯** → **Redeploy**；
   - 或在本机执行 `git commit --allow-empty -m "trigger redeploy"` 再 `git push`，触发一次新部署。

完成后，Vercel 上的 API（Match Review、上传/下载、清理）就会使用这些配置。

---

## Step 5: Create an Admin user (optional)
## 第五步：在 Supabase 里把某个账号设为 Admin（可选）

先把要当 Admin 的账号在应用里注册一次，再在 Supabase 里用 SQL 把该账号改成 Admin。

### 5.1 在应用里注册一个账号

1. 打开你的 Tennis 应用（本地或已部署的页面）。
2. 进入 **Settings**（设置）页。
3. 在 **Account** 里填写邮箱和密码，点击 **Register**。
4. 注册成功后，该邮箱会出现在 Supabase 的 `auth.users` 和 `public.profiles` 里（默认 role 为 User）。

### 5.2 在 Supabase 里把该账号设为 Admin

1. 打开浏览器，访问 **https://supabase.com**，登录你的账号。
2. 进入你的项目（例如 Tennis 项目）。
3. 左侧菜单点击 **SQL Editor**。
4. 点击 **New query**（新建查询）。
5. 在编辑区粘贴下面这段 SQL，并把 `你的邮箱@example.com` 改成你在 5.1 里注册时用的**真实邮箱**（保留引号）：

```sql
UPDATE public.profiles
SET role = 'Admin', credits = 0
WHERE email = '你的邮箱@example.com';
```

   例如邮箱是 `admin@gmail.com`，就写成：

```sql
UPDATE public.profiles
SET role = 'Admin', credits = 0
WHERE email = 'admin@gmail.com';
```

6. 点击 **Run**（运行），不要点 Explain。
7. 若成功，下方会显示类似 “Success. No rows returned” 或 “1 row(s) updated”；若显示 “0 rows affected”，说明 `profiles` 里没有这个邮箱（请确认 5.1 已用该邮箱注册成功）。

### 5.3 在应用里用 Admin 身份登录

1. 回到 Tennis 应用，在 Settings 里点击 **Logout**（若当前已登录）。
2. 再用刚才的邮箱和密码点击 **Login**。
3. 登录后，Account 里应显示 **Role: Admin**，且不再有积分限制（上传/下载、Match Review 不扣 credits）。

---

## Forgot password / Redirect URL
## 忘记密码与重定向 URL

Users can reset their password from **Log in** (ex-Settings) → **Account**: click **Forgot password?**, enter email, then **Send reset link**. Supabase sends an email; when the user clicks the link, they are redirected to the **dedicated reset-password page** (`reset-password.html`) to set a new password (no conflict with the Log in page).
用户可在 **Log in**（原 Settings）→ **Account** 中重置密码：点击 **Forgot password?**，输入邮箱后点击 **Send reset link**。Supabase 会发邮件；用户点击邮件中的链接后会跳转到**专用重置密码页**（`reset-password.html`）设置新密码，与 Log in 页分离。

**Same list as email confirmation.** Supabase has one **Redirect URLs** list in **Authentication → URL Configuration**. Both **email confirmation** and **password reset** use this list. You need to add both the confirm-thanks and reset-password URLs.
**与注册邮箱确认共用同一列表。** Supabase 在 **Authentication → URL Configuration** 里只有一份 **Redirect URLs** 列表，注册确认和密码重置都使用该列表；需同时添加 confirm-thanks 与 reset-password 的地址。

**Configure redirect URL in Supabase** (required for reset link and confirm link to work):  
在 Supabase 中配置重定向 URL（重置链接与确认链接生效所必需）：

1. In the Supabase dashboard, go to **Authentication** → **URL Configuration**.
2. Under **Redirect URLs**, add:
   - `http://localhost:5500/` (or your local dev URL) for testing
   - Your production base URL (e.g. `https://your-username.github.io/tennis-match-recorder/`)
   - **Confirm email thank-you page:** `https://your-username.github.io/tennis-match-recorder/confirm-thanks.html`
   - **Password reset page:** `https://your-username.github.io/tennis-match-recorder/reset-password.html` (use your real base URL + `/reset-password.html`)
3. Save. After signup confirmation users land on confirm-thanks.html; after clicking the reset-password email link they land on reset-password.html to set a new password.

1. 在 Supabase 控制台进入 **Authentication** → **URL Configuration**。
2. 在 **Redirect URLs** 中添加：应用根地址、`https://你的域名/confirm-thanks.html`、以及 **`https://你的域名/reset-password.html`**（如 GitHub Pages：`https://你的用户名.github.io/tennis-match-recorder/reset-password.html`）。
3. 保存后，注册确认会跳转到感谢页；重置密码邮件链接会跳转到 reset-password.html 设置新密码。

---

## Tables overview
## 表结构概览

| Table       | Purpose |
|------------|---------|
| `profiles` | One row per user: `id`, `email`, `role` (Admin/Pro/User), `credits`, timestamps. |
| `user_data`| One row per user: `user_id`, `players_json`, `matches_json`, `updated_at`, `expires_at` (NULL = permanent; set for User temporary uploads). |

- **Admin / Pro**: Uploads stored with `expires_at = NULL` (permanent).
- **User**: Upload with “Save for 7 days” → `expires_at = now() + 7 days`; upload with “Save permanently (1 credit)” → `expires_at = NULL` and deduct 1 credit.
- A daily cron job (e.g. [.github/workflows/cleanup-expired.yml](.github/workflows/cleanup-expired.yml)) calls your Vercel API `/api/cron/cleanup-expired` with `CRON_SECRET` and deletes rows where `expires_at < now()`. Add repository secrets `CRON_SECRET` and `API_BASE_URL` (your Vercel URL) for the workflow to run.
