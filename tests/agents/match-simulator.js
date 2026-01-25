//
// Match Simulator Agent
// 比赛模拟器Agent
//
// Generates virtual matches using the real MatchEngine
// 使用真实的MatchEngine生成虚拟比赛
//

class MatchSimulator {
    constructor() {
        // Point generation probabilities (can be customized)
        // Point生成概率（可自定义）
        this.probabilities = {
            // Serve probabilities
            // 发球概率
            firstServeIn: 0.65,        // 65% first serve goes in
            // 65%一发成功
            aceOnFirstServe: 0.05,     // 5% ace on first serve
            // 5%一发ACE
            doubleFault: 0.03,         // 3% double fault
            // 3%双误
            
            // Point outcome probabilities (when point is in play)
            // Point结果概率（当point进入比赛时）
            winner: 0.15,              // 15% winner
            // 15%制胜分
            unforcedError: 0.20,       // 20% unforced error
            // 20%非受迫性失误
            forcedError: 0.10,         // 10% forced error
            // 10%受迫性失误
            returnError: 0.10,         // 10% return error
            // 10%回球失误
            
            // Shot type probabilities (when winner/unforcedError/forcedError)
            // 击球类型概率（当winner/unforcedError/forcedError时）
            shotTypes: {
                'Forehand Ground Stroke': 0.30,
                'Backhand Ground Stroke': 0.25,
                'Forehand Slice': 0.05,
                'Backhand Slice': 0.05,
                'Forehand Volley': 0.08,
                'Backhand Volley': 0.07,
                'Lob': 0.05,
                'Overhead': 0.05,
                'Approach Shot': 0.05,
                'Drop Shot': 0.05
            }
        };
    }

