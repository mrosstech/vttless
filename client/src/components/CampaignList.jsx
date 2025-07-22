import { React, useEffect, useState } from 'react';
import {
    Table, Thead, Tbody, Tr, Th, Td,
    TableContainer, Button, VStack,
    useDisclosure, IconButton, Flex,
    useToast, Box, Container,
    Tabs, TabList, TabPanels, Tab, TabPanel,
    Heading, Text, Spinner, Center,
    Skeleton, SkeletonText
} from '@chakra-ui/react';
import { FiPlus, FiEdit, FiTrash2, FiUsers, FiMap } from 'react-icons/fi';
import { FaPlay } from 'react-icons/fa';
import CampaignEdit from './CampaignEdit';
import MapSidebar from './MapSidebar';
import { useAuth } from '../providers/AuthProvider';
import { api } from '../common/axiosPrivate.js';
import { useNavigate } from 'react-router-dom';

const CampaignList = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { isOpen, onOpen, onClose } = useDisclosure();
    const [campaigns, setCampaigns] = useState([]);
    const [selectedCampaign, setSelectedCampaign] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const toast = useToast();

    // Separate campaigns into different categories
    const myCampaigns = campaigns.filter(campaign => campaign.gm._id.toString() === user.user.id.toString());
    const joinedCampaigns = campaigns.filter(campaign => 
        campaign.players.some(player => player._id.toString() === user.user.id.toString()) &&
        campaign.gm._id.toString() !== user.user.id.toString()
    );
    const friendsCampaigns = campaigns.filter(campaign => 
        campaign.isFriendsCampaign && 
        !campaign.players.some(player => player._id.toString() === user.user.id.toString())
    );

    const fetchCampaigns = async () => {
        setIsLoading(true);
        try {
            const response = await api.get('/campaigns/list');
            setCampaigns(response.data);
        } catch (error) {
            toast({
                title: 'Error fetching campaigns',
                description: error.response?.data?.message || 'Something went wrong',
                status: 'error'
            });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchCampaigns();
    }, []);

    const handleEdit = (campaign) => {
        setSelectedCampaign(campaign);
        onOpen();
    };

    const handleDelete = async (campaignId) => {
        if (window.confirm('Are you sure you want to delete this campaign?')) {
            try {
                await api.post('/campaigns/delete', { campaignId });
                toast({
                    title: 'Campaign deleted',
                    status: 'success'
                });
                fetchCampaigns();
            } catch (error) {
                toast({
                    title: 'Error deleting campaign',
                    description: error.response?.data?.message,
                    status: 'error'
                });
            }
        }
    };

    const handleJoin = async (campaignId) => {
        try {
            await api.post('/campaigns/join', { campaignId });
            toast({
                title: 'Joined campaign successfully',
                status: 'success'
            });
            fetchCampaigns();
        } catch (error) {
            toast({
                title: 'Error joining campaign',
                description: error.response?.data?.message,
                status: 'error'
            });
        }
    };

    const handlePlayClick = (campaignId) => {
        navigate(`/play/${campaignId}`);
    };

    const renderCampaignRows = () => {
        return campaigns?.map((campaign) => (
            <Tr key={campaign._id}>
                {/* ... existing campaign columns ... */}
                <Td>
                    {(campaign.players.includes(user._id) || campaign.gm === user._id) && (
                        <Button
                            size="sm"
                            colorScheme="green"
                            onClick={() => handlePlayClick(campaign._id)}
                            leftIcon={<FaPlay />}
                            aria-label="Play Campaign"
                        >
                            Play
                        </Button>
                    )}
                </Td>
            </Tr>
        ));
    };

    if (isLoading) {
        return <CampaignListSkeleton />;
    }

    return (
        <Container maxW="container.xl">
            <VStack spacing={4} w="full">
                <Box w="full" display="flex" justifyContent="center" py={4}>
                    <Button
                        leftIcon={<FiPlus />}
                        colorScheme="orange"
                        onClick={() => {
                            setSelectedCampaign(null);
                            onOpen();
                        }}
                        size={{ base: "md", md: "lg" }}
                    >
                        New Campaign
                    </Button>
                </Box>

                <Tabs isFitted variant="enclosed" w="full">
                    <TabList>
                        <Tab>My Campaigns ({myCampaigns.length})</Tab>
                        <Tab>Joined Campaigns ({joinedCampaigns.length})</Tab>
                        <Tab>Friends' Campaigns ({friendsCampaigns.length})</Tab>
                    </TabList>

                    <TabPanels>
                        {/* My Campaigns */}
                        <TabPanel>
                            <CampaignTable 
                                campaigns={myCampaigns}
                                isGM={true}
                                onEdit={handleEdit}
                                onDelete={handleDelete}
                                onPlayClick={handlePlayClick}
                            />
                        </TabPanel>

                        {/* Joined Campaigns */}
                        <TabPanel>
                            <CampaignTable 
                                campaigns={joinedCampaigns}
                                isGM={false}
                                isPlayer={true}
                                onJoin={handleJoin}
                                currentUserId={user.user.id}
                                onPlayClick={handlePlayClick}
                            />
                        </TabPanel>

                        {/* Friends' Campaigns */}
                        <TabPanel>
                            <CampaignTable 
                                campaigns={friendsCampaigns}
                                isGM={false}
                                onJoin={handleJoin}
                                currentUserId={user.user.id}
                                showJoinButton={true}
                            />
                        </TabPanel>
                    </TabPanels>
                </Tabs>

                <CampaignEdit
                    isOpen={isOpen}
                    onClose={onClose}
                    campaign={selectedCampaign}
                    onSave={fetchCampaigns}
                />
            </VStack>
        </Container>
    );
};

