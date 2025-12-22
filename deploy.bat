@echo off
REM Auto deploy script for Windows
REM Windows自动部署脚本

echo ====================================
echo Tennis Match Recorder - Auto Deploy
echo ====================================
echo.

REM Check if git is installed
REM 检查git是否安装
git --version >nul 2>&1
if errorlevel 1 (
    echo Error: Git is not installed or not in PATH
    echo 错误：Git未安装或不在PATH中
    pause
    exit /b 1
)

REM Check if we're in a git repository
REM 检查是否在git仓库中
if not exist .git (
    echo Error: Not a git repository. Please initialize first:
    echo   git init
    echo   git remote add origin YOUR_REPO_URL
    echo.
    echo 错误：不是git仓库。请先初始化：
    echo   git init
    echo   git remote add origin YOUR_REPO_URL
    pause
    exit /b 1
)

REM Get current branch
REM 获取当前分支
for /f "tokens=*" %%i in ('git branch --show-current') do set CURRENT_BRANCH=%%i

echo Current branch: %CURRENT_BRANCH%
echo 当前分支: %CURRENT_BRANCH%
echo.

REM Add all files
REM 添加所有文件
echo Adding files...
echo 添加文件中...
git add .

REM Check if there are changes
REM 检查是否有更改
git diff --cached --quiet
if errorlevel 1 (
    REM There are changes, commit them
    REM 有更改，提交它们
    echo.
    echo Committing changes...
    echo 提交更改中...
    set /p COMMIT_MSG="Enter commit message (or press Enter for default): "
    if "%COMMIT_MSG%"=="" set COMMIT_MSG=Update tennis match recorder
    
    git commit -m "%COMMIT_MSG%"
    
    REM Push to GitHub
    REM 推送到GitHub
    echo.
    echo Pushing to GitHub...
    echo 推送到GitHub中...
    git push origin %CURRENT_BRANCH%
    
    if errorlevel 1 (
        echo.
        echo Error: Failed to push. Please check your remote configuration.
        echo 错误：推送失败。请检查远程配置。
        echo.
        echo To set remote:
        echo   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
        echo.
        pause
        exit /b 1
    )
    
    echo.
    echo ====================================
    echo Deployment successful!
    echo 部署成功！
    echo ====================================
    echo.
    echo Your app will be available at:
    echo https://YOUR_USERNAME.github.io/YOUR_REPO_NAME/
    echo.
    echo Note: It may take a few minutes for GitHub Pages to update.
    echo 注意：GitHub Pages可能需要几分钟才能更新。
    echo.
) else (
    echo.
    echo No changes to commit.
    echo 没有需要提交的更改。
    echo.
)

pause

