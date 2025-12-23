//
//  Main Application Logic
//  主应用逻辑
//
//  Handles navigation, page management, and app initialization
//  处理导航、页面管理和应用初始化
//

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
        
        // Load initial data
        // 加载初始数据
        await this.loadMatches();
        await playerManager.loadPlayers();
        await matchRecorder.loadPlayersForMatch();
        
        // Show initial page
        // 显示初始页面
        this.showPage('matches');
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
        // Export button
        // 导出按钮
        const exportBtn = document.getElementById('export-button');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => {
                this.exportData();
            });
        }
        
        // Import button
        // 导入按钮
        const importBtn = document.getElementById('import-button');
        const importFile = document.getElementById('import-file');
        if (importBtn && importFile) {
            importBtn.addEventListener('click', () => {
                importFile.click();
            });
            importFile.addEventListener('change', (e) => {
                this.importData(e.target.files[0]);
            });
        }
        
        // GitHub sync button
        // GitHub同步按钮
        const syncBtn = document.getElementById('sync-button');
        if (syncBtn) {
            syncBtn.addEventListener('click', () => {
                githubSync.sync();
            });
        }
        
        // Load saved GitHub settings
        // 加载保存的GitHub设置
        this.loadGitHubSettings();
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
            'settings': 'Settings',
            'new-match': 'New Match',
            'match-recording': 'Recording',
            'match-detail': 'Match Details',
            'player-form': 'Player'
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
            'player-form': 'players'
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
            
            const player1 = await storage.getPlayer(match.player1Id);
            const player2 = await storage.getPlayer(match.player2Id);
            const player1Name = player1 ? player1.name : 'Unknown Player 1';
            const player2Name = player2 ? player2.name : 'Unknown Player 2';
            
            const container = document.getElementById('match-detail-content');
            if (!container) return;
            
            let setsHtml = match.sets.map(set => {
                let setScore = `${set.player1Games}-${set.player2Games}`;
                if (set.tieBreak && set.tieBreak.winner) {
                    setScore += ` (${set.tieBreak.player1Points || 0}-${set.tieBreak.player2Points || 0})`;
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
                <div class="form-actions">
                    <button class="btn-danger" onclick="app.deleteMatch('${match.id}')">Delete Match</button>
                </div>
            `;
            
            this.showPage('match-detail');
        } catch (error) {
            console.error('Error loading match detail:', error);
            this.showToast('Error loading match details', 'error');
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
    
    // Export data
    // 导出数据
    async exportData() {
        try {
            const data = await storage.exportData();
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `tennis-data-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            this.showToast('Data exported', 'success');
        } catch (error) {
            console.error('Error exporting data:', error);
            this.showToast('Error exporting data', 'error');
        }
    },
    
    // Import data
    // 导入数据
    async importData(file) {
        if (!file) return;
        
        try {
            const text = await file.text();
            const data = JSON.parse(text);
            await storage.importData(data);
            this.showToast('Data imported', 'success');
            await this.loadMatches();
            await playerManager.loadPlayers();
        } catch (error) {
            console.error('Error importing data:', error);
            this.showToast('Error importing data', 'error');
        }
    },
    
    // Load GitHub settings
    // 加载GitHub设置
    async loadGitHubSettings() {
        try {
            const token = await storage.getSetting('githubToken', '');
            const repo = await storage.getSetting('githubRepo', '');
            
            const tokenInput = document.getElementById('github-token');
            const repoInput = document.getElementById('github-repo');
            
            if (tokenInput) tokenInput.value = token;
            if (repoInput) repoInput.value = repo;
        } catch (error) {
            console.error('Error loading GitHub settings:', error);
        }
    },
    
    // Show toast notification
    // 显示提示通知
    showToast(message, type = 'info') {
        const toast = document.getElementById('toast');
        if (!toast) return;
        
        toast.textContent = message;
        toast.className = `toast show ${type}`;
        
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                toast.classList.add('hidden');
            }, 300);
        }, 3000);
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

