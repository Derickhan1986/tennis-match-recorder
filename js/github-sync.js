//
//  GitHub Sync Service
//  GitHub同步服务
//
//  Handles synchronization with GitHub for data backup
//  处理与GitHub的同步以进行数据备份
//

class GitHubSync {
    constructor() {
        this.token = null;
        this.repo = null;
        this.owner = null;
    }

    // Initialize GitHub sync
    // 初始化GitHub同步
    async init() {
        this.token = await storage.getSetting('githubToken', '');
        this.repo = await storage.getSetting('githubRepo', '');
        
        // Extract owner from repo if format is "owner/repo"
        // 如果格式为"owner/repo"，从repo中提取owner
        if (this.repo.includes('/')) {
            const parts = this.repo.split('/');
            this.owner = parts[0];
            this.repo = parts[1];
        }
    }

    // Save GitHub settings
    // 保存GitHub设置
    async saveSettings() {
        const tokenInput = document.getElementById('github-token');
        const repoInput = document.getElementById('github-repo');
        
        if (tokenInput) {
            this.token = tokenInput.value.trim();
            await storage.saveSetting('githubToken', this.token);
        }
        
        if (repoInput) {
            const repoValue = repoInput.value.trim();
            this.repo = repoValue;
            await storage.saveSetting('githubRepo', repoValue);
            
            // Extract owner
            // 提取owner
            if (repoValue.includes('/')) {
                const parts = repoValue.split('/');
                this.owner = parts[0];
                this.repo = parts[1];
            }
        }
    }

    // Sync data to GitHub
    // 同步数据到GitHub
    async sync() {
        const statusEl = document.getElementById('sync-status');
        
        try {
            // Update settings
            // 更新设置
            await this.saveSettings();
            
            if (!this.token || !this.repo) {
                throw new Error('GitHub token and repository name are required');
            }
            
            if (statusEl) {
                statusEl.textContent = 'Syncing...';
                statusEl.className = 'success';
            }
            
            // Export data
            // 导出数据
            const data = await storage.exportData();
            
            // Create or update repository
            // 创建或更新仓库
            await this.ensureRepository();
            
            // Upload data files
            // 上传数据文件
            await this.uploadFile('data/players.json', JSON.stringify(data.players, null, 2));
            await this.uploadFile('data/matches.json', JSON.stringify(data.matches, null, 2));
            await this.uploadFile('data/metadata.json', JSON.stringify({
                exportDate: data.exportDate,
                version: data.version,
                lastSync: new Date().toISOString()
            }, null, 2));
            
            if (statusEl) {
                statusEl.textContent = 'Sync successful!';
                statusEl.className = 'success';
            }
            
            app.showToast('Data synced to GitHub', 'success');
        } catch (error) {
            console.error('Error syncing to GitHub:', error);
            if (statusEl) {
                statusEl.textContent = `Error: ${error.message}`;
                statusEl.className = 'error';
            }
            app.showToast('Sync failed: ' + error.message, 'error');
        }
    }

