import React from 'react';
import {
    Box,
    Button,
    Card,
    CardBody,
    Container,
    Heading,
    HStack,
    Text,
    VStack,
    useColorModeValue,
    Icon,
    SimpleGrid,
    Badge
} from '@chakra-ui/react';
import { Link as RouterLink } from 'react-router-dom';
import { FiArrowRight, FiUser, FiUserPlus } from 'react-icons/fi';

const UnauthenticatedCTA = () => {
    const cardBg = useColorModeValue('white', 'gray.800');
    const borderColor = useColorModeValue('gray.200', 'gray.600');
    const textColor = useColorModeValue('gray.600', 'gray.300');

    return (
        <Container maxW="container.lg" py={{ base: 8, md: 12 }}>
            <VStack spacing={{ base: 8, md: 12 }}>
                {/* Main CTA Section */}
                <Card
                    bg={cardBg}
                    borderColor="orange.200"
                    borderWidth="2px"
                    borderRadius="xl"
                    shadow="lg"
                    w="full"
                    maxW="2xl"
                    mx="auto"
                >
                    <CardBody p={{ base: 8, md: 10 }}>
                        <VStack spacing={6} textAlign="center">
                            <Badge
                                colorScheme="orange"
                                variant="subtle"
                                px={3}
                                py={1}
                                borderRadius="full"
                                fontSize="xs"
                            >
                                Free to Use
                            </Badge>
                            
                            <VStack spacing={4}>
                                <Heading
                                    size={{ base: "lg", md: "xl" }}
                                    color="orange.500"
                                >
                                    Ready to Start Playing?
                                </Heading>
                                <Text
                                    fontSize={{ base: "md", md: "lg" }}
                                    color={textColor}
                                    maxW="md"
                                    lineHeight="tall"
                                >
                                    Join the community of Game Masters and players who choose simplicity 
                                    over complexity. Create your account and start your first campaign today.
                                </Text>
                            </VStack>

                            <HStack spacing={4} pt={2}>
                                <Button
                                    as={RouterLink}
                                    to="/signup"
                                    size="lg"
                                    colorScheme="orange"
                                    leftIcon={<Icon as={FiUserPlus} />}
                                    rightIcon={<Icon as={FiArrowRight} />}
                                    _hover={{
                                        transform: 'translateY(-1px)',
                                        shadow: 'lg',
                                    }}
                                    transition="all 0.2s"
                                >
                                    Create Account
                                </Button>
                                <Button
                                    as={RouterLink}
                                    to="/login"
                                    size="lg"
                                    variant="outline"
                                    colorScheme="orange"
                                    leftIcon={<Icon as={FiUser} />}
                                    _hover={{
                                        transform: 'translateY(-1px)',
                                        shadow: 'md',
                                    }}
                                    transition="all 0.2s"
                                >
                                    Sign In
                                </Button>
                            </HStack>
                        </VStack>
                    </CardBody>
                </Card>

                {/* Benefits Grid */}
                <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6} w="full" maxW="4xl">
                    <BenefitCard
                        title="For Game Masters"
                        description="Create immersive campaigns with drag-and-drop simplicity"
                        icon="🎲"
                    />
                    <BenefitCard
                        title="For Players"
                        description="Focus on roleplay, not learning complex software"
                        icon="⚔️"
                    />
                    <BenefitCard
                        title="For Groups"
                        description="Real-time collaboration that just works"
                        icon="👥"
                    />
                </SimpleGrid>
            </VStack>
        </Container>
    );
};

const BenefitCard = ({ title, description, icon }) => {
    const cardBg = useColorModeValue('gray.50', 'gray.700');
    const textColor = useColorModeValue('gray.600', 'gray.300');

    return (
        <Card bg={cardBg} borderRadius="lg" shadow="sm" h="full">
            <CardBody p={6} textAlign="center">
                <VStack spacing={3}>
                    <Text fontSize="3xl" role="img">
                        {icon}
                    </Text>
                    <Heading size="sm" color="orange.500">
                        {title}
                    </Heading>
                    <Text fontSize="sm" color={textColor} lineHeight="tall">
                        {description}
                    </Text>
                </VStack>
            </CardBody>
        </Card>
    );
};

export default UnauthenticatedCTA;