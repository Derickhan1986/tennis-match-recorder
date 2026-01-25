//
// Test Runner Agent
// 测试运行器Agent
//
// Runs tests and compares results
// 运行测试并比对结果
//

class TestRunner {
    constructor() {
        this.matchSimulator = new MatchSimulator();
        this.statisticsValidator = new StatisticsValidator();
        this.scoreValidator = new ScoreValidator();
        this.results = [];
        this.onProgress = null; // Callback for progress updates
        // 进度更新回调
    }

    // Run tests for multiple matches
    // 运行多场比赛的测试
    async runTests(scenarios, matchCount, onProgress = null) {
        this.onProgress = onProgress;
        this.results = [];

        const testRun = {
            timestamp: new Date().toISOString(),
            matchCount: matchCount,
            scenarios: scenarios.map(s => s.name || 'Unknown')
        };

        let totalTests = 0;
        let passedTests = 0;
        let failedTests = 0;

        // Run each scenario
        // 运行每个场景
        for (const scenario of scenarios) {
            for (let i = 0; i < matchCount; i++) {
                totalTests++;

                try {
                    const result = await this.runSingleTest(scenario, i);
                    this.results.push(result);

                    if (result.passed) {
                        passedTests++;
                    } else {
                        failedTests++;
                    }

                    // Report progress
                    // 报告进度
                    if (this.onProgress) {
                        this.onProgress({
                            total: totalTests,
                            passed: passedTests,
                            failed: failedTests,
                            current: {
                                scenario: scenario.name,
                                matchIndex: i + 1,
                                passed: result.passed
                            }
                        });
                    }
                } catch (error) {
                    console.error(`Error running test ${scenario.name} match ${i}:`, error);
                    failedTests++;

                    this.results.push({
                        scenario: scenario.name,
                        matchIndex: i,
                        passed: false,
                        error: error.message,
                        match: null,
                        pointSequence: [],
                        differences: []
                    });
                }
            }
        }

        // Generate summary
        // 生成摘要
        const summary = {
            totalMatches: totalTests,
            passed: passedTests,
            failed: failedTests,
            passRate: totalTests > 0 ? ((passedTests / totalTests) * 100).toFixed(1) + '%' : '0%'
        };

        return {
            testRun: testRun,
            results: this.results,
            summary: summary
        };
    }

    // Run a single test
    // 运行单个测试
    async runSingleTest(scenario, matchIndex) {
        const settings = scenario.settings;

        // Generate virtual match using Match Simulator
        // 使用Match Simulator生成虚拟比赛
        const pointTracker = new PointTracker();
        let match, trackedPoints;
        try {
            const result = await this.matchSimulator.generateMatch(settings, pointTracker);
            match = result.match;
            trackedPoints = result.trackedPoints || [];
        } catch (error) {
            console.error(`Error generating match for ${scenario.name} match ${matchIndex}:`, error);
            return {
                scenario: scenario.name,
                matchIndex: matchIndex,
                passed: false,
                error: error.message,
                match: null,
                pointSequence: [],
                differences: [{
                    type: 'match_generation_error',
                    message: `Failed to generate match: ${error.message}`
                }]
            };
        }

        // Check if match was generated successfully
        // 检查match是否成功生成
        if (!match) {
            return {
                scenario: scenario.name,
                matchIndex: matchIndex,
                passed: false,
                match: null,
                pointSequence: trackedPoints || [],
                differences: [{
                    type: 'match_generation_error',
                    message: 'Match generation returned null'
                }]
            };
        }

        // Check if any points were generated
        // 检查是否生成了points
        if (!trackedPoints || trackedPoints.length === 0) {
            return {
                scenario: scenario.name,
                matchIndex: matchIndex,
                passed: false,
                match: match,
                pointSequence: [],
                differences: [{
                    type: 'no_points_generated',
                    message: 'No points were generated for this match. Match may have failed to start or complete.'
                }]
            };
        }

        // Calculate statistics using program function
        // 使用程序函数计算统计
        let programStats = null;
        try {
            if (typeof window !== 'undefined' && window.calculateMatchStats) {
                programStats = window.calculateMatchStats(match);
            } else {
                throw new Error('calculateMatchStats not available');
            }
        } catch (error) {
            console.error('Error calculating program stats:', error);
            return {
                scenario: scenario.name,
                matchIndex: matchIndex,
                passed: false,
                error: error.message,
                match: match,
                pointSequence: trackedPoints,
                differences: [{
                    type: 'statistics_calculation_error',
                    message: `Failed to calculate program statistics: ${error.message}`
                }]
            };
        }

        // Calculate statistics using independent validator
        // 使用独立验证器计算统计
        const expectedStats = this.statisticsValidator.calculateStatistics(trackedPoints);

        // Calculate expected scores using independent validator
        // 使用独立验证器计算期望分数
        const expectedScores = this.scoreValidator.calculateScores(trackedPoints, settings);

        // Compare results
        // 比对结果
        const differences = this.compareResults(programStats, expectedStats, match, expectedScores, trackedPoints);

        // Check if test passed
        // 检查测试是否通过
        const passed = differences.length === 0;

        return {
            scenario: scenario.name,
            matchIndex: matchIndex,
            passed: passed,
            match: match,
            pointSequence: trackedPoints,
            programStats: programStats,
            expectedStats: expectedStats,
            expectedScores: expectedScores,
            differences: differences
        };
    }

