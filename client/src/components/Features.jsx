import React from 'react';
import {
    Box,
    Container,
    Heading,
    Text,
    VStack,
    HStack,
    SimpleGrid,
    Card,
    CardBody,
    Icon,
    useColorModeValue,
    Badge,
    List,
    ListItem,
    ListIcon
} from '@chakra-ui/react';
import { 
    FiMap, 
    FiUsers, 
    FiZap, 
    FiUpload, 
    FiVideo, 
    FiGrid,
    FiMove,
    FiEye,
    FiCheck
} from 'react-icons/fi';

const Features = () => {
    const cardBg = useColorModeValue('white', 'gray.800');
    const borderColor = useColorModeValue('gray.200', 'gray.600');
    const textColor = useColorModeValue('gray.600', 'gray.300');

    return (
        <Box py={{ base: 12, md: 16 }} bg={useColorModeValue('gray.50', 'gray.900')}>
            <Container maxW="container.xl">
                <VStack spacing={{ base: 12, md: 16 }}>
                    {/* Section Header */}
                    <VStack spacing={4} textAlign="center" maxW="3xl">
                        <Heading
                            size={{ base: "xl", md: "2xl" }}
                            color="orange.500"
                            fontWeight="bold"
                        >
                            Everything You Need, Nothing You Don't
                        </Heading>
                        <Text
                            fontSize={{ base: "lg", md: "xl" }}
                            color={textColor}
                            lineHeight="tall"
                        >
                            vttLess focuses on the essentials of virtual tabletop gaming, 
                            delivering a streamlined experience that gets out of your way.
                        </Text>
                    </VStack>

                    {/* Main Features Grid */}
                    <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={8} w="full">
                        <FeatureCard
                            icon={FiMap}
                            title="Dynamic Maps"
                            description="Drag and drop backgrounds, create grids, and build immersive environments in seconds."
                            features={[
                                "Customizable grid system",
                                "Background image support",
                                "Real-time map sharing"
                            ]}
                        />
                        
                        <FeatureCard
                            icon={FiUpload}
                            title="Simple Token Management"
                            description="Add character tokens by dragging images directly onto the map. No complex setup required."
                            features={[
                                "Drag & drop token creation",
                                "Automatic grid snapping",
                                "Player ownership controls"
                            ]}
                        />

                        <FeatureCard
                            icon={FiUsers}
                            title="Real-Time Collaboration"
                            description="See token movements instantly as players explore your world together."
                            features={[
                                "Live token synchronization",
                                "Multi-player sessions",
                                "Campaign management"
                            ]}
                        />

                        <FeatureCard
                            icon={FiVideo}
                            title="Integrated Video Chat"
                            description="Built-in video conferencing keeps your group connected without extra tools."
                            features={[
                                "Voice & video support",
                                "No external apps needed",
                                "Optimized for gaming"
                            ]}
                            badge="Built-in"
                        />

                        <FeatureCard
                            icon={FiMove}
                            title="Intuitive Controls"
                            description="Pan, zoom, and move tokens with natural mouse controls that feel familiar."
                            features={[
                                "Mouse wheel zooming",
                                "Smooth panning",
                                "Touch-friendly interface"
                            ]}
                        />

                        <FeatureCard
                            icon={FiZap}
                            title="Fast & Lightweight"
                            description="No bloated features or endless configuration. Just what you need to play."
                            features={[
                                "Quick loading times",
                                "Minimal system requirements",
                                "Clean, focused interface"
                            ]}
                            badge="Performance"
                        />
                    </SimpleGrid>

                    {/* Coming Soon Section */}
                    <VStack spacing={6} textAlign="center" w="full" maxW="2xl">
                        <Badge
                            colorScheme="orange"
                            variant="subtle"
                            px={4}
                            py={2}
                            borderRadius="full"
                            fontSize="sm"
                        >
                            🚀 Coming Soon
                        </Badge>
                        <VStack spacing={2}>
                            <Heading size="lg" color="orange.500">
                                More Features in Development
                            </Heading>
                            <Text color={textColor} fontSize="md">
                                We're constantly improving vttLess based on community feedback. 
                                Stay tuned for dice rolling, character sheets, and more!
                            </Text>
                        </VStack>
                    </VStack>
                </VStack>
            </Container>
        </Box>
    );
};

const FeatureCard = ({ icon, title, description, features, badge }) => {
    const cardBg = useColorModeValue('white', 'gray.800');
    const borderColor = useColorModeValue('gray.200', 'gray.600');
    const textColor = useColorModeValue('gray.600', 'gray.300');

    return (
        <Card
            bg={cardBg}
            borderColor={borderColor}
            borderWidth="1px"
            borderRadius="xl"
            shadow="sm"
            h="full"
            position="relative"
            _hover={{
                shadow: 'md',
                borderColor: 'orange.300',
                transform: 'translateY(-2px)'
            }}
            transition="all 0.2s"
        >
            {badge && (
                <Badge
                    position="absolute"
                    top={4}
                    right={4}
                    colorScheme="orange"
                    variant="solid"
                    fontSize="xs"
                    px={2}
                    py={1}
                >
                    {badge}
                </Badge>
            )}
            
            <CardBody p={8}>
                <VStack spacing={4} align="start" h="full">
                    <Icon as={icon} boxSize={10} color="orange.400" />
                    
                    <VStack spacing={2} align="start">
                        <Heading size="md" color="orange.500">
                            {title}
                        </Heading>
                        <Text color={textColor} fontSize="sm" lineHeight="tall">
                            {description}
                        </Text>
                    </VStack>

                    <List spacing={2} flex={1}>
                        {features.map((feature, index) => (
                            <ListItem key={index} fontSize="sm" color={textColor}>
                                <ListIcon as={FiCheck} color="orange.400" />
                                {feature}
                            </ListItem>
                        ))}
                    </List>
                </VStack>
            </CardBody>
        </Card>
    );
};

export default Features;