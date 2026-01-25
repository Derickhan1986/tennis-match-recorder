//
// Score Validator Agent
// 记分验证器Agent
//
// Independently calculates match scores from point sequence
// 从point序列独立计算比赛分数
//

class ScoreValidator {
    constructor() {
        // Current game state
        // 当前游戏状态
        this.currentGame = {
            player1Score: 0,
            player2Score: 0,
            winner: null
        };
        
        // Current set state
        // 当前盘状态
        this.currentSet = {
            setNumber: 1,
            player1Games: 0,
            player2Games: 0,
            games: [],
            tieBreak: null,
            winner: null
        };
        
        // Match state
        // 比赛状态
        this.matchState = {
            sets: [],
            winner: null,
            currentServer: null
        };
        
        // Settings
        // 设置
        this.settings = null;
        
        // Track expected server for each point
        // 跟踪每个point的期望发球方
        this.expectedServers = [];
    }

    // Calculate expected scores from point sequence
    // 从point序列计算期望分数
    calculateScores(pointSequence, settings) {
        // Reset state
        // 重置状态
        this.settings = settings;
        this.matchState = {
            sets: [],
            winner: null,
            currentServer: settings.firstServer
        };
        
        this.currentSet = {
            setNumber: 1,
            player1Games: 0,
            player2Games: 0,
            games: [],
            tieBreak: null,
            winner: null
        };
        
        this.currentGame = {
            player1Score: 0,
            player2Score: 0,
            winner: null
        };
        
        // Initialize first game
        // 初始化第一局
        this.currentSet.games.push({
            gameNumber: 1,
            player1Score: 0,
            player2Score: 0,
            winner: null,
            server: this.matchState.currentServer
        });
        
        // Process each point
        // 处理每个point
        for (let i = 0; i < pointSequence.length; i++) {
            const point = pointSequence[i];
            if (!point) continue;
            
            // Record expected server for this point (before processing)
            // 记录此point的期望发球方（在处理之前）
            // Note: Even first serve faults should have an expected server
            // 注意：即使是一发失误也应该有期望发球方
            this.expectedServers.push({
                pointNumber: point.pointNumber || i + 1,
                expectedServer: this.matchState.currentServer
            });
            
            // Skip first serve faults (no winner yet, but server is already recorded)
            // 跳过一发失误（还没有winner，但发球方已记录）
            if (point.pointType === 'Serve Fault' && point.serveNumber === 1) {
                continue;
            }
            
            // Check if we're in a tie-break
            // 检查是否在抢七
            if (this.isInTieBreak()) {
                this.processTieBreakPoint(point);
            } else {
                this.processGamePoint(point);
            }
            
            // Check if match is completed
            // 检查比赛是否完成
            if (this.matchState.winner) {
                break;
            }
        }
        
        // Add current set if not empty
        // 如果当前set不为空，添加它
        if (this.currentSet.player1Games > 0 || this.currentSet.player2Games > 0 || 
            this.currentSet.games.length > 0 || this.currentSet.tieBreak) {
            this.matchState.sets.push({ ...this.currentSet });
        }
        
        return {
            sets: this.matchState.sets,
            winner: this.matchState.winner,
            finalScore: this.getFinalScore(),
            expectedServers: this.expectedServers
        };
    }

    // Process a point in a game (not tie-break)
    // 处理游戏中的一分（非抢七）
    processGamePoint(point) {
        if (!point.winner) return;
        
        const winner = point.winner;
        const isPlayer1Point = winner === 'player1';
        
        // Update game score
        // 更新游戏分数
        if (this.settings.adScoring) {
            this.updateGameScoreWithAd(isPlayer1Point);
        } else {
            this.updateGameScoreNoAd(isPlayer1Point);
        }
        
        // Check if game is won
        // 检查游戏是否结束
        if (this.currentGame.winner) {
            this.onGameWon();
        }
    }