// Separate component for the campaign table
const CampaignTable = ({ campaigns, isGM, ...props }) => {
    const [mapDrawerOpen, setMapDrawerOpen] = useState(false);
    const [selectedCampaign, setSelectedCampaign] = useState(null);

    if (campaigns.length === 0) {
        return (
            <Box textAlign="center" py={4}>
                <Text color="gray.500">No campaigns found</Text>
            </Box>
        );
    }

    const dummyCallback = () => {};

    return (
        <>
            <TableContainer>
                <Table variant="simple">
                    <Thead>
                        <Tr>
                            <Th>Name</Th>
                            <Th>Description</Th>
                            <Th>GM</Th>
                            <Th>Players</Th>
                            <Th>Actions</Th>
                        </Tr>
                    </Thead>
                    <Tbody>
                        {campaigns.map((campaign) => (
                            <Tr key={campaign._id}>
                                <Td>{campaign.name}</Td>
                                <Td>{campaign.description}</Td>
                                <Td>{campaign.gm.username}</Td>
                                <Td>{campaign.players.length}</Td>
                                <Td>
                                    {isGM && (
                                            <IconButton
                                                icon={<FiMap />}
                                                aria-label="Manage Maps"
                                                mr={2}
                                                onClick={() => {
                                                    setSelectedCampaign(campaign);
                                                    setMapDrawerOpen(true);
                                                }}
                                            />
                                        )}
                                    {isGM ? (
                                        <>
                                            <IconButton
                                                icon={<FiEdit />}
                                                onClick={() => props.onEdit(campaign)}
                                                mr={2}
                                                colorScheme="orange"
                                                variant="outline"
                                                aria-label="Edit campaign"
                                            />
                                            <IconButton
                                                icon={<FiTrash2 />}
                                                onClick={() => props.onDelete(campaign._id)}
                                                mr={2}
                                                colorScheme="red"
                                                variant="outline"
                                                aria-label="Delete campaign"
                                            />
                                            <IconButton 
                                                icon={<FaPlay />}
                                                onClick={() => props.onPlayClick(campaign._id)}
                                                colorScheme="green"
                                                variant="outline"
                                                aria-label="Play Campaign"
                                            />
                                        </>
                                    ) : props.isPlayer ? (
                                        <IconButton 
                                            icon={<FaPlay />}
                                            onClick={() => props.onPlayClick(campaign._id)}
                                            colorScheme="green"
                                            variant="outline"
                                            aria-label="Play Campaign"
                                        />
                                        ) :
                                    
                                        props.showJoinButton && (
                                        <Button
                                            onClick={() => props.onJoin(campaign._id)}
                                            colorScheme="orange"
                                            variant="outline"
                                            leftIcon={<FiUsers />}
                                        >
                                            Join Campaign
                                        </Button>
                                    )}
                                </Td>
                            </Tr>
                        ))}
                    </Tbody>
                </Table>
            </TableContainer>
            {selectedCampaign && (
                <MapSidebar
                    isOpen={mapDrawerOpen}
                    onClose={() => setMapDrawerOpen(false)}
                    campaign={selectedCampaign}
                    onMapAdd={dummyCallback}
                    isGM={isGM}
                />
            )}
        </>
    );
};

const CampaignListSkeleton = () => {
    return (
        <Container maxW="container.xl">
            <VStack spacing={4} w="full">
                {/* New Campaign Button Skeleton */}
                <Box w="full" display="flex" justifyContent="center" py={4}>
                    <Skeleton height="40px" width="150px" borderRadius="md" />
                </Box>

                {/* Tabs Skeleton */}
                <Box w="full">
                    <Skeleton height="40px" width="full" mb={4} borderRadius="md" />
                    
                    {/* Table Skeleton */}
                    <VStack spacing={3}>
                        <Skeleton height="50px" width="full" borderRadius="md" />
                        {[...Array(3)].map((_, index) => (
                            <Skeleton key={index} height="60px" width="full" borderRadius="md" />
                        ))}
                    </VStack>
                </Box>
            </VStack>
        </Container>
    );
};

export default CampaignList;