//
// Test Scenarios Configuration
// 测试场景配置
//
// Defines various test scenarios covering edge cases
// 定义各种测试场景，覆盖边界情况
//

const TestScenarios = [
    // Basic 3-set match with Ad Scoring
    // 基本3盘比赛，Ad计分
    {
        name: 'Basic 3-Set Match (Ad Scoring)',
        settings: createMatchSettings({
            player1Id: 'test-player-1',
            player2Id: 'test-player-2',
            firstServer: 'player1',
            numberOfSets: 3,
            gamesPerSet: 6,
            adScoring: true,
            finalSetType: 'Normal Final Set',
            courtType: 'Hard',
            indoor: false,
            tieBreakGames: 7,
            tieBreakWinBy2: true,
            superTieBreakPoints: 10,
            superTieBreakWinBy2: true
        })
    },

    // Super Tie Break final set
    // Super Tie Break决胜盘
    {
        name: '3-Set Match (Super Tie Break)',
        settings: createMatchSettings({
            player1Id: 'test-player-1',
            player2Id: 'test-player-2',
            firstServer: 'player1',
            numberOfSets: 3,
            gamesPerSet: 6,
            adScoring: true,
            finalSetType: 'Super Tie Break',
            courtType: 'Hard',
            indoor: false,
            tieBreakGames: 7,
            tieBreakWinBy2: true,
            superTieBreakPoints: 10,
            superTieBreakWinBy2: true
        })
    },

    // No-Ad Scoring
    // No-Ad计分
    {
        name: '3-Set Match (No-Ad Scoring)',
        settings: createMatchSettings({
            player1Id: 'test-player-1',
            player2Id: 'test-player-2',
            firstServer: 'player1',
            numberOfSets: 3,
            gamesPerSet: 6,
            adScoring: false,
            finalSetType: 'Normal Final Set',
            courtType: 'Hard',
            indoor: false,
            tieBreakGames: 7,
            tieBreakWinBy2: true,
            superTieBreakPoints: 10,
            superTieBreakWinBy2: true
        })
    },

    // 5-set match
    // 5盘比赛
    {
        name: '5-Set Match',
        settings: createMatchSettings({
            player1Id: 'test-player-1',
            player2Id: 'test-player-2',
            firstServer: 'player1',
            numberOfSets: 5,
            gamesPerSet: 6,
            adScoring: true,
            finalSetType: 'Normal Final Set',
            courtType: 'Hard',
            indoor: false,
            tieBreakGames: 7,
            tieBreakWinBy2: true,
            superTieBreakPoints: 10,
            superTieBreakWinBy2: true
        })
    },

    // Different games per set
    // 不同的每盘game数
    {
        name: '3-Set Match (3 Games per Set)',
        settings: createMatchSettings({
            player1Id: 'test-player-1',
            player2Id: 'test-player-2',
            firstServer: 'player1',
            numberOfSets: 3,
            gamesPerSet: 3,
            adScoring: true,
            finalSetType: 'Normal Final Set',
            courtType: 'Hard',
            indoor: false,
            tieBreakGames: 5,
            tieBreakWinBy2: true,
            superTieBreakPoints: 10,
            superTieBreakWinBy2: true
        })
    },

    {
        name: '3-Set Match (4 Games per Set)',
        settings: createMatchSettings({
            player1Id: 'test-player-1',
            player2Id: 'test-player-2',
            firstServer: 'player1',
            numberOfSets: 3,
            gamesPerSet: 4,
            adScoring: true,
            finalSetType: 'Normal Final Set',
            courtType: 'Hard',
            indoor: false,
            tieBreakGames: 5,
            tieBreakWinBy2: true,
            superTieBreakPoints: 10,
            superTieBreakWinBy2: true
        })
    },

    {
        name: '3-Set Match (5 Games per Set)',
        settings: createMatchSettings({
            player1Id: 'test-player-1',
            player2Id: 'test-player-2',
            firstServer: 'player1',
            numberOfSets: 3,
            gamesPerSet: 5,
            adScoring: true,
            finalSetType: 'Normal Final Set',
            courtType: 'Hard',
            indoor: false,
            tieBreakGames: 5,
            tieBreakWinBy2: true,
            superTieBreakPoints: 10,
            superTieBreakWinBy2: true
        })
    },

    {
        name: '3-Set Match (7 Games per Set)',
        settings: createMatchSettings({
            player1Id: 'test-player-1',
            player2Id: 'test-player-2',
            firstServer: 'player1',
            numberOfSets: 3,
            gamesPerSet: 7,
            adScoring: true,
            finalSetType: 'Normal Final Set',
            courtType: 'Hard',
            indoor: false,
            tieBreakGames: 7,
            tieBreakWinBy2: true,
            superTieBreakPoints: 10,
            superTieBreakWinBy2: true
        })
    },

    {
        name: '3-Set Match (8 Games per Set)',
        settings: createMatchSettings({
            player1Id: 'test-player-1',
            player2Id: 'test-player-2',
            firstServer: 'player1',
            numberOfSets: 3,
            gamesPerSet: 8,
            adScoring: true,
            finalSetType: 'Normal Final Set',
            courtType: 'Hard',
            indoor: false,
            tieBreakGames: 7,
            tieBreakWinBy2: true,
            superTieBreakPoints: 10,
            superTieBreakWinBy2: true
        })
    },

    // Different tie-break settings
    // 不同的抢七设置
    {
        name: '3-Set Match (Tie-Break 5 points)',
        settings: createMatchSettings({
            player1Id: 'test-player-1',
            player2Id: 'test-player-2',
            firstServer: 'player1',
            numberOfSets: 3,
            gamesPerSet: 6,
            adScoring: true,
            finalSetType: 'Normal Final Set',
            courtType: 'Hard',
            indoor: false,
            tieBreakGames: 5,
            tieBreakWinBy2: true,
            superTieBreakPoints: 10,
            superTieBreakWinBy2: true
        })
    },

    {
        name: '3-Set Match (Tie-Break 10 points)',
        settings: createMatchSettings({
            player1Id: 'test-player-1',
            player2Id: 'test-player-2',
            firstServer: 'player1',
            numberOfSets: 3,
            gamesPerSet: 6,
            adScoring: true,
            finalSetType: 'Normal Final Set',
            courtType: 'Hard',
            indoor: false,
            tieBreakGames: 10,
            tieBreakWinBy2: true,
            superTieBreakPoints: 10,
            superTieBreakWinBy2: true
        })
    },

    {
        name: '3-Set Match (Tie-Break No Win by 2)',
        settings: createMatchSettings({
            player1Id: 'test-player-1',
            player2Id: 'test-player-2',
            firstServer: 'player1',
            numberOfSets: 3,
            gamesPerSet: 6,
            adScoring: true,
            finalSetType: 'Normal Final Set',
            courtType: 'Hard',
            indoor: false,
            tieBreakGames: 7,
            tieBreakWinBy2: false,
            superTieBreakPoints: 10,
            superTieBreakWinBy2: true
        })
    },

    // Different super tie-break settings
    // 不同的super tie-break设置
    {
        name: '3-Set Match (Super Tie-Break 5 points)',
        settings: createMatchSettings({
            player1Id: 'test-player-1',
            player2Id: 'test-player-2',
            firstServer: 'player1',
            numberOfSets: 3,
            gamesPerSet: 6,
            adScoring: true,
            finalSetType: 'Super Tie Break',
            courtType: 'Hard',
            indoor: false,
            tieBreakGames: 7,
            tieBreakWinBy2: true,
            superTieBreakPoints: 5,
            superTieBreakWinBy2: true
        })
    },

    {
        name: '3-Set Match (Super Tie-Break 7 points)',
        settings: createMatchSettings({
            player1Id: 'test-player-1',
            player2Id: 'test-player-2',
            firstServer: 'player1',
            numberOfSets: 3,
            gamesPerSet: 6,
            adScoring: true,
            finalSetType: 'Super Tie Break',
            courtType: 'Hard',
            indoor: false,
            tieBreakGames: 7,
            tieBreakWinBy2: true,
            superTieBreakPoints: 7,
            superTieBreakWinBy2: true
        })
    },

    {
        name: '3-Set Match (Super Tie-Break 12 points)',
        settings: createMatchSettings({
            player1Id: 'test-player-1',
            player2Id: 'test-player-2',
            firstServer: 'player1',
            numberOfSets: 3,
            gamesPerSet: 6,
            adScoring: true,
            finalSetType: 'Super Tie Break',
            courtType: 'Hard',
            indoor: false,
            tieBreakGames: 7,
            tieBreakWinBy2: true,
            superTieBreakPoints: 12,
            superTieBreakWinBy2: true
        })
    },

    {
        name: '3-Set Match (Super Tie-Break No Win by 2)',
        settings: createMatchSettings({
            player1Id: 'test-player-1',
            player2Id: 'test-player-2',
            firstServer: 'player1',
            numberOfSets: 3,
            gamesPerSet: 6,
            adScoring: true,
            finalSetType: 'Super Tie Break',
            courtType: 'Hard',
            indoor: false,
            tieBreakGames: 7,
            tieBreakWinBy2: true,
            superTieBreakPoints: 10,
            superTieBreakWinBy2: false
        })
    },

    // Different court types
    // 不同的场地类型
    {
        name: '3-Set Match (Grass Court)',
        settings: createMatchSettings({
            player1Id: 'test-player-1',
            player2Id: 'test-player-2',
            firstServer: 'player1',
            numberOfSets: 3,
            gamesPerSet: 6,
            adScoring: true,
            finalSetType: 'Normal Final Set',
            courtType: 'Grass',
            indoor: false,
            tieBreakGames: 7,
            tieBreakWinBy2: true,
            superTieBreakPoints: 10,
            superTieBreakWinBy2: true
        })
    },

    {
        name: '3-Set Match (Clay Court)',
        settings: createMatchSettings({
            player1Id: 'test-player-1',
            player2Id: 'test-player-2',
            firstServer: 'player1',
            numberOfSets: 3,
            gamesPerSet: 6,
            adScoring: true,
            finalSetType: 'Normal Final Set',
            courtType: 'Clay',
            indoor: false,
            tieBreakGames: 7,
            tieBreakWinBy2: true,
            superTieBreakPoints: 10,
            superTieBreakWinBy2: true
        })
    },

    {
        name: '3-Set Match (Carpet Court)',
        settings: createMatchSettings({
            player1Id: 'test-player-1',
            player2Id: 'test-player-2',
            firstServer: 'player1',
            numberOfSets: 3,
            gamesPerSet: 6,
            adScoring: true,
            finalSetType: 'Normal Final Set',
            courtType: 'Carpet',
            indoor: true,
            tieBreakGames: 7,
            tieBreakWinBy2: true,
            superTieBreakPoints: 10,
            superTieBreakWinBy2: true
        })
    },

    // Different first server
    // 不同的首发球方
    {
        name: '3-Set Match (Player 2 First Server)',
        settings: createMatchSettings({
            player1Id: 'test-player-1',
            player2Id: 'test-player-2',
            firstServer: 'player2',
            numberOfSets: 3,
            gamesPerSet: 6,
            adScoring: true,
            finalSetType: 'Normal Final Set',
            courtType: 'Hard',
            indoor: false,
            tieBreakGames: 7,
            tieBreakWinBy2: true,
            superTieBreakPoints: 10,
            superTieBreakWinBy2: true
        })
    },

    // Quick match (1 set, 3 games)
    // 快速比赛（1盘，3games）
    {
        name: 'Quick Match (1 Set, 3 Games)',
        settings: createMatchSettings({
            player1Id: 'test-player-1',
            player2Id: 'test-player-2',
            firstServer: 'player1',
            numberOfSets: 1,
            gamesPerSet: 3,
            adScoring: true,
            finalSetType: 'Normal Final Set',
            courtType: 'Hard',
            indoor: false,
            tieBreakGames: 5,
            tieBreakWinBy2: true,
            superTieBreakPoints: 10,
            superTieBreakWinBy2: true
        })
    },

    // Long match (5 sets, 8 games)
    // 长比赛（5盘，8games）
    {
        name: 'Long Match (5 Sets, 8 Games)',
        settings: createMatchSettings({
            player1Id: 'test-player-1',
            player2Id: 'test-player-2',
            firstServer: 'player1',
            numberOfSets: 5,
            gamesPerSet: 8,
            adScoring: true,
            finalSetType: 'Normal Final Set',
            courtType: 'Hard',
            indoor: false,
            tieBreakGames: 7,
            tieBreakWinBy2: true,
            superTieBreakPoints: 10,
            superTieBreakWinBy2: true
        })
    }
];

// Export for use in other modules
// 导出供其他模块使用
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TestScenarios;
}

