/**
 * D&D Beyond Content Script
 * Injected into D&D Beyond character sheet pages to extract character data
 * and provide integration with VTTless
 */

console.log('🎲 VTTless D&D Beyond integration loaded');

class DNDBeyondIntegration {
    constructor() {
        this.parser = new CharacterParser();
        this.isInitialized = false;
        this.characterData = null;
        this.syncButton = null;
        
        this.init();
    }

    async init() {
        if (this.isInitialized) return;
        
        console.log('🎯 Initializing D&D Beyond integration...');
        
        // Wait for page to fully load
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setup());
        } else {
            this.setup();
        }
        
        this.isInitialized = true;
    }

    setup() {
        // Only run on character sheet pages
        if (!this.parser.isCharacterSheetPage()) {
            console.log('❌ Not on a character sheet page, skipping setup');
            return;
        }

        console.log('🔧 Setting up D&D Beyond integration UI...');
        
        // Wait a bit for D&D Beyond's dynamic content to load
        setTimeout(() => {
            this.injectIntegrationUI();
            this.setupEventListeners();
            this.parseInitialCharacterData();
        }, 2000);
    }

    /**
     * Inject VTTless integration UI into the D&D Beyond page
     */
    injectIntegrationUI() {
        try {
            // Find a good place to inject our UI (character header area)
            const headerSelectors = [
                '.ddbc-character-tidbits',
                '.character-tidbits-box',
                '.ddbc-character-header'
            ];

            let headerElement = null;
            for (const selector of headerSelectors) {
                headerElement = document.querySelector(selector);
                if (headerElement) break;
            }

            if (!headerElement) {
                console.log('❌ Could not find header element to inject UI');
                return;
            }

            // Create VTTless integration panel
            const integrationPanel = this.createIntegrationPanel();
            
            // Insert the panel after the header
            headerElement.parentNode.insertBefore(integrationPanel, headerElement.nextSibling);
            
            console.log('✅ VTTless integration UI injected successfully');
            
        } catch (error) {
            console.error('❌ Error injecting integration UI:', error);
        }
    }

    /**
     * Create the VTTless integration panel
     */
    createIntegrationPanel() {
        const panel = document.createElement('div');
        panel.className = 'vttless-integration-panel';
        panel.style.cssText = `
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border: 2px solid #4f46e5;
            border-radius: 12px;
            padding: 16px;
            margin: 16px 0;
            color: white;
            font-family: Arial, sans-serif;
            box-shadow: 0 4px 12px rgba(79, 70, 229, 0.3);
        `;

        panel.innerHTML = `
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;">
                <div style="display: flex; align-items: center;">
                    <div style="width: 24px; height: 24px; background: white; border-radius: 4px; margin-right: 8px; display: flex; align-items: center; justify-content: center;">
                        🎲
                    </div>
                    <h3 style="margin: 0; font-size: 18px; font-weight: bold;">VTTless Integration</h3>
                </div>
                <div id="vttless-connection-status" style="padding: 4px 8px; border-radius: 4px; background: rgba(255,255,255,0.2); font-size: 12px;">
                    Checking connection...
                </div>
            </div>
            
            <div style="margin-bottom: 12px;">
                <p style="margin: 0 0 8px 0; font-size: 14px; opacity: 0.9;">
                    Sync your D&D Beyond character with VTTless for seamless virtual tabletop gaming.
                </p>
            </div>
            
            <div style="display: flex; gap: 8px; align-items: center;">
                <button id="vttless-sync-character" style="
                    background: rgba(255,255,255,0.2);
                    border: 1px solid rgba(255,255,255,0.3);
                    color: white;
                    padding: 8px 16px;
                    border-radius: 6px;
                    cursor: pointer;
                    font-weight: bold;
                    transition: all 0.2s;
                " onmouseover="this.style.background='rgba(255,255,255,0.3)'" 
                   onmouseout="this.style.background='rgba(255,255,255,0.2)'">
                    🔄 Sync Character
                </button>
                
                <button id="vttless-auto-sync-toggle" style="
                    background: rgba(255,255,255,0.1);
                    border: 1px solid rgba(255,255,255,0.2);
                    color: white;
                    padding: 8px 12px;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 12px;
                    transition: all 0.2s;
                " onmouseover="this.style.background='rgba(255,255,255,0.2)'" 
                   onmouseout="this.style.background='rgba(255,255,255,0.1)'">
                    Auto-sync: OFF
                </button>
                
                <div id="vttless-sync-status" style="flex: 1; text-align: right; font-size: 12px; opacity: 0.8;">
                    Ready to sync
                </div>
            </div>
        `;

        return panel;
    }

    /**
     * Setup event listeners for the integration UI
     */
    setupEventListeners() {
        // Sync character button
        const syncButton = document.getElementById('vttless-sync-character');
        if (syncButton) {
            syncButton.addEventListener('click', () => this.syncCharacter());
        }

        // Auto-sync toggle
        const autoSyncToggle = document.getElementById('vttless-auto-sync-toggle');
        if (autoSyncToggle) {
            autoSyncToggle.addEventListener('click', () => this.toggleAutoSync());
        }

        // Listen for page changes (D&D Beyond uses SPA routing)
        this.setupPageChangeListener();

        // Listen for messages from popup/background
        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
            this.handleMessage(message, sender, sendResponse);
        });
    }

    /**
     * Parse character data initially and periodically
     */
    parseInitialCharacterData() {
        console.log('📋 Parsing initial character data...');
        this.characterData = this.parser.parseCharacterSheet();
        
        if (this.characterData) {
            console.log('✅ Character data parsed:', this.characterData.name);
            this.updateSyncStatus('Character data loaded');
            
            // Store in extension storage for popup access
            chrome.storage.local.set({
                currentCharacter: this.characterData,
                lastParsed: Date.now()
            });
        } else {
            console.log('❌ Failed to parse character data');
            this.updateSyncStatus('Failed to parse character', 'error');
        }
    }

    /**
     * Sync character with VTTless
     */
    async syncCharacter() {
        console.log('🔄 Starting character sync...');
        this.updateSyncStatus('Syncing...', 'loading');

        try {
            // Re-parse character data to get latest
            this.characterData = this.parser.parseCharacterSheet();
            
            if (!this.characterData) {
                throw new Error('Could not parse character data');
            }

            // Send character data to VTTless via background script
            const response = await chrome.runtime.sendMessage({
                action: 'SYNC_CHARACTER',
                characterData: this.characterData
            });

            if (response.success) {
                console.log('✅ Character synced successfully');
                this.updateSyncStatus('Synced successfully!', 'success');
                
                // Update stored data
                chrome.storage.local.set({
                    currentCharacter: this.characterData,
                    lastSynced: Date.now()
                });
                
                setTimeout(() => {
                    this.updateSyncStatus('Ready to sync');
                }, 3000);
            } else {
                throw new Error(response.error || 'Sync failed');
            }

        } catch (error) {
            console.error('❌ Character sync failed:', error);
            this.updateSyncStatus('Sync failed', 'error');
            
            setTimeout(() => {
                this.updateSyncStatus('Ready to sync');
            }, 5000);
        }
    }

    /**
     * Toggle auto-sync functionality
     */
    async toggleAutoSync() {
        const toggle = document.getElementById('vttless-auto-sync-toggle');
        const storage = await chrome.storage.local.get(['autoSyncEnabled']);
        const isEnabled = !storage.autoSyncEnabled;
        
        await chrome.storage.local.set({ autoSyncEnabled: isEnabled });
        
        toggle.textContent = `Auto-sync: ${isEnabled ? 'ON' : 'OFF'}`;
        toggle.style.background = isEnabled ? 'rgba(34, 197, 94, 0.3)' : 'rgba(255,255,255,0.1)';
        
        if (isEnabled) {
            this.startAutoSync();
        } else {
            this.stopAutoSync();
        }
    }

    /**
     * Start auto-sync polling
     */
    startAutoSync() {
        if (this.autoSyncInterval) return;
        
        console.log('🔄 Starting auto-sync...');
        this.autoSyncInterval = setInterval(() => {
            this.syncCharacter();
        }, 30000); // Sync every 30 seconds
    }

    /**
     * Stop auto-sync polling
     */
    stopAutoSync() {
        if (this.autoSyncInterval) {
            clearInterval(this.autoSyncInterval);
            this.autoSyncInterval = null;
            console.log('⏹️ Auto-sync stopped');
        }
    }

    /**
     * Update sync status in the UI
     */
    updateSyncStatus(message, type = 'normal') {
        const statusElement = document.getElementById('vttless-sync-status');
        if (!statusElement) return;

        statusElement.textContent = message;
        
        const colors = {
            normal: 'rgba(255,255,255,0.8)',
            success: '#10b981',
            error: '#ef4444',
            loading: '#f59e0b'
        };
        
        statusElement.style.color = colors[type] || colors.normal;
    }

    /**
     * Setup listener for page changes in SPA
     */
    setupPageChangeListener() {
        let lastUrl = location.href;
        
        new MutationObserver(() => {
            const url = location.href;
            if (url !== lastUrl) {
                lastUrl = url;
                console.log('📄 Page changed, re-initializing...');
                
                // Wait for new content to load
                setTimeout(() => {
                    if (this.parser.isCharacterSheetPage()) {
                        this.parseInitialCharacterData();
                    }
                }, 1000);
            }
        }).observe(document, { subtree: true, childList: true });
    }

    /**
     * Handle messages from popup or background script
     */
    handleMessage(message, sender, sendResponse) {
        console.log('📨 Received message:', message);
        
        switch (message.action) {
            case 'GET_CHARACTER_DATA':
                sendResponse({
                    success: true,
                    characterData: this.characterData
                });
                break;
                
            case 'PARSE_CHARACTER':
                this.parseInitialCharacterData();
                sendResponse({ success: true });
                break;
                
            case 'SYNC_CHARACTER':
                this.syncCharacter().then(() => {
                    sendResponse({ success: true });
                }).catch(error => {
                    sendResponse({ success: false, error: error.message });
                });
                return true; // Async response
                
            default:
                sendResponse({ success: false, error: 'Unknown action' });
        }
    }
}

// Initialize the integration when script loads
const dndbeyondIntegration = new DNDBeyondIntegration();