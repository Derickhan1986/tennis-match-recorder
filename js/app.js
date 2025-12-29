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
        
        // GitHub pull button
        // GitHub拉取按钮
        const pullBtn = document.getElementById('pull-button');
        if (pullBtn) {
            pullBtn.addEventListener('click', async () => {
                const statusEl = document.getElementById('sync-status');
                try {
                    if (statusEl) {
                        statusEl.textContent = 'Pulling data...';
                        statusEl.className = 'success';
                    }
                    await githubSync.pull();
                    if (statusEl) {
                        statusEl.textContent = 'Data pulled successfully!';
                        statusEl.className = 'success';
                    }
                    // Reload matches and players after pull
                    // 拉取后重新加载比赛和玩家
                    await this.loadMatches();
                    await playerManager.loadPlayers();
                } catch (error) {
                    if (statusEl) {
                        statusEl.textContent = `Error: ${error.message}`;
                        statusEl.className = 'error';
                    }
                }
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
        } else if (pageName === 'new-match') {
            // Refresh player list when opening new match page
            // 打开新比赛页面时刷新玩家列表
            matchRecorder.loadPlayersForMatch();
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
                statsHtml = this.generateMatchStatsHTML(matchStats, player1Name, player2Name, match);
            } catch (error) {
                console.error('Error calculating match statistics:', error);
                console.error('Error stack:', error.stack);
                console.error('Match data:', match);
                console.error('Available functions:', typeof window.calculateMatchStats, typeof calculateMatchStats, typeof window.calculatePlayerStats);
                statsHtml = `<div class="detail-section"><p>Statistics unavailable</p><p style="font-size: 12px; color: #888;">Error: ${error.message}</p></div>`;
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
                
                <!-- Technical Statistics -->
                ${tabsHtml}
                <div id="match-statistics-container">
                    ${statsHtml}
                </div>
                
                <div class="form-actions">
                    <button class="btn-primary" onclick="app.exportMatchToPDF('${match.id}')">Export to PDF</button>
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
    generateMatchStatsHTML(matchStats, player1Name, player2Name, match = null) {
        const p1 = matchStats.player1;
        const p2 = matchStats.player2;
        
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
            
            if (!match || !match.log) return stats;
            
            for (const entry of match.log) {
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
            
            if (!match || !match.log) return stats;
            
            for (const entry of match.log) {
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
                lob: 0
            };
            
            if (!match || !match.log) return stats;
            
            for (const entry of match.log) {
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
            if (setNumber === 0) {
                // Match statistics (all sets)
                // 比赛统计（所有盘）
                const calcMatchStats = window.calculateMatchStats || (typeof calculateMatchStats !== 'undefined' ? calculateMatchStats : null);
                if (!calcMatchStats) {
                    throw new Error('calculateMatchStats function is not defined.');
                }
                matchStats = calcMatchStats(match);
            } else {
                // Set-specific statistics
                // 特定盘的统计
                const calcSetStats = window.calculateSetStats || (typeof calculateSetStats !== 'undefined' ? calculateSetStats : null);
                if (!calcSetStats) {
                    throw new Error('calculateSetStats function is not defined.');
                }
                matchStats = calcSetStats(match, setNumber);
            }
            statsHtml = this.generateMatchStatsHTML(matchStats, player1Name, player2Name, match);
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

