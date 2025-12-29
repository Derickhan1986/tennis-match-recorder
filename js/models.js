//
//  Data Models for Tennis Match Recorder
//  网球比赛记录器数据模型
//
//  Defines all data structures and validation functions
//  定义所有数据结构和验证函数
//

// Generate UUID
// 生成UUID
function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

// Player Model
// 玩家模型
function createPlayer(data = {}) {
    return {
        id: data.id || generateUUID(),
        name: data.name || '',
        handedness: data.handedness || 'righty', // 'righty' | 'lefty'
        backhandPreference: data.backhandPreference || 'Single Hand', // 'Single Hand' | 'Double Hand'
        utrRating: data.utrRating !== undefined ? data.utrRating : null,
        createdAt: data.createdAt || new Date().toISOString(),
        updatedAt: data.updatedAt || new Date().toISOString()
    };
}

// Validate player data
// 验证玩家数据
function validatePlayer(player) {
    if (!player.name || player.name.trim() === '') {
        throw new Error('Player name is required');
    }
    // Validate name: only letters (a-z, A-Z), spaces, and hyphens (-)
    // 验证姓名：只允许字母（a-z, A-Z）、空格和连字符（-）
    const namePattern = /^[a-zA-Z\s\-]+$/;
    if (!namePattern.test(player.name)) {
        throw new Error('Player name can only contain letters (a-z, A-Z), spaces, and hyphens (-)');
    }
    if (!['righty', 'lefty'].includes(player.handedness)) {
        throw new Error('Invalid handedness');
    }
    if (!['Single Hand', 'Double Hand'].includes(player.backhandPreference)) {
        throw new Error('Invalid backhand preference');
    }
    if (player.utrRating !== null) {
        if (player.utrRating < 0 || player.utrRating > 16) {
            throw new Error('UTR rating must be between 0 and 16');
        }
        // Check if more than 2 decimal places
        // 检查是否超过两位小数
        const decimalPlaces = (player.utrRating.toString().split('.')[1] || '').length;
        if (decimalPlaces > 2) {
            throw new Error('UTR rating must have at most 2 decimal places');
        }
    }
    return true;
}

// Match Settings Model
// 比赛设置模型
function createMatchSettings(data = {}) {
    return {
        player1Id: data.player1Id || '',
        player2Id: data.player2Id || '',
        firstServer: data.firstServer || 'player1', // 'player1' | 'player2'
        numberOfSets: data.numberOfSets || 3,
        gamesPerSet: data.gamesPerSet || 6,
        adScoring: data.adScoring !== undefined ? data.adScoring : true,
        finalSetType: data.finalSetType || 'Normal Final Set', // 'Normal Final Set' | 'Super Tie Break'
        courtType: data.courtType || 'Hard', // 'Grass' | 'Clay' | 'Hard' | 'Carpet'
        indoor: data.indoor !== undefined ? data.indoor : false,
        tieBreakGames: data.tieBreakGames || 7, // For Normal Final Set: 5, 7, 10
        tieBreakWinBy2: data.tieBreakWinBy2 !== undefined ? data.tieBreakWinBy2 : true,
        superTieBreakPoints: data.superTieBreakPoints || 10, // For Super Tie Break: 5, 7, 10, 12
        superTieBreakWinBy2: data.superTieBreakWinBy2 !== undefined ? data.superTieBreakWinBy2 : true
    };
}

