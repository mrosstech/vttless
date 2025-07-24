/**
 * VTTless Content Script
 * Injected into VTTless pages to receive character data from D&D Beyond
 * and integrate it with the VTT's character system
 */

console.log('🎯 VTTless content script loaded');

class VTTlessIntegration {
    constructor() {
        this.isInitialized = false;
        this.init();
    }

    async init() {
        if (this.isInitialized) return;
        
        console.log('⚙️ Initializing VTTless integration...');
        
        // Wait for VTTless to fully load
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setup());
        } else {
            this.setup();
        }
        
        this.isInitialized = true;
    }

    setup() {
        console.log('🔧 Setting up VTTless integration...');
        
        // Setup message listener for character import
        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
            this.handleMessage(message, sender, sendResponse);
            return true; // Enable async response
        });

        // Add notification area for character imports
        this.createNotificationArea();
        
        // Check if we're in a campaign/play page where character import makes sense
        this.detectCampaignContext();
    }

    /**
     * Handle messages from the extension background script
     */
    async handleMessage(message, sender, sendResponse) {
        console.log('📨 VTTless received message:', message.action);

        try {
            switch (message.action) {
                case 'IMPORT_CHARACTER':
                    await this.importCharacter(message.characterData, sendResponse);
                    break;
                    
                case 'PING':
                    sendResponse({ success: true, status: 'VTTless content script active' });
                    break;
                    
                default:
                    sendResponse({ success: false, error: 'Unknown action' });
            }
        } catch (error) {
            console.error('❌ Error handling message in VTTless:', error);
            sendResponse({ success: false, error: error.message });
        }
    }

    /**
     * Import character data from D&D Beyond into VTTless
     */
    async importCharacter(characterData, sendResponse) {
        console.log('📥 Importing character:', characterData.name);
        
        try {
            // Show import notification
            this.showNotification(`Importing ${characterData.name} from D&D Beyond...`, 'info');
            
            // Check if we're on a campaign page
            const campaignId = this.extractCampaignId();
            if (!campaignId) {
                throw new Error('Please navigate to a campaign to import characters');
            }

            // First, let's try to discover available API endpoints
            await this.discoverApiEndpoints();

            // Convert D&D Beyond character to VTTless format
            const vttlessCharacter = this.convertToVTTlessFormat(characterData);
            
            // Check if character already exists
            const existingCharacter = await this.findExistingCharacter(vttlessCharacter.name, campaignId);
            
            if (existingCharacter) {
                // Update existing character
                await this.updateCharacter(existingCharacter._id, vttlessCharacter);
                this.showNotification(`Updated ${characterData.name} successfully!`, 'success');
            } else {
                // Create new character
                const newCharacter = await this.createCharacter(vttlessCharacter, campaignId);
                this.showNotification(`Created ${characterData.name} successfully!`, 'success');
            }
            
            // Refresh the character list after any import (create or update)
            this.refreshCharacterList();

            sendResponse({ 
                success: true, 
                message: 'Character imported successfully'
            });

        } catch (error) {
            console.error('❌ Character import failed:', error);
            this.showNotification(`Import failed: ${error.message}`, 'error');
            sendResponse({ 
                success: false, 
                error: error.message 
            });
        }
    }

    /**
     * Convert D&D Beyond character data to VTTless format
     */
    convertToVTTlessFormat(ddbCharacter) {
        console.log('🔄 Converting character format...');
        
        return {
            name: ddbCharacter.name,
            level: ddbCharacter.level || 1,
            hitPoints: ddbCharacter.hitPoints?.current || 0,
            maxHitPoints: ddbCharacter.hitPoints?.max || 0,
            armorClass: ddbCharacter.armorClass || 10,
            
            // Store full D&D Beyond data in properties for future use
            properties: {
                dndBeyondId: ddbCharacter.characterId,
                class: ddbCharacter.class,
                race: ddbCharacter.race,
                background: ddbCharacter.background,
                abilities: ddbCharacter.abilities,
                skills: ddbCharacter.skills,
                savingThrows: ddbCharacter.savingThrows,
                proficiencies: ddbCharacter.proficiencies,
                equipment: ddbCharacter.equipment,
                spells: ddbCharacter.spells,
                features: ddbCharacter.features,
                speed: ddbCharacter.speed,
                avatarUrl: ddbCharacter.avatarUrl,
                lastImported: new Date().toISOString(),
                source: 'dndbeyond'
            },
            
            notes: `Imported from D&D Beyond\nClass: ${ddbCharacter.class}\nRace: ${ddbCharacter.race}\nBackground: ${ddbCharacter.background}`,
            
            // Use character avatar if available, otherwise use default size
            defaultSize: {
                width: 40,
                height: 40
            }
        };
    }

    /**
     * Try to discover available API endpoints
     */
    async discoverApiEndpoints() {
        console.log('🔍 Discovering available API endpoints...');
        
        const apiUrl = this.getApiUrl();
        console.log(`🔗 Using API URL: ${apiUrl}`);
        
        const commonEndpoints = [
            '/',
            '/api',
            '/api/health',
            '/health',
            '/status',
            '/api/campaigns',
            '/campaigns'
        ];

        // Also try to inspect the page for any API hints
        this.inspectPageForApiHints();

        for (const endpoint of commonEndpoints) {
            try {
                const fullUrl = `${apiUrl}${endpoint}`;
                const response = await fetch(fullUrl, {
                    method: 'GET',
                    credentials: 'include'
                });
                
                if (response.ok) {
                    console.log(`✅ Available endpoint: ${fullUrl} (${response.status})`);
                    
                    // Try to get some info about the response
                    const contentType = response.headers.get('content-type');
                    if (contentType && contentType.includes('application/json')) {
                        try {
                            const data = await response.json();
                            console.log(`📄 ${fullUrl} returned JSON:`, data);
                        } catch (e) {
                            console.log(`📄 ${fullUrl} returned JSON but couldn't parse`);
                        }
                    }
                } else {
                    console.log(`❌ Endpoint ${fullUrl} returned ${response.status}`);
                }
            } catch (error) {
                console.log(`❌ Endpoint ${endpoint} failed: ${error.message}`);
            }
        }
    }

    /**
     * Inspect the page for API hints
     */
    inspectPageForApiHints() {
        console.log('🔍 Inspecting page for API hints...');
        
        // Look for any script tags that might contain API endpoints
        const scripts = document.querySelectorAll('script');
        scripts.forEach((script, index) => {
            if (script.src) {
                console.log(`📜 Found script: ${script.src}`);
            } else if (script.textContent && script.textContent.includes('api')) {
                const text = script.textContent.substring(0, 500);
                console.log(`📜 Found inline script with 'api':`, text);
            }
        });

        // Look for any data attributes that might hint at API structure
        const elementsWithData = document.querySelectorAll('[data-api], [data-endpoint], [data-url]');
        elementsWithData.forEach(el => {
            console.log('📊 Found element with API data:', el.dataset);
        });

        // Check if there are any forms that POST to specific endpoints
        const forms = document.querySelectorAll('form');
        forms.forEach(form => {
            if (form.action) {
                console.log('📝 Found form action:', form.action);
            }
        });

        // Look for any fetch calls in the console by examining window.fetch
        if (window.fetch) {
            console.log('🌐 Fetch API is available');
        }
    }

    /**
     * Get the correct API URL based on current page
     */
    getApiUrl() {
        const currentUrl = window.location.href;
        
        // If we're on localhost:3000 (frontend), API is on localhost:3001
        if (currentUrl.includes('localhost:3000')) {
            return 'http://localhost:3001';
        }
        
        // If we're on localhost:3001 (API server), use same origin
        if (currentUrl.includes('localhost:3001')) {
            return 'http://localhost:3001';
        }
        
        // For production, assume API is same origin
        const url = new URL(currentUrl);
        return `${url.protocol}//${url.host}`;
    }

    /**
     * Extract campaign ID from current URL
     */
    extractCampaignId() {
        // Check URL patterns for campaign ID
        const urlPatterns = [
            /\/campaigns\/([a-f0-9]+)/,  // /campaigns/123abc
            /\/play\/([a-f0-9]+)/,      // /play/123abc
            /campaignId=([a-f0-9]+)/    // ?campaignId=123abc
        ];

        for (const pattern of urlPatterns) {
            const match = window.location.href.match(pattern);
            if (match) {
                return match[1];
            }
        }

        // Try to find campaign ID in page data
        const campaignIdElement = document.querySelector('[data-campaign-id]');
        if (campaignIdElement) {
            return campaignIdElement.dataset.campaignId;
        }

        return null;
    }

    /**
     * Find existing character by name in campaign
     */
    async findExistingCharacter(characterName, campaignId) {
        try {
            // Use the correct VTTless API endpoint for fetching user's characters
            // If we're on port 3000 (frontend), API calls need to go to port 3001 (backend)
            const apiUrl = this.getApiUrl();
            const endpoint = `${apiUrl}/campaigns/${campaignId}/characters/user`;
            
            console.log(`🔍 Fetching user's characters from: ${endpoint}`);
            const response = await fetch(endpoint, {
                method: 'GET',
                credentials: 'include',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const characters = await response.json();
                console.log(`✅ Successfully fetched ${characters.length} characters`);
                
                return characters.find(char => 
                    char.name && char.name.toLowerCase() === characterName.toLowerCase()
                );
            } else {
                const errorText = await response.text();
                console.log(`❌ Failed to fetch characters: ${response.status} - ${errorText}`);
                return null;
            }

        } catch (error) {
            console.error('❌ Error finding existing character:', error);
            return null;
        }
    }

    /**
     * Create new character in VTTless
     */
    async createCharacter(characterData, campaignId) {
        console.log('➕ Creating new character in VTTless...');
        
        // We need an asset ID for the character image - VTTless requires this
        // For now, we'll need to handle this gracefully or provide a default
        let assetId = await this.getOrCreateCharacterAsset(characterData);
        
        if (!assetId) {
            throw new Error('Character creation requires an asset (character image). Please upload a character image to VTTless first.');
        }

        const apiUrl = this.getApiUrl();
        const endpoint = `${apiUrl}/campaigns/${campaignId}/characters`;
        
        // Prepare the payload according to VTTless API specification
        const payload = {
            name: characterData.name,
            assetId: assetId,
            level: characterData.level || 1,
            hitPoints: characterData.hitPoints || 0,
            maxHitPoints: characterData.maxHitPoints || 0,
            armorClass: characterData.armorClass || 10,
            defaultSize: characterData.defaultSize || { width: 40, height: 40 },
            notes: characterData.notes || '',
            properties: characterData.properties || {}
        };

        console.log(`🔍 Creating character at: ${endpoint}`);
        console.log('📦 Payload:', payload);
        
        try {
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                const result = await response.json();
                console.log(`✅ Successfully created character:`, result);
                return result;
            } else {
                const errorText = await response.text();
                const error = new Error(`Failed to create character: ${response.status} - ${errorText}`);
                console.log(`❌ Character creation failed:`, error.message);
                throw error;
            }
        } catch (fetchError) {
            console.log(`❌ Network error creating character:`, fetchError.message);
            throw new Error(`Network error: ${fetchError.message}`);
        }
    }

    /**
     * Update existing character in VTTless
     */
    async updateCharacter(characterId, characterData) {
        console.log('📝 Updating existing character in VTTless...');
        
        const response = await fetch(`/characters/${characterId}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify(characterData)
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || 'Failed to update character');
        }

        return await response.json();
    }

    /**
     * Get or create asset for character image
     */
    async getOrCreateCharacterAsset(characterData) {
        console.log('🖼️ Attempting to get character asset...');
        
        try {
            // Check if there's a stored default asset ID we can use
            const defaultAssetId = await this.getDefaultAssetId();
            if (defaultAssetId) {
                console.log(`✅ Using stored default asset ID: ${defaultAssetId}`);
                return defaultAssetId;
            }

            // Try to find existing assets we can use
            const existingAsset = await this.findExistingAsset();
            if (existingAsset) {
                console.log(`✅ Found existing asset to use: ${existingAsset}`);
                // Store this as default for future use
                await this.storeDefaultAssetId(existingAsset);
                return existingAsset;
            }
            
            // Try to create a default asset using the default character token
            console.log('🎨 Creating default character asset...');
            const defaultAsset = await this.createDefaultCharacterAsset();
            if (defaultAsset) {
                console.log(`✅ Created default asset: ${defaultAsset}`);
                await this.storeDefaultAssetId(defaultAsset);
                return defaultAsset;
            }
            
            // If still no asset, show instructions
            console.log('⚠️ No suitable assets found for character');
            console.log('💡 To import characters:');
            console.log('1. Go to VTTless and upload a character image/token');
            console.log('2. The extension will detect and use it automatically');
            console.log('3. Or manually set a default asset ID in storage');
            
            return null;
            
        } catch (error) {
            console.error('❌ Error handling character asset:', error);
            return null;
        }
    }

    /**
     * Create a default character asset using the built-in SVG token
     */
    async createDefaultCharacterAsset() {
        try {
            const campaignId = this.extractCampaignId();
            if (!campaignId) {
                console.log('❌ No campaign ID found, cannot create default asset');
                return null;
            }

            // Create a blob from the default SVG token
            const svgContent = `<svg width="200" height="200" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
                <!-- Background circle -->
                <circle cx="100" cy="100" r="95" fill="#2D3748" stroke="#ED8936" stroke-width="6"/>
                
                <!-- Character icon -->
                <g transform="translate(100, 100)">
                    <!-- Head -->
                    <circle cx="0" cy="-25" r="20" fill="#ED8936"/>
                    
                    <!-- Body -->
                    <rect x="-15" y="-5" width="30" height="40" rx="8" fill="#ED8936"/>
                    
                    <!-- Arms -->
                    <rect x="-25" y="0" width="10" height="25" rx="5" fill="#ED8936"/>
                    <rect x="15" y="0" width="10" height="25" rx="5" fill="#ED8936"/>
                    
                    <!-- Legs -->
                    <rect x="-10" y="35" width="8" height="20" rx="4" fill="#ED8936"/>
                    <rect x="2" y="35" width="8" height="20" rx="4" fill="#ED8936"/>
                </g>
                
                <!-- Border -->
                <circle cx="100" cy="100" r="95" fill="none" stroke="#ED8936" stroke-width="3"/>
            </svg>`;

            const blob = new Blob([svgContent], { type: 'image/svg+xml' });
            const file = new File([blob], 'default-character-token.svg', { type: 'image/svg+xml' });

            // Upload the default asset using the VTTless API
            const apiUrl = this.getApiUrl();
            
            // Step 1: Get presigned URL
            const uploadUrlResponse = await fetch(`${apiUrl}/assets/upload-url`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify({
                    fileName: file.name,
                    fileType: file.type,
                    assetType: 'token',
                    campaignId: campaignId
                })
            });

            if (!uploadUrlResponse.ok) {
                const errorText = await uploadUrlResponse.text();
                console.log(`❌ Failed to get upload URL: ${uploadUrlResponse.status} - ${errorText}`);
                return null;
            }

            const { uploadUrl, assetId } = await uploadUrlResponse.json();

            // Step 2: Upload file to S3
            const uploadResponse = await fetch(uploadUrl, {
                method: 'PUT',
                headers: {
                    'Content-Type': file.type
                },
                body: file
            });

            if (!uploadResponse.ok) {
                console.log(`❌ Failed to upload default asset to S3: ${uploadResponse.status}`);
                return null;
            }

            // Step 3: Confirm upload
            const confirmResponse = await fetch(`${apiUrl}/assets/confirm-upload`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify({ assetId })
            });

            if (!confirmResponse.ok) {
                const errorText = await confirmResponse.text();
                console.log(`❌ Failed to confirm upload: ${confirmResponse.status} - ${errorText}`);
                return null;
            }

            console.log(`✅ Successfully created default character asset: ${assetId}`);
            return assetId;

        } catch (error) {
            console.error('❌ Error creating default character asset:', error);
            return null;
        }
    }

    /**
     * Try to find an existing asset that can be used for characters
     */
    async findExistingAsset() {
        try {
            // Look for any existing character that has an asset we can reuse
            const campaignId = this.extractCampaignId();
            if (!campaignId) return null;

            const apiUrl = this.getApiUrl();
            const response = await fetch(`${apiUrl}/campaigns/${campaignId}/characters/user`, {
                method: 'GET',
                credentials: 'include',
                headers: {
                    'Accept': 'application/json'
                }
            });

            if (response.ok) {
                const characters = await response.json();
                if (characters.length > 0 && characters[0].assetId) {
                    console.log(`📸 Found existing character asset: ${characters[0].assetId}`);
                    return characters[0].assetId;
                }
            }

            return null;
            
        } catch (error) {
            console.error('❌ Error finding existing asset:', error);
            return null;
        }
    }

    /**
     * Get stored default asset ID
     */
    async getDefaultAssetId() {
        try {
            const result = await chrome.storage.local.get('defaultCharacterAssetId');
            return result.defaultCharacterAssetId || null;
        } catch (error) {
            console.error('❌ Error getting default asset ID:', error);
            return null;
        }
    }

    /**
     * Store default asset ID for future use
     */
    async storeDefaultAssetId(assetId) {
        try {
            await chrome.storage.local.set({ defaultCharacterAssetId: assetId });
            console.log(`💾 Stored default asset ID: ${assetId}`);
        } catch (error) {
            console.error('❌ Error storing default asset ID:', error);
        }
    }

    /**
     * Create notification area for import status
     */
    createNotificationArea() {
        if (document.getElementById('vttless-dndb-notifications')) return;
        
        const notificationArea = document.createElement('div');
        notificationArea.id = 'vttless-dndb-notifications';
        notificationArea.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 10000;
            max-width: 400px;
            pointer-events: none;
        `;
        
        document.body.appendChild(notificationArea);
    }

    /**
     * Show notification to user
     */
    showNotification(message, type = 'info', duration = 5000) {
        const notificationArea = document.getElementById('vttless-dndb-notifications');
        if (!notificationArea) return;

        const notification = document.createElement('div');
        notification.className = `vttless-notification vttless-notification-${type}`;
        
        const colors = {
            info: '#3b82f6',
            success: '#10b981',
            error: '#ef4444',
            warning: '#f59e0b'
        };

        notification.style.cssText = `
            background: ${colors[type] || colors.info};
            color: white;
            padding: 12px 16px;
            margin-bottom: 8px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            font-size: 14px;
            font-weight: 500;
            pointer-events: auto;
            animation: slideInRight 0.3s ease-out;
            opacity: 0.95;
        `;

        notification.innerHTML = `
            <div style="display: flex; align-items: center; justify-content: space-between;">
                <div style="display: flex; align-items: center;">
                    <span style="margin-right: 8px; font-size: 16px;">
                        ${type === 'success' ? '✅' : type === 'error' ? '❌' : type === 'warning' ? '⚠️' : 'ℹ️'}
                    </span>
                    ${message}
                </div>
                <button onclick="this.parentElement.parentElement.remove()" 
                        style="background: none; border: none; color: white; cursor: pointer; padding: 0 0 0 8px; font-size: 18px;">
                    ×
                </button>
            </div>
        `;

        notificationArea.appendChild(notification);

        // Auto-remove after duration
        setTimeout(() => {
            if (notification.parentNode) {
                notification.style.animation = 'slideOutRight 0.3s ease-in';
                setTimeout(() => notification.remove(), 300);
            }
        }, duration);
    }

    /**
     * Detect campaign context and show integration hints
     */
    detectCampaignContext() {
        const campaignId = this.extractCampaignId();
        if (campaignId) {
            console.log('🎯 Campaign context detected:', campaignId);
            // Could show a small indicator that D&D Beyond integration is available
        }
    }

    /**
     * Refresh character list if visible (trigger re-render)
     */
    refreshCharacterList() {
        // Try to trigger a refresh of the character list
        // This would depend on your VTTless implementation
        console.log('🔄 Attempting to refresh character list...');
        
        // Look for character list refresh mechanisms
        const refreshButton = document.querySelector('[data-refresh-characters], .refresh-characters');
        if (refreshButton) {
            refreshButton.click();
        }
        
        // Or dispatch a custom event that your VTTless app might listen for
        window.dispatchEvent(new CustomEvent('vttless:character-imported', {
            detail: { source: 'dndbeyond' }
        }));
    }
}

// Add animation styles
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 0.95;
        }
    }
    
    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 0.95;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// Initialize the VTTless integration
const vttlessIntegration = new VTTlessIntegration();