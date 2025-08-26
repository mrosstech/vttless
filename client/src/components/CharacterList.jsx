import React, { useEffect, useState } from 'react';
import {
    Container, VStack, Box, SimpleGrid, Heading, Button,
    useToast, Center, Spinner, Text, useDisclosure, Alert, AlertIcon,
    AlertTitle, AlertDescription, Link
} from '@chakra-ui/react';
import { FiPlus } from 'react-icons/fi';
import CharacterCard from './CharacterCard';
import CharacterSheet from './CharacterSheet';
import { useAuth } from '../providers/AuthProvider';
import { api } from '../common/axiosPrivate.js';

const CharacterList = () => {
    const { user } = useAuth();
    const [characters, setCharacters] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedCharacter, setSelectedCharacter] = useState(null);
    const { isOpen, onOpen, onClose } = useDisclosure();
    const toast = useToast();

    const fetchCharacters = async () => {
        setIsLoading(true);
        try {
            const response = await api.get('/characters');
            setCharacters(response.data);
        } catch (error) {
            toast({
                title: 'Error fetching characters',
                description: error.response?.data?.message || 'Something went wrong',
                status: 'error'
            });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchCharacters();
    }, []);

    // Listen for character imports from D&D Beyond extension
    useEffect(() => {
        const handleCharacterImport = (event) => {
            console.log('🎯 Character import detected from extension:', event.detail);
            // Refresh the character list when a character is imported
            fetchCharacters();
            toast({
                title: 'Character Imported',
                description: `Successfully imported ${event.detail.characterName || 'character'} from D&D Beyond`,
                status: 'success',
                duration: 5000
            });
        };

        // Add event listener for character imports
        window.addEventListener('vttless:character-imported', handleCharacterImport);

        // Cleanup event listener on unmount
        return () => {
            window.removeEventListener('vttless:character-imported', handleCharacterImport);
        };
    }, [toast]);

    const handleCharacterClick = (character) => {
        setSelectedCharacter(character);
        onOpen();
    };

    const handleCharacterUpdate = (updatedCharacter) => {
        setCharacters(prevCharacters =>
            prevCharacters.map(char =>
                char._id === updatedCharacter._id ? updatedCharacter : char
            )
        );
        setSelectedCharacter(updatedCharacter);
    };

    const handleNewCharacter = () => {
        setSelectedCharacter(null);
        onOpen();
    };

    if (isLoading) {
        return (
            <Center h="50vh">
                <VStack spacing={4}>
                    <Spinner size="xl" color="orange.500" />
                    <Text>Loading characters...</Text>
                </VStack>
            </Center>
        );
    }

    return (
        <Container maxW="container.xl" py={8}>
            <VStack spacing={6} w="full">
                {/* Header */}
                <Box w="full" textAlign="center">
                    <Heading mb={4} color="orange.400">My Characters</Heading>
                    <Button
                        leftIcon={<FiPlus />}
                        colorScheme="orange"
                        onClick={handleNewCharacter}
                        size="lg"
                    >
                        Create New Character
                    </Button>
                </Box>

                {/* D&D Beyond Integration Info */}
                <Alert status="info" borderRadius="md">
                    <AlertIcon />
                    <VStack align="start" spacing={2} flex="1">
                        <AlertTitle fontSize="sm">D&D Beyond Integration Available!</AlertTitle>
                        <AlertDescription fontSize="sm">
                            Install our <Link color="orange.400" textDecoration="underline" isExternal>
                                Chrome Extension
                            </Link> to import characters directly from D&D Beyond character sheets.
                            Simply visit a character sheet on D&D Beyond and click the sync button!
                        </AlertDescription>
                    </VStack>
                </Alert>

                {/* Characters Grid */}
                {characters.length === 0 ? (
                    <Box textAlign="center" py={12}>
                        <Text fontSize="lg" color="gray.500" mb={4}>
                            You don't have any characters yet
                        </Text>
                        <Text color="gray.400">
                            Create your first character to get started!
                        </Text>
                    </Box>
                ) : (
                    <SimpleGrid columns={{ base: 1, md: 2, lg: 3, xl: 4 }} spacing={6} w="full">
                        {characters.map(character => (
                            <CharacterCard
                                key={character._id}
                                character={character}
                                onClick={() => handleCharacterClick(character)}
                            />
                        ))}
                    </SimpleGrid>
                )}

                {/* Character Sheet Modal */}
                <CharacterSheet
                    isOpen={isOpen}
                    onClose={onClose}
                    character={selectedCharacter}
                    onUpdate={handleCharacterUpdate}
                    onSave={fetchCharacters}
                />
            </VStack>
        </Container>
    );
};

export default CharacterList;