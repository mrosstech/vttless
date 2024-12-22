import React, { useState } from 'react';
import {
    Drawer,
    DrawerBody,
    DrawerHeader,
    DrawerOverlay,
    DrawerContent,
    DrawerCloseButton,
    Button,
    VStack,
    Image,
    Grid,
    GridItem,
    useToast,
    IconButton
} from '@chakra-ui/react';
import { FiPlus, FiMap } from 'react-icons/fi';
import { api } from '../common/axiosPrivate.js';
import { uploadAsset, loadAssetUrl } from '../utils/assetUtils';


const MapSidebar = ({ isOpen, onClose, campaign, onMapAdd, isGM }) => {
    const [uploading, setUploading] = useState(false);
    const toast = useToast();

    const handleMapUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        setUploading(true);
        try {
            // Use the existing asset upload functionality
            const assetId = await uploadAsset(file, 'map', campaign._id);
            const assetUrl = await loadAssetUrl(assetId);
            // Add the map to the campaign
            await api.post(`/campaigns/${campaign._id}/maps`, { 
                mapId: assetId,
                name: file.name,
                type: 'map',
                url: assetUrl,
                thumbnailUrl: assetUrl // Use thumbnail if available
            });
            
            onMapAdd(); // Refresh the campaign data
            toast({
                title: "Map added successfully",
                status: "success",
                duration: 3000,
            });
        } catch (error) {
            toast({
                title: "Error adding map",
                description: error.message,
                status: "error",
                duration: 3000,
            });
        } finally {
            setUploading(false);
        }
    };

    const handleSetActiveMap = async (mapId) => {
        if (!isGM) return;
        
        try {
            await api.patch(`/campaigns/${campaign._id}`, {
                activeMap: mapId
            });
            onMapAdd(); // Refresh campaign data
            toast({
                title: "Active map updated",
                status: "success",
                duration: 2000,
            });
        } catch (error) {
            toast({
                title: "Error updating active map",
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
                <DrawerHeader>Campaign Maps</DrawerHeader>
                <DrawerBody>
                    <VStack spacing={4} align="stretch">
                        {isGM && (
                            <Button
                                as="label"
                                leftIcon={<FiPlus />}
                                colorScheme="blue"
                                isLoading={uploading}
                            >
                                Add New Map
                                <input
                                    type="file"
                                    hidden
                                    accept="image/*"
                                    onChange={handleMapUpload}
                                />
                            </Button>
                        )}
                        
                        <Grid templateColumns="repeat(2, 1fr)" gap={4}>
                            {campaign?.maps?.map((map) => (
                                <GridItem key={map._id}>
                                    <Image
                                        src={map.thumbnailUrl || map.url}
                                        alt={map.name}
                                        borderRadius="md"
                                        cursor={isGM ? "pointer" : "default"}
                                        onClick={() => isGM && handleSetActiveMap(map._id)}
                                        border={campaign.activeMap === map._id ? "2px solid blue" : "none"}
                                        boxShadow={campaign.activeMap === map._id ? "0 0 0 2px blue" : "none"}
                                        transition="all 0.2s"
                                        _hover={{
                                            transform: isGM ? "scale(1.02)" : "none",
                                            boxShadow: isGM ? "lg" : "none"
                                        }}
                                    />
                                </GridItem>
                            ))}
                        </Grid>
                    </VStack>
                </DrawerBody>
            </DrawerContent>
        </Drawer>
    );
};

export default MapSidebar;