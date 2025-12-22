# Auto Deploy Guide
# 自动部署指南

This guide explains how to automatically deploy your Tennis Match Recorder app to GitHub Pages.
本指南说明如何自动将网球比赛记录器应用部署到GitHub Pages。

## Method 1: GitHub Actions (Automatic)
## 方法1：GitHub Actions（自动）

### Setup
### 设置

1. **Enable GitHub Pages in repository settings:**
   **在仓库设置中启用GitHub Pages：**
   - Go to your repository on GitHub
   - Click "Settings" → "Pages"
   - Under "Source", select "GitHub Actions"
   - Save

2. **Push code to GitHub:**
   **推送代码到GitHub：**
   ```bash
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

3. **Automatic deployment:**
   **自动部署：**
   - Every time you push to `main` branch, GitHub Actions will automatically deploy
   - Check deployment status: Repository → "Actions" tab
   - Your app will be live at: `https://YOUR_USERNAME.github.io/YOUR_REPO_NAME/`

### How it works
### 工作原理

- The `.github/workflows/deploy.yml` file contains the deployment configuration
- When you push code, GitHub Actions runs automatically
- It builds and deploys your app to GitHub Pages
- No manual steps needed!

## Method 2: Deploy Scripts (Semi-Automatic)
## 方法2：部署脚本（半自动）

### For Windows
### Windows用户

1. **Double-click `deploy.bat`** or run in Command Prompt:
   **双击 `deploy.bat` 或在命令提示符中运行：**
   ```cmd
   deploy.bat
   ```

2. **Follow the prompts:**
   **按照提示操作：**
   - Enter commit message (or press Enter for default)
   - Script will automatically:
     - Add all files
     - Commit changes
     - Push to GitHub

### For Mac/Linux
### Mac/Linux用户

1. **Make script executable:**
   **使脚本可执行：**
   ```bash
   chmod +x deploy.sh
   ```

2. **Run the script:**
   **运行脚本：**
   ```bash
   ./deploy.sh
   ```

3. **Follow the prompts:**
   **按照提示操作：**
   - Enter commit message (or press Enter for default)
   - Script will automatically:
     - Add all files
     - Commit changes
     - Push to GitHub

## Initial Setup (First Time Only)
## 初始设置（仅首次）

### 1. Initialize Git Repository
### 1. 初始化Git仓库

```bash
git init
```

### 2. Add Remote Repository
### 2. 添加远程仓库

```bash
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
```

Replace:
- `YOUR_USERNAME` with your GitHub username
- `YOUR_REPO_NAME` with your repository name

### 3. Create and Switch to Main Branch
### 3. 创建并切换到主分支

```bash
git branch -M main
```

### 4. First Push
### 4. 首次推送

```bash
git add .
git commit -m "Initial commit"
git push -u origin main
```

## Daily Workflow
## 日常工作流程

### Option A: Use Deploy Script (Easiest)
### 选项A：使用部署脚本（最简单）

**Windows:**
```cmd
deploy.bat
```

**Mac/Linux:**
```bash
./deploy.sh
```

### Option B: Manual Git Commands
### 选项B：手动Git命令

```bash
git add .
git commit -m "Your commit message"
git push origin main
```

GitHub Actions will automatically deploy after push.

## Troubleshooting
## 故障排除

### "Not a git repository" Error
### "不是git仓库"错误

**Solution:**
```bash
git init
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
```

### "Failed to push" Error
### "推送失败"错误

**Check:**
1. Remote URL is correct:
   ```bash
   git remote -v
   ```
2. You have push permissions to the repository
3. You're authenticated with GitHub:
   ```bash
   git config --global user.name "Your Name"
   git config --global user.email "your.email@example.com"
   ```

### GitHub Actions Not Running
### GitHub Actions未运行

**Check:**
1. GitHub Pages source is set to "GitHub Actions" (not "Deploy from branch")
2. Workflow file exists at `.github/workflows/deploy.yml`
3. You're pushing to `main` or `master` branch
4. Check "Actions" tab for error messages

### App Not Updating
### 应用未更新

**Wait:**
- GitHub Pages can take 1-5 minutes to update
- Check deployment status in "Actions" tab
- Hard refresh browser (Ctrl+Shift+R or Cmd+Shift+R)

## Deployment Status
## 部署状态

Check deployment status:
1. Go to your repository on GitHub
2. Click "Actions" tab
3. See latest workflow run
4. Green checkmark = successful
5. Red X = failed (click to see errors)

## Tips
## 提示

1. **Always test locally before deploying**
   **部署前始终在本地测试**

2. **Use meaningful commit messages**
   **使用有意义的提交消息**
   ```bash
   git commit -m "Add player management feature"
   ```

3. **Check Actions tab regularly**
   **定期检查Actions标签页**

4. **Keep .gitignore updated**
   **保持.gitignore更新**

## Quick Reference
## 快速参考

| Action | Command |
|--------|---------|
| Deploy (Windows) | `deploy.bat` |
| Deploy (Mac/Linux) | `./deploy.sh` |
| Manual deploy | `git add . && git commit -m "msg" && git push` |
| Check status | Repository → Actions tab |
| View app | `https://YOUR_USERNAME.github.io/YOUR_REPO_NAME/` |

---

**Note:** After first deployment, GitHub Actions will automatically deploy on every push to main branch.
**注意：**首次部署后，GitHub Actions会在每次推送到main分支时自动部署。

