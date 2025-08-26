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

            // Debug: Log page structure
            this.debugPageStructure();

            const characterData = {
                // Basic Info
                name: this.getCharacterName(),
                level: this.getCharacterLevel(),
                class: this.getCharacterClass(),
                race: this.getCharacterRace(),
                gender: this.getCharacterGender(),
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
            console.log('🔍 Looking for character level...');
            
            // First try to get level from the classes element (e.g., "Monk 3")
            const classesElement = document.querySelector('.ddbc-character-summary__classes');
            console.log('  Trying classes element:', classesElement);
            
            if (classesElement) {
                const classText = classesElement.textContent.trim();
                console.log(`  Found class text: "${classText}"`);
                // Extract level from class text like "Monk 3" or "Fighter 5"
                const levelMatch = classText.match(/(\w+)\s+(\d+)/);
                if (levelMatch) {
                    const level = parseInt(levelMatch[2]);
                    console.log(`  Parsed level from classes: ${level}`);
                    return level;
                }
            }
            
            // Fallback to other selectors
            const fallbackSelectors = [
                '.ddbc-character-progression-summary__level',
                '.ct-character-header-desktop__levels',
                '.character-tidbits-box__level',
                '[data-testid="character-level"]',
                '.ct-character-header-desktop__group--level'
            ];

            for (const selector of fallbackSelectors) {
                const element = document.querySelector(selector);
                console.log(`  Trying fallback selector: ${selector}`, element);
                if (element) {
                    const levelText = element.textContent.trim();
                    console.log(`  Found level text: "${levelText}"`);
                    const levelMatch = levelText.match(/Level\s*(\d+)|(\d+)/i);
                    if (levelMatch) {
                        const level = parseInt(levelMatch[1] || levelMatch[2]);
                        console.log(`  Parsed level: ${level}`);
                        return level;
                    }
                }
            }

            console.log('  No level found, defaulting to 1');
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
            console.log('🔍 Looking for character class...');
            
            // Try the correct selector first
            const classElement = document.querySelector('.ddbc-character-summary__classes');
            console.log('  Trying classes element:', classElement);
            
            if (classElement) {
                const classText = classElement.textContent.trim();
                console.log(`  Found class text: "${classText}"`);
                // Extract class name from text like "Monk 3" -> "Monk"
                const classMatch = classText.match(/^(\w+)\s+\d+/);
                if (classMatch) {
                    const className = classMatch[1];
                    console.log(`  Parsed class: ${className}`);
                    return className;
                }
                // If no level number, return the whole text
                return classText;
            }
            
            // Fallback selectors
            const fallbackSelectors = [
                '.ddbc-character-progression-summary__class',
                '.character-tidbits-box__classes',
                '[data-testid="character-class"]'
            ];

            for (const selector of fallbackSelectors) {
                const element = document.querySelector(selector);
                console.log(`  Trying fallback selector: ${selector}`, element);
                if (element) {
                    return element.textContent.trim();
                }
            }

            console.log('  No class found, defaulting to Unknown Class');
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
            console.log('🔍 Looking for character race...');
            
            // Try the correct selector first
            const raceElement = document.querySelector('.ddbc-character-summary__race');
            console.log('  Trying race element:', raceElement);
            
            if (raceElement) {
                const race = raceElement.textContent.trim();
                console.log(`  Found race: "${race}"`);
                return race;
            }
            
            // Fallback selectors
            const fallbackSelectors = [
                '.ddbc-character-tidbits__race',
                '.character-tidbits-box__race',
                '[data-testid="character-race"]'
            ];

            for (const selector of fallbackSelectors) {
                const element = document.querySelector(selector);
                console.log(`  Trying fallback selector: ${selector}`, element);
                if (element) {
                    return element.textContent.trim();
                }
            }

            console.log('  No race found, defaulting to Unknown Race');
            return 'Unknown Race';
        } catch (error) {
            console.error('Error getting character race:', error);
            return 'Unknown Race';
        }
    }

    /**
     * Extract character gender
     */
    getCharacterGender() {
        try {
            console.log('🔍 Looking for character gender...');
            
            // Try the correct selector first
            const genderElement = document.querySelector('.ddbc-character-summary__gender');
            console.log('  Trying gender element:', genderElement);
            
            if (genderElement) {
                const gender = genderElement.textContent.trim();
                console.log(`  Found gender: "${gender}"`);
                return gender;
            }
            
            console.log('  No gender found, defaulting to Unknown Gender');
            return 'Unknown Gender';
        } catch (error) {
            console.error('Error getting character gender:', error);
            return 'Unknown Gender';
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
            console.log('🔍 Looking for ability scores...');
            
            const abilities = {};
            const abilityNames = ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'];
            
            // Use the corrected selector based on the HTML structure provided
            const abilityElements = document.querySelectorAll('.ct-quick-info__abilities .ddbc-ability-summary__secondary');
            console.log(`  Found ${abilityElements.length} ability score elements:`, abilityElements);
            
            if (abilityElements.length >= 6) {
                // Extract scores from elements in order (STR, DEX, CON, INT, WIS, CHA)
                abilityElements.forEach((element, index) => {
                    if (index < 6) {
                        const score = parseInt(element.textContent.trim());
                        const abilityName = abilityNames[index];
                        
                        console.log(`  ${abilityName}: ${score}`);
                        
                        if (!isNaN(score) && score > 0) {
                            abilities[abilityName] = {
                                score,
                                modifier: Math.floor((score - 10) / 2)
                            };
                        }
                    }
                });
                
                // If we successfully parsed all 6 abilities, return them
                if (Object.keys(abilities).length === 6) {
                    console.log('✅ Successfully parsed all ability scores:', abilities);
                    return abilities;
                }
            }
            
            // Fallback: try alternative selectors
            console.log('  Trying alternative selectors...');
            
            abilityNames.forEach(ability => {
                if (!abilities[ability]) {
                    const selectors = [
                        `.ddbc-ability-summary__${ability} .ddbc-ability-summary__secondary`,
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
                                console.log(`  ${ability}: ${score}`);
                                break;
                            }
                        }
                    }

                    // Default if not found
                    if (!abilities[ability]) {
                        abilities[ability] = { score: 10, modifier: 0 };
                        console.log(`  ${ability}: defaulted to 10`);
                    }
                }
            });

            console.log('  Final abilities:', abilities);
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
            console.log('🔍 Looking for hit points...');
            
            let current = 0;
            let max = 0;
            
            // Primary approach: use the updated selectors from the HTML structure
            const currentHpButton = document.querySelector('.styles_valueButton__0rK5Z.styles_number__j1d93');
            const maxHpElement = document.querySelector('[data-testid="max-hp"]');
            
            console.log('  Trying new HP selectors:', { currentHpButton, maxHpElement });
            
            if (currentHpButton) {
                current = parseInt(currentHpButton.textContent.trim());
                console.log(`  Found current HP: ${current}`);
            }
            
            if (maxHpElement) {
                max = parseInt(maxHpElement.textContent.trim());
                console.log(`  Found max HP: ${max}`);
            }
            
            // If we got both values, return them
            if (current > 0 && max > 0) {
                console.log(`✅ Successfully parsed HP: ${current}/${max}`);
                return { current, max };
            }
            
            // Fallback: try the old selectors
            console.log('  Falling back to old HP selectors...');
            const fallbackSelectors = [
                '.ct-health-summary__hp-current',
                '.ddbc-health-summary__hp-current',
                '.ct-health-summary__hp-item input',
                '.hit-points-current',
                '[data-testid="hit-points-current"]',
                '.ct-health-manager__health-max',
                '.ct-health-manager__health-current'
            ];

            for (const selector of fallbackSelectors) {
                const element = document.querySelector(selector);
                console.log(`  Trying fallback HP selector: ${selector}`, element);
                if (element) {
                    const hpText = element.textContent || element.value || '';
                    console.log(`  Found HP text: "${hpText}"`);
                    const hpMatch = hpText.match(/(\d+)(?:\s*\/\s*(\d+))?/);
                    if (hpMatch) {
                        current = parseInt(hpMatch[1]);
                        max = hpMatch[2] ? parseInt(hpMatch[2]) : current;
                        console.log(`  Parsed HP: ${current}/${max}`);
                        break;
                    }
                }
            }

            // Try separate current and max selectors if combined didn't work
            if (current === 0 && max === 0) {
                const maxSelectors = ['.ct-health-summary__hp-max', '.ddbc-health-summary__hp-max'];
                for (const selector of maxSelectors) {
                    const element = document.querySelector(selector);
                    if (element) {
                        const maxHp = parseInt(element.textContent.trim());
                        if (!isNaN(maxHp)) {
                            max = maxHp;
                            current = maxHp; // Assume full health if current not found
                            console.log(`  Found separate max HP: ${max}`);
                            break;
                        }
                    }
                }
            }

            console.log(`  Final HP: ${current}/${max}`);
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
            console.log('🔍 Looking for armor class...');
            
            // Try the correct selector first using the data-testid
            const acElementByTestId = document.querySelector('[data-testid="armor-class-value"]');
            console.log('  Trying AC element by data-testid:', acElementByTestId);
            
            if (acElementByTestId) {
                const acText = acElementByTestId.textContent.trim();
                console.log(`  Found AC text from data-testid: "${acText}"`);
                const ac = parseInt(acText);
                if (!isNaN(ac)) {
                    console.log(`  Parsed AC: ${ac}`);
                    return ac;
                }
            }
            
            // Try the CSS class selector as backup
            const acElementByClass = document.querySelector('.ddbc-armor-class-box__value');
            console.log('  Trying AC element by class:', acElementByClass);
            
            if (acElementByClass) {
                const acText = acElementByClass.textContent.trim();
                console.log(`  Found AC text from class: "${acText}"`);
                const ac = parseInt(acText);
                if (!isNaN(ac)) {
                    console.log(`  Parsed AC: ${ac}`);
                    return ac;
                }
            }
            
            // Fallback selectors
            const fallbackSelectors = [
                '.ct-armor-class-summary__ac-value',
                '.ddbc-armor-class-summary__ac-value', 
                '.ct-armor-class-summary__ac-total',
                '.armor-class-value',
                '[data-testid="armor-class"]',
                '.ct-armor-class-box__value'
            ];

            for (const selector of fallbackSelectors) {
                const element = document.querySelector(selector);
                console.log(`  Trying fallback AC selector: ${selector}`, element);
                if (element) {
                    const acText = element.textContent.trim();
                    console.log(`  Found AC text: "${acText}"`);
                    const ac = parseInt(acText);
                    if (!isNaN(ac)) {
                        console.log(`  Parsed AC: ${ac}`);
                        return ac;
                    }
                }
            }

            console.log('  No AC found, defaulting to 10');
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
     * Debug the current page structure to help identify correct selectors
     */
    debugPageStructure() {
        console.log('🔍 Debugging D&D Beyond page structure...');
        
        // Look for elements containing health-related text
        const healthElements = document.querySelectorAll('*');
        const healthKeywords = ['health', 'hit points', 'hp', 'armor class', 'ac', 'level'];
        
        healthElements.forEach(el => {
            const text = el.textContent?.toLowerCase() || '';
            const className = el.className || '';
            
            healthKeywords.forEach(keyword => {
                if (text.includes(keyword) && el.children.length === 0) { // leaf elements only
                    console.log(`🎯 Found "${keyword}" in element:`, {
                        text: el.textContent?.trim(),
                        className,
                        selector: this.generateSelector(el)
                    });
                }
            });
        });
        
        // Look for numeric values that might be stats
        const numericElements = Array.from(document.querySelectorAll('*')).filter(el => {
            const text = el.textContent?.trim() || '';
            return /^\d+$/.test(text) && el.children.length === 0 && text.length <= 3;
        });
        
        console.log('🔢 Found numeric elements that could be stats:', 
            numericElements.slice(0, 20).map(el => ({
                value: el.textContent.trim(),
                className: el.className,
                selector: this.generateSelector(el)
            }))
        );
    }

    /**
     * Generate a selector for an element
     */
    generateSelector(el) {
        if (el.id) return `#${el.id}`;
        if (el.className) {
            const classes = el.className.split(' ').filter(c => c.length > 0);
            if (classes.length > 0) return `.${classes.join('.')}`;
        }
        return el.tagName.toLowerCase();
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