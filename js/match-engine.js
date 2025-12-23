//
//  Match Engine for Tennis Scoring
//  网球计分引擎
//
//  Handles all tennis scoring logic with player1/player2
//  处理所有网球计分逻辑（player1/player2）
//

class MatchEngine {
    constructor(match) {
        this.match = match;
        this.settings = match.settings;
        // Initialize current server if not set
        // 如果未设置，初始化当前发球方
        if (!match.currentServer) {
            this.match.currentServer = this.settings.firstServer;
            this.match.currentServeNumber = 1;
        }
    }

    // Record a point with point type and shot type
    // 记录一分（带类型和击球类型）
    recordPoint(winner, pointType = null, shotType = null) {
        const currentSet = this.getCurrentSet();
        
        // Check if we're in a tie-break
        // 检查是否在抢七
        if (this.isInTieBreak(currentSet)) {
            return this.recordTieBreakPoint(currentSet, winner, pointType, shotType);
        }
        
        const currentGame = this.getCurrentGame(currentSet);
        const server = this.match.currentServer;
        
        // Record point
        // 记录分
        const point = createPoint({
            pointNumber: currentGame.points.length + 1,
            winner: winner,
            pointType: pointType,
            shotType: shotType,
            server: server,
            serveNumber: this.match.currentServeNumber
        });
        currentGame.points.push(point);
        
        // Add to match log
        // 添加到比赛日志
        this.addToLog(winner, pointType, shotType);
        
        // Handle serve fault
        // 处理发球失误
        if (pointType === 'Serve Fault') {
            if (this.match.currentServeNumber === 1) {
                // First serve fault, try second serve
                // 一发失误，尝试二发
                this.match.currentServeNumber = 2;
                storage.saveMatch(this.match);
                return this.getMatchState();
            } else {
                // Double fault, opponent wins point
                // 双误，对手得分
                winner = server === 'player1' ? 'player2' : 'player1';
                point.winner = winner;
                this.match.currentServeNumber = 1;
            }
        } else {
            // Reset serve number after point is won
            // 得分后重置发球次数
            this.match.currentServeNumber = 1;
        }
        
        // Update game score
        // 更新局比分
        this.updateGameScore(currentGame, winner);
        
        // Check if game is won
        // 检查局是否结束
        if (currentGame.winner) {
            this.onGameWon(currentSet, currentGame);
        }
        
        // Auto-save match
        // 自动保存比赛
        storage.saveMatch(this.match);
        
        return this.getMatchState();
    }

    // Update game score based on winner
    // 根据获胜者更新局比分
    updateGameScore(game, winner) {
        const isPlayer1Point = winner === 'player1';
        
        if (this.settings.adScoring) {
            this.updateGameScoreWithAd(game, isPlayer1Point);
        } else {
            this.updateGameScoreNoAd(game, isPlayer1Point);
        }
    }

    // Update game score with Ad scoring
    // 使用Ad计分更新局比分
    updateGameScoreWithAd(game, isPlayer1Point) {
        if (game.player1Score === 'AD' && isPlayer1Point) {
            game.winner = 'player1';
            return;
        }
        if (game.player2Score === 'AD' && !isPlayer1Point) {
            game.winner = 'player2';
            return;
        }
        
        // Deuce scenario
        // 平分情况
        if (game.player1Score === 40 && game.player2Score === 40) {
            if (isPlayer1Point) {
                game.player1Score = 'AD';
                game.player2Score = 40;
            } else {
                game.player2Score = 'AD';
                game.player1Score = 40;
            }
            return;
        }
        
        // Back from AD to deuce
        // 从AD回到平分
        if (game.player1Score === 'AD' && !isPlayer1Point) {
            game.player1Score = 40;
            game.player2Score = 40;
            return;
        }
        if (game.player2Score === 'AD' && isPlayer1Point) {
            game.player1Score = 40;
            game.player2Score = 40;
            return;
        }
        
        // Normal progression
        // 正常计分
        if (isPlayer1Point) {
            if (game.player1Score === 0) game.player1Score = 15;
            else if (game.player1Score === 15) game.player1Score = 30;
            else if (game.player1Score === 30) game.player1Score = 40;
            else if (game.player1Score === 40 && game.player2Score < 40) {
                game.winner = 'player1';
            }
        } else {
            if (game.player2Score === 0) game.player2Score = 15;
            else if (game.player2Score === 15) game.player2Score = 30;
            else if (game.player2Score === 30) game.player2Score = 40;
            else if (game.player2Score === 40 && game.player1Score < 40) {
                game.winner = 'player2';
            }
        }
    }