    // Generate a complete match
    // 生成完整比赛
    async generateMatch(settings, pointTracker = null) {
        // Create match object
        // 创建比赛对象
        const match = createMatch({
            player1Id: settings.player1Id || 'test-player-1',
            player2Id: settings.player2Id || 'test-player-2',
            settings: settings,
            status: 'in-progress',
            startTime: new Date().toISOString(),
            log: []
        });

        // Initialize MatchEngine
        // 初始化MatchEngine
        const engine = new MatchEngine(match);

        // Track points for debugging
        // 追踪points用于调试
        const trackedPoints = [];

        // Simulate match until completion
        // 模拟比赛直到完成
        let maxPoints = 10000; // Safety limit
        // 安全限制
        let pointCount = 0;

        while (match.status === 'in-progress' && pointCount < maxPoints) {
            const point = this.generateNextPoint(match, engine);
            
            if (!point) {
                break; // Match completed
                // 比赛完成
            }

            // Record point using MatchEngine
            // 使用MatchEngine记录point
            try {
                engine.recordPoint(
                    point.winner,
                    point.pointType,
                    point.shotType
                );

                // Track point details
                // 追踪point详情
                const lastLogEntry = match.log[match.log.length - 1];
                if (lastLogEntry) {
                    // Use pointType from log entry, fallback to action, then to original point
                    // 使用日志条目中的pointType，如果没有则使用action，最后使用原始point
                    const pointType = lastLogEntry.pointType || lastLogEntry.action || point.pointType;
                    
                    // Determine server based on action type
                    // 根据action类型确定server
                    // IMPORTANT: Program statistics use entry.server for all serve statistics
                    // 重要：程序统计对所有发球统计使用entry.server
                    // For Double Fault, entry.server should be the server who made the fault
                    // 对于Double Fault，entry.server应该是犯错的发球方
                    // entry.player is also the server for Double Fault, but we should use entry.server to match program statistics
                    // entry.player对于Double Fault也是server，但我们应该使用entry.server以匹配程序统计
                    let server = null;
                    if (lastLogEntry.action === 'Return Error') {
                        // Return Error: server is the opponent of the player (receiver made the error)
                        // Return Error：server是player的对手（接发球方犯错）
                        // entry.server should be the server (opponent of player)
                        // entry.server应该是server（player的对手）
                        server = lastLogEntry.server;
                        if (!server) {
                            // Fallback: infer from player
                            // 后备方案：从player推断
                            server = lastLogEntry.player === 'player1' ? 'player2' : 'player1';
                        }
                    } else {
                        // For all other cases (including Double Fault), use entry.server
                        // 对于所有其他情况（包括Double Fault），使用entry.server
                        // This matches program statistics which uses entry.server for serve statistics
                        // 这与程序统计一致，程序统计使用entry.server来统计发球数据
                        server = lastLogEntry.server;
                        if (!server) {
                            // If entry.server is missing, try to infer from action type
                            // 如果entry.server缺失，尝试从action类型推断
                            if (lastLogEntry.action === 'Double Fault') {
                                // Double Fault: player is the server who made the fault
                                // Double Fault：player是犯错的发球方
                                server = lastLogEntry.player;
                            } else {
                                // For other cases, try currentServer
                                // 对于其他情况，尝试currentServer
                                server = lastLogEntry.currentServer || match.currentServer;
                            }
                        }
                    }
                    
                    // Ensure server is set for points with winner (required for pointsWonOnServe/Return stats)
                    // 确保有winner的points都有server（pointsWonOnServe/Return统计需要）
                    if (lastLogEntry.winner && !server) {
                        // If server is still missing for a point with winner, this is an error
                        // 如果对于有winner的point仍然缺少server，这是一个错误
                        console.warn('Missing server for point with winner:', lastLogEntry);
                        // Try to infer from winner and point context
                        // 尝试从winner和point上下文推断
                        server = match.currentServer;
                    }
                    
                    // Determine serveNumber
                    // 确定serveNumber
                    let serveNumber = lastLogEntry.serveNumber;
                    if (serveNumber === null || serveNumber === undefined) {
                        // For Double Fault, serveNumber should be 2
                        // 对于Double Fault，serveNumber应该是2
                        if (lastLogEntry.action === 'Double Fault' || pointType === 'Double Fault') {
                            serveNumber = 2;
                        } else if (lastLogEntry.action === 'Serve Fault' || pointType === 'Serve Fault') {
                            // For first serve fault, serveNumber should be 1
                            // 对于一发失误，serveNumber应该是1
                            serveNumber = 1;
                        } else {
                            // For other cases, use match.currentServeNumber
                            // 对于其他情况，使用match.currentServeNumber
                            serveNumber = match.currentServeNumber || 1;
                        }
                    }
                    
                    const trackedPoint = {
                        pointNumber: lastLogEntry.pointNumber || pointCount + 1,
                        timestamp: lastLogEntry.timestamp,
                        winner: lastLogEntry.winner,
                        pointType: pointType,
                        shotType: lastLogEntry.shotType || point.shotType,
                        server: server,
                        serveNumber: serveNumber,
                        gameScore: lastLogEntry.gameScore,
                        gamesScore: lastLogEntry.gamesScore,
                        setsScore: lastLogEntry.setsScore,
                        currentServer: lastLogEntry.currentServer,
                        currentServeNumber: lastLogEntry.currentServeNumber,
                        isBreakPoint: lastLogEntry.isBreakPoint || false,
                        gameNumber: this.getCurrentGameNumber(match),
                        setNumber: match.sets.length,
                        isTieBreak: this.isInTieBreak(match),
                        tieBreakScore: this.getTieBreakScore(match)
                    };

                    trackedPoints.push(trackedPoint);

                    // Also track in PointTracker if provided
                    // 如果提供了PointTracker，也在其中追踪
                    if (pointTracker) {
                        pointTracker.recordPoint(trackedPoint);
                    }
                }

                pointCount++;
            } catch (error) {
                console.error('Error recording point:', error);
                console.error('Point data:', point);
                console.error('Match state:', {
                    sets: match.sets.length,
                    currentServer: match.currentServer,
                    status: match.status
                });
                throw error;
            }
        }

        if (pointCount >= maxPoints) {
            console.warn('Match simulation reached max points limit');
            // 比赛模拟达到最大point限制
        }

        // Mark match as completed if not already
        // 如果尚未完成，标记比赛为已完成
        if (match.status === 'in-progress' && match.winner) {
            match.status = 'completed';
            match.endTime = new Date().toISOString();
        }

        return {
            match: match,
            trackedPoints: trackedPoints
        };
    }

