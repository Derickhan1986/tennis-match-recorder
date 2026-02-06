//
//  Storage Service for Tennis Match Recorder
//  网球比赛记录器存储服务
//
//  Handles data persistence using IndexedDB
//  使用IndexedDB处理数据持久化
//

class StorageService {
    constructor() {
        this.dbName = 'TennisMatchRecorderDB';
        this.dbVersion = 1;
        this.db = null;
        this.init();
    }

    // Initialize IndexedDB
    // 初始化IndexedDB
    async init() {
        if (this.db) {
            return this.db;
        }

        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.dbVersion);

            request.onerror = () => {
                console.error('IndexedDB error:', request.error);
                reject(request.error);
            };

            request.onsuccess = () => {
                this.db = request.result;
                console.log('IndexedDB opened successfully');
                resolve(this.db);
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;

                // Create object stores if they don't exist
                // 如果不存在则创建对象存储
                if (!db.objectStoreNames.contains('players')) {
                    const playerStore = db.createObjectStore('players', { keyPath: 'id' });
                    playerStore.createIndex('name', 'name', { unique: false });
                    playerStore.createIndex('createdAt', 'createdAt', { unique: false });
                }

                if (!db.objectStoreNames.contains('matches')) {
                    const matchStore = db.createObjectStore('matches', { keyPath: 'id' });
                    matchStore.createIndex('playerId', 'playerId', { unique: false });
                    matchStore.createIndex('startTime', 'startTime', { unique: false });
                    matchStore.createIndex('status', 'status', { unique: false });
                }

                if (!db.objectStoreNames.contains('settings')) {
                    db.createObjectStore('settings', { keyPath: 'key' });
                }
            };
        });
    }

    // Save player
    // 保存玩家
    async savePlayer(player) {
        if (!this.db) await this.init();
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['players'], 'readwrite');
            const store = transaction.objectStore('players');
            player.updatedAt = new Date().toISOString();
            const request = store.put(player);

            request.onsuccess = () => {
                console.log('Player saved:', player.id);
                resolve(player);
            };

            request.onerror = () => {
                console.error('Error saving player:', request.error);
                reject(request.error);
            };
        });
    }

    // Get all players
    // 获取所有玩家
    async getAllPlayers() {
        if (!this.db) await this.init();
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['players'], 'readonly');
            const store = transaction.objectStore('players');
            const index = store.index('createdAt');
            const request = index.getAll();

            request.onsuccess = () => {
                const players = request.result.sort((a, b) => 
                    new Date(b.createdAt) - new Date(a.createdAt)
                );
                resolve(players);
            };

            request.onerror = () => {
                console.error('Error getting players:', request.error);
                reject(request.error);
            };
        });
    }

    // Get player by ID
    // 根据ID获取玩家
    async getPlayer(id) {
        if (!this.db) await this.init();
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['players'], 'readonly');
            const store = transaction.objectStore('players');
            const request = store.get(id);

            request.onsuccess = () => {
                resolve(request.result);
            };

            request.onerror = () => {
                console.error('Error getting player:', request.error);
                reject(request.error);
            };
        });
    }

    // Delete player
    // 删除玩家
    async deletePlayer(id) {
        if (!this.db) await this.init();
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['players'], 'readwrite');
            const store = transaction.objectStore('players');
            const request = store.delete(id);

            request.onsuccess = () => {
                console.log('Player deleted:', id);
                resolve();
            };

            request.onerror = () => {
                console.error('Error deleting player:', request.error);
                reject(request.error);
            };
        });
    }

    // Save match
    // 保存比赛
    async saveMatch(match) {
        if (!this.db) await this.init();
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['matches'], 'readwrite');
            const store = transaction.objectStore('matches');
            match.updatedAt = new Date().toISOString();
            const request = store.put(match);

            request.onsuccess = () => {
                console.log('Match saved:', match.id);
                resolve(match);
            };

            request.onerror = () => {
                console.error('Error saving match:', request.error);
                reject(request.error);
            };
        });
    }

    // Get all matches
    // 获取所有比赛
    async getAllMatches() {
        if (!this.db) await this.init();
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['matches'], 'readonly');
            const store = transaction.objectStore('matches');
            const index = store.index('startTime');
            const request = index.getAll();

            request.onsuccess = () => {
                const matches = request.result.sort((a, b) => 
                    new Date(b.startTime) - new Date(a.startTime)
                );
                resolve(matches);
            };

            request.onerror = () => {
                console.error('Error getting matches:', request.error);
                reject(request.error);
            };
        });
    }

    // Get match by ID
    // 根据ID获取比赛
    async getMatch(id) {
        if (!this.db) await this.init();
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['matches'], 'readonly');
            const store = transaction.objectStore('matches');
            const request = store.get(id);

            request.onsuccess = () => {
                resolve(request.result);
            };

            request.onerror = () => {
                console.error('Error getting match:', request.error);
                reject(request.error);
            };
        });
    }

    // Get matches by player ID (where player participated as player1 or player2)
    // 根据玩家ID获取比赛（玩家作为player1或player2参与的比赛）
    async getMatchesByPlayer(playerId) {
        if (!this.db) await this.init();
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['matches'], 'readonly');
            const store = transaction.objectStore('matches');
            const request = store.getAll();

            request.onsuccess = () => {
                // Filter matches where player is player1 or player2
                // 过滤出玩家作为player1或player2的比赛
                const allMatches = request.result;
                const playerMatches = allMatches.filter(match => 
                    match.player1Id === playerId || match.player2Id === playerId
                ).sort((a, b) => 
                    new Date(b.startTime) - new Date(a.startTime)
                );
                resolve(playerMatches);
            };

            request.onerror = () => {
                console.error('Error getting matches:', request.error);
                reject(request.error);
            };
        });
    }

    // Delete match
    // 删除比赛
    async deleteMatch(id) {
        if (!this.db) await this.init();
        
        return new Promise((resolve, reject) => {
            // First get the match to log deletion info
            // 首先获取比赛以记录删除信息
            const readTransaction = this.db.transaction(['matches'], 'readonly');
            const readStore = readTransaction.objectStore('matches');
            const readRequest = readStore.get(id);
            
            readRequest.onsuccess = () => {
                const match = readRequest.result;
                if (match) {
                    const logCount = match.log ? match.log.length : 0;
                    console.log(`Deleting match ${id} with ${logCount} log entries`);
                }
                
                // Delete the match (log will be deleted automatically as it's part of the match object)
                // 删除比赛（日志会自动删除，因为它是比赛对象的一部分）
                const transaction = this.db.transaction(['matches'], 'readwrite');
                const store = transaction.objectStore('matches');
                const request = store.delete(id);

                request.onsuccess = () => {
                    try { localStorage.removeItem('pro_tracking_serve_' + id); } catch (e) {}
                    console.log('Match and log deleted:', id);
                    resolve();
                };

                request.onerror = () => {
                    console.error('Error deleting match:', request.error);
                    reject(request.error);
                };
            };
            
            readRequest.onerror = () => {
                // If we can't read, still try to delete
                // 如果无法读取，仍然尝试删除
                const transaction = this.db.transaction(['matches'], 'readwrite');
                const store = transaction.objectStore('matches');
                const request = store.delete(id);

                request.onsuccess = () => {
                    try { localStorage.removeItem('pro_tracking_serve_' + id); } catch (e) {}
                    console.log('Match deleted:', id);
                    resolve();
                };

                request.onerror = () => {
                    console.error('Error deleting match:', request.error);
                    reject(request.error);
                };
            };
        });
    }

    // Get setting
    // 获取设置
    async getSetting(key, defaultValue = null) {
        if (!this.db) await this.init();
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['settings'], 'readonly');
            const store = transaction.objectStore('settings');
            const request = store.get(key);

            request.onsuccess = () => {
                resolve(request.result ? request.result.value : defaultValue);
            };

            request.onerror = () => {
                console.error('Error getting setting:', request.error);
                reject(request.error);
            };
        });
    }

    // Save setting
    // 保存设置
    async saveSetting(key, value) {
        if (!this.db) await this.init();
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['settings'], 'readwrite');
            const store = transaction.objectStore('settings');
            const request = store.put({ key, value });

            request.onsuccess = () => {
                resolve();
            };

            request.onerror = () => {
                console.error('Error saving setting:', request.error);
                reject(request.error);
            };
        });
    }

    // Export all data
    // 导出所有数据
    async exportData() {
        const players = await this.getAllPlayers();
        const matches = await this.getAllMatches();
        
        return {
            players,
            matches,
            exportDate: new Date().toISOString(),
            version: '1.0'
        };
    }

    // Import data with smart merge (won't overwrite newer local data)
    // 导入数据并智能合并（不会覆盖较新的本地数据）
    async importData(data) {
        try {
            let playersAdded = 0;
            let playersUpdated = 0;
            let playersSkipped = 0;
            let matchesAdded = 0;
            let matchesUpdated = 0;
            let matchesSkipped = 0;

            // Import players with smart merge
            // 导入玩家并智能合并
            if (data.players && Array.isArray(data.players)) {
                for (const player of data.players) {
                    const existingPlayer = await this.getPlayer(player.id);
                    
                    if (!existingPlayer) {
                        // New player - add it
                        // 新玩家 - 添加
                        await this.savePlayer(player);
                        playersAdded++;
                    } else {
                        // Player exists - compare timestamps and keep the newer one
                        // 玩家已存在 - 比较时间戳，保留较新的
                        const existingTime = new Date(existingPlayer.updatedAt || existingPlayer.createdAt || 0);
                        const importTime = new Date(player.updatedAt || player.createdAt || 0);
                        
                        if (importTime > existingTime) {
                            // Imported player is newer - update
                            // 导入的玩家较新 - 更新
                            await this.savePlayer(player);
                            playersUpdated++;
                        } else {
                            // Local player is newer or same - skip
                            // 本地玩家较新或相同 - 跳过
                            playersSkipped++;
                        }
                    }
                }
            }

            // Import matches with smart merge
            // 导入比赛并智能合并
            if (data.matches && Array.isArray(data.matches)) {
                for (const match of data.matches) {
                    const existingMatch = await this.getMatch(match.id);
                    
                    if (!existingMatch) {
                        // New match - add it
                        // 新比赛 - 添加
                        await this.saveMatch(match);
                        matchesAdded++;
                    } else {
                        // Match exists - compare timestamps and keep the newer one
                        // 比赛已存在 - 比较时间戳，保留较新的
                        const existingTime = new Date(existingMatch.updatedAt || existingMatch.startTime || 0);
                        const importTime = new Date(match.updatedAt || match.startTime || 0);
                        
                        if (importTime > existingTime) {
                            // Imported match is newer - update
                            // 导入的比赛较新 - 更新
                            await this.saveMatch(match);
                            matchesUpdated++;
                        } else {
                            // Local match is newer or same - skip
                            // 本地比赛较新或相同 - 跳过
                            matchesSkipped++;
                        }
                    }
                }
            }

            console.log('Data imported successfully:', {
                players: { added: playersAdded, updated: playersUpdated, skipped: playersSkipped },
                matches: { added: matchesAdded, updated: matchesUpdated, skipped: matchesSkipped }
            });
            
            return {
                players: { added: playersAdded, updated: playersUpdated, skipped: playersSkipped },
                matches: { added: matchesAdded, updated: matchesUpdated, skipped: matchesSkipped }
            };
        } catch (error) {
            console.error('Error importing data:', error);
            throw error;
        }
    }

    // Pro Tracking Serve log (localStorage, per match)
    // Pro Tracking 发球落点日志（localStorage，按比赛）
    getProTrackingServeLog(matchId) {
        if (!matchId) return [];
        try {
            const raw = localStorage.getItem('pro_tracking_serve_' + matchId);
            if (!raw) return [];
            const arr = JSON.parse(raw);
            return Array.isArray(arr) ? arr : [];
        } catch (e) {
            return [];
        }
    }

    appendProTrackingServeEntry(matchId, entry) {
        if (!matchId) return;
        const log = this.getProTrackingServeLog(matchId);
        log.push(entry);
        try {
            localStorage.setItem('pro_tracking_serve_' + matchId, JSON.stringify(log));
        } catch (e) {
            console.error('Failed to append pro tracking serve entry:', e);
        }
    }

    removeLastProTrackingServeEntry(matchId) {
        if (!matchId) return;
        const log = this.getProTrackingServeLog(matchId);
        if (log.length === 0) return;
        log.pop();
        try {
            localStorage.setItem('pro_tracking_serve_' + matchId, JSON.stringify(log));
        } catch (e) {
            console.error('Failed to remove last pro tracking serve entry:', e);
        }
    }
}

// Create global storage instance
// 创建全局存储实例
const storage = new StorageService();

