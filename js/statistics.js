//
//  Statistics Calculation Module
//  统计计算模块
//
//  Handles calculation of player and match statistics
//  处理玩家和比赛统计的计算
//

// Debug: Log immediately when file starts loading (using IIFE to ensure execution)
// 调试：文件开始加载时立即记录（使用立即执行函数确保执行）
(function() {
    'use strict';
    console.log('statistics.js: File starting to load...');
    console.log('statistics.js: window object available:', typeof window !== 'undefined');
})();

// Create empty player statistics structure
// 创建空的玩家统计结构
// Make sure function is in global scope
// 确保函数在全局作用域中
window.createEmptyPlayerStats = function createEmptyPlayerStats() {
    return {
        // Points
        // 得分
        pointsWon: 0,
        pointsLost: 0,
        totalPoints: 0,
        pointsWonOnServe: 0,
        pointsWonOnReturn: 0,
        pointsWonInRow: 0, // Maximum consecutive points won (连续得分最大记录)
        
        // Serve statistics
        // 发球统计
        totalServes: 0,
        firstServes: 0,
        firstServeFaults: 0,
        firstServesIn: 0, // First serves that went in (successful first serves)
        // 一发成功进入比赛的次数
        firstServePointsWon: 0, // Points won on first serve
        // 一发得分次数
        secondServes: 0,
        secondServeFaults: 0,
        secondServesIn: 0, // Second serves that went in (successful second serves)
        // 二发成功进入比赛的次数
        secondServePointsWon: 0, // Points won on second serve
        // 二发得分次数
        firstServePercentage: '0.0', // First serve in % (一发成功率)
        firstServePointsWonPercentage: '0.0', // First serve points won % (一发得分率)
        secondServeInPercentage: '0.0', // Second serve in % (二发成功率)
        secondServePercentage: '0.0', // Second serve points won % (二发得分率)
        totalServePointWinPercentage: '0.0', // Total serve point win % (总发球得分率)
        serveSuccessRate: '0.0',
        
        // Return statistics
        // 接发球统计
        returnFirstServesIn: 0, // Opponent's first serves that went in (when receiving)
        // 对手一发成功进入比赛的次数（接发球时）
        returnFirstServePointsWon: 0, // Points won on return of first serve
        // 接一发得分次数
        returnFirstServePointsWonPercentage: '0.0', // Return first serve points won % (接一发得分率)
        returnSecondServesIn: 0, // Opponent's second serves that went in (when receiving)
        // 对手二发成功进入比赛的次数（接发球时）
        returnSecondServePointsWon: 0, // Points won on return of second serve
        // 接二发得分次数
        returnSecondServePointsWonPercentage: '0.0', // Return second serve points won % (接二发得分率)
        totalReturnPointWinPercentage: '0.0', // Total return point win % (总接发球得分率)
        
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
        breakPointsConverted: 0, // Break points converted when receiving (接发球时转换的破发点)
        breakPointsOpportunities: 0, // Break point opportunities when receiving (接发球时面对的破发点)
        breakPointsConvertedPercentage: '0.0', // Break points converted % (破发点转换率)
        
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
            'Drop Shot': 0,
            'Passing Shot': 0,
            'Return': 0
        }
    };
};