    // Compare program stats with expected stats
    // 比对程序统计与期望统计
    compareResults(programStats, expectedStats, match, expectedScores, trackedPoints) {
        const differences = [];

        // Compare match structure
        // 比对比赛结构
        if (!match || !match.sets) {
            differences.push({
                type: 'match_structure',
                message: 'Match structure is invalid',
                // 比赛结构无效
                details: { match: match }
            });
        }

        // Compare scores
        // 比对分数
        const scoreDifferences = this.compareScores(match, expectedScores);
        differences.push(...scoreDifferences);
        
        // Compare server assignments
        // 比对发球方分配
        const serverDifferences = this.compareServers(match, expectedScores, trackedPoints);
        differences.push(...serverDifferences);

        // Compare statistics for each player
        // 比对每个玩家的统计
        ['player1', 'player2'].forEach(playerRole => {
            const program = programStats[playerRole];
            const expected = expectedStats[playerRole];

            if (!program || !expected) {
                differences.push({
                    type: 'missing_stats',
                    player: playerRole,
                    message: `Missing statistics for ${playerRole}`
                    // 缺少${playerRole}的统计
                });
                return;
            }

            // Compare all statistics
            // 比对所有统计
            const statDifferences = this.comparePlayerStats(program, expected, playerRole);
            differences.push(...statDifferences);
        });

        return differences;
    }

    // Compare server assignments
    // 比对发球方分配
    compareServers(match, expectedScores, trackedPoints) {
        const differences = [];
        
        if (!expectedScores.expectedServers || !trackedPoints) {
            return differences;
        }
        
        // Create a map of point number to expected server
        // 创建point number到期望发球方的映射
        const expectedServerMap = new Map();
        expectedScores.expectedServers.forEach(es => {
            expectedServerMap.set(es.pointNumber, es.expectedServer);
        });
        
        // Compare each tracked point with expected server
        // 比较每个tracked point与期望发球方
        // Note: We should check all points, including first serve faults
        // 注意：我们应该检查所有points，包括一发失误
        for (const point of trackedPoints) {
            if (!point || !point.pointNumber) continue;
            
            const expectedServer = expectedServerMap.get(point.pointNumber);
            const programServer = point.server;
            
            // Check if server matches
            // 检查发球方是否匹配
            if (expectedServer && programServer) {
                if (expectedServer !== programServer) {
                    differences.push({
                        type: 'server_mismatch',
                        pointNumber: point.pointNumber,
                        programValue: programServer,
                        expectedValue: expectedServer,
                        pointType: point.pointType,
                        message: `Point ${point.pointNumber} (${point.pointType || 'unknown'}): program server=${programServer}, expected=${expectedServer}`
                    });
                }
            } else if (expectedServer && !programServer) {
                // Expected server but program doesn't have it
                // 期望有发球方但程序没有
                differences.push({
                    type: 'server_mismatch',
                    pointNumber: point.pointNumber,
                    programValue: null,
                    expectedValue: expectedServer,
                    pointType: point.pointType,
                    message: `Point ${point.pointNumber} (${point.pointType || 'unknown'}): program server is missing, expected=${expectedServer}`
                });
            } else if (!expectedServer && programServer) {
                // Program has server but we don't expect it (shouldn't happen, but log it)
                // 程序有发球方但我们不期望（不应该发生，但记录它）
                differences.push({
                    type: 'server_mismatch',
                    pointNumber: point.pointNumber,
                    programValue: programServer,
                    expectedValue: null,
                    pointType: point.pointType,
                    message: `Point ${point.pointNumber} (${point.pointType || 'unknown'}): program server=${programServer}, but expected server is missing`
                });
            }
        }
        
        return differences;
    }