    // Update game score without Ad scoring
    // 不使用Ad计分更新局比分
    updateGameScoreNoAd(game, isPlayer1Point) {
        if (isPlayer1Point) {
            if (game.player1Score === 0) game.player1Score = 15;
            else if (game.player1Score === 15) game.player1Score = 30;
            else if (game.player1Score === 30) game.player1Score = 40;
            else if (game.player1Score === 40) {
                game.winner = 'player1';
            }
        } else {
            if (game.player2Score === 0) game.player2Score = 15;
            else if (game.player2Score === 15) game.player2Score = 30;
            else if (game.player2Score === 30) game.player2Score = 40;
            else if (game.player2Score === 40) {
                game.winner = 'player2';
            }
        }
    }

    // Handle game won
    // 处理局获胜
    onGameWon(set, game) {
        game.server = this.match.currentServer;
        
        if (game.winner === 'player1') {
            set.player1Games++;
        } else {
            set.player2Games++;
        }
        
        // Switch server for next game
        // 下一局换发球
        this.match.currentServer = this.match.currentServer === 'player1' ? 'player2' : 'player1';
        this.match.currentServeNumber = 1;
        
        // Check if set is won
        // 检查盘是否结束
        this.checkSetWinner(set);
        
        // Check if match is won
        // 检查比赛是否结束
        if (!set.winner) {
            // Create new game for next game
            // 为下一局创建新局
            const nextGameNumber = set.games.length + 1;
            set.games.push(createGame({
                gameNumber: nextGameNumber
            }));
        } else {
            this.checkMatchWinner();
        }
    }

    // Check if set is won
    // 检查盘是否获胜
    checkSetWinner(set) {
        const gamesToWin = this.settings.gamesPerSet;
        const player1Games = set.player1Games;
        const player2Games = set.player2Games;
        
        // Check if someone won by games
        // 检查是否有人通过局数获胜
        if (player1Games >= gamesToWin && player1Games - player2Games >= 2) {
            set.winner = 'player1';
            return;
        }
        if (player2Games >= gamesToWin && player2Games - player1Games >= 2) {
            set.winner = 'player2';
            return;
        }
        
        // Check if tie-break is needed
        // 检查是否需要抢七
        if (player1Games === gamesToWin && player2Games === gamesToWin) {
            // Start tie-break
            // 开始抢七
            this.startTieBreak(set);
        }
    }

    // Start tie-break
    // 开始抢七
    startTieBreak(set) {
        set.tieBreak = createTieBreak();
        // In tie-break, first server serves once, then alternate every 2 points
        // 抢七中，第一个发球方发一次，然后每2分换发
        this.match.currentServer = set.games.length % 2 === 0 ? 
            (this.settings.firstServer === 'player1' ? 'player2' : 'player1') :
            this.settings.firstServer;
        this.match.currentServeNumber = 1;
    }

    // Check if currently in tie-break
    // 检查当前是否在抢七
    isInTieBreak(set) {
        return set.tieBreak !== null && set.tieBreak.winner === null;
    }

