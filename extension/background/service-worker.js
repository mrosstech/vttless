/**
 * VTTless D&D Beyond Integration - Background Service Worker
 * Handles communication between D&D Beyond, VTTless, and the extension popup
 */

console.log('🚀 VTTless extension background service worker loaded');

class VTTlessBackgroundService {
    constructor() {
        this.vttlessUrl = null;
        this.isConnected = false;
        this.setupEventListeners();
        this.initializeSettings();
    }

    setupEventListeners() {
        // Handle messages from content scripts and popup
        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
            this.handleMessage(message, sender, sendResponse);
            return true; // Enable async response
        });

        // Handle extension installation/startup
        chrome.runtime.onInstalled.addListener((details) => {
            this.handleInstallation(details);
        });

        // Handle tab updates to detect VTTless/D&D Beyond pages
        chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
            this.handleTabUpdate(tabId, changeInfo, tab);
        });
    }

    async initializeSettings() {
        console.log('⚙️ Initializing extension settings...');
        
        // Set default settings if not already set
        const settings = await chrome.storage.local.get([
            'vttlessUrl',
            'autoSyncEnabled',
            'syncInterval',
            'debugMode'
        ]);

        const defaults = {
            vttlessUrl: 'http://localhost:3001',
            autoSyncEnabled: false,
            syncInterval: 30000, // 30 seconds
            debugMode: false
        };

        const newSettings = { ...defaults, ...settings };
        await chrome.storage.local.set(newSettings);
        
        this.vttlessUrl = newSettings.vttlessUrl;
        console.log('✅ Settings initialized:', newSettings);
    }

    async handleMessage(message, sender, sendResponse) {
        console.log('📨 Background received message:', message.action, sender.tab?.url);

        try {
            switch (message.action) {
                case 'SYNC_CHARACTER':
                    await this.syncCharacterToVTTless(message.characterData, sendResponse);
                    break;

                case 'GET_VTTLESS_CONNECTION':
                    await this.checkVTTlessConnection(sendResponse);
                    break;

                case 'UPDATE_SETTINGS':
                    await this.updateSettings(message.settings, sendResponse);
                    break;

                case 'GET_SETTINGS':
                    await this.getSettings(sendResponse);
                    break;

                case 'TEST_CONNECTION':
                    await this.testVTTlessConnection(sendResponse);
                    break;

                case 'GET_CHARACTER_DATA':
                    await this.getCharacterDataFromTab(sendResponse);
                    break;

                default:
                    sendResponse({ success: false, error: 'Unknown action' });
            }
        } catch (error) {
            console.error('❌ Error handling message:', error);
            sendResponse({ success: false, error: error.message });
        }
    }

    async syncCharacterToVTTless(characterData, sendResponse) {
        console.log('🔄 Syncing character to VTTless:', characterData.name);

        try {
            // Check if VTTless is accessible
            const connectionCheck = await this.checkVTTlessConnection();
            if (!connectionCheck.success) {
                throw new Error('VTTless is not accessible. Make sure it\'s running and the URL is correct.');
            }

            // Find active VTTless tab or create one
            const vttlessTab = await this.findOrCreateVTTlessTab();
            
            // Send character data to VTTless tab
            await chrome.tabs.sendMessage(vttlessTab.id, {
                action: 'IMPORT_CHARACTER',
                characterData: characterData
            });

            // Store successful sync
            await chrome.storage.local.set({
                lastSyncedCharacter: characterData,
                lastSyncTime: Date.now()
            });

            sendResponse({ 
                success: true, 
                message: 'Character synced successfully to VTTless'
            });

        } catch (error) {
            console.error('❌ Failed to sync character:', error);
            sendResponse({ 
                success: false, 
                error: error.message
            });
        }
    }

    async checkVTTlessConnection(sendResponse) {
        console.log('🔍 Checking VTTless connection...');

        try {
            const settings = await chrome.storage.local.get('vttlessUrl');
            const vttlessUrl = settings.vttlessUrl || 'http://localhost:3001';
            console.log('🔗 Checking connection to:', vttlessUrl);

            // For localhost connections, we'll use a different approach
            // since CORS can be problematic with extensions
            let response;
            try {
                // First try the health endpoint
                response = await fetch(`${vttlessUrl}/health`, {
                    method: 'GET',
                    mode: 'no-cors' // Use no-cors for localhost
                });
                console.log('🏥 Health endpoint response:', response.status, response.type);
            } catch (healthError) {
                console.log('🏥 Health endpoint failed, trying main page:', healthError.message);
                // Fallback to main page
                try {
                    response = await fetch(vttlessUrl, { 
                        method: 'GET', 
                        mode: 'no-cors' 
                    });
                    console.log('🏠 Main page response:', response.status, response.type);
                } catch (mainError) {
                    console.log('🏠 Main page also failed:', mainError.message);
                    throw mainError;
                }
            }

            // With no-cors mode, we can't check response.ok, so we assume success if no error was thrown
            // For localhost, if the fetch doesn't throw an error, the server is likely running
            this.isConnected = true;
            
            const result = {
                success: true,
                url: vttlessUrl,
                status: response.status || 'no-cors',
                message: 'Connection successful'
            };

            console.log('✅ Connection check result:', result);
            if (sendResponse) sendResponse(result);
            return result;

        } catch (error) {
            console.error('❌ VTTless connection check failed:', error);
            this.isConnected = false;
            
            const result = {
                success: false,
                error: error.message,
                message: 'Make sure VTTless is running and accessible'
            };

            console.log('❌ Connection check failed result:', result);
            if (sendResponse) sendResponse(result);
            return result;
        }
    }

    async findOrCreateVTTlessTab() {
        const settings = await chrome.storage.local.get('vttlessUrl');
        const vttlessUrl = settings.vttlessUrl || 'http://localhost:3001';

        // Find existing VTTless tab
        const tabs = await chrome.tabs.query({ url: `${vttlessUrl}/*` });
        
        if (tabs.length > 0) {
            // Focus existing tab
            await chrome.tabs.update(tabs[0].id, { active: true });
            return tabs[0];
        } else {
            // Create new tab
            return await chrome.tabs.create({ url: vttlessUrl });
        }
    }

    async updateSettings(newSettings, sendResponse) {
        console.log('⚙️ Updating settings:', newSettings);

        try {
            await chrome.storage.local.set(newSettings);
            
            // Update internal state
            if (newSettings.vttlessUrl) {
                this.vttlessUrl = newSettings.vttlessUrl;
            }

            sendResponse({ success: true });
        } catch (error) {
            console.error('❌ Failed to update settings:', error);
            sendResponse({ success: false, error: error.message });
        }
    }

    async getSettings(sendResponse) {
        try {
            const settings = await chrome.storage.local.get([
                'vttlessUrl',
                'autoSyncEnabled',
                'syncInterval',
                'debugMode'
            ]);

            sendResponse({ success: true, settings });
        } catch (error) {
            console.error('❌ Failed to get settings:', error);
            sendResponse({ success: false, error: error.message });
        }
    }

    async testVTTlessConnection(sendResponse) {
        console.log('🧪 Testing VTTless connection...');
        
        const result = await this.checkVTTlessConnection();
        sendResponse(result);
    }

    async getCharacterDataFromTab(sendResponse) {
        try {
            // Find D&D Beyond character sheet tab
            const tabs = await chrome.tabs.query({ 
                url: 'https://www.dndbeyond.com/characters/*' 
            });

            if (tabs.length === 0) {
                throw new Error('No D&D Beyond character sheet tabs found');
            }

            // Get character data from the first found tab
            const characterData = await chrome.tabs.sendMessage(tabs[0].id, {
                action: 'GET_CHARACTER_DATA'
            });

            sendResponse({ 
                success: true, 
                characterData: characterData.characterData 
            });

        } catch (error) {
            console.error('❌ Failed to get character data:', error);
            sendResponse({ 
                success: false, 
                error: error.message 
            });
        }
    }

    handleInstallation(details) {
        console.log('📦 Extension installed/updated:', details.reason);

        if (details.reason === 'install') {
            // Open welcome page or setup
            chrome.tabs.create({
                url: chrome.runtime.getURL('popup/welcome.html')
            });
        }
    }

    handleTabUpdate(tabId, changeInfo, tab) {
        // Only process complete page loads
        if (changeInfo.status !== 'complete') return;

        const url = tab.url;
        if (!url) return;

        // Inject scripts into D&D Beyond character pages
        if (url.includes('dndbeyond.com/characters/')) {
            console.log('🎲 D&D Beyond character page detected, ensuring content script');
            this.ensureContentScriptInjected(tabId);
        }

        // Update VTTless connection status when VTTless tab loads
        if (url.includes('localhost:3000') || url.includes('vttless.com')) {
            console.log('🎯 VTTless page detected');
            this.checkVTTlessConnection();
        }
    }

    async ensureContentScriptInjected(tabId) {
        try {
            // Check if content script is already injected
            await chrome.tabs.sendMessage(tabId, { action: 'PING' });
        } catch (error) {
            // Content script not injected, inject it
            console.log('💉 Injecting content script into tab:', tabId);
            
            try {
                await chrome.scripting.executeScript({
                    target: { tabId },
                    files: ['shared/character-parser.js', 'content/dndbeyond-content.js']
                });

                await chrome.scripting.insertCSS({
                    target: { tabId },
                    files: ['content/dndbeyond-styles.css']
                });
            } catch (injectionError) {
                console.error('❌ Failed to inject content script:', injectionError);
            }
        }
    }
}

// Initialize the background service
const vttlessBackgroundService = new VTTlessBackgroundService();