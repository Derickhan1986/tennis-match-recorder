# First Time Setup Guide
# 首次设置指南

## Step 1: Initialize Git in Your Project
## 步骤1：在项目中初始化Git

Open Command Prompt (Windows) or Terminal (Mac/Linux) in your project folder:
在项目文件夹中打开命令提示符（Windows）或终端（Mac/Linux）：

**Windows:**
```cmd
cd "D:\App Project\Tennis"
```

**Mac/Linux:**
```bash
cd /path/to/your/Tennis/folder
```

Then run:
然后运行：

```bash
git init
```

## Step 2: Connect to Your GitHub Repository
## 步骤2：连接到GitHub仓库

Replace `YOUR_USERNAME` and `YOUR_REPO_NAME` with your actual values:
将 `YOUR_USERNAME` 和 `YOUR_REPO_NAME` 替换为你的实际值：

```bash
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
```

**Example (示例):**
If your GitHub username is `john-doe` and repository name is `tennis-app`:
如果你的GitHub用户名是 `john-doe`，仓库名是 `tennis-app`：

```bash
git remote add origin https://github.com/john-doe/tennis-app.git
```

## Step 3: Configure Git (First Time Only)
## 步骤3：配置Git（仅首次需要）

If you haven't configured Git before:
如果之前没有配置过Git：

```bash
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
```

## Step 4: Add All Files
## 步骤4：添加所有文件

```bash
git add .
```

## Step 5: Commit Files
## 步骤5：提交文件

```bash
git commit -m "Initial commit - Tennis Match Recorder"
```

## Step 6: Push to GitHub
## 步骤6：推送到GitHub

```bash
git branch -M main
git push -u origin main
```

You may be asked to login to GitHub. Follow the prompts.
可能会要求登录GitHub，按照提示操作。

## Step 7: Enable GitHub Pages
## 步骤7：启用GitHub Pages

1. Go to your repository on GitHub
   前往GitHub上的仓库

2. Click **Settings** tab
   点击 **Settings** 标签

3. Scroll down to **Pages** section (left sidebar)
   向下滚动到 **Pages** 部分（左侧边栏）

4. Under **Source**, select **"GitHub Actions"**
   在 **Source** 下，选择 **"GitHub Actions"**

5. Click **Save**
   点击 **Save**

## Step 8: Check Deployment
## 步骤8：检查部署

1. Go to **Actions** tab in your repository
   前往仓库的 **Actions** 标签

2. You should see a workflow running
   应该看到工作流正在运行

3. Wait for it to complete (green checkmark)
   等待完成（绿色勾选）

4. Your app will be available at:
   你的应用将在以下地址可用：

```
https://YOUR_USERNAME.github.io/YOUR_REPO_NAME/
```

## Troubleshooting
## 故障排除

### "remote origin already exists" Error
### "remote origin already exists" 错误

If you already added the remote, remove it first:
如果已经添加了远程仓库，先删除：

```bash
git remote remove origin
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
```

### Authentication Required
### 需要身份验证

**Option 1: Use Personal Access Token**
**选项1：使用个人访问令牌**

1. GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Generate new token
3. Select `repo` scope
4. Copy the token
5. When pushing, use token as password

**Option 2: Use GitHub Desktop**
**选项2：使用GitHub Desktop**

Download GitHub Desktop app for easier GUI-based Git operations.

### "Permission denied" Error
### "权限被拒绝" 错误

- Make sure repository name matches exactly
- Check you have push access to the repository
- Verify your GitHub credentials

## Next Steps
## 下一步

After first setup, you can use the deploy scripts:
首次设置后，可以使用部署脚本：

**Windows:**
```cmd
deploy.bat
```

**Mac/Linux:**
```bash
./deploy.sh
```

Or manually:
或手动：

```bash
git add .
git commit -m "Your message"
git push origin main
```

GitHub Actions will automatically deploy!