    // Compare match scores
    // 比对比赛分数
    compareScores(match, expectedScores) {
        const differences = [];

        // Compare match winner
        // 比对比赛获胜者
        if (match.winner !== expectedScores.winner) {
            differences.push({
                type: 'score_mismatch',
                category: 'match_winner',
                programValue: match.winner,
                expectedValue: expectedScores.winner,
                message: `Match winner: program=${match.winner}, expected=${expectedScores.winner}`
            });
        }

        // Compare number of sets
        // 比对盘数
        const programSetsCount = match.sets ? match.sets.length : 0;
        const expectedSetsCount = expectedScores.sets ? expectedScores.sets.length : 0;
        if (programSetsCount !== expectedSetsCount) {
            differences.push({
                type: 'score_mismatch',
                category: 'sets_count',
                programValue: programSetsCount,
                expectedValue: expectedSetsCount,
                message: `Number of sets: program=${programSetsCount}, expected=${expectedSetsCount}`
            });
        }

        // Compare each set
        // 比对每一盘
        const maxSets = Math.max(programSetsCount, expectedSetsCount);
        for (let i = 0; i < maxSets; i++) {
            const programSet = match.sets && match.sets[i] ? match.sets[i] : null;
            const expectedSet = expectedScores.sets && expectedScores.sets[i] ? expectedScores.sets[i] : null;

            if (!programSet && expectedSet) {
                differences.push({
                    type: 'score_mismatch',
                    category: 'set_missing',
                    setNumber: i + 1,
                    message: `Set ${i + 1}: missing in program, expected=${expectedSet.player1Games}-${expectedSet.player2Games}`
                });
                continue;
            }

            if (programSet && !expectedSet) {
                differences.push({
                    type: 'score_mismatch',
                    category: 'set_extra',
                    setNumber: i + 1,
                    message: `Set ${i + 1}: extra in program, value=${programSet.player1Games}-${programSet.player2Games}`
                });
                continue;
            }

            if (programSet && expectedSet) {
                // Compare set winner
                // 比对盘获胜者
                if (programSet.winner !== expectedSet.winner) {
                    differences.push({
                        type: 'score_mismatch',
                        category: 'set_winner',
                        setNumber: i + 1,
                        programValue: programSet.winner,
                        expectedValue: expectedSet.winner,
                        message: `Set ${i + 1} winner: program=${programSet.winner}, expected=${expectedSet.winner}`
                    });
                }

                // Compare games score
                // 比对游戏分数
                if (programSet.player1Games !== expectedSet.player1Games ||
                    programSet.player2Games !== expectedSet.player2Games) {
                    differences.push({
                        type: 'score_mismatch',
                        category: 'set_games',
                        setNumber: i + 1,
                        programValue: `${programSet.player1Games}-${programSet.player2Games}`,
                        expectedValue: `${expectedSet.player1Games}-${expectedSet.player2Games}`,
                        message: `Set ${i + 1} games: program=${programSet.player1Games}-${programSet.player2Games}, expected=${expectedSet.player1Games}-${expectedSet.player2Games}`
                    });
                }

                // Compare tie-break if exists
                // 如果存在，比对抢七
                if (programSet.tieBreak || expectedSet.tieBreak) {
                    const programTB = programSet.tieBreak || { player1Points: 0, player2Points: 0, winner: null };
                    const expectedTB = expectedSet.tieBreak || { player1Points: 0, player2Points: 0, winner: null };

                    if (programTB.player1Points !== expectedTB.player1Points ||
                        programTB.player2Points !== expectedTB.player2Points) {
                        differences.push({
                            type: 'score_mismatch',
                            category: 'tiebreak_points',
                            setNumber: i + 1,
                            programValue: `${programTB.player1Points}-${programTB.player2Points}`,
                            expectedValue: `${expectedTB.player1Points}-${expectedTB.player2Points}`,
                            message: `Set ${i + 1} tie-break: program=${programTB.player1Points}-${programTB.player2Points}, expected=${expectedTB.player1Points}-${expectedTB.player2Points}`
                        });
                    }

                    if (programTB.winner !== expectedTB.winner) {
                        differences.push({
                            type: 'score_mismatch',
                            category: 'tiebreak_winner',
                            setNumber: i + 1,
                            programValue: programTB.winner,
                            expectedValue: expectedTB.winner,
                            message: `Set ${i + 1} tie-break winner: program=${programTB.winner}, expected=${expectedTB.winner}`
                        });
                    }
                }
            }
        }

        return differences;
    }

