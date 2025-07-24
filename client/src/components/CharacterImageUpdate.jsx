import React, { useState, useRef } from 'react';
import {
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalFooter,
    ModalBody,
    ModalCloseButton,
    Button,
    VStack,
    HStack,
    Image,
    Text,
    useToast,
    Icon,
    Input,
    Box,
    Spinner,
    SimpleGrid
} from '@chakra-ui/react';
import { FaUpload, FaUser } from 'react-icons/fa';
import { uploadAsset } from '../utils/assetUtils';
import { api } from '../common/axiosPrivate.js';

const CharacterImageUpdate = ({ 
    isOpen, 
    onClose, 
    character, 
    campaignId, 
    onUpdate,
    campaignAssets = []
}) => {
    const [selectedFile, setSelectedFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const [selectedAssetId, setSelectedAssetId] = useState(character?.assetId?._id || null);
    const fileInputRef = useRef(null);
    const toast = useToast();

    const handleFileSelect = (event) => {
        const file = event.target.files[0];
        if (file) {
            // Validate file type
            if (!file.type.startsWith('image/')) {
                toast({
                    title: 'Invalid file type',
                    description: 'Please select an image file',
                    status: 'error',
                    duration: 3000,
                });
                return;
            }
            
            // Validate file size (5MB limit)
            if (file.size > 5 * 1024 * 1024) {
                toast({
                    title: 'File too large',
                    description: 'Please select an image under 5MB',
                    status: 'error',
                    duration: 3000,
                });
                return;
            }

            setSelectedFile(file);
            setPreviewUrl(URL.createObjectURL(file));
            setSelectedAssetId(null); // Clear existing asset selection when uploading new
        }
    };

    const handleAssetSelect = (assetId) => {
        setSelectedAssetId(assetId);
        setSelectedFile(null);
        setPreviewUrl(null);
    };

    const handleUpdateImage = async () => {
        if (!selectedFile && !selectedAssetId) {
            toast({
                title: 'No image selected',
                description: 'Please select an image or upload a new one',
                status: 'warning',
                duration: 3000,
            });
            return;
        }

        setIsUploading(true);
        try {
            let assetId = selectedAssetId;

            // Upload new file if selected
            if (selectedFile) {
                assetId = await uploadAsset(selectedFile, 'token', campaignId);
            }

            // Update character with new asset
            const response = await api.patch(`/characters/${character._id}`, {
                assetId
            });

            toast({
                title: 'Success',
                description: 'Character image updated successfully',
                status: 'success',
                duration: 3000,
            });

            // Call onUpdate callback with updated character
            if (onUpdate) {
                onUpdate(response.data);
            }

            onClose();
        } catch (error) {
            console.error('Error updating character image:', error);
            toast({
                title: 'Error',
                description: 'Failed to update character image',
                status: 'error',
                duration: 3000,
            });
        } finally {
            setIsUploading(false);
        }
    };

    const handleClose = () => {
        setSelectedFile(null);
        setPreviewUrl(null);
        setSelectedAssetId(character?.assetId?._id || null);
        onClose();
    };

    // Filter campaign assets to only show token-type assets
    const tokenAssets = campaignAssets.filter(asset => 
        asset.type === 'token' && asset.status === 'active'
    );

    return (
        <Modal isOpen={isOpen} onClose={handleClose} size="xl">
            <ModalOverlay />
            <ModalContent bg="gray.800" color="white">
                <ModalHeader>Update Character Image</ModalHeader>
                <ModalCloseButton />
                <ModalBody>
                    <VStack spacing={6}>
                        {/* Current Image */}
                        <Box>
                            <Text mb={2} fontWeight="medium">Current Image:</Text>
                            <Box
                                width="120px"
                                height="120px"
                                borderRadius="md"
                                overflow="hidden"
                                border="2px solid"
                                borderColor="gray.600"
                                display="flex"
                                alignItems="center"
                                justifyContent="center"
                                bg="gray.700"
                            >
                                {character?.assetId?.url ? (
                                    <Image
                                        src={character.assetId.url}
                                        alt={character.name}
                                        width="100%"
                                        height="100%"
                                        objectFit="cover"
                                    />
                                ) : (
                                    <Icon as={FaUser} boxSize={8} color="gray.400" />
                                )}
                            </Box>
                        </Box>

                        {/* New Image Preview */}
                        {(previewUrl || selectedAssetId) && (
                            <Box>
                                <Text mb={2} fontWeight="medium">New Image Preview:</Text>
                                <Box
                                    width="120px"
                                    height="120px"
                                    borderRadius="md"
                                    overflow="hidden"
                                    border="2px solid"
                                    borderColor="orange.400"
                                    display="flex"
                                    alignItems="center"
                                    justifyContent="center"
                                    bg="gray.700"
                                >
                                    {previewUrl ? (
                                        <Image
                                            src={previewUrl}
                                            alt="Preview"
                                            width="100%"
                                            height="100%"
                                            objectFit="cover"
                                        />
                                    ) : selectedAssetId ? (
                                        <Image
                                            src={campaignAssets.find(a => a._id === selectedAssetId)?.url}
                                            alt="Selected asset"
                                            width="100%"
                                            height="100%"
                                            objectFit="cover"
                                        />
                                    ) : null}
                                </Box>
                            </Box>
                        )}

                        {/* Upload New Image */}
                        <VStack spacing={3} width="100%">
                            <Text fontWeight="medium">Upload New Image:</Text>
                            <Input
                                type="file"
                                accept="image/*"
                                onChange={handleFileSelect}
                                display="none"
                                ref={fileInputRef}
                            />
                            <Button
                                leftIcon={<FaUpload />}
                                colorScheme="orange"
                                variant="outline"
                                onClick={() => fileInputRef.current?.click()}
                                width="200px"
                            >
                                Choose Image File
                            </Button>
                        </VStack>

                        {/* Existing Assets */}
                        {tokenAssets.length > 0 && (
                            <VStack spacing={3} width="100%">
                                <Text fontWeight="medium">Or Choose from Existing Assets:</Text>
                                <SimpleGrid columns={4} spacing={3} width="100%">
                                    {tokenAssets.map((asset) => (
                                        <Box
                                            key={asset._id}
                                            width="80px"
                                            height="80px"
                                            borderRadius="md"
                                            overflow="hidden"
                                            border="2px solid"
                                            borderColor={selectedAssetId === asset._id ? "orange.400" : "gray.600"}
                                            cursor="pointer"
                                            _hover={{ borderColor: "orange.300" }}
                                            onClick={() => handleAssetSelect(asset._id)}
                                            bg="gray.700"
                                        >
                                            <Image
                                                src={asset.url}
                                                alt={asset.name}
                                                width="100%"
                                                height="100%"
                                                objectFit="cover"
                                            />
                                        </Box>
                                    ))}
                                </SimpleGrid>
                            </VStack>
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
                            onClick={handleUpdateImage}
                            isLoading={isUploading}
                            loadingText="Updating..."
                            disabled={!selectedFile && !selectedAssetId}
                        >
                            Update Image
                        </Button>
                    </HStack>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
};

export default React.memo(CharacterImageUpdate, (prevProps, nextProps) => {
    // Only re-render if modal state or character changes
    return (
        prevProps.isOpen === nextProps.isOpen &&
        prevProps.character?._id === nextProps.character?._id &&
        prevProps.campaignAssets.length === nextProps.campaignAssets.length
    );
});