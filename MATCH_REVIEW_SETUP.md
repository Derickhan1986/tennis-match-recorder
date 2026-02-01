# Match Review – Step-by-Step Deployment and Setup
# 比赛战报 – 分步部署与设置指南

Follow these steps in order to deploy the Match Review backend and configure the app.
按顺序完成以下步骤即可部署比赛战报后端并配置应用。

---

## Step 1: Get a Deepseek API Key
## 第一步：获取 Deepseek API Key

1. Open your browser and go to: **https://platform.deepseek.com**
2. Sign up or log in to your Deepseek account.
3. In the dashboard, find **API Keys** (or **API 密钥**).
4. Click **Create API Key** (or **创建 API Key**), give it a name (e.g. `tennis-match-review`), and copy the key.
5. **Save the key somewhere safe.** You will need it in Step 3. (If you lose it, you can create a new one.)

---

## Step 2: Push Your Project to GitHub
## 第二步：将项目推送到 GitHub

1. Make sure your Tennis project is in a Git repository and all changes are committed (including the `api/` folder and `js/app.js` changes).
2. If you have not created a GitHub repo yet:
   - Go to **https://github.com/new**
   - Create a new repository (e.g. `tennis-match-recorder`).
   - Do **not** initialize with README if your local project already has files.
3. If the repo already exists, push your latest code:
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
   git add .
   git commit -m "Add Match Review feature and API"
   git push -u origin main
   ```
   Replace `YOUR_USERNAME` and `YOUR_REPO_NAME` with your GitHub username and repository name.

---

## Step 3: Deploy the Backend on Vercel
## 第三步：在 Vercel 上部署后端

1. Open **https://vercel.com** and sign in (use **Continue with GitHub** if you have a GitHub account).
2. Click **Add New…** → **Project**.
3. **Import** your GitHub repository (the Tennis project). Select it and click **Import**.
4. On the project configuration page:
   - **Project Name:** Keep the default or change it (e.g. `tennis-match-review`). Remember this name; your API URL will be `https://<project-name>.vercel.app`.
   - **Framework Preset:** Leave as **Other** (or **Vercel** if available).
   - **Root Directory:** Leave as `.` (root).
   - Do **not** change **Build and Output Settings** unless you know you need to.
5. Click **Environment Variables** to expand it.
   - **Name:** `DEEPSEEK_API_KEY`
   - **Value:** Paste the Deepseek API key you copied in Step 1.
   - Click **Add**.
6. Click **Deploy**. Wait until the deployment finishes (usually 1–2 minutes).
7. When it is done, click **Visit** or open your project. Your API base URL will be:
   - `https://<your-project-name>.vercel.app`
   The Match Review endpoint is:
   - `https://<your-project-name>.vercel.app/api/match-review`
   **Copy this full URL;** you will use it in Step 4.

---

## Step 4: Set the API URL in the Frontend
## 第四步：在前端设置 API 地址

1. Open the file **`js/app.js`** in your project.
2. Near the top (around line 11), find this line:
   ```js
   const MATCH_REVIEW_API_URL = ''; // e.g. 'https://your-app.vercel.app/api/match-review'
   ```
3. Replace the empty string with your Vercel API URL (from Step 3), in quotes. For example:
   ```js
   const MATCH_REVIEW_API_URL = 'https://tennis-match-review.vercel.app/api/match-review';
   ```
   Use **your actual** project name and URL.
4. Save the file.

---

## Step 5: Test the Match Review Feature
## 第五步：测试比赛战报功能

1. Open the app (locally or on your deployed site):
   - **Local:** Open `index.html` in a browser, or run a local server (e.g. `npx serve .` in the project root).
   - **Online:** If you use GitHub Pages, open your Pages URL.
2. Go to **Matches**, open a match that has finished (has sets and stats).
3. On the match detail page, click the **Match Review** button (between **Export to PDF** and **Delete Match**).
4. You should see:
   - A short “Generating review…” message, then “Review ready”.
   - A modal with the AI-generated match review and **Download** / **Close** buttons.
5. If you see an error:
   - **“Match Review is not configured”** → Check that `MATCH_REVIEW_API_URL` in `js/app.js` is set correctly (Step 4).
   - **“DEEPSEEK_API_KEY is not configured”** or **500** → In Vercel, go to **Project → Settings → Environment Variables** and add or fix `DEEPSEEK_API_KEY`, then **Redeploy**.
   - **“Failed to fetch”** or **CORS** → Make sure you are opening the app via **http** or **https** (not `file://`). If the frontend is on a different domain, ensure the Vercel API allows it (the provided API already sets `Access-Control-Allow-Origin: *`).

---

## Step 6 (Optional): Deploy the Frontend to GitHub Pages
## 第六步（可选）：将前端部署到 GitHub Pages

If you want to use the app (and Match Review) online without opening local files:
如果你希望在网上使用应用（及比赛战报），而不用本地打开文件：

1. Push your code (including the `MATCH_REVIEW_API_URL` in `js/app.js`) to GitHub.
2. In your GitHub repo, go to **Settings → Pages**.
3. Under **Source**, choose **Deploy from a branch**.
4. Select branch **main** (or your default branch) and folder **/ (root)** (or the folder where `index.html` is).
5. Click **Save**. After a few minutes, your site will be at `https://<username>.github.io/<repo-name>/`.
6. Open that URL, go to a match, and click **Match Review** again to confirm it works with your Vercel API.

---

## Summary Checklist
## 检查清单

- [ ] Step 1: Deepseek API key created and copied.
- [ ] Step 2: Project pushed to GitHub (including `api/` and updated `js/app.js`).
- [ ] Step 3: Vercel project created, `DEEPSEEK_API_KEY` set, deploy successful, API URL copied.
- [ ] Step 4: `MATCH_REVIEW_API_URL` in `js/app.js` set to your Vercel API URL.
- [ ] Step 5: Match Review button tested on a finished match.
- [ ] Step 6 (optional): Frontend deployed to GitHub Pages and tested.

---

## Changing the AI Rules Later
## 之后修改 AI 分析规则

Edit the file **`data/match-review-rules.md`** in your project. It defines how the AI structures the match review (overview, stats, serve/return, turning points, suggestions). Save and redeploy or refresh; the next time you click **Match Review**, the new rules will be used.

修改项目中的 **`data/match-review-rules.md`** 即可。该文件定义了战报结构（概览、数据、发球/接发、转折点、建议等）。保存后重新部署或刷新页面，下次点击 **Match Review** 时会使用新规则。
