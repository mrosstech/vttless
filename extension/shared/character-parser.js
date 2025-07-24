/**
 * D&D Beyond Character Data Parser
 * Extracts character information from D&D Beyond character sheets
 */

class CharacterParser {
    constructor() {
        this.characterData = null;
    }

    /**
     * Parse character data from D&D Beyond character sheet page
     * @returns {Object|null} Parsed character data or null if parsing fails
     */
    parseCharacterSheet() {
        try {
            console.log('🔍 Starting D&D Beyond character sheet parsing...');
            
            // Check if we're on a character sheet page
            if (!this.isCharacterSheetPage()) {
                console.log('❌ Not on a character sheet page');
                return null;
            }

            const characterData = {
                // Basic Info
                name: this.getCharacterName(),
                level: this.getCharacterLevel(),
                class: this.getCharacterClass(),
                race: this.getCharacterRace(),
                background: this.getCharacterBackground(),
                
                // Core Stats
                abilities: this.getAbilityScores(),
                
                // Combat Stats
                hitPoints: this.getHitPoints(),
                armorClass: this.getArmorClass(),
                speed: this.getSpeed(),
                
                // Skills & Proficiencies
                skills: this.getSkills(),
                savingThrows: this.getSavingThrows(),
                proficiencies: this.getProficiencies(),
                
                // Equipment & Spells
                equipment: this.getEquipment(),
                spells: this.getSpells(),
                
                // Character Features
                features: this.getFeatures(),
                
                // Meta information
                characterId: this.getCharacterId(),
                avatarUrl: this.getCharacterAvatar(),
                lastUpdated: new Date().toISOString()
            };

            console.log('✅ Character parsing completed:', characterData.name);
            this.characterData = characterData;
            return characterData;

        } catch (error) {
            console.error('❌ Error parsing character sheet:', error);
            return null;
        }
    }

    /**
     * Check if current page is a D&D Beyond character sheet
     */
    isCharacterSheetPage() {
        return window.location.hostname === 'www.dndbeyond.com' && 
               window.location.pathname.includes('/characters/');
    }

    /**
     * Get character ID from URL
     */
    getCharacterId() {
        const match = window.location.pathname.match(/\/characters\/(\d+)/);
        return match ? match[1] : null;
    }

    /**
     * Extract character name
     */
    getCharacterName() {
        // Try multiple selectors for character name
        const selectors = [
            '.ddbc-character-tidbits__heading h1',
            '.character-tidbits-box__heading',
            '[data-testid="character-name"]',
            'h1.character-name'
        ];

        for (const selector of selectors) {
            const element = document.querySelector(selector);
            if (element) {
                return element.textContent.trim();
            }
        }
        
        return 'Unknown Character';
    }

    /**
     * Extract character level
     */
    getCharacterLevel() {
        try {
            // Look for level information in various places
            const selectors = [
                '.ddbc-character-progression-summary__level',
                '.character-tidbits-box__level',
                '[data-testid="character-level"]'
            ];

            for (const selector of selectors) {
                const element = document.querySelector(selector);
                if (element) {
                    const levelText = element.textContent;
                    const levelMatch = levelText.match(/(\d+)/);
                    if (levelMatch) {
                        return parseInt(levelMatch[1]);
                    }
                }
            }

            return 1; // Default level
        } catch (error) {
            console.error('Error getting character level:', error);
            return 1;
        }
    }

    /**
     * Extract character class(es)
     */
    getCharacterClass() {
        try {
            const selectors = [
                '.ddbc-character-progression-summary__class',
                '.character-tidbits-box__classes',
                '[data-testid="character-class"]'
            ];

            for (const selector of selectors) {
                const element = document.querySelector(selector);
                if (element) {
                    return element.textContent.trim();
                }
            }

            return 'Unknown Class';
        } catch (error) {
            console.error('Error getting character class:', error);
            return 'Unknown Class';
        }
    }

    /**
     * Extract character race
     */
    getCharacterRace() {
        try {
            const selectors = [
                '.ddbc-character-tidbits__race',
                '.character-tidbits-box__race',
                '[data-testid="character-race"]'
            ];

            for (const selector of selectors) {
                const element = document.querySelector(selector);
                if (element) {
                    return element.textContent.trim();
                }
            }

            return 'Unknown Race';
        } catch (error) {
            console.error('Error getting character race:', error);
            return 'Unknown Race';
        }
    }

