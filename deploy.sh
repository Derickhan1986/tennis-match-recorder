#!/bin/bash
# Auto deploy script for Mac/Linux
# Mac/Linux自动部署脚本

echo "===================================="
echo "Tennis Match Recorder - Auto Deploy"
echo "===================================="
echo ""

# Check if git is installed
# 检查git是否安装
if ! command -v git &> /dev/null; then
    echo "Error: Git is not installed"
    echo "错误：Git未安装"
    exit 1
fi

# Check if we're in a git repository
# 检查是否在git仓库中
if [ ! -d .git ]; then
    echo "Error: Not a git repository. Please initialize first:"
    echo "  git init"
    echo "  git remote add origin YOUR_REPO_URL"
    echo ""
    echo "错误：不是git仓库。请先初始化："
    echo "  git init"
    echo "  git remote add origin YOUR_REPO_URL"
    exit 1
fi

# Get current branch
# 获取当前分支
CURRENT_BRANCH=$(git branch --show-current)
echo "Current branch: $CURRENT_BRANCH"
echo "当前分支: $CURRENT_BRANCH"
echo ""

# Add all files
# 添加所有文件
echo "Adding files..."
echo "添加文件中..."
git add .

# Check if there are changes
# 检查是否有更改
if ! git diff --cached --quiet; then
    # There are changes, commit them
    # 有更改，提交它们
    echo ""
    echo "Committing changes..."
    echo "提交更改中..."
    read -p "Enter commit message (or press Enter for default): " COMMIT_MSG
    if [ -z "$COMMIT_MSG" ]; then
        COMMIT_MSG="Update tennis match recorder"
    fi
    
    git commit -m "$COMMIT_MSG"
    
    # Push to GitHub
    # 推送到GitHub
    echo ""
    echo "Pushing to GitHub..."
    echo "推送到GitHub中..."
    git push origin "$CURRENT_BRANCH"
    
    if [ $? -ne 0 ]; then
        echo ""
        echo "Error: Failed to push. Please check your remote configuration."
        echo "错误：推送失败。请检查远程配置。"
        echo ""
        echo "To set remote:"
        echo "  git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git"
        echo ""
        exit 1
    fi
    
    echo ""
    echo "===================================="
    echo "Deployment successful!"
    echo "部署成功！"
    echo "===================================="
    echo ""
    echo "Your app will be available at:"
    echo "https://YOUR_USERNAME.github.io/YOUR_REPO_NAME/"
    echo ""
    echo "Note: It may take a few minutes for GitHub Pages to update."
    echo "注意：GitHub Pages可能需要几分钟才能更新。"
    echo ""
else
    echo ""
    echo "No changes to commit."
    echo "没有需要提交的更改。"
    echo ""
fi

