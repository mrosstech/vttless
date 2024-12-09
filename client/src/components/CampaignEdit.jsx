import { React, useState } from 'react';
import { api } from '../common/axiosPrivate.js';
import {
    Modal, ModalOverlay, ModalContent,
    ModalHeader, ModalFooter, ModalBody,
    ModalCloseButton, Input, Textarea,
    Button, VStack, useToast
} from '@chakra-ui/react';
import {
    FormControl, FormLabel,
    FormErrorMessage
} from '@chakra-ui/react';

const CampaignEdit = ({ isOpen, onClose, campaign, onSave }) => {
    const [formData, setFormData] = useState({
        name: campaign?.name || '',
        description: campaign?.description || '',
        players: campaign?.players || [],
    });
    const [isLoading, setIsLoading] = useState(false);
    const toast = useToast();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            if (campaign?._id) {
                // Update existing campaign
                await api.post('/campaigns/update', {
                    campaignId: campaign._id,
                    ...formData
                });
            } else {
                // Create new campaign
                await api.post('/campaigns/add', formData);
            }
            toast({
                title: `Campaign ${campaign?._id ? 'updated' : 'created'} successfully`,
                status: 'success'
            });
            onSave();
            onClose();
        } catch (error) {
            toast({
                title: 'Error',
                description: error.response?.data?.message || 'Something went wrong',
                status: 'error'
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose}>
            <ModalOverlay />
            <ModalContent>
                <ModalHeader>
                    {campaign?._id ? 'Edit Campaign' : 'Create New Campaign'}
                </ModalHeader>
                <ModalCloseButton />
                <form onSubmit={handleSubmit}>
                    <ModalBody>
                        <VStack spacing={4}>
                            <FormControl isRequired>
                                <FormLabel>Campaign Name</FormLabel>
                                <Input
                                    value={formData.name}
                                    onChange={(e) => setFormData({
                                        ...formData,
                                        name: e.target.value
                                    })}
                                />
                            </FormControl>
                            <FormControl>
                                <FormLabel>Description</FormLabel>
                                <Textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({
                                        ...formData,
                                        description: e.target.value
                                    })}
                                />
                            </FormControl>
                        </VStack>
                    </ModalBody>
                    <ModalFooter>
                        <Button mr={3} onClick={onClose}>Cancel</Button>
                        <Button
                            colorScheme="blue"
                            type="submit"
                            isLoading={isLoading}
                        >
                            {campaign?._id ? 'Save Changes' : 'Create Campaign'}
                        </Button>
                    </ModalFooter>
                </form>
            </ModalContent>
        </Modal>
    );
};

export default CampaignEdit;
