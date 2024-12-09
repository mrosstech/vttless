// components/AddFriendsModal.jsx
import React, { useState } from 'react';
import {
    Modal, ModalOverlay, ModalContent, ModalHeader,
    ModalFooter, ModalBody, ModalCloseButton,
    Button, Input, VStack, useToast, Text,
    Tag, TagLabel, TagCloseButton, Wrap, WrapItem
} from '@chakra-ui/react';
import { api } from '../common/axiosPrivate';

const AddFriendsModal = ({ isOpen, onClose, onFriendsAdded }) => {
    const [email, setEmail] = useState('');
    const [emails, setEmails] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const toast = useToast();

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && email) {
            e.preventDefault();
            if (validateEmail(email)) {
                if (!emails.includes(email)) {
                    setEmails([...emails, email]);
                    setEmail('');
                } else {
                    toast({
                        title: 'Email already added',
                        status: 'warning',
                        duration: 2000,
                    });
                }
            } else {
                toast({
                    title: 'Invalid email',
                    status: 'error',
                    duration: 2000,
                });
            }
        }
    };

    const validateEmail = (email) => {
        return email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
    };

    const handleRemoveEmail = (emailToRemove) => {
        setEmails(emails.filter(e => e !== emailToRemove));
    };

    const handleSubmit = async () => {
        if (emails.length === 0) {
            toast({
                title: 'No emails added',
                status: 'warning',
                duration: 2000,
            });
            return;
        }

        setIsLoading(true);
        try {
            const response = await api.post('/friends/add', { emails });
            
            const results = response.data.results;
            const successful = results.filter(r => r.status === 'success').length;
            
            toast({
                title: `Friend requests sent`,
                description: `Successfully sent ${successful} friend request(s)`,
                status: 'success',
                duration: 3000,
            });
            
            onFriendsAdded();
            onClose();
            setEmails([]);
        } catch (error) {
            toast({
                title: 'Error sending friend requests',
                description: error.response?.data?.message || 'Something went wrong',
                status: 'error',
                duration: 3000,
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose}>
            <ModalOverlay />
            <ModalContent>
                <ModalHeader>Add Friends</ModalHeader>
                <ModalCloseButton />
                <ModalBody>
                    <VStack spacing={4}>
                        <Text>Enter email addresses and press Enter to add multiple friends:</Text>
                        <Input
                            placeholder="Enter email address"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            onKeyDown={handleKeyDown}
                        />
                        <Wrap spacing={2}>
                            {emails.map((email) => (
                                <WrapItem key={email}>
                                    <Tag
                                        size="md"
                                        borderRadius="full"
                                        variant="solid"
                                        colorScheme="orange"
                                    >
                                        <TagLabel>{email}</TagLabel>
                                        <TagCloseButton
                                            onClick={() => handleRemoveEmail(email)}
                                        />
                                    </Tag>
                                </WrapItem>
                            ))}
                        </Wrap>
                    </VStack>
                </ModalBody>

                <ModalFooter>
                    <Button variant="ghost" mr={3} onClick={onClose}>
                        Cancel
                    </Button>
                    <Button
                        colorScheme="orange"
                        onClick={handleSubmit}
                        isLoading={isLoading}
                        isDisabled={emails.length === 0}
                    >
                        Send Friend Requests
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
};

export default AddFriendsModal;