    // Compare statistics for a single player
    // 比对单个玩家的统计
    comparePlayerStats(program, expected, playerRole) {
        const differences = [];

        // Get all stat keys from expected (should match program structure)
        // 从expected获取所有统计键（应该匹配程序结构）
        const allKeys = new Set([...Object.keys(program), ...Object.keys(expected)]);

        for (const key of allKeys) {
            // Skip functions and complex objects (we'll handle shotTypes separately)
            // 跳过函数和复杂对象（我们将单独处理shotTypes）
            if (typeof program[key] === 'function' || key === 'shotTypes') {
                continue;
            }

            const programValue = program[key];
            const expectedValue = expected[key];

            // Handle numeric values
            // 处理数值
            if (typeof programValue === 'number' && typeof expectedValue === 'number') {
                if (programValue !== expectedValue) {
                    differences.push({
                        type: 'statistic_mismatch',
                        player: playerRole,
                        statistic: key,
                        programValue: programValue,
                        expectedValue: expectedValue,
                        difference: Math.abs(programValue - expectedValue),
                        message: `${playerRole} ${key}: program=${programValue}, expected=${expectedValue}`
                    });
                }
            }
            // Handle string values (percentages)
            // 处理字符串值（百分比）
            else if (typeof programValue === 'string' && typeof expectedValue === 'string') {
                const programNum = parseFloat(programValue);
                const expectedNum = parseFloat(expectedValue);

                // Allow 0.1% tolerance for floating point precision
                // 允许0.1%的容差以处理浮点精度
                if (Math.abs(programNum - expectedNum) > 0.1) {
                    differences.push({
                        type: 'statistic_mismatch',
                        player: playerRole,
                        statistic: key,
                        programValue: programValue,
                        expectedValue: expectedValue,
                        difference: Math.abs(programNum - expectedNum),
                        message: `${playerRole} ${key}: program=${programValue}, expected=${expectedValue}`
                    });
                }
            }
            // Handle missing values
            // 处理缺失值
            else if (programValue === undefined && expectedValue !== undefined) {
                differences.push({
                    type: 'missing_statistic',
                    player: playerRole,
                    statistic: key,
                    expectedValue: expectedValue,
                    message: `${playerRole} ${key}: missing in program, expected=${expectedValue}`
                });
            }
            else if (programValue !== undefined && expectedValue === undefined) {
                differences.push({
                    type: 'extra_statistic',
                    player: playerRole,
                    statistic: key,
                    programValue: programValue,
                    message: `${playerRole} ${key}: extra in program, value=${programValue}`
                });
            }
        }

        // Compare shot types
        // 比对击球类型
        if (program.shotTypes && expected.shotTypes) {
            const shotTypeDifferences = this.compareShotTypes(program.shotTypes, expected.shotTypes, playerRole);
            differences.push(...shotTypeDifferences);
        }

        return differences;
    }

    // Compare shot types
    // 比对击球类型
    compareShotTypes(programShotTypes, expectedShotTypes, playerRole) {
        const differences = [];

        const allShotTypes = new Set([
            ...Object.keys(programShotTypes),
            ...Object.keys(expectedShotTypes)
        ]);

        for (const shotType of allShotTypes) {
            const programValue = programShotTypes[shotType] || 0;
            const expectedValue = expectedShotTypes[shotType] || 0;

            if (programValue !== expectedValue) {
                differences.push({
                    type: 'shot_type_mismatch',
                    player: playerRole,
                    shotType: shotType,
                    programValue: programValue,
                    expectedValue: expectedValue,
                    difference: Math.abs(programValue - expectedValue),
                    message: `${playerRole} ${shotType}: program=${programValue}, expected=${expectedValue}`
                });
            }
        }

        return differences;
    }

    // Export results to JSON
    // 导出结果为JSON
    exportResults() {
        return JSON.stringify({
            testRun: this.results.length > 0 ? {
                timestamp: new Date().toISOString(),
                totalTests: this.results.length
            } : null,
            results: this.results,
            summary: this.getSummary()
        }, null, 2);
    }

    // Get summary
    // 获取摘要
    getSummary() {
        const total = this.results.length;
        const passed = this.results.filter(r => r.passed).length;
        const failed = total - passed;

        return {
            totalMatches: total,
            passed: passed,
            failed: failed,
            passRate: total > 0 ? ((passed / total) * 100).toFixed(1) + '%' : '0%'
        };
    }
}

// Export for use in other modules
// 导出供其他模块使用
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TestRunner;
}