    // Record tie-break point
    // 记录抢七分
    recordTieBreakPoint(set, winner, pointType, shotType = null) {
        const tieBreak = set.tieBreak;
        const isPlayer1Point = winner === 'player1';
        
        const point = createPoint({
            pointNumber: tieBreak.points.length + 1,
            winner: winner,
            pointType: pointType,
            shotType: shotType,
            server: this.match.currentServer,
            serveNumber: this.match.currentServeNumber
        });
        tieBreak.points.push(point);
        
        // Add to match log
        // 添加到比赛日志
        this.addToLog(winner, pointType, shotType);
        
        // Handle serve fault in tie-break
        // 处理抢七中的发球失误
        if (pointType === 'Serve Fault') {
            if (this.match.currentServeNumber === 1) {
                this.match.currentServeNumber = 2;
                // Add to log even for first serve fault
                // 即使是一发失误也添加到日志
                this.addToLog(this.match.currentServer, pointType, null);
                storage.saveMatch(this.match);
                return this.getMatchState();
            } else {
                winner = this.match.currentServer === 'player1' ? 'player2' : 'player1';
                point.winner = winner;
                isPlayer1Point = winner === 'player1';
                this.match.currentServeNumber = 1;
                // Update log entry for double fault
                // 更新双误的日志条目
                if (this.match.log.length > 0) {
                    this.match.log[this.match.log.length - 1].action = 'Double Fault';
                }
            }
        } else {
            this.match.currentServeNumber = 1;
        }
        
        if (isPlayer1Point) {
            tieBreak.player1Points++;
        } else {
            tieBreak.player2Points++;
        }
        
        // Switch server every 2 points in tie-break
        // 抢七中每2分换发
        if (tieBreak.points.length % 2 === 0) {
            this.match.currentServer = this.match.currentServer === 'player1' ? 'player2' : 'player1';
        }
        
        // Check if tie-break is won
        // 检查抢七是否结束
        this.checkTieBreakWinner(set);
        
        // If tie-break is won, update set
        // 如果抢七结束，更新盘
        if (tieBreak.winner) {
            if (tieBreak.winner === 'player1') {
                set.player1Games++;
            } else {
                set.player2Games++;
            }
            set.winner = tieBreak.winner;
            this.checkMatchWinner();
        }
        
        storage.saveMatch(this.match);
        return this.getMatchState();
    }

    // Check tie-break winner
    // 检查抢七获胜者
    checkTieBreakWinner(set) {
        const tieBreak = set.tieBreak;
        const isFinalSet = set.setNumber === this.settings.numberOfSets;
        
        let targetPoints, winBy2;
        
        if (isFinalSet && this.settings.finalSetType === 'Super Tie Break') {
            targetPoints = this.settings.superTieBreakPoints;
            winBy2 = this.settings.superTieBreakWinBy2;
        } else {
            targetPoints = this.settings.tieBreakGames;
            winBy2 = this.settings.tieBreakWinBy2;
        }
        
        const player1Points = tieBreak.player1Points;
        const player2Points = tieBreak.player2Points;
        
        if (winBy2) {
            if (player1Points >= targetPoints && player1Points - player2Points >= 2) {
                tieBreak.winner = 'player1';
            } else if (player2Points >= targetPoints && player2Points - player1Points >= 2) {
                tieBreak.winner = 'player2';
            }
        } else {
            if (player1Points >= targetPoints) {
                tieBreak.winner = 'player1';
            } else if (player2Points >= targetPoints) {
                tieBreak.winner = 'player2';
            }
        }
    }

    // Check match winner
    // 检查比赛获胜者
    checkMatchWinner() {
        const setsToWin = Math.ceil(this.settings.numberOfSets / 2);
        let player1Sets = 0;
        let player2Sets = 0;
        
        for (const set of this.match.sets) {
            if (set.winner === 'player1') {
                player1Sets++;
            } else if (set.winner === 'player2') {
                player2Sets++;
            }
        }
        
        if (player1Sets >= setsToWin) {
            this.match.winner = 'player1';
            this.endMatch();
        } else if (player2Sets >= setsToWin) {
            this.match.winner = 'player2';
            this.endMatch();
        }
    }

    // End match
    // 结束比赛
    endMatch() {
        this.match.status = 'completed';
        this.match.endTime = new Date().toISOString();
        storage.saveMatch(this.match);
    }

