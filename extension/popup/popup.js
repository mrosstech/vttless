/**
 * VTTless Extension Popup Script
 * Manages the extension popup interface and user interactions
 */

class VTTlessPopup {
    constructor() {
        this.settings = {};
        this.characterData = null;
        this.connectionStatus = false;
        
        this.init();
    }

    async init() {
        console.log('🎯 Initializing VTTless popup...');
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Load initial data
        await this.loadSettings();
        await this.checkConnection();
        await this.loadCharacterData();
        
        // Update UI
        this.updateUI();
        
        console.log('✅ VTTless popup initialized');
    }

    setupEventListeners() {
        // Action buttons
        document.getElementById('sync-character').addEventListener('click', () => this.syncCharacter());
        document.getElementById('parse-character').addEventListener('click', () => this.parseCharacter());
        document.getElementById('open-vttless').addEventListener('click', () => this.openVTTless());
        
        // Settings
        document.getElementById('vttless-url').addEventListener('change', (e) => this.updateSetting('vttlessUrl', e.target.value));
        document.getElementById('auto-sync').addEventListener('change', (e) => this.updateSetting('autoSyncEnabled', e.target.checked));
        document.getElementById('debug-mode').addEventListener('change', (e) => this.updateSetting('debugMode', e.target.checked));
        
        // Footer actions
        document.getElementById('test-connection').addEventListener('click', () => this.testConnection());
        document.getElementById('view-logs').addEventListener('click', () => this.viewLogs());
    }

    async loadSettings() {
        try {
            const response = await chrome.runtime.sendMessage({ action: 'GET_SETTINGS' });
            if (response.success) {
                this.settings = response.settings;
                this.updateSettingsUI();
            }
        } catch (error) {
            console.error('❌ Failed to load settings:', error);
        }
    }

    async checkConnection() {
        try {
            const response = await chrome.runtime.sendMessage({ action: 'GET_VTTLESS_CONNECTION' });
            this.connectionStatus = response.success;
            this.updateConnectionStatus(response);
        } catch (error) {
            console.error('❌ Failed to check connection:', error);
            this.connectionStatus = false;
            this.updateConnectionStatus({ success: false, error: error.message });
        }
    }

    async loadCharacterData() {
        try {
            // Try to get character data from current D&D Beyond tab
            const response = await chrome.runtime.sendMessage({ action: 'GET_CHARACTER_DATA' });
            if (response.success && response.characterData) {
                this.characterData = response.characterData;
                this.updateCharacterUI();
            } else {
                // Try to get cached character data
                const storage = await chrome.storage.local.get(['currentCharacter', 'lastParsed']);
                if (storage.currentCharacter) {
                    this.characterData = storage.currentCharacter;
                    this.updateCharacterUI();
                }
            }
        } catch (error) {
            console.error('❌ Failed to load character data:', error);
        }
    }

    async syncCharacter() {
        if (!this.characterData) {
            this.showError('No character data available to sync');
            return;
        }

        if (!this.connectionStatus) {
            this.showError('VTTless is not connected');
            return;
        }

        this.showLoading('Syncing character...');

        try {
            const response = await chrome.runtime.sendMessage({
                action: 'SYNC_CHARACTER',
                characterData: this.characterData
            });

            this.hideLoading();

            if (response.success) {
                this.showSuccess('Character synced successfully!');
                await this.updateSyncStatus();
            } else {
                this.showError(response.error || 'Sync failed');
            }
        } catch (error) {
            this.hideLoading();
            this.showError(error.message);
        }
    }

    async parseCharacter() {
        this.showLoading('Parsing character data...');

        try {
            // Get current active tab
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            
            if (!tab.url.includes('dndbeyond.com/characters/')) {
                throw new Error('Please navigate to a D&D Beyond character sheet');
            }

            // Send parse request to content script
            const response = await chrome.tabs.sendMessage(tab.id, {
                action: 'PARSE_CHARACTER'
            });

            this.hideLoading();

            if (response.success) {
                await this.loadCharacterData(); // Reload character data
                this.showSuccess('Character parsed successfully!');
            } else {
                this.showError(response.error || 'Parse failed');
            }
        } catch (error) {
            this.hideLoading();
            this.showError(error.message);
        }
    }

    async openVTTless() {
        const vttlessUrl = this.settings.vttlessUrl || 'http://localhost:3001';
        
        try {
            await chrome.tabs.create({ url: vttlessUrl });
            window.close(); // Close popup
        } catch (error) {
            this.showError('Failed to open VTTless');
        }
    }

    async updateSetting(key, value) {
        this.settings[key] = value;
        
        try {
            const response = await chrome.runtime.sendMessage({
                action: 'UPDATE_SETTINGS',
                settings: { [key]: value }
            });

            if (!response.success) {
                this.showError('Failed to save settings');
            } else {
                // Re-check connection if URL changed
                if (key === 'vttlessUrl') {
                    setTimeout(() => this.checkConnection(), 500);
                }
            }
        } catch (error) {
            this.showError('Failed to save settings');
        }
    }

