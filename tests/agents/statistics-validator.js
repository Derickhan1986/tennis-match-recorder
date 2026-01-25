//
// Statistics Validator Agent
// 统计验证器Agent
//
// Independently calculates statistics from point sequence
// 从point序列独立计算统计
//

class StatisticsValidator {
    constructor() {
        // Shot types for categorization
        // 用于分类的击球类型
        this.shotTypes = [
            'Forehand Ground Stroke',
            'Backhand Ground Stroke',
            'Forehand Slice',
            'Backhand Slice',
            'Forehand Volley',
            'Backhand Volley',
            'Lob',
            'Overhead',
            'Approach Shot',
            'Drop Shot'
        ];
    }

    // Calculate statistics from point sequence
    // 从point序列计算统计
    calculateStatistics(pointSequence) {
        // Initialize stats structure
        // 初始化统计结构
        const stats = {
            player1: this.createEmptyStats(),
            player2: this.createEmptyStats()
        };

        // Process each point
        // 处理每个point
        for (const point of pointSequence) {
            if (!point) continue;

            const winner = point.winner;
            const server = point.server;
            const receiver = server === 'player1' ? 'player2' : 'player1';
            const pointType = point.pointType;
            const shotType = point.shotType;
            const serveNumber = point.serveNumber || 1;

            // Handle Serve Fault (first serve fault - no winner yet)
            // 处理Serve Fault（一发失误 - 还没有winner）
            // Note: We still need to count serve stats, but skip winner/points processing
            // 注意：我们仍然需要统计发球数据，但跳过winner/得分处理
            const isFirstServeFault = pointType === 'Serve Fault' && serveNumber === 1;

            // For completed points (with winner), count points won
            // 对于已完成的points（有winner），统计得分
            // Skip for first serve fault (already handled above)
            // 跳过一发失误（已在上面处理）
            if (winner && !isFirstServeFault) {
                // Count points won (based on winner)
                // 统计得分（基于winner）
                stats[winner].pointsWon++;

                // Count points won on serve vs return
                // 统计发球得分和接发球得分
                // Match program statistics logic: require both winner and server
                // 匹配程序统计逻辑：需要winner和server都存在
                if (server) {
                    if (server === winner) {
                        stats[winner].pointsWonOnServe++;
                    } else {
                        stats[winner].pointsWonOnReturn++;
                    }
                }
            }

            // Count point types
            // 统计得分类型
            if (pointType === 'ACE') {
                stats[server].aces++;
            } else if (pointType === 'Double Fault') {
                stats[server].doubleFaults++;
                stats[server].pointsLost++;
            } else if (pointType === 'Winner') {
                if (winner) {
                    stats[winner].winners++;
                }
            } else if (pointType === 'Unforced Error') {
                // The player who made the error loses the point
                // 失误的玩家失分
                if (winner) {
                    const errorMaker = winner === 'player1' ? 'player2' : 'player1';
                    stats[errorMaker].unforcedErrors++;
                    stats[errorMaker].pointsLost++;
                }
            } else if (pointType === 'Forced Error') {
                // The player who made the error loses the point
                // 失误的玩家失分
                if (winner) {
                    const errorMaker = winner === 'player1' ? 'player2' : 'player1';
                    stats[errorMaker].forcedErrors++;
                    stats[errorMaker].pointsLost++;
                }
            } else if (pointType === 'Return Error') {
                // The receiver made the error, server wins
                // 接发球方失误，发球方得分
                stats[receiver].returnErrors++;
                stats[receiver].pointsLost++;
            }

            // Count shot types
            // 统计击球类型
            // Shot types are counted for the player who performed the action, not necessarily the winner
            // 击球类型统计到执行动作的玩家，不一定是winner
            if (shotType) {
                let actionPlayer = null;
                
                if (pointType === 'ACE' || pointType === 'Winner') {
                    // ACE and Winner: action player is the winner
                    // ACE和Winner：执行动作的玩家是winner
                    actionPlayer = winner;
                } else if (pointType === 'Unforced Error' || pointType === 'Forced Error') {
                    // Unforced/Forced Error: action player is the error maker (not the winner)
                    // Unforced/Forced Error：执行动作的玩家是失误方（不是winner）
                    actionPlayer = winner === 'player1' ? 'player2' : 'player1';
                } else if (pointType === 'Return Error') {
                    // Return Error: action player is the receiver (who made the error)
                    // Return Error：执行动作的玩家是接发球方（犯错的）
                    actionPlayer = receiver;
                } else if (pointType === 'Double Fault') {
                    // Double Fault: action player is the server (who made the fault)
                    // Double Fault：执行动作的玩家是发球方（犯错的）
                    actionPlayer = server;
                }
                
                // Count shot type for the action player
                // 统计执行动作的玩家的击球类型
                if (actionPlayer && stats[actionPlayer] && stats[actionPlayer].shotTypes.hasOwnProperty(shotType)) {
                    stats[actionPlayer].shotTypes[shotType]++;
                }
            }

            // Count serve statistics
            // 统计发球数据
            this.countServeStats(stats, point, server, serveNumber);

            // Count return statistics
            // 统计接发球数据
            this.countReturnStats(stats, point, server, receiver, serveNumber);

            // Count break point statistics
            // 统计破发点数据
            if (point.isBreakPoint && winner) {
                stats[receiver].breakPointsOpportunities++;
                if (winner === receiver) {
                    stats[receiver].breakPointsConverted++;
                }
            }
        }

        // Calculate percentages
        // 计算百分比
        this.calculatePercentages(stats);

        return stats;
    }