    // Generate next point based on current match state
    // 根据当前比赛状态生成下一个point
    generateNextPoint(match, engine) {
        // Check if match is completed
        // 检查比赛是否完成
        if (match.winner || match.status === 'completed') {
            return null;
        }

        const currentSet = this.getCurrentSet(match);
        const isTieBreak = this.isInTieBreak(match, currentSet);
        const server = match.currentServer;
        const receiver = server === 'player1' ? 'player2' : 'player1';
        const serveNumber = match.currentServeNumber || 1;

        // Determine point outcome
        // 确定point结果
        let winner = null;
        let pointType = null;
        let shotType = null;

        // Check for serve fault
        // 检查发球失误
        if (serveNumber === 1) {
            // First serve
            // 一发
            if (Math.random() > this.probabilities.firstServeIn) {
                // First serve fault
                // 一发失误
                return {
                    winner: null,
                    pointType: 'Serve Fault',
                    shotType: null
                };
            }

            // First serve in - check for ace
            // 一发成功 - 检查ACE
            if (Math.random() < this.probabilities.aceOnFirstServe) {
                return {
                    winner: server,
                    pointType: 'ACE',
                    shotType: null
                };
            }
        } else {
            // Second serve
            // 二发
            if (Math.random() < this.probabilities.doubleFault) {
                // Double fault
                // 双误
                return {
                    winner: receiver,
                    pointType: 'Double Fault',
                    shotType: null
                };
            }
        }

        // Point is in play - determine outcome
        // Point进入比赛 - 确定结果
        const rand = Math.random();
        let cumulative = 0;

        // Winner
        cumulative += this.probabilities.winner;
        if (rand < cumulative) {
            winner = Math.random() < 0.5 ? server : receiver;
            pointType = 'Winner';
            shotType = this.selectShotType();
            return { winner, pointType, shotType };
        }

        // Unforced Error
        cumulative += this.probabilities.unforcedError;
        if (rand < cumulative) {
            winner = Math.random() < 0.5 ? server : receiver;
            pointType = 'Unforced Error';
            shotType = this.selectShotType();
            // Winner is the opponent (the one who didn't make the error)
            // Winner是对手（没有失误的一方）
            winner = winner === server ? receiver : server;
            return { winner, pointType, shotType };
        }

        // Forced Error
        cumulative += this.probabilities.forcedError;
        if (rand < cumulative) {
            winner = Math.random() < 0.5 ? server : receiver;
            pointType = 'Forced Error';
            shotType = this.selectShotType();
            // Winner is the opponent (the one who forced the error)
            // Winner是对手（迫使失误的一方）
            winner = winner === server ? receiver : server;
            return { winner, pointType, shotType };
        }

        // Return Error
        cumulative += this.probabilities.returnError;
        if (rand < cumulative) {
            // Return error - server wins
            // 回球失误 - 发球方得分
            pointType = 'Return Error';
            shotType = null;
            return {
                winner: server,
                pointType,
                shotType
            };
        }

        // Default: server wins (simplified - in reality would be more complex)
        // 默认：发球方得分（简化 - 实际上会更复杂）
        return {
            winner: server,
            pointType: 'Winner',
            shotType: this.selectShotType()
        };
    }

    // Select shot type based on probabilities
    // 根据概率选择击球类型
    selectShotType() {
        const rand = Math.random();
        let cumulative = 0;

        for (const [shotType, probability] of Object.entries(this.probabilities.shotTypes)) {
            cumulative += probability;
            if (rand < cumulative) {
                return shotType;
            }
        }

        // Default to most common
        // 默认为最常见的
        return 'Forehand Ground Stroke';
    }

    // Get current set
    // 获取当前set
    getCurrentSet(match) {
        if (!match.sets || match.sets.length === 0) {
            match.sets = [createSet({ setNumber: 1 })];
        }

        const lastSet = match.sets[match.sets.length - 1];
        if (lastSet.winner) {
            // Create new set
            // 创建新set
            const newSet = createSet({
                setNumber: match.sets.length + 1
            });
            match.sets.push(newSet);
            return newSet;
        }

        return lastSet;
    }

    // Check if in tie-break
    // 检查是否在抢七
    isInTieBreak(match, set = null) {
        if (!set) {
            set = this.getCurrentSet(match);
        }
        return set && set.tieBreak && !set.tieBreak.winner;
    }

    // Get current game number
    // 获取当前game数
    getCurrentGameNumber(match) {
        const currentSet = this.getCurrentSet(match);
        if (!currentSet.games || currentSet.games.length === 0) {
            return 1;
        }
        const lastGame = currentSet.games[currentSet.games.length - 1];
        if (lastGame.winner) {
            return currentSet.games.length + 1;
        }
        return currentSet.games.length;
    }

    // Get tie-break score
    // 获取抢七比分
    getTieBreakScore(match) {
        const currentSet = this.getCurrentSet(match);
        if (currentSet.tieBreak) {
            return `${currentSet.tieBreak.player1Points || 0}-${currentSet.tieBreak.player2Points || 0}`;
        }
        return null;
    }

    // Set custom probabilities
    // 设置自定义概率
    setProbabilities(probabilities) {
        this.probabilities = { ...this.probabilities, ...probabilities };
    }
}

// Export for use in other modules
// 导出供其他模块使用
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MatchSimulator;
}

