// client/src/components/MapSidebar.jsx
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
    Grid,
    GridItem,
    useToast,
    FormControl,
    FormLabel,
    Input,
    NumberInput,
    NumberInputField,
    NumberInputStepper,
    NumberIncrementStepper,
    NumberDecrementStepper,
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalFooter,
    ModalBody,
    ModalCloseButton,
    Text,
    useDisclosure
} from '@chakra-ui/react';
import { FiPlus, FiMap } from 'react-icons/fi';
import { api } from '../common/axiosPrivate';
import MapEditDrawer from './MapEditDrawer';


const NewMapModal = ({ isOpen, onClose, onSubmit, isSubmitting }) => {
    const [mapData, setMapData] = useState({
        name: '',
        gridSize: 40,
        gridWidth: 20,
        gridHeight: 15
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(mapData);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose}>
            <ModalOverlay />
            <ModalContent>
                <form onSubmit={handleSubmit}>
                    <ModalHeader>Create New Map</ModalHeader>
                    <ModalCloseButton />
                    <ModalBody>
                        <VStack spacing={4}>
                            <FormControl isRequired>
                                <FormLabel>Map Name</FormLabel>
                                <Input
                                    value={mapData.name}
                                    onChange={(e) => setMapData({
                                        ...mapData,
                                        name: e.target.value
                                    })}
                                    placeholder="Enter map name"
                                />
                            </FormControl>

                            <FormControl isRequired>
                                <FormLabel>Grid Size (pixels)</FormLabel>
                                <NumberInput
                                    value={mapData.gridSize}
                                    onChange={(value) => setMapData({
                                        ...mapData,
                                        gridSize: parseInt(value)
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

                            <FormControl isRequired>
                                <FormLabel>Grid Width (squares)</FormLabel>
                                <NumberInput
                                    value={mapData.gridWidth}
                                    onChange={(value) => setMapData({
                                        ...mapData,
                                        gridWidth: parseInt(value)
                                    })}
                                    min={1}
                                    max={100}
                                >
                                    <NumberInputField />
                                    <NumberInputStepper>
                                        <NumberIncrementStepper />
                                        <NumberDecrementStepper />
                                    </NumberInputStepper>
                                </NumberInput>
                            </FormControl>

                            <FormControl isRequired>
                                <FormLabel>Grid Height (squares)</FormLabel>
                                <NumberInput
                                    value={mapData.gridHeight}
                                    onChange={(value) => setMapData({
                                        ...mapData,
                                        gridHeight: parseInt(value)
                                    })}
                                    min={1}
                                    max={100}
                                >
                                    <NumberInputField />
                                    <NumberInputStepper>
                                        <NumberIncrementStepper />
                                        <NumberDecrementStepper />
                                    </NumberInputStepper>
                                </NumberInput>
                            </FormControl>
                        </VStack>
                    </ModalBody>

                    <ModalFooter>
                        <Button variant="ghost" mr={3} onClick={onClose}>
                            Cancel
                        </Button>
                        <Button 
                            colorScheme="blue" 
                            type="submit"
                            isLoading={isSubmitting}
                        >
                            Create Map
                        </Button>
                    </ModalFooter>
                </form>
            </ModalContent>
        </Modal>
    );
};

const MapSidebar = ({ isOpen, onClose, campaign, onMapAdd, isGM }) => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedMap, setSelectedMap] = useState(null);
    const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false);

    const toast = useToast();
    const {
        isOpen: isNewMapModalOpen,
        onOpen: onNewMapModalOpen,
        onClose: onNewMapModalClose
    } = useDisclosure();
    
    const handleCreateMap = async (mapData) => {
        setIsSubmitting(true);
        try {
            // Create new map
            const response = await api.post('/maps', {
                ...mapData,
                campaign: campaign._id,
                gridSettings: {
                    size: mapData.gridSize,
                    visible: true,
                    color: '#ccc'
                }
            });

            // Update campaign with new map
            await api.post(`/campaigns/${campaign._id}/maps`, {
                mapId: response.data._id
            });

            onMapAdd(); // Refresh campaign data
            onNewMapModalClose();
            toast({
                title: "Map created successfully",
                status: "success",
                duration: 3000,
            });
        } catch (error) {
            toast({
                title: "Error creating map",
                description: error.message,
                status: "error",
                duration: 3000,
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSetActiveMap = async (mapId) => {
        if (!isGM) return;
        
        try {
            await api.patch(`/campaigns/${campaign._id}`, {
                activeMap: mapId
            });
            onMapAdd();
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
    const handleMapClick = (map) => {
        if (isGM) {
            setSelectedMap(map);
            setIsEditDrawerOpen(true);
        } else {
            handleSetActiveMap(map._id);
        }
    };

    return (
        <>
            <Drawer isOpen={isOpen} placement="right" onClose={onClose} size="md">
                <DrawerOverlay />
                <DrawerContent>
                    <DrawerCloseButton />
                    <DrawerHeader>Campaign Maps</DrawerHeader>
                    <DrawerBody>
                        <VStack spacing={4} align="stretch">
                            {isGM && (
                                <Button
                                    leftIcon={<FiPlus />}
                                    colorScheme="blue"
                                    onClick={onNewMapModalOpen}
                                >
                                    Create New Map
                                </Button>
                            )}
                            
                            <Grid templateColumns="repeat(2, 1fr)" gap={4}>
                                {campaign?.maps?.map((map) => (
                                    <GridItem key={map._id}>
                                        <VStack
                                            p={4}
                                            border="1px"
                                            borderColor="gray.200"
                                            borderRadius="md"
                                            cursor={isGM ? "pointer" : "default"}
                                            onClick={() => isGM && handleMapClick(map)}
                                            bg={campaign.activeMap === map._id ? "blue.50" : "white"}
                                            _hover={{
                                                bg: isGM ? "gray.50" : "white"
                                            }}
                                        >
                                            <Text color="gray.800" fontWeight="bold">{map.name}</Text>
                                            <Text fontSize="sm" color="gray.600">
                                                {map.gridWidth && map.gridHeight 
                                                    ? `${map.gridWidth}×${map.gridHeight} grid`
                                                    : 'No grid dimensions'
                                                }
                                            </Text>
                                        </VStack>
                                    </GridItem>
                                ))}
                            </Grid>
                        </VStack>
                    </DrawerBody>
                </DrawerContent>
            </Drawer>

            <NewMapModal
                isOpen={isNewMapModalOpen}
                onClose={onNewMapModalClose}
                onSubmit={handleCreateMap}
                isSubmitting={isSubmitting}
            />
            <MapEditDrawer
                isOpen={isEditDrawerOpen}
                onClose={() => setIsEditDrawerOpen(false)}
                map={selectedMap}
                onMapUpdate={onMapAdd}
            />
        </>
    );
};

export default MapSidebar;