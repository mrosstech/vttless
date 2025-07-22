import React from 'react';
import {
    Box,
    Heading,
    Text,
    VStack,
    Container,
    useColorModeValue,
    Icon,
    HStack,
    Badge
} from '@chakra-ui/react';
import { FiMap, FiUsers, FiZap } from 'react-icons/fi';

const Hero = () => {
    const bgGradient = useColorModeValue(
        'linear(to-r, orange.400, red.400)',
        'linear(to-r, orange.500, red.500)'
    );
    
    const textColor = useColorModeValue('gray.600', 'gray.300');

    return (
        <Box
            py={{ base: 12, md: 20 }}
            px={{ base: 4, md: 8 }}
            textAlign="center"
            position="relative"
        >
            <Container maxW="container.lg">
                <VStack spacing={{ base: 6, md: 8 }}>
                    {/* Beta Badge */}
                    <Badge
                        colorScheme="orange"
                        variant="subtle"
                        px={4}
                        py={2}
                        borderRadius="full"
                        fontSize="sm"
                        fontWeight="bold"
                    >
                        🚧 Currently in Development
                    </Badge>

                    {/* Main Headline */}
                    <VStack spacing={4}>
                        <Heading
                            as="h1"
                            size={{ base: "xl", md: "2xl", lg: "3xl" }}
                            bgGradient={bgGradient}
                            bgClip="text"
                            fontWeight="black"
                            lineHeight="shorter"
                        >
                            vttLess
                        </Heading>
                        <Heading
                            as="h2"
                            size={{ base: "md", md: "lg", lg: "xl" }}
                            color={textColor}
                            fontWeight="medium"
                            maxW="2xl"
                        >
                            A minimal virtual tabletop for focused tabletop gaming
                        </Heading>
                    </VStack>

                    {/* Value Proposition */}
                    <Text
                        fontSize={{ base: "lg", md: "xl" }}
                        color={textColor}
                        maxW="3xl"
                        lineHeight="tall"
                    >
                        Cut through the complexity. vttLess gives you just what you need for immersive 
                        tabletop sessions: maps, tokens, and seamless collaboration.
                    </Text>

                    {/* Feature Highlights */}
                    <HStack
                        spacing={{ base: 6, md: 12 }}
                        pt={{ base: 6, md: 8 }}
                        flexWrap="wrap"
                        justify="center"
                    >
                        <VStack spacing={2}>
                            <Icon as={FiMap} boxSize={8} color="orange.400" />
                            <Text fontSize="sm" fontWeight="semibold" color={textColor}>
                                Simple Maps
                            </Text>
                        </VStack>
                        <VStack spacing={2}>
                            <Icon as={FiUsers} boxSize={8} color="orange.400" />
                            <Text fontSize="sm" fontWeight="semibold" color={textColor}>
                                Real-time Play
                            </Text>
                        </VStack>
                        <VStack spacing={2}>
                            <Icon as={FiZap} boxSize={8} color="orange.400" />
                            <Text fontSize="sm" fontWeight="semibold" color={textColor}>
                                No Bloat
                            </Text>
                        </VStack>
                    </HStack>
                </VStack>
            </Container>
        </Box>
    );
};

export default Hero;