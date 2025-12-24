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
        // Restore match state from last log entry before recording new point
        // 在记录新point之前从最后一条日志条目恢复比赛状态
        this.restoreStateFromLastLog();
        
        const currentSet = this.getCurrentSet();
        
        // Check if we're in a tie-break
        // 检查是否在抢七
        if (this.isInTieBreak(currentSet)) {
            return this.recordTieBreakPoint(currentSet, winner, pointType, shotType);
        }
        
        const currentGame = this.getCurrentGame(currentSet);
        const server = this.match.currentServer;
        
        // Calculate point number from log (log contains all points now)
        // 从日志计算point number（日志现在包含所有points）
        const pointNumber = (this.match.log ? this.match.log.length : 0) + 1;
        
        // Handle serve fault
        // 处理发球失误
        let isDoubleFault = false;
        let actualWinner = winner;
        if (pointType === 'Serve Fault') {
            if (this.match.currentServeNumber === 1) {
                // First serve fault, try second serve (score doesn't change)
                // 一发失误，尝试二发（比分不变）
                this.match.currentServeNumber = 2;
                // Add to log for first serve fault (score doesn't change)
                // 一发失误添加到日志（比分不变），使用当前game
                this.addToLog(server, pointType, null, currentGame, {
                    pointNumber: pointNumber,
                    winner: null, // No winner yet for first serve fault
                    pointType: pointType,
                    server: server,
                    serveNumber: 1
                });
                storage.saveMatch(this.match);
                return; // Display will read from log, no need to return state
                // 显示将从日志读取，不需要返回状态
            } else {
                // Double fault, opponent wins point
                // 双误，对手得分
                isDoubleFault = true;
                actualWinner = server === 'player1' ? 'player2' : 'player1';
                this.match.currentServeNumber = 1;
            }
        } else {
            // Reset serve number after point is won
            // 得分后重置发球次数
            this.match.currentServeNumber = 1;
        }
        
        // Update game score
        // 更新局比分
        this.updateGameScore(currentGame, actualWinner);
        
        // Check if game is won
        // 检查局是否结束
        const gameWasWon = !!currentGame.winner;
        
        // Handle game won BEFORE adding to log (so games score is updated)
        // 在添加到日志之前处理局结束（这样games比分已更新）
        if (gameWasWon) {
            this.onGameWon(currentSet, currentGame);
        }
        
        // Add to match log AFTER updating score and handling game won (so log shows correct games score)
        // 更新比分和处理局结束后添加到日志（这样日志显示正确的games比分）
        // If game was won, use the new game (0-0) for logging, otherwise use current game
        // 如果game结束了，使用新game（0-0）记录日志，否则使用当前game
        let gameForLog = currentGame;
        if (gameWasWon) {
            // Game ended, use the newly created game (which has 0-0 score)
            // Game结束了，使用新创建的game（比分是0-0）
            const newGame = this.getCurrentGame(currentSet);
            if (newGame && newGame !== currentGame) {
                gameForLog = newGame;
            }
        }
        
        // Determine player and action for log
        // 确定日志的玩家和操作
        let logPlayer = actualWinner;
        let logAction = pointType;
        if (isDoubleFault) {
            // Double fault - log the server who made the fault, not the winner
            // 双误 - 记录犯错的发球方，而不是得分方
            logPlayer = server;
            logAction = 'Double Fault';
        } else if (pointType === 'Return Error') {
            // Return error - log the receiver who made the error, not the winner
            // Return error - 记录犯错的接发球方，而不是得分方
            logPlayer = server === 'player1' ? 'player2' : 'player1';
            logAction = 'Return Error';
        }
        
        // Add to log with point information
        // 添加point信息到日志
        this.addToLog(logPlayer, logAction, shotType, gameForLog, {
            pointNumber: pointNumber,
            winner: actualWinner,
            pointType: pointType,
            server: server,
            serveNumber: isDoubleFault ? 2 : (pointType === 'Serve Fault' ? 1 : this.match.currentServeNumber)
        });
        
        // Auto-save match
        // 自动保存比赛
        storage.saveMatch(this.match);
        
        // Display will read from log, no need to return state
        // 显示将从日志读取，不需要返回状态
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
        // In tie-break, the player who was receiving in the last game serves first
        // Then, after 1 point, the serve switches. After that, it switches every 2 points.
        // 抢七中，上一局的接发球方先发球。然后发1分后换发，之后每2分换发。
        // Get the last game to determine who was receiving
        // 获取最后一局以确定谁在接发球
        const lastGame = set.games[set.games.length - 1];
        if (lastGame && lastGame.server) {
            // The receiver of the last game serves first in tie-break
            // 上一局的接发球方在抢七中先发球
            const lastGameReceiver = lastGame.server === 'player1' ? 'player2' : 'player1';
            this.match.currentServer = lastGameReceiver;
        } else {
            // No previous game (e.g., final set starting directly in tie-break)
            // 没有上一局（例如，决胜盘直接进入抢七）
            // Switch server when entering tie-break (exchange serve)
            // 进入抢七时交换发球权
            if (this.match.currentServer) {
                // Switch server (exchange serve when entering tie-break)
                // 交换发球权（进入抢七时交换发球权）
                this.match.currentServer = this.match.currentServer === 'player1' ? 'player2' : 'player1';
            } else {
                // If currentServer is not set, use firstServer
                // 如果currentServer未设置，使用firstServer
                this.match.currentServer = this.settings.firstServer;
            }
        }
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
        // Restore match state from last log entry before recording new point
        // 在记录新point之前从最后一条日志条目恢复比赛状态
        this.restoreStateFromLastLog();
        
        // Re-get set after state restoration
        // 状态恢复后重新获取set
        const currentSet = this.getCurrentSet();
        const tieBreak = currentSet.tieBreak;
        const tieBreakServer = this.match.currentServer;
        
        // Calculate point number from log (log contains all points now)
        // 从日志计算point number（日志现在包含所有points）
        const pointNumber = (this.match.log ? this.match.log.length : 0) + 1;
        
        // Handle serve fault in tie-break
        // 处理抢七中的发球失误
        let isDoubleFault = false;
        let actualWinner = winner;
        if (pointType === 'Serve Fault') {
            if (this.match.currentServeNumber === 1) {
                this.match.currentServeNumber = 2;
                // Get the last game before tie-break for logging
                // 获取抢七前的最后一个game用于日志记录
                // For final set with Super Tie Break, there might be no games (tie-break starts directly)
                // 对于决胜盘使用 Super Tie Break，可能没有games（直接开始抢七）
                let lastGame = currentSet.games[currentSet.games.length - 1];
                if (!lastGame) {
                    // Create a placeholder game for logging (final set starting directly in tie-break)
                    // 创建一个占位game用于日志记录（决胜盘直接进入抢七）
                    lastGame = createGame({ gameNumber: 0 }); // Use 0 to indicate placeholder
                    // 使用0表示占位符
                }
                // Add to log for first serve fault (score doesn't change)
                // 一发失误添加到日志（比分不变）
                this.addToLog(tieBreakServer, pointType, null, lastGame, {
                    pointNumber: pointNumber,
                    winner: null, // No winner yet for first serve fault
                    pointType: pointType,
                    server: tieBreakServer,
                    serveNumber: 1
                });
                storage.saveMatch(this.match);
                return; // Display will read from log, no need to return state
                // 显示将从日志读取，不需要返回状态
            } else {
                // Double fault, opponent wins point
                // 双误，对手得分
                isDoubleFault = true;
                actualWinner = tieBreakServer === 'player1' ? 'player2' : 'player1';
                this.match.currentServeNumber = 1;
            }
        } else {
            this.match.currentServeNumber = 1;
        }
        
        const isPlayer1Point = actualWinner === 'player1';
        
        // Update tie-break score
        // 更新抢七比分
        if (isPlayer1Point) {
            tieBreak.player1Points++;
        } else {
            tieBreak.player2Points++;
        }
        
        // Switch server in tie-break
        // 抢七中换发
        // Rule: First server serves 1 point, then switch, then each player serves 2 points alternately
        // 规则：第一个发球方发1个球，然后换发，之后每人依次发2个球
        // Switch after: 1st point, then after every 2 points (3rd, 5th, 7th, etc.)
        // 换发时机：第1分后，然后每2分后（第3分、第5分、第7分等）
        // Calculate total points in tie-break (after this point is added)
        // 计算抢七中的总分数（添加此point后）
        const tieBreakPointsCount = (tieBreak.player1Points || 0) + (tieBreak.player2Points || 0);
        
        // Switch after: 1st point (tieBreakPointsCount === 1), then every 2 points (3rd, 5th, 7th, etc.)
        // 换发时机：第1分后（tieBreakPointsCount === 1），然后每2分后（第3分、第5分、第7分等）
        // Pattern: 1, 3, 5, 7, 9... (all odd numbers)
        // 模式：1, 3, 5, 7, 9...（所有奇数）
        if (tieBreakPointsCount % 2 === 1) {
            this.match.currentServer = this.match.currentServer === 'player1' ? 'player2' : 'player1';
        }
        
        // Check if tie-break is won
        // 检查抢七是否结束
        this.checkTieBreakWinner(currentSet);
        
        // If tie-break is won, update set
        // 如果抢七结束，更新盘
        if (tieBreak.winner) {
            if (tieBreak.winner === 'player1') {
                currentSet.player1Games++;
            } else {
                currentSet.player2Games++;
            }
            currentSet.winner = tieBreak.winner;
            this.checkMatchWinner();
        }
        
        // Get the last game before tie-break for logging
        // 获取抢七前的最后一个game用于日志记录
        // For final set with Super Tie Break, there might be no games (tie-break starts directly)
        // 对于决胜盘使用 Super Tie Break，可能没有games（直接开始抢七）
        let lastGame = currentSet.games[currentSet.games.length - 1];
        if (!lastGame) {
            // Create a placeholder game for logging (final set starting directly in tie-break)
            // 创建一个占位game用于日志记录（决胜盘直接进入抢七）
            lastGame = createGame({ gameNumber: 0 }); // Use 0 to indicate placeholder
            // 使用0表示占位符
        }
        
        // Determine player and action for log
        // 确定日志的玩家和操作
        let logPlayer = actualWinner;
        let logAction = pointType;
        if (isDoubleFault) {
            // Double fault - log the server who made the fault, not the winner
            // 双误 - 记录犯错的发球方，而不是得分方
            logPlayer = tieBreakServer;
            logAction = 'Double Fault';
        } else if (pointType === 'Return Error') {
            // Return error - log the receiver who made the error, not the winner
            // Return error - 记录犯错的接发球方，而不是得分方
            logPlayer = tieBreakServer === 'player1' ? 'player2' : 'player1';
            logAction = 'Return Error';
        }
        
        // Add to log with point information
        // 添加point信息到日志
        this.addToLog(logPlayer, logAction, shotType, lastGame, {
            pointNumber: pointNumber,
            winner: actualWinner,
            pointType: pointType,
            server: tieBreakServer,
            serveNumber: isDoubleFault ? 2 : (pointType === 'Serve Fault' ? 1 : this.match.currentServeNumber)
        });
        
        storage.saveMatch(this.match);
        
        // Display will read from log, no need to return state
        // 显示将从日志读取，不需要返回状态
    }

    // Check if current set is the final set (deciding set)
    // 检查当前盘是否是决胜盘
    // Final set = last set (setNumber === numberOfSets) AND sets are tied
    // 决胜盘 = 最后一盘（setNumber === numberOfSets）且盘数相等
    isFinalSet(set) {
        // Must be the last set
        // 必须是最后一盘
        if (set.setNumber !== this.settings.numberOfSets) {
            return false;
        }
        
        // Count sets won by each player (excluding current set)
        // 计算每个玩家赢得的盘数（不包括当前盘）
        let player1Sets = 0;
        let player2Sets = 0;
        
        for (const s of this.match.sets) {
            if (s.setNumber < set.setNumber) {
                if (s.winner === 'player1') {
                    player1Sets++;
                } else if (s.winner === 'player2') {
                    player2Sets++;
                }
            }
        }
        
        // Final set: sets are tied (e.g., 1-1 in 3-set match, 2-2 in 5-set match)
        // 决胜盘：盘数相等（例如，3盘制中1-1，5盘制中2-2）
        return player1Sets === player2Sets;
    }

    // Check tie-break winner
    // 检查抢七获胜者
    checkTieBreakWinner(set) {
        const tieBreak = set.tieBreak;
        const isFinal = this.isFinalSet(set);
        
        let targetPoints, winBy2;
        
        if (isFinal && this.settings.finalSetType === 'Super Tie Break') {
            // Super Tie Break: use superTieBreakWinBy2 setting
            // Super Tie Break：使用superTieBreakWinBy2设置
            targetPoints = this.settings.superTieBreakPoints;
            winBy2 = this.settings.superTieBreakWinBy2;
        } else {
            // Normal tie-break (e.g., 6-6 tie-break): use tieBreakWinBy2 setting
            // 普通抢七（例如，6-6时的抢七）：使用tieBreakWinBy2设置
            targetPoints = this.settings.tieBreakGames;
            winBy2 = this.settings.tieBreakWinBy2;
        }
        
        const player1Points = tieBreak.player1Points;
        const player2Points = tieBreak.player2Points;
        
        if (winBy2) {
            // Win by 2: must reach target points AND lead by at least 2 points
            // 领先2分获胜：必须达到目标分数且至少领先2分
            if (player1Points >= targetPoints && player1Points - player2Points >= 2) {
                tieBreak.winner = 'player1';
            } else if (player2Points >= targetPoints && player2Points - player1Points >= 2) {
                tieBreak.winner = 'player2';
            }
            // If both players reached target but neither leads by 2, continue playing
            // 如果双方都达到目标分数但都没有领先2分，继续比赛
        } else {
            // No win by 2: first to reach target points wins
            // 不需要领先2分：先达到目标分数者获胜
            if (player1Points >= targetPoints && player1Points > player2Points) {
                tieBreak.winner = 'player1';
            } else if (player2Points >= targetPoints && player2Points > player1Points) {
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
            
            // Set server for first game/tie-break of new set BEFORE starting tie-break
            // 在开始抢七之前设置新盘第一局/抢七的发球方
            if (setNumber === 1) {
                this.match.currentServer = this.settings.firstServer;
            } else {
                // Alternate first server each set
                // 每盘交替首发
                this.match.currentServer = this.settings.firstServer === 'player1' ? 'player2' : 'player1';
            }
            this.match.currentServeNumber = 1;
            
            // Check if this is the final set and should use Super Tie Break
            // 检查是否是决胜盘且应使用 Super Tie Break
            const isFinal = this.isFinalSet(currentSet);
            
            if (isFinal && this.settings.finalSetType === 'Super Tie Break') {
                // Final set with Super Tie Break: start directly in tie-break mode
                // 决胜盘使用 Super Tie Break：直接进入抢七模式
                // Server is already set above, startTieBreak will exchange it
                // 发球方已在上面设置，startTieBreak会交换它
                this.startTieBreak(currentSet);
            } else {
                // Normal set: start with regular game
                // 常规盘：从常规局开始
                currentSet.games.push(createGame({
                    gameNumber: 1
                }));
            }
            
            this.match.sets.push(currentSet);
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
        
        // If in tie-break, use tie-break score instead of game score
        // 如果在抢七，使用抢七比分而不是局比分
        if (this.isInTieBreak(currentSet) && currentSet.tieBreak) {
            player1Score = currentSet.tieBreak.player1Points || 0;
            player2Score = currentSet.tieBreak.player2Points || 0;
        }
        
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

    // Rebuild match state from all points
    // 从所有points重新构建比赛状态
    rebuildMatchState() {
        // Set flag to prevent adding to log during rebuild
        // 设置标志以在重建期间阻止添加到日志
        this.isRebuilding = true;
        
        // Save all existing points with their game/set information
        // 保存所有现有的points及其game/set信息
        const allPointsWithContext = [];
        
        for (let setIdx = 0; setIdx < this.match.sets.length; setIdx++) {
            const set = this.match.sets[setIdx];
            for (let gameIdx = 0; gameIdx < set.games.length; gameIdx++) {
                const game = set.games[gameIdx];
                if (game.points && game.points.length > 0) {
                    for (const point of game.points) {
                        allPointsWithContext.push({
                            point: point,
                            setIndex: setIdx,
                            gameIndex: gameIdx,
                            gameNumber: game.gameNumber,
                            isTieBreak: false
                        });
                    }
                }
            }
            if (set.tieBreak && set.tieBreak.points && set.tieBreak.points.length > 0) {
                for (const point of set.tieBreak.points) {
                    allPointsWithContext.push({
                        point: point,
                        setIndex: setIdx,
                        gameIndex: -1, // Tie-break doesn't have game index
                        gameNumber: null, // Tie-break doesn't have game number
                        isTieBreak: true
                    });
                }
            }
        }
        
        // Reset all match state
        // 重置所有比赛状态
        // Only keep sets that have points
        // 只保留有点的sets
        const setsWithPoints = [];
        for (const set of this.match.sets) {
            let hasPoints = false;
            for (const game of set.games) {
                if (game.points && game.points.length > 0) {
                    hasPoints = true;
                    break;
                }
            }
            if (set.tieBreak && set.tieBreak.points && set.tieBreak.points.length > 0) {
                hasPoints = true;
            }
            if (hasPoints) {
                setsWithPoints.push(set);
            }
        }
        
        // If no sets with points, keep at least the first set
        // 如果没有有点的sets，至少保留第一个set
        if (setsWithPoints.length === 0 && this.match.sets.length > 0) {
            setsWithPoints.push(this.match.sets[0]);
        }
        
        // Reset sets
        // 重置sets
        setsWithPoints.forEach(set => {
            set.player1Games = 0;
            set.player2Games = 0;
            set.winner = null;
            set.games = [createGame({ gameNumber: 1 })];
            set.tieBreak = null;
        });
        
        // Remove empty sets (new sets that were just created)
        // 删除空sets（刚创建的新sets）
        this.match.sets = setsWithPoints;
        
        // If no sets left, create first set
        // 如果没有sets了，创建第一个set
        if (this.match.sets.length === 0) {
            const firstSet = createSet({ setNumber: 1 });
            firstSet.games.push(createGame({ gameNumber: 1 }));
            this.match.sets.push(firstSet);
        }
        
        this.match.currentServer = this.settings.firstServer;
        this.match.currentServeNumber = 1;
        this.match.winner = null;
        this.match.status = 'in-progress';
        this.match.endTime = null;
        
        // Replay all points in order
        // 按顺序重放所有points
        for (const { point, setIndex, gameIndex, gameNumber, isTieBreak } of allPointsWithContext) {
            // Skip serve faults that didn't result in points
            // 跳过没有得分的发球失误
            if (point.pointType === 'Serve Fault' && point.serveNumber === 1) {
                continue;
            }
            
            if (point.winner) {
                // Get the correct set and game
                // 获取正确的set和game
                const currentSet = this.match.sets[setIndex];
                
                if (isTieBreak) {
                    // Record tie-break point
                    // 记录抢七分
                    this.recordTieBreakPoint(currentSet, point.winner, point.pointType, point.shotType);
                } else {
                    // Ensure we have the correct game
                    // 确保我们有正确的game
                    while (currentSet.games.length <= gameIndex) {
                        const nextGameNumber = currentSet.games.length + 1;
                        currentSet.games.push(createGame({ gameNumber: nextGameNumber }));
                    }
                    
                    // Get the game and record point directly
                    // 获取game并直接记录分
                    const targetGame = currentSet.games[gameIndex];
                    targetGame.gameNumber = gameNumber; // Ensure correct game number
                    
                    // Set server for this game if not set
                    // 如果未设置，为此game设置发球方
                    if (!targetGame.server) {
                        targetGame.server = this.match.currentServer;
                    } else {
                        this.match.currentServer = targetGame.server;
                    }
                    
                    // Record point directly to avoid creating new games
                    // 直接记录分以避免创建新games
                    const pointObj = createPoint({
                        pointNumber: targetGame.points.length + 1,
                        winner: point.winner,
                        pointType: point.pointType,
                        shotType: point.shotType,
                        server: point.server || this.match.currentServer,
                        serveNumber: point.serveNumber || 1
                    });
                    targetGame.points.push(pointObj);
                    
                    // Handle serve fault
                    // 处理发球失误
                    if (point.pointType === 'Serve Fault' && point.serveNumber === 1) {
                        this.match.currentServeNumber = 2;
                        // Don't add to log for first serve fault (it will be added when double fault occurs)
                        // 一发失误不添加到日志（双误时会添加）
                        continue;
                    }
                    
                    // Update game score
                    // 更新局比分
                    this.updateGameScore(targetGame, point.winner);
                    
                    // Check if game is won
                    // 检查局是否结束
                    if (targetGame.winner) {
                        this.onGameWon(currentSet, targetGame);
                    } else {
                        this.match.currentServeNumber = 1;
                    }
                }
            }
        }
        
        // Clear flag
        // 清除标志
        this.isRebuilding = false;
        
        // Rebuild log from remaining points to ensure consistency
        // 从剩余points重建日志以确保一致性
        this.rebuildLogFromPoints();
        
        // Save match after rebuild
        // 重建后保存比赛
        storage.saveMatch(this.match);
    }
    
    // Rebuild log from points
    // 从points重建日志
    rebuildLogFromPoints() {
        // Clear existing log
        // 清空现有日志
        this.match.log = [];
        
        // Temporarily disable log adding during rebuild (we'll add manually)
        // 在重建期间临时禁用日志添加（我们将手动添加）
        const originalIsRebuilding = this.isRebuilding;
        this.isRebuilding = true;
        
        // Save current state (this is the state AFTER rebuildMatchState, so it has all sets with correct winners)
        // 保存当前状态（这是rebuildMatchState之后的状态，所以它包含所有具有正确获胜者的sets）
        const savedSets = JSON.parse(JSON.stringify(this.match.sets));
        const savedCurrentServer = this.match.currentServer;
        const savedCurrentServeNumber = this.match.currentServeNumber;
        
        // Calculate sets score from savedSets (which has all completed sets)
        // 从savedSets计算sets比分（它包含所有已完成的sets）
        let savedPlayer1Sets = 0;
        let savedPlayer2Sets = 0;
        for (const set of savedSets) {
            if (set.winner === 'player1') {
                savedPlayer1Sets++;
            } else if (set.winner === 'player2') {
                savedPlayer2Sets++;
            }
        }
        
        // Reset match state for replay
        // 重置比赛状态以重放
        this.match.sets = [createSet({ setNumber: 1 })];
        this.match.currentServer = this.settings.firstServer;
        this.match.currentServeNumber = 1;
        this.match.winner = null;
        this.match.status = 'in-progress';
        this.match.endTime = null;
        
        // Replay all points and rebuild log entries step by step
        // 逐步重放所有points并重建日志条目
        for (let setIdx = 0; setIdx < savedSets.length; setIdx++) {
            const savedSet = savedSets[setIdx];
            
            // Process games
            // 处理games
            for (let gameIdx = 0; gameIdx < savedSet.games.length; gameIdx++) {
                const savedGame = savedSet.games[gameIdx];
                if (savedGame.points && savedGame.points.length > 0) {
                    // Get or create current set and game
                    // 获取或创建当前set和game
                    while (this.match.sets.length <= setIdx) {
                        this.match.sets.push(createSet({ setNumber: this.match.sets.length + 1 }));
                    }
                    const currentSet = this.match.sets[setIdx];
                    
                    while (currentSet.games.length <= gameIdx) {
                        const nextGameNumber = currentSet.games.length + 1;
                        currentSet.games.push(createGame({ gameNumber: nextGameNumber }));
                    }
                    const currentGame = currentSet.games[gameIdx];
                    currentGame.gameNumber = savedGame.gameNumber;
                    
                    // Set server for this game
                    // 为此game设置发球方
                    if (savedGame.server) {
                        currentGame.server = savedGame.server;
                        this.match.currentServer = savedGame.server;
                    }
                    
                    // Replay points in this game step by step
                    // 逐步重放此game中的points
                    for (const point of savedGame.points) {
                        // Skip first serve faults (they don't create log entries)
                        // 跳过一发失误（它们不创建日志条目）
                        if (point.pointType === 'Serve Fault' && point.serveNumber === 1) {
                            // Still need to update serve number
                            // 仍需要更新发球次数
                            this.match.currentServeNumber = 2;
                            continue;
                        }
                        
                        // Record point
                        // 记录分
                        const pointObj = createPoint({
                            pointNumber: currentGame.points.length + 1,
                            winner: point.winner,
                            pointType: point.pointType,
                            shotType: point.shotType,
                            server: point.server || this.match.currentServer,
                            serveNumber: point.serveNumber || 1
                        });
                        currentGame.points.push(pointObj);
                        
                        // Update game score
                        // 更新局比分
                        this.updateGameScore(currentGame, point.winner);
                        
                        // Check if game is won
                        // 检查局是否结束
                        const gameWasWon = !!currentGame.winner;
                        if (gameWasWon) {
                            this.onGameWon(currentSet, currentGame);
                        } else {
                            this.match.currentServeNumber = 1;
                        }
                        
                        // Now add to log with current state
                        // 现在使用当前状态添加到日志
                        this.isRebuilding = false; // Temporarily enable to add log
                        // 临时启用以添加日志
                        
                        // Determine player and action for log
                        // 确定日志的玩家和操作
                        let logPlayer = point.winner;
                        let logAction = point.pointType;
                        
                        if (point.pointType === 'Double Fault') {
                            logPlayer = point.server;
                            logAction = 'Double Fault';
                        } else if (point.pointType === 'Return Error') {
                            logPlayer = point.server === 'player1' ? 'player2' : 'player1';
                            logAction = 'Return Error';
                        }
                        
                        // Use current game (which has correct score after update)
                        // 使用当前game（更新后具有正确的比分）
                        let gameForLog = currentGame;
                        if (gameWasWon) {
                            // Game ended, use the newly created game (0-0)
                            // Game结束了，使用新创建的game（0-0）
                            const newGame = this.getCurrentGame(currentSet);
                            if (newGame && newGame !== currentGame) {
                                gameForLog = newGame;
                            }
                        }
                        
                        // Call addToLog with savedSets for setsScore calculation
                        // 使用savedSets调用addToLog以计算setsScore
                        this.addToLogWithSets(logPlayer, logAction, point.shotType, gameForLog, currentSet, savedSets);
                        
                        this.isRebuilding = true; // Disable again
                        // 再次禁用
                    }
                }
            }
            
            // Process tie-break
            // 处理抢七
            if (savedSet.tieBreak && savedSet.tieBreak.points && savedSet.tieBreak.points.length > 0) {
                const currentSet = this.match.sets[setIdx];
                const lastGame = currentSet.games[currentSet.games.length - 1];
                
                // Start tie-break
                // 开始抢七
                if (!currentSet.tieBreak) {
                    currentSet.tieBreak = createTieBreak();
                    // Set initial server for tie-break
                    // 设置抢七的初始发球方
                    if (lastGame && lastGame.server) {
                        this.match.currentServer = lastGame.server === 'player1' ? 'player2' : 'player1';
                    }
                    this.match.currentServeNumber = 1;
                }
                
                for (const point of savedSet.tieBreak.points) {
                    // Skip first serve faults
                    // 跳过一发失误
                    if (point.pointType === 'Serve Fault' && point.serveNumber === 1) {
                        this.match.currentServeNumber = 2;
                        continue;
                    }
                    
                    // Record tie-break point
                    // 记录抢七分
                    this.recordTieBreakPoint(currentSet, point.winner, point.pointType, point.shotType);
                    
                    // Add to log
                    // 添加到日志
                    this.isRebuilding = false; // Temporarily enable
                    // 临时启用
                    
                    let logPlayer = point.winner;
                    let logAction = point.pointType;
                    
                    if (point.pointType === 'Double Fault') {
                        logPlayer = point.server;
                        logAction = 'Double Fault';
                    } else if (point.pointType === 'Return Error') {
                        logPlayer = point.server === 'player1' ? 'player2' : 'player1';
                        logAction = 'Return Error';
                    }
                    
                    // Call addToLog with savedSets for setsScore calculation
                    // 使用savedSets调用addToLog以计算setsScore
                    this.addToLogWithSets(logPlayer, logAction, point.shotType, lastGame, currentSet, savedSets);
                    
                    this.isRebuilding = true; // Disable again
                    // 再次禁用
                }
            }
        }
        
        // Restore flag
        // 恢复标志
        this.isRebuilding = originalIsRebuilding;
    }

    // Undo last point
    // 撤销最后一分
    undoLastPoint() {
        // Remove last log entry - log contains all information (point + score)
        // 删除最后一条日志 - 日志包含所有信息（point + 比分）
        if (this.match.log && this.match.log.length > 0) {
            this.match.log.pop();
        }
        
        // Rebuild match state from remaining log entries
        // 从剩余的日志条目重建比赛状态
        this.rebuildMatchStateFromLog();
        
        storage.saveMatch(this.match);
        
        // Display will read from log, no need to return state
        // 显示将从日志读取，不需要返回状态
    }
    
    // Restore match state from last log entry (for use before recording new point)
    // 从最后一条日志条目恢复比赛状态（用于记录新point之前）
    restoreStateFromLastLog() {
        this.rebuildMatchStateFromLog();
    }
    
    // Rebuild match state from log entries
    // 从日志条目重建比赛状态
    rebuildMatchStateFromLog() {
        if (!this.match.log || this.match.log.length === 0) {
            // No log entries, restore to initial state
            // 没有日志条目，恢复到初始状态
            this.match.sets = [createSet({ setNumber: 1 })];
            this.match.sets[0].games = [createGame({ gameNumber: 1 })];
            this.match.currentServer = this.settings.firstServer;
            this.match.currentServeNumber = 1;
            this.match.winner = null;
            this.match.status = 'in-progress';
            this.match.endTime = null;
            return;
        }
        
        // Get last log entry to restore state
        // 获取最后一条日志条目以恢复状态
        const lastLogEntry = this.match.log[this.match.log.length - 1];
        
        // Restore currentServer and currentServeNumber
        // 恢复currentServer和currentServeNumber
        if (lastLogEntry.currentServer) {
            this.match.currentServer = lastLogEntry.currentServer;
        }
        if (lastLogEntry.currentServeNumber !== undefined && lastLogEntry.currentServeNumber !== null) {
            this.match.currentServeNumber = lastLogEntry.currentServeNumber;
        }
        
        // Parse scores from last log entry
        // 从最后一条日志条目解析比分
        const parseScore = (scoreStr) => {
            if (!scoreStr) return { player1: 0, player2: 0 };
            const tbMatch = scoreStr.match(/TB:\s*(\d+)-(\d+)/i);
            if (tbMatch) {
                return { player1: parseInt(tbMatch[1]) || 0, player2: parseInt(tbMatch[2]) || 0, isTieBreak: true };
            }
            const parts = scoreStr.split('-');
            if (parts.length === 2) {
                // Handle score like "0", "15", "30", "40", "AD"
                // 处理比分如"0", "15", "30", "40", "AD"
                const p1 = parts[0].trim();
                const p2 = parts[1].trim();
                return { 
                    player1: p1 === 'AD' ? 'AD' : (parseInt(p1) || 0), 
                    player2: p2 === 'AD' ? 'AD' : (parseInt(p2) || 0) 
                };
            }
            return { player1: 0, player2: 0 };
        };
        
        const gameScoreParsed = parseScore(lastLogEntry.gameScore);
        const gamesScoreParsed = parseScore(lastLogEntry.gamesScore);
        const setsScoreParsed = parseScore(lastLogEntry.setsScore);
        
        // Rebuild sets based on setsScore
        // 根据setsScore重建sets
        const totalSets = parseInt(setsScoreParsed.player1) + parseInt(setsScoreParsed.player2);
        const currentSetNumber = totalSets + 1;
        
        // Reset all sets first
        // 首先重置所有sets
        this.match.sets = [];
        
        // Create completed sets
        // 创建已完成的sets
        for (let i = 0; i < totalSets; i++) {
            const set = createSet({ setNumber: i + 1 });
            if (i < parseInt(setsScoreParsed.player1)) {
                set.winner = 'player1';
            } else {
                set.winner = 'player2';
            }
            // For completed sets, we need to determine games won
            // 对于已完成的sets，我们需要确定赢得的games
            // This is complex, so we'll set a default (can be improved later)
            // 这很复杂，所以我们设置一个默认值（可以稍后改进）
            set.player1Games = set.winner === 'player1' ? this.settings.gamesPerSet : 0;
            set.player2Games = set.winner === 'player2' ? this.settings.gamesPerSet : 0;
            this.match.sets.push(set);
        }
        
        // Create current set
        // 创建当前set
        const currentSet = createSet({ setNumber: currentSetNumber });
        currentSet.player1Games = parseInt(gamesScoreParsed.player1) || 0;
        currentSet.player2Games = parseInt(gamesScoreParsed.player2) || 0;
        
        // Update current game
        // 更新当前game
        if (gameScoreParsed.isTieBreak) {
            // In tie-break
            // 在抢七
            currentSet.tieBreak = createTieBreak();
            currentSet.tieBreak.player1Points = gameScoreParsed.player1;
            currentSet.tieBreak.player2Points = gameScoreParsed.player2;
            currentSet.tieBreak.winner = null; // Tie-break not finished yet
            // 抢七尚未结束
            // Create a placeholder game for tie-break context
            // 为抢七上下文创建一个占位game
            if (currentSet.games.length === 0) {
                currentSet.games.push(createGame({ gameNumber: this.settings.gamesPerSet }));
            }
        } else {
            // In regular game
            // 在常规game
            // Calculate game number from gamesScore
            // 从gamesScore计算game number
            const totalGames = parseInt(gamesScoreParsed.player1) + parseInt(gamesScoreParsed.player2);
            const currentGameNumber = totalGames + 1;
            
            // Create all previous games (won games)
            // 创建所有之前的games（已赢得的games）
            for (let i = 0; i < totalGames; i++) {
                const game = createGame({ gameNumber: i + 1 });
                if (i < parseInt(gamesScoreParsed.player1)) {
                    game.winner = 'player1';
                } else {
                    game.winner = 'player2';
                }
                currentSet.games.push(game);
            }
            
            // Create current game
            // 创建当前game
            const currentGame = createGame({ gameNumber: currentGameNumber });
            currentGame.player1Score = gameScoreParsed.player1;
            currentGame.player2Score = gameScoreParsed.player2;
            currentGame.winner = null; // Game not finished yet
            // Game尚未结束
            currentSet.games.push(currentGame);
        }
        
        this.match.sets.push(currentSet);
        
        // Update match status
        // 更新比赛状态
        this.match.winner = null;
        this.match.status = 'in-progress';
        this.match.endTime = null;
    }
    
    // Old undo logic below (keep for reference)
    // 以下为旧的撤销逻辑（保留供参考）
    /*
    undoLastPointOld() {
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
                
                // Restore server based on tie-break serve rotation
                // 根据抢七发球轮换恢复发球方
                if (tieBreak.points.length === 0) {
                    // If no points left in tie-break, restore to last game's server
                    // 如果抢七没有点了，恢复到最后一局的发球方
                    const lastGame = currentSet.games[currentSet.games.length - 1];
                    if (lastGame && lastGame.server) {
                        this.match.currentServer = lastGame.server;
                    }
                } else {
                    // Restore server based on tie-break rotation rule
                    // 根据抢七轮换规则恢复发球方
                    // Rule: first point switches, then every 2 points
                    // 规则：第1分后换发，然后每2分换发
                    if (tieBreak.points.length === 1 || (tieBreak.points.length > 1 && tieBreak.points.length % 2 === 1)) {
                        // Should switch server
                        // 应该换发
                        this.match.currentServer = this.match.currentServer === 'player1' ? 'player2' : 'player1';
                    }
                }
                
                // If tie-break is now empty, remove it and go back to last game
                // 如果抢七现在为空，删除它并回到最后一局
                if (tieBreak.points.length === 0) {
                    // Get the last game before tie-break started
                    // 获取抢七开始前的最后一局
                    const lastGame = currentSet.games[currentSet.games.length - 1];
                    if (lastGame) {
                        // Remove tie-break
                        // 删除抢七
                        currentSet.tieBreak = null;
                        
                        // If last game was won, undo it to restore game state
                        // 如果最后一局已结束，撤销它以恢复局状态
                        if (lastGame.winner) {
                            // Remove last point from game
                            // 从局中删除最后一分
                            if (lastGame.points.length > 0) {
                                const lastGamePoint = lastGame.points.pop();
                                
                                // Remove corresponding log entry
                                // 删除对应的日志条目
                                if (this.match.log && this.match.log.length > 0) {
                                    this.match.log.pop();
                                }
                                
                                // Recalculate game score
                                // 重新计算局比分
                                this.resetGameScore(lastGame);
                                
                                // Restore game winner state
                                // 恢复局获胜者状态
                                lastGame.winner = null;
                                
                                // Restore server to last game's server
                                // 恢复到最后一局的发球方
                                if (lastGame.server) {
                                    this.match.currentServer = lastGame.server;
                                }
                                
                                // Restore serve number
                                // 恢复发球次数
                                if (lastGamePoint && lastGamePoint.serveNumber) {
                                    this.match.currentServeNumber = lastGamePoint.serveNumber;
                                } else {
                                    this.match.currentServeNumber = 1;
                                }
                            }
                        } else {
                            // Restore server to last game's server
                            // 恢复到最后一局的发球方
                            if (lastGame.server) {
                                this.match.currentServer = lastGame.server;
                            }
                        }
                    }
                }
            } else {
                // Tie-break exists but has no points - remove it and restore game state
                // 抢七存在但没有点 - 删除它并恢复局状态
                const lastGame = currentSet.games[currentSet.games.length - 1];
                if (lastGame) {
                    // Remove tie-break
                    // 删除抢七
                    currentSet.tieBreak = null;
                    
                    // If last game was won, undo it to restore game state
                    // 如果最后一局已结束，撤销它以恢复局状态
                    if (lastGame.winner && lastGame.points.length > 0) {
                        // Remove last point from game
                        // 从局中删除最后一分
                        const lastGamePoint = lastGame.points.pop();
                        
                        // Remove corresponding log entry
                        // 删除对应的日志条目
                        if (this.match.log && this.match.log.length > 0) {
                            this.match.log.pop();
                        }
                        
                        // Recalculate game score
                        // 重新计算局比分
                        this.resetGameScore(lastGame);
                        
                        // Restore game winner state
                        // 恢复局获胜者状态
                        lastGame.winner = null;
                        
                        // Restore server to last game's server
                        // 恢复到最后一局的发球方
                        if (lastGame.server) {
                            this.match.currentServer = lastGame.server;
                        }
                        
                        // Restore serve number
                        // 恢复发球次数
                        if (lastGamePoint && lastGamePoint.serveNumber) {
                            this.match.currentServeNumber = lastGamePoint.serveNumber;
                        } else {
                            this.match.currentServeNumber = 1;
                        }
                    } else if (lastGame.server) {
                        // Restore server to last game's server
                        // 恢复到最后一局的发球方
                        this.match.currentServer = lastGame.server;
                    }
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
    */

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
    
    // Add entry to match log with optional sets for setsScore calculation and point information
    // 添加条目到比赛日志，可选sets用于计算setsScore和point信息
    addToLogWithSets(player, action, shotType = null, game = null, currentSet = null, setsForScore = null, pointInfo = null) {
        if (!this.match.log) {
            this.match.log = [];
        }
        
        // Use provided currentSet, or get current set if not provided
        // 使用提供的currentSet，如果未提供则获取当前set
        if (!currentSet) {
            currentSet = this.getCurrentSet();
        }
        
        // Use provided game, or get current game if not provided
        // 使用提供的game，如果未提供则获取当前game
        const currentGame = game || this.getCurrentGame(currentSet);
        
        // Use provided sets for setsScore calculation, or use match.sets
        // 使用提供的sets计算setsScore，或使用match.sets
        const setsToUse = setsForScore || this.match.sets;
        
        // Check if we're in tie-break
        // 检查是否在抢七
        const isInTieBreak = currentSet.tieBreak && this.isInTieBreak(currentSet);
        
        // Calculate game score from the provided game (not from getMatchState which might return new game)
        // 从提供的game计算game比分（不从getMatchState获取，因为它可能返回新game）
        let gameScore;
        if (isInTieBreak) {
            const tb = currentSet.tieBreak;
            gameScore = `TB: ${tb.player1Points || 0}-${tb.player2Points || 0}`;
        } else {
            // Use the game's score directly (the game where the point was recorded)
            // 直接使用game的比分（记录point的game）
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
            
            gameScore = `${player1Score}-${player2Score}`;
        }
        
        // Calculate games score (games won in current set)
        // 计算games比分（当前set内赢得的games）
        const gamesScore = `${currentSet.player1Games}-${currentSet.player2Games}`;
        
        // Calculate sets score (sets won in match)
        // 计算sets比分（match内赢得的sets）
        let player1Sets = 0;
        let player2Sets = 0;
        for (const set of setsToUse) {
            if (set.winner === 'player1') {
                player1Sets++;
            } else if (set.winner === 'player2') {
                player2Sets++;
            }
        }
        const setsScore = `${player1Sets}-${player2Sets}`;
        
        const logEntry = createLogEntry({
            // Point information (if provided)
            // Point信息（如果提供）
            pointNumber: pointInfo ? pointInfo.pointNumber : null,
            winner: pointInfo ? pointInfo.winner : null,
            pointType: pointInfo ? pointInfo.pointType : null,
            server: pointInfo ? pointInfo.server : null,
            serveNumber: pointInfo ? pointInfo.serveNumber : null,
            // Log information
            // 日志信息
            player: player,
            action: action,
            shotType: shotType,
            // Score information
            // 比分信息
            gameScore: gameScore,
            gamesScore: gamesScore,
            setsScore: setsScore,
            currentServer: this.match.currentServer, // Record current server for undo tracking
            currentServeNumber: this.match.currentServeNumber // Record current serve number for undo tracking
        });
        
        this.match.log.push(logEntry);
    }
    
    // Add entry to match log
    // 添加条目到比赛日志
    addToLog(player, action, shotType = null, game = null, pointInfo = null) {
        // Don't add to log during rebuild (log will be rebuilt from points)
        // 重建期间不添加到日志（日志将从points重建）
        if (this.isRebuilding) {
            return;
        }
        
        // Call addToLogWithSets with default parameters
        // 使用默认参数调用addToLogWithSets
        this.addToLogWithSets(player, action, shotType, game, null, null, pointInfo);
    }
}