// Validate match settings
// 验证比赛设置
function validateMatchSettings(settings) {
    if (!settings.player1Id || !settings.player2Id) {
        throw new Error('Both players are required');
    }
    if (settings.player1Id === settings.player2Id) {
        throw new Error('Players must be different');
    }
    if (settings.numberOfSets < 1 || settings.numberOfSets > 5) {
        throw new Error('Number of sets must be between 1 and 5');
    }
    if (settings.gamesPerSet < 1 || settings.gamesPerSet > 8) {
        throw new Error('Games per set must be between 1 and 8');
    }
    if (!['Normal Final Set', 'Super Tie Break'].includes(settings.finalSetType)) {
        throw new Error('Invalid final set type');
    }
    if (settings.finalSetType === 'Normal Final Set') {
        if (![5, 7, 10].includes(settings.tieBreakGames)) {
            throw new Error('Tie break games must be 5, 7, or 10');
        }
    }
    if (settings.finalSetType === 'Super Tie Break') {
        if (![5, 7, 10, 12].includes(settings.superTieBreakPoints)) {
            throw new Error('Super tie break points must be 5, 7, 10, or 12');
        }
    }
    if (!['Grass', 'Clay', 'Hard', 'Carpet'].includes(settings.courtType)) {
        throw new Error('Invalid court type');
    }
    return true;
}

// Point Model
// 分模型
function createPoint(data = {}) {
    return {
        pointNumber: data.pointNumber || 0,
        winner: data.winner || null, // 'player1' | 'player2'
        pointType: data.pointType || null, // 'ACE', 'Winner', 'Serve Fault', 'Return Error', 'Unforced Error', 'Forced Error'
        shotType: data.shotType || null, // 'Forehand Ground Stroke', 'Backhand Ground Stroke', 'Forehand Slice', 'Backhand Slice', 'Forehand Volley', 'Backhand Volley', 'Lob', 'Overhead', 'Approach Shot', 'Drop Shot'
        server: data.server || null, // 'player1' | 'player2' - who was serving
        serveNumber: data.serveNumber || null, // 1 or 2 - first or second serve
        timestamp: data.timestamp || new Date().toISOString()
    };
}

// Shot Types
// 击球类型
const ShotType = {
    FOREHAND_GROUND_STROKE: 'Forehand Ground Stroke',
    BACKHAND_GROUND_STROKE: 'Backhand Ground Stroke',
    FOREHAND_SLICE: 'Forehand Slice',
    BACKHAND_SLICE: 'Backhand Slice',
    FOREHAND_VOLLEY: 'Forehand Volley',
    BACKHAND_VOLLEY: 'Backhand Volley',
    LOB: 'Lob',
    OVERHEAD: 'Overhead',
    APPROACH_SHOT: 'Approach Shot',
    DROP_SHOT: 'Drop Shot'
};

// Match Log Entry (merged with Point - contains all point information plus score information)
// 比赛日志条目（与Point合并 - 包含所有point信息加上比分信息）
function createLogEntry(data = {}) {
    return {
        id: data.id || generateUUID(),
        timestamp: data.timestamp || new Date().toISOString(),
        // Point information (from createPoint)
        // Point信息（来自createPoint）
        pointNumber: data.pointNumber || null, // Point number in the game/tie-break
        winner: data.winner || null, // 'player1' | 'player2' - who won the point
        pointType: data.pointType || null, // 'ACE', 'Winner', 'Serve Fault', 'Return Error', 'Unforced Error', 'Forced Error'
        shotType: data.shotType || null, // Shot type if applicable
        server: data.server || null, // 'player1' | 'player2' - who was serving
        serveNumber: data.serveNumber || null, // 1 or 2 - first or second serve
        // Log information (for display and undo)
        // 日志信息（用于显示和撤销）
        player: data.player || data.winner || null, // 'player1' | 'player2' - who performed the action (may differ from winner for errors)
        action: data.action || data.pointType || null, // 'ACE', 'Winner', 'Serve Fault', etc.
        // Score information (current state after this point)
        // 比分信息（此point后的当前状态）
        gameScore: data.gameScore || null, // Current game score (e.g., "0-40")
        gamesScore: data.gamesScore || null, // Current games score in set (e.g., "1-2")
        setsScore: data.setsScore || null, // Current sets score in match (e.g., "0-1")
        currentServer: data.currentServer || null, // Current server at this point ('player1' | 'player2')
        currentServeNumber: data.currentServeNumber !== undefined ? data.currentServeNumber : 1, // Current serve number (1 or 2) for undo tracking
        isBreakPoint: data.isBreakPoint || false // Whether this point is a break point (接发球方有机会破发)
    };
}

