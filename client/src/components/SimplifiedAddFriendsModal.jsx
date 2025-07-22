import React, { useState } from 'react';
import {
    Modal, ModalOverlay, ModalContent, ModalHeader,
    ModalFooter, ModalBody, ModalCloseButton,
    Button, Input, VStack, HStack, useToast, Text,
    InputGroup, InputLeftElement, InputRightElement,
    Icon, Divider, Box, Card, CardBody,
    Badge, Tag, TagLabel, TagCloseButton, Wrap, WrapItem,
    useColorModeValue
} from '@chakra-ui/react';
import { 
    FiMail, FiUserPlus, FiCheck, FiX 
} from 'react-icons/fi';
import { api } from '../common/axiosPrivate';

const SimplifiedAddFriendsModal = ({ isOpen, onClose, onFriendsAdded }) => {
    const [email, setEmail] = useState('');
    const [emails, setEmails] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const toast = useToast();

    const cardBg = useColorModeValue('white', 'gray.700');
    const borderColor = useColorModeValue('gray.200', 'gray.600');

    const validateEmail = (email) => {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && email.trim()) {
            e.preventDefault();
            
            if (!validateEmail(email)) {
                toast({
                    title: 'Invalid email address',
                    description: 'Please enter a valid email address.',
                    status: 'error',
                    duration: 2000,
                    isClosable: true,
                });
                return;
            }

            if (emails.includes(email.toLowerCase())) {
                toast({
                    title: 'Email already added',
                    description: 'This email is already in your list.',
                    status: 'warning',
                    duration: 2000,
                    isClosable: true,
                });
                return;
            }

            setEmails(prev => [...prev, email.toLowerCase()]);
            setEmail('');
        }
    };

    const handleAddEmail = () => {
        if (!email.trim()) return;
        
        if (!validateEmail(email)) {
            toast({
                title: 'Invalid email address',
                description: 'Please enter a valid email address.',
                status: 'error',
                duration: 2000,
                isClosable: true,
            });
            return;
        }

        if (emails.includes(email.toLowerCase())) {
            toast({
                title: 'Email already added',
                description: 'This email is already in your list.',
                status: 'warning',
                duration: 2000,
                isClosable: true,
            });
            return;
        }

        setEmails(prev => [...prev, email.toLowerCase()]);
        setEmail('');
    };

    const handleRemoveEmail = (emailToRemove) => {
        setEmails(prev => prev.filter(e => e !== emailToRemove));
    };

    const handleSubmit = async () => {
        if (emails.length === 0) {
            toast({
                title: 'No emails to send',
                description: 'Please add at least one email address.',
                status: 'warning',
                duration: 2000,
                isClosable: true,
            });
            return;
        }

        setIsLoading(true);
        try {
            const response = await api.post('/friends/add', { emails });
            
            const results = response.data.results;
            if (results && Array.isArray(results)) {
                const successful = results.filter(r => r.status === 'success').length;
                const failed = results.filter(r => r.status !== 'success');
                
                if (successful > 0) {
                    toast({
                        title: `🎉 Friend requests sent!`,
                        description: `Successfully sent ${successful} friend request${successful > 1 ? 's' : ''}`,
                        status: 'success',
                        duration: 4000,
                        isClosable: true,
                    });
                }

                if (failed.length > 0) {
                    const failedEmails = failed.map(f => f.email).join(', ');
                    toast({
                        title: 'Some requests failed',
                        description: `Could not send requests to: ${failedEmails}`,
                        status: 'warning',
                        duration: 4000,
                        isClosable: true,
                    });
                }
            } else {
                toast({
                    title: 'Friend requests sent!',
                    description: `Sent requests to ${emails.length} email${emails.length > 1 ? 's' : ''}`,
                    status: 'success',
                    duration: 3000,
                    isClosable: true,
                });
            }
            
            onFriendsAdded?.();
            handleClose();
        } catch (error) {
            toast({
                title: 'Failed to send friend requests',
                description: error.response?.data?.message || 'Something went wrong. Please try again.',
                status: 'error',
                duration: 4000,
                isClosable: true,
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleClose = () => {
        setEmail('');
        setEmails([]);
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={handleClose} size="lg">
            <ModalOverlay />
            <ModalContent>
                <ModalHeader>
                    <HStack spacing={3}>
                        <Icon as={FiUserPlus} color="orange.500" />
                        <Text>Add Friends by Email</Text>
                    </HStack>
                </ModalHeader>
                <ModalCloseButton />
                
                <ModalBody>
                    <VStack spacing={6}>
                        {/* Instructions */}
                        <Card bg={cardBg} borderColor="orange.200" borderWidth="1px">
                            <CardBody p={4}>
                                <VStack spacing={2} align="start">
                                    <Text fontSize="sm" fontWeight="semibold" color="orange.600">
                                        How to add friends:
                                    </Text>
                                    <Text fontSize="sm" color="gray.600">
                                        • Enter their email address below
                                    </Text>
                                    <Text fontSize="sm" color="gray.600">
                                        • Press Enter or click "Add" to add it to your list
                                    </Text>
                                    <Text fontSize="sm" color="gray.600">
                                        • Add multiple emails, then send all requests at once
                                    </Text>
                                </VStack>
                            </CardBody>
                        </Card>

                        {/* Email Input */}
                        <Box w="full">
                            <InputGroup>
                                <InputLeftElement>
                                    <Icon as={FiMail} color="gray.400" />
                                </InputLeftElement>
                                <Input
                                    placeholder="Enter email address (e.g., player@example.com)"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    bg={cardBg}
                                    border="2px solid"
                                    borderColor={
                                        email && !validateEmail(email)
                                            ? 'red.300'
                                            : borderColor
                                    }
                                    _hover={{ borderColor: 'orange.300' }}
                                    _focus={{ borderColor: 'orange.400', boxShadow: 'none' }}
                                />
                                <InputRightElement width="auto" pr={2}>
                                    <Button
                                        size="sm"
                                        colorScheme="orange"
                                        variant="ghost"
                                        onClick={handleAddEmail}
                                        isDisabled={!email.trim() || !validateEmail(email)}
                                    >
                                        Add
                                    </Button>
                                </InputRightElement>
                            </InputGroup>
                            
                            {email && !validateEmail(email) && (
                                <Text fontSize="sm" color="red.500" mt={1}>
                                    Please enter a valid email address
                                </Text>
                            )}
                        </Box>

                        {/* Email Tags */}
                        {emails.length > 0 && (
                            <>
                                <Divider />
                                <Box w="full">
                                    <Text fontSize="sm" fontWeight="semibold" mb={3} color="gray.600">
                                        Friend requests will be sent to:
                                    </Text>
                                    <Wrap spacing={2}>
                                        {emails.map((emailAddr) => (
                                            <WrapItem key={emailAddr}>
                                                <Tag
                                                    size="md"
                                                    borderRadius="full"
                                                    variant="subtle"
                                                    colorScheme="orange"
                                                >
                                                    <TagLabel>{emailAddr}</TagLabel>
                                                    <TagCloseButton
                                                        onClick={() => handleRemoveEmail(emailAddr)}
                                                    />
                                                </Tag>
                                            </WrapItem>
                                        ))}
                                    </Wrap>
                                </Box>
                            </>
                        )}

                        {/* Empty State */}
                        {emails.length === 0 && (
                            <Card bg={cardBg} borderColor={borderColor} borderStyle="dashed">
                                <CardBody textAlign="center" py={8}>
                                    <VStack spacing={3}>
                                        <Icon as={FiMail} boxSize={8} color="gray.400" />
                                        <Text color="gray.500" fontWeight="medium">
                                            Add Email Addresses
                                        </Text>
                                        <Text color="gray.400" fontSize="sm" maxW="xs">
                                            Enter email addresses above to send friend requests
                                        </Text>
                                    </VStack>
                                </CardBody>
                            </Card>
                        )}
                    </VStack>
                </ModalBody>

                <ModalFooter>
                    <HStack spacing={3}>
                        <Button variant="ghost" onClick={handleClose}>
                            Cancel
                        </Button>
                        <Button
                            colorScheme="orange"
                            onClick={handleSubmit}
                            isLoading={isLoading}
                            loadingText="Sending..."
                            isDisabled={emails.length === 0}
                            leftIcon={<Icon as={FiUserPlus} />}
                        >
                            Send {emails.length > 0 ? `${emails.length} ` : ''}Friend Request{emails.length !== 1 ? 's' : ''}
                        </Button>
                    </HStack>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
};

export default SimplifiedAddFriendsModal;