    async testConnection() {
        this.showLoading('Testing connection...');

        try {
            const response = await chrome.runtime.sendMessage({ action: 'TEST_CONNECTION' });
            this.hideLoading();
            
            if (response.success) {
                this.showSuccess('Connection successful!');
                this.connectionStatus = true;
                this.updateConnectionStatus(response);
            } else {
                this.showError(response.error || 'Connection failed');
                this.connectionStatus = false;
                this.updateConnectionStatus(response);
            }
        } catch (error) {
            this.hideLoading();
            this.showError(error.message);
        }
    }

    viewLogs() {
        // Open Chrome extension console for debugging
        chrome.tabs.create({ url: 'chrome://extensions/?id=' + chrome.runtime.id });
    }

    updateUI() {
        this.updateSettingsUI();
        this.updateCharacterUI();
        this.updateSyncStatus();
    }

    updateSettingsUI() {
        document.getElementById('vttless-url').value = this.settings.vttlessUrl || '';
        document.getElementById('auto-sync').checked = this.settings.autoSyncEnabled || false;
        document.getElementById('debug-mode').checked = this.settings.debugMode || false;
    }

    updateCharacterUI() {
        const characterInfo = document.getElementById('character-info');
        const syncButton = document.getElementById('sync-character');

        if (this.characterData) {
            // Show character card
            characterInfo.innerHTML = `
                <div class="character-card">
                    <div class="character-avatar">
                        ${this.characterData.avatarUrl ? 
                            `<img src="${this.characterData.avatarUrl}" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;" alt="Character Avatar" />` :
                            this.characterData.name.charAt(0).toUpperCase()
                        }
                    </div>
                    <div class="character-details">
                        <h3>${this.characterData.name}</h3>
                        <p>Level ${this.characterData.level} ${this.characterData.class}</p>
                        <p>${this.characterData.race} • ${this.characterData.background}</p>
                        <p>HP: ${this.characterData.hitPoints?.current || 0}/${this.characterData.hitPoints?.max || 0} • AC: ${this.characterData.armorClass || 10}</p>
                    </div>
                </div>
            `;
            
            syncButton.disabled = !this.connectionStatus;
        } else {
            // Show placeholder
            characterInfo.innerHTML = `
                <div class="character-placeholder">
                    <div class="placeholder-icon">👤</div>
                    <p>No character detected</p>
                    <small>Open a D&D Beyond character sheet to get started</small>
                </div>
            `;
            
            syncButton.disabled = true;
        }
    }

    updateConnectionStatus(response) {
        const statusElement = document.getElementById('connection-status');
        const indicator = statusElement.querySelector('.status-indicator');
        const text = statusElement.querySelector('.status-text');

        if (response.success) {
            indicator.className = 'status-indicator connected';
            text.textContent = 'Connected';
        } else {
            indicator.className = 'status-indicator';
            text.textContent = 'Disconnected';
        }
    }

    async updateSyncStatus() {
        try {
            const storage = await chrome.storage.local.get(['lastSyncTime', 'lastSyncedCharacter']);
            
            const lastSyncElement = document.getElementById('last-sync');
            const characterCountElement = document.getElementById('character-count');
            
            if (storage.lastSyncTime) {
                const lastSync = new Date(storage.lastSyncTime);
                lastSyncElement.textContent = lastSync.toLocaleString();
            } else {
                lastSyncElement.textContent = 'Never';
            }
            
            // For now, show 1 if we have character data, 0 otherwise
            characterCountElement.textContent = this.characterData ? '1' : '0';
            
        } catch (error) {
            console.error('❌ Failed to update sync status:', error);
        }
    }

    showLoading(message) {
        const overlay = document.getElementById('loading-overlay');
        const text = document.getElementById('loading-text');
        text.textContent = message;
        overlay.classList.add('show');
    }

    hideLoading() {
        const overlay = document.getElementById('loading-overlay');
        overlay.classList.remove('show');
    }

    showSuccess(message) {
        this.showNotification(message, 'success');
    }

    showError(message) {
        this.showNotification(message, 'error');
    }

    showNotification(message, type) {
        // Simple notification - could be enhanced with a proper notification system
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 16px;
            left: 16px;
            right: 16px;
            padding: 12px;
            border-radius: 8px;
            color: white;
            font-weight: 500;
            z-index: 10001;
            background: ${type === 'success' ? '#10b981' : '#ef4444'};
            animation: slideDown 0.3s ease-out;
        `;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideUp 0.3s ease-in';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
}

// Add notification animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideDown {
        from {
            transform: translateY(-100%);
            opacity: 0;
        }
        to {
            transform: translateY(0);
            opacity: 1;
        }
    }
    
    @keyframes slideUp {
        from {
            transform: translateY(0);
            opacity: 1;
        }
        to {
            transform: translateY(-100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// Initialize popup when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => new VTTlessPopup());
} else {
    new VTTlessPopup();
}