// Game Model
// 局模型
function createGame(data = {}) {
    return {
        gameNumber: data.gameNumber || 0,
        player1Score: data.player1Score || 0, // 0, 15, 30, 40, or 'AD'
        player2Score: data.player2Score || 0,
        winner: data.winner || null, // 'player1' | 'player2' | null
        server: data.server || null, // 'player1' | 'player2' - who served this game
        points: data.points || []
    };
}

// Tie Break Model
// 抢七模型
function createTieBreak(data = {}) {
    return {
        player1Points: data.player1Points || 0,
        player2Points: data.player2Points || 0,
        winner: data.winner || null, // 'player1' | 'player2' | null
        points: data.points || []
    };
}

// Set Model
// 盘模型
function createSet(data = {}) {
    return {
        setNumber: data.setNumber || 0,
        player1Games: data.player1Games || 0,
        player2Games: data.player2Games || 0,
        winner: data.winner || null, // 'player1' | 'player2' | null
        games: data.games || [],
        tieBreak: data.tieBreak || null
    };
}

// Match Model
// 比赛模型
function createMatch(data = {}) {
    return {
        id: data.id || generateUUID(),
        player1Id: data.player1Id || '',
        player2Id: data.player2Id || '',
        settings: data.settings || createMatchSettings(),
        status: data.status || 'in-progress', // 'in-progress' | 'completed' | 'abandoned'
        startTime: data.startTime || new Date().toISOString(),
        endTime: data.endTime || null,
        sets: data.sets || [],
        currentServer: data.currentServer || null, // 'player1' | 'player2' - who is serving in current game
        currentServeNumber: data.currentServeNumber || 1, // 1 or 2 - first or second serve
        winner: data.winner || null, // 'player1' | 'player2' | null
        createdAt: data.createdAt || new Date().toISOString(),
        updatedAt: data.updatedAt || new Date().toISOString()
    };
}

// Format date
// 格式化日期
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit' 
    });
}

// Format duration
// 格式化持续时间
function formatDuration(startTime, endTime) {
    if (!endTime) return 'In Progress';
    const start = new Date(startTime);
    const end = new Date(endTime);
    const seconds = Math.floor((end - start) / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
        return `${hours}h ${minutes % 60}m`;
    } else if (minutes > 0) {
        return `${minutes}m`;
    } else {
        return `${seconds}s`;
    }
}

// Get match score summary
// 获取比赛比分摘要
function getMatchScoreSummary(match) {
    if (!match.sets || match.sets.length === 0) {
        return 'Not started';
    }
    
    const setScores = match.sets.map(set => {
        if (set.tieBreak) {
            return `${set.player1Games}-${set.player2Games}(${set.tieBreak.player1Points || 0}-${set.tieBreak.player2Points || 0})`;
        }
        return `${set.player1Games}-${set.player2Games}`;
    });
    
    return setScores.join(' ');
}

// Get current set number
// 获取当前盘数
function getCurrentSetNumber(match) {
    if (!match.sets || match.sets.length === 0) {
        return 1;
    }
    const lastSet = match.sets[match.sets.length - 1];
    if (lastSet.winner) {
        return match.sets.length + 1;
    }
    return match.sets.length;
}

// Get current game number in set
// 获取当前局数
function getCurrentGameNumber(set) {
    if (!set.games || set.games.length === 0) {
        return 1;
    }
    const lastGame = set.games[set.games.length - 1];
    if (lastGame.winner) {
        return set.games.length + 1;
    }
    return set.games.length;
}

// Get player name helper
// 获取玩家名称辅助函数
async function getPlayerName(playerId) {
    try {
        const player = await storage.getPlayer(playerId);
        return player ? player.name : 'Unknown';
    } catch (error) {
        return 'Unknown';
    }
}

