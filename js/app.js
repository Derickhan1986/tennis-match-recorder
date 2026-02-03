//
//  Main Application Logic
//  主应用逻辑
//
//  Handles navigation, page management, and app initialization
//  处理导航、页面管理和应用初始化
//

// Match Review API: backend proxy URL. Set to your Vercel/Netlify endpoint after deployment.
// 比赛战报 API：后端代理地址。部署后在 Vercel/Netlify 中设置你的端点。
const MATCH_REVIEW_API_URL = 'https://tennis-match-recorder.vercel.app/api/match-review'; // e.g. 'https://your-app.vercel.app/api/match-review'

const app = {
    currentPage: 'matches',
    
    // Initialize app
    // 初始化应用
    async init() {
        console.log('Tennis Match Recorder initializing...');
        
        // Register service worker
        // 注册服务工作者
        if ('serviceWorker' in navigator) {
            try {
                const registration = await navigator.serviceWorker.register('/sw.js');
                console.log('Service Worker registered:', registration);
            } catch (error) {
                console.error('Service Worker registration failed:', error);
            }
        }
        
        // Setup event listeners
        // 设置事件监听器
        this.setupNavigation();
        this.setupEventListeners();
        this.setupAccountEvents();
        if (typeof auth !== 'undefined' && auth.init) {
            await auth.init().catch(() => {});
            this.refreshSettingsAccount();
            if (auth.pendingPasswordRecovery) {
                this.showPage('settings');
            }
        }
        
        // Load initial data
        // 加载初始数据
        await this.loadMatches();
        await playerManager.loadPlayers();
        await matchRecorder.loadPlayersForMatch();
        
        // Show initial page: if user landed from reset-password email link, show Log in with set-new-password form
        // 显示初始页面：若从重置密码邮件链接进入，则显示 Log in 并展示设置新密码表单
        const initialPage = (typeof auth !== 'undefined' && auth.pendingPasswordRecovery) ? 'settings' : 'matches';
        this.showPage(initialPage);
    },
    
    // Setup navigation
    // 设置导航
    setupNavigation() {
        // Tab buttons
        // 标签按钮
        const tabButtons = document.querySelectorAll('.tab-button');
        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                const page = button.dataset.page;
                this.showPage(page);
            });
        });
        
        // Back button
        // 返回按钮
        const backButton = document.getElementById('back-button');
        if (backButton) {
            backButton.addEventListener('click', () => {
                this.goBack();
            });
        }
        
        // Add button
        // 添加按钮
        const addButton = document.getElementById('add-button');
        if (addButton) {
            addButton.addEventListener('click', () => {
                const action = addButton.dataset.action;
                if (action === 'add-match') {
                    this.showPage('new-match');
                } else if (action === 'add-player') {
                    playerManager.showNewPlayerForm();
                }
            });
        }
    },
    
    // Setup event listeners
    // 设置事件监听器
    setupEventListeners() {
    },
    
    // Setup account and server data event listeners
    // 设置账户与云端数据事件监听
    setupAccountEvents() {
        const loginBtn = document.getElementById('account-login-btn');
        const registerBtn = document.getElementById('account-register-btn');
        const logoutBtn = document.getElementById('account-logout-btn');
        const forgotBtn = document.getElementById('account-forgot-password-btn');
        const sendResetBtn = document.getElementById('account-send-reset-btn');
        const cancelForgotBtn = document.getElementById('account-cancel-forgot-btn');
        const updatePwBtn = document.getElementById('account-update-password-btn');
        const uploadBtn = document.getElementById('server-upload-btn');
        const downloadBtn = document.getElementById('server-download-btn');
        if (loginBtn) loginBtn.addEventListener('click', () => this.accountLogin());
        if (registerBtn) registerBtn.addEventListener('click', () => this.accountRegister());
        if (logoutBtn) logoutBtn.addEventListener('click', () => this.accountLogout());
        if (forgotBtn) forgotBtn.addEventListener('click', () => this.showForgotPasswordForm());
        if (sendResetBtn) sendResetBtn.addEventListener('click', () => this.accountSendResetLink());
        if (cancelForgotBtn) cancelForgotBtn.addEventListener('click', () => this.hideForgotPasswordForm());
        if (updatePwBtn) updatePwBtn.addEventListener('click', () => this.accountUpdatePassword());
        if (uploadBtn) uploadBtn.addEventListener('click', () => this.serverUpload());
        if (downloadBtn) downloadBtn.addEventListener('click', () => this.serverDownload());
    },
    
    refreshSettingsAccount() {
        const loggedOut = document.getElementById('account-logged-out');
        const loggedIn = document.getElementById('account-logged-in');
        const serverSection = document.getElementById('server-data-section');
        const creditsRow = document.getElementById('account-credits-row');
        const permanentGroup = document.getElementById('upload-permanent-group');
        const statusEl = document.getElementById('account-auth-status');
        if (statusEl) statusEl.textContent = '';
        const forgotBlock = document.getElementById('account-forgot-block');
        const recoveryBlock = document.getElementById('account-recovery-block');
        const loginRow = document.getElementById('account-login-row');
        const isRecovery = typeof auth !== 'undefined' && auth.pendingPasswordRecovery;
        if (forgotBlock) forgotBlock.classList.add('hidden');
        if (recoveryBlock) recoveryBlock.classList.toggle('hidden', !isRecovery);
        if (loginRow) loginRow.classList.toggle('hidden', isRecovery);
        if (isRecovery) {
            if (loggedOut) loggedOut.classList.remove('hidden');
            if (loggedIn) loggedIn.classList.add('hidden');
            if (serverSection) serverSection.classList.add('hidden');
            const statusEl = document.getElementById('account-recovery-status');
            if (statusEl) statusEl.textContent = '';
            return;
        }
        if (typeof auth === 'undefined' || !auth.isLoggedIn()) {
            if (loggedOut) loggedOut.classList.remove('hidden');
            if (loggedIn) loggedIn.classList.add('hidden');
            if (serverSection) serverSection.classList.add('hidden');
            return;
        }
        if (loggedOut) loggedOut.classList.add('hidden');
        if (loggedIn) loggedIn.classList.remove('hidden');
        const emailEl = document.getElementById('account-display-email');
        const roleEl = document.getElementById('account-display-role');
        const creditsEl = document.getElementById('account-display-credits');
        if (emailEl) emailEl.textContent = auth.getEmail();
        if (roleEl) roleEl.textContent = auth.getRole();
        const role = auth.getRole();
        const isUser = role === 'User';
        if (creditsRow) creditsRow.classList.toggle('hidden', !isUser);
        if (creditsEl) creditsEl.textContent = isUser ? auth.getCredits() : '-';
        if (serverSection) serverSection.classList.remove('hidden');
        if (permanentGroup) permanentGroup.classList.toggle('hidden', !isUser);
    },
    
    async accountLogin() {
        const email = document.getElementById('account-email')?.value?.trim();
        const password = document.getElementById('account-password')?.value;
        const statusEl = document.getElementById('account-auth-status');
        if (!email || !password) {
            if (statusEl) statusEl.textContent = 'Enter email and password';
            return;
        }
        try {
            await auth.login(email, password);
            this.refreshSettingsAccount();
            this.showToast('Logged in', 'success');
            if (statusEl) statusEl.textContent = '';
        } catch (e) {
            if (statusEl) statusEl.textContent = e.message || 'Login failed';
            this.showToast(e.message || 'Login failed', 'error');
        }
    },
    
    async accountRegister() {
        const email = document.getElementById('account-email')?.value?.trim();
        const password = document.getElementById('account-password')?.value;
        const statusEl = document.getElementById('account-auth-status');
        if (!email || !password) {
            if (statusEl) statusEl.textContent = 'Enter email and password';
            return;
        }
        try {
            const result = await auth.register(email, password);
            this.refreshSettingsAccount();
            if (result && result.needsConfirmation) {
                if (statusEl) statusEl.textContent = 'Please check your email and confirm your account, then log in.';
                this.showToast('Please confirm your email, then log in.', 'success', 5000);
            } else {
                if (statusEl) statusEl.textContent = '';
                this.showToast('Registered. You can log in now.', 'success');
            }
        } catch (e) {
            if (statusEl) statusEl.textContent = e.message || 'Register failed';
            this.showToast(e.message || 'Register failed', 'error');
        }
    },
    
    async accountLogout() {
        try {
            await auth.logout();
            this.refreshSettingsAccount();
            this.showToast('Logged out', 'success');
        } catch (e) {
            this.showToast('Logout failed', 'error');
        }
    },

    showForgotPasswordForm() {
        const forgotBlock = document.getElementById('account-forgot-block');
        const emailInput = document.getElementById('account-reset-email');
        const loginEmail = document.getElementById('account-email')?.value?.trim();
        if (forgotBlock) forgotBlock.classList.remove('hidden');
        if (emailInput && loginEmail) emailInput.value = loginEmail;
        const statusEl = document.getElementById('account-forgot-status');
        if (statusEl) statusEl.textContent = '';
    },

    hideForgotPasswordForm() {
        const forgotBlock = document.getElementById('account-forgot-block');
        if (forgotBlock) forgotBlock.classList.add('hidden');
        const statusEl = document.getElementById('account-forgot-status');
        if (statusEl) statusEl.textContent = '';
    },

    async accountSendResetLink() {
        const emailInput = document.getElementById('account-reset-email');
        const email = (emailInput?.value || document.getElementById('account-email')?.value || '').trim();
        const statusEl = document.getElementById('account-forgot-status');
        if (!email) {
            if (statusEl) statusEl.textContent = 'Enter your email address';
            return;
        }
        try {
            await auth.resetPasswordForEmail(email);
            if (statusEl) statusEl.textContent = 'Check your email for the reset link.';
            this.showToast('Reset link sent. Check your email.', 'success', 5000);
            this.hideForgotPasswordForm();
        } catch (e) {
            const msg = e.message || 'Failed to send reset link';
            if (statusEl) statusEl.textContent = msg;
            this.showToast(msg, 'error');
        }
    },

    async accountUpdatePassword() {
        const newPw = document.getElementById('account-new-password')?.value || '';
        const confirmPw = document.getElementById('account-confirm-password')?.value || '';
        const statusEl = document.getElementById('account-recovery-status');
        if (!newPw) {
            if (statusEl) statusEl.textContent = 'Enter a new password';
            return;
        }
        if (newPw !== confirmPw) {
            if (statusEl) statusEl.textContent = 'Passwords do not match';
            return;
        }
        try {
            await auth.updatePassword(newPw);
            document.getElementById('account-new-password').value = '';
            document.getElementById('account-confirm-password').value = '';
            if (statusEl) statusEl.textContent = '';
            this.refreshSettingsAccount();
            this.showToast('Password updated. You are now logged in.', 'success');
        } catch (e) {
            const msg = e.message || 'Failed to update password';
            if (statusEl) statusEl.textContent = msg;
            this.showToast(msg, 'error');
        }
    },
    
    async serverUpload() {
        const baseUrl = (window.DATA_API_URL || (typeof MATCH_REVIEW_API_URL !== 'undefined' && MATCH_REVIEW_API_URL ? MATCH_REVIEW_API_URL.replace(/\/api\/match-review\/?$/, '') : '')).replace(/\/$/, '');
        if (!baseUrl) {
            this.showToast('Server URL not configured. Set DATA_API_URL in js/config.js.', 'error');
            return;
        }
        let token = null;
        if (typeof auth !== 'undefined' && auth.getToken) token = await auth.getToken();
        if (!token) {
            this.showToast('Please log in first', 'error');
            return;
        }
        const permanent = document.getElementById('upload-permanent')?.checked === true;
        const statusEl = document.getElementById('server-data-status');
        if (statusEl) statusEl.textContent = 'Uploading...';
        try {
            const data = await storage.exportData();
            const res = await fetch(`${baseUrl}/api/data/upload`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ players: data.players, matches: data.matches, permanent })
            });
            const text = await res.text();
            if (!res.ok) {
                const err = JSON.parse(text || '{}').error || text || `HTTP ${res.status}`;
                throw new Error(err);
            }
            if (statusEl) statusEl.textContent = permanent ? 'Saved permanently.' : 'Saved for 7 days. Download to keep or save permanently (1 credit) next time.';
            this.showToast('Uploaded to server', 'success');
            if (auth && auth.fetchProfile) await auth.fetchProfile();
            this.refreshSettingsAccount();
        } catch (e) {
            if (statusEl) statusEl.textContent = '';
            this.showToast(e.message || 'Upload failed', 'error');
        }
    },
    
    async serverDownload() {
        const baseUrl = (window.DATA_API_URL || (typeof MATCH_REVIEW_API_URL !== 'undefined' && MATCH_REVIEW_API_URL ? MATCH_REVIEW_API_URL.replace(/\/api\/match-review\/?$/, '') : '')).replace(/\/$/, '');
        if (!baseUrl) {
            this.showToast('Server URL not configured. Set DATA_API_URL in js/config.js.', 'error');
            return;
        }
        let token = null;
        if (typeof auth !== 'undefined' && auth.getToken) token = await auth.getToken();
        if (!token) {
            this.showToast('Please log in first', 'error');
            return;
        }
        const statusEl = document.getElementById('server-data-status');
        if (statusEl) statusEl.textContent = 'Downloading...';
        try {
            const res = await fetch(`${baseUrl}/api/data/download`, {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const text = await res.text();
            if (!res.ok) {
                const err = JSON.parse(text || '{}').error || text || `HTTP ${res.status}`;
                throw new Error(err);
            }
            const data = JSON.parse(text || '{}');
            if (data.players && data.matches) {
                await storage.importData(data);
                await this.loadMatches();
                await playerManager.loadPlayers();
                if (statusEl) statusEl.textContent = 'Data loaded.';
                this.showToast('Downloaded from server', 'success');
            } else {
                if (statusEl) statusEl.textContent = 'No data on server.';
                this.showToast('No data on server', 'info');
            }
            if (auth && auth.fetchProfile) await auth.fetchProfile();
            this.refreshSettingsAccount();
        } catch (e) {
            if (statusEl) statusEl.textContent = '';
            this.showToast(e.message || 'Download failed', 'error');
        }
    },
    
    // Show page
    // 显示页面
    showPage(pageName) {
        // Hide all pages
        // 隐藏所有页面
        const pages = document.querySelectorAll('.page');
        pages.forEach(page => page.classList.remove('active'));
        
        // Show target page
        // 显示目标页面
        const targetPage = document.getElementById(`${pageName}-page`);
        if (targetPage) {
            targetPage.classList.add('active');
        }
        
        // Update navigation
        // 更新导航
        this.updateNavigation(pageName);
        
        // Update page title
        // 更新页面标题
        this.updatePageTitle(pageName);
        
        // Update add button
        // 更新添加按钮
        this.updateAddButton(pageName);
        
        // Load page-specific data
        // 加载页面特定数据
        if (pageName === 'matches') {
            this.loadMatches();
        } else if (pageName === 'players') {
            playerManager.loadPlayers();
        } else if (pageName === 'new-match') {
            // Refresh player list when opening new match page
            // 打开新比赛页面时刷新玩家列表
            matchRecorder.loadPlayersForMatch();
        } else if (pageName === 'settings') {
            // Fetch latest profile (including credits) from Supabase so Settings shows current data
            // 从 Supabase 拉取最新 profile（含 credits），使设置页显示当前数据
            if (typeof auth !== 'undefined' && auth.isLoggedIn() && auth.fetchProfile) {
                auth.fetchProfile().then(() => this.refreshSettingsAccount());
            } else {
                this.refreshSettingsAccount();
            }
        }
        
        this.currentPage = pageName;
    },
    
    // Update navigation
    // 更新导航
    updateNavigation(pageName) {
        // Update tab buttons
        // 更新标签按钮
        const tabButtons = document.querySelectorAll('.tab-button');
        tabButtons.forEach(button => {
            if (button.dataset.page === pageName) {
                button.classList.add('active');
            } else {
                button.classList.remove('active');
            }
        });
        
        // Show/hide back button
        // 显示/隐藏返回按钮
        const backButton = document.getElementById('back-button');
        const mainPages = ['matches', 'players', 'settings'];
        if (backButton) {
            if (mainPages.includes(pageName)) {
                backButton.classList.add('hidden');
            } else {
                backButton.classList.remove('hidden');
            }
        }
    },
    
    // Update page title
    // 更新页面标题
    updatePageTitle(pageName) {
        const titleEl = document.getElementById('page-title');
        if (!titleEl) return;
        
        const titles = {
            'matches': 'Matches',
            'players': 'Players',
            'settings': 'Log in',
            'new-match': 'New Match',
            'match-recording': 'Recording',
            'match-detail': 'Match Details',
            'player-form': 'Player',
            'player-stats': 'Player Statistics'
        };
        
        titleEl.textContent = titles[pageName] || 'Tennis Recorder';
    },
    
    // Update add button
    // 更新添加按钮
    updateAddButton(pageName) {
        const addButton = document.getElementById('add-button');
        if (!addButton) return;
        
        if (pageName === 'matches') {
            addButton.dataset.action = 'add-match';
            addButton.style.display = 'flex';
        } else if (pageName === 'players') {
            addButton.dataset.action = 'add-player';
            addButton.style.display = 'flex';
        } else {
            addButton.style.display = 'none';
        }
    },
    
    // Go back
    // 返回
    goBack() {
        const backPages = {
            'new-match': 'matches',
            'match-recording': 'matches',
            'match-detail': 'matches',
            'player-form': 'players',
            'player-stats': 'players'
        };
        
        const targetPage = backPages[this.currentPage];
        if (targetPage) {
            this.showPage(targetPage);
        }
    },
    
    // Load matches
    // 加载比赛
    async loadMatches() {
        try {
            const matches = await storage.getAllMatches();
            this.renderMatches(matches);
        } catch (error) {
            console.error('Error loading matches:', error);
            this.showToast('Error loading matches', 'error');
        }
    },
    
    // Render matches
    // 渲染比赛
    async renderMatches(matches) {
        const container = document.getElementById('matches-list');
        const emptyState = document.getElementById('matches-empty');
        
        if (!container) return;
        
        if (matches.length === 0) {
            container.innerHTML = '';
            if (emptyState) emptyState.classList.remove('hidden');
            return;
        }
        
        if (emptyState) emptyState.classList.add('hidden');
        
        // Load player names
        // 加载玩家名称
        const matchesWithPlayers = await Promise.all(matches.map(async (match) => {
            const player1 = await storage.getPlayer(match.player1Id);
            const player2 = await storage.getPlayer(match.player2Id);
            return { match, player1, player2 };
        }));
        
        container.innerHTML = matchesWithPlayers.map(({ match, player1, player2 }) => {
            const player1Name = player1 ? player1.name : 'Unknown Player 1';
            const player2Name = player2 ? player2.name : 'Unknown Player 2';
            const score = getMatchScoreSummary(match);
            const date = formatDate(match.startTime);
            const status = match.status === 'completed' ? 'Completed' : 'In Progress';
            const statusClass = match.status === 'completed' ? 'completed' : 'in-progress';
            
            return `
                <div class="match-card" data-match-id="${match.id}">
                    <div class="match-header">
                        <div>
                            <div class="match-title">${this.escapeHtml(player1Name)} vs ${this.escapeHtml(player2Name)}</div>
                            <div class="match-date">${date}</div>
                        </div>
                        <div class="match-status-badge ${statusClass}">${status}</div>
                    </div>
                    <div class="match-score">${score}</div>
                </div>
            `;
        }).join('');
        
        // Add click listeners
        // 添加点击监听器
        container.querySelectorAll('.match-card').forEach(card => {
            card.addEventListener('click', () => {
                const matchId = card.dataset.matchId;
                if (matches.find(m => m.id === matchId).status === 'in-progress') {
                    matchRecorder.loadMatchForRecording(matchId);
                } else {
                    this.showMatchDetail(matchId);
                }
            });
        });
    },
    
    // Show match detail
    // 显示比赛详情
    async showMatchDetail(matchId) {
        try {
            const match = await storage.getMatch(matchId);
            if (!match) {
                this.showToast('Match not found', 'error');
                return;
            }
            // Refresh auth from Supabase session so Match Review button reflects current login
            // 从 Supabase 会话刷新 auth，使 Match Review 按钮与当前登录状态一致
            if (typeof auth !== 'undefined' && auth.supabase) {
                console.log('[MatchReview Debug] showMatchDetail: refreshing auth, auth.supabase exists=', !!auth.supabase);
                const res = await auth.supabase.auth.getSession();
                console.log('[MatchReview Debug] getSession result: keys=', res ? Object.keys(res) : 'null', ', data?.session?=', !!(res && res.data && res.data.session), ', data keys=', res && res.data ? Object.keys(res.data) : 'n/a');
                const session = (res && res.data && res.data.session) ? res.data.session : (res && res.session) ? res.session : (res && res.data && (res.data.user || res.data.access_token)) ? res.data : null;
                const token = auth._tokenFromResult ? auth._tokenFromResult(res) : (session && session.access_token) ? session.access_token : null;
                console.log('[MatchReview Debug] after parse: hasSession=', !!session, ', hasUser=', !!(session && session.user), ', tokenLength=', token ? token.length : 0);
                if (session && session.user) {
                    if (!session.user.email_confirmed_at) {
                        auth.user = null;
                        auth.profile = null;
                        auth.accessToken = null;
                        console.log('[MatchReview Debug] user not confirmed, cleared auth');
                    } else {
                        auth.user = session.user;
                        auth.accessToken = token || (session.access_token) || null;
                        if (auth._saveTokenToStorage) auth._saveTokenToStorage(auth.accessToken);
                        await auth.fetchProfile();
                        console.log('[MatchReview Debug] auth set: user.id=', auth.user?.id, ', role=', auth.profile?.role, ', tokenLen=', auth.accessToken ? auth.accessToken.length : 0);
                    }
                } else {
                    auth.user = null;
                    auth.profile = null;
                    auth.accessToken = null;
                    if (auth._saveTokenToStorage) auth._saveTokenToStorage(null);
                    console.log('[MatchReview Debug] no session/user, cleared auth');
                }
            }
            
            // Rebuild match state from log to ensure sets data is correct
            // 从日志重建比赛状态以确保sets数据正确
            if (match.log && match.log.length > 0) {
                const matchEngine = new MatchEngine(match);
                matchEngine.rebuildMatchStateFromLog();
                // Get the rebuilt match from engine
                // 从引擎获取重建后的比赛
                match.sets = matchEngine.match.sets;
            }
            
            const player1 = await storage.getPlayer(match.player1Id);
            const player2 = await storage.getPlayer(match.player2Id);
            const player1Name = player1 ? player1.name : 'Unknown Player 1';
            const player2Name = player2 ? player2.name : 'Unknown Player 2';
            
            const container = document.getElementById('match-detail-content');
            if (!container) return;
            
            let setsHtml = match.sets.map(set => {
                // Check if in tie-break (has tieBreak but no winner yet)
                // 检查是否在抢七中（有tieBreak但还没有winner）
                const isInTieBreak = set.tieBreak && !set.tieBreak.winner;
                const hasTieBreak = set.tieBreak && (set.tieBreak.winner || isInTieBreak);
                
                // For final set with Super Tie Break that starts directly in tie-break
                // 对于决胜盘直接进入 Super Tie Break 的情况
                // If games are both 0 and there's a tie-break, show tie-break score directly
                // 如果games都是0且有tie-break，直接显示tie-break比分
                if (set.player1Games === 0 && set.player2Games === 0 && hasTieBreak) {
                    const tbPoints = `${set.tieBreak.player1Points || 0}-${set.tieBreak.player2Points || 0}`;
                    const setScore = isInTieBreak ? `TB: ${tbPoints}` : `TB: ${tbPoints} (Finished)`;
                    
                    return `
                        <div class="detail-section">
                            <h3>Set ${set.setNumber}</h3>
                            <div class="detail-row">
                                <span>Score</span>
                                <span>${setScore}</span>
                            </div>
                            <div class="detail-row">
                                <span>Winner</span>
                                <span>${set.winner === 'player1' ? player1Name : set.winner === 'player2' ? player2Name : 'Not finished'}</span>
                            </div>
                        </div>
                    `;
                }
                
                // Normal set display: games score + tie-break if exists
                // 常规盘显示：games比分 + 如果有tie-break则显示
                let setScore = `${set.player1Games}-${set.player2Games}`;
                if (hasTieBreak) {
                    const tbPoints = `${set.tieBreak.player1Points || 0}-${set.tieBreak.player2Points || 0}`;
                    if (isInTieBreak) {
                        // Tie-break in progress
                        // 抢七进行中
                        setScore += ` (TB: ${tbPoints})`;
                    } else {
                        // Tie-break finished
                        // 抢七已结束
                        setScore += ` (${tbPoints})`;
                    }
                }
                
                return `
                    <div class="detail-section">
                        <h3>Set ${set.setNumber}</h3>
                        <div class="detail-row">
                            <span>Score</span>
                            <span>${setScore}</span>
                        </div>
                        <div class="detail-row">
                            <span>Winner</span>
                            <span>${set.winner === 'player1' ? player1Name : set.winner === 'player2' ? player2Name : 'Not finished'}</span>
                        </div>
                    </div>
                `;
            }).join('');
            
            if (setsHtml === '') {
                setsHtml = '<div class="detail-section"><p>No sets played yet</p></div>';
            }
            
            // Generate match log HTML
            // 生成比赛日志HTML
            let logHtml = '';
            if (match.log && match.log.length > 0) {
                const logEntries = match.log.map(entry => {
                    const playerName = entry.player === 'player1' ? player1Name : player2Name;
                    const time = new Date(entry.timestamp);
                    const timeStr = time.toLocaleTimeString('en-US', { 
                        hour: '2-digit', 
                        minute: '2-digit', 
                        second: '2-digit',
                        hour12: false 
                    });
                    
                    let actionText = entry.action || '';
                    if (entry.shotType) {
                        actionText += ` (${entry.shotType})`;
                    }
                    
                    // Format scores for display
                    // 格式化比分用于显示
                    const gameScore = entry.gameScore || '-';
                    const gamesScore = entry.gamesScore || '-';
                    const setsScore = entry.setsScore || '-';
                    
                    return `
                        <div class="log-entry">
                            <div class="log-time">${timeStr}</div>
                            <div class="log-content">
                                <span class="log-player">${this.escapeHtml(playerName)}</span>
                                <span class="log-action">${this.escapeHtml(actionText)}</span>
                            </div>
                            <div class="log-scores">
                                <span class="log-game-score">Score: ${this.escapeHtml(gameScore)}</span>
                                <span class="log-games-score">Game: ${this.escapeHtml(gamesScore)}</span>
                                <span class="log-sets-score">Set: ${this.escapeHtml(setsScore)}</span>
                            </div>
                        </div>
                    `;
                }).join('');
                
                logHtml = `
                    <div class="detail-section">
                        <h3>Match Log</h3>
                        <div class="match-log-container">
                            ${logEntries}
                        </div>
                    </div>
                `;
            } else {
                logHtml = `
                    <div class="detail-section">
                        <h3>Match Log</h3>
                        <p>No log entries available</p>
                    </div>
                `;
            }
            
            // Generate statistics tabs
            // 生成统计标签
            const numSets = match.sets ? match.sets.length : 0;
            let tabsHtml = '<div class="stats-tabs-container">';
            tabsHtml += '<button class="stats-tab active" data-set-number="0">Match</button>';
            for (let i = 1; i <= numSets; i++) {
                tabsHtml += `<button class="stats-tab" data-set-number="${i}">Set ${i}</button>`;
            }
            tabsHtml += '</div>';
            
            // Calculate match statistics (default: Match tab)
            // 计算比赛统计（默认：Match标签）
            let statsHtml = '';
            try {
                // Debug: Check what's available
                // 调试：检查可用的内容
                console.log('Checking for calculateMatchStats:', {
                    'window.calculateMatchStats': typeof window.calculateMatchStats,
                    'calculateMatchStats': typeof calculateMatchStats,
                    'window': typeof window
                });
                
                // Check if calculateMatchStats is available (try window first, then global)
                // 检查 calculateMatchStats 是否可用（先尝试 window，然后全局）
                const calcMatchStats = window.calculateMatchStats || (typeof calculateMatchStats !== 'undefined' ? calculateMatchStats : null);
                if (!calcMatchStats) {
                    console.error('calculateMatchStats not found. Window object:', window);
                    console.error('All window properties:', Object.keys(window).filter(k => k.includes('calculate') || k.includes('statistics')));
                    throw new Error('calculateMatchStats function is not defined. Please check if statistics.js is loaded correctly.');
                }
                const matchStats = calcMatchStats(match);
                // Use full match log for initial match statistics display
                // 使用完整比赛日志进行初始比赛统计显示
                statsHtml = this.generateMatchStatsHTML(matchStats, player1Name, player2Name, match, match.log || null);
            } catch (error) {
                console.error('Error calculating match statistics:', error);
                console.error('Error stack:', error.stack);
                console.error('Match data:', match);
                console.error('Available functions:', typeof window.calculateMatchStats, typeof calculateMatchStats, typeof window.calculatePlayerStats);
                statsHtml = `<div class="detail-section"><p>Statistics unavailable</p><p style="font-size: 12px; color: #888;">Error: ${error.message}</p></div>`;
            }
            const matchReviewLoggedIn = typeof auth !== 'undefined' && auth.isLoggedIn();
            const matchReviewBtnText = !matchReviewLoggedIn ? 'Match Review (log in to use)' : 'Match Review';
            // Allow click when logged in (even if credit low); insufficient credit shows modal instead of generating
            const matchReviewCanUse = matchReviewLoggedIn;
            console.log('[MatchReview Debug] button state: loggedIn=', matchReviewLoggedIn, ', canUse=', matchReviewCanUse, ', text=', matchReviewBtnText, ', auth.user=', !!auth?.user, ', auth.accessToken=', !!auth?.accessToken);
            
            container.innerHTML = `
                <div class="detail-section">
                    <h3>Match Info</h3>
                    <div class="detail-row">
                        <span>Player 1</span>
                        <span>${this.escapeHtml(player1Name)}</span>
                    </div>
                    <div class="detail-row">
                        <span>Player 2</span>
                        <span>${this.escapeHtml(player2Name)}</span>
                    </div>
                    <div class="detail-row">
                        <span>Date</span>
                        <span>${formatDate(match.startTime)}</span>
                    </div>
                    <div class="detail-row">
                        <span>Duration</span>
                        <span>${formatDuration(match.startTime, match.endTime)}</span>
                    </div>
                    <div class="detail-row">
                        <span>Court</span>
                        <span>${match.settings.courtType} ${match.settings.indoor ? '(Indoor)' : '(Outdoor)'}</span>
                    </div>
                    <div class="detail-row">
                        <span>Winner</span>
                        <span>${match.winner === 'player1' ? player1Name : match.winner === 'player2' ? player2Name : 'Not finished'}</span>
                    </div>
                </div>
                ${setsHtml}
                ${logHtml}
                
                <!-- Technical Statistics -->
                ${tabsHtml}
                <div id="match-statistics-container">
                    ${statsHtml}
                </div>
                
                <div class="form-actions">
                    <button class="btn-primary" onclick="app.exportMatchToPDF('${match.id}')">Export to PDF</button>
                    <button class="btn-secondary" ${!matchReviewCanUse ? 'disabled' : ''} onclick="app.requestMatchReview('${match.id}')">${matchReviewBtnText}</button>
                    <button class="btn-danger" onclick="app.deleteMatch('${match.id}')">Delete Match</button>
                </div>
            `;
            
            // Add event listeners for tab switching
            // 为标签切换添加事件监听器
            const tabButtons = container.querySelectorAll('.stats-tab');
            tabButtons.forEach(tab => {
                tab.addEventListener('click', () => {
                    const setNumber = parseInt(tab.getAttribute('data-set-number'));
                    this.switchStatisticsTab(match, setNumber, player1Name, player2Name, tabButtons);
                });
            });
            
            this.showPage('match-detail');
        } catch (error) {
            console.error('Error loading match detail:', error);
            this.showToast('Error loading match details', 'error');
        }
    },
    
    // Show player statistics
    // 显示玩家统计
    async showPlayerStats(playerId) {
        try {
            // Show loading message
            // 显示加载消息
            this.showToast('Calculating statistics...', 'info');
            
            // Get player info
            // 获取玩家信息
            const player = await storage.getPlayer(playerId);
            if (!player) {
                this.showToast('Player not found', 'error');
                return;
            }
            
            // Calculate statistics (real-time calculation)
            // 计算统计（实时计算）
            const stats = await calculatePlayerStats(playerId);
            
            // Display statistics page
            // 显示统计页面
            this.renderPlayerStats(player, stats);
            this.showPage('player-stats');
        } catch (error) {
            console.error('Error calculating statistics:', error);
            this.showToast('Error calculating statistics', 'error');
        }
    },
    
    // Render player statistics
    // 渲染玩家统计
    async renderPlayerStats(player, stats) {
        const container = document.getElementById('player-stats-content');
        if (!container) return;
        
        // Get opponent names for display
        // 获取对手名称用于显示
        const opponentStats = [];
        for (const [opponentId, oppStats] of Object.entries(stats.byOpponent)) {
            const opponent = await storage.getPlayer(opponentId);
            const opponentName = opponent ? opponent.name : 'Unknown';
            opponentStats.push({
                name: opponentName,
                matches: oppStats.matches,
                wins: oppStats.wins,
                losses: oppStats.losses,
                winRate: oppStats.matches > 0 ? ((oppStats.wins / oppStats.matches) * 100).toFixed(1) : '0.0'
            });
        }
        opponentStats.sort((a, b) => b.matches - a.matches);
        
        // Generate shot type chart data
        // 生成击球类型图表数据
        const shotTypeEntries = Object.entries(stats.shotTypes).filter(([_, count]) => count > 0);
        shotTypeEntries.sort((a, b) => b[1] - a[1]);
        
        // Generate court type statistics
        // 生成场地类型统计
        const courtTypeStats = Object.entries(stats.byCourtType)
            .filter(([_, data]) => data.matches > 0)
            .map(([courtType, data]) => ({
                courtType,
                matches: data.matches,
                wins: data.wins,
                winRate: data.matches > 0 ? ((data.wins / data.matches) * 100).toFixed(1) : '0.0'
            }));
        
        container.innerHTML = `
            <div class="detail-section">
                <h3>${this.escapeHtml(player.name)}</h3>
                <div class="player-info">
                    ${player.handedness === 'righty' ? 'Righty' : 'Lefty'} | 
                    ${player.backhandPreference} | 
                    ${player.utrRating ? `UTR: ${player.utrRating}` : 'No UTR'}
                </div>
            </div>
            
            <!-- Match Record -->
            <div class="detail-section">
                <h3>Match Record</h3>
                <div class="stats-grid">
                    <div class="stat-card">
                        <div class="stat-value">${stats.totalMatches}</div>
                        <div class="stat-label">Total Matches</div>
                    </div>
                    <div class="stat-card success">
                        <div class="stat-value">${stats.wins}</div>
                        <div class="stat-label">Wins</div>
                    </div>
                    <div class="stat-card danger">
                        <div class="stat-value">${stats.losses}</div>
                        <div class="stat-label">Losses</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">${stats.winRate}%</div>
                        <div class="stat-label">Win Rate</div>
                    </div>
                </div>
            </div>
            
            <!-- Serve Statistics -->
            <div class="detail-section">
                <h3>Serve Statistics</h3>
                <div class="stats-table">
                    <div class="stats-row">
                        <span>Total Serves</span>
                        <span>${stats.totalServes}</span>
                    </div>
                    <div class="stats-row">
                        <span>1st Serve In %</span>
                        <span>${stats.firstServePercentage}%/${stats.firstServes}</span>
                    </div>
                    <div class="stats-row">
                        <span>1st Serve Won %</span>
                        <span>${stats.firstServePointsWonPercentage || '0.0'}%</span>
                    </div>
                    <div class="stats-row">
                        <span>2nd Serve In %</span>
                        <span>${stats.secondServeInPercentage || '0.0'}%/${stats.secondServes}</span>
                    </div>
                    <div class="stats-row">
                        <span>2nd Serve Won %</span>
                        <span>${stats.secondServePercentage}%</span>
                    </div>
                    <div class="stats-row">
                        <span>Total Serve Point Win %</span>
                        <span>${stats.totalServePointWinPercentage || '0.0'}%</span>
                    </div>
                    <div class="stats-row">
                        <span>Return 1st Serve Won %</span>
                        <span>${stats.returnFirstServePointsWonPercentage || '0.0'}%</span>
                    </div>
                    <div class="stats-row">
                        <span>Return 2nd Serve Won %</span>
                        <span>${stats.returnSecondServePointsWonPercentage || '0.0'}%</span>
                    </div>
                    <div class="stats-row">
                        <span>ACEs</span>
                        <span>${stats.aces}</span>
                    </div>
                    <div class="stats-row">
                        <span>Double Faults</span>
                        <span>${stats.doubleFaults}</span>
                    </div>
                </div>
            </div>
            
            <!-- Break Point Statistics -->
            <div class="detail-section">
                <h3>Break Point Statistics</h3>
                <div class="stats-table">
                    <div class="stats-row">
                        <span>Break Point Converted/Opportunities</span>
                        <span>${stats.breakPointsConverted || 0}/${stats.breakPointsOpportunities || 0}</span>
                    </div>
                    <div class="stats-row">
                        <span>Break Points Converted %</span>
                        <span>${stats.breakPointsConvertedPercentage || '0.0'}%</span>
                    </div>
                </div>
            </div>
            
            <!-- Point Type Statistics -->
            <div class="detail-section">
                <h3>Point Type Statistics</h3>
                <div class="stats-table">
                    <div class="stats-row">
                        <span>Winners</span>
                        <span>${stats.winners}</span>
                    </div>
                    <div class="stats-row">
                        <span>Unforced Errors</span>
                        <span>${stats.unforcedErrors}</span>
                    </div>
                    <div class="stats-row">
                        <span>Forced Errors</span>
                        <span>${stats.forcedErrors}</span>
                    </div>
                    <div class="stats-row">
                        <span>Return Errors</span>
                        <span>${stats.returnErrors}</span>
                    </div>
                    <div class="stats-row">
                        <span>Total Points Won</span>
                        <span>${stats.totalPointsWon}</span>
                    </div>
                    <div class="stats-row">
                        <span>Total Points Lost</span>
                        <span>${stats.totalPointsLost}</span>
                    </div>
                </div>
            </div>
            
            ${shotTypeEntries.length > 0 ? `
            <!-- Shot Type Statistics -->
            <div class="detail-section">
                <h3>Shot Type Breakdown</h3>
                <div class="stats-table">
                    ${shotTypeEntries.map(([shotType, count]) => `
                        <div class="stats-row">
                            <span>${shotType}</span>
                            <span>${count}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
            ` : ''}
            
            ${courtTypeStats.length > 0 ? `
            <!-- Court Type Statistics -->
            <div class="detail-section">
                <h3>Performance by Court Type</h3>
                <div class="stats-table">
                    ${courtTypeStats.map(stat => `
                        <div class="stats-row">
                            <span>${stat.courtType}</span>
                            <span>${stat.wins}-${stat.matches - stat.wins} (${stat.winRate}%)</span>
                        </div>
                    `).join('')}
                </div>
            </div>
            ` : ''}
            
            ${opponentStats.length > 0 ? `
            <!-- Opponent Statistics -->
            <div class="detail-section">
                <h3>Head-to-Head</h3>
                <div class="stats-table">
                    ${opponentStats.map(opp => `
                        <div class="stats-row">
                            <span>${this.escapeHtml(opp.name)}</span>
                            <span>${opp.wins}-${opp.losses} (${opp.winRate}%)</span>
                        </div>
                    `).join('')}
                </div>
            </div>
            ` : ''}
        `;
    },
    
    // Generate match technical statistics HTML
    // 生成比赛技术统计HTML
    generateMatchStatsHTML(matchStats, player1Name, player2Name, match = null, filteredLog = null) {
        const p1 = matchStats.player1;
        const p2 = matchStats.player2;
        
        // Use filtered log if provided (for set-specific stats), otherwise use match.log
        // 如果提供了过滤后的log（用于特定set的统计），则使用它，否则使用match.log
        const logToUse = filteredLog || (match && match.log) || [];
        
        // Calculate unforced errors by shot type
        // 按击球类型统计非受迫性失误
        const calculateUnforcedErrorsByShotType = (playerRole) => {
            const stats = {
                total: 0,
                totalForehand: 0,
                forehandGround: 0,
                forehandSlice: 0,
                forehandVolley: 0,
                totalBackhand: 0,
                backhandGround: 0,
                backhandSlice: 0,
                backhandVolley: 0,
                approachShot: 0,
                overhead: 0,
                dropShot: 0,
                lob: 0
            };
            
            if (!logToUse || logToUse.length === 0) return stats;
            
            for (const entry of logToUse) {
                if (entry.player === playerRole && entry.action === 'Unforced Error' && entry.shotType) {
                    stats.total++;
                    const shotType = entry.shotType;
                    
                    if (shotType === 'Forehand Ground Stroke') {
                        stats.totalForehand++;
                        stats.forehandGround++;
                    } else if (shotType === 'Forehand Slice') {
                        stats.totalForehand++;
                        stats.forehandSlice++;
                    } else if (shotType === 'Forehand Volley') {
                        stats.totalForehand++;
                        stats.forehandVolley++;
                    } else if (shotType === 'Backhand Ground Stroke') {
                        stats.totalBackhand++;
                        stats.backhandGround++;
                    } else if (shotType === 'Backhand Slice') {
                        stats.totalBackhand++;
                        stats.backhandSlice++;
                    } else if (shotType === 'Backhand Volley') {
                        stats.totalBackhand++;
                        stats.backhandVolley++;
                    } else if (shotType === 'Approach Shot') {
                        stats.approachShot++;
                    } else if (shotType === 'Overhead') {
                        stats.overhead++;
                    } else if (shotType === 'Drop Shot') {
                        stats.dropShot++;
                    } else if (shotType === 'Lob') {
                        stats.lob++;
                    }
                }
            }
            
            return stats;
        };
        
        const p1UnforcedErrors = calculateUnforcedErrorsByShotType('player1');
        const p2UnforcedErrors = calculateUnforcedErrorsByShotType('player2');
        
        // Calculate forced errors by shot type
        // 按击球类型统计受迫性失误
        const calculateForcedErrorsByShotType = (playerRole) => {
            const stats = {
                total: 0,
                totalForehand: 0,
                forehandGround: 0,
                forehandSlice: 0,
                forehandVolley: 0,
                totalBackhand: 0,
                backhandGround: 0,
                backhandSlice: 0,
                backhandVolley: 0,
                approachShot: 0,
                overhead: 0,
                dropShot: 0,
                lob: 0
            };
            
            if (!logToUse || logToUse.length === 0) return stats;
            
            for (const entry of logToUse) {
                if (entry.player === playerRole && entry.action === 'Forced Error' && entry.shotType) {
                    stats.total++;
                    const shotType = entry.shotType;
                    
                    if (shotType === 'Forehand Ground Stroke') {
                        stats.totalForehand++;
                        stats.forehandGround++;
                    } else if (shotType === 'Forehand Slice') {
                        stats.totalForehand++;
                        stats.forehandSlice++;
                    } else if (shotType === 'Forehand Volley') {
                        stats.totalForehand++;
                        stats.forehandVolley++;
                    } else if (shotType === 'Backhand Ground Stroke') {
                        stats.totalBackhand++;
                        stats.backhandGround++;
                    } else if (shotType === 'Backhand Slice') {
                        stats.totalBackhand++;
                        stats.backhandSlice++;
                    } else if (shotType === 'Backhand Volley') {
                        stats.totalBackhand++;
                        stats.backhandVolley++;
                    } else if (shotType === 'Approach Shot') {
                        stats.approachShot++;
                    } else if (shotType === 'Overhead') {
                        stats.overhead++;
                    } else if (shotType === 'Drop Shot') {
                        stats.dropShot++;
                    } else if (shotType === 'Lob') {
                        stats.lob++;
                    }
                }
            }
            
            return stats;
        };
        
        const p1ForcedErrors = calculateForcedErrorsByShotType('player1');
        const p2ForcedErrors = calculateForcedErrorsByShotType('player2');
        
        // Calculate winners by shot type
        // 按击球类型统计制胜分
        const calculateWinnersByShotType = (playerRole) => {
            const stats = {
                total: 0,
                totalForehand: 0,
                forehandGround: 0,
                forehandSlice: 0,
                forehandVolley: 0,
                totalBackhand: 0,
                backhandGround: 0,
                backhandSlice: 0,
                backhandVolley: 0,
                approachShot: 0,
                overhead: 0,
                dropShot: 0,
                lob: 0,
                passingShot: 0,
                return: 0
            };
            
            if (!logToUse || logToUse.length === 0) return stats;
            
            for (const entry of logToUse) {
                if (entry.player === playerRole && entry.action === 'Winner' && entry.shotType) {
                    stats.total++;
                    const shotType = entry.shotType;
                    
                    if (shotType === 'Forehand Ground Stroke') {
                        stats.totalForehand++;
                        stats.forehandGround++;
                    } else if (shotType === 'Forehand Slice') {
                        stats.totalForehand++;
                        stats.forehandSlice++;
                    } else if (shotType === 'Forehand Volley') {
                        stats.totalForehand++;
                        stats.forehandVolley++;
                    } else if (shotType === 'Backhand Ground Stroke') {
                        stats.totalBackhand++;
                        stats.backhandGround++;
                    } else if (shotType === 'Backhand Slice') {
                        stats.totalBackhand++;
                        stats.backhandSlice++;
                    } else if (shotType === 'Backhand Volley') {
                        stats.totalBackhand++;
                        stats.backhandVolley++;
                    } else if (shotType === 'Approach Shot') {
                        stats.approachShot++;
                    } else if (shotType === 'Overhead') {
                        stats.overhead++;
                    } else if (shotType === 'Drop Shot') {
                        stats.dropShot++;
                    } else if (shotType === 'Lob') {
                        stats.lob++;
                    } else if (shotType === 'Passing Shot') {
                        stats.passingShot++;
                    } else if (shotType === 'Return') {
                        stats.return++;
                    }
                }
            }
            
            return stats;
        };
        
        const p1Winners = calculateWinnersByShotType('player1');
        const p2Winners = calculateWinnersByShotType('player2');
        
        return `
            <div class="detail-section">
                <!-- Comparison Table -->
                <div class="stats-comparison">
                    <div class="comparison-header">
                        <div class="comparison-player">${this.escapeHtml(player1Name)}</div>
                        <div class="comparison-label">Statistic</div>
                        <div class="comparison-player">${this.escapeHtml(player2Name)}</div>
                    </div>
                    
                    <div class="comparison-section-header">
                        <div>Match Summary</div>
                    </div>
                    
                    <div class="comparison-row">
                        <div class="comparison-value">${p1.pointsWon || 0}</div>
                        <div class="comparison-label">Total Point Won</div>
                        <div class="comparison-value">${p2.pointsWon || 0}</div>
                    </div>
                    
                    <div class="comparison-row">
                        <div class="comparison-value">${p1.pointsWonInRow || 0}</div>
                        <div class="comparison-label">Max Consecutive Points</div>
                        <div class="comparison-value">${p2.pointsWonInRow || 0}</div>
                    </div>
                    
                    <div class="comparison-row">
                        <div class="comparison-value">${p1.aces}</div>
                        <div class="comparison-label">ACEs</div>
                        <div class="comparison-value">${p2.aces}</div>
                    </div>
                    
                    <div class="comparison-row">
                        <div class="comparison-value">${p1.doubleFaults}</div>
                        <div class="comparison-label">Double Faults</div>
                        <div class="comparison-value">${p2.doubleFaults}</div>
                    </div>
                    
                    <div class="comparison-row">
                        <div class="comparison-value">${p1.winners}</div>
                        <div class="comparison-label">Winners</div>
                        <div class="comparison-value">${p2.winners}</div>
                    </div>
                    
                    <div class="comparison-row">
                        <div class="comparison-value">${p1.unforcedErrors}</div>
                        <div class="comparison-label">Unforced Errors</div>
                        <div class="comparison-value">${p2.unforcedErrors}</div>
                    </div>
                    
                    <div class="comparison-row">
                        <div class="comparison-value">${p1.forcedErrors}</div>
                        <div class="comparison-label">Forced Errors</div>
                        <div class="comparison-value">${p2.forcedErrors}</div>
                    </div>
                    
                    <div class="comparison-row">
                        <div class="comparison-value">${p1.returnErrors}</div>
                        <div class="comparison-label">Return Errors</div>
                        <div class="comparison-value">${p2.returnErrors}</div>
                    </div>
                    
                    <div class="comparison-row">
                        <div class="comparison-value">${p1.totalServePointWinPercentage || '0.0'}%</div>
                        <div class="comparison-label">Total Serve Point Win %</div>
                        <div class="comparison-value">${p2.totalServePointWinPercentage || '0.0'}%</div>
                    </div>
                    
                    <div class="comparison-row">
                        <div class="comparison-value">${p1.breakPointsConverted || 0}/${p1.breakPointsOpportunities || 0}</div>
                        <div class="comparison-label">Break Point Converted/Opportunities</div>
                        <div class="comparison-value">${p2.breakPointsConverted || 0}/${p2.breakPointsOpportunities || 0}</div>
                    </div>
                    
                    <div class="comparison-section-header">
                        <div>Unforced Errors</div>
                    </div>
                    
                    <div class="comparison-row">
                        <div class="comparison-value">${p1UnforcedErrors.total}</div>
                        <div class="comparison-label">Total</div>
                        <div class="comparison-value">${p2UnforcedErrors.total}</div>
                    </div>
                    
                    <div class="comparison-row">
                        <div class="comparison-value">${p1UnforcedErrors.totalForehand}</div>
                        <div class="comparison-label">Total Forehand</div>
                        <div class="comparison-value">${p2UnforcedErrors.totalForehand}</div>
                    </div>
                    
                    <div class="comparison-row">
                        <div class="comparison-value">${p1UnforcedErrors.forehandGround}</div>
                        <div class="comparison-label">Forehand Ground</div>
                        <div class="comparison-value">${p2UnforcedErrors.forehandGround}</div>
                    </div>
                    
                    <div class="comparison-row">
                        <div class="comparison-value">${p1UnforcedErrors.forehandSlice}</div>
                        <div class="comparison-label">Forehand Slice</div>
                        <div class="comparison-value">${p2UnforcedErrors.forehandSlice}</div>
                    </div>
                    
                    <div class="comparison-row">
                        <div class="comparison-value">${p1UnforcedErrors.forehandVolley}</div>
                        <div class="comparison-label">Forehand Volley</div>
                        <div class="comparison-value">${p2UnforcedErrors.forehandVolley}</div>
                    </div>
                    
                    <div class="comparison-row">
                        <div class="comparison-value">${p1UnforcedErrors.totalBackhand}</div>
                        <div class="comparison-label">Total Backhand</div>
                        <div class="comparison-value">${p2UnforcedErrors.totalBackhand}</div>
                    </div>
                    
                    <div class="comparison-row">
                        <div class="comparison-value">${p1UnforcedErrors.backhandGround}</div>
                        <div class="comparison-label">Backhand Ground</div>
                        <div class="comparison-value">${p2UnforcedErrors.backhandGround}</div>
                    </div>
                    
                    <div class="comparison-row">
                        <div class="comparison-value">${p1UnforcedErrors.backhandSlice}</div>
                        <div class="comparison-label">Backhand Slice</div>
                        <div class="comparison-value">${p2UnforcedErrors.backhandSlice}</div>
                    </div>
                    
                    <div class="comparison-row">
                        <div class="comparison-value">${p1UnforcedErrors.backhandVolley}</div>
                        <div class="comparison-label">Backhand Volley</div>
                        <div class="comparison-value">${p2UnforcedErrors.backhandVolley}</div>
                    </div>
                    
                    <div class="comparison-row">
                        <div class="comparison-value">${p1UnforcedErrors.approachShot}</div>
                        <div class="comparison-label">Approach Shot</div>
                        <div class="comparison-value">${p2UnforcedErrors.approachShot}</div>
                    </div>
                    
                    <div class="comparison-row">
                        <div class="comparison-value">${p1UnforcedErrors.overhead}</div>
                        <div class="comparison-label">Overhead</div>
                        <div class="comparison-value">${p2UnforcedErrors.overhead}</div>
                    </div>
                    
                    <div class="comparison-row">
                        <div class="comparison-value">${p1UnforcedErrors.dropShot}</div>
                        <div class="comparison-label">Drop Shot</div>
                        <div class="comparison-value">${p2UnforcedErrors.dropShot}</div>
                    </div>
                    
                    <div class="comparison-row">
                        <div class="comparison-value">${p1UnforcedErrors.lob}</div>
                        <div class="comparison-label">Lob</div>
                        <div class="comparison-value">${p2UnforcedErrors.lob}</div>
                    </div>
                    
                    <div class="comparison-section-header">
                        <div>Forced Errors</div>
                    </div>
                    
                    <div class="comparison-row">
                        <div class="comparison-value">${p1ForcedErrors.total}</div>
                        <div class="comparison-label">Total</div>
                        <div class="comparison-value">${p2ForcedErrors.total}</div>
                    </div>
                    
                    <div class="comparison-row">
                        <div class="comparison-value">${p1ForcedErrors.totalForehand}</div>
                        <div class="comparison-label">Total Forehand</div>
                        <div class="comparison-value">${p2ForcedErrors.totalForehand}</div>
                    </div>
                    
                    <div class="comparison-row">
                        <div class="comparison-value">${p1ForcedErrors.forehandGround}</div>
                        <div class="comparison-label">Forehand Ground</div>
                        <div class="comparison-value">${p2ForcedErrors.forehandGround}</div>
                    </div>
                    
                    <div class="comparison-row">
                        <div class="comparison-value">${p1ForcedErrors.forehandSlice}</div>
                        <div class="comparison-label">Forehand Slice</div>
                        <div class="comparison-value">${p2ForcedErrors.forehandSlice}</div>
                    </div>
                    
                    <div class="comparison-row">
                        <div class="comparison-value">${p1ForcedErrors.forehandVolley}</div>
                        <div class="comparison-label">Forehand Volley</div>
                        <div class="comparison-value">${p2ForcedErrors.forehandVolley}</div>
                    </div>
                    
                    <div class="comparison-row">
                        <div class="comparison-value">${p1ForcedErrors.totalBackhand}</div>
                        <div class="comparison-label">Total Backhand</div>
                        <div class="comparison-value">${p2ForcedErrors.totalBackhand}</div>
                    </div>
                    
                    <div class="comparison-row">
                        <div class="comparison-value">${p1ForcedErrors.backhandGround}</div>
                        <div class="comparison-label">Backhand Ground</div>
                        <div class="comparison-value">${p2ForcedErrors.backhandGround}</div>
                    </div>
                    
                    <div class="comparison-row">
                        <div class="comparison-value">${p1ForcedErrors.backhandSlice}</div>
                        <div class="comparison-label">Backhand Slice</div>
                        <div class="comparison-value">${p2ForcedErrors.backhandSlice}</div>
                    </div>
                    
                    <div class="comparison-row">
                        <div class="comparison-value">${p1ForcedErrors.backhandVolley}</div>
                        <div class="comparison-label">Backhand Volley</div>
                        <div class="comparison-value">${p2ForcedErrors.backhandVolley}</div>
                    </div>
                    
                    <div class="comparison-row">
                        <div class="comparison-value">${p1ForcedErrors.approachShot}</div>
                        <div class="comparison-label">Approach Shot</div>
                        <div class="comparison-value">${p2ForcedErrors.approachShot}</div>
                    </div>
                    
                    <div class="comparison-row">
                        <div class="comparison-value">${p1ForcedErrors.overhead}</div>
                        <div class="comparison-label">Overhead</div>
                        <div class="comparison-value">${p2ForcedErrors.overhead}</div>
                    </div>
                    
                    <div class="comparison-row">
                        <div class="comparison-value">${p1ForcedErrors.dropShot}</div>
                        <div class="comparison-label">Drop Shot</div>
                        <div class="comparison-value">${p2ForcedErrors.dropShot}</div>
                    </div>
                    
                    <div class="comparison-row">
                        <div class="comparison-value">${p1ForcedErrors.lob}</div>
                        <div class="comparison-label">Lob</div>
                        <div class="comparison-value">${p2ForcedErrors.lob}</div>
                    </div>
                    
                    <div class="comparison-section-header">
                        <div>Winners</div>
                    </div>
                    
                    <div class="comparison-row">
                        <div class="comparison-value">${p1Winners.total}</div>
                        <div class="comparison-label">Total</div>
                        <div class="comparison-value">${p2Winners.total}</div>
                    </div>
                    
                    <div class="comparison-row">
                        <div class="comparison-value">${p1Winners.totalForehand}</div>
                        <div class="comparison-label">Total Forehand</div>
                        <div class="comparison-value">${p2Winners.totalForehand}</div>
                    </div>
                    
                    <div class="comparison-row">
                        <div class="comparison-value">${p1Winners.forehandGround}</div>
                        <div class="comparison-label">Forehand Ground</div>
                        <div class="comparison-value">${p2Winners.forehandGround}</div>
                    </div>
                    
                    <div class="comparison-row">
                        <div class="comparison-value">${p1Winners.forehandSlice}</div>
                        <div class="comparison-label">Forehand Slice</div>
                        <div class="comparison-value">${p2Winners.forehandSlice}</div>
                    </div>
                    
                    <div class="comparison-row">
                        <div class="comparison-value">${p1Winners.forehandVolley}</div>
                        <div class="comparison-label">Forehand Volley</div>
                        <div class="comparison-value">${p2Winners.forehandVolley}</div>
                    </div>
                    
                    <div class="comparison-row">
                        <div class="comparison-value">${p1Winners.totalBackhand}</div>
                        <div class="comparison-label">Total Backhand</div>
                        <div class="comparison-value">${p2Winners.totalBackhand}</div>
                    </div>
                    
                    <div class="comparison-row">
                        <div class="comparison-value">${p1Winners.backhandGround}</div>
                        <div class="comparison-label">Backhand Ground</div>
                        <div class="comparison-value">${p2Winners.backhandGround}</div>
                    </div>
                    
                    <div class="comparison-row">
                        <div class="comparison-value">${p1Winners.backhandSlice}</div>
                        <div class="comparison-label">Backhand Slice</div>
                        <div class="comparison-value">${p2Winners.backhandSlice}</div>
                    </div>
                    
                    <div class="comparison-row">
                        <div class="comparison-value">${p1Winners.backhandVolley}</div>
                        <div class="comparison-label">Backhand Volley</div>
                        <div class="comparison-value">${p2Winners.backhandVolley}</div>
                    </div>
                    
                    <div class="comparison-row">
                        <div class="comparison-value">${p1Winners.approachShot}</div>
                        <div class="comparison-label">Approach Shot</div>
                        <div class="comparison-value">${p2Winners.approachShot}</div>
                    </div>
                    
                    <div class="comparison-row">
                        <div class="comparison-value">${p1Winners.overhead}</div>
                        <div class="comparison-label">Overhead</div>
                        <div class="comparison-value">${p2Winners.overhead}</div>
                    </div>
                    
                    <div class="comparison-row">
                        <div class="comparison-value">${p1Winners.dropShot}</div>
                        <div class="comparison-label">Drop Shot</div>
                        <div class="comparison-value">${p2Winners.dropShot}</div>
                    </div>
                    
                    <div class="comparison-row">
                        <div class="comparison-value">${p1Winners.lob}</div>
                        <div class="comparison-label">Lob</div>
                        <div class="comparison-value">${p2Winners.lob}</div>
                    </div>
                    
                    <div class="comparison-row">
                        <div class="comparison-value">${p1Winners.passingShot || 0}</div>
                        <div class="comparison-label">Passing Shot</div>
                        <div class="comparison-value">${p2Winners.passingShot || 0}</div>
                    </div>
                    
                    <div class="comparison-row">
                        <div class="comparison-value">${p1Winners.return || 0}</div>
                        <div class="comparison-label">Return</div>
                        <div class="comparison-value">${p2Winners.return || 0}</div>
                    </div>
                    
                    <div class="comparison-section-header">
                        <div>Serve</div>
                    </div>
                    
                    <div class="comparison-row">
                        <div class="comparison-value">${p1.totalServePointWinPercentage || '0.0'}%</div>
                        <div class="comparison-label">Total Serve Point Win %</div>
                        <div class="comparison-value">${p2.totalServePointWinPercentage || '0.0'}%</div>
                    </div>
                    
                    <div class="comparison-row">
                        <div class="comparison-value">${p1.firstServePercentage}%/${p1.firstServes}</div>
                        <div class="comparison-label">1st Serve In %/Total</div>
                        <div class="comparison-value">${p2.firstServePercentage}%/${p2.firstServes}</div>
                    </div>
                    
                    <div class="comparison-row">
                        <div class="comparison-value">${p1.aces}</div>
                        <div class="comparison-label">ACEs</div>
                        <div class="comparison-value">${p2.aces}</div>
                    </div>
                    
                    <div class="comparison-row">
                        <div class="comparison-value">${p1.doubleFaults}</div>
                        <div class="comparison-label">Double Faults</div>
                        <div class="comparison-value">${p2.doubleFaults}</div>
                    </div>
                    
                    <div class="comparison-row">
                        <div class="comparison-value">${p1.firstServePointsWonPercentage || '0.0'}%</div>
                        <div class="comparison-label">1st Serve Won %</div>
                        <div class="comparison-value">${p2.firstServePointsWonPercentage || '0.0'}%</div>
                    </div>
                    
                    <div class="comparison-row">
                        <div class="comparison-value">${p1.secondServeInPercentage || '0.0'}%/${p1.secondServes}</div>
                        <div class="comparison-label">2nd Serve In %/Total</div>
                        <div class="comparison-value">${p2.secondServeInPercentage || '0.0'}%/${p2.secondServes}</div>
                    </div>
                    
                    <div class="comparison-row">
                        <div class="comparison-value">${p1.secondServePercentage}%</div>
                        <div class="comparison-label">2nd Serve Won %</div>
                        <div class="comparison-value">${p2.secondServePercentage}%</div>
                    </div>
                    
                    <div class="comparison-section-header">
                        <div>Return</div>
                    </div>
                    
                    <div class="comparison-row">
                        <div class="comparison-value">${p1.totalReturnPointWinPercentage || '0.0'}%</div>
                        <div class="comparison-label">Total Return Point Win %</div>
                        <div class="comparison-value">${p2.totalReturnPointWinPercentage || '0.0'}%</div>
                    </div>
                    
                    <div class="comparison-row">
                        <div class="comparison-value">${p1.returnFirstServePointsWonPercentage || '0.0'}%</div>
                        <div class="comparison-label">Return 1st Serve Won %</div>
                        <div class="comparison-value">${p2.returnFirstServePointsWonPercentage || '0.0'}%</div>
                    </div>
                    
                    <div class="comparison-row">
                        <div class="comparison-value">${p1.returnSecondServePointsWonPercentage || '0.0'}%</div>
                        <div class="comparison-label">Return 2nd Serve Won %</div>
                        <div class="comparison-value">${p2.returnSecondServePointsWonPercentage || '0.0'}%</div>
                    </div>
                    
                    <div class="comparison-row">
                        <div class="comparison-value">${p1.returnErrors}</div>
                        <div class="comparison-label">Return Errors</div>
                        <div class="comparison-value">${p2.returnErrors}</div>
                    </div>
                    
                    <div class="comparison-row">
                        <div class="comparison-value">${p1Winners.return || 0}</div>
                        <div class="comparison-label">Return Winners</div>
                        <div class="comparison-value">${p2Winners.return || 0}</div>
                    </div>
                    
                    <div class="comparison-row">
                        <div class="comparison-value">${p1.breakPointsConverted || 0}/${p1.breakPointsOpportunities || 0}</div>
                        <div class="comparison-label">Break Point Converted/Opportunities</div>
                        <div class="comparison-value">${p2.breakPointsConverted || 0}/${p2.breakPointsOpportunities || 0}</div>
                    </div>
                </div>
            </div>
        `;
    },
    
    // Switch statistics tab (Match or Set)
    // 切换统计标签（Match或Set）
    switchStatisticsTab(match, setNumber, player1Name, player2Name, tabButtons) {
        // Update active tab styling
        // 更新活动标签样式
        tabButtons.forEach(tab => {
            const tabSetNumber = parseInt(tab.getAttribute('data-set-number'));
            if (tabSetNumber === setNumber) {
                tab.classList.add('active');
            } else {
                tab.classList.remove('active');
            }
        });
        
        // Calculate statistics based on selected tab
        // 根据选中的标签计算统计
        let statsHtml = '';
        try {
            let matchStats;
            let filteredLog = null;
            if (setNumber === 0) {
                // Match statistics (all sets)
                // 比赛统计（所有盘）
                const calcMatchStats = window.calculateMatchStats || (typeof calculateMatchStats !== 'undefined' ? calculateMatchStats : null);
                if (!calcMatchStats) {
                    throw new Error('calculateMatchStats function is not defined.');
                }
                matchStats = calcMatchStats(match);
                // Use full match log for match statistics
                // 使用完整比赛日志进行比赛统计
                filteredLog = match.log || null;
            } else {
                // Set-specific statistics
                // 特定盘的统计
                const calcSetStats = window.calculateSetStats || (typeof calculateSetStats !== 'undefined' ? calculateSetStats : null);
                if (!calcSetStats) {
                    throw new Error('calculateSetStats function is not defined.');
                }
                matchStats = calcSetStats(match, setNumber);
                // Get filtered log for this set
                // 获取此盘的过滤后日志
                if (match && match.log) {
                    // Helper function to determine set number from log entry
                    // 辅助函数：从日志条目确定盘数
                    const getSetNumberFromEntry = (entry, index, allLogEntries) => {
                        if (!entry.setsScore) return null;
                        const parts = entry.setsScore.split('-');
                        if (parts.length !== 2) return null;
                        const player1Sets = parseInt(parts[0].trim()) || 0;
                        const player2Sets = parseInt(parts[1].trim()) || 0;
                        const completedSets = player1Sets + player2Sets;
                        
                        if (index === 0) return 1;
                        
                        const prevEntry = allLogEntries[index - 1];
                        if (!prevEntry || !prevEntry.setsScore) return completedSets + 1;
                        
                        const prevParts = prevEntry.setsScore.split('-');
                        const prevPlayer1Sets = parseInt(prevParts[0].trim()) || 0;
                        const prevPlayer2Sets = parseInt(prevParts[1].trim()) || 0;
                        const prevCompletedSets = prevPlayer1Sets + prevPlayer2Sets;
                        
                        if (completedSets > prevCompletedSets) {
                            return completedSets;
                        }
                        
                        if (entry.gamesScore === '0-0' && prevEntry.gamesScore !== '0-0') {
                            return completedSets + 1;
                        }
                        
                        return completedSets + 1;
                    };
                    
                    filteredLog = match.log.filter((entry, index) => {
                        const entrySetNumber = getSetNumberFromEntry(entry, index, match.log);
                        return entrySetNumber === setNumber;
                    });
                }
            }
            statsHtml = this.generateMatchStatsHTML(matchStats, player1Name, player2Name, match, filteredLog);
        } catch (error) {
            console.error('Error calculating statistics:', error);
            statsHtml = `<div class="detail-section"><p>Statistics unavailable</p><p style="font-size: 12px; color: #888;">Error: ${error.message}</p></div>`;
        }
        
        // Update statistics container
        // 更新统计容器
        const statsContainer = document.getElementById('match-statistics-container');
        if (statsContainer) {
            statsContainer.innerHTML = statsHtml;
        }
    },
    
    // Build plain-text match summary for AI (same info as PDF, no binary)
    // 为 AI 构建纯文本比赛摘要（与 PDF 信息一致，非二进制）
    buildMatchSummaryForAI(match, player1Name, player2Name) {
        const lines = [];
        lines.push('=== Match Information ===');
        lines.push(`Player 1: ${player1Name}`);
        lines.push(`Player 2: ${player2Name}`);
        lines.push(`Date: ${formatDate(match.startTime)}`);
        lines.push(`Duration: ${formatDuration(match.startTime, match.endTime)}`);
        lines.push(`Court: ${match.settings.courtType} ${match.settings.indoor ? '(Indoor)' : '(Outdoor)'}`);
        lines.push(`Winner: ${match.winner === 'player1' ? player1Name : match.winner === 'player2' ? player2Name : 'Not finished'}`);
        lines.push('');
        if (match.sets && match.sets.length > 0) {
            lines.push('=== Sets ===');
            match.sets.forEach((set) => {
                const hasTieBreak = set.tieBreak && (set.tieBreak.winner || (set.tieBreak.player1Points !== undefined));
                let setScore = `${set.player1Games}-${set.player2Games}`;
                if (hasTieBreak) {
                    const tb = set.tieBreak;
                    const tbScore = `${tb.player1Points || 0}-${tb.player2Points || 0}`;
                    setScore += set.tieBreak.winner ? ` (${tbScore})` : ` (TB: ${tbScore})`;
                }
                const setWinner = set.winner === 'player1' ? player1Name : set.winner === 'player2' ? player2Name : 'Not finished';
                lines.push(`Set ${set.setNumber}: ${setScore}, Winner: ${setWinner}`);
            });
            lines.push('');
        }
        const calcMatchStats = window.calculateMatchStats || (typeof calculateMatchStats !== 'undefined' ? calculateMatchStats : null);
        if (calcMatchStats) {
            const stats = calcMatchStats(match);
            const p1 = stats.player1;
            const p2 = stats.player2;
            lines.push('=== Technical Statistics ===');
            lines.push('Match Summary:');
            lines.push(`  Points Won: ${p1.pointsWon || 0} / ${p2.pointsWon || 0}`);
            lines.push(`  Max Consecutive Points: ${p1.pointsWonInRow || 0} / ${p2.pointsWonInRow || 0}`);
            lines.push(`  ACEs: ${p1.aces || 0} / ${p2.aces || 0}`);
            lines.push(`  Double Faults: ${p1.doubleFaults || 0} / ${p2.doubleFaults || 0}`);
            lines.push(`  Winners: ${p1.winners || 0} / ${p2.winners || 0}`);
            lines.push(`  Unforced Errors: ${p1.unforcedErrors || 0} / ${p2.unforcedErrors || 0}`);
            lines.push(`  Forced Errors: ${p1.forcedErrors || 0} / ${p2.forcedErrors || 0}`);
            lines.push(`  Return Errors: ${p1.returnErrors || 0} / ${p2.returnErrors || 0}`);
            lines.push(`  Total Serve Point Win %: ${p1.totalServePointWinPercentage || '0.0'}% / ${p2.totalServePointWinPercentage || '0.0'}%`);
            lines.push(`  Break Points: ${p1.breakPointsConverted || 0}/${p1.breakPointsOpportunities || 0} / ${p2.breakPointsConverted || 0}/${p2.breakPointsOpportunities || 0}`);
            lines.push('Serve:');
            lines.push(`  1st Serve In %: ${p1.firstServePercentage}% / ${p2.firstServePercentage}%`);
            lines.push(`  1st Serve Won %: ${p1.firstServePointsWonPercentage || '0.0'}% / ${p2.firstServePointsWonPercentage || '0.0'}%`);
            lines.push(`  2nd Serve Won %: ${p1.secondServePercentage}% / ${p2.secondServePercentage}%`);
            lines.push('Return:');
            lines.push(`  Total Return Point Win %: ${p1.totalReturnPointWinPercentage || '0.0'}% / ${p2.totalReturnPointWinPercentage || '0.0'}%`);
            lines.push(`  Return 1st Serve Won %: ${p1.returnFirstServePointsWonPercentage || '0.0'}% / ${p2.returnFirstServePointsWonPercentage || '0.0'}%`);
            lines.push(`  Return 2nd Serve Won %: ${p1.returnSecondServePointsWonPercentage || '0.0'}% / ${p2.returnSecondServePointsWonPercentage || '0.0'}%`);
        }
        return lines.join('\n');
    },
    
    // Request AI match review via backend proxy (requires login; credits checked by API)
    // 通过后端代理请求 AI 比赛战报（须登录；积分由 API 校验）
    async requestMatchReview(matchId) {
        console.log('[MatchReview] start, matchId=', matchId, ', SUPABASE_URL=', typeof window !== 'undefined' && window.SUPABASE_URL ? '(set)' : '(not set)');
        if (!MATCH_REVIEW_API_URL || MATCH_REVIEW_API_URL.trim() === '') {
            console.log('[MatchReview] abort: MATCH_REVIEW_API_URL not configured');
            this.showToast('Match Review is not configured. Set MATCH_REVIEW_API_URL in app.js and deploy the backend.', 'error', 5000);
            return;
        }
        // Button is only enabled when logged in; get token from Supabase localStorage first, then getSession()
        // 按钮仅在登录后可用；优先从 Supabase localStorage 取 token，再尝试 getSession()
        const projectRef = (window.SUPABASE_URL && window.SUPABASE_URL.match(/https?:\/\/([^.]+)\.supabase\.co/)) ? window.SUPABASE_URL.match(/https?:\/\/([^.]+)\.supabase\.co/)[1] : null;
        const SUPABASE_AUTH_KEY = projectRef ? `sb-${projectRef}-auth-token` : 'sb-aefxxgffuuduvzkgjttu-auth-token';
        console.log('[MatchReview] token lookup: projectRef=', projectRef, ', SUPABASE_AUTH_KEY=', SUPABASE_AUTH_KEY);
        if (typeof localStorage !== 'undefined') {
            const sbKeys = Object.keys(localStorage).filter(k => k.indexOf('sb-') === 0 || k.indexOf('auth') !== -1);
            console.log('[MatchReview] localStorage keys (sb-/auth)=', sbKeys.length ? sbKeys : 'none');
        }
        let token = null;
        let tokenSource = '';
        if (typeof localStorage !== 'undefined' && SUPABASE_AUTH_KEY) {
            try {
                const raw = localStorage.getItem(SUPABASE_AUTH_KEY);
                console.log('[MatchReview] localStorage.getItem(SUPABASE_AUTH_KEY): hasRaw=', !!raw, 'rawLength=', raw ? raw.length : 0);
                if (raw) {
                    const data = JSON.parse(raw);
                    if (data && typeof data === 'object') {
                        token = data.access_token
                            || (data.currentSession && data.currentSession.access_token)
                            || (data.session && data.session.access_token)
                            || (Array.isArray(data) && data[0] && data[0].access_token)
                            || null;
                        if (!token) {
                            const s = data.currentSession || data.session || (Array.isArray(data) ? data[0] : data);
                            if (s && s.access_token) token = s.access_token;
                        }
                    }
                }
                if (token) tokenSource = 'localStorage(' + SUPABASE_AUTH_KEY + ')';
            } catch (e) {
                console.warn('[MatchReview] localStorage parse failed', e);
            }
        }
        if (!token && typeof sessionStorage !== 'undefined' && typeof auth !== 'undefined' && auth._TOKEN_KEY) {
            try {
                token = sessionStorage.getItem(auth._TOKEN_KEY);
                if (token) tokenSource = 'sessionStorage';
            } catch (e) {}
        }
        if (!token && typeof auth !== 'undefined' && auth.supabase) {
            try {
                const res = await auth.supabase.auth.getSession();
                token = (res && res.data && res.data.session && res.data.session.access_token) ? res.data.session.access_token
                    : (res && res.data && res.data.access_token) ? res.data.access_token
                    : (res && res.session && res.session.access_token) ? res.session.access_token
                    : (res && res.access_token) ? res.access_token
                    : null;
                if (token) tokenSource = 'getSession()';
                else {
                    console.log('[MatchReview] getSession() returned no token. res keys=', res ? Object.keys(res) : 'null');
                    if (res && res.data) console.log('[MatchReview] res.data keys=', Object.keys(res.data), ', res.data=', JSON.stringify(res.data).slice(0, 200));
                }
            } catch (e) {
                console.warn('[MatchReview] getSession failed', e);
            }
        }
        if (!token && typeof localStorage !== 'undefined') {
            try {
                const projectRef2 = (window.SUPABASE_URL && window.SUPABASE_URL.match(/https?:\/\/([^.]+)\.supabase\.co/)) ? window.SUPABASE_URL.match(/https?:\/\/([^.]+)\.supabase\.co/)[1] : null;
                if (projectRef2) {
                    const key = `sb-${projectRef2}-auth-token`;
                    if (key !== SUPABASE_AUTH_KEY) {
                        const raw = localStorage.getItem(key);
                        if (raw) {
                            const data = JSON.parse(raw);
                            const s = data?.currentSession || data?.session || data;
                            if (s && s.access_token) token = s.access_token;
                            else if (data && data.access_token) token = data.access_token;
                        }
                        if (token) tokenSource = 'localStorage(' + key + ')';
                    }
                }
            } catch (e) {}
        }
        if (!token) {
            console.log('[MatchReview] no token from any source, abort');
            this.showToast('Please log in to use Match Review.', 'error', 5000);
            return;
        }
        console.log('[MatchReview] token from', tokenSource, ', token length=', token.length);
        // Check credits for User role: if insufficient, show modal and do not call API
        if (typeof auth !== 'undefined' && auth.getRole && auth.getRole() === 'User') {
            if (typeof auth.fetchProfile === 'function') await auth.fetchProfile();
            const credits = auth.getCredits();
            if (credits == null || credits < 1) {
                if (typeof window.showInsufficientCreditsModal === 'function') {
                    window.showInsufficientCreditsModal();
                } else {
                    this.showInsufficientCreditsModal();
                }
                return;
            }
        }
        try {
            const match = await storage.getMatch(matchId);
            if (!match) {
                this.showToast('Match not found', 'error');
                return;
            }
            if (match.log && match.log.length > 0) {
                const matchEngine = new MatchEngine(match);
                matchEngine.rebuildMatchStateFromLog();
                match.sets = matchEngine.match.sets;
            }
            const player1 = await storage.getPlayer(match.player1Id);
            const player2 = await storage.getPlayer(match.player2Id);
            const player1Name = player1 ? player1.name : 'Unknown Player 1';
            const player2Name = player2 ? player2.name : 'Unknown Player 2';
            const summary = this.buildMatchSummaryForAI(match, player1Name, player2Name);
            let systemPrompt = '';
            try {
                const rulesRes = await fetch('data/match-review-rules.md');
                if (rulesRes.ok) systemPrompt = await rulesRes.text();
            } catch (e) {
                console.warn('Could not load match-review-rules.md, using default prompt.', e);
            }
            if (!systemPrompt.trim()) {
                systemPrompt = 'You are a professional tennis match analyst. Write a structured, data-driven match review in English based on the match data provided. Include: brief overview, key statistics, serve/return analysis, turning points, strengths and weaknesses, and suggestions. Be concise and professional.';
            }
            this.showToast('Generating review... This may take up to a minute.', 'info', 70000);
            const headers = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` };
            console.log('[MatchReview] sending POST to', MATCH_REVIEW_API_URL);
            const res = await fetch(MATCH_REVIEW_API_URL, {
                method: 'POST',
                headers,
                body: JSON.stringify({ systemPrompt, userMessage: summary })
            });
            const text = await res.text();
            console.log('[MatchReview] response status=', res.status, 'ok=', res.ok, 'body length=', text.length);
            if (!res.ok) {
                console.log('[MatchReview] error body (first 300 chars)=', text.slice(0, 300));
                if (res.status === 504 || res.status === 408) {
                    throw new Error('Request timed out. Generating review can take up to a minute. Please try again.');
                }
                try {
                    const err = JSON.parse(text);
                    throw new Error(err.error || err.message || `HTTP ${res.status}`);
                } catch (parseErr) {
                    throw new Error(text || `HTTP ${res.status}`);
                }
            }
            let reviewText = text;
            try {
                const data = JSON.parse(text);
                if (data.review != null) reviewText = data.review;
                else if (data.text != null) reviewText = data.text;
                else if (data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) reviewText = data.choices[0].message.content;
            } catch (_) {}
            console.log('[MatchReview] success, review length=', reviewText.length);
            if (typeof auth !== 'undefined' && auth.fetchProfile) await auth.fetchProfile();
            this.showMatchReviewModal(reviewText, player1Name, player2Name, match.startTime);
            this.showToast('Review ready', 'success');
        } catch (error) {
            console.log('[MatchReview] catch:', error.message);
            console.error('Error requesting match review:', error);
            let msg = error.message || 'Error generating match review';
            if (msg.toLowerCase().includes('please log in')) {
                msg = 'Please log in to use Match Review.';
            } else if (msg.toLowerCase().includes('insufficient credits')) {
                msg = 'Insufficient credits. Go to Log in to see your credits.';
            } else if (msg.toLowerCase().includes('insufficient balance')) {
                msg = 'Deepseek account balance is low. Please top up at platform.deepseek.com';
            } else if (msg.toLowerCase().includes('timeout') || msg.toLowerCase().includes('timed out') || msg.toLowerCase().includes('504') || msg.toLowerCase().includes('408')) {
                msg = 'Request timed out. Generating review can take up to a minute. Please try again.';
            }
            this.showToast(msg, 'error', 7000);
        }
    },
    
    // Fallback if insufficient-credits-modal.js not loaded; otherwise use window.showInsufficientCreditsModal()
    showInsufficientCreditsModal() {
        if (typeof window.showInsufficientCreditsModal === 'function') {
            window.showInsufficientCreditsModal();
            return;
        }
        this.showToast('Insufficient credits. Contact donghan1986@icloud.com for top-up.', 'error', 6000);
    },
    
    // Show match review in modal with Download and Close
    // 在弹窗中显示比赛战报，提供下载和关闭
    showMatchReviewModal(reviewText, player1Name, player2Name, startTime) {
        const overlay = document.createElement('div');
        overlay.className = 'modal';
        overlay.setAttribute('aria-label', 'Match Review');
        const dateStr = formatDate(startTime).replace(/\//g, '-').replace(/\s/g, '_').replace(/:/g, '-');
        const safe1 = (player1Name || 'Player1').replace(/[^a-zA-Z0-9\s-]/g, '').trim() || 'Player1';
        const safe2 = (player2Name || 'Player2').replace(/[^a-zA-Z0-9\s-]/g, '').trim() || 'Player2';
        const filename = `MatchReview_${safe1}_vs_${safe2}_${dateStr}.txt`;
        const content = document.createElement('div');
        content.className = 'modal-content';
        content.innerHTML = `
            <div class="modal-header">
                <h3>Match Review</h3>
                <button type="button" class="modal-close" aria-label="Close">&times;</button>
            </div>
            <div class="modal-body">
                <pre class="match-review-text" style="white-space: pre-wrap; word-break: break-word; max-height: 50vh; overflow-y: auto; margin: 0 0 16px 0; font-size: 14px;">${this.escapeHtml(reviewText)}</pre>
                <div class="form-actions">
                    <button type="button" class="btn-primary download-review-btn">Download</button>
                    <button type="button" class="btn-secondary modal-close-btn">Close</button>
                </div>
            </div>
        `;
        overlay.appendChild(content);
        const close = () => {
            overlay.classList.add('hidden');
            setTimeout(() => overlay.remove(), 300);
        };
        content.querySelector('.modal-close').addEventListener('click', close);
        content.querySelector('.modal-close-btn').addEventListener('click', close);
        overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
        content.querySelector('.download-review-btn').addEventListener('click', () => {
            const blob = new Blob([reviewText], { type: 'text/plain;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            this.showToast('Review saved to downloads', 'success');
        });
        document.body.appendChild(overlay);
    },
    
    // Export match to PDF
    // 导出比赛为PDF
    async exportMatchToPDF(matchId) {
        try {
            const match = await storage.getMatch(matchId);
            if (!match) {
                this.showToast('Match not found', 'error');
                return;
            }
            
            const player1 = await storage.getPlayer(match.player1Id);
            const player2 = await storage.getPlayer(match.player2Id);
            const player1Name = player1 ? player1.name : 'Unknown Player 1';
            const player2Name = player2 ? player2.name : 'Unknown Player 2';
            
            // Check if jsPDF is available, if not try to load it
            // 检查jsPDF是否可用，如果不可用则尝试加载
            if (typeof window.jspdf === 'undefined') {
                // Try to load jsPDF dynamically
                // 尝试动态加载jsPDF
                this.showToast('Loading PDF library...', 'info');
                await this.loadJsPDF();
            }
            
            // Check again after loading
            // 加载后再次检查
            if (typeof window.jspdf === 'undefined') {
                this.showToast('PDF library failed to load. Please check your internet connection.', 'error');
                return;
            }
            
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();
            
            // Set font
            // 设置字体
            doc.setFont('helvetica');
            
            // Title
            // 标题
            doc.setFontSize(18);
            doc.text('Tennis Match Report', 105, 20, { align: 'center' });
            
            let yPos = 35;
            
            // Match Info
            // 比赛信息
            doc.setFontSize(14);
            doc.text('Match Information', 14, yPos);
            yPos += 8;
            
            doc.setFontSize(10);
            doc.text(`Player 1: ${player1Name}`, 14, yPos);
            yPos += 6;
            doc.text(`Player 2: ${player2Name}`, 14, yPos);
            yPos += 6;
            doc.text(`Date: ${formatDate(match.startTime)}`, 14, yPos);
            yPos += 6;
            doc.text(`Duration: ${formatDuration(match.startTime, match.endTime)}`, 14, yPos);
            yPos += 6;
            doc.text(`Court: ${match.settings.courtType} ${match.settings.indoor ? '(Indoor)' : '(Outdoor)'}`, 14, yPos);
            yPos += 6;
            doc.text(`Winner: ${match.winner === 'player1' ? player1Name : match.winner === 'player2' ? player2Name : 'Not finished'}`, 14, yPos);
            yPos += 10;
            
            // Sets
            // 盘
            if (match.sets && match.sets.length > 0) {
                doc.setFontSize(14);
                doc.text('Sets', 14, yPos);
                yPos += 8;
                
                doc.setFontSize(10);
                match.sets.forEach((set, index) => {
                    // Check if we need a new page
                    // 检查是否需要新页面
                    if (yPos > 270) {
                        doc.addPage();
                        yPos = 20;
                    }
                    
                    const isInTieBreak = set.tieBreak && !set.tieBreak.winner;
                    const hasTieBreak = set.tieBreak && (set.tieBreak.winner || isInTieBreak);
                    
                    let setScore = `${set.player1Games}-${set.player2Games}`;
                    if (hasTieBreak) {
                        const tbPoints = `${set.tieBreak.player1Points || 0}-${set.tieBreak.player2Points || 0}`;
                        if (isInTieBreak) {
                            setScore += ` (TB: ${tbPoints})`;
                        } else {
                            setScore += ` (${tbPoints})`;
                        }
                    }
                    
                    if (set.player1Games === 0 && set.player2Games === 0 && hasTieBreak) {
                        const tbPoints = `${set.tieBreak.player1Points || 0}-${set.tieBreak.player2Points || 0}`;
                        setScore = isInTieBreak ? `TB: ${tbPoints}` : `TB: ${tbPoints} (Finished)`;
                    }
                    
                    const winner = set.winner === 'player1' ? player1Name : set.winner === 'player2' ? player2Name : 'Not finished';
                    
                    doc.text(`Set ${set.setNumber}: ${setScore}`, 20, yPos);
                    yPos += 6;
                    doc.text(`Winner: ${winner}`, 30, yPos);
                    yPos += 8;
                });
            }
            
            // Technical Statistics
            // 技术统计
            try {
                // Check if we need a new page
                // 检查是否需要新页面
                if (yPos > 200) {
                    doc.addPage();
                    yPos = 20;
                }
                
                // Calculate match statistics
                // 计算比赛统计
                const calcMatchStats = window.calculateMatchStats || (typeof calculateMatchStats !== 'undefined' ? calculateMatchStats : null);
                if (calcMatchStats) {
                    const matchStats = calcMatchStats(match);
                    const p1 = matchStats.player1;
                    const p2 = matchStats.player2;
                    
                    doc.setFontSize(14);
                    doc.text('Technical Statistics', 14, yPos);
                    yPos += 10;
                    
                    doc.setFontSize(10);
                    
                    // Match Summary Section
                    // 比赛摘要部分
                    doc.setFontSize(11);
                    doc.setFont('helvetica', 'bold');
                    doc.text('Match Summary', 14, yPos);
                    yPos += 7;
                    doc.setFont('helvetica', 'normal');
                    doc.setFontSize(9);
                    
                    // Helper function to add a stat row
                    // 辅助函数：添加统计行
                    const addStatRow = (label, p1Value, p2Value) => {
                        if (yPos > 280) {
                            doc.addPage();
                            yPos = 20;
                        }
                        doc.text(`${p1Value}`, 14, yPos);
                        doc.text(label, 70, yPos);
                        doc.text(`${p2Value}`, 150, yPos);
                        yPos += 6;
                    };
                    
                    addStatRow('Total Point Won', p1.pointsWon || 0, p2.pointsWon || 0);
                    addStatRow('Max Consecutive Points', p1.pointsWonInRow || 0, p2.pointsWonInRow || 0);
                    addStatRow('ACEs', p1.aces || 0, p2.aces || 0);
                    addStatRow('Double Faults', p1.doubleFaults || 0, p2.doubleFaults || 0);
                    addStatRow('Winners', p1.winners || 0, p2.winners || 0);
                    addStatRow('Unforced Errors', p1.unforcedErrors || 0, p2.unforcedErrors || 0);
                    addStatRow('Forced Errors', p1.forcedErrors || 0, p2.forcedErrors || 0);
                    addStatRow('Return Errors', p1.returnErrors || 0, p2.returnErrors || 0);
                    addStatRow('Total Serve Point Win %', `${p1.totalServePointWinPercentage || '0.0'}%`, `${p2.totalServePointWinPercentage || '0.0'}%`);
                    addStatRow('Break Point Converted/Opportunities', `${p1.breakPointsConverted || 0}/${p1.breakPointsOpportunities || 0}`, `${p2.breakPointsConverted || 0}/${p2.breakPointsOpportunities || 0}`);
                    
                    yPos += 5;
                    
                    // Serve Section
                    // 发球部分
                    if (yPos > 250) {
                        doc.addPage();
                        yPos = 20;
                    }
                    doc.setFontSize(11);
                    doc.setFont('helvetica', 'bold');
                    doc.text('Serve', 14, yPos);
                    yPos += 7;
                    doc.setFont('helvetica', 'normal');
                    doc.setFontSize(9);
                    
                    addStatRow('Total Serve Point Win %', `${p1.totalServePointWinPercentage || '0.0'}%`, `${p2.totalServePointWinPercentage || '0.0'}%`);
                    addStatRow('1st Serve In %/Total', `${p1.firstServePercentage}%/${p1.firstServes}`, `${p2.firstServePercentage}%/${p2.firstServes}`);
                    addStatRow('ACEs', p1.aces || 0, p2.aces || 0);
                    addStatRow('Double Faults', p1.doubleFaults || 0, p2.doubleFaults || 0);
                    addStatRow('1st Serve Won %', `${p1.firstServePointsWonPercentage || '0.0'}%`, `${p2.firstServePointsWonPercentage || '0.0'}%`);
                    addStatRow('2nd Serve In %/Total', `${p1.secondServeInPercentage || '0.0'}%/${p1.secondServes}`, `${p2.secondServeInPercentage || '0.0'}%/${p2.secondServes}`);
                    addStatRow('2nd Serve Won %', `${p1.secondServePercentage}%`, `${p2.secondServePercentage}%`);
                    
                    yPos += 5;
                    
                    // Return Section
                    // 接发球部分
                    if (yPos > 250) {
                        doc.addPage();
                        yPos = 20;
                    }
                    doc.setFontSize(11);
                    doc.setFont('helvetica', 'bold');
                    doc.text('Return', 14, yPos);
                    yPos += 7;
                    doc.setFont('helvetica', 'normal');
                    doc.setFontSize(9);
                    
                    addStatRow('Total Return Point Win %', `${p1.totalReturnPointWinPercentage || '0.0'}%`, `${p2.totalReturnPointWinPercentage || '0.0'}%`);
                    addStatRow('Return 1st Serve Won %', `${p1.returnFirstServePointsWonPercentage || '0.0'}%`, `${p2.returnFirstServePointsWonPercentage || '0.0'}%`);
                    addStatRow('Return 2nd Serve Won %', `${p1.returnSecondServePointsWonPercentage || '0.0'}%`, `${p2.returnSecondServePointsWonPercentage || '0.0'}%`);
                    addStatRow('Return Errors', p1.returnErrors || 0, p2.returnErrors || 0);
                    
                    // Calculate Return Winners
                    // 计算Return Winners
                    const logToUse = match.log || [];
                    let p1ReturnWinners = 0;
                    let p2ReturnWinners = 0;
                    if (logToUse && logToUse.length > 0) {
                        for (const entry of logToUse) {
                            if (entry.action === 'Winner' && entry.shotType === 'Return') {
                                if (entry.player === 'player1') {
                                    p1ReturnWinners++;
                                } else if (entry.player === 'player2') {
                                    p2ReturnWinners++;
                                }
                            }
                        }
                    }
                    addStatRow('Return Winners', p1ReturnWinners, p2ReturnWinners);
                    addStatRow('Break Point Converted/Opportunities', `${p1.breakPointsConverted || 0}/${p1.breakPointsOpportunities || 0}`, `${p2.breakPointsConverted || 0}/${p2.breakPointsOpportunities || 0}`);
                    
                    // Calculate unforced errors by shot type
                    // 按击球类型统计非受迫性失误
                    const calculateUnforcedErrorsByShotType = (playerRole) => {
                        const stats = {
                            total: 0,
                            totalForehand: 0,
                            forehandGround: 0,
                            forehandSlice: 0,
                            forehandVolley: 0,
                            totalBackhand: 0,
                            backhandGround: 0,
                            backhandSlice: 0,
                            backhandVolley: 0,
                            approachShot: 0,
                            overhead: 0,
                            dropShot: 0,
                            lob: 0
                        };
                        
                        if (!logToUse || logToUse.length === 0) return stats;
                        
                        for (const entry of logToUse) {
                            if (entry.player === playerRole && entry.action === 'Unforced Error' && entry.shotType) {
                                stats.total++;
                                const shotType = entry.shotType;
                                
                                if (shotType === 'Forehand Ground Stroke') {
                                    stats.totalForehand++;
                                    stats.forehandGround++;
                                } else if (shotType === 'Forehand Slice') {
                                    stats.totalForehand++;
                                    stats.forehandSlice++;
                                } else if (shotType === 'Forehand Volley') {
                                    stats.totalForehand++;
                                    stats.forehandVolley++;
                                } else if (shotType === 'Backhand Ground Stroke') {
                                    stats.totalBackhand++;
                                    stats.backhandGround++;
                                } else if (shotType === 'Backhand Slice') {
                                    stats.totalBackhand++;
                                    stats.backhandSlice++;
                                } else if (shotType === 'Backhand Volley') {
                                    stats.totalBackhand++;
                                    stats.backhandVolley++;
                                } else if (shotType === 'Approach Shot') {
                                    stats.approachShot++;
                                } else if (shotType === 'Overhead') {
                                    stats.overhead++;
                                } else if (shotType === 'Drop Shot') {
                                    stats.dropShot++;
                                } else if (shotType === 'Lob') {
                                    stats.lob++;
                                }
                            }
                        }
                        
                        return stats;
                    };
                    
                    // Calculate forced errors by shot type
                    // 按击球类型统计受迫性失误
                    const calculateForcedErrorsByShotType = (playerRole) => {
                        const stats = {
                            total: 0,
                            totalForehand: 0,
                            forehandGround: 0,
                            forehandSlice: 0,
                            forehandVolley: 0,
                            totalBackhand: 0,
                            backhandGround: 0,
                            backhandSlice: 0,
                            backhandVolley: 0,
                            approachShot: 0,
                            overhead: 0,
                            dropShot: 0,
                            lob: 0
                        };
                        
                        if (!logToUse || logToUse.length === 0) return stats;
                        
                        for (const entry of logToUse) {
                            if (entry.player === playerRole && entry.action === 'Forced Error' && entry.shotType) {
                                stats.total++;
                                const shotType = entry.shotType;
                                
                                if (shotType === 'Forehand Ground Stroke') {
                                    stats.totalForehand++;
                                    stats.forehandGround++;
                                } else if (shotType === 'Forehand Slice') {
                                    stats.totalForehand++;
                                    stats.forehandSlice++;
                                } else if (shotType === 'Forehand Volley') {
                                    stats.totalForehand++;
                                    stats.forehandVolley++;
                                } else if (shotType === 'Backhand Ground Stroke') {
                                    stats.totalBackhand++;
                                    stats.backhandGround++;
                                } else if (shotType === 'Backhand Slice') {
                                    stats.totalBackhand++;
                                    stats.backhandSlice++;
                                } else if (shotType === 'Backhand Volley') {
                                    stats.totalBackhand++;
                                    stats.backhandVolley++;
                                } else if (shotType === 'Approach Shot') {
                                    stats.approachShot++;
                                } else if (shotType === 'Overhead') {
                                    stats.overhead++;
                                } else if (shotType === 'Drop Shot') {
                                    stats.dropShot++;
                                } else if (shotType === 'Lob') {
                                    stats.lob++;
                                }
                            }
                        }
                        
                        return stats;
                    };
                    
                    // Calculate winners by shot type
                    // 按击球类型统计制胜分
                    const calculateWinnersByShotType = (playerRole) => {
                        const stats = {
                            total: 0,
                            totalForehand: 0,
                            forehandGround: 0,
                            forehandSlice: 0,
                            forehandVolley: 0,
                            totalBackhand: 0,
                            backhandGround: 0,
                            backhandSlice: 0,
                            backhandVolley: 0,
                            approachShot: 0,
                            overhead: 0,
                            dropShot: 0,
                            lob: 0,
                            passingShot: 0,
                            return: 0
                        };
                        
                        if (!logToUse || logToUse.length === 0) return stats;
                        
                        for (const entry of logToUse) {
                            if (entry.player === playerRole && entry.action === 'Winner' && entry.shotType) {
                                stats.total++;
                                const shotType = entry.shotType;
                                
                                if (shotType === 'Forehand Ground Stroke') {
                                    stats.totalForehand++;
                                    stats.forehandGround++;
                                } else if (shotType === 'Forehand Slice') {
                                    stats.totalForehand++;
                                    stats.forehandSlice++;
                                } else if (shotType === 'Forehand Volley') {
                                    stats.totalForehand++;
                                    stats.forehandVolley++;
                                } else if (shotType === 'Backhand Ground Stroke') {
                                    stats.totalBackhand++;
                                    stats.backhandGround++;
                                } else if (shotType === 'Backhand Slice') {
                                    stats.totalBackhand++;
                                    stats.backhandSlice++;
                                } else if (shotType === 'Backhand Volley') {
                                    stats.totalBackhand++;
                                    stats.backhandVolley++;
                                } else if (shotType === 'Approach Shot') {
                                    stats.approachShot++;
                                } else if (shotType === 'Overhead') {
                                    stats.overhead++;
                                } else if (shotType === 'Drop Shot') {
                                    stats.dropShot++;
                                } else if (shotType === 'Lob') {
                                    stats.lob++;
                                } else if (shotType === 'Passing Shot') {
                                    stats.passingShot++;
                                } else if (shotType === 'Return') {
                                    stats.return++;
                                }
                            }
                        }
                        
                        return stats;
                    };
                    
                    const p1UnforcedErrors = calculateUnforcedErrorsByShotType('player1');
                    const p2UnforcedErrors = calculateUnforcedErrorsByShotType('player2');
                    const p1ForcedErrors = calculateForcedErrorsByShotType('player1');
                    const p2ForcedErrors = calculateForcedErrorsByShotType('player2');
                    const p1Winners = calculateWinnersByShotType('player1');
                    const p2Winners = calculateWinnersByShotType('player2');
                    
                    // Winners Section
                    // 制胜分部分
                    if (yPos > 250) {
                        doc.addPage();
                        yPos = 20;
                    }
                    doc.setFontSize(11);
                    doc.setFont('helvetica', 'bold');
                    doc.text('Winners', 14, yPos);
                    yPos += 7;
                    doc.setFont('helvetica', 'normal');
                    doc.setFontSize(9);
                    
                    addStatRow('Total', p1Winners.total || 0, p2Winners.total || 0);
                    addStatRow('Total Forehand', p1Winners.totalForehand || 0, p2Winners.totalForehand || 0);
                    addStatRow('Forehand Ground', p1Winners.forehandGround || 0, p2Winners.forehandGround || 0);
                    addStatRow('Forehand Slice', p1Winners.forehandSlice || 0, p2Winners.forehandSlice || 0);
                    addStatRow('Forehand Volley', p1Winners.forehandVolley || 0, p2Winners.forehandVolley || 0);
                    addStatRow('Total Backhand', p1Winners.totalBackhand || 0, p2Winners.totalBackhand || 0);
                    addStatRow('Backhand Ground', p1Winners.backhandGround || 0, p2Winners.backhandGround || 0);
                    addStatRow('Backhand Slice', p1Winners.backhandSlice || 0, p2Winners.backhandSlice || 0);
                    addStatRow('Backhand Volley', p1Winners.backhandVolley || 0, p2Winners.backhandVolley || 0);
                    addStatRow('Approach Shot', p1Winners.approachShot || 0, p2Winners.approachShot || 0);
                    addStatRow('Overhead', p1Winners.overhead || 0, p2Winners.overhead || 0);
                    addStatRow('Drop Shot', p1Winners.dropShot || 0, p2Winners.dropShot || 0);
                    addStatRow('Lob', p1Winners.lob || 0, p2Winners.lob || 0);
                    addStatRow('Passing Shot', p1Winners.passingShot || 0, p2Winners.passingShot || 0);
                    addStatRow('Return', p1Winners.return || 0, p2Winners.return || 0);
                    
                    yPos += 5;
                    
                    // Unforced Errors Section
                    // 非受迫性失误部分
                    if (yPos > 250) {
                        doc.addPage();
                        yPos = 20;
                    }
                    doc.setFontSize(11);
                    doc.setFont('helvetica', 'bold');
                    doc.text('Unforced Errors', 14, yPos);
                    yPos += 7;
                    doc.setFont('helvetica', 'normal');
                    doc.setFontSize(9);
                    
                    addStatRow('Total', p1UnforcedErrors.total || 0, p2UnforcedErrors.total || 0);
                    addStatRow('Total Forehand', p1UnforcedErrors.totalForehand || 0, p2UnforcedErrors.totalForehand || 0);
                    addStatRow('Forehand Ground', p1UnforcedErrors.forehandGround || 0, p2UnforcedErrors.forehandGround || 0);
                    addStatRow('Forehand Slice', p1UnforcedErrors.forehandSlice || 0, p2UnforcedErrors.forehandSlice || 0);
                    addStatRow('Forehand Volley', p1UnforcedErrors.forehandVolley || 0, p2UnforcedErrors.forehandVolley || 0);
                    addStatRow('Total Backhand', p1UnforcedErrors.totalBackhand || 0, p2UnforcedErrors.totalBackhand || 0);
                    addStatRow('Backhand Ground', p1UnforcedErrors.backhandGround || 0, p2UnforcedErrors.backhandGround || 0);
                    addStatRow('Backhand Slice', p1UnforcedErrors.backhandSlice || 0, p2UnforcedErrors.backhandSlice || 0);
                    addStatRow('Backhand Volley', p1UnforcedErrors.backhandVolley || 0, p2UnforcedErrors.backhandVolley || 0);
                    addStatRow('Approach Shot', p1UnforcedErrors.approachShot || 0, p2UnforcedErrors.approachShot || 0);
                    addStatRow('Overhead', p1UnforcedErrors.overhead || 0, p2UnforcedErrors.overhead || 0);
                    addStatRow('Drop Shot', p1UnforcedErrors.dropShot || 0, p2UnforcedErrors.dropShot || 0);
                    addStatRow('Lob', p1UnforcedErrors.lob || 0, p2UnforcedErrors.lob || 0);
                    
                    yPos += 5;
                    
                    // Forced Errors Section
                    // 受迫性失误部分
                    if (yPos > 250) {
                        doc.addPage();
                        yPos = 20;
                    }
                    doc.setFontSize(11);
                    doc.setFont('helvetica', 'bold');
                    doc.text('Forced Errors', 14, yPos);
                    yPos += 7;
                    doc.setFont('helvetica', 'normal');
                    doc.setFontSize(9);
                    
                    addStatRow('Total', p1ForcedErrors.total || 0, p2ForcedErrors.total || 0);
                    addStatRow('Total Forehand', p1ForcedErrors.totalForehand || 0, p2ForcedErrors.totalForehand || 0);
                    addStatRow('Forehand Ground', p1ForcedErrors.forehandGround || 0, p2ForcedErrors.forehandGround || 0);
                    addStatRow('Forehand Slice', p1ForcedErrors.forehandSlice || 0, p2ForcedErrors.forehandSlice || 0);
                    addStatRow('Forehand Volley', p1ForcedErrors.forehandVolley || 0, p2ForcedErrors.forehandVolley || 0);
                    addStatRow('Total Backhand', p1ForcedErrors.totalBackhand || 0, p2ForcedErrors.totalBackhand || 0);
                    addStatRow('Backhand Ground', p1ForcedErrors.backhandGround || 0, p2ForcedErrors.backhandGround || 0);
                    addStatRow('Backhand Slice', p1ForcedErrors.backhandSlice || 0, p2ForcedErrors.backhandSlice || 0);
                    addStatRow('Backhand Volley', p1ForcedErrors.backhandVolley || 0, p2ForcedErrors.backhandVolley || 0);
                    addStatRow('Approach Shot', p1ForcedErrors.approachShot || 0, p2ForcedErrors.approachShot || 0);
                    addStatRow('Overhead', p1ForcedErrors.overhead || 0, p2ForcedErrors.overhead || 0);
                    addStatRow('Drop Shot', p1ForcedErrors.dropShot || 0, p2ForcedErrors.dropShot || 0);
                    addStatRow('Lob', p1ForcedErrors.lob || 0, p2ForcedErrors.lob || 0);
                }
            } catch (error) {
                console.error('Error adding technical statistics to PDF:', error);
                // Continue without statistics if there's an error
                // 如果出错，继续不包含统计
            }
            
            // Match Log
            // 比赛日志
            if (match.log && match.log.length > 0) {
                // Check if we need a new page
                // 检查是否需要新页面
                if (yPos > 250) {
                    doc.addPage();
                    yPos = 20;
                }
                
                doc.setFontSize(14);
                doc.text('Match Log', 14, yPos);
                yPos += 8;
                
                doc.setFontSize(8);
                match.log.forEach((entry, index) => {
                    // Check if we need a new page
                    // 检查是否需要新页面
                    if (yPos > 280) {
                        doc.addPage();
                        yPos = 20;
                    }
                    
                    const playerName = entry.player === 'player1' ? player1Name : player2Name;
                    const time = new Date(entry.timestamp);
                    const timeStr = time.toLocaleTimeString('en-US', { 
                        hour: '2-digit', 
                        minute: '2-digit', 
                        second: '2-digit',
                        hour12: false 
                    });
                    
                    let actionText = entry.action || '';
                    if (entry.shotType) {
                        actionText += ` (${entry.shotType})`;
                    }
                    
                    const gameScore = entry.gameScore || '-';
                    const gamesScore = entry.gamesScore || '-';
                    const setsScore = entry.setsScore || '-';
                    
                    // Log entry line
                    // 日志条目行
                    doc.text(`${timeStr} - ${playerName}: ${actionText}`, 14, yPos);
                    yPos += 5;
                    doc.text(`Score: ${gameScore} | Game: ${gamesScore} | Set: ${setsScore}`, 20, yPos);
                    yPos += 7;
                });
            }
            
            // Generate filename
            // 生成文件名
            const dateStr = formatDate(match.startTime).replace(/\//g, '-');
            const filename = `Match_${player1Name}_vs_${player2Name}_${dateStr}.pdf`;
            
            // Save PDF
            // 保存PDF
            doc.save(filename);
            
            // Show success message with longer duration for mobile
            // 显示成功消息，移动端显示时间更长
            this.showToast('PDF exported successfully! File saved to downloads.', 'success', 5000);
        } catch (error) {
            console.error('Error exporting to PDF:', error);
            this.showToast('Error exporting to PDF', 'error');
        }
    },
    
    // Delete match
    // 删除比赛
    async deleteMatch(matchId) {
        if (!confirm('Are you sure you want to delete this match?')) {
            return;
        }
        
        try {
            await storage.deleteMatch(matchId);
            this.showToast('Match deleted', 'success');
            this.showPage('matches');
        } catch (error) {
            console.error('Error deleting match:', error);
            this.showToast('Error deleting match', 'error');
        }
    },
    
    // Show toast notification
    // 显示提示通知
    showToast(message, type = 'info', duration = 3000) {
        const toast = document.getElementById('toast');
        if (!toast) return;
        
        toast.textContent = message;
        toast.className = `toast show ${type}`;
        
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                toast.classList.add('hidden');
            }, 300);
        }, duration);
    },
    
    // Load jsPDF library dynamically
    // 动态加载jsPDF库
    async loadJsPDF() {
        return new Promise((resolve, reject) => {
            // Check if already loaded
            // 检查是否已加载
            if (typeof window.jspdf !== 'undefined') {
                resolve();
                return;
            }
            
            // Check if script already exists
            // 检查脚本是否已存在
            const existingScript = document.querySelector('script[src*="jspdf"]');
            if (existingScript) {
                // Wait for it to load
                // 等待它加载
                if (typeof window.jspdf !== 'undefined') {
                    resolve();
                } else {
                    existingScript.addEventListener('load', () => {
                        setTimeout(() => {
                            if (typeof window.jspdf !== 'undefined') {
                                resolve();
                            } else {
                                reject(new Error('jsPDF not available after loading'));
                            }
                        }, 100);
                    });
                    existingScript.addEventListener('error', () => {
                        reject(new Error('Failed to load jsPDF'));
                    });
                }
                return;
            }
            
            // Load jsPDF script
            // 加载jsPDF脚本
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
            script.onload = () => {
                // Wait a bit for the library to initialize
                // 等待库初始化
                setTimeout(() => {
                    if (typeof window.jspdf !== 'undefined') {
                        resolve();
                    } else {
                        reject(new Error('jsPDF not available after loading'));
                    }
                }, 100);
            };
            script.onerror = () => reject(new Error('Failed to load jsPDF script'));
            document.head.appendChild(script);
        });
    },
    
    // Escape HTML
    // 转义HTML
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
};

// Initialize app when DOM is ready
// DOM准备好时初始化应用
document.addEventListener('DOMContentLoaded', () => {
    app.init();
});