    // Ensure repository exists
    // 确保仓库存在
    async ensureRepository() {
        try {
            // Try to get repository
            // 尝试获取仓库
            const response = await fetch(`https://api.github.com/repos/${this.owner || 'your-username'}/${this.repo}`, {
                headers: {
                    'Authorization': `token ${this.token}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            });
            
            if (response.status === 404) {
                // Repository doesn't exist, create it
                // 仓库不存在，创建它
                await this.createRepository();
            } else if (!response.ok) {
                throw new Error(`GitHub API error: ${response.statusText}`);
            }
        } catch (error) {
            // If owner is not set, we can't create repo
            // 如果未设置owner，无法创建仓库
            if (!this.owner) {
                throw new Error('Please set repository as "username/repo-name"');
            }
            throw error;
        }
    }

    // Create repository
    // 创建仓库
    async createRepository() {
        const response = await fetch('https://api.github.com/user/repos', {
            method: 'POST',
            headers: {
                'Authorization': `token ${this.token}`,
                'Accept': 'application/vnd.github.v3+json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name: this.repo,
                private: true,
                description: 'Tennis Match Recorder Data'
            })
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to create repository');
        }
        
        const repoData = await response.json();
        this.owner = repoData.owner.login;
    }

    // Upload file to GitHub
    // 上传文件到GitHub
    async uploadFile(path, content) {
        // Get file SHA if exists
        // 如果存在，获取文件SHA
        let sha = null;
        try {
            const getResponse = await fetch(`https://api.github.com/repos/${this.owner}/${this.repo}/contents/${path}`, {
                headers: {
                    'Authorization': `token ${this.token}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            });
            
            if (getResponse.ok) {
                const fileData = await getResponse.json();
                sha = fileData.sha;
            }
        } catch (error) {
            // File doesn't exist, that's okay
            // 文件不存在，没关系
        }
        
        // Upload file
        // 上传文件
        const contentBase64 = btoa(unescape(encodeURIComponent(content)));
        const body = {
            message: `Update ${path}`,
            content: contentBase64,
            branch: 'main'
        };
        
        if (sha) {
            body.sha = sha;
        }
        
        const response = await fetch(`https://api.github.com/repos/${this.owner}/${this.repo}/contents/${path}`, {
            method: 'PUT',
            headers: {
                'Authorization': `token ${this.token}`,
                'Accept': 'application/vnd.github.v3+json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || `Failed to upload ${path}`);
        }
    }

    // Pull data from GitHub
    // 从GitHub拉取数据
    async pull() {
        const statusEl = document.getElementById('sync-status');
        
        try {
            await this.init();
            
            if (!this.token || !this.repo) {
                throw new Error('GitHub token and repository name are required');
            }
            
            if (statusEl) {
                statusEl.textContent = 'Downloading data from GitHub...';
                statusEl.className = 'success';
            }
            
            // Download files
            // 下载文件
            const playersResponse = await fetch(`https://api.github.com/repos/${this.owner || 'your-username'}/${this.repo}/contents/data/players.json`, {
                headers: {
                    'Authorization': `token ${this.token}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            });
            
            const matchesResponse = await fetch(`https://api.github.com/repos/${this.owner || 'your-username'}/${this.repo}/contents/data/matches.json`, {
                headers: {
                    'Authorization': `token ${this.token}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            });
            
            if (!playersResponse.ok) {
                if (playersResponse.status === 404) {
                    throw new Error('Players data not found on GitHub. Please sync data first.');
                }
                throw new Error(`Failed to download players data: ${playersResponse.statusText}`);
            }
            
            if (!matchesResponse.ok) {
                if (matchesResponse.status === 404) {
                    throw new Error('Matches data not found on GitHub. Please sync data first.');
                }
                throw new Error(`Failed to download matches data: ${matchesResponse.statusText}`);
            }
            
            const playersData = await playersResponse.json();
            const matchesData = await matchesResponse.json();
            
            // Decode base64 content
            // 解码base64内容
            const players = JSON.parse(atob(playersData.content.replace(/\s/g, '')));
            const matches = JSON.parse(atob(matchesData.content.replace(/\s/g, '')));
            
            if (statusEl) {
                statusEl.textContent = 'Importing data...';
                statusEl.className = 'success';
            }
            
            // Import data (this will merge with existing data)
            // 导入数据（这将与现有数据合并）
            await storage.importData({ players, matches });
            
            if (statusEl) {
                statusEl.textContent = 'Data pulled successfully!';
                statusEl.className = 'success';
            }
            
            app.showToast('Data pulled from GitHub successfully', 'success');
        } catch (error) {
            console.error('Error pulling from GitHub:', error);
            if (statusEl) {
                statusEl.textContent = `Error: ${error.message}`;
                statusEl.className = 'error';
            }
            app.showToast('Pull failed: ' + error.message, 'error');
            throw error;
        }
    }
}

// Create global GitHub sync instance
// 创建全局GitHub同步实例
const githubSync = new GitHubSync();