// Calculate overall player statistics from all matches
// 从所有比赛计算玩家总体统计
async function calculatePlayerStats(playerId) {
    try {
        // Get all matches
        // 获取所有比赛
        const allMatches = await storage.getAllMatches();
        
        // Filter matches where player participated (as player1 or player2)
        // 过滤出玩家参与的比赛（作为player1或player2）
        const playerMatches = allMatches.filter(match => 
            match.player1Id === playerId || match.player2Id === playerId
        );
        
        // Only calculate for completed matches
        // 只计算已完成的比赛
        const completedMatches = playerMatches.filter(match => 
            match.status === 'completed'
        );
        
        // Initialize statistics
        // 初始化统计
        const stats = {
            // Match record
            // 比赛记录
            totalMatches: completedMatches.length,
            wins: 0,
            losses: 0,
            winRate: 0,
            
            // Points statistics
            // 得分统计
            totalPointsWon: 0,
            totalPointsLost: 0,
            totalPoints: 0,
            
            // Serve statistics
            // 发球统计
            totalServes: 0,
            firstServes: 0,
            firstServeFaults: 0,
            firstServesIn: 0, // First serves that went in (successful first serves)
            // 一发成功进入比赛的次数
            firstServePointsWon: 0, // Points won on first serve
            // 一发得分次数
            secondServes: 0,
            secondServeFaults: 0,
            secondServesIn: 0, // Second serves that went in (successful second serves)
            // 二发成功进入比赛的次数
            secondServePointsWon: 0, // Points won on second serve
            // 二发得分次数
            aces: 0,
            doubleFaults: 0,
            firstServePercentage: 0, // First serve in % (一发成功率)
            firstServePointsWonPercentage: 0, // First serve points won % (一发得分率)
            secondServeInPercentage: 0, // Second serve in % (二发成功率)
            secondServePercentage: 0, // Second serve points won % (二发得分率)
            totalServePointWinPercentage: 0, // Total serve point win % (总发球得分率)
            serveSuccessRate: 0,
            
            // Return statistics
            // 接发球统计
            returnFirstServesIn: 0, // Opponent's first serves that went in (when receiving)
            // 对手一发成功进入比赛的次数（接发球时）
            returnFirstServePointsWon: 0, // Points won on return of first serve
            // 接一发得分次数
            returnFirstServePointsWonPercentage: 0, // Return first serve points won % (接一发得分率)
            returnSecondServesIn: 0, // Opponent's second serves that went in (when receiving)
            // 对手二发成功进入比赛的次数（接发球时）
            returnSecondServePointsWon: 0, // Points won on return of second serve
            // 接二发得分次数
            returnSecondServePointsWonPercentage: 0, // Return second serve points won % (接二发得分率)
            
            // Point type statistics
            // 得分类型统计
            winners: 0,
            unforcedErrors: 0,
            forcedErrors: 0,
            returnErrors: 0,
            
            // Break point statistics
            // 破发点统计
            breakPointsConverted: 0, // Break points converted when receiving (接发球时转换的破发点)
            breakPointsOpportunities: 0, // Break point opportunities when receiving (接发球时面对的破发点)
            breakPointsConvertedPercentage: '0.0', // Break points converted % (破发点转换率)
            
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
                'Drop Shot': 0,
                'Passing Shot': 0,
                'Return': 0
            },
            
            // Statistics by court type
            // 按场地类型统计
            byCourtType: {
                'Grass': { matches: 0, wins: 0 },
                'Clay': { matches: 0, wins: 0 },
                'Hard': { matches: 0, wins: 0 },
                'Carpet': { matches: 0, wins: 0 }
            },
            
            // Statistics by opponent
            // 按对手统计
            byOpponent: {}
        };
        
        // Process each match
        // 处理每场比赛
        for (const match of completedMatches) {
            // Determine player role (player1 or player2)
            // 确定玩家角色（player1或player2）
            const isPlayer1 = match.player1Id === playerId;
            const playerRole = isPlayer1 ? 'player1' : 'player2';
            const opponentRole = isPlayer1 ? 'player2' : 'player1';
            
            // Get opponent ID
            // 获取对手ID
            const opponentId = isPlayer1 ? match.player2Id : match.player1Id;
            
            // Check if player won
            // 检查玩家是否获胜
            const playerWon = match.winner === playerRole;
            if (playerWon) {
                stats.wins++;
            } else {
                stats.losses++;
            }
            
            // Update court type statistics
            // 更新场地类型统计
            const courtType = match.settings.courtType;
            if (stats.byCourtType[courtType]) {
                stats.byCourtType[courtType].matches++;
                if (playerWon) {
                    stats.byCourtType[courtType].wins++;
                }
            }
            
            // Initialize opponent statistics if not exists
            // 如果不存在则初始化对手统计
            if (!stats.byOpponent[opponentId]) {
                stats.byOpponent[opponentId] = {
                    matches: 0,
                    wins: 0,
                    losses: 0
                };
            }
            stats.byOpponent[opponentId].matches++;
            if (playerWon) {
                stats.byOpponent[opponentId].wins++;
            } else {
                stats.byOpponent[opponentId].losses++;
            }
            
            // Process match log
            // 处理比赛日志
            if (match.log && match.log.length > 0) {
                for (const entry of match.log) {
                    // Check if this entry is for the player
                    // 检查此条目是否属于该玩家
                    if (entry.player === playerRole) {
                        // Count point types
                        // 统计得分类型
                        if (entry.action === 'ACE') {
                            stats.aces++;
                            stats.totalPointsWon++;
                        } else if (entry.action === 'Double Fault') {
                            stats.doubleFaults++;
                            stats.totalPointsLost++;
                        } else if (entry.action === 'Winner') {
                            stats.winners++;
                            stats.totalPointsWon++;
                        } else if (entry.action === 'Unforced Error') {
                            stats.unforcedErrors++;
                            stats.totalPointsLost++;
                        } else if (entry.action === 'Forced Error') {
                            stats.forcedErrors++;
                            stats.totalPointsLost++;
                        } else if (entry.action === 'Return Error') {
                            stats.returnErrors++;
                            stats.totalPointsLost++;
                        }
                        
                        // Count shot types
                        // 统计击球类型
                        if (entry.shotType && stats.shotTypes.hasOwnProperty(entry.shotType)) {
                            stats.shotTypes[entry.shotType]++;
                        }
                    } else if (entry.player === opponentRole) {
                        // Count points lost (opponent's winners/aces)
                        // 统计失分（对手的winner/ace）
                        if (entry.action === 'ACE' || entry.action === 'Winner') {
                            stats.totalPointsLost++;
                        } else if (entry.action === 'Unforced Error' || entry.action === 'Forced Error' || entry.action === 'Return Error') {
                            stats.totalPointsWon++;
                        }
                    }
                    
                }
            }
        }
        
        // Count serve statistics separately (based on server, not player)
        // 单独统计发球数据（基于发球方，而不是玩家）
        // This ensures return errors are counted for the server's serve statistics
        // 这确保 return error 被计入发球方的发球统计
        for (const match of completedMatches) {
            const isPlayer1 = match.player1Id === playerId;
            const playerRole = isPlayer1 ? 'player1' : 'player2';
            
            if (match.log && match.log.length > 0) {
                for (const entry of match.log) {
                    // Only count serves where this player was the server
                    // 只统计该玩家作为发球方的发球
                    if (entry.server === playerRole) {
                        // Count total serves: only when point is completed (not first serve fault)
                        // 统计总发球数：只有当point完成时（不是一发失误）
                        // One serve opportunity = first serve success OR second serve (success or double fault)
                        // 一次发球机会 = 一发成功 OR 二发（成功或双误）
                        if (entry.serveNumber === 1) {
                            stats.firstServes++;
                            if (entry.action === 'Serve Fault') {
                                stats.firstServeFaults++;
                                // First serve fault - don't count as total serve yet (wait for second serve)
                                // 一发失误 - 还不计入总发球数（等待二发）
                                continue;
                            } else {
                                // First serve went in (successful) - this is one serve opportunity
                                // 一发成功进入比赛 - 这是一次发球机会
                                stats.totalServes++;
                                stats.firstServesIn++;
                                // Check if point was won on this first serve
                                // 检查是否在一发上得分
                                if (entry.winner === playerRole) {
                                    stats.firstServePointsWon++;
                                }
                            }
                        } else if (entry.serveNumber === 2) {
                            // Second serve - this is one serve opportunity (first serve was fault)
                            // 二发 - 这是一次发球机会（一发已失误）
                            stats.totalServes++;
                            stats.secondServes++;
                            // Second serve fault is always recorded as Double Fault
                            // 二发失误总是记录为 Double Fault
                            if (entry.action === 'Double Fault') {
                                stats.secondServeFaults++;
                            } else {
                                // Second serve went in (successful)
                                // 二发成功进入比赛（包括 return error 的情况）
                                stats.secondServesIn++;
                                // Check if point was won on this second serve
                                // 检查是否在二发上得分
                                if (entry.winner === playerRole) {
                                    stats.secondServePointsWon++;
                                }
                            }
                        }
                    }
                }
            }
        }
        
        // Count return statistics (when player is receiving)
        // 统计接发球数据（当玩家接发球时）
        for (const match of completedMatches) {
            const isPlayer1 = match.player1Id === playerId;
            const playerRole = isPlayer1 ? 'player1' : 'player2';
            const opponentRole = isPlayer1 ? 'player2' : 'player1';
            
            if (match.log && match.log.length > 0) {
                for (const entry of match.log) {
                    // Count return statistics when opponent is serving
                    // 统计对手发球时的接发球数据
                    if (entry.server === opponentRole) {
                        const serveNum = Number(entry.serveNumber);
                        if (serveNum === 1) {
                            // Opponent's first serve
                            // 对手的一发
                            if (entry.action !== 'Serve Fault' && entry.winner !== null) {
                                // Opponent's first serve went in (and point was completed)
                                // 对手一发成功进入比赛（且point已完成）
                                stats.returnFirstServesIn++;
                                // Check if point was won on return of first serve
                                // 检查是否在接一发上得分
                                if (entry.winner === playerRole) {
                                    stats.returnFirstServePointsWon++;
                                }
                            }
                        } else if (serveNum === 2) {
                            // Opponent's second serve
                            // 对手的二发
                            // Check if second serve went in (not a double fault) and point was completed
                            // 检查二发是否成功进入比赛（不是双误）且point已完成
                            if (entry.action !== 'Double Fault' && entry.winner !== null) {
                                // Opponent's second serve went in (and point was completed)
                                // 对手二发成功进入比赛（且point已完成）
                                stats.returnSecondServesIn++;
                                // Check if point was won on return of second serve
                                // 检查是否在接二发上得分
                                if (entry.winner === playerRole) {
                                    stats.returnSecondServePointsWon++;
                                }
                            }
                        }
                    }
                    
                }
            }
        }
        
        // Count points won on serve vs return separately (based on winner and server, not player)
        // 单独统计发球得分和接发球得分（基于winner和server，而不是player）
        // This ensures points won on serve include all cases where server wins the point
        // (including when receiver makes errors: Return Error, Forced Error, Unforced Error)
        // 这确保发球得分包括所有发球方得分的情况
        // （包括接发球方失误的情况：Return Error, Forced Error, Unforced Error）
        for (const match of completedMatches) {
            const isPlayer1 = match.player1Id === playerId;
            const playerRole = isPlayer1 ? 'player1' : 'player2';
            
            if (match.log && match.log.length > 0) {
                for (const entry of match.log) {
                    if (!entry.winner || !entry.server) continue;
                    
                    const winnerRole = entry.winner;
                    const serverRole = entry.server;
                    
                    // Only count points for this player
                    // 只统计该玩家的得分
                    if (winnerRole === playerRole) {
                        if (serverRole === playerRole) {
                            // Player won the point on serve (including when receiver makes errors)
                            // 玩家在发球时得分（包括接发球方失误的情况）
                            stats.pointsWonOnServe++;
                        } else {
                            // Player won the point on return
                            // 玩家在接发球时得分
                            stats.pointsWonOnReturn++;
                        }
                    }
                }
            }
        }
        
        // Count break point statistics separately (based on server and winner, not player)
        // 单独统计破发点数据（基于server和winner，而不是player）
        // This ensures break points are counted correctly even when server makes errors
        // 这确保即使发球方犯错误时，破发点也能被正确统计
        for (const match of completedMatches) {
            const isPlayer1 = match.player1Id === playerId;
            const playerRole = isPlayer1 ? 'player1' : 'player2';
            const opponentRole = isPlayer1 ? 'player2' : 'player1';
            
            if (match.log && match.log.length > 0) {
                for (const entry of match.log) {
                    // Check if this is a break point and opponent was serving
                    // 检查这是否是破发点且对手在发球
                    if (entry.isBreakPoint && entry.server === opponentRole && entry.winner) {
                        // Player is receiving, has break point opportunity
                        // 玩家接发球，有破发点机会
                        stats.breakPointsOpportunities++;
                        // Check if player converted the break point (won the point)
                        // 检查玩家是否转换了破发点（赢得了这一分）
                        if (entry.winner === playerRole && entry.winner !== null) {
                            stats.breakPointsConverted++;
                        }
                    }
                }
            }
        }
        
        // Calculate percentages
        // 计算百分比
        if (stats.totalMatches > 0) {
            stats.winRate = (stats.wins / stats.totalMatches * 100).toFixed(1);
        }
        
        stats.totalPoints = stats.totalPointsWon + stats.totalPointsLost;
        
        // First Serve In % = First serves that went in / First serves
        // 一发成功率 = 一发成功数 / 一发总数
        if (stats.firstServes > 0) {
            stats.firstServePercentage = ((stats.firstServes - stats.firstServeFaults) / stats.firstServes * 100).toFixed(1);
        }
        
        // First Serve Won % = Points won on first serve / First serves that went in
        // 一发得分率 = 一发得分 / 一发成功数
        if (stats.firstServesIn > 0) {
            stats.firstServePointsWonPercentage = (stats.firstServePointsWon / stats.firstServesIn * 100).toFixed(1);
        }
        
        // Second Serve In % = Second serves that went in / Second serves
        // 二发成功率 = 二发成功数 / 二发总数
        if (stats.secondServes > 0) {
            stats.secondServeInPercentage = (stats.secondServesIn / stats.secondServes * 100).toFixed(1);
        }
        
        // Second Serve Won % = Points won on second serve / Second serves that went in
        // 二发得分率 = 二发得分 / 二发成功数
        if (stats.secondServesIn > 0) {
            stats.secondServePercentage = (stats.secondServePointsWon / stats.secondServesIn * 100).toFixed(1);
        }
        
        // Total Serve Point Win % = Points won on serve / Total serves
        // 总发球得分率 = 发球得分 / 总发球数
        if (stats.totalServes > 0) {
            stats.totalServePointWinPercentage = (stats.pointsWonOnServe / stats.totalServes * 100).toFixed(1);
        }
        
        // Calculate total return points using opponent's total serves
        // 使用对手的总发球数计算接发球机会总数
        // Total return opportunities = opponent's total serves
        // 接发球机会总数 = 对手的总发球数
        // We can calculate this by counting opponent's serves, or use the relationship:
        // 我们可以通过统计对手的发球数来计算，或者使用关系式：
        // Total Return Point Win % = 1 - Opponent's Total Serve Point Win %
        // 总接发球得分率 = 1 - 对手的总发球得分率
        // But we need opponent's totalServes, so we still need to count them
        // 但我们需要对手的totalServes，所以仍然需要统计它们
        let opponentTotalServes = 0;
        for (const match of completedMatches) {
            const isPlayer1 = match.player1Id === playerId;
            const opponentRole = isPlayer1 ? 'player2' : 'player1';
            
            if (match.log && match.log.length > 0) {
                for (const entry of match.log) {
                    if (!entry.server || entry.server !== opponentRole) continue;
                    
                    // Count total return opportunities: only when point is completed (not first serve fault)
                    // 统计接发球机会总数：只有当point完成时（不是一发失误）
                    // One return opportunity = opponent's first serve success OR opponent's second serve (success or double fault)
                    // 一次接发球机会 = 对手一发成功 OR 对手二发（成功或双误）
                    const serveNum = Number(entry.serveNumber);
                    if (serveNum === 1) {
                        if (entry.action !== 'Serve Fault') {
                            // Opponent's first serve went in - this is one return opportunity
                            // 对手一发成功进入比赛 - 这是一次接发球机会
                            opponentTotalServes++;
                        }
                        // First serve fault - don't count as return opportunity yet (wait for second serve)
                        // 一发失误 - 还不计入接发球机会（等待二发）
                    } else if (serveNum === 2) {
                        // Opponent's second serve - this is one return opportunity (first serve was fault)
                        // 对手二发 - 这是一次接发球机会（一发已失误）
                        opponentTotalServes++;
                    }
                }
            }
        }
        
        // Total Return Point Win % = Points won on return / Total return opportunities
        // 总接发球得分率 = 接发球得分 / 接发球机会总数
        // Alternative calculation: 1 - (Opponent's points won on serve / Opponent's total serves)
        // 替代计算：1 - (对手发球得分 / 对手总发球数)
        // But we already have pointsWonOnReturn, so we can use it directly
        // 但我们已经有了pointsWonOnReturn，所以可以直接使用
        if (opponentTotalServes > 0) {
            stats.totalReturnPointWinPercentage = (stats.pointsWonOnReturn / opponentTotalServes * 100).toFixed(1);
        }
        
        // Return First Serve Won % = Points won on return of first serve / Opponent's first serves that went in
        // 接一发得分率 = 接一发得分 / 对手一发成功数
        if (stats.returnFirstServesIn > 0) {
            stats.returnFirstServePointsWonPercentage = (stats.returnFirstServePointsWon / stats.returnFirstServesIn * 100).toFixed(1);
        }
        
        // Return Second Serve Won % = Points won on return of second serve / Opponent's second serves that went in
        // 接二发得分率 = 接二发得分 / 对手二发成功数
        if (stats.returnSecondServesIn > 0) {
            stats.returnSecondServePointsWonPercentage = (stats.returnSecondServePointsWon / stats.returnSecondServesIn * 100).toFixed(1);
        }
        
        // Break Points Converted % = Break points converted / Break point opportunities
        // 破发点转换率 = 转换的破发点 / 破发点机会
        if (stats.breakPointsOpportunities > 0) {
            stats.breakPointsConvertedPercentage = (stats.breakPointsConverted / stats.breakPointsOpportunities * 100).toFixed(1);
        }
        
        if (stats.totalServes > 0) {
            const successfulServes = stats.totalServes - stats.firstServeFaults - stats.secondServeFaults;
            stats.serveSuccessRate = (successfulServes / stats.totalServes * 100).toFixed(1);
        }
        
        return stats;
    } catch (error) {
        console.error('Error calculating player statistics:', error);
        throw error;
    }
}

