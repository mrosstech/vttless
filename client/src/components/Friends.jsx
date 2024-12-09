// components/Friends.jsx
import React, { useState, useEffect } from 'react';
import {
    Box, Container, VStack, Tabs, TabList, TabPanels, Tab, TabPanel,
    Table, Thead, Tbody, Tr, Th, Td, TableContainer,
    Button, useToast, Text, Avatar, HStack,
    useDisclosure, Badge
} from '@chakra-ui/react';
import { FiUserPlus, FiUserX, FiCheck, FiX } from 'react-icons/fi';
import AddFriendsModal from './AddFriendsModal';
import { api } from '../common/axiosPrivate';
import { useAuth } from '../providers/AuthProvider';

const Friends = () => {
    const { user } = useAuth();
    const toast = useToast();
    const { isOpen, onOpen, onClose } = useDisclosure();
    const [friends, setFriends] = useState([]);
    const [pendingRequests, setPendingRequests] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    const fetchFriends = async () => {
        try {
            const response = await api.get('/friends/list');
            setFriends(response.data);
        } catch (error) {
            toast({
                title: 'Error fetching friends',
                description: error.response?.data?.message || 'Something went wrong',
                status: 'error',
                duration: 3000,
                isClosable: true,
            });
        }
    };

    const fetchPendingRequests = async () => {
        try {
            const response = await api.get('/friends/pending');
            setPendingRequests(response.data);
        } catch (error) {
            toast({
                title: 'Error fetching pending requests',
                description: error.response?.data?.message || 'Something went wrong',
                status: 'error',
                duration: 3000,
                isClosable: true,
            });
        }
    };

    useEffect(() => {
        fetchFriends();
        fetchPendingRequests();
    }, []);

    const handleConfirmRequest = async (requestId) => {
        try {
            await api.post('/friends/confirm', { requestId });
            toast({
                title: 'Friend request accepted',
                status: 'success',
                duration: 3000,
                isClosable: true,
            });
            fetchFriends();
            fetchPendingRequests();
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
                title: 'Friend request rejected',
                status: 'info',
                duration: 3000,
                isClosable: true,
            });
            fetchPendingRequests();
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

    const handleRemoveFriend = async (friendId) => {
        if (window.confirm('Are you sure you want to remove this friend?')) {
            try {
                await api.post('/friends/remove', { friendId });
                toast({
                    title: 'Friend removed',
                    status: 'info',
                    duration: 3000,
                    isClosable: true,
                });
                fetchFriends();
            } catch (error) {
                toast({
                    title: 'Error removing friend',
                    description: error.response?.data?.message || 'Something went wrong',
                    status: 'error',
                    duration: 3000,
                    isClosable: true,
                });
            }
        }
    };

    return (
        <Container maxW="container.xl" py={5}>
            <VStack spacing={4} align="stretch">
                <HStack justify="space-between">
                    <Text fontSize="2xl" fontWeight="bold">Friends</Text>
                    <Button
                        leftIcon={<FiUserPlus />}
                        colorScheme="orange"
                        onClick={onOpen}
                    >
                        Add Friends
                    </Button>
                </HStack>

                <Tabs colorScheme="orange" variant="enclosed">
                    <TabList>
                        <Tab>My Friends ({friends.length})</Tab>
                        <Tab>
                            Pending Requests
                            {pendingRequests.length > 0 && (
                                <Badge ml={2} colorScheme="red">
                                    {pendingRequests.length}
                                </Badge>
                            )}
                        </Tab>
                    </TabList>

                    <TabPanels>
                        <TabPanel>
                            <TableContainer>
                                <Table variant="simple">
                                    <Thead>
                                        <Tr>
                                            <Th>Friend</Th>
                                            <Th>Username</Th>
                                            <Th>Email</Th>
                                            <Th>Action</Th>
                                        </Tr>
                                    </Thead>
                                    <Tbody>
                                        {friends.length === 0 ? (
                                            <Tr>
                                                <Td colSpan={4}>
                                                    <Text textAlign="center" color="gray.500">
                                                        No friends added yet
                                                    </Text>
                                                </Td>
                                            </Tr>
                                        ) : (
                                            friends.map((friend) => (
                                                <Tr key={friend._id}>
                                                    <Td>
                                                        <Avatar
                                                            size="sm"
                                                            name={friend.username}
                                                        />
                                                    </Td>
                                                    <Td>{friend.username}</Td>
                                                    <Td>{friend.email}</Td>
                                                    <Td>
                                                        <Button
                                                            size="sm"
                                                            colorScheme="red"
                                                            variant="outline"
                                                            leftIcon={<FiUserX />}
                                                            onClick={() => handleRemoveFriend(friend._id)}
                                                        >
                                                            Remove
                                                        </Button>
                                                    </Td>
                                                </Tr>
                                            ))
                                        )}
                                    </Tbody>
                                </Table>
                            </TableContainer>
                        </TabPanel>

                        <TabPanel>
                            <TableContainer>
                                <Table variant="simple">
                                    <Thead>
                                        <Tr>
                                            <Th>From</Th>
                                            <Th>Username</Th>
                                            <Th>Email</Th>
                                            <Th>Actions</Th>
                                        </Tr>
                                    </Thead>
                                    <Tbody>
                                        {pendingRequests.length === 0 ? (
                                            <Tr>
                                                <Td colSpan={4}>
                                                    <Text textAlign="center" color="gray.500">
                                                        No pending friend requests
                                                    </Text>
                                                </Td>
                                            </Tr>
                                        ) : (
                                            pendingRequests.map((request) => (
                                                <Tr key={request._id}>
                                                    <Td>
                                                        <Avatar
                                                            size="sm"
                                                            name={request.requestor.username}
                                                        />
                                                    </Td>
                                                    <Td>{request.requestor.username}</Td>
                                                    <Td>{request.requestor.email}</Td>
                                                    <Td>
                                                        <HStack spacing={2}>
                                                            <Button
                                                                size="sm"
                                                                colorScheme="green"
                                                                leftIcon={<FiCheck />}
                                                                onClick={() => handleConfirmRequest(request._id)}
                                                            >
                                                                Accept
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                colorScheme="red"
                                                                leftIcon={<FiX />}
                                                                onClick={() => handleRejectRequest(request._id)}
                                                            >
                                                                Reject
                                                            </Button>
                                                        </HStack>
                                                    </Td>
                                                </Tr>
                                            ))
                                        )}
                                    </Tbody>
                                </Table>
                            </TableContainer>
                        </TabPanel>
                    </TabPanels>
                </Tabs>
            </VStack>

            <AddFriendsModal
                isOpen={isOpen}
                onClose={onClose}
                onFriendsAdded={() => {
                    fetchFriends();
                    fetchPendingRequests();
                }}
            />
        </Container>
    );
};

export default Friends;