    // Count serve statistics
    // 统计发球数据
    countServeStats(stats, point, server, serveNumber) {
        // Skip if server is not set (matches program statistics logic)
        // 如果server未设置则跳过（匹配程序统计逻辑）
        if (!server) {
            return;
        }
        
        const serverStats = stats[server];
        if (!serverStats) {
            return;
        }
        
        const pointType = point.pointType;
        const winner = point.winner;

        if (serveNumber === 1) {
            // First serve
            // 一发
            serverStats.firstServes++;

            if (pointType === 'Serve Fault') {
                serverStats.firstServeFaults++;
                // Don't count as total serve yet (wait for second serve)
                // 还不计入总发球数（等待二发）
                return;
            } else {
                // First serve went in
                // 一发成功
                serverStats.totalServes++;
                serverStats.firstServesIn++;

                // Check if point was won on first serve
                // 检查是否在一发上得分
                if (winner === server) {
                    serverStats.firstServePointsWon++;
                }
            }
        } else if (serveNumber === 2) {
            // Second serve
            // 二发
            serverStats.totalServes++;
            serverStats.secondServes++;

            if (pointType === 'Double Fault') {
                serverStats.secondServeFaults++;
            } else {
                // Second serve went in
                // 二发成功
                serverStats.secondServesIn++;

                // Check if point was won on second serve
                // 检查是否在二发上得分
                if (winner === server) {
                    serverStats.secondServePointsWon++;
                }
            }
        }
    }

    // Count return statistics
    // 统计接发球数据
    countReturnStats(stats, point, server, receiver, serveNumber) {
        const receiverStats = stats[receiver];
        const pointType = point.pointType;
        const winner = point.winner;

        if (serveNumber === 1) {
            // Opponent's first serve
            // 对手的一发
            if (pointType !== 'Serve Fault' && winner !== null) {
                // First serve went in
                // 一发成功
                receiverStats.returnFirstServesIn++;

                // Check if point was won on return of first serve
                // 检查是否在接一发上得分
                if (winner === receiver) {
                    receiverStats.returnFirstServePointsWon++;
                }
            }
        } else if (serveNumber === 2) {
            // Opponent's second serve
            // 对手的二发
            if (pointType !== 'Double Fault' && winner !== null) {
                // Second serve went in
                // 二发成功
                receiverStats.returnSecondServesIn++;

                // Check if point was won on return of second serve
                // 检查是否在接二发上得分
                if (winner === receiver) {
                    receiverStats.returnSecondServePointsWon++;
                }
            }
        }
    }

