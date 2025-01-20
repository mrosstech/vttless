import React, { useState, useCallback, useEffect } from 'react';
import {
    Drawer,
    DrawerBody,
    DrawerHeader,
    DrawerOverlay,
    DrawerContent,
    DrawerCloseButton,
    FormControl,
    FormLabel,
    Input,
    NumberInput,
    NumberInputField,
    NumberInputStepper,
    NumberIncrementStepper,
    NumberDecrementStepper,
    VStack,
    Box,
    Text,
    useToast,
    Spinner
} from '@chakra-ui/react';
import { api } from '../common/axiosPrivate';
import { uploadAsset, loadAssetUrl } from '../utils/assetUtils';

const MapEditDrawer = ({ isOpen, onClose, map, onMapUpdate }) => {
    const [mapData, setMapData] = useState({
        name: '',
        gridSettings: {
            size: 50
        },
        backgroundImage: null
    }
    );
    const [isDragging, setIsDragging] = useState(false);
    const toast = useToast();

    useEffect(() => {
        if (map != null && isOpen) {
            console.log(map);
            setMapData(map);
        }
    }, [map, isOpen]);

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const handleBackgroundUpload = async (file) => {
        try {
            const assetId = await uploadAsset(file, 'background');
            const imageUrl = await loadAssetUrl(assetId);
            
            await api.patch(`/maps/${map._id}`, {
                backgroundImage: {
                    assetId: assetId,
                    position: { x: 0, y: 0 }
                }
            });

            setMapData(prev => ({
                ...prev,
                backgroundImage: {
                    url: imageUrl,
                    assetId: assetId,
                    position: { x: 0, y: 0 }
                }
            }));

            onMapUpdate();
            
            toast({
                title: "Background image updated",
                status: "success",
                duration: 3000,
            });
        } catch (error) {
            toast({
                title: "Error uploading background",
                description: error.message,
                status: "error",
                duration: 3000,
            });
        }
    };

    const handleDrop = async (e) => {
        e.preventDefault();
        setIsDragging(false);
        
        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith('image/')) {
            await handleBackgroundUpload(file);
        }
    };

    const handleFileSelect = async (e) => {
        const file = e.target.files[0];
        if (file && file.type.startsWith('image/')) {
            await handleBackgroundUpload(file);
        }
    };

    const handleMapDataChange = async (changes) => {
        try {
            const updatedData = { ...mapData, ...changes };
            await api.patch(`/maps/${map._id}`, changes);
            setMapData(updatedData);
            onMapUpdate();
        } catch (error) {
            console.error('Error updating map:', error);
            toast({
                title: "Error updating map",
                description: error.message,
                status: "error",
                duration: 3000,
            });
        }
    };

    return (
        <Drawer isOpen={isOpen} placement="right" onClose={onClose} size="md">
            <DrawerOverlay />
            <DrawerContent>
                <DrawerCloseButton />
                <DrawerHeader>Edit Map: {mapData.name}</DrawerHeader>
                <DrawerBody>
                    <VStack spacing={4}>
                        <FormControl>
                            <FormLabel>Map Name</FormLabel>
                            <Input
                                value={mapData.name}
                                onChange={(e) => handleMapDataChange({ name: e.target.value })}
                            />
                        </FormControl>

                        <FormControl>
                            <FormLabel>Grid Size (pixels)</FormLabel>
                            <NumberInput
                                value={mapData.gridSettings?.size}
                                onChange={(value) => handleMapDataChange({
                                    gridSettings: { ...mapData.gridSettings, size: parseInt(value) }
                                })}
                                min={20}
                                max={100}
                            >
                                <NumberInputField />
                                <NumberInputStepper>
                                    <NumberIncrementStepper />
                                    <NumberDecrementStepper />
                                </NumberInputStepper>
                            </NumberInput>
                        </FormControl>

                        <Box
                            w="100%"
                            h="200px"
                            border="2px dashed"
                            borderColor={isDragging ? "blue.500" : "gray.200"}
                            borderRadius="md"
                            display="flex"
                            alignItems="center"
                            justifyContent="center"
                            position="relative"
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                            bg={mapData.backgroundImage?.url ? "gray.100" : "transparent"}
                            backgroundImage={mapData.backgroundImage?.url ? `url(${mapData.backgroundImage.url})` : "none"}
                            backgroundSize="contain"
                            backgroundPosition="center"
                            backgroundRepeat="no-repeat"
                        >
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleFileSelect}
                                style={{
                                    position: "absolute",
                                    width: "100%",
                                    height: "100%",
                                    opacity: 0,
                                    cursor: "pointer"
                                }}
                            />
                            <Text color="gray.500">
                                Drag and drop an image here or click to select
                            </Text>
                        </Box>
                    </VStack>
                </DrawerBody>
            </DrawerContent>
        </Drawer>
    );
};

export default MapEditDrawer;