// Calculate match-specific technical statistics
// 计算比赛特定的技术统计
// Make sure function is in global scope
// 确保函数在全局作用域中
window.calculateMatchStats = function calculateMatchStats(match) {
    // Use window.createEmptyPlayerStats to ensure it's accessible
    // 使用 window.createEmptyPlayerStats 确保可以访问
    const createStats = window.createEmptyPlayerStats || createEmptyPlayerStats;
    
    if (!match || !match.log || match.log.length === 0) {
        return {
            player1: createStats(),
            player2: createStats()
        };
    }
    
    const stats = {
        player1: createStats(),
        player2: createStats()
    };
    
    // Process each log entry
    // 处理每个日志条目
    for (const entry of match.log) {
        // Skip entries without player information
        // 跳过没有玩家信息的条目
        if (!entry || !entry.player) continue;
        
        const playerRole = entry.player;
        const playerStats = stats[playerRole];
        
        if (!playerStats) continue;
        
        // Count point types (but not pointsWon here - it will be counted based on winner)
        // 统计得分类型（但不在这里统计pointsWon - 将基于winner统计）
        if (entry.action === 'ACE') {
            playerStats.aces++;
        } else if (entry.action === 'Double Fault') {
            playerStats.doubleFaults++;
            playerStats.pointsLost++;
        } else if (entry.action === 'Winner') {
            playerStats.winners++;
        } else if (entry.action === 'Unforced Error') {
            playerStats.unforcedErrors++;
            playerStats.pointsLost++;
        } else if (entry.action === 'Forced Error') {
            playerStats.forcedErrors++;
            playerStats.pointsLost++;
        } else if (entry.action === 'Return Error') {
            playerStats.returnErrors++;
            playerStats.pointsLost++;
        }
        
        // Count shot types
        // 统计击球类型
        if (entry.shotType && playerStats.shotTypes.hasOwnProperty(entry.shotType)) {
            playerStats.shotTypes[entry.shotType]++;
        }
        
    }
    
    // Count points won based on winner (not player/action)
    // This ensures points won includes all cases where the player wins the point,
    // including when opponent makes errors (Return Error, Double Fault, Unforced Error, Forced Error)
    // 基于winner统计得分（而不是player/action）
    // 这确保得分包括所有玩家得分的情况，
    // 包括对手失误的情况（Return Error, Double Fault, Unforced Error, Forced Error）
    for (const entry of match.log) {
        if (!entry.winner) continue;
        
        const winnerRole = entry.winner;
        const winnerStats = stats[winnerRole];
        
        if (!winnerStats) continue;
        
        // Count total points won (based on winner, not action)
        // 统计总得分（基于winner，而不是action）
        winnerStats.pointsWon++;
    }
    
    // Count points won on serve vs return separately (based on winner and server, not player)
    // 单独统计发球得分和接发球得分（基于winner和server，而不是player）
    // This ensures points won on serve include all cases where server wins the point
    // (including when receiver makes errors: Return Error, Forced Error, Unforced Error)
    // 这确保发球得分包括所有发球方得分的情况
    // （包括接发球方失误的情况：Return Error, Forced Error, Unforced Error）
    for (const entry of match.log) {
        if (!entry.winner || !entry.server) continue;
        
        const winnerRole = entry.winner;
        const serverRole = entry.server;
        const winnerStats = stats[winnerRole];
        
        if (!winnerStats) continue;
        
        if (serverRole === winnerRole) {
            // Server won the point (including when receiver makes errors)
            // 发球方得分（包括接发球方失误的情况）
            winnerStats.pointsWonOnServe++;
        } else {
            // Receiver won the point
            // 接发球方得分
            winnerStats.pointsWonOnReturn++;
        }
    }
    
    // Count break point statistics separately (based on server and winner, not player)
    // 单独统计破发点数据（基于server和winner，而不是player）
    // This ensures break points are counted correctly even when server makes errors
    // 这确保即使发球方犯错误时，破发点也能被正确统计
    for (const entry of match.log) {
        if (!entry.isBreakPoint || !entry.server || !entry.winner) continue;
        
        // For each player, check if they were receiving during this break point
        // 对于每个玩家，检查他们是否在这个破发点时在接发球
        ['player1', 'player2'].forEach(playerRole => {
            const playerStats = stats[playerRole];
            const opponentRole = playerRole === 'player1' ? 'player2' : 'player1';
            
            // If opponent was serving (player was receiving), this is a break point opportunity
            // 如果对手在发球（玩家在接发球），这是一个破发点机会
            if (entry.server === opponentRole) {
                playerStats.breakPointsOpportunities++;
                // Check if player converted the break point (won the point)
                // 检查玩家是否转换了破发点（赢得了这一分）
                if (entry.winner === playerRole && entry.winner !== null) {
                    playerStats.breakPointsConverted++;
                }
            }
        });
    }
    
    // Count return statistics (when player is receiving)
    // 统计接发球数据（当玩家接发球时）
    for (const entry of match.log) {
        if (!entry.server) continue;
        
        // For each player, count return statistics when opponent is serving
        // 对于每个玩家，统计对手发球时的接发球数据
        ['player1', 'player2'].forEach(playerRole => {
            const playerStats = stats[playerRole];
            const opponentRole = playerRole === 'player1' ? 'player2' : 'player1';
            
            // Count return statistics when opponent is serving
            // 统计对手发球时的接发球数据
            if (entry.server === opponentRole) {
                const serveNum = Number(entry.serveNumber);
                
                if (serveNum === 1) {
                    // Opponent's first serve
                    // 对手的一发
                    if (entry.action !== 'Serve Fault' && entry.winner !== null) {
                        // Opponent's first serve went in (and point was completed)
                        // 对手一发成功进入比赛（且point已完成）
                        playerStats.returnFirstServesIn++;
                        // Check if point was won on return of first serve
                        // 检查是否在接一发上得分
                        if (entry.winner === playerRole) {
                            playerStats.returnFirstServePointsWon++;
                        }
                    }
                } else if (serveNum === 2) {
                    // Opponent's second serve
                    // 对手的二发
                    if (entry.action !== 'Double Fault' && entry.winner !== null) {
                        // Opponent's second serve went in (and point was completed)
                        // 对手二发成功进入比赛（且point已完成）
                        playerStats.returnSecondServesIn++;
                        // Check if point was won on return of second serve
                        // 检查是否在接二发上得分
                        if (entry.winner === playerRole) {
                            playerStats.returnSecondServePointsWon++;
                        }
                    }
                }
            }
        });
    }
    
    // Count serve statistics separately (based on server, not player)
    // 单独统计发球数据（基于发球方，而不是玩家）
    // This ensures return errors are counted for the server's serve statistics
    // 这确保 return error 被计入发球方的发球统计
    for (const entry of match.log) {
        if (!entry.server) continue;
        
        const serverRole = entry.server;
        const serverStats = stats[serverRole];
        
        if (!serverStats) continue;
        
        // Count serve statistics for the server
        // 统计发球方的发球数据
        // Count total serves: only when point is completed (not first serve fault)
        // 统计总发球数：只有当point完成时（不是一发失误）
        // One serve opportunity = first serve success OR second serve (success or double fault)
        // 一次发球机会 = 一发成功 OR 二发（成功或双误）
        if (entry.serveNumber === 1) {
            serverStats.firstServes++;
            if (entry.action === 'Serve Fault') {
                serverStats.firstServeFaults++;
                // First serve fault - don't count as total serve yet (wait for second serve)
                // 一发失误 - 还不计入总发球数（等待二发）
                // Skip counting totalServes for now
                // 暂时跳过 totalServes 的统计
            } else {
                // First serve went in (successful) - this is one serve opportunity
                // 一发成功进入比赛 - 这是一次发球机会
                serverStats.totalServes++;
                serverStats.firstServesIn++;
                // Check if point was won on this first serve
                // 检查是否在一发上得分
                if (entry.winner === serverRole) {
                    serverStats.firstServePointsWon++;
                }
            }
        } else if (entry.serveNumber === 2) {
            // Second serve - this is one serve opportunity (first serve was fault)
            // 二发 - 这是一次发球机会（一发已失误）
            serverStats.totalServes++;
            serverStats.secondServes++;
            // Second serve fault is always recorded as Double Fault
            // 二发失误总是记录为 Double Fault
            if (entry.action === 'Double Fault') {
                serverStats.secondServeFaults++;
            } else {
                // Second serve went in (successful)
                // 二发成功进入比赛（包括 return error 的情况）
                serverStats.secondServesIn++;
                // Check if point was won on this second serve
                // 检查是否在二发上得分
                if (entry.winner === serverRole) {
                    serverStats.secondServePointsWon++;
                }
            }
        }
    }
    
    // Calculate percentages for each player
    // 为每个玩家计算百分比
    ['player1', 'player2'].forEach(playerRole => {
        const playerStats = stats[playerRole];
        
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
        
        // Calculate Total Return Point Win % using opponent's statistics
        // 使用对手的统计数据计算总接发球得分率
        // Total return opportunities = opponent's total serves
        // 接发球机会总数 = 对手的总发球数
        // We can use opponent's already calculated totalServes instead of recounting
        // 我们可以使用已经计算好的对手的totalServes，而不需要重新统计
        const opponentRole = playerRole === 'player1' ? 'player2' : 'player1';
        const opponentStats = stats[opponentRole];
        
        // Total Return Point Win % = Points won on return / Opponent's total serves
        // 总接发球得分率 = 接发球得分 / 对手的总发球数
        // Alternative: (1 - Opponent's Total Serve Point Win % / 100) * 100
        // 替代方法：(1 - 对手的总发球得分率 / 100) * 100
        // But we already have pointsWonOnReturn, so we use it directly
        // 但我们已经有了pointsWonOnReturn，所以直接使用它
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
        
        if (playerStats.totalServes > 0) {
            const successfulServes = playerStats.totalServes - playerStats.firstServeFaults - playerStats.secondServeFaults;
            playerStats.serveSuccessRate = (successfulServes / playerStats.totalServes * 100).toFixed(1);
        }
        
        playerStats.totalPoints = playerStats.pointsWon + playerStats.pointsLost;
    });
    
    // Calculate maximum consecutive points won for each player
    // 计算每个玩家的最大连续得分
    // This includes all points won by the player, including:
    // 这包括玩家赢得的所有分数，包括：
    // - Points won by own actions (ACE, Winner)
    //   通过自己的行动得分（ACE、Winner）
    // - Points won due to opponent errors (Double Fault, Return Error, Unforced Error, Forced Error)
    //   由于对手失误而得分（Double Fault、Return Error、Unforced Error、Forced Error）
    // The entry.winner field contains the player who won the point in all cases
    // entry.winner字段在所有情况下都包含赢得这一分的玩家
    ['player1', 'player2'].forEach(playerRole => {
        const playerStats = stats[playerRole];
        let currentStreak = 0; // Current consecutive points won (当前连续得分)
        let maxStreak = 0; // Maximum consecutive points won (最大连续得分)
        
        // Iterate through log entries to find consecutive points won
        // 遍历日志条目以查找连续得分
        for (const entry of match.log) {
            // Skip entries without winner (e.g., first serve faults that don't result in a point)
            // 跳过没有winner的条目（例如，没有导致得分的一发失误）
            if (!entry.winner) continue;
            
            // Check if player won this point (regardless of how - own action or opponent error)
            // 检查玩家是否赢得了这一分（无论方式如何 - 自己的行动或对手失误）
            if (entry.winner === playerRole) {
                // Player won this point - increment streak
                // This includes: ACE, Winner, and points won due to opponent errors
                // 玩家得分 - 增加连续得分
                // 这包括：ACE、Winner，以及由于对手失误而得分
                currentStreak++;
                // Update max streak if current streak is larger
                // 如果当前连续得分更大，更新最大连续得分
                if (currentStreak > maxStreak) {
                    maxStreak = currentStreak;
                }
            } else {
                // Player lost this point (opponent won) - reset streak
                // 玩家失分（对手得分）- 重置连续得分
                currentStreak = 0;
            }
        }
        
        // Set maximum consecutive points won (设置最大连续得分)
        playerStats.pointsWonInRow = maxStreak;
    });
    
    return stats;
}