    // Update game score with Ad scoring
    // 使用Ad计分更新游戏分数
    updateGameScoreWithAd(isPlayer1Point) {
        if (this.currentGame.player1Score === 'AD' && isPlayer1Point) {
            this.currentGame.winner = 'player1';
            return;
        }
        if (this.currentGame.player2Score === 'AD' && !isPlayer1Point) {
            this.currentGame.winner = 'player2';
            return;
        }
        
        // Deuce scenario
        // 平分情况
        if (this.currentGame.player1Score === 40 && this.currentGame.player2Score === 40) {
            if (isPlayer1Point) {
                this.currentGame.player1Score = 'AD';
                this.currentGame.player2Score = 40;
            } else {
                this.currentGame.player2Score = 'AD';
                this.currentGame.player1Score = 40;
            }
            return;
        }
        
        // Back from AD to deuce
        // 从AD回到平分
        if (this.currentGame.player1Score === 'AD' && !isPlayer1Point) {
            this.currentGame.player1Score = 40;
            this.currentGame.player2Score = 40;
            return;
        }
        if (this.currentGame.player2Score === 'AD' && isPlayer1Point) {
            this.currentGame.player1Score = 40;
            this.currentGame.player2Score = 40;
            return;
        }
        
        // Normal progression
        // 正常计分
        if (isPlayer1Point) {
            if (this.currentGame.player1Score === 0) this.currentGame.player1Score = 15;
            else if (this.currentGame.player1Score === 15) this.currentGame.player1Score = 30;
            else if (this.currentGame.player1Score === 30) this.currentGame.player1Score = 40;
            else if (this.currentGame.player1Score === 40 && this.currentGame.player2Score < 40) {
                this.currentGame.winner = 'player1';
            }
        } else {
            if (this.currentGame.player2Score === 0) this.currentGame.player2Score = 15;
            else if (this.currentGame.player2Score === 15) this.currentGame.player2Score = 30;
            else if (this.currentGame.player2Score === 30) this.currentGame.player2Score = 40;
            else if (this.currentGame.player2Score === 40 && this.currentGame.player1Score < 40) {
                this.currentGame.winner = 'player2';
            }
        }
    }

    // Update game score without Ad scoring
    // 不使用Ad计分更新游戏分数
    updateGameScoreNoAd(isPlayer1Point) {
        if (isPlayer1Point) {
            if (this.currentGame.player1Score === 0) this.currentGame.player1Score = 15;
            else if (this.currentGame.player1Score === 15) this.currentGame.player1Score = 30;
            else if (this.currentGame.player1Score === 30) this.currentGame.player1Score = 40;
            else if (this.currentGame.player1Score === 40) {
                this.currentGame.winner = 'player1';
            }
        } else {
            if (this.currentGame.player2Score === 0) this.currentGame.player2Score = 15;
            else if (this.currentGame.player2Score === 15) this.currentGame.player2Score = 30;
            else if (this.currentGame.player2Score === 30) this.currentGame.player2Score = 40;
            else if (this.currentGame.player2Score === 40) {
                this.currentGame.winner = 'player2';
            }
        }
    }

    // Handle game won
    // 处理游戏获胜
    onGameWon() {
        const gameWinner = this.currentGame.winner;
        
        // Update set games
        // 更新盘的游戏数
        if (gameWinner === 'player1') {
            this.currentSet.player1Games++;
        } else {
            this.currentSet.player2Games++;
        }
        
        // Record completed game
        // 记录已完成的游戏
        const lastGame = this.currentSet.games[this.currentSet.games.length - 1];
        if (lastGame) {
            lastGame.winner = gameWinner;
            lastGame.player1Score = this.currentGame.player1Score;
            lastGame.player2Score = this.currentGame.player2Score;
            // Record server for this game (before switching)
            // 记录此局的发球方（在交换之前）
            lastGame.server = this.matchState.currentServer;
        }
        
        // Check if set is won BEFORE switching server
        // 在交换发球权之前检查盘是否结束
        // Save the current server before checking (needed for tie-break)
        // 在检查之前保存当前发球方（抢七需要）
        const currentServerBeforeCheck = this.matchState.currentServer;
        
        // Check if set is won
        // 检查盘是否结束
        this.checkSetWinner();
        
        // If set is not won, switch server for next game and create new game
        // 如果盘未结束，为下一局交换发球权并创建新游戏
        if (!this.currentSet.winner) {
            // Switch server for next game
            // 下一局换发球
            this.matchState.currentServer = this.matchState.currentServer === 'player1' ? 'player2' : 'player1';
            
            this.currentGame = {
                player1Score: 0,
                player2Score: 0,
                winner: null
            };
            this.currentSet.games.push({
                gameNumber: this.currentSet.games.length + 1,
                player1Score: 0,
                player2Score: 0,
                winner: null,
                server: this.matchState.currentServer
            });
        } else {
            // Set is won - DO NOT switch server here
            // 盘已结束 - 这里不要交换发球权
            // Server will be exchanged in checkMatchWinner when creating new set
            // 发球权将在checkMatchWinner中创建新盘时交换
            // Restore server to what it was before set ended (needed for tie-break logic)
            // 恢复盘结束前的发球方（抢七逻辑需要）
            this.matchState.currentServer = currentServerBeforeCheck;
            
            // Set is won, check match winner
            // 盘已结束，检查比赛获胜者
            this.checkMatchWinner();
        }
    }

