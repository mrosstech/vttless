import React from 'react';
import {
    Box, VStack, Text, Image, Badge, HStack,
    Card, CardBody, IconButton, useColorModeValue
} from '@chakra-ui/react';
import { FaUser, FaEdit } from 'react-icons/fa';

const CharacterCard = ({ character, onClick, onEdit }) => {
    const cardBg = useColorModeValue('white', 'gray.700');
    const borderColor = useColorModeValue('gray.200', 'gray.600');
    const textColor = useColorModeValue('gray.800', 'white');

    const handleEditClick = (e) => {
        e.stopPropagation();
        if (onEdit) {
            onEdit(character);
        }
    };

    return (
        <Card
            bg={cardBg}
            borderColor={borderColor}
            borderWidth="1px"
            cursor="pointer"
            transition="all 0.2s"
            _hover={{
                borderColor: 'orange.400',
                boxShadow: '0 4px 12px rgba(255, 165, 0, 0.15)',
                transform: 'translateY(-2px)'
            }}
            onClick={onClick}
        >
            <CardBody p={4}>
                <VStack spacing={3} align="center">
                    {/* Character Image */}
                    <Box
                        width="80px"
                        height="80px"
                        borderRadius="full"
                        overflow="hidden"
                        border="2px solid"
                        borderColor="orange.400"
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                        bg="gray.600"
                    >
                        {character.assetId?.url ? (
                            <Image
                                src={character.assetId.url}
                                alt={character.name}
                                width="100%"
                                height="100%"
                                objectFit="cover"
                            />
                        ) : (
                            <FaUser size="32" color="gray.400" />
                        )}
                    </Box>

                    {/* Character Name */}
                    <Text
                        fontWeight="bold"
                        fontSize="lg"
                        textAlign="center"
                        color={textColor}
                        noOfLines={1}
                    >
                        {character.name || 'Unnamed Character'}
                    </Text>

                    {/* Character Details */}
                    <VStack spacing={2} w="full">
                        {/* Class and Level */}
                        {character.class && (
                            <HStack justify="space-between" w="full">
                                <Text fontSize="sm" color="gray.500">Class:</Text>
                                <Badge colorScheme="orange" variant="subtle">
                                    {character.class} {character.level ? `Lv.${character.level}` : ''}
                                </Badge>
                            </HStack>
                        )}

                        {/* Race */}
                        {character.race && (
                            <HStack justify="space-between" w="full">
                                <Text fontSize="sm" color="gray.500">Race:</Text>
                                <Text fontSize="sm" color={textColor}>
                                    {character.race}
                                </Text>
                            </HStack>
                        )}

                        {/* HP */}
                        {character.hitPoints && (
                            <HStack justify="space-between" w="full">
                                <Text fontSize="sm" color="gray.500">HP:</Text>
                                <Text fontSize="sm" color={textColor} fontWeight="medium">
                                    {typeof character.hitPoints === 'object' 
                                        ? `${character.hitPoints.current || 0}/${character.hitPoints.max || 0}`
                                        : `${character.hitPoints || 0}/${character.hitPoints || 0}`
                                    }
                                </Text>
                            </HStack>
                        )}

                        {/* AC */}
                        {character.armorClass && (
                            <HStack justify="space-between" w="full">
                                <Text fontSize="sm" color="gray.500">AC:</Text>
                                <Text fontSize="sm" color={textColor} fontWeight="medium">
                                    {character.armorClass}
                                </Text>
                            </HStack>
                        )}
                    </VStack>

                    {/* Campaign Info */}
                    {character.campaignId && (
                        <Badge colorScheme="blue" variant="outline" fontSize="xs">
                            {character.campaignId.name || 'Campaign Character'}
                        </Badge>
                    )}
                </VStack>

                {/* Edit Button */}
                {onEdit && (
                    <Box position="absolute" top={2} right={2}>
                        <IconButton
                            icon={<FaEdit />}
                            size="sm"
                            variant="ghost"
                            colorScheme="orange"
                            onClick={handleEditClick}
                            aria-label="Edit character"
                        />
                    </Box>
                )}
            </CardBody>
        </Card>
    );
};

export default CharacterCard;