# Quick Start Guide
# 快速开始指南

## 5-Minute Setup
## 5分钟设置

### Step 1: Upload to GitHub
### 步骤1：上传到GitHub

1. Create a new repository on GitHub
2. Upload all files (or use Git)
3. Enable GitHub Pages in repository settings
4. Your app will be live at: `https://YOUR_USERNAME.github.io/REPO_NAME/`

### Step 2: Add to iPhone Home Screen
### 步骤2：添加到iPhone主屏幕

1. Open Safari on iPhone
2. Go to your GitHub Pages URL
3. Tap Share button (square with arrow)
4. Select "Add to Home Screen"
5. App is now installed!

### Step 3: Start Using
### 步骤3：开始使用

1. **Add a Player**:
   - Go to "Players" tab
   - Tap "+" button
   - Fill in details and save

2. **Record a Match**:
   - Go to "Matches" tab
   - Tap "+" button
   - Select player and configure settings
   - Tap "Start Match"
   - Record points as they happen

3. **View History**:
   - Tap any match in the list to see details

## Optional: GitHub Sync Setup
## 可选：GitHub同步设置

1. Create GitHub Personal Access Token:
   - GitHub → Settings → Developer settings → Personal access tokens
   - Generate new token with `repo` scope
   - Copy the token

2. Configure in App:
   - Go to "Settings" tab
   - Enter token and repository name (format: `username/repo-name`)
   - Tap "Sync Now"

## Troubleshooting
## 故障排除

**App not installing?**
- Use Safari (not Chrome)
- Make sure you're on HTTPS (GitHub Pages provides this)
- Try from Safari menu: Share → Add to Home Screen

**Data not saving?**
- Check browser console for errors
- Make sure IndexedDB is enabled in browser settings
- Try clearing cache and reloading

**GitHub sync failing?**
- Verify token has `repo` permission
- Check repository name format: `username/repo-name`
- Ensure repository exists and is accessible

## Need Help?
## 需要帮助？

Check the full [README.md](README.md) for detailed instructions.