    /**
     * Extract character background
     */
    getCharacterBackground() {
        try {
            const selectors = [
                '.character-tidbits-box__background',
                '[data-testid="character-background"]'
            ];

            for (const selector of selectors) {
                const element = document.querySelector(selector);
                if (element) {
                    return element.textContent.trim();
                }
            }

            return 'Unknown Background';
        } catch (error) {
            console.error('Error getting character background:', error);
            return 'Unknown Background';
        }
    }

    /**
     * Extract ability scores (STR, DEX, CON, INT, WIS, CHA)
     */
    getAbilityScores() {
        try {
            const abilities = {};
            const abilityNames = ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'];
            
            abilityNames.forEach(ability => {
                // Try different selectors for ability scores
                const selectors = [
                    `.ddbc-ability-summary__${ability} .ddbc-ability-summary__primary`,
                    `[data-testid="${ability}-score"]`,
                    `.ability-${ability} .ability-score`
                ];

                for (const selector of selectors) {
                    const element = document.querySelector(selector);
                    if (element) {
                        const score = parseInt(element.textContent.trim());
                        if (!isNaN(score)) {
                            abilities[ability] = {
                                score,
                                modifier: Math.floor((score - 10) / 2)
                            };
                            break;
                        }
                    }
                }

                // Default if not found
                if (!abilities[ability]) {
                    abilities[ability] = { score: 10, modifier: 0 };
                }
            });

            return abilities;
        } catch (error) {
            console.error('Error getting ability scores:', error);
            return {};
        }
    }

    /**
     * Extract hit points information
     */
    getHitPoints() {
        try {
            const selectors = [
                '.ddbc-health-summary__hp-current',
                '.hit-points-current',
                '[data-testid="hit-points-current"]'
            ];

            let current = 0;
            let max = 0;

            for (const selector of selectors) {
                const element = document.querySelector(selector);
                if (element) {
                    const hpText = element.textContent.trim();
                    const hpMatch = hpText.match(/(\d+)(?:\s*\/\s*(\d+))?/);
                    if (hpMatch) {
                        current = parseInt(hpMatch[1]);
                        max = hpMatch[2] ? parseInt(hpMatch[2]) : current;
                        break;
                    }
                }
            }

            return { current, max };
        } catch (error) {
            console.error('Error getting hit points:', error);
            return { current: 0, max: 0 };
        }
    }

    /**
     * Extract armor class
     */
    getArmorClass() {
        try {
            const selectors = [
                '.ddbc-armor-class-summary__ac-value',
                '.armor-class-value',
                '[data-testid="armor-class"]'
            ];

            for (const selector of selectors) {
                const element = document.querySelector(selector);
                if (element) {
                    const ac = parseInt(element.textContent.trim());
                    if (!isNaN(ac)) {
                        return ac;
                    }
                }
            }

            return 10; // Default AC
        } catch (error) {
            console.error('Error getting armor class:', error);
            return 10;
        }
    }

    /**
     * Extract movement speed
     */
    getSpeed() {
        try {
            const selectors = [
                '.ddbc-speed-summary__speed',
                '.speed-value',
                '[data-testid="speed"]'
            ];

            for (const selector of selectors) {
                const element = document.querySelector(selector);
                if (element) {
                    const speedText = element.textContent.trim();
                    const speedMatch = speedText.match(/(\d+)/);
                    if (speedMatch) {
                        return parseInt(speedMatch[1]);
                    }
                }
            }

            return 30; // Default speed
        } catch (error) {
            console.error('Error getting speed:', error);
            return 30;
        }
    }

    /**
     * Extract skills
     */
    getSkills() {
        try {
            const skills = {};
            const skillElements = document.querySelectorAll('.skills-list .skill, [data-testid*="skill"]');
            
            skillElements.forEach(element => {
                const nameElement = element.querySelector('.skill-name, [data-testid*="skill-name"]');
                const bonusElement = element.querySelector('.skill-bonus, [data-testid*="skill-bonus"]');
                
                if (nameElement && bonusElement) {
                    const name = nameElement.textContent.trim();
                    const bonus = parseInt(bonusElement.textContent.trim().replace(/[^\d-]/g, ''));
                    if (!isNaN(bonus)) {
                        skills[name.toLowerCase().replace(/\s+/g, '_')] = bonus;
                    }
                }
            });

            return skills;
        } catch (error) {
            console.error('Error getting skills:', error);
            return {};
        }
    }