    // Calculate percentages
    // 计算百分比
    calculatePercentages(stats) {
        ['player1', 'player2'].forEach(playerRole => {
            const playerStats = stats[playerRole];
            const opponentRole = playerRole === 'player1' ? 'player2' : 'player1';
            const opponentStats = stats[opponentRole];

            // First Serve In % = First serves that went in / First serves
            // 一发成功率 = 一发成功数 / 一发总数
            if (playerStats.firstServes > 0) {
                playerStats.firstServePercentage = ((playerStats.firstServes - playerStats.firstServeFaults) / playerStats.firstServes * 100).toFixed(1);
            }

            // First Serve Won % = Points won on first serve / First serves that went in
            // 一发得分率 = 一发得分 / 一发成功数
            if (playerStats.firstServesIn > 0) {
                playerStats.firstServePointsWonPercentage = (playerStats.firstServePointsWon / playerStats.firstServesIn * 100).toFixed(1);
            }

            // Second Serve In % = Second serves that went in / Second serves
            // 二发成功率 = 二发成功数 / 二发总数
            if (playerStats.secondServes > 0) {
                playerStats.secondServeInPercentage = (playerStats.secondServesIn / playerStats.secondServes * 100).toFixed(1);
            }

            // Second Serve Won % = Points won on second serve / Second serves that went in
            // 二发得分率 = 二发得分 / 二发成功数
            if (playerStats.secondServesIn > 0) {
                playerStats.secondServePercentage = (playerStats.secondServePointsWon / playerStats.secondServesIn * 100).toFixed(1);
            }

            // Total Serve Point Win % = Points won on serve / Total serves
            // 总发球得分率 = 发球得分 / 总发球数
            if (playerStats.totalServes > 0) {
                playerStats.totalServePointWinPercentage = (playerStats.pointsWonOnServe / playerStats.totalServes * 100).toFixed(1);
            }

            // Total Return Point Win % = Points won on return / Opponent's total serves
            // 总接发球得分率 = 接发球得分 / 对手的总发球数
            if (opponentStats && opponentStats.totalServes > 0) {
                playerStats.totalReturnPointWinPercentage = (playerStats.pointsWonOnReturn / opponentStats.totalServes * 100).toFixed(1);
            }

            // Return First Serve Won % = Points won on return of first serve / Opponent's first serves that went in
            // 接一发得分率 = 接一发得分 / 对手一发成功数
            if (playerStats.returnFirstServesIn > 0) {
                playerStats.returnFirstServePointsWonPercentage = (playerStats.returnFirstServePointsWon / playerStats.returnFirstServesIn * 100).toFixed(1);
            }

            // Return Second Serve Won % = Points won on return of second serve / Opponent's second serves that went in
            // 接二发得分率 = 接二发得分 / 对手二发成功数
            if (playerStats.returnSecondServesIn > 0) {
                playerStats.returnSecondServePointsWonPercentage = (playerStats.returnSecondServePointsWon / playerStats.returnSecondServesIn * 100).toFixed(1);
            }

            // Break Points Converted % = Break points converted / Break point opportunities
            // 破发点转换率 = 转换的破发点 / 破发点机会
            if (playerStats.breakPointsOpportunities > 0) {
                playerStats.breakPointsConvertedPercentage = (playerStats.breakPointsConverted / playerStats.breakPointsOpportunities * 100).toFixed(1);
            }

            // Serve Success Rate (legacy, not used in main stats)
            // 发球成功率（遗留，不在主统计中使用）
            if (playerStats.totalServes > 0) {
                const successfulServes = playerStats.totalServes - playerStats.firstServeFaults - playerStats.secondServeFaults;
                playerStats.serveSuccessRate = (successfulServes / playerStats.totalServes * 100).toFixed(1);
            }

            // Total points
            // 总得分
            playerStats.totalPoints = playerStats.pointsWon + playerStats.pointsLost;
        });
    }

    // Create empty stats structure (matching createEmptyPlayerStats)
    // 创建空统计结构（匹配createEmptyPlayerStats）
    createEmptyStats() {
        // Use window.createEmptyPlayerStats if available, otherwise create manually
        // 如果可用则使用window.createEmptyPlayerStats，否则手动创建
        if (typeof window !== 'undefined' && window.createEmptyPlayerStats) {
            return window.createEmptyPlayerStats();
        }

        // Manual creation (fallback)
        // 手动创建（后备）
        return {
            pointsWon: 0,
            pointsLost: 0,
            totalPoints: 0,
            pointsWonOnServe: 0,
            pointsWonOnReturn: 0,
            
            // Serve statistics
            // 发球统计
            totalServes: 0,
            firstServes: 0,
            firstServeFaults: 0,
            firstServesIn: 0,
            firstServePointsWon: 0,
            secondServes: 0,
            secondServeFaults: 0,
            secondServesIn: 0,
            secondServePointsWon: 0,
            firstServePercentage: '0.0',
            firstServePointsWonPercentage: '0.0',
            secondServeInPercentage: '0.0',
            secondServePercentage: '0.0',
            totalServePointWinPercentage: '0.0',
            serveSuccessRate: '0.0',
            
            // Return statistics
            // 接发球统计
            returnFirstServesIn: 0,
            returnFirstServePointsWon: 0,
            returnFirstServePointsWonPercentage: '0.0',
            returnSecondServesIn: 0,
            returnSecondServePointsWon: 0,
            returnSecondServePointsWonPercentage: '0.0',
            totalReturnPointWinPercentage: '0.0',
            
            // Point type statistics
            // 得分类型统计
            aces: 0,
            doubleFaults: 0,
            winners: 0,
            unforcedErrors: 0,
            forcedErrors: 0,
            returnErrors: 0,
            
            // Break point statistics
            // 破发点统计
            breakPointsConverted: 0,
            breakPointsOpportunities: 0,
            breakPointsConvertedPercentage: '0.0',
            
            // Shot type statistics
            // 击球类型统计
            shotTypes: {
                'Forehand Ground Stroke': 0,
                'Backhand Ground Stroke': 0,
                'Forehand Slice': 0,
                'Backhand Slice': 0,
                'Forehand Volley': 0,
                'Backhand Volley': 0,
                'Lob': 0,
                'Overhead': 0,
                'Approach Shot': 0,
                'Drop Shot': 0
            }
        };
    }
}

// Export for use in other modules
// 导出供其他模块使用
if (typeof module !== 'undefined' && module.exports) {
    module.exports = StatisticsValidator;
}

