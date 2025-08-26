import React, { useState, useEffect } from 'react';
import {
    Modal, ModalOverlay, ModalContent, ModalHeader, ModalFooter, ModalBody, ModalCloseButton,
    Button, VStack, HStack, Text, Input, Textarea, SimpleGrid, Box, Image,
    Tabs, TabList, TabPanels, Tab, TabPanel, Badge, Divider, Icon,
    FormControl, FormLabel, NumberInput, NumberInputField, NumberInputStepper,
    NumberIncrementStepper, NumberDecrementStepper, useToast, Flex, IconButton,
    Accordion, AccordionItem, AccordionButton, AccordionPanel, AccordionIcon,
    Table, Thead, Tbody, Tr, Th, Td, Select, Spinner, Center
} from '@chakra-ui/react';
import { FaUser, FaEdit, FaPlus, FaTrash, FaSave, FaUpload } from 'react-icons/fa';
import { useAuth } from '../providers/AuthProvider';
import { api } from '../common/axiosPrivate.js';
import CharacterImageUpdate from './CharacterImageUpdate';

const CharacterSheet = ({ isOpen, onClose, character, onUpdate, onSave }) => {
    const { user } = useAuth();
    const toast = useToast();
    
    // Form state
    const [formData, setFormData] = useState({
        name: '',
        class: '',
        level: 1,
        race: '',
        background: '',
        alignment: '',
        hitPoints: { max: 0, current: 0 },
        armorClass: 10,
        speed: 30,
        abilities: {
            strength: { score: 10, modifier: 0 },
            dexterity: { score: 10, modifier: 0 },
            constitution: { score: 10, modifier: 0 },
            intelligence: { score: 10, modifier: 0 },
            wisdom: { score: 10, modifier: 0 },
            charisma: { score: 10, modifier: 0 }
        },
        savingThrows: {},
        skills: {},
        attacks: [],
        spells: [],
        feats: [],
        inventory: [],
        notes: ''
    });
    
    const [isEditing, setIsEditing] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [showImageUpdate, setShowImageUpdate] = useState(false);
    const [campaigns, setCampaigns] = useState([]);

    // Initialize form when character changes
    useEffect(() => {
        if (character) {
            setFormData({
                name: character.name || '',
                class: character.class || '',
                level: character.level || 1,
                race: character.race || '',
                background: character.background || '',
                alignment: character.alignment || '',
                hitPoints: typeof character.hitPoints === 'object' && character.hitPoints !== null
                    ? character.hitPoints 
                    : { max: character.hitPoints || 0, current: character.hitPoints || 0 },
                armorClass: character.armorClass || 10,
                speed: character.speed || 30,
                abilities: character.abilities ? 
                    Object.keys(character.abilities).reduce((acc, ability) => {
                        const abilityData = character.abilities[ability];
                        if (typeof abilityData === 'number') {
                            // Old format - convert to new format
                            acc[ability] = { score: abilityData, modifier: Math.floor((abilityData - 10) / 2) };
                        } else if (abilityData && typeof abilityData === 'object') {
                            // New format - use as is
                            acc[ability] = { score: abilityData.score || 10, modifier: abilityData.modifier || 0 };
                        } else {
                            // Fallback
                            acc[ability] = { score: 10, modifier: 0 };
                        }
                        return acc;
                    }, {}) : {
                        strength: { score: 10, modifier: 0 }, 
                        dexterity: { score: 10, modifier: 0 }, 
                        constitution: { score: 10, modifier: 0 },
                        intelligence: { score: 10, modifier: 0 }, 
                        wisdom: { score: 10, modifier: 0 }, 
                        charisma: { score: 10, modifier: 0 }
                    },
                savingThrows: character.savingThrows || {},
                skills: character.skills || {},
                attacks: Array.isArray(character.attacks) ? character.attacks : [],
                spells: Array.isArray(character.spells) ? character.spells : [],
                feats: Array.isArray(character.feats) ? character.feats : [],
                inventory: Array.isArray(character.inventory) ? character.inventory : [],
                notes: character.notes || ''
            });
            setIsEditing(false);
        } else {
            // New character - start in edit mode
            setFormData({
                name: '',
                class: '',
                level: 1,
                race: '',
                background: '',
                alignment: '',
                hitPoints: { max: 0, current: 0 },
                armorClass: 10,
                speed: 30,
                abilities: {
                    strength: 10, dexterity: 10, constitution: 10,
                    intelligence: 10, wisdom: 10, charisma: 10
                },
                savingThrows: {},
                skills: {},
                attacks: [],
                spells: [],
                feats: [],
                inventory: [],
                notes: ''
            });
            setIsEditing(true);
        }
    }, [character]);

    // Fetch campaigns when modal opens for new character
    useEffect(() => {
        if (isOpen && !character) {
            fetchCampaigns();
        }
    }, [isOpen, character]);

    const fetchCampaigns = async () => {
        try {
            const response = await api.get('/campaigns/list');
            setCampaigns(response.data);
        } catch (error) {
            console.error('Error fetching campaigns:', error);
        }
    };

    const handleSave = async () => {
        if (!formData.name.trim()) {
            toast({
                title: 'Validation Error',
                description: 'Character name is required',
                status: 'error'
            });
            return;
        }

        setIsSaving(true);
        try {
            let response;
            
            if (character) {
                // Update existing character
                response = await api.patch(`/characters/${character._id}`, formData);
                toast({
                    title: 'Success',
                    description: 'Character updated successfully',
                    status: 'success'
                });
                
                if (onUpdate) {
                    onUpdate(response.data);
                }
            } else {
                // Create new character  
                response = await api.post('/characters', formData);
                toast({
                    title: 'Success',
                    description: 'Character created successfully',
                    status: 'success'
                });
                
                if (onSave) {
                    onSave();
                }
            }
            
            setIsEditing(false);
        } catch (error) {
            toast({
                title: 'Error',
                description: error.response?.data?.message || 'Failed to save character',
                status: 'error'
            });
        } finally {
            setIsSaving(false);
        }
    };

    const handleCancel = () => {
        if (character) {
            // Reset to original values
            setFormData({
                name: character.name || '',
                class: character.class || '',
                level: character.level || 1,
                race: character.race || '',
                background: character.background || '',
                alignment: character.alignment || '',
                hitPoints: typeof character.hitPoints === 'object' && character.hitPoints !== null
                    ? character.hitPoints 
                    : { max: character.hitPoints || 0, current: character.hitPoints || 0 },
                armorClass: character.armorClass || 10,
                speed: character.speed || 30,
                abilities: character.abilities ? 
                    Object.keys(character.abilities).reduce((acc, ability) => {
                        const abilityData = character.abilities[ability];
                        if (typeof abilityData === 'number') {
                            // Old format - convert to new format
                            acc[ability] = { score: abilityData, modifier: Math.floor((abilityData - 10) / 2) };
                        } else if (abilityData && typeof abilityData === 'object') {
                            // New format - use as is
                            acc[ability] = { score: abilityData.score || 10, modifier: abilityData.modifier || 0 };
                        } else {
                            // Fallback
                            acc[ability] = { score: 10, modifier: 0 };
                        }
                        return acc;
                    }, {}) : {
                        strength: { score: 10, modifier: 0 }, 
                        dexterity: { score: 10, modifier: 0 }, 
                        constitution: { score: 10, modifier: 0 },
                        intelligence: { score: 10, modifier: 0 }, 
                        wisdom: { score: 10, modifier: 0 }, 
                        charisma: { score: 10, modifier: 0 }
                    },
                savingThrows: character.savingThrows || {},
                skills: character.skills || {},
                attacks: Array.isArray(character.attacks) ? character.attacks : [],
                spells: Array.isArray(character.spells) ? character.spells : [],
                feats: Array.isArray(character.feats) ? character.feats : [],
                inventory: Array.isArray(character.inventory) ? character.inventory : [],
                notes: character.notes || ''
            });
            setIsEditing(false);
        } else {
            // Cancel new character creation
            onClose();
        }
    };

    const getAbilityModifier = (score) => {
        return Math.floor((score - 10) / 2);
    };

    const formatModifier = (modifier) => {
        return modifier >= 0 ? `+${modifier}` : `${modifier}`;
    };

    const addListItem = (listName, item) => {
        setFormData(prev => ({
            ...prev,
            [listName]: [...prev[listName], item]
        }));
    };

    const removeListItem = (listName, index) => {
        setFormData(prev => ({
            ...prev,
            [listName]: prev[listName].filter((_, i) => i !== index)
        }));
    };

    const updateListItem = (listName, index, updatedItem) => {
        setFormData(prev => ({
            ...prev,
            [listName]: prev[listName].map((item, i) => i === index ? updatedItem : item)
        }));
    };

    return (
        <>
            <Modal isOpen={isOpen} onClose={onClose} size="6xl" scrollBehavior="inside">
                <ModalOverlay />
                <ModalContent bg="gray.800" color="white" maxH="90vh">
                    <ModalHeader>
                        <HStack justify="space-between">
                            <Text>{character ? formData.name || 'Character Sheet' : 'Create New Character'}</Text>
                            {character && (
                                <HStack spacing={2}>
                                    <IconButton
                                        icon={<FaUpload />}
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => setShowImageUpdate(true)}
                                        aria-label="Update character image"
                                        title="Update character image"
                                    />
                                    {!isEditing ? (
                                        <IconButton
                                            icon={<FaEdit />}
                                            size="sm"
                                            colorScheme="orange"
                                            onClick={() => setIsEditing(true)}
                                            aria-label="Edit character"
                                        />
                                    ) : (
                                        <HStack spacing={2}>
                                            <Button
                                                size="sm"
                                                onClick={handleCancel}
                                                variant="ghost"
                                            >
                                                Cancel
                                            </Button>
                                            <Button
                                                size="sm"
                                                colorScheme="orange"
                                                onClick={handleSave}
                                                isLoading={isSaving}
                                                leftIcon={<FaSave />}
                                            >
                                                Save
                                            </Button>
                                        </HStack>
                                    )}
                                </HStack>
                            )}
                        </HStack>
                    </ModalHeader>
                    <ModalCloseButton />
                    
                    <ModalBody>
                        <Tabs variant="enclosed" colorScheme="orange">
                            <TabList>
                                <Tab>Basic Info</Tab>
                                <Tab>Abilities & Skills</Tab>
                                <Tab>Combat</Tab>
                                <Tab>Spells & Feats</Tab>
                                <Tab>Inventory & Notes</Tab>
                            </TabList>
                            
                            <TabPanels>
                                {/* Basic Info Tab */}
                                <TabPanel>
                                    <VStack spacing={6} align="stretch">
                                        {/* Character Image and Basic Info */}
                                        <HStack spacing={6} align="start">
                                            {/* Character Image */}
                                            <Box>
                                                <Text mb={2} fontSize="sm" fontWeight="medium">Character Image</Text>
                                                <Box
                                                    width="120px"
                                                    height="120px"
                                                    borderRadius="md"
                                                    overflow="hidden"
                                                    border="2px solid"
                                                    borderColor="orange.400"
                                                    display="flex"
                                                    alignItems="center"
                                                    justifyContent="center"
                                                    bg="gray.700"
                                                    cursor={character ? "pointer" : "default"}
                                                    onClick={character ? () => setShowImageUpdate(true) : undefined}
                                                    _hover={character ? { borderColor: "orange.300" } : {}}
                                                >
                                                    {character?.assetId?.url ? (
                                                        <Image
                                                            src={character.assetId.url}
                                                            alt={character.name}
                                                            width="100%"
                                                            height="100%"
                                                            objectFit="cover"
                                                        />
                                                    ) : (
                                                        <Icon as={FaUser} boxSize={12} color="gray.400" />
                                                    )}
                                                </Box>
                                            </Box>

                                            {/* Basic Character Info */}
                                            <VStack spacing={4} flex="1" align="stretch">
                                                <SimpleGrid columns={2} spacing={4}>
                                                    <FormControl>
                                                        <FormLabel>Character Name</FormLabel>
                                                        {isEditing ? (
                                                            <Input
                                                                value={formData.name}
                                                                onChange={(e) => setFormData({...formData, name: e.target.value})}
                                                                placeholder="Enter character name"
                                                            />
                                                        ) : (
                                                            <Text fontSize="lg" fontWeight="medium">
                                                                {formData.name || 'Unnamed Character'}
                                                            </Text>
                                                        )}
                                                    </FormControl>

                                                    <FormControl>
                                                        <FormLabel>Level</FormLabel>
                                                        {isEditing ? (
                                                            <NumberInput
                                                                value={formData.level}
                                                                onChange={(val) => setFormData({...formData, level: parseInt(val) || 1})}
                                                                min={1}
                                                                max={20}
                                                            >
                                                                <NumberInputField />
                                                                <NumberInputStepper>
                                                                    <NumberIncrementStepper />
                                                                    <NumberDecrementStepper />
                                                                </NumberInputStepper>
                                                            </NumberInput>
                                                        ) : (
                                                            <Text fontSize="lg" fontWeight="medium">
                                                                {formData.level}
                                                            </Text>
                                                        )}
                                                    </FormControl>
                                                </SimpleGrid>

                                                <SimpleGrid columns={2} spacing={4}>
                                                    <FormControl>
                                                        <FormLabel>Class</FormLabel>
                                                        {isEditing ? (
                                                            <Input
                                                                value={formData.class}
                                                                onChange={(e) => setFormData({...formData, class: e.target.value})}
                                                                placeholder="e.g., Fighter, Wizard"
                                                            />
                                                        ) : (
                                                            <Text>{formData.class || 'Not specified'}</Text>
                                                        )}
                                                    </FormControl>

                                                    <FormControl>
                                                        <FormLabel>Race</FormLabel>
                                                        {isEditing ? (
                                                            <Input
                                                                value={formData.race}
                                                                onChange={(e) => setFormData({...formData, race: e.target.value})}
                                                                placeholder="e.g., Human, Elf"
                                                            />
                                                        ) : (
                                                            <Text>{formData.race || 'Not specified'}</Text>
                                                        )}
                                                    </FormControl>
                                                </SimpleGrid>

                                                <SimpleGrid columns={2} spacing={4}>
                                                    <FormControl>
                                                        <FormLabel>Background</FormLabel>
                                                        {isEditing ? (
                                                            <Input
                                                                value={formData.background}
                                                                onChange={(e) => setFormData({...formData, background: e.target.value})}
                                                                placeholder="e.g., Soldier, Acolyte"
                                                            />
                                                        ) : (
                                                            <Text>{formData.background || 'Not specified'}</Text>
                                                        )}
                                                    </FormControl>

                                                    <FormControl>
                                                        <FormLabel>Alignment</FormLabel>
                                                        {isEditing ? (
                                                            <Input
                                                                value={formData.alignment}
                                                                onChange={(e) => setFormData({...formData, alignment: e.target.value})}
                                                                placeholder="e.g., Lawful Good"
                                                            />
                                                        ) : (
                                                            <Text>{formData.alignment || 'Not specified'}</Text>
                                                        )}
                                                    </FormControl>
                                                </SimpleGrid>
                                            </VStack>
                                        </HStack>

                                        {/* Core Stats */}
                                        <Box>
                                            <Text mb={4} fontSize="lg" fontWeight="bold">Core Stats</Text>
                                            <SimpleGrid columns={3} spacing={4}>
                                                <FormControl>
                                                    <FormLabel>Hit Points</FormLabel>
                                                    {isEditing ? (
                                                        <HStack>
                                                            <NumberInput
                                                                value={formData.hitPoints.current}
                                                                onChange={(val) => setFormData({
                                                                    ...formData,
                                                                    hitPoints: {
                                                                        ...formData.hitPoints,
                                                                        current: parseInt(val) || 0
                                                                    }
                                                                })}
                                                                min={0}
                                                                size="sm"
                                                                flex="1"
                                                            >
                                                                <NumberInputField />
                                                            </NumberInput>
                                                            <Text>/</Text>
                                                            <NumberInput
                                                                value={formData.hitPoints.max}
                                                                onChange={(val) => setFormData({
                                                                    ...formData,
                                                                    hitPoints: {
                                                                        ...formData.hitPoints,
                                                                        max: parseInt(val) || 0
                                                                    }
                                                                })}
                                                                min={0}
                                                                size="sm"
                                                                flex="1"
                                                            >
                                                                <NumberInputField />
                                                            </NumberInput>
                                                        </HStack>
                                                    ) : (
                                                        <Text fontSize="lg" fontWeight="medium">
                                                            {formData.hitPoints.current || 0} / {formData.hitPoints.max || 0}
                                                        </Text>
                                                    )}
                                                </FormControl>

                                                <FormControl>
                                                    <FormLabel>Armor Class</FormLabel>
                                                    {isEditing ? (
                                                        <NumberInput
                                                            value={formData.armorClass}
                                                            onChange={(val) => setFormData({...formData, armorClass: parseInt(val) || 10})}
                                                            min={1}
                                                        >
                                                            <NumberInputField />
                                                            <NumberInputStepper>
                                                                <NumberIncrementStepper />
                                                                <NumberDecrementStepper />
                                                            </NumberInputStepper>
                                                        </NumberInput>
                                                    ) : (
                                                        <Text fontSize="lg" fontWeight="medium">
                                                            {formData.armorClass}
                                                        </Text>
                                                    )}
                                                </FormControl>

                                                <FormControl>
                                                    <FormLabel>Speed</FormLabel>
                                                    {isEditing ? (
                                                        <NumberInput
                                                            value={formData.speed}
                                                            onChange={(val) => setFormData({...formData, speed: parseInt(val) || 30})}
                                                            min={0}
                                                        >
                                                            <NumberInputField />
                                                            <NumberInputStepper>
                                                                <NumberIncrementStepper />
                                                                <NumberDecrementStepper />
                                                            </NumberInputStepper>
                                                        </NumberInput>
                                                    ) : (
                                                        <Text fontSize="lg" fontWeight="medium">
                                                            {formData.speed} ft
                                                        </Text>
                                                    )}
                                                </FormControl>
                                            </SimpleGrid>
                                        </Box>
                                    </VStack>
                                </TabPanel>

                                {/* Abilities & Skills Tab */}
                                <TabPanel>
                                    <VStack spacing={6} align="stretch">
                                        {/* Ability Scores */}
                                        <Box>
                                            <Text mb={4} fontSize="lg" fontWeight="bold">Ability Scores</Text>
                                            <SimpleGrid columns={3} spacing={4}>
                                                {Object.entries(formData.abilities).map(([ability, abilityData]) => {
                                                    const score = abilityData.score || abilityData || 10;
                                                    const modifier = abilityData.modifier || getAbilityModifier(score);
                                                    return (
                                                        <Box key={ability} textAlign="center" p={3} border="1px" borderColor="gray.600" borderRadius="md">
                                                            <Text fontSize="sm" fontWeight="bold" textTransform="capitalize" mb={2}>
                                                                {ability}
                                                            </Text>
                                                            {isEditing ? (
                                                                <NumberInput
                                                                    value={score}
                                                                    onChange={(val) => {
                                                                        const newScore = parseInt(val) || 10;
                                                                        const newModifier = Math.floor((newScore - 10) / 2);
                                                                        setFormData({
                                                                            ...formData,
                                                                            abilities: {
                                                                                ...formData.abilities,
                                                                                [ability]: { score: newScore, modifier: newModifier }
                                                                            }
                                                                        });
                                                                    }}
                                                                    min={1}
                                                                    max={20}
                                                                    size="sm"
                                                                >
                                                                    <NumberInputField textAlign="center" />
                                                                    <NumberInputStepper>
                                                                        <NumberIncrementStepper />
                                                                        <NumberDecrementStepper />
                                                                    </NumberInputStepper>
                                                                </NumberInput>
                                                            ) : (
                                                                <Text fontSize="2xl" fontWeight="bold">
                                                                    {score}
                                                                </Text>
                                                            )}
                                                            <Text fontSize="sm" color="gray.400">
                                                                {formatModifier(modifier)}
                                                            </Text>
                                                        </Box>
                                                    );
                                                })}
                                            </SimpleGrid>
                                        </Box>
                                    </VStack>
                                </TabPanel>

                                {/* Combat Tab */}
                                <TabPanel>
                                    <VStack spacing={6} align="stretch">
                                        {/* Attacks */}
                                        <Box>
                                            <HStack justify="space-between" mb={4}>
                                                <Text fontSize="lg" fontWeight="bold">Attacks</Text>
                                                {isEditing && (
                                                    <Button
                                                        size="sm"
                                                        leftIcon={<FaPlus />}
                                                        onClick={() => addListItem('attacks', {
                                                            name: '',
                                                            damage: '',
                                                            bonus: '',
                                                            damageType: '',
                                                            range: '',
                                                            description: ''
                                                        })}
                                                    >
                                                        Add Attack
                                                    </Button>
                                                )}
                                            </HStack>
                                            
                                            {formData.attacks.length === 0 ? (
                                                <Text color="gray.400">No attacks added</Text>
                                            ) : (
                                                <VStack spacing={3}>
                                                    {formData.attacks.map((attack, index) => (
                                                        <Box key={index} p={3} border="1px" borderColor="gray.600" borderRadius="md" w="full">
                                                            {isEditing ? (
                                                                <VStack spacing={3}>
                                                                    <HStack w="full" justify="space-between">
                                                                        <Input
                                                                            placeholder="Attack name"
                                                                            value={attack.name || ''}
                                                                            onChange={(e) => updateListItem('attacks', index, {
                                                                                ...attack,
                                                                                name: e.target.value
                                                                            })}
                                                                            flex="1"
                                                                        />
                                                                        <IconButton
                                                                            icon={<FaTrash />}
                                                                            size="sm"
                                                                            colorScheme="red"
                                                                            onClick={() => removeListItem('attacks', index)}
                                                                            aria-label="Remove attack"
                                                                        />
                                                                    </HStack>
                                                                    <SimpleGrid columns={3} spacing={3} w="full">
                                                                        <Input
                                                                            placeholder="Damage (e.g., 1d8+3)"
                                                                            value={attack.damage || ''}
                                                                            onChange={(e) => updateListItem('attacks', index, {
                                                                                ...attack,
                                                                                damage: e.target.value
                                                                            })}
                                                                        />
                                                                        <Input
                                                                            placeholder="Attack bonus (e.g., +5)"
                                                                            value={attack.bonus || ''}
                                                                            onChange={(e) => updateListItem('attacks', index, {
                                                                                ...attack,
                                                                                bonus: e.target.value
                                                                            })}
                                                                        />
                                                                        <Input
                                                                            placeholder="Damage type"
                                                                            value={attack.damageType || ''}
                                                                            onChange={(e) => updateListItem('attacks', index, {
                                                                                ...attack,
                                                                                damageType: e.target.value
                                                                            })}
                                                                        />
                                                                    </SimpleGrid>
                                                                </VStack>
                                                            ) : (
                                                                <VStack spacing={2} align="start">
                                                                    <HStack>
                                                                        <Text fontWeight="bold">{attack.name}</Text>
                                                                        <Badge>{attack.bonus}</Badge>
                                                                    </HStack>
                                                                    <Text color="gray.400">
                                                                        {attack.damage} {attack.damageType} damage
                                                                    </Text>
                                                                </VStack>
                                                            )}
                                                        </Box>
                                                    ))}
                                                </VStack>
                                            )}
                                        </Box>
                                    </VStack>
                                </TabPanel>

                                {/* Spells & Feats Tab */}
                                <TabPanel>
                                    <VStack spacing={6} align="stretch">
                                        {/* Spells */}
                                        <Box>
                                            <HStack justify="space-between" mb={4}>
                                                <Text fontSize="lg" fontWeight="bold">Spells</Text>
                                                {isEditing && (
                                                    <Button
                                                        size="sm"
                                                        leftIcon={<FaPlus />}
                                                        onClick={() => addListItem('spells', {
                                                            name: '',
                                                            level: 1,
                                                            school: '',
                                                            castingTime: '',
                                                            range: '',
                                                            duration: '',
                                                            description: ''
                                                        })}
                                                    >
                                                        Add Spell
                                                    </Button>
                                                )}
                                            </HStack>
                                            
                                            {formData.spells.length === 0 ? (
                                                <Text color="gray.400">No spells added</Text>
                                            ) : (
                                                <VStack spacing={3}>
                                                    {formData.spells.map((spell, index) => (
                                                        <Box key={index} p={3} border="1px" borderColor="gray.600" borderRadius="md" w="full">
                                                            {isEditing ? (
                                                                <VStack spacing={3}>
                                                                    <HStack w="full">
                                                                        <Input
                                                                            placeholder="Spell name"
                                                                            value={spell.name || ''}
                                                                            onChange={(e) => updateListItem('spells', index, {
                                                                                ...spell,
                                                                                name: e.target.value
                                                                            })}
                                                                            flex="1"
                                                                        />
                                                                        <NumberInput
                                                                            value={spell.level}
                                                                            onChange={(val) => updateListItem('spells', index, {
                                                                                ...spell,
                                                                                level: parseInt(val) || 1
                                                                            })}
                                                                            min={0}
                                                                            max={9}
                                                                            w="80px"
                                                                        >
                                                                            <NumberInputField />
                                                                        </NumberInput>
                                                                        <IconButton
                                                                            icon={<FaTrash />}
                                                                            size="sm"
                                                                            colorScheme="red"
                                                                            onClick={() => removeListItem('spells', index)}
                                                                            aria-label="Remove spell"
                                                                        />
                                                                    </HStack>
                                                                    <Textarea
                                                                        placeholder="Spell description"
                                                                        value={spell.description || ''}
                                                                        onChange={(e) => updateListItem('spells', index, {
                                                                            ...spell,
                                                                            description: e.target.value
                                                                        })}
                                                                        rows={2}
                                                                    />
                                                                </VStack>
                                                            ) : (
                                                                <VStack spacing={2} align="start">
                                                                    <HStack>
                                                                        <Text fontWeight="bold">{spell.name}</Text>
                                                                        <Badge colorScheme="blue">Level {spell.level}</Badge>
                                                                    </HStack>
                                                                    {spell.description && (
                                                                        <Text color="gray.400" fontSize="sm">
                                                                            {spell.description}
                                                                        </Text>
                                                                    )}
                                                                </VStack>
                                                            )}
                                                        </Box>
                                                    ))}
                                                </VStack>
                                            )}
                                        </Box>

                                        <Divider />

                                        {/* Feats */}
                                        <Box>
                                            <HStack justify="space-between" mb={4}>
                                                <Text fontSize="lg" fontWeight="bold">Feats</Text>
                                                {isEditing && (
                                                    <Button
                                                        size="sm"
                                                        leftIcon={<FaPlus />}
                                                        onClick={() => addListItem('feats', {
                                                            name: '',
                                                            description: ''
                                                        })}
                                                    >
                                                        Add Feat
                                                    </Button>
                                                )}
                                            </HStack>
                                            
                                            {formData.feats.length === 0 ? (
                                                <Text color="gray.400">No feats added</Text>
                                            ) : (
                                                <VStack spacing={3}>
                                                    {formData.feats.map((feat, index) => (
                                                        <Box key={index} p={3} border="1px" borderColor="gray.600" borderRadius="md" w="full">
                                                            {isEditing ? (
                                                                <VStack spacing={3}>
                                                                    <HStack w="full">
                                                                        <Input
                                                                            placeholder="Feat name"
                                                                            value={feat.name || ''}
                                                                            onChange={(e) => updateListItem('feats', index, {
                                                                                ...feat,
                                                                                name: e.target.value
                                                                            })}
                                                                            flex="1"
                                                                        />
                                                                        <IconButton
                                                                            icon={<FaTrash />}
                                                                            size="sm"
                                                                            colorScheme="red"
                                                                            onClick={() => removeListItem('feats', index)}
                                                                            aria-label="Remove feat"
                                                                        />
                                                                    </HStack>
                                                                    <Textarea
                                                                        placeholder="Feat description"
                                                                        value={feat.description || ''}
                                                                        onChange={(e) => updateListItem('feats', index, {
                                                                            ...feat,
                                                                            description: e.target.value
                                                                        })}
                                                                        rows={2}
                                                                    />
                                                                </VStack>
                                                            ) : (
                                                                <VStack spacing={2} align="start">
                                                                    <Text fontWeight="bold">{feat.name}</Text>
                                                                    {feat.description && (
                                                                        <Text color="gray.400" fontSize="sm">
                                                                            {feat.description}
                                                                        </Text>
                                                                    )}
                                                                </VStack>
                                                            )}
                                                        </Box>
                                                    ))}
                                                </VStack>
                                            )}
                                        </Box>
                                    </VStack>
                                </TabPanel>

                                {/* Inventory & Notes Tab */}
                                <TabPanel>
                                    <VStack spacing={6} align="stretch">
                                        {/* Notes */}
                                        <Box>
                                            <Text mb={4} fontSize="lg" fontWeight="bold">Notes</Text>
                                            {isEditing ? (
                                                <Textarea
                                                    value={formData.notes}
                                                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                                                    placeholder="Character notes, backstory, etc."
                                                    rows={6}
                                                />
                                            ) : (
                                                <Box p={3} border="1px" borderColor="gray.600" borderRadius="md" minH="150px">
                                                    <Text whiteSpace="pre-wrap">
                                                        {formData.notes || 'No notes added'}
                                                    </Text>
                                                </Box>
                                            )}
                                        </Box>
                                    </VStack>
                                </TabPanel>
                            </TabPanels>
                        </Tabs>
                    </ModalBody>

                    <ModalFooter>
                        <HStack spacing={3}>
                            <Button variant="ghost" onClick={onClose}>
                                Close
                            </Button>
                            {(!character || isEditing) && (
                                <Button
                                    colorScheme="orange"
                                    onClick={handleSave}
                                    isLoading={isSaving}
                                    leftIcon={<FaSave />}
                                >
                                    {character ? 'Save Changes' : 'Create Character'}
                                </Button>
                            )}
                        </HStack>
                    </ModalFooter>
                </ModalContent>
            </Modal>

            {/* Character Image Update Modal */}
            {character && (
                <CharacterImageUpdate
                    isOpen={showImageUpdate}
                    onClose={() => setShowImageUpdate(false)}
                    character={character}
                    campaignId={character.campaignId}
                    onUpdate={onUpdate}
                />
            )}
        </>
    );
};

export default CharacterSheet;