    /**
     * Extract saving throws
     */
    getSavingThrows() {
        try {
            const saves = {};
            const saveElements = document.querySelectorAll('.saving-throws .save, [data-testid*="save"]');
            
            saveElements.forEach(element => {
                const nameElement = element.querySelector('.save-name, [data-testid*="save-name"]');
                const bonusElement = element.querySelector('.save-bonus, [data-testid*="save-bonus"]');
                
                if (nameElement && bonusElement) {
                    const name = nameElement.textContent.trim();
                    const bonus = parseInt(bonusElement.textContent.trim().replace(/[^\d-]/g, ''));
                    if (!isNaN(bonus)) {
                        saves[name.toLowerCase().replace(/\s+/g, '_')] = bonus;
                    }
                }
            });

            return saves;
        } catch (error) {
            console.error('Error getting saving throws:', error);
            return {};
        }
    }

    /**
     * Extract proficiencies
     */
    getProficiencies() {
        try {
            const proficiencies = [];
            const profElements = document.querySelectorAll('.proficiencies .proficiency, [data-testid*="proficiency"]');
            
            profElements.forEach(element => {
                const text = element.textContent.trim();
                if (text) {
                    proficiencies.push(text);
                }
            });

            return proficiencies;
        } catch (error) {
            console.error('Error getting proficiencies:', error);
            return [];
        }
    }

    /**
     * Extract equipment
     */
    getEquipment() {
        try {
            const equipment = [];
            const equipElements = document.querySelectorAll('.equipment .item, [data-testid*="equipment"]');
            
            equipElements.forEach(element => {
                const nameElement = element.querySelector('.item-name, [data-testid*="item-name"]');
                if (nameElement) {
                    equipment.push({
                        name: nameElement.textContent.trim(),
                        // Additional item details can be extracted here
                    });
                }
            });

            return equipment;
        } catch (error) {
            console.error('Error getting equipment:', error);
            return [];
        }
    }

    /**
     * Extract spells
     */
    getSpells() {
        try {
            const spells = [];
            const spellElements = document.querySelectorAll('.spells .spell, [data-testid*="spell"]');
            
            spellElements.forEach(element => {
                const nameElement = element.querySelector('.spell-name, [data-testid*="spell-name"]');
                const levelElement = element.querySelector('.spell-level, [data-testid*="spell-level"]');
                
                if (nameElement) {
                    spells.push({
                        name: nameElement.textContent.trim(),
                        level: levelElement ? parseInt(levelElement.textContent.trim()) : 0
                    });
                }
            });

            return spells;
        } catch (error) {
            console.error('Error getting spells:', error);
            return [];
        }
    }

    /**
     * Extract character features
     */
    getFeatures() {
        try {
            const features = [];
            const featureElements = document.querySelectorAll('.features .feature, [data-testid*="feature"]');
            
            featureElements.forEach(element => {
                const nameElement = element.querySelector('.feature-name, [data-testid*="feature-name"]');
                if (nameElement) {
                    features.push({
                        name: nameElement.textContent.trim(),
                        // Additional feature details can be extracted here
                    });
                }
            });

            return features;
        } catch (error) {
            console.error('Error getting features:', error);
            return [];
        }
    }

    /**
     * Extract character avatar URL
     */
    getCharacterAvatar() {
        try {
            const selectors = [
                '.character-avatar img',
                '.ddbc-character-avatar img',
                '[data-testid="character-avatar"] img'
            ];

            for (const selector of selectors) {
                const element = document.querySelector(selector);
                if (element && element.src) {
                    return element.src;
                }
            }

            return null;
        } catch (error) {
            console.error('Error getting character avatar:', error);
            return null;
        }
    }

    /**
     * Get the current parsed character data
     */
    getCharacterData() {
        return this.characterData;
    }
}

// Export for use in different contexts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CharacterParser;
} else if (typeof window !== 'undefined') {
    window.CharacterParser = CharacterParser;
}