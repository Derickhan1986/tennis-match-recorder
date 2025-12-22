//
//  Match Recorder
//  比赛记录器
//
//  Handles match recording interface and logic
//  处理比赛记录界面和逻辑
//

class MatchRecorder {
    constructor() {
        this.currentMatch = null;
        this.matchEngine = null;
        this.player1 = null;
        this.player2 = null;
        this.setupEventListeners();
    }

    // Setup event listeners
    // 设置事件监听器
    setupEventListeners() {
        // Match settings form
        // 比赛设置表单
        const matchForm = document.getElementById('match-settings-form');
        if (matchForm) {
            matchForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.startMatch();
            });
        }

        // Final set type change
        // 最终盘类型更改
        const finalSetSelect = document.getElementById('match-final-set');
        if (finalSetSelect) {
            finalSetSelect.addEventListener('change', (e) => {
                this.updateFinalSetOptions(e.target.value);
            });
        }

        // Action buttons
        // 操作按钮
        document.addEventListener('click', (e) => {
            if (e.target.closest('.action-btn')) {
                const button = e.target.closest('.action-btn');
                const action = button.dataset.action;
                this.handleActionButton(action);
            }
        });

        // Undo button
        // 撤销按钮
        const undoBtn = document.getElementById('undo-btn');
        if (undoBtn) {
            undoBtn.addEventListener('click', () => {
                this.undoPoint();
            });
        }

        // Menu button
        // 菜单按钮
        const menuBtn = document.getElementById('match-menu-btn');
        if (menuBtn) {
            menuBtn.addEventListener('click', () => {
                this.showMatchMenu();
            });
        }
    }

    // Update final set options based on selection
    // 根据选择更新最终盘选项
    updateFinalSetOptions(finalSetType) {
        const tieBreakGroup = document.getElementById('tie-break-group');
        const tieBreakWinBy2Group = document.getElementById('tie-break-winby2-group');
        const superTieBreakGroup = document.getElementById('super-tie-break-group');
        const superTieBreakWinBy2Group = document.getElementById('super-tie-break-winby2-group');
        
        if (finalSetType === 'Normal Final Set') {
            if (tieBreakGroup) tieBreakGroup.style.display = 'block';
            if (tieBreakWinBy2Group) tieBreakWinBy2Group.style.display = 'block';
            if (superTieBreakGroup) superTieBreakGroup.style.display = 'none';
            if (superTieBreakWinBy2Group) superTieBreakWinBy2Group.style.display = 'none';
        } else {
            if (tieBreakGroup) tieBreakGroup.style.display = 'none';
            if (tieBreakWinBy2Group) tieBreakWinBy2Group.style.display = 'none';
            if (superTieBreakGroup) superTieBreakGroup.style.display = 'block';
            if (superTieBreakWinBy2Group) superTieBreakWinBy2Group.style.display = 'block';
        }
    }

    // Load players for match settings
    // 为比赛设置加载玩家
    async loadPlayersForMatch() {
        try {
            const players = await storage.getAllPlayers();
            const select1 = document.getElementById('match-player1');
            const select2 = document.getElementById('match-player2');
            
            if (select1) {
                select1.innerHTML = '<option value="">Select Player 1</option>';
                players.forEach(player => {
                    const option = document.createElement('option');
                    option.value = player.id;
                    option.textContent = player.name;
                    select1.appendChild(option);
                });
            }
            
            if (select2) {
                select2.innerHTML = '<option value="">Select Player 2</option>';
                players.forEach(player => {
                    const option = document.createElement('option');
                    option.value = player.id;
                    option.textContent = player.name;
                    select2.appendChild(option);
                });
            }
        } catch (error) {
            console.error('Error loading players:', error);
        }
    }

    // Start new match
    // 开始新比赛
    async startMatch() {
        try {
            const player1Id = document.getElementById('match-player1').value;
            const player2Id = document.getElementById('match-player2').value;
            const firstServer = document.getElementById('match-first-server').value;
            const numberOfSets = parseInt(document.getElementById('match-sets').value);
            const gamesPerSet = parseInt(document.getElementById('match-games').value);
            const adScoring = document.getElementById('match-ad-scoring').checked;
            const finalSetType = document.getElementById('match-final-set').value;
            const courtType = document.getElementById('match-court-type').value;
            const indoor = document.getElementById('match-indoor').checked;
            
            let tieBreakGames = null;
            let tieBreakWinBy2 = null;
            let superTieBreakPoints = null;
            let superTieBreakWinBy2 = null;
            
            if (finalSetType === 'Normal Final Set') {
                tieBreakGames = parseInt(document.getElementById('match-tie-break-games').value);
                tieBreakWinBy2 = document.getElementById('match-tie-break-winby2').checked;
            } else {
                superTieBreakPoints = parseInt(document.getElementById('match-super-tie-break-points').value);
                superTieBreakWinBy2 = document.getElementById('match-super-tie-break-winby2').checked;
            }
            
            const settings = createMatchSettings({
                player1Id: player1Id,
                player2Id: player2Id,
                firstServer: firstServer,
                numberOfSets: numberOfSets,
                gamesPerSet: gamesPerSet,
                adScoring: adScoring,
                finalSetType: finalSetType,
                courtType: courtType,
                indoor: indoor,
                tieBreakGames: tieBreakGames,
                tieBreakWinBy2: tieBreakWinBy2,
                superTieBreakPoints: superTieBreakPoints,
                superTieBreakWinBy2: superTieBreakWinBy2
            });
            
            validateMatchSettings(settings);
            
            // Load players
            // 加载玩家
            this.player1 = await storage.getPlayer(player1Id);
            this.player2 = await storage.getPlayer(player2Id);
            
            // Create match
            // 创建比赛
            const match = createMatch({
                player1Id: player1Id,
                player2Id: player2Id,
                settings: settings
            });
            
            await storage.saveMatch(match);
            
            // Initialize match engine
            // 初始化比赛引擎
            this.currentMatch = match;
            this.matchEngine = new MatchEngine(match);
            
            // Update display
            // 更新显示
            this.updateDisplay();
            
            app.showPage('match-recording');
        } catch (error) {
            console.error('Error starting match:', error);
            app.showToast(error.message || 'Error starting match', 'error');
        }
    }

    // Handle action button click
    // 处理操作按钮点击
    handleActionButton(action) {
        if (!this.matchEngine) {
            app.showToast('Match not initialized', 'error');
            return;
        }
        
        const state = this.matchEngine.getMatchState();
        const server = state.currentServer;
        let winner = null;
        let pointType = null;
        
        // Determine winner and point type based on action
        // 根据操作确定获胜者和分类型
        switch (action) {
            case 'serve-fault':
                // Serve fault doesn't change score yet, handled in engine
                // 发球失误暂时不改变比分，在引擎中处理
                this.matchEngine.recordPoint(server, 'Serve Fault');
                this.updateDisplay();
                return;
                
            case 'ace':
            case 'winner':
                // Server wins point
                // 发球方得分
                winner = server;
                pointType = action === 'ace' ? 'ACE' : 'Winner';
                break;
                
            case 'unforced-error':
            case 'forced-error':
                // Receiver wins point (server made error)
                // 接发球方得分（发球方失误）
                winner = server === 'player1' ? 'player2' : 'player1';
                pointType = action === 'unforced-error' ? 'Unforced Error' : 'Forced Error';
                break;
                
            case 'return-error':
                // Receiver made error, server wins point
                // 接发球方失误，发球方得分
                winner = server;
                pointType = 'Return Error';
                break;
        }
        
        if (winner) {
            this.recordPoint(winner, pointType);
        }
    }

    // Record a point
    // 记录一分
    async recordPoint(winner, pointType = null) {
        if (!this.matchEngine) {
            app.showToast('Match not initialized', 'error');
            return;
        }
        
        try {
            const state = this.matchEngine.recordPoint(winner, pointType);
            this.updateDisplay(state);
            
            // Check if match is complete
            // 检查比赛是否结束
            if (state.matchStatus === 'completed') {
                app.showToast('Match completed!', 'success');
                setTimeout(() => {
                    app.showPage('matches');
                    this.currentMatch = null;
                    this.matchEngine = null;
                    this.player1 = null;
                    this.player2 = null;
                }, 2000);
            }
        } catch (error) {
            console.error('Error recording point:', error);
            app.showToast('Error recording point', 'error');
        }
    }

    // Undo last point
    // 撤销最后一分
    undoPoint() {
        if (!this.matchEngine) {
            app.showToast('Match not initialized', 'error');
            return;
        }
        
        try {
            const state = this.matchEngine.undoLastPoint();
            this.updateDisplay(state);
        } catch (error) {
            console.error('Error undoing point:', error);
            app.showToast('Error undoing point', 'error');
        }
    }

    // Show match menu
    // 显示比赛菜单
    showMatchMenu() {
        if (confirm('End match?')) {
            this.endMatch();
        }
    }

    // End match manually
    // 手动结束比赛
    async endMatch() {
        if (!this.currentMatch) return;
        
        try {
            this.currentMatch.status = 'completed';
            this.currentMatch.endTime = new Date().toISOString();
            await storage.saveMatch(this.currentMatch);
            
            app.showToast('Match ended', 'success');
            app.showPage('matches');
            this.currentMatch = null;
            this.matchEngine = null;
            this.player1 = null;
            this.player2 = null;
        } catch (error) {
            console.error('Error ending match:', error);
            app.showToast('Error ending match', 'error');
        }
    }

    // Update display
    // 更新显示
    async updateDisplay(state = null) {
        if (!state && this.matchEngine) {
            state = this.matchEngine.getMatchState();
        }
        
        if (!state || !this.player1 || !this.player2) return;
        
        // Update player names
        // 更新玩家名称
        document.getElementById('player1-name').textContent = this.player1.name;
        document.getElementById('player1-name-short').textContent = this.player1.name.split(' ').map(n => n[0]).join('') || 'P1';
        document.getElementById('player1-name-under').textContent = this.player1.name;
        
        document.getElementById('player2-name').textContent = this.player2.name;
        document.getElementById('player2-name-short').textContent = this.player2.name.split(' ').map(n => n[0]).join('') || 'P2';
        document.getElementById('player2-name-under').textContent = this.player2.name;
        
        // Update set scores
        // 更新盘比分
        this.updateSetScores(state.sets);
        
        // Update current game score
        // 更新当前局比分
        document.getElementById('player1-game-score').textContent = state.player1Score || '0';
        document.getElementById('player2-game-score').textContent = state.player2Score || '0';
        
        // Update serve indicators
        // 更新发球指示器
        this.updateServeIndicators(state.currentServer, state.currentServeNumber);
        
        // Update button visibility
        // 更新按钮可见性
        this.updateButtonVisibility(state.currentServer);
    }

    // Update set scores
    // 更新盘比分
    updateSetScores(sets) {
        let player1Sets = 0;
        let player2Sets = 0;
        
        sets.forEach(set => {
            if (set.winner === 'player1') player1Sets++;
            else if (set.winner === 'player2') player2Sets++;
        });
        
        document.getElementById('player1-sets').textContent = player1Sets;
        document.getElementById('player2-sets').textContent = player2Sets;
        
        // Update set score badge
        // 更新盘比分徽章
        const currentSet = sets[sets.length - 1];
        if (currentSet) {
            const badge = document.getElementById('set-score-badge');
            if (badge) {
                badge.querySelector('div:first-child').textContent = currentSet.setNumber;
                badge.querySelector('div:last-child').textContent = 
                    `${currentSet.player1Games}-${currentSet.player2Games}`;
            }
        }
    }

    // Update serve indicators
    // 更新发球指示器
    updateServeIndicators(currentServer, serveNumber) {
        // Top indicators
        // 顶部指示器
        const p1Top = document.getElementById('player1-serve-indicator');
        const p2Top = document.getElementById('player2-serve-indicator');
        
        if (p1Top) {
            const balls = p1Top.querySelectorAll('.tennis-ball');
            if (currentServer === 'player1') {
                balls[0].classList.add('active');
                if (serveNumber === 1) {
                    balls[1].classList.add('active');
                } else {
                    balls[1].classList.remove('active');
                }
            } else {
                balls.forEach(b => b.classList.remove('active'));
            }
        }
        
        if (p2Top) {
            const balls = p2Top.querySelectorAll('.tennis-ball');
            if (currentServer === 'player2') {
                balls[0].classList.add('active');
                if (serveNumber === 1) {
                    balls[1].classList.add('active');
                } else {
                    balls[1].classList.remove('active');
                }
            } else {
                balls.forEach(b => b.classList.remove('active'));
            }
        }
        
        // Bottom indicators
        // 底部指示器
        const p1Bottom = document.getElementById('player1-serve-under');
        const p2Bottom = document.getElementById('player2-serve-under');
        
        if (p1Bottom) {
            const balls = p1Bottom.querySelectorAll('.tennis-ball-small');
            if (currentServer === 'player1') {
                balls[0].classList.add('active');
                if (serveNumber === 1) {
                    balls[1].classList.add('active');
                } else {
                    balls[1].classList.remove('active');
                }
            } else {
                balls.forEach(b => b.classList.remove('active'));
            }
        }
        
        if (p2Bottom) {
            const balls = p2Bottom.querySelectorAll('.tennis-ball-small');
            if (currentServer === 'player2') {
                balls[0].classList.add('active');
                if (serveNumber === 1) {
                    balls[1].classList.add('active');
                } else {
                    balls[1].classList.remove('active');
                }
            } else {
                balls.forEach(b => b.classList.remove('active'));
            }
        }
    }

    // Update button visibility based on server
    // 根据发球方更新按钮可见性
    updateButtonVisibility(currentServer) {
        const serverButtons = document.getElementById('server-buttons');
        const receiverButtons = document.getElementById('receiver-buttons');
        
        // Always show server buttons - they work for whoever is serving
        // 始终显示发球方按钮 - 它们适用于任何发球的人
        // The buttons will record points for the current server
        // 按钮将为当前发球方记录分
        if (serverButtons) serverButtons.classList.remove('hidden');
        if (receiverButtons) receiverButtons.classList.add('hidden');
    }

    // Load match for recording (resume)
    // 加载比赛用于记录（恢复）
    async loadMatchForRecording(matchId) {
        try {
            const match = await storage.getMatch(matchId);
            if (!match) {
                app.showToast('Match not found', 'error');
                return;
            }
            
            if (match.status === 'completed') {
                app.showToast('Match is already completed', 'error');
                return;
            }
            
            // Load players
            // 加载玩家
            this.player1 = await storage.getPlayer(match.player1Id);
            this.player2 = await storage.getPlayer(match.player2Id);
            
            this.currentMatch = match;
            this.matchEngine = new MatchEngine(match);
            
            this.updateDisplay();
            app.showPage('match-recording');
        } catch (error) {
            console.error('Error loading match:', error);
            app.showToast('Error loading match', 'error');
        }
    }
}

// Create global match recorder instance
// 创建全局比赛记录器实例
const matchRecorder = new MatchRecorder();
