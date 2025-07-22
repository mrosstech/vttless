import React, { useState, useCallback, useRef } from 'react';
import {
    Modal, ModalOverlay, ModalContent, ModalHeader,
    ModalFooter, ModalBody, ModalCloseButton,
    Button, Input, VStack, HStack, useToast, Text,
    InputGroup, InputLeftElement, InputRightElement,
    Icon, Divider, Box, Avatar, Card, CardBody,
    Badge, IconButton, Spinner, useColorModeValue
} from '@chakra-ui/react';
import { 
    FiSearch, FiMail, FiUser, FiUserPlus, FiCheck, FiX 
} from 'react-icons/fi';
import { api } from '../common/axiosPrivate';

const ImprovedAddFriendsModal = ({ isOpen, onClose, onFriendsAdded }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [pendingRequests, setPendingRequests] = useState(new Set());
    const [searchType, setSearchType] = useState('username'); // 'username' or 'email'
    const searchTimeoutRef = useRef(null);
    const toast = useToast();

    const cardBg = useColorModeValue('white', 'gray.700');
    const borderColor = useColorModeValue('gray.200', 'gray.600');

    // Debounced search function
    const debouncedSearch = useCallback((query, type) => {
        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }

        searchTimeoutRef.current = setTimeout(async () => {
            if (!query.trim()) {
                setSearchResults([]);
                return;
            }

            setIsSearching(true);
            try {
                // For now, simulate search - TODO: implement backend search endpoint
                const response = { data: [] };
                setSearchResults(response.data || []);
            } catch (error) {
                console.error('Search error:', error);
                setSearchResults([]);
            } finally {
                setIsSearching(false);
            }
        }, 300);
    }, []);

    const handleSearchChange = (e) => {
        const query = e.target.value;
        setSearchQuery(query);
        debouncedSearch(query, searchType);
    };

    const handleSearchTypeChange = (type) => {
        setSearchType(type);
        if (searchQuery.trim()) {
            debouncedSearch(searchQuery, type);
        }
    };

    const handleSendFriendRequest = async (userId) => {
        setPendingRequests(prev => new Set(prev).add(userId));
        
        try {
            // Use existing email-based API for now - TODO: implement user ID based requests
            await api.post('/friends/add', { emails: [searchQuery] });
            
            toast({
                title: 'Friend request sent!',
                description: 'Your friend request has been sent successfully.',
                status: 'success',
                duration: 3000,
                isClosable: true,
            });

            // Update the search results to reflect the sent request
            setSearchResults(prev => 
                prev.map(user => 
                    user._id === userId 
                        ? { ...user, friendRequestSent: true }
                        : user
                )
            );
            
            onFriendsAdded?.();
        } catch (error) {
            setPendingRequests(prev => {
                const newSet = new Set(prev);
                newSet.delete(userId);
                return newSet;
            });
            
            toast({
                title: 'Failed to send friend request',
                description: error.response?.data?.message || 'Something went wrong. Please try again.',
                status: 'error',
                duration: 4000,
                isClosable: true,
            });
        }
    };

    const handleClose = () => {
        setSearchQuery('');
        setSearchResults([]);
        setPendingRequests(new Set());
        onClose();
    };

    const validateInput = (query, type) => {
        if (type === 'email') {
            return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(query);
        }
        return query.length >= 2; // Username validation
    };

    const getPlaceholderText = () => {
        return searchType === 'email' 
            ? 'Enter email address (e.g., player@example.com)'
            : 'Enter username (e.g., DungeonMaster23)';
    };

    const getSearchIcon = () => {
        return searchType === 'email' ? FiMail : FiUser;
    };

    return (
        <Modal isOpen={isOpen} onClose={handleClose} size="lg">
            <ModalOverlay />
            <ModalContent>
                <ModalHeader>
                    <HStack spacing={3}>
                        <Icon as={FiUserPlus} color="orange.500" />
                        <Text>Add Friends</Text>
                    </HStack>
                </ModalHeader>
                <ModalCloseButton />
                
                <ModalBody>
                    <VStack spacing={6}>
                        {/* Search Type Toggle */}
                        <HStack spacing={4} w="full">
                            <Button
                                variant={searchType === 'username' ? 'solid' : 'outline'}
                                colorScheme="orange"
                                size="sm"
                                leftIcon={<Icon as={FiUser} />}
                                onClick={() => handleSearchTypeChange('username')}
                                flex={1}
                            >
                                Search by Username
                            </Button>
                            <Button
                                variant={searchType === 'email' ? 'solid' : 'outline'}
                                colorScheme="orange"
                                size="sm"
                                leftIcon={<Icon as={FiMail} />}
                                onClick={() => handleSearchTypeChange('email')}
                                flex={1}
                            >
                                Search by Email
                            </Button>
                        </HStack>

                        {/* Search Input */}
                        <Box w="full">
                            <InputGroup>
                                <InputLeftElement>
                                    <Icon as={getSearchIcon()} color="gray.400" />
                                </InputLeftElement>
                                <Input
                                    placeholder={getPlaceholderText()}
                                    value={searchQuery}
                                    onChange={handleSearchChange}
                                    bg={cardBg}
                                    border="2px solid"
                                    borderColor={
                                        searchQuery && !validateInput(searchQuery, searchType)
                                            ? 'red.300'
                                            : borderColor
                                    }
                                    _hover={{ borderColor: 'orange.300' }}
                                    _focus={{ borderColor: 'orange.400', boxShadow: 'none' }}
                                />
                                <InputRightElement>
                                    {isSearching && <Spinner size="sm" color="orange.500" />}
                                </InputRightElement>
                            </InputGroup>
                            
                            {searchQuery && !validateInput(searchQuery, searchType) && (
                                <Text fontSize="sm" color="red.500" mt={1}>
                                    {searchType === 'email' 
                                        ? 'Please enter a valid email address'
                                        : 'Username must be at least 2 characters'
                                    }
                                </Text>
                            )}
                        </Box>

                        <Divider />

                        {/* Search Results */}
                        <Box w="full" maxH="300px" overflowY="auto">
                            {searchQuery && validateInput(searchQuery, searchType) && (
                                <>
                                    {searchResults.length === 0 && !isSearching && (
                                        <Card bg={cardBg} borderColor={borderColor}>
                                            <CardBody textAlign="center" py={8}>
                                                <Text color="gray.500" fontSize="sm">
                                                    {searchType === 'email' 
                                                        ? 'No user found with that email address'
                                                        : 'No users found matching that username'
                                                    }
                                                </Text>
                                                <Text color="gray.400" fontSize="xs" mt={2}>
                                                    Try a different search or ask them to join vttLess!
                                                </Text>
                                            </CardBody>
                                        </Card>
                                    )}

                                    {searchResults.map((user) => (
                                        <UserCard
                                            key={user._id}
                                            user={user}
                                            onSendRequest={handleSendFriendRequest}
                                            isPending={pendingRequests.has(user._id)}
                                        />
                                    ))}
                                </>
                            )}

                            {!searchQuery && (
                                <Card bg={cardBg} borderColor={borderColor} borderStyle="dashed">
                                    <CardBody textAlign="center" py={8}>
                                        <VStack spacing={3}>
                                            <Icon as={FiSearch} boxSize={8} color="gray.400" />
                                            <Text color="gray.500" fontWeight="medium">
                                                Search for Friends
                                            </Text>
                                            <Text color="gray.400" fontSize="sm" maxW="xs">
                                                Start typing a username or email address to find other players and Game Masters
                                            </Text>
                                        </VStack>
                                    </CardBody>
                                </Card>
                            )}
                        </Box>
                    </VStack>
                </ModalBody>

                <ModalFooter>
                    <Button variant="ghost" onClick={handleClose}>
                        Done
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
};

