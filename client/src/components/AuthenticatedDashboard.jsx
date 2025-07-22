import React from 'react';
import {
    Box,
    Card,
    CardBody,
    CardHeader,
    Container,
    Heading,
    Text,
    VStack,
    useColorModeValue,
    Skeleton,
    SkeletonText
} from '@chakra-ui/react';
import CampaignList from './CampaignList';
import { useAuth } from '../providers/AuthProvider';

const AuthenticatedDashboard = () => {
    const { user } = useAuth();
    const cardBg = useColorModeValue('white', 'gray.800');
    const borderColor = useColorModeValue('gray.200', 'gray.600');

    if (!user) {
        return <DashboardSkeleton />;
    }

    return (
        <Container maxW="container.xl" py={{ base: 6, md: 8 }}>
            <VStack spacing={{ base: 6, md: 8 }} align="stretch">
                {/* Welcome Section */}
                <Box textAlign="center" py={{ base: 4, md: 6 }}>
                    <Heading 
                        size={{ base: "lg", md: "xl" }}
                        color="orange.500"
                        mb={2}
                    >
                        Welcome back, {user.user?.username || 'Adventurer'}!
                    </Heading>
                    <Text 
                        fontSize={{ base: "md", md: "lg" }}
                        color="gray.600"
                        maxW="2xl"
                        mx="auto"
                    >
                        Ready to continue your adventures? Manage your campaigns below or create a new one.
                    </Text>
                </Box>

                {/* Personal Updates Card */}
                <Card
                    bg={cardBg}
                    borderColor={borderColor}
                    borderWidth="1px"
                    borderRadius="lg"
                    shadow="sm"
                    maxW="4xl"
                    mx="auto"
                    w="full"
                >
                    <CardHeader pb={2}>
                        <Heading size="sm" color="orange.500">
                            📢 Personal Updates
                        </Heading>
                    </CardHeader>
                    <CardBody pt={0}>
                        <VStack spacing={3} align="start">
                            <Text fontSize="sm" color="gray.600">
                                🎉 Welcome to vttLess! Your personalized dashboard is ready.
                            </Text>
                            <Text fontSize="sm" color="gray.600">
                                💡 Pro tip: Drag and drop images directly onto the game canvas to add tokens and backgrounds.
                            </Text>
                            <Text fontSize="sm" color="gray.600">
                                🔄 Recent activity and campaign updates will appear here as you play.
                            </Text>
                        </VStack>
                    </CardBody>
                </Card>

                {/* Campaign List */}
                <Box>
                    <CampaignList />
                </Box>
            </VStack>
        </Container>
    );
};

const DashboardSkeleton = () => {
    const cardBg = useColorModeValue('white', 'gray.800');
    
    return (
        <Container maxW="container.xl" py={{ base: 6, md: 8 }}>
            <VStack spacing={{ base: 6, md: 8 }} align="stretch">
                {/* Welcome Section Skeleton */}
                <Box textAlign="center" py={{ base: 4, md: 6 }}>
                    <Skeleton height="40px" width="300px" mx="auto" mb={4} />
                    <Skeleton height="20px" width="500px" mx="auto" />
                </Box>

                {/* Personal Updates Skeleton */}
                <Card
                    bg={cardBg}
                    borderRadius="lg"
                    shadow="sm"
                    maxW="4xl"
                    mx="auto"
                    w="full"
                >
                    <CardHeader>
                        <Skeleton height="20px" width="150px" />
                    </CardHeader>
                    <CardBody>
                        <VStack spacing={2} align="start">
                            <SkeletonText noOfLines={3} spacing="4" skeletonHeight="2" />
                        </VStack>
                    </CardBody>
                </Card>

                {/* Campaign List Skeleton */}
                <Box>
                    <Skeleton height="300px" borderRadius="lg" />
                </Box>
            </VStack>
        </Container>
    );
};

export default AuthenticatedDashboard;