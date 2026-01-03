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
        this.pendingAction = null; // Store action waiting for shot type selection
        this.pendingPlayer = null; // Store player for pending action
        this.isUndoing = false; // Flag to prevent multiple undo operations
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

        // Final set type button clicks
        // 最终盘类型按钮点击
        const btnFinalSetNormal = document.getElementById('btn-final-set-normal');
        const btnFinalSetSuper = document.getElementById('btn-final-set-super');
        const finalSetInput = document.getElementById('match-final-set');
        
        if (btnFinalSetNormal && btnFinalSetSuper && finalSetInput) {
            btnFinalSetNormal.addEventListener('click', () => {
                finalSetInput.value = 'Normal Final Set';
                // Update button styles (use bright green for selected)
                // 更新按钮样式（选中时使用亮绿色）
                btnFinalSetNormal.style.backgroundColor = '#4caf50';
                btnFinalSetNormal.style.color = 'white';
                btnFinalSetNormal.style.borderColor = '#4caf50';
                btnFinalSetSuper.style.backgroundColor = 'var(--card-background)';
                btnFinalSetSuper.style.color = 'var(--text-primary)';
                btnFinalSetSuper.style.borderColor = 'var(--border-color)';
            });
            
            btnFinalSetSuper.addEventListener('click', () => {
                finalSetInput.value = 'Super Tie Break';
                // Update button styles (use bright green for selected)
                // 更新按钮样式（选中时使用亮绿色）
                btnFinalSetSuper.style.backgroundColor = '#4caf50';
                btnFinalSetSuper.style.color = 'white';
                btnFinalSetSuper.style.borderColor = '#4caf50';
                btnFinalSetNormal.style.backgroundColor = 'var(--card-background)';
                btnFinalSetNormal.style.color = 'var(--text-primary)';
                btnFinalSetNormal.style.borderColor = 'var(--border-color)';
            });
        }

        // Normal Tie Break Games button clicks
        // Normal Tie Break Games按钮点击
        const tieBreakGamesButtons = document.querySelectorAll('.btn-tie-break-games');
        const tieBreakGamesInput = document.getElementById('match-tie-break-games');
        
        if (tieBreakGamesButtons.length > 0 && tieBreakGamesInput) {
            tieBreakGamesButtons.forEach(button => {
                button.addEventListener('click', () => {
                    const value = button.dataset.value;
                    tieBreakGamesInput.value = value;
                    
                    // Update button styles (use bright green for selected)
                    // 更新按钮样式（选中时使用亮绿色）
                    tieBreakGamesButtons.forEach(btn => {
                        if (btn.dataset.value === value) {
                            btn.style.backgroundColor = '#4caf50';
                            btn.style.color = 'white';
                            btn.style.borderColor = '#4caf50';
                        } else {
                            btn.style.backgroundColor = 'var(--card-background)';
                            btn.style.color = 'var(--text-primary)';
                            btn.style.borderColor = 'var(--border-color)';
                        }
                    });
                });
            });
        }

        // Super Tie Break Points button clicks
        // Super Tie Break Points按钮点击
        const superTieBreakPointsButtons = document.querySelectorAll('.btn-super-tie-break-points');
        const superTieBreakPointsInput = document.getElementById('match-super-tie-break-points');
        
        if (superTieBreakPointsButtons.length > 0 && superTieBreakPointsInput) {
            superTieBreakPointsButtons.forEach(button => {
                button.addEventListener('click', () => {
                    const value = button.dataset.value;
                    superTieBreakPointsInput.value = value;
                    
                    // Update button styles (use bright green for selected)
                    // 更新按钮样式（选中时使用亮绿色）
                    superTieBreakPointsButtons.forEach(btn => {
                        if (btn.dataset.value === value) {
                            btn.style.backgroundColor = '#4caf50';
                            btn.style.color = 'white';
                            btn.style.borderColor = '#4caf50';
                        } else {
                            btn.style.backgroundColor = 'var(--card-background)';
                            btn.style.color = 'var(--text-primary)';
                            btn.style.borderColor = 'var(--border-color)';
                        }
                    });
                });
            });
        }

        // Court Type button clicks
        // Court Type按钮点击
        const courtTypeButtons = document.querySelectorAll('.btn-court-type');
        const courtTypeInput = document.getElementById('match-court-type');
        
        if (courtTypeButtons.length > 0 && courtTypeInput) {
            courtTypeButtons.forEach(button => {
                button.addEventListener('click', () => {
                    const value = button.dataset.value;
                    courtTypeInput.value = value;
                    
                    // Update button styles (use bright green for selected)
                    // 更新按钮样式（选中时使用亮绿色）
                    courtTypeButtons.forEach(btn => {
                        if (btn.dataset.value === value) {
                            btn.style.backgroundColor = '#4caf50';
                            btn.style.color = 'white';
                            btn.style.borderColor = '#4caf50';
                        } else {
                            btn.style.backgroundColor = 'var(--card-background)';
                            btn.style.color = 'var(--text-primary)';
                            btn.style.borderColor = 'var(--border-color)';
                        }
                    });
                });
            });
        }

        // First Server button clicks
        // First Server按钮点击
        const firstServerButtons = document.querySelectorAll('.btn-first-server');
        const firstServerInput = document.getElementById('match-first-server');
        
        if (firstServerButtons.length > 0 && firstServerInput) {
            firstServerButtons.forEach(button => {
                button.addEventListener('click', () => {
                    const value = button.dataset.value;
                    firstServerInput.value = value;
                    
                    // Update button styles (use bright green for selected)
                    // 更新按钮样式（选中时使用亮绿色）
                    firstServerButtons.forEach(btn => {
                        if (btn.dataset.value === value) {
                            btn.style.backgroundColor = '#4caf50';
                            btn.style.color = 'white';
                            btn.style.borderColor = '#4caf50';
                        } else {
                            btn.style.backgroundColor = 'var(--card-background)';
                            btn.style.color = 'var(--text-primary)';
                            btn.style.borderColor = 'var(--border-color)';
                        }
                    });
                });
            });
        }

        // Number of Sets button clicks
        // Number of Sets按钮点击
        const numberOfSetsButtons = document.querySelectorAll('.btn-number-of-sets');
        const numberOfSetsInput = document.getElementById('match-sets');
        
        if (numberOfSetsButtons.length > 0 && numberOfSetsInput) {
            numberOfSetsButtons.forEach(button => {
                button.addEventListener('click', () => {
                    const value = button.dataset.value;
                    numberOfSetsInput.value = value;
                    
                    // Update button styles (use bright green for selected)
                    // 更新按钮样式（选中时使用亮绿色）
                    numberOfSetsButtons.forEach(btn => {
                        if (btn.dataset.value === value) {
                            btn.style.backgroundColor = '#4caf50';
                            btn.style.color = 'white';
                            btn.style.borderColor = '#4caf50';
                        } else {
                            btn.style.backgroundColor = 'var(--card-background)';
                            btn.style.color = 'var(--text-primary)';
                            btn.style.borderColor = 'var(--border-color)';
                        }
                    });
                });
            });
        }

        // Games per Set button clicks
        // Games per Set按钮点击
        const gamesPerSetButtons = document.querySelectorAll('.btn-games-per-set');
        const gamesPerSetInput = document.getElementById('match-games');
        
        if (gamesPerSetButtons.length > 0 && gamesPerSetInput) {
            gamesPerSetButtons.forEach(button => {
                button.addEventListener('click', () => {
                    const value = button.dataset.value;
                    gamesPerSetInput.value = value;
                    
                    // Update button styles (use bright green for selected)
                    // 更新按钮样式（选中时使用亮绿色）
                    gamesPerSetButtons.forEach(btn => {
                        if (btn.dataset.value === value) {
                            btn.style.backgroundColor = '#4caf50';
                            btn.style.color = 'white';
                            btn.style.borderColor = '#4caf50';
                        } else {
                            btn.style.backgroundColor = 'var(--card-background)';
                            btn.style.color = 'var(--text-primary)';
                            btn.style.borderColor = 'var(--border-color)';
                        }
                    });
                });
            });
        }

        // Action buttons
        // 操作按钮
        document.addEventListener('click', (e) => {
            if (e.target.closest('.action-btn')) {
                const button = e.target.closest('.action-btn');
                const action = button.dataset.action;
                const player = button.dataset.player; // 'player1' or 'player2'
                this.handleActionButton(action, player);
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
        
        // Modal close button
        // 模态框关闭按钮
        const modalClose = document.getElementById('modal-close');
        if (modalClose) {
            modalClose.addEventListener('click', () => {
                const modal = document.getElementById('shot-type-modal');
                if (modal) {
                    modal.classList.add('hidden');
                }
                this.pendingAction = null;
                this.pendingPlayer = null;
            });
        }
        
        // Close modal when clicking outside
        // 点击外部关闭模态框
        const modal = document.getElementById('shot-type-modal');
        if (modal) {
            // Ensure modal is hidden on page load
            // 确保页面加载时模态框是隐藏的
            modal.classList.add('hidden');
            modal.style.display = 'none';
            modal.style.visibility = 'hidden';
            
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.classList.add('hidden');
                    modal.style.display = 'none';
                    modal.style.visibility = 'hidden';
                    this.pendingAction = null;
                    this.pendingPlayer = null;
                }
            });
        }
    }

    // Update final set options based on selection (no longer needed - both settings are always visible)
    // 根据选择更新最终盘选项（不再需要 - 两个设置始终可见）
    // This function is kept for backward compatibility but does nothing
    // 保留此函数以保持向后兼容性，但不执行任何操作
    updateFinalSetOptions(finalSetType) {
        // Both Normal Tie Break and Super Tie Break settings are now always visible
        // Normal Tie Break和Super Tie Break设置现在始终可见
        // No need to show/hide based on finalSetType
        // 无需根据finalSetType显示/隐藏
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
                
                // Update player2 options when player1 changes
                // 当player1改变时更新player2选项
                select1.addEventListener('change', () => {
                    this.updatePlayer2Options();
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
                
                // Update player1 options when player2 changes
                // 当player2改变时更新player1选项
                select2.addEventListener('change', () => {
                    this.updatePlayer1Options();
                });
            }
        } catch (error) {
            console.error('Error loading players:', error);
        }
    }
    
    // Update player2 options to exclude selected player1
    // 更新player2选项，排除已选择的player1
    async updatePlayer2Options() {
        try {
            const players = await storage.getAllPlayers();
            const select1 = document.getElementById('match-player1');
            const select2 = document.getElementById('match-player2');
            const selectedPlayer1Id = select1 ? select1.value : '';
            
            if (select2) {
                const currentPlayer2Id = select2.value;
                select2.innerHTML = '<option value="">Select Player 2</option>';
                players.forEach(player => {
                    // Exclude player1 from player2 options
                    // 从player2选项中排除player1
                    if (player.id !== selectedPlayer1Id) {
                        const option = document.createElement('option');
                        option.value = player.id;
                        option.textContent = player.name;
                        if (player.id === currentPlayer2Id && player.id !== selectedPlayer1Id) {
                            option.selected = true;
                        }
                        select2.appendChild(option);
                    }
                });
                
                // If current player2 is the same as player1, clear player2 selection
                // 如果当前player2与player1相同，清除player2选择
                if (currentPlayer2Id === selectedPlayer1Id) {
                    select2.value = '';
                }
            }
        } catch (error) {
            console.error('Error updating player2 options:', error);
        }
    }
    
    // Update player1 options to exclude selected player2
    // 更新player1选项，排除已选择的player2
    async updatePlayer1Options() {
        try {
            const players = await storage.getAllPlayers();
            const select1 = document.getElementById('match-player1');
            const select2 = document.getElementById('match-player2');
            const selectedPlayer2Id = select2 ? select2.value : '';
            
            if (select1) {
                const currentPlayer1Id = select1.value;
                select1.innerHTML = '<option value="">Select Player 1</option>';
                players.forEach(player => {
                    // Exclude player2 from player1 options
                    // 从player1选项中排除player2
                    if (player.id !== selectedPlayer2Id) {
                        const option = document.createElement('option');
                        option.value = player.id;
                        option.textContent = player.name;
                        if (player.id === currentPlayer1Id && player.id !== selectedPlayer2Id) {
                            option.selected = true;
                        }
                        select1.appendChild(option);
                    }
                });
                
                // If current player1 is the same as player2, clear player1 selection
                // 如果当前player1与player2相同，清除player1选择
                if (currentPlayer1Id === selectedPlayer2Id) {
                    select1.value = '';
                }
            }
        } catch (error) {
            console.error('Error updating player1 options:', error);
        }
    }

    // Start new match
    // 开始新比赛
    async startMatch() {
        try {
            const player1Id = document.getElementById('match-player1').value;
            const player2Id = document.getElementById('match-player2').value;
            
            // Validate that player1 and player2 are different
            // 验证player1和player2不能是同一个人
            if (!player1Id || !player2Id) {
                app.showToast('Please select both players', 'error');
                return;
            }
            if (player1Id === player2Id) {
                app.showToast('Player 1 and Player 2 cannot be the same person', 'error');
                return;
            }
            
            const firstServer = document.getElementById('match-first-server').value;
            const numberOfSets = parseInt(document.getElementById('match-sets').value);
            const gamesPerSet = parseInt(document.getElementById('match-games').value);
            const adScoring = document.getElementById('match-ad-scoring').checked;
            const finalSetType = document.getElementById('match-final-set').value;
            const courtType = document.getElementById('match-court-type').value;
            const indoor = document.getElementById('match-indoor').checked;
            
            // Always read both Normal Tie Break and Super Tie Break settings
            // 始终读取Normal Tie Break和Super Tie Break设置
            let tieBreakGames = null;
            let tieBreakWinBy2 = null;
            let superTieBreakPoints = null;
            let superTieBreakWinBy2 = null;
            
            // Read Normal Tie Break settings (for normal tie-breaks in any set)
            // 读取Normal Tie Break设置（用于任何盘中的普通抢七）
            const tieBreakGamesEl = document.getElementById('match-tie-break-games');
            const tieBreakWinBy2El = document.getElementById('match-tie-break-winby2');
            if (tieBreakGamesEl) {
                tieBreakGames = parseInt(tieBreakGamesEl.value);
            }
            if (tieBreakWinBy2El) {
                tieBreakWinBy2 = tieBreakWinBy2El.checked;
            }
            
            // Always read Super Tie Break settings (regardless of finalSetType)
            // 始终读取Super Tie Break设置（无论finalSetType如何）
            const superTieBreakPointsEl = document.getElementById('match-super-tie-break-points');
            const superTieBreakWinBy2El = document.getElementById('match-super-tie-break-winby2');
            if (superTieBreakPointsEl) {
                superTieBreakPoints = parseInt(superTieBreakPointsEl.value);
            }
            if (superTieBreakWinBy2El) {
                superTieBreakWinBy2 = superTieBreakWinBy2El.checked;
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
            
            app.showPage('match-recording');
            
            // Update display after page is shown
            // 页面显示后更新显示
            setTimeout(() => {
                this.updateDisplay();
            }, 200);
        } catch (error) {
            console.error('Error starting match:', error);
            app.showToast(error.message || 'Error starting match', 'error');
        }
    }

    // Handle action button click
    // 处理操作按钮点击
    handleActionButton(action, player) {
        if (!this.matchEngine || !this.currentMatch) {
            app.showToast('Match not initialized', 'error');
            return;
        }
        
        // Get current server from log (last entry) for consistency
        // 从日志（最后一条）获取当前发球方以保持一致性
        let server = this.matchEngine.match.currentServer || this.currentMatch.settings.firstServer;
        if (this.currentMatch.log && this.currentMatch.log.length > 0) {
            const lastLogEntry = this.currentMatch.log[this.currentMatch.log.length - 1];
            if (lastLogEntry.currentServer) {
                server = lastLogEntry.currentServer;
            }
        }
        
        const receiver = server === 'player1' ? 'player2' : 'player1';
        let winner = null;
        let pointType = null;
        let needsShotType = false;
        
        // Determine winner and point type based on action and which player clicked
        // 根据操作和点击的玩家确定获胜者和分类型
        switch (action) {
            case 'serve-fault':
                // Serve fault - only valid if clicked by server
                // 发球失误 - 只有发球方点击才有效
                if (player === server) {
                    this.matchEngine.recordPoint(server, 'Serve Fault', null);
                    this.updateDisplay();
                    return;
                }
                break;
                
            case 'ace':
                // ACE - no shot type needed
                // ACE - 不需要击球类型
                if (player === server) {
                    winner = server;
                    pointType = 'ACE';
                }
                break;
                
            case 'winner':
            case 'receiver-winner':
                // Winner - needs shot type selection
                // Winner - 需要选择击球类型
                if ((action === 'winner' && player === server) || (action === 'receiver-winner' && player === receiver)) {
                    winner = action === 'winner' ? server : receiver;
                    pointType = 'Winner';
                    needsShotType = true;
                }
                break;
                
            case 'unforced-error':
            case 'forced-error':
            case 'receiver-unforced-error':
            case 'receiver-forced-error':
                // Errors - need shot type selection
                // 失误 - 需要选择击球类型
                if ((action === 'unforced-error' || action === 'forced-error') && player === server) {
                    winner = receiver;
                    pointType = action === 'unforced-error' ? 'Unforced Error' : 'Forced Error';
                    needsShotType = true;
                } else if ((action === 'receiver-unforced-error' || action === 'receiver-forced-error') && player === receiver) {
                    winner = server;
                    pointType = action === 'receiver-unforced-error' ? 'Unforced Error' : 'Forced Error';
                    needsShotType = true;
                }
                break;
                
            case 'return-error':
                // Return error - no shot type needed
                // Return error - 不需要击球类型
                if (player === receiver) {
                    winner = server;
                    pointType = 'Return Error';
                }
                break;
        }
        
        if (winner) {
            if (needsShotType) {
                // Show shot type selection modal
                // 显示击球类型选择模态框
                this.pendingAction = { winner, pointType };
                this.pendingPlayer = player;
                this.showShotTypeModal(pointType);
            } else {
                // Record point directly
                // 直接记录分
                this.recordPoint(winner, pointType, null);
            }
        }
    }
    
    // Show shot type selection modal
    // 显示击球类型选择模态框
    showShotTypeModal(pointType) {
        const modal = document.getElementById('shot-type-modal');
        const title = document.getElementById('modal-title');
        const options = document.getElementById('shot-type-options');
        
        if (!modal || !title || !options) return;
        
        title.textContent = `Select Shot Type (${pointType})`;
        
        // Generate shot type buttons
        // 生成击球类型按钮
        const shotTypes = [
            ShotType.FOREHAND_GROUND_STROKE,
            ShotType.BACKHAND_GROUND_STROKE,
            ShotType.FOREHAND_SLICE,
            ShotType.BACKHAND_SLICE,
            ShotType.FOREHAND_VOLLEY,
            ShotType.BACKHAND_VOLLEY,
            ShotType.LOB,
            ShotType.OVERHEAD,
            ShotType.APPROACH_SHOT,
            ShotType.DROP_SHOT
        ];
        
        options.innerHTML = shotTypes.map(shotType => `
            <button class="shot-type-btn" data-shot-type="${shotType}">
                ${shotType}
            </button>
        `).join('');
        
        // Add click listeners
        // 添加点击监听器
        options.querySelectorAll('.shot-type-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const selectedShotType = btn.dataset.shotType;
                this.onShotTypeSelected(selectedShotType);
            });
        });
        
        modal.classList.remove('hidden');
        modal.style.display = 'flex';
        modal.style.visibility = 'visible';
    }
    
    // Handle shot type selection
    // 处理击球类型选择
    onShotTypeSelected(shotType) {
        const modal = document.getElementById('shot-type-modal');
        if (modal) {
            modal.classList.add('hidden');
            modal.style.display = 'none';
            modal.style.visibility = 'hidden';
        }
        
        if (this.pendingAction) {
            const { winner, pointType } = this.pendingAction;
            this.recordPoint(winner, pointType, shotType);
            this.pendingAction = null;
            this.pendingPlayer = null;
        }
    }

    // Record a point
    // 记录一分
    async recordPoint(winner, pointType = null, shotType = null) {
        if (!this.matchEngine) {
            app.showToast('Match not initialized', 'error');
            return;
        }
        
        try {
            this.matchEngine.recordPoint(winner, pointType, shotType);
            
            // Reload match to get updated log
            // 重新加载比赛以获取更新的日志
            this.currentMatch = await storage.getMatch(this.currentMatch.id);
            this.matchEngine = new MatchEngine(this.currentMatch);
            
            // Update display from log only
            // 仅从日志更新显示
            this.updateDisplay();
            
            // Check if match is complete from log
            // 从日志检查比赛是否结束
            if (this.currentMatch.status === 'completed') {
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
    async undoPoint() {
        // Prevent multiple undo operations
        // 防止多次撤销操作
        if (this.isUndoing) {
            return;
        }
        
        if (!this.matchEngine) {
            app.showToast('Match not initialized', 'error');
            return;
        }
        
        // Disable undo button and set flag
        // 禁用撤销按钮并设置标志
        const undoBtn = document.getElementById('undo-btn');
        if (undoBtn) {
            undoBtn.disabled = true;
            undoBtn.style.opacity = '0.5';
            undoBtn.style.cursor = 'not-allowed';
        }
        this.isUndoing = true;
        
        try {
            // Add a small delay to prevent rapid clicks
            // 添加短暂延迟以防止快速点击
            await new Promise(resolve => setTimeout(resolve, 300));
            
            this.matchEngine.undoLastPoint();
            
            // Reload match to get updated log
            // 重新加载比赛以获取更新的日志
            this.currentMatch = await storage.getMatch(this.currentMatch.id);
            this.matchEngine = new MatchEngine(this.currentMatch);
            
            // Update display from log only
            // 仅从日志更新显示
            this.updateDisplay();
        } catch (error) {
            console.error('Error undoing point:', error);
            app.showToast('Error undoing point', 'error');
        } finally {
            // Re-enable undo button after a delay
            // 延迟后重新启用撤销按钮
            await new Promise(resolve => setTimeout(resolve, 200));
            
            if (undoBtn) {
                undoBtn.disabled = false;
                undoBtn.style.opacity = '1';
                undoBtn.style.cursor = 'pointer';
            }
            this.isUndoing = false;
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
        if (!this.currentMatch || !this.player1 || !this.player2) return;
        
        // Get scores from log (last entry) for robustness
        // 从日志（最后一条）获取比分以确保健壮性
        let gameScore = '0-0';
        let gamesScore = '0-0';
        let setsScore = '0-0';
        let currentServer = this.matchEngine ? this.matchEngine.match.currentServer : this.currentMatch.settings.firstServer;
        let currentServeNumber = 1;
        
        if (this.currentMatch.log && this.currentMatch.log.length > 0) {
            const lastLogEntry = this.currentMatch.log[this.currentMatch.log.length - 1];
            if (lastLogEntry.gameScore) {
                gameScore = lastLogEntry.gameScore;
            }
            if (lastLogEntry.gamesScore) {
                gamesScore = lastLogEntry.gamesScore;
            }
            if (lastLogEntry.setsScore) {
                setsScore = lastLogEntry.setsScore;
            }
            if (lastLogEntry.currentServer) {
                currentServer = lastLogEntry.currentServer;
            }
            if (lastLogEntry.currentServeNumber !== undefined && lastLogEntry.currentServeNumber !== null) {
                currentServeNumber = lastLogEntry.currentServeNumber;
            }
        }
        
        // Parse scores from log
        // 从日志解析比分
        const parseScore = (scoreStr) => {
            if (!scoreStr) return { player1: '0', player2: '0' };
            // Handle tie-break format: "TB: 1-0"
            // 处理抢七格式："TB: 1-0"
            const tbMatch = scoreStr.match(/TB:\s*(\d+)-(\d+)/i);
            if (tbMatch) {
                return { player1: tbMatch[1], player2: tbMatch[2], isTieBreak: true };
            }
            const parts = scoreStr.split('-');
            if (parts.length === 2) {
                return { player1: parts[0].trim(), player2: parts[1].trim() };
            }
            return { player1: '0', player2: '0' };
        };
        
        const gameScoreParsed = parseScore(gameScore);
        const gamesScoreParsed = parseScore(gamesScore);
        const setsScoreParsed = parseScore(setsScore);
        
        // Update player names
        // 更新玩家名称
        const player1NameEl = document.getElementById('player1-name');
        const player2NameEl = document.getElementById('player2-name');
        if (player1NameEl) player1NameEl.textContent = this.player1.name;
        if (player2NameEl) player2NameEl.textContent = this.player2.name;
        
        // Update set scores from log
        // 从日志更新盘比分
        this.updateSetScoresFromLog(setsScoreParsed, gamesScoreParsed);
        
        // Update current game score from log
        // 从日志更新当前局比分
        const player1ScoreEl = document.getElementById('player1-game-score');
        const player2ScoreEl = document.getElementById('player2-game-score');
        if (player1ScoreEl) {
            // Handle tie-break display
            // 处理抢七显示
            if (gameScoreParsed.isTieBreak) {
                player1ScoreEl.textContent = gameScoreParsed.player1;
            } else {
                player1ScoreEl.textContent = gameScoreParsed.player1;
            }
        }
        if (player2ScoreEl) {
            if (gameScoreParsed.isTieBreak) {
                player2ScoreEl.textContent = gameScoreParsed.player2;
            } else {
                player2ScoreEl.textContent = gameScoreParsed.player2;
            }
        }
        
        // Get current serve number from log (last entry) or match engine
        // 从日志（最后一条）或比赛引擎获取当前发球次数
        // currentServeNumber is already read from log above, but ensure it's set correctly
        // currentServeNumber已从上面的日志读取，但确保它设置正确
        if (this.currentMatch.log && this.currentMatch.log.length > 0) {
            const lastLogEntry = this.currentMatch.log[this.currentMatch.log.length - 1];
            if (lastLogEntry.currentServeNumber !== undefined && lastLogEntry.currentServeNumber !== null) {
                currentServeNumber = lastLogEntry.currentServeNumber;
            }
        } else if (this.matchEngine) {
            currentServeNumber = this.matchEngine.match.currentServeNumber || 1;
        }
        
        // Update serve indicators
        // 更新发球指示器
        this.updateServeIndicators(currentServer, currentServeNumber);
        
        // Update button visibility - use setTimeout to ensure DOM is ready
        // 更新按钮可见性 - 使用setTimeout确保DOM已准备好
        setTimeout(() => {
            this.updateButtonVisibility(currentServer);
        }, 100);
    }

        // Update set scores from log
        // 从日志更新盘比分
        updateSetScoresFromLog(setsScoreParsed, gamesScoreParsed) {
            // Calculate current set number from sets score
            // 从sets比分计算当前盘数
            const currentSetNumber = parseInt(setsScoreParsed.player1) + parseInt(setsScoreParsed.player2) + 1;
            
            // Update set score badge (shows current set number and games in current set)
            // 更新盘比分徽章（显示当前盘数和当前盘的局数）
            const badge = document.getElementById('set-score-badge');
            if (badge) {
                badge.querySelector('div:first-child').textContent = currentSetNumber;
                badge.querySelector('div:last-child').textContent = 
                    `${gamesScoreParsed.player1}-${gamesScoreParsed.player2}`;
            }
        }

        // Update set scores (old method, kept for compatibility)
        // 更新盘比分（旧方法，保留以兼容）
        updateSetScores(sets) {
            // Update set score badge (shows current set number and games in current set)
            // 更新盘比分徽章（显示当前盘数和当前盘的局数）
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
        // Only update bottom indicators (under game score)
        // 只更新底部指示器（局比分下方）
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
        const receiver = currentServer === 'player1' ? 'player2' : 'player1';
        
        // Player 1 buttons
        // Player 1按钮
        const p1Server = document.getElementById('player1-server-buttons');
        const p1Receiver = document.getElementById('player1-receiver-buttons');
        
        if (currentServer === 'player1') {
            // Player 1 is serving - show server buttons
            // Player 1发球 - 显示发球方按钮
            if (p1Server) {
                p1Server.classList.remove('hidden');
                p1Server.style.display = 'flex';
                p1Server.style.visibility = 'visible';
                p1Server.style.opacity = '1';
            }
            if (p1Receiver) {
                p1Receiver.classList.add('hidden');
                p1Receiver.style.display = 'none';
            }
        } else {
            // Player 2 is serving - Player 1 is receiving - show receiver buttons
            // Player 2发球 - Player 1接发球 - 显示接发球方按钮
            if (p1Server) {
                p1Server.classList.add('hidden');
                p1Server.style.display = 'none';
            }
            if (p1Receiver) {
                p1Receiver.classList.remove('hidden');
                p1Receiver.style.display = 'flex';
                p1Receiver.style.visibility = 'visible';
                p1Receiver.style.opacity = '1';
            }
        }
        
        // Player 2 buttons
        // Player 2按钮
        const p2Server = document.getElementById('player2-server-buttons');
        const p2Receiver = document.getElementById('player2-receiver-buttons');
        
        if (currentServer === 'player2') {
            // Player 2 is serving - show server buttons
            // Player 2发球 - 显示发球方按钮
            if (p2Server) {
                p2Server.classList.remove('hidden');
                p2Server.style.display = 'flex';
                p2Server.style.visibility = 'visible';
                p2Server.style.opacity = '1';
            }
            if (p2Receiver) {
                p2Receiver.classList.add('hidden');
                p2Receiver.style.display = 'none';
            }
        } else {
            // Player 1 is serving - Player 2 is receiving - show receiver buttons
            // Player 1发球 - Player 2接发球 - 显示接发球方按钮
            if (p2Server) {
                p2Server.classList.add('hidden');
                p2Server.style.display = 'none';
            }
            if (p2Receiver) {
                p2Receiver.classList.remove('hidden');
                p2Receiver.style.display = 'flex';
                p2Receiver.style.visibility = 'visible';
                p2Receiver.style.opacity = '1';
            }
        }
        
        // Force reflow to ensure visibility changes take effect
        // 强制重排以确保可见性更改生效
        if (p1Server || p1Receiver || p2Server || p2Receiver) {
            void document.body.offsetHeight;
        }
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