    // Get current set
    // 获取当前盘
    getCurrentSet() {
        let currentSet = this.match.sets[this.match.sets.length - 1];
        
        if (!currentSet || currentSet.winner) {
            // Create new set
            // 创建新盘
            const setNumber = this.match.sets.length + 1;
            currentSet = createSet({
                setNumber: setNumber
            });
            currentSet.games.push(createGame({
                gameNumber: 1
            }));
            this.match.sets.push(currentSet);
            
            // Set server for first game of new set
            // 设置新盘第一局的发球方
            if (setNumber === 1) {
                this.match.currentServer = this.settings.firstServer;
            } else {
                // Alternate first server each set
                // 每盘交替首发
                this.match.currentServer = this.settings.firstServer === 'player1' ? 'player2' : 'player1';
            }
            this.match.currentServeNumber = 1;
        }
        
        return currentSet;
    }

    // Get current game
    // 获取当前局
    getCurrentGame(set) {
        let currentGame = set.games[set.games.length - 1];
        
        if (!currentGame || currentGame.winner) {
            // Create new game
            // 创建新局
            const gameNumber = set.games.length + 1;
            currentGame = createGame({
                gameNumber: gameNumber
            });
            set.games.push(currentGame);
        }
        
        return currentGame;
    }

    // Get match state for display
    // 获取比赛状态用于显示
    getMatchState() {
        const currentSet = this.getCurrentSet();
        const currentGame = this.getCurrentGame(currentSet);
        
        let player1Score = currentGame.player1Score;
        let player2Score = currentGame.player2Score;
        
        // Format score for display
        // 格式化比分用于显示
        if (typeof player1Score === 'number') {
            player1Score = player1Score.toString();
        }
        if (typeof player2Score === 'number') {
            player2Score = player2Score.toString();
        }
        
        return {
            currentSet: currentSet.setNumber,
            currentGame: currentGame.gameNumber,
            player1Score: player1Score,
            player2Score: player2Score,
            sets: this.match.sets,
            isInTieBreak: this.isInTieBreak(currentSet),
            tieBreak: currentSet.tieBreak,
            matchStatus: this.match.status,
            winner: this.match.winner,
            currentServer: this.match.currentServer,
            currentServeNumber: this.match.currentServeNumber
        };
    }

    // Undo last point
    // 撤销最后一分
    undoLastPoint() {
        const currentSet = this.getCurrentSet();
        
        if (this.isInTieBreak(currentSet)) {
            const tieBreak = currentSet.tieBreak;
            if (tieBreak.points.length > 0) {
                const lastPoint = tieBreak.points.pop();
                
                // Remove corresponding log entry
                // 删除对应的日志条目
                if (this.match.log && this.match.log.length > 0) {
                    this.match.log.pop();
                }
                
                if (lastPoint.winner === 'player1') {
                    tieBreak.player1Points--;
                } else {
                    tieBreak.player2Points--;
                }
                tieBreak.winner = null;
                
                // Restore server if needed
                // 如需要恢复发球方
                if (tieBreak.points.length > 0 && tieBreak.points.length % 2 === 0) {
                    this.match.currentServer = this.match.currentServer === 'player1' ? 'player2' : 'player1';
                }
            }
        } else {
            const currentGame = this.getCurrentGame(currentSet);
            
            // If current game is empty (just started), go back to previous game
            // 如果当前局为空（刚开局），回到上一局
            if (currentGame.points.length === 0 && !currentGame.winner) {
                // Remove the empty game
                // 删除空局
                if (currentSet.games.length > 1) {
                    currentSet.games.pop();
                    const previousGame = currentSet.games[currentSet.games.length - 1];
                    
                    // If previous game was won, undo it
                    // 如果上一局已结束，撤销
                    if (previousGame.winner) {
                        previousGame.winner = null;
                        if (previousGame.points.length > 0) {
                            const lastPoint = previousGame.points[previousGame.points.length - 1];
                            if (lastPoint.winner === 'player1') {
                                currentSet.player1Games--;
                            } else {
                                currentSet.player2Games--;
                            }
                        }
                        currentSet.winner = null;
                        
                        // Restore server
                        // 恢复发球方
                        this.match.currentServer = previousGame.server;
                        
                        // Remove last point from previous game
                        // 从上一局删除最后一分
                        if (previousGame.points.length > 0) {
                            const lastPoint = previousGame.points.pop();
                            this.resetGameScore(previousGame);
                            this.match.currentServeNumber = lastPoint.serveNumber || 1;
                            
                            // Remove corresponding log entry
                            // 删除对应的日志条目
                            if (this.match.log && this.match.log.length > 0) {
                                this.match.log.pop();
                            }
                        }
                    }
                }
            } else if (currentGame.points.length > 0) {
                const lastPoint = currentGame.points.pop();
                
                // Remove corresponding log entry
                // 删除对应的日志条目
                if (this.match.log && this.match.log.length > 0) {
                    this.match.log.pop();
                }
                
                // Reset game score
                // 重置局比分
                this.resetGameScore(currentGame);
                
                // If game was won, undo it
                // 如果局已结束，撤销
                if (currentGame.winner) {
                    currentGame.winner = null;
                    if (lastPoint.winner === 'player1') {
                        currentSet.player1Games--;
                    } else {
                        currentSet.player2Games--;
                    }
                    currentSet.winner = null;
                    
                    // Restore server
                    // 恢复发球方
                    this.match.currentServer = currentGame.server;
                }
                
                // Restore serve number
                // 恢复发球次数
                this.match.currentServeNumber = lastPoint.serveNumber || 1;
            }
        }
        
        // Reset match winner if needed
        // 如需要重置比赛获胜者
        if (this.match.winner) {
            this.match.winner = null;
            this.match.status = 'in-progress';
            this.match.endTime = null;
        }
        
        storage.saveMatch(this.match);
        return this.getMatchState();
    }

