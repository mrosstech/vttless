import React, { useState, useEffect, useRef } from 'react';
import {
    Box, Container, VStack, HStack, Tabs, TabList, TabPanels, Tab, TabPanel,
    Button, useToast, Text, Avatar, SimpleGrid,
    useDisclosure, Badge, Card, CardBody, IconButton,
    Heading, Input, InputGroup, InputLeftElement,
    Icon, Skeleton, SkeletonCircle, useColorModeValue,
    Menu, MenuButton, MenuList, MenuItem, AlertDialog,
    AlertDialogBody, AlertDialogFooter, AlertDialogHeader,
    AlertDialogContent, AlertDialogOverlay
} from '@chakra-ui/react';
import { 
    FiUserPlus, FiUserX, FiCheck, FiX, FiSearch, 
    FiMoreVertical, FiMessageCircle, FiUser 
} from 'react-icons/fi';
import SimplifiedAddFriendsModal from './SimplifiedAddFriendsModal';
import { api } from '../common/axiosPrivate';
import { useAuth } from '../providers/AuthProvider';

const ImprovedFriends = () => {
    const { user } = useAuth();
    const toast = useToast();
    const { isOpen, onOpen, onClose } = useDisclosure();
    const { isOpen: isAlertOpen, onOpen: onAlertOpen, onClose: onAlertClose } = useDisclosure();
    const [friends, setFriends] = useState([]);
    const [pendingRequests, setPendingRequests] = useState([]);
    const [sentRequests, setSentRequests] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [friendToRemove, setFriendToRemove] = useState(null);
    const cancelRef = useRef();

    const cardBg = useColorModeValue('white', 'gray.700');
    const borderColor = useColorModeValue('gray.200', 'gray.600');
    const bgGray = useColorModeValue('gray.50', 'gray.800');

    useEffect(() => {
        fetchAllFriendData();
    }, []);

    const fetchAllFriendData = async () => {
        setIsLoading(true);
        try {
            const [friendsRes, pendingRes] = await Promise.all([
                api.get('/friends/list'),
                api.get('/friends/pending')
            ]);
            
            setFriends(friendsRes.data || []);
            setPendingRequests(pendingRes.data || []);
            setSentRequests([]); // TODO: Add sent-requests endpoint later
        } catch (error) {
            toast({
                title: 'Error loading friends data',
                description: error.response?.data?.message || 'Something went wrong',
                status: 'error',
                duration: 3000,
                isClosable: true,
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleConfirmRequest = async (requestId) => {
        try {
            await api.post('/friends/confirm', { requestId });
            toast({
                title: '🎉 Friend request accepted!',
                description: 'You can now play campaigns together.',
                status: 'success',
                duration: 3000,
                isClosable: true,
            });
            fetchAllFriendData();
        } catch (error) {
            toast({
                title: 'Error accepting request',
                description: error.response?.data?.message || 'Something went wrong',
                status: 'error',
                duration: 3000,
                isClosable: true,
            });
        }
    };

    const handleRejectRequest = async (requestId) => {
        try {
            await api.post('/friends/reject', { requestId });
            toast({
                title: 'Friend request declined',
                status: 'info',
                duration: 2000,
                isClosable: true,
            });
            fetchAllFriendData();
        } catch (error) {
            toast({
                title: 'Error rejecting request',
                description: error.response?.data?.message || 'Something went wrong',
                status: 'error',
                duration: 3000,
                isClosable: true,
            });
        }
    };

    const handleRemoveFriend = async () => {
        if (!friendToRemove) return;
        
        try {
            await api.post('/friends/remove', { friendId: friendToRemove._id });
            toast({
                title: 'Friend removed',
                description: `${friendToRemove.username} has been removed from your friends list.`,
                status: 'info',
                duration: 3000,
                isClosable: true,
            });
            fetchAllFriendData();
        } catch (error) {
            toast({
                title: 'Error removing friend',
                description: error.response?.data?.message || 'Something went wrong',
                status: 'error',
                duration: 3000,
                isClosable: true,
            });
        } finally {
            setFriendToRemove(null);
            onAlertClose();
        }
    };

    const handleCancelSentRequest = async (requestId) => {
        try {
            // TODO: Implement cancel-request endpoint
            toast({
                title: 'Feature coming soon',
                description: 'Request cancellation will be available in the next update.',
                status: 'info',
                duration: 3000,
                isClosable: true,
            });
        } catch (error) {
            toast({
                title: 'Error cancelling request',
                description: error.response?.data?.message || 'Something went wrong',
                status: 'error',
                duration: 3000,
                isClosable: true,
            });
        }
    };

    const filteredFriends = friends.filter(friend =>
        friend.username.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (isLoading) {
        return <FriendsSkeleton />;
    }

    return (
        <Container maxW="container.xl" py={6}>
            <VStack spacing={6} align="stretch">
                {/* Header */}
                <HStack justify="space-between" align="center">
                    <VStack spacing={1} align="start">
                        <Heading size="lg" color="orange.500">
                            Friends & Connections
                        </Heading>
                        <Text color="gray.600" fontSize="sm">
                            Build your gaming network and join campaigns together
                        </Text>
                    </VStack>
                    <Button
                        leftIcon={<FiUserPlus />}
                        colorScheme="orange"
                        onClick={onOpen}
                        size="lg"
                        shadow="sm"
                        _hover={{
                            transform: 'translateY(-1px)',
                            shadow: 'md'
                        }}
                    >
                        Add Friends
                    </Button>
                </HStack>

                {/* Tabs */}
                <Tabs colorScheme="orange" variant="enclosed-colored">
                    <TabList>
                        <Tab>
                            <HStack spacing={2}>
                                <Icon as={FiUser} />
                                <Text>My Friends</Text>
                                <Badge colorScheme="orange" variant="subtle">
                                    {friends.length}
                                </Badge>
                            </HStack>
                        </Tab>
                        <Tab>
                            <HStack spacing={2}>
                                <Text>Incoming Requests</Text>
                                {pendingRequests.length > 0 && (
                                    <Badge colorScheme="red">
                                        {pendingRequests.length}
                                    </Badge>
                                )}
                            </HStack>
                        </Tab>
                        <Tab>
                            <HStack spacing={2}>
                                <Text>Sent Requests</Text>
                                {sentRequests.length > 0 && (
                                    <Badge colorScheme="blue" variant="subtle">
                                        {sentRequests.length}
                                    </Badge>
                                )}
                            </HStack>
                        </Tab>
                    </TabList>

                    <TabPanels>
                        {/* Friends Tab */}
                        <TabPanel px={0}>
                            <VStack spacing={4} align="stretch">
                                {/* Search Bar */}
                                {friends.length > 0 && (
                                    <InputGroup maxW="400px">
                                        <InputLeftElement>
                                            <Icon as={FiSearch} color="gray.400" />
                                        </InputLeftElement>
                                        <Input
                                            placeholder="Search friends..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            bg={cardBg}
                                            border="1px solid"
                                            borderColor={borderColor}
                                            _hover={{ borderColor: 'orange.300' }}
                                            _focus={{ borderColor: 'orange.400', boxShadow: 'none' }}
                                        />
                                    </InputGroup>
                                )}

                                {/* Friends Grid */}
                                {filteredFriends.length === 0 ? (
                                    <EmptyState
                                        icon={FiUser}
                                        title={friends.length === 0 ? "No Friends Yet" : "No friends found"}
                                        description={
                                            friends.length === 0 
                                                ? "Start building your gaming network by adding friends. You can invite them to campaigns and play together!"
                                                : `No friends match "${searchQuery}". Try a different search term.`
                                        }
                                        action={
                                            friends.length === 0 ? (
                                                <Button
                                                    leftIcon={<FiUserPlus />}
                                                    colorScheme="orange"
                                                    onClick={onOpen}
                                                >
                                                    Add Your First Friend
                                                </Button>
                                            ) : null
                                        }
                                    />
                                ) : (
                                    <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
                                        {filteredFriends.map((friend) => (
                                            <FriendCard
                                                key={friend._id}
                                                friend={friend}
                                                onRemove={(friend) => {
                                                    setFriendToRemove(friend);
                                                    onAlertOpen();
                                                }}
                                            />
                                        ))}
                                    </SimpleGrid>
                                )}
                            </VStack>
                        </TabPanel>

                        {/* Pending Requests Tab */}
                        <TabPanel px={0}>
                            {pendingRequests.length === 0 ? (
                                <EmptyState
                                    icon={FiCheck}
                                    title="No Pending Requests"
                                    description="You don't have any incoming friend requests at the moment."
                                />
                            ) : (
                                <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
                                    {pendingRequests.map((request) => (
                                        <PendingRequestCard
                                            key={request._id}
                                            request={request}
                                            onAccept={() => handleConfirmRequest(request._id)}
                                            onReject={() => handleRejectRequest(request._id)}
                                        />
                                    ))}
                                </SimpleGrid>
                            )}
                        </TabPanel>

                        {/* Sent Requests Tab */}
                        <TabPanel px={0}>
                            {sentRequests.length === 0 ? (
                                <EmptyState
                                    icon={FiUserPlus}
                                    title="No Sent Requests"
                                    description="You haven't sent any friend requests yet. Start connecting with other players!"
                                    action={
                                        <Button
                                            leftIcon={<FiUserPlus />}
                                            colorScheme="orange"
                                            onClick={onOpen}
                                        >
                                            Send Friend Requests
                                        </Button>
                                    }
                                />
                            ) : (
                                <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
                                    {sentRequests.map((request) => (
                                        <SentRequestCard
                                            key={request._id}
                                            request={request}
                                            onCancel={() => handleCancelSentRequest(request._id)}
                                        />
                                    ))}
                                </SimpleGrid>
                            )}
                        </TabPanel>
                    </TabPanels>
                </Tabs>
            </VStack>

            {/* Add Friends Modal */}
            <SimplifiedAddFriendsModal
                isOpen={isOpen}
                onClose={onClose}
                onFriendsAdded={fetchAllFriendData}
            />

            {/* Remove Friend Confirmation */}
            <AlertDialog
                isOpen={isAlertOpen}
                leastDestructiveRef={cancelRef}
                onClose={onAlertClose}
            >
                <AlertDialogOverlay>
                    <AlertDialogContent>
                        <AlertDialogHeader fontSize="lg" fontWeight="bold">
                            Remove Friend
                        </AlertDialogHeader>
                        <AlertDialogBody>
                            Are you sure you want to remove <strong>{friendToRemove?.username}</strong> from your friends list? 
                            They won't be notified, but you'll no longer see each other's campaigns.
                        </AlertDialogBody>
                        <AlertDialogFooter>
                            <Button ref={cancelRef} onClick={onAlertClose}>
                                Cancel
                            </Button>
                            <Button colorScheme="red" onClick={handleRemoveFriend} ml={3}>
                                Remove Friend
                            </Button>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialogOverlay>
            </AlertDialog>
        </Container>
    );
};

// Component for individual friend cards
const FriendCard = ({ friend, onRemove }) => {
    const cardBg = useColorModeValue('white', 'gray.700');
    const borderColor = useColorModeValue('gray.200', 'gray.600');

    return (
        <Card 
            bg={cardBg} 
            borderColor={borderColor}
            _hover={{ 
                borderColor: 'orange.300', 
                shadow: 'md',
                transform: 'translateY(-1px)'
            }}
            transition="all 0.2s"
        >
            <CardBody p={5}>
                <HStack spacing={3} justify="space-between" align="start">
                    <HStack spacing={3} flex={1}>
                        <Avatar 
                            size="md" 
                            name={friend.username} 
                            src={friend.profilePhoto}
                        />
                        <VStack spacing={1} align="start" flex={1}>
                            <Text fontWeight="semibold" fontSize="sm">
                                {friend.username}
                            </Text>
                            <Text fontSize="xs" color="gray.500">
                                {friend.email}
                            </Text>
                            <Badge colorScheme="green" variant="subtle" size="sm">
                                Friends
                            </Badge>
                        </VStack>
                    </HStack>
                    
                    <Menu>
                        <MenuButton
                            as={IconButton}
                            icon={<FiMoreVertical />}
                            variant="ghost"
                            size="sm"
                            color="gray.500"
                            _hover={{ color: 'gray.700' }}
                        />
                        <MenuList>
                            <MenuItem icon={<FiMessageCircle />}>
                                Send Message
                            </MenuItem>
                            <MenuItem 
                                icon={<FiUserX />} 
                                onClick={() => onRemove(friend)}
                                color="red.500"
                                _hover={{ bg: 'red.50' }}
                            >
                                Remove Friend
                            </MenuItem>
                        </MenuList>
                    </Menu>
                </HStack>
            </CardBody>
        </Card>
    );
};

// Component for pending friend request cards
const PendingRequestCard = ({ request, onAccept, onReject }) => {
    const cardBg = useColorModeValue('white', 'gray.700');
    const borderColor = useColorModeValue('orange.200', 'orange.600');

    return (
        <Card 
            bg={cardBg} 
            borderColor={borderColor}
            borderWidth="2px"
            shadow="sm"
        >
            <CardBody p={5}>
                <VStack spacing={4} align="stretch">
                    <HStack spacing={3}>
                        <Avatar 
                            size="md" 
                            name={request.requestor.username} 
                            src={request.requestor.profilePhoto}
                        />
                        <VStack spacing={1} align="start" flex={1}>
                            <Text fontWeight="semibold" fontSize="sm">
                                {request.requestor.username}
                            </Text>
                            <Text fontSize="xs" color="gray.500">
                                {request.requestor.email}
                            </Text>
                            <Text fontSize="xs" color="orange.500" fontWeight="medium">
                                Wants to be friends
                            </Text>
                        </VStack>
                    </HStack>
                    
                    <HStack spacing={2}>
                        <Button
                            size="sm"
                            colorScheme="green"
                            leftIcon={<FiCheck />}
                            onClick={onAccept}
                            flex={1}
                        >
                            Accept
                        </Button>
                        <Button
                            size="sm"
                            variant="outline"
                            leftIcon={<FiX />}
                            onClick={onReject}
                            flex={1}
                        >
                            Decline
                        </Button>
                    </HStack>
                </VStack>
            </CardBody>
        </Card>
    );
};

// Component for sent request cards
const SentRequestCard = ({ request, onCancel }) => {
    const cardBg = useColorModeValue('white', 'gray.700');
    const borderColor = useColorModeValue('blue.200', 'blue.600');

    return (
        <Card 
            bg={cardBg} 
            borderColor={borderColor}
            borderWidth="2px"
            shadow="sm"
        >
            <CardBody p={5}>
                <VStack spacing={4} align="stretch">
                    <HStack spacing={3}>
                        <Avatar 
                            size="md" 
                            name={request.recipient.username} 
                            src={request.recipient.profilePhoto}
                        />
                        <VStack spacing={1} align="start" flex={1}>
                            <Text fontWeight="semibold" fontSize="sm">
                                {request.recipient.username}
                            </Text>
                            <Text fontSize="xs" color="gray.500">
                                {request.recipient.email}
                            </Text>
                            <Text fontSize="xs" color="blue.500" fontWeight="medium">
                                Request sent
                            </Text>
                        </VStack>
                    </HStack>
                    
                    <Button
                        size="sm"
                        variant="outline"
                        colorScheme="blue"
                        onClick={onCancel}
                    >
                        Cancel Request
                    </Button>
                </VStack>
            </CardBody>
        </Card>
    );
};

// Empty state component
const EmptyState = ({ icon, title, description, action }) => {
    const cardBg = useColorModeValue('gray.50', 'gray.800');

    return (
        <Card bg={cardBg} borderStyle="dashed" borderWidth="2px" borderColor="gray.300">
            <CardBody py={12} textAlign="center">
                <VStack spacing={4}>
                    <Icon as={icon} boxSize={12} color="gray.400" />
                    <VStack spacing={2}>
                        <Text fontWeight="semibold" color="gray.600" fontSize="lg">
                            {title}
                        </Text>
                        <Text color="gray.500" fontSize="sm" maxW="md" lineHeight="tall">
                            {description}
                        </Text>
                    </VStack>
                    {action && action}
                </VStack>
            </CardBody>
        </Card>
    );
};

// Loading skeleton
const FriendsSkeleton = () => {
    return (
        <Container maxW="container.xl" py={6}>
            <VStack spacing={6} align="stretch">
                <HStack justify="space-between">
                    <VStack spacing={2} align="start">
                        <Skeleton height="32px" width="200px" />
                        <Skeleton height="16px" width="300px" />
                    </VStack>
                    <Skeleton height="40px" width="120px" />
                </HStack>
                
                <Skeleton height="40px" width="full" />
                
                <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
                    {[...Array(6)].map((_, index) => (
                        <Card key={index}>
                            <CardBody p={5}>
                                <HStack spacing={3}>
                                    <SkeletonCircle size="12" />
                                    <VStack spacing={2} align="start" flex={1}>
                                        <Skeleton height="16px" width="80px" />
                                        <Skeleton height="12px" width="120px" />
                                    </VStack>
                                </HStack>
                            </CardBody>
                        </Card>
                    ))}
                </SimpleGrid>
            </VStack>
        </Container>
    );
};

export default ImprovedFriends;