    // Check if set is won
    // 检查盘是否获胜
    checkSetWinner() {
        const gamesToWin = this.settings.gamesPerSet;
        const player1Games = this.currentSet.player1Games;
        const player2Games = this.currentSet.player2Games;
        
        // Check if someone won by 2 games
        // 检查是否有人领先2个游戏获胜
        if (player1Games >= gamesToWin && player1Games - player2Games >= 2) {
            this.currentSet.winner = 'player1';
            return;
        }
        if (player2Games >= gamesToWin && player2Games - player1Games >= 2) {
            this.currentSet.winner = 'player2';
            return;
        }
        
        // Check if tie-break is needed
        // 检查是否需要抢七
        if (player1Games === gamesToWin && player2Games === gamesToWin) {
            this.startTieBreak();
        }
    }

    // Start tie-break
    // 开始抢七
    startTieBreak() {
        // In tie-break, the player who was receiving in the last game serves first
        // 抢七中，上一局的接发球方先发球
        const lastGame = this.currentSet.games[this.currentSet.games.length - 1];
        if (lastGame && lastGame.server) {
            const lastGameReceiver = lastGame.server === 'player1' ? 'player2' : 'player1';
            this.matchState.currentServer = lastGameReceiver;
        } else {
            // Switch server when entering tie-break
            // 进入抢七时交换发球权
            this.matchState.currentServer = this.matchState.currentServer === 'player1' ? 'player2' : 'player1';
        }
        
        this.currentSet.tieBreak = {
            player1Points: 0,
            player2Points: 0,
            winner: null
        };
    }

    // Check if in tie-break
    // 检查是否在抢七
    isInTieBreak() {
        return this.currentSet.tieBreak !== null && this.currentSet.tieBreak.winner === null;
    }

    // Process a tie-break point
    // 处理抢七分
    processTieBreakPoint(point) {
        if (!point.winner) return;
        
        const winner = point.winner;
        const isPlayer1Point = winner === 'player1';
        
        // Update tie-break score
        // 更新抢七比分
        if (isPlayer1Point) {
            this.currentSet.tieBreak.player1Points++;
        } else {
            this.currentSet.tieBreak.player2Points++;
        }
        
        // Switch server in tie-break
        // 抢七中换发
        // Rule: First server serves 1 point, then switch, then each player serves 2 points alternately
        // 规则：第一个发球方发1个球，然后换发，之后每人依次发2个球
        // Switch after: 1st point, then after every 2 points (3rd, 5th, 7th, etc.)
        // 换发时机：第1分后，然后每2分后（第3分、第5分、第7分等）
        const tieBreakPointsCount = this.currentSet.tieBreak.player1Points + this.currentSet.tieBreak.player2Points;
        if (tieBreakPointsCount % 2 === 1) {
            this.matchState.currentServer = this.matchState.currentServer === 'player1' ? 'player2' : 'player1';
        }
        
        // Check if tie-break is won
        // 检查抢七是否结束
        this.checkTieBreakWinner();
        
        // If tie-break is won, update set
        // 如果抢七结束，更新盘
        if (this.currentSet.tieBreak.winner) {
            if (this.currentSet.tieBreak.winner === 'player1') {
                this.currentSet.player1Games++;
            } else {
                this.currentSet.player2Games++;
            }
            this.currentSet.winner = this.currentSet.tieBreak.winner;
            
            // Exchange server for next set
            // 为新盘交换发球权
            // The opponent of the last server in tie-break serves first in new set
            // 抢七中最后一个发球方的对手在新盘先发球
            this.matchState.currentServer = this.matchState.currentServer === 'player1' ? 'player2' : 'player1';
            
            this.checkMatchWinner();
        }
    }

    // Check tie-break winner
    // 检查抢七获胜者
    checkTieBreakWinner() {
        const isFinal = this.isFinalSet();
        let targetPoints, winBy2;
        
        if (isFinal && this.settings.finalSetType === 'Super Tie Break') {
            targetPoints = this.settings.superTieBreakPoints;
            winBy2 = this.settings.superTieBreakWinBy2;
        } else {
            targetPoints = this.settings.tieBreakGames;
            winBy2 = this.settings.tieBreakWinBy2;
        }
        
        const player1Points = this.currentSet.tieBreak.player1Points;
        const player2Points = this.currentSet.tieBreak.player2Points;
        
        if (winBy2) {
            if (player1Points >= targetPoints && player1Points - player2Points >= 2) {
                this.currentSet.tieBreak.winner = 'player1';
            } else if (player2Points >= targetPoints && player2Points - player1Points >= 2) {
                this.currentSet.tieBreak.winner = 'player2';
            }
        } else {
            if (player1Points >= targetPoints && player1Points > player2Points) {
                this.currentSet.tieBreak.winner = 'player1';
            } else if (player2Points >= targetPoints && player2Points > player1Points) {
                this.currentSet.tieBreak.winner = 'player2';
            }
        }
    }

    // Check if current set is final set
    // 检查当前盘是否是决胜盘
    isFinalSet() {
        if (this.currentSet.setNumber !== this.settings.numberOfSets) {
            return false;
        }
        
        let player1Sets = 0;
        let player2Sets = 0;
        
        for (const s of this.matchState.sets) {
            if (s.winner === 'player1') {
                player1Sets++;
            } else if (s.winner === 'player2') {
                player2Sets++;
            }
        }
        
        return player1Sets === player2Sets;
    }

    // Check match winner
    // 检查比赛获胜者
    checkMatchWinner() {
        // Save current set
        // 保存当前盘
        this.matchState.sets.push({ ...this.currentSet });
        
        // Count sets won
        // 计算已赢得的盘数
        const setsToWin = Math.ceil(this.settings.numberOfSets / 2);
        let player1Sets = 0;
        let player2Sets = 0;
        
        for (const set of this.matchState.sets) {
            if (set.winner === 'player1') {
                player1Sets++;
            } else if (set.winner === 'player2') {
                player2Sets++;
            }
        }
        
        if (player1Sets >= setsToWin) {
            this.matchState.winner = 'player1';
        } else if (player2Sets >= setsToWin) {
            this.matchState.winner = 'player2';
        } else {
            // Create new set
            // 创建新盘
            this.currentSet = {
                setNumber: this.matchState.sets.length + 1,
                player1Games: 0,
                player2Games: 0,
                games: [],
                tieBreak: null,
                winner: null
            };
            
            // Exchange server for new set
            // 为新盘交换发球权
            // The opponent of the last server from previous set serves first in new set
            // 上一盘最后一个发球方的对手在新盘先发球
            // Get the last game from the previous set to determine the last server
            // 从上一盘获取最后一局以确定最后一个发球方
            const previousSet = this.matchState.sets[this.matchState.sets.length - 1];
            let lastServerFromPreviousSet = null;
            if (previousSet && previousSet.games && previousSet.games.length > 0) {
                const lastGame = previousSet.games[previousSet.games.length - 1];
                if (lastGame && lastGame.server) {
                    lastServerFromPreviousSet = lastGame.server;
                }
            }
            
            if (lastServerFromPreviousSet) {
                // Exchange: the opponent of the last server serves first
                // 交换：最后一个发球方的对手先发球
                this.matchState.currentServer = lastServerFromPreviousSet === 'player1' ? 'player2' : 'player1';
            } else {
                // Fallback: alternate from firstServer
                // 备用：从firstServer交替
                // For set 2, if firstServer was player1, then set 2 should start with player2
                // 对于set 2，如果firstServer是player1，那么set 2应该从player2开始
                if (this.currentSet.setNumber === 2) {
                    this.matchState.currentServer = this.settings.firstServer === 'player1' ? 'player2' : 'player1';
                } else {
                    // For subsequent sets, alternate from previous set's first server
                    // 对于后续的sets，从上一盘的第一个发球方交替
                    this.matchState.currentServer = this.matchState.currentServer === 'player1' ? 'player2' : 'player1';
                }
            }
            
            // Initialize first game of new set
            // 初始化新盘的第一局
            this.currentGame = {
                player1Score: 0,
                player2Score: 0,
                winner: null
            };
            this.currentSet.games.push({
                gameNumber: 1,
                player1Score: 0,
                player2Score: 0,
                winner: null,
                server: this.matchState.currentServer
            });
        }
    }

    // Get final score string
    // 获取最终比分字符串
    getFinalScore() {
        const scoreParts = [];
        for (const set of this.matchState.sets) {
            if (set.tieBreak && set.tieBreak.winner) {
                scoreParts.push(`${set.player1Games}-${set.player2Games}(${set.tieBreak.player1Points}-${set.tieBreak.player2Points})`);
            } else {
                scoreParts.push(`${set.player1Games}-${set.player2Games}`);
            }
        }
        return scoreParts.join(' ');
    }
}

// Export for use in other modules
// 导出供其他模块使用
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ScoreValidator;
}