    // Reset game score after undo
    // 撤销后重置局比分
    resetGameScore(game) {
        // Recalculate score from remaining points
        // 从剩余分重新计算比分
        let player1Score = 0;
        let player2Score = 0;
        
        for (const point of game.points) {
            const isPlayer1Point = point.winner === 'player1';
            
            if (isPlayer1Point) {
                if (player1Score === 0) player1Score = 15;
                else if (player1Score === 15) player1Score = 30;
                else if (player1Score === 30) player1Score = 40;
                else if (player1Score === 40) {
                    if (player2Score < 40) {
                        player1Score = 40;
                    } else {
                        if (game.player1Score === 'AD') {
                            player1Score = 'AD';
                        } else {
                            player1Score = 40;
                        }
                    }
                }
            } else {
                if (player2Score === 0) player2Score = 15;
                else if (player2Score === 15) player2Score = 30;
                else if (player2Score === 30) player2Score = 40;
                else if (player2Score === 40) {
                    if (player1Score < 40) {
                        player2Score = 40;
                    } else {
                        if (game.player2Score === 'AD') {
                            player2Score = 'AD';
                        } else {
                            player2Score = 40;
                        }
                    }
                }
            }
        }
        
        game.player1Score = player1Score;
        game.player2Score = player2Score;
    }
    
    // Add entry to match log
    // 添加条目到比赛日志
    addToLog(player, action, shotType = null) {
        if (!this.match.log) {
            this.match.log = [];
        }
        
        const currentSet = this.getCurrentSet();
        const currentGame = this.getCurrentGame(currentSet);
        const state = this.getMatchState();
        
        // Format score for display
        // 格式化比分用于显示
        let scoreDisplay = `${state.player1Score}-${state.player2Score}`;
        if (currentSet.tieBreak && this.isInTieBreak(currentSet)) {
            const tb = currentSet.tieBreak;
            scoreDisplay = `TB: ${tb.player1Points || 0}-${tb.player2Points || 0}`;
        }
        
        const logEntry = createLogEntry({
            player: player,
            action: action,
            shotType: shotType,
            score: scoreDisplay,
            setNumber: currentSet.setNumber,
            gameNumber: currentGame.gameNumber
        });
        
        this.match.log.push(logEntry);
    }
}
