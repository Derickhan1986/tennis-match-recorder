//
// Point Tracker Utility
// Point追踪工具
//
// Records detailed point information for debugging and analysis
// 记录详细的point信息用于调试和分析
//

class PointTracker {
    constructor() {
        this.points = [];
    }

    // Record a point with all relevant information
    // 记录一个point及其所有相关信息
    recordPoint(pointData) {
        const point = {
            pointNumber: pointData.pointNumber || this.points.length + 1,
            timestamp: pointData.timestamp || new Date().toISOString(),
            winner: pointData.winner || null,
            pointType: pointData.pointType || null,
            shotType: pointData.shotType || null,
            server: pointData.server || null,
            serveNumber: pointData.serveNumber || null,
            gameScore: pointData.gameScore || null,
            gamesScore: pointData.gamesScore || null,
            setsScore: pointData.setsScore || null,
            currentServer: pointData.currentServer || null,
            currentServeNumber: pointData.currentServeNumber || 1,
            isBreakPoint: pointData.isBreakPoint || false,
            // Additional debugging information
            // 额外的调试信息
            gameNumber: pointData.gameNumber || null,
            setNumber: pointData.setNumber || null,
            isTieBreak: pointData.isTieBreak || false,
            tieBreakScore: pointData.tieBreakScore || null
        };
        
        this.points.push(point);
        return point;
    }

    // Get all points
    // 获取所有points
    getAllPoints() {
        return this.points;
    }

    // Get point by index
    // 根据索引获取point
    getPoint(index) {
        return this.points[index] || null;
    }

    // Get points by range
    // 根据范围获取points
    getPointsByRange(startIndex, endIndex) {
        return this.points.slice(startIndex, endIndex + 1);
    }

    // Clear all points
    // 清除所有points
    clear() {
        this.points = [];
    }

    // Export points to JSON
    // 导出points为JSON
    exportToJSON() {
        return JSON.stringify(this.points, null, 2);
    }

    // Get summary statistics
    // 获取摘要统计
    getSummary() {
        return {
            totalPoints: this.points.length,
            player1Points: this.points.filter(p => p.winner === 'player1').length,
            player2Points: this.points.filter(p => p.winner === 'player2').length,
            aces: this.points.filter(p => p.pointType === 'ACE').length,
            doubleFaults: this.points.filter(p => p.pointType === 'Double Fault').length,
            winners: this.points.filter(p => p.pointType === 'Winner').length,
            unforcedErrors: this.points.filter(p => p.pointType === 'Unforced Error').length,
            forcedErrors: this.points.filter(p => p.pointType === 'Forced Error').length,
            returnErrors: this.points.filter(p => p.pointType === 'Return Error').length,
            breakPoints: this.points.filter(p => p.isBreakPoint).length
        };
    }
}

// Export for use in other modules
// 导出供其他模块使用
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PointTracker;
}

