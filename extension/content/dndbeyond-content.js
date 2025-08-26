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
            // Find the character header desktop area
            const headerDesktop = document.querySelector('.ct-character-header-desktop');
            
            if (!headerDesktop) {
                console.log('❌ Could not find character header desktop element');
                return;
            }

            // Create VTTless integration button group and insert before the builder group
            const builderGroup = headerDesktop.querySelector('.ct-character-header-desktop__group--builder');
            const vttlessGroup = this.createCompactIntegrationButton();
            
            if (builderGroup) {
                headerDesktop.insertBefore(vttlessGroup, builderGroup);
            } else {
                // Fallback: append to end of header desktop
                headerDesktop.appendChild(vttlessGroup);
            }
            
            console.log('✅ VTTless integration button injected successfully');
            
        } catch (error) {
            console.error('❌ Error injecting integration UI:', error);
        }
    }

    /**
     * Create a compact VTTless integration button similar to Share button
     */
    createCompactIntegrationButton() {
        // Create the button group container
        const group = document.createElement('div');
        group.className = 'ct-character-header-desktop__group ct-character-header-desktop__group--vttless';
        
        // Create the button container
        const buttonContainer = document.createElement('div');
        buttonContainer.className = 'ct-character-header-desktop__button';
        buttonContainer.setAttribute('role', 'button');
        buttonContainer.setAttribute('tabindex', '0');
        buttonContainer.style.cursor = 'pointer';
        buttonContainer.style.position = 'relative';
        
        // Create the VTTless icon (SVG similar to share icon style)
        const iconContainer = document.createElement('div');
        iconContainer.className = 'ct-character-header-desktop__button-icon';
        
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
        svg.setAttribute('viewBox', '0 0 50 50');
        svg.setAttribute('class', 'ddbc-svg ddbc-vttless-svg ddbc-svg--themed');
        
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('fill', '#C53131');
        path.setAttribute('d', 'M25,5 C30,5 35,8 38,13 L45,13 C47,13 47,17 45,17 L38,17 C35,22 30,25 25,25 C20,25 15,22 12,17 L5,17 C3,17 3,13 5,13 L12,13 C15,8 20,5 25,5 Z M25,8 C21.5,8 18.5,10.5 18.5,14 C18.5,17.5 21.5,20 25,20 C28.5,20 31.5,17.5 31.5,14 C31.5,10.5 28.5,8 25,8 Z M25,11 C26.5,11 28,12 28,14 C28,16 26.5,17 25,17 C23.5,17 22,16 22,14 C22,12 23.5,11 25,11 Z M15,30 L35,30 C37,30 37,34 35,34 L15,34 C13,34 13,30 15,30 Z M10,38 L40,38 C42,38 42,42 40,42 L10,42 C8,42 8,38 10,38 Z');
        
        svg.appendChild(path);
        iconContainer.appendChild(svg);
        
        // Create the button label
        const label = document.createElement('span');
        label.className = 'ct-character-header-desktop__button-label';
        label.textContent = 'Sync';
        
        // Assemble the button
        buttonContainer.appendChild(iconContainer);
        buttonContainer.appendChild(label);
        
        // Create the hover panel (initially hidden)
        const hoverPanel = this.createHoverPanel();
        buttonContainer.appendChild(hoverPanel);
        
        group.appendChild(buttonContainer);
        
        // Add event listeners
        this.setupCompactButtonEvents(buttonContainer, hoverPanel);
        
        return group;
    }
    
    /**
     * Create the hover panel with full controls
     */
    createHoverPanel() {
        const panel = document.createElement('div');
        panel.className = 'vttless-hover-panel';
        panel.style.cssText = `
            position: absolute;
            top: 100%;
            left: 50%;
            transform: translateX(-50%);
            margin-top: 8px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border: 2px solid #4f46e5;
            border-radius: 12px;
            padding: 16px;
            color: white;
            font-family: Arial, sans-serif;
            box-shadow: 0 4px 20px rgba(79, 70, 229, 0.4);
            width: 320px;
            z-index: 1000;
            display: none;
            pointer-events: auto;
        `;

        panel.innerHTML = `
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;">
                <div style="display: flex; align-items: center;">
                    <div style="width: 24px; height: 24px; background: white; border-radius: 4px; margin-right: 8px; display: flex; align-items: center; justify-content: center;">
                        🎲
                    </div>
                    <h3 style="margin: 0; font-size: 16px; font-weight: bold;">VTTless Integration</h3>
                </div>
                <div id="vttless-connection-status" style="padding: 4px 8px; border-radius: 4px; background: rgba(255,255,255,0.2); font-size: 11px;">
                    Ready
                </div>
            </div>
            
            <div style="margin-bottom: 12px;">
                <p style="margin: 0 0 8px 0; font-size: 13px; opacity: 0.9; line-height: 1.3;">
                    Sync your D&D Beyond character with VTTless for seamless virtual tabletop gaming.
                </p>
            </div>
            
            <div style="display: flex; gap: 8px; align-items: center; flex-wrap: wrap;">
                <button id="vttless-sync-character" style="
                    background: rgba(255,255,255,0.2);
                    border: 1px solid rgba(255,255,255,0.3);
                    color: white;
                    padding: 8px 16px;
                    border-radius: 6px;
                    cursor: pointer;
                    font-weight: bold;
                    font-size: 12px;
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
                    font-size: 11px;
                    transition: all 0.2s;
                " onmouseover="this.style.background='rgba(255,255,255,0.2)'" 
                   onmouseout="this.style.background='rgba(255,255,255,0.1)'">
                    Auto-sync: OFF
                </button>
            </div>
            
            <div id="vttless-sync-status" style="text-align: center; font-size: 11px; opacity: 0.8; margin-top: 8px;">
                Ready to sync
            </div>
        `;

        return panel;
    }
    
    /**
     * Setup events for the compact button
     */
    setupCompactButtonEvents(button, panel) {
        let hoverTimeout;
        let isHovering = false;
        
        // Show panel on hover
        button.addEventListener('mouseenter', () => {
            isHovering = true;
            clearTimeout(hoverTimeout);
            panel.style.display = 'block';
        });
        
        // Hide panel when leaving button area
        button.addEventListener('mouseleave', () => {
            isHovering = false;
            hoverTimeout = setTimeout(() => {
                if (!isHovering) {
                    panel.style.display = 'none';
                }
            }, 300); // Small delay to allow moving to panel
        });
        
        // Keep panel open when hovering over it
        panel.addEventListener('mouseenter', () => {
            isHovering = true;
            clearTimeout(hoverTimeout);
        });
        
        panel.addEventListener('mouseleave', () => {
            isHovering = false;
            hoverTimeout = setTimeout(() => {
                panel.style.display = 'none';
            }, 300);
        });
        
        // Quick sync on click
        button.addEventListener('click', (e) => {
            if (e.target.closest('#vttless-sync-character, #vttless-auto-sync-toggle')) {
                return; // Don't trigger quick sync if clicking on panel buttons
            }
            this.syncCharacter();
        });
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
    handleMessage(message, _sender, sendResponse) {
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