//
//  Player Manager
//  玩家管理器
//
//  Handles player CRUD operations and UI
//  处理玩家CRUD操作和UI
//

class PlayerManager {
    constructor() {
        this.currentPlayer = null;
        this.setupEventListeners();
    }

    // Setup event listeners
    // 设置事件监听器
    setupEventListeners() {
        // Player form submission
        // 玩家表单提交
        const playerForm = document.getElementById('player-form');
        if (playerForm) {
            playerForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.savePlayer();
            });
        }
    }

    // Load and display all players
    // 加载并显示所有玩家
    async loadPlayers() {
        try {
            const players = await storage.getAllPlayers();
            this.renderPlayers(players);
        } catch (error) {
            console.error('Error loading players:', error);
            app.showToast('Error loading players', 'error');
        }
    }

    // Render players list
    // 渲染玩家列表
    renderPlayers(players) {
        const container = document.getElementById('players-list');
        const emptyState = document.getElementById('players-empty');
        
        if (!container) return;
        
        if (players.length === 0) {
            container.innerHTML = '';
            if (emptyState) emptyState.classList.remove('hidden');
            return;
        }
        
        if (emptyState) emptyState.classList.add('hidden');
        
        container.innerHTML = players.map(player => {
            const utrText = player.utrRating ? `UTR: ${player.utrRating}` : 'No UTR';
            return `
                <div class="player-card" data-player-id="${player.id}">
                    <div class="player-header">
                        <div>
                            <div class="player-name">${this.escapeHtml(player.name)}</div>
                            <div class="player-info">
                                ${player.handedness === 'righty' ? 'Righty' : 'Lefty'} | 
                                ${player.backhandPreference} | 
                                ${utrText}
                            </div>
                        </div>
                        <div class="player-actions">
                            <button class="btn-icon" onclick="playerManager.editPlayer('${player.id}')" title="Edit">✏️</button>
                            <button class="btn-icon" onclick="playerManager.deletePlayer('${player.id}')" title="Delete">🗑️</button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    // Show new player form
    // 显示新玩家表单
    showNewPlayerForm() {
        this.currentPlayer = null;
        const title = document.getElementById('player-form-title');
        if (title) title.textContent = 'Add Player';
        
        // Reset form
        // 重置表单
        document.getElementById('player-name').value = '';
        document.getElementById('player-handedness').value = 'righty';
        document.getElementById('player-backhand').value = 'Single Hand';
        document.getElementById('player-utr').value = '';
        
        app.showPage('player-form');
    }

    // Edit player
    // 编辑玩家
    async editPlayer(playerId) {
        try {
            const player = await storage.getPlayer(playerId);
            if (!player) {
                app.showToast('Player not found', 'error');
                return;
            }
            
            this.currentPlayer = player;
            const title = document.getElementById('player-form-title');
            if (title) title.textContent = 'Edit Player';
            
            // Fill form
            // 填充表单
            document.getElementById('player-name').value = player.name;
            document.getElementById('player-handedness').value = player.handedness;
            document.getElementById('player-backhand').value = player.backhandPreference;
            document.getElementById('player-utr').value = player.utrRating || '';
            
            app.showPage('player-form');
        } catch (error) {
            console.error('Error loading player:', error);
            app.showToast('Error loading player', 'error');
        }
    }

    // Save player
    // 保存玩家
    async savePlayer() {
        try {
            const name = document.getElementById('player-name').value.trim();
            const handedness = document.getElementById('player-handedness').value;
            const backhand = document.getElementById('player-backhand').value;
            const utr = document.getElementById('player-utr').value;
            
            if (!name) {
                app.showToast('Name is required', 'error');
                return;
            }
            
            // Validate UTR rating if provided
            // 如果提供了UTR rating，验证它
            let utrRating = null;
            if (utr && utr.trim() !== '') {
                const utrValue = parseFloat(utr);
                if (isNaN(utrValue)) {
                    app.showToast('UTR rating must be a valid number', 'error');
                    return;
                }
                if (utrValue < 0 || utrValue > 16) {
                    app.showToast('UTR rating must be between 0 and 16', 'error');
                    return;
                }
                // Check decimal places
                // 检查小数位数
                const decimalPlaces = (utr.split('.')[1] || '').length;
                if (decimalPlaces > 2) {
                    app.showToast('UTR rating must have at most 2 decimal places', 'error');
                    return;
                }
                // Round to 2 decimal places
                // 四舍五入到两位小数
                utrRating = Math.round(utrValue * 100) / 100;
            }
            
            let player;
            if (this.currentPlayer) {
                // Update existing player
                // 更新现有玩家
                player = createPlayer({
                    ...this.currentPlayer,
                    name: name,
                    handedness: handedness,
                    backhandPreference: backhand,
                    utrRating: utrRating
                });
            } else {
                // Create new player
                // 创建新玩家
                player = createPlayer({
                    name: name,
                    handedness: handedness,
                    backhandPreference: backhand,
                    utrRating: utrRating
                });
            }
            
            validatePlayer(player);
            await storage.savePlayer(player);
            
            app.showToast(this.currentPlayer ? 'Player updated' : 'Player added', 'success');
            await this.loadPlayers();
            app.showPage('players');
        } catch (error) {
            console.error('Error saving player:', error);
            app.showToast(error.message || 'Error saving player', 'error');
        }
    }

    // Delete player
    // 删除玩家
    async deletePlayer(playerId) {
        if (!confirm('Are you sure you want to delete this player?')) {
            return;
        }
        
        try {
            await storage.deletePlayer(playerId);
            app.showToast('Player deleted', 'success');
            await this.loadPlayers();
        } catch (error) {
            console.error('Error deleting player:', error);
            app.showToast('Error deleting player', 'error');
        }
    }

    // Escape HTML
    // 转义HTML
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Create global player manager instance
// 创建全局玩家管理器实例
const playerManager = new PlayerManager();