// Calculate set-specific technical statistics
// 计算特定盘的技术统计
// Make sure function is in global scope
// 确保函数在全局作用域中
window.calculateSetStats = function calculateSetStats(match, setNumber) {
    // Use window.createEmptyPlayerStats to ensure it's accessible
    // 使用 window.createEmptyPlayerStats 确保可以访问
    const createStats = window.createEmptyPlayerStats || createEmptyPlayerStats;
    
    if (!match || !match.log || match.log.length === 0) {
        return {
            player1: createStats(),
            player2: createStats()
        };
    }
    
    // Helper function to parse setsScore and determine which set an entry belongs to
    // 辅助函数：解析setsScore并确定条目属于哪个set
    const getSetNumberFromEntry = (entry, index, allLogEntries) => {
        if (!entry.setsScore) return null;
        const parts = entry.setsScore.split('-');
        if (parts.length !== 2) return null;
        const player1Sets = parseInt(parts[0].trim()) || 0;
        const player2Sets = parseInt(parts[1].trim()) || 0;
        const completedSets = player1Sets + player2Sets;
        
        // Current set number = total completed sets + 1
        // 当前盘数 = 已完成的盘数 + 1
        // But we need to handle the case where the entry is from the last point of a completed set
        // 但我们需要处理条目来自已完成set的最后一个point的情况
        // Check if this entry is the last point of a completed set by comparing with previous entry
        // 通过与前一个条目比较来检查此条目是否是已完成set的最后一个point
        if (index > 0 && allLogEntries) {
            const prevEntry = allLogEntries[index - 1];
            if (prevEntry && prevEntry.setsScore) {
                const prevParts = prevEntry.setsScore.split('-');
                if (prevParts.length === 2) {
                    const prevPlayer1Sets = parseInt(prevParts[0].trim()) || 0;
                    const prevPlayer2Sets = parseInt(prevParts[1].trim()) || 0;
                    const prevCompletedSets = prevPlayer1Sets + prevPlayer2Sets;
                    
                    // If previous entry had fewer completed sets, this entry is from the last point of that set
                    // 如果前一个条目的已完成sets较少，则此条目来自该set的最后一个point
                    if (prevCompletedSets < completedSets) {
                        // This entry is from the last point of the completed set
                        // 此条目来自已完成set的最后一个point
                        return completedSets;
                    }
                }
            }
        }
        
        // Otherwise, this entry is from the current set (completedSets + 1)
        // 否则，此条目来自当前set（completedSets + 1）
        return completedSets + 1;
    };
    
    // Filter log entries for the specified set
    // 过滤指定盘的日志条目
    const filteredLog = match.log.filter((entry, index) => {
        const entrySetNumber = getSetNumberFromEntry(entry, index, match.log);
        return entrySetNumber === setNumber;
    });
    
    if (filteredLog.length === 0) {
        return {
            player1: createStats(),
            player2: createStats()
        };
    }
    
    // Create a temporary match object with filtered log for calculation
    // 创建一个带有过滤后日志的临时match对象用于计算
    const tempMatch = {
        ...match,
        log: filteredLog
    };
    
    // Use the same calculation logic as calculateMatchStats
    // 使用与calculateMatchStats相同的计算逻辑
    return window.calculateMatchStats(tempMatch);
};

// Debug: Log that statistics.js has loaded
// 调试：记录 statistics.js 已加载
// Also export calculatePlayerStats to window for consistency
// 同时将 calculatePlayerStats 导出到 window 以保持一致性
if (typeof window !== 'undefined') {
    window.calculatePlayerStats = calculatePlayerStats;
    
    console.log('statistics.js loaded. Functions available:', {
        calculateMatchStats: typeof window.calculateMatchStats,
        createEmptyPlayerStats: typeof window.createEmptyPlayerStats,
        calculatePlayerStats: typeof window.calculatePlayerStats,
        calculateSetStats: typeof window.calculateSetStats
    });
} else {
    console.error('statistics.js: window object not available!');
}