const UserCard = ({ user, onSendRequest, isPending }) => {
    const cardBg = useColorModeValue('white', 'gray.700');
    const borderColor = useColorModeValue('gray.200', 'gray.600');
    
    const getStatusButton = () => {
        if (user.isFriend) {
            return (
                <Badge colorScheme="green" variant="subtle" px={3} py={1}>
                    <HStack spacing={1}>
                        <Icon as={FiCheck} boxSize={3} />
                        <Text fontSize="xs">Friends</Text>
                    </HStack>
                </Badge>
            );
        }
        
        if (user.friendRequestSent || isPending) {
            return (
                <Badge colorScheme="orange" variant="subtle" px={3} py={1}>
                    <HStack spacing={1}>
                        <Spinner size="xs" />
                        <Text fontSize="xs">Request Sent</Text>
                    </HStack>
                </Badge>
            );
        }
        
        return (
            <IconButton
                size="sm"
                colorScheme="orange"
                variant="outline"
                icon={<Icon as={FiUserPlus} />}
                onClick={() => onSendRequest(user._id)}
                aria-label="Send friend request"
                _hover={{
                    transform: 'translateY(-1px)',
                    shadow: 'sm'
                }}
            />
        );
    };

    return (
        <Card 
            bg={cardBg} 
            borderColor={borderColor}
            mb={3}
            _hover={{ borderColor: 'orange.300', shadow: 'sm' }}
            transition="all 0.2s"
        >
            <CardBody p={4}>
                <HStack spacing={3} justify="space-between">
                    <HStack spacing={3} flex={1}>
                        <Avatar 
                            size="md" 
                            name={user.username} 
                            src={user.profilePhoto}
                        />
                        <VStack spacing={1} align="start" flex={1}>
                            <Text fontWeight="semibold" fontSize="sm">
                                {user.username}
                            </Text>
                            <Text fontSize="xs" color="gray.500">
                                {user.email}
                            </Text>
                        </VStack>
                    </HStack>
                    
                    {getStatusButton()}
                </HStack>
            </CardBody>
        </Card>
    );
};

export default ImprovedAddFriendsModal;