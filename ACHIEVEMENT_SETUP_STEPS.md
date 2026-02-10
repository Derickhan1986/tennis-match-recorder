# 成就系统：具体操作步骤

按下面顺序做即可让成就系统生效。

---

## 一、Supabase：确保表已创建

1. 打开 [Supabase Dashboard](https://supabase.com/dashboard)，进入你的项目。
2. 左侧点 **SQL Editor**，新建一个 Query。
3. 若你**从没跑过** `supabase/schema.sql`：  
   打开项目里的 `supabase/schema.sql`，**全选复制**，粘贴到 SQL Editor，点 **Run**。
4. 若你**以前跑过** schema 但当时还没有成就相关表：  
   只复制下面这段，粘贴到 SQL Editor，点 **Run**：

```sql
-- Achievement unlocks
CREATE TABLE IF NOT EXISTS public.user_achievement_unlocks (
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    achievement_id TEXT NOT NULL,
    unlocked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (user_id, achievement_id)
);
ALTER TABLE public.user_achievement_unlocks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own achievement unlocks"
    ON public.user_achievement_unlocks FOR SELECT
    USING (auth.uid() = user_id);

-- Review usage (for post_game achievement)
CREATE TABLE IF NOT EXISTS public.review_usage (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_review_usage_user ON public.review_usage(user_id);
ALTER TABLE public.review_usage ENABLE ROW LEVEL SECURITY;
```

执行成功即可，无需再操作 Supabase。

---

## 二、Vercel：部署 API 并配置环境变量

### 2.1 确认代码已包含两个 API 文件

项目里需存在：

- `api/achievements.js`（GET 已解锁成就列表）
- `api/achievement-claim.js`（POST 领取成就）

若你是从 Git 拉取的，确保这两个文件在仓库里，然后执行：

```bash
git add api/achievements.js api/achievement-claim.js
git commit -m "Add achievement APIs"
git push
```

Vercel 会自动部署，部署完成后会有：

- `https://你的域名/api/achievements`
- `https://你的域名/api/achievement-claim`

### 2.2 在 Vercel 里配置环境变量

1. 打开 [Vercel Dashboard](https://vercel.com/dashboard)，进入 **Tennis 项目**。
2. 顶部点 **Settings** → 左侧 **Environment Variables**。
3. 确认已有下面三个变量（若已有 Match Review，一般已经配过）：

| 变量名 | 说明 |
|--------|------|
| `SUPABASE_URL` | Supabase 项目 URL，如 `https://xxxxx.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase **service_role** 密钥（不是 anon） |
| `SUPABASE_ANON_KEY` | Supabase **anon public** 密钥 |

没有的就点 **Add** 填上，Environment 选 **Production**（或连同 Preview 一起选），保存。

### 2.3 让环境变量生效

- 在 **Deployments** 里找到最新一次部署，右侧 **⋯** → **Redeploy**；  
  或  
- 本地执行：`git commit --allow-empty -m "redeploy"` 然后 `git push`，触发一次新部署。

---

## 三、前端：确认 API 地址

成就接口地址写在 `js/app.js` 里，默认是：

- `ACHIEVEMENTS_API_URL` = `https://tennis-match-recorder.vercel.app/api/achievements`
- `ACHIEVEMENT_CLAIM_API_URL` = `https://tennis-match-recorder.vercel.app/api/achievement-claim`

若你的 Vercel 域名**不是** `tennis-match-recorder.vercel.app`，需要改成你自己的域名：

1. 打开 `js/app.js`。
2. 搜索 `tennis-match-recorder.vercel.app`，把这两处换成你的 Vercel 项目域名（例如 `https://my-tennis-app.vercel.app`），保存并重新部署或刷新页面。

---

## 四、自测清单

1. **Supabase**：SQL Editor 里执行  
   `SELECT * FROM public.user_achievement_unlocks LIMIT 1;`  
   不报错、能返回（哪怕为空）即可。
2. **Vercel**：浏览器访问  
   `https://你的域名/api/achievements`  
   未带 token 时应返回 401 或 “Please log in”，说明接口已上线。
3. **应用内**：登录后打开 **Log in** 页，应看到：
   - 下方有 **Achievements** 区块，9 个成就 + 星标；
   - Account 区域有 **Achievement stars: 0 / 9**（或已解锁数量）。

完成以上步骤后，成就系统即可按设计自动解锁并显示。
