import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../providers/AuthProvider';
import {
    Box,
    useToast,
    Drawer,
    DrawerBody,
    DrawerHeader,
    DrawerOverlay,
    DrawerContent,
    DrawerCloseButton,
    VStack,
    HStack,
    Button,
    Text,
    Card,
    CardBody,
    Avatar,
    IconButton,
    useDisclosure,
    Input,
    NumberInput,
    NumberInputField,
    NumberInputStepper,
    NumberIncrementStepper,
    NumberDecrementStepper,
    Switch,
    FormControl,
    FormLabel
} from '@chakra-ui/react';
import { HiMenu } from 'react-icons/hi';
import { IoArrowBack, IoChevronDown, IoChevronUp } from 'react-icons/io5';
import { socket } from '../socket';
import './Play.css';
import axiosPrivate from '../utils/axiosPrivate';
import VideoChat from './VideoChat';



const Play = () => {
    const { campaignId } = useParams(); // Get the campaignId from URL parameters
    const { user } = useAuth();
    const navigate = useNavigate();
    const toast = useToast();
    const canvasRef = useRef(null);
    const { isOpen, onOpen, onClose } = useDisclosure();
    const [campaign, setCampaign] = useState(null);
    const [currentMap, setCurrentMap] = useState(null);
    const [gameState, setGameState] = useState({
        tokens: [],
        selectedToken: null,
        isDragging: false,
        scale: 1,
        gridSize: 40,
        mapDimensions: { width: 800, height: 600 }
    });
    const [viewport, setViewport] = useState({
        zoom: 1,
        offsetX: 0,
        offsetY: 0,
        minZoom: 0.25,
        maxZoom: 4
    });
    const [isConnected, setIsConnected] = useState(socket.connected);
    const [background, setBackground] = useState({
        image: null,
        x: 0,
        y: 0,
        isDragging: false,
        dragStart: { x: 0, y: 0 },
        startPosition: { x: 0, y: 0 }
    });
    const [dragState, setDragState] = useState({
        isDragOver: false,
        dragType: null // 'token' or 'background'
    });
    const [editingToken, setEditingToken] = useState(null);
    const [editingName, setEditingName] = useState('');
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
    const [campaignMaps, setCampaignMaps] = useState([]);
    const [isCreatingMap, setIsCreatingMap] = useState(false);
    const [newMapName, setNewMapName] = useState('');
    const [isMapSectionCollapsed, setIsMapSectionCollapsed] = useState(false);
    const [isCharacterSectionCollapsed, setIsCharacterSectionCollapsed] = useState(false);
    const [isGridSectionCollapsed, setIsGridSectionCollapsed] = useState(false);
    const [gridSettings, setGridSettings] = useState({
        gridWidth: 20,
        gridHeight: 20,
        gridSize: 40,
        visible: true,
        color: '#ccc'
    });


    // Load campaign and map data
    useEffect(() => {
        const loadCampaignData = async () => {
            try {
                const response = await axiosPrivate.get(`/campaigns/${campaignId}`);
                setCampaign(response.data);
                console.log(response.data);
                
                if (response.data.activeMap) {
                    //const mapResponse = await axiosPrivate.get(`/maps/${response.data.activeMap}`);
                    setCurrentMap(response.data.activeMap);
                    
                    // Initialize game state from map data
                    await initializeGameState(response.data.activeMap);
                }
            } catch (error) {
                toast({
                    title: "Error loading campaign",
                    description: error.message,
                    status: "error"
                });
            }
        };

        loadCampaignData();
    }, [campaignId]);

    const initializeGameState = async (mapData) => {
        // Load background image for current map if exists
        console.log('Initializing game state');
        if (mapData.backgroundImage?.assetId) {
            console.log('Loading background image');
            console.log(mapData.backgroundImage.assetId);
            try {
                const imageUrl = await loadAssetUrl(mapData.backgroundImage.assetId);
                const img = new Image();
                img.onload = () => {
                    setBackground(prev => ({
                        ...prev,
                        image: img,
                        x: mapData.backgroundImage.position.x,
                        y: mapData.backgroundImage.position.y
                    }));
                };
                img.src = imageUrl;
            } catch (error) {
                console.error('Error loading background:', error);
            }
        }

       // Load tokens
        const loadedTokens = await Promise.all(mapData.tokens.map(async token => {
            try {
                const imageUrl = await loadAssetUrl(token.assetId);
                const img = new Image();
                await new Promise(resolve => {
                    img.onload = resolve;
                    img.src = imageUrl;
                });
                return { ...token, image: img };
            } catch (error) {
                console.error('Error loading token:', error);
                return token;
            }
        }));

        // Update grid settings from map data
        setGridSettings({
            gridWidth: mapData.gridWidth || 20,
            gridHeight: mapData.gridHeight || 20,
            gridSize: mapData.gridSettings?.size || 40,
            visible: mapData.gridSettings?.visible !== false,
            color: mapData.gridSettings?.color || '#ccc'
        });

        setGameState(prev => ({
            ...prev,
            tokens: loadedTokens,
            gridSize: mapData.gridSettings?.size || 40,
            mapDimensions: {
                width: (mapData.gridWidth || 20) * (mapData.gridSettings?.size || 40),
                height: (mapData.gridHeight || 20) * (mapData.gridSettings?.size || 40)
            }
        }));
    };

     // Handle file upload for background and tokens
     const uploadAsset = async (file, assetType) => {
        try {
            // Get presigned URL
            const { data: { uploadUrl, assetId } } = await axiosPrivate.post(
                '/assets/upload-url',
                {
                    fileName: file.name,
                    fileType: file.type,
                    assetType,
                    campaignId
                }
            );

            // Upload file directly to S3
            await axiosPrivate.put(uploadUrl, file, {
                headers: {
                    'Content-Type': file.type
                }
            });

            // Confirm upload
            await axiosPrivate.post(
                '/assets/confirm-upload',
                { assetId }
            );

            return assetId;
        } catch (error) {
            toast({
                title: "Upload failed",
                description: error.message,
                status: "error"
            });
            throw error;
        }
    };

    const loadAssetUrl = async (assetId) => {
        try {
            const { data: { downloadUrl } } = await axiosPrivate.get(
                `/assets/${assetId}/download-url`);
            return downloadUrl;
        } catch (error) {
            console.error('Error loading asset:', error);
            throw error;
        }
    };

    // Enhanced drag and drop event handlers
    const handleDragOver = (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        // Determine drop type based on mouse position
        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        
        // If near center area, suggest token drop, otherwise background (GM only)
        const isNearCenter = Math.abs(mouseX - centerX) < 150 && Math.abs(mouseY - centerY) < 150;
        const dragType = isNearCenter ? 'token' : (isGM ? 'background' : 'token');
        
        setDragState({
            isDragOver: true,
            dragType: dragType
        });
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragState({ isDragOver: false, dragType: null });
    };

    const handleDrop = async (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        setDragState({ isDragOver: false, dragType: null });

        const file = e.dataTransfer.files[0];
        if (!file || !file.type.startsWith('image/')) {
            toast({
                title: "Invalid file type",
                description: "Please drop an image file (PNG, JPG, etc.)",
                status: "error"
            });
            return;
        }

        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        
        // Determine if this should be a token or background based on drop position and GM status
        const isNearCenter = Math.abs(mouseX - centerX) < 150 && Math.abs(mouseY - centerY) < 150;
        const shouldUploadAsBackground = !isNearCenter && isGM;
        
        try {
            if (shouldUploadAsBackground) {
                // Upload as background (GM only)
                await handleBackgroundUpload(file);
            } else {
                // Upload as token (always fallback for non-GMs)
                await handleTokenUpload(file, mouseX, mouseY);
            }
        } catch (error) {
            toast({
                title: "Upload failed",
                description: error.message,
                status: "error"
            });
        }
    };

    const handleBackgroundUpload = async (file) => {
        const assetId = await uploadAsset(file, 'background');
        const imageUrl = await loadAssetUrl(assetId);
        
        // Update map in database
        await axiosPrivate.patch(`/api/maps/${currentMap._id}`, {
            backgroundImage: {
                url: imageUrl,
                position: { x: 0, y: 0 }
            }
        });

        // Update local state
        const img = new Image();
        img.onload = () => {
            setBackground(prev => ({
                ...prev,
                image: img,
                x: 0,
                y: 0
            }));
        };
        img.src = imageUrl;

        // Notify other players
        socket.emit('backgroundUpdate', {
            campaignId,
            mapId: currentMap._id,
            assetId,
            position: { x: 0, y: 0 }
        });
        
        toast({
            title: "Background updated",
            description: "Map background has been updated successfully",
            status: "success"
        });
    };

    const handleTokenUpload = async (file, dropX, dropY) => {
        const assetId = await uploadAsset(file, 'token');
        const imageUrl = await loadAssetUrl(assetId);
        
        // Convert screen coordinates to world coordinates
        const worldPos = screenToWorld(dropX, dropY);
        const snapToGrid = (coord) => Math.round(coord / gridSettings.gridSize) * gridSettings.gridSize;
        
        const newToken = {
            id: `token_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
            assetId,
            x: snapToGrid(worldPos.x),
            y: snapToGrid(worldPos.y),
            width: gridSettings.gridSize,
            height: gridSettings.gridSize,
            ownerId: user.user.id,
            name: file.name.replace(/\.[^/.]+$/, '') // Remove file extension
        };
        
        // Load the image for immediate display
        const img = new Image();
        await new Promise(resolve => {
            img.onload = resolve;
            img.src = imageUrl;
        });
        
        const tokenWithImage = { ...newToken, image: img };
        
        // Update local state
        setGameState(prev => ({
            ...prev,
            tokens: [...prev.tokens, tokenWithImage]
        }));
        
        // Update map in database
        try {
            await axiosPrivate.patch(`/maps/${currentMap._id}/tokens`, {
                token: newToken
            });
        } catch (error) {
            console.error('Token database update failed:', error);
            toast({
                title: "Warning",
                description: "Token added locally but may not be saved to database",
                status: "warning"
            });
        }
        
        // Notify other players
        socket.emit('tokenAdded', {
            campaignId,
            mapId: currentMap._id,
            token: newToken
        });
        
        toast({
            title: "Token added",
            description: `${newToken.name} has been added to the map`,
            status: "success"
        });
    };


    // Initialize canvas and load assets
    useEffect(() => {
        // This effect can be used for future asset loading if needed
    }, []);

    // Socket.io event handlers
    useEffect(() => {
        const handleConnect = () => setIsConnected(true);
        const handleDisconnect = () => setIsConnected(false);

        socket.on('connect', handleConnect);
        socket.on('disconnect', handleDisconnect);
        
        // Connect the socket
        socket.connect();

        return () => {
            socket.off('connect', handleConnect);
            socket.off('disconnect', handleDisconnect);
            socket.disconnect();
        };
    }, []);

    // Socket.io event handlers
    useEffect(() => {
        socket.emit('joinCampaign', campaignId);

        const handleTokenMove = (data) => {
            if (data.playerId !== user.user.id) {
                setGameState(prev => ({
                    ...prev,
                    tokens: prev.tokens.map(token => 
                        token.id === data.tokenId 
                            ? { ...token, x: data.x, y: data.y }
                            : token
                    )
                }));
            }
        };

        const handleTokenUpdate = (data) => {
            if (data.playerId !== user.user.id) {
                setGameState(prev => ({
                    ...prev,
                    tokens: prev.tokens.map(token =>
                        token.id === data.tokenId
                            ? { ...token, x: data.x, y: data.y }
                            : token
                    )
                }));
            }
        };

        const handleBackgroundUpdate = (data) => {
            if (data.playerId !== user.user.id) {
                setBackground(prev => ({
                    ...prev,
                    x: data.position.x,
                    y: data.position.y
                }));
            }
        };

        socket.on('tokenMove', handleTokenMove);
        socket.on('tokenUpdate', handleTokenUpdate);
        socket.on('backgroundUpdate', handleBackgroundUpdate);

        return () => {
            socket.emit('leaveCampaign', campaignId);
            socket.off('tokenMove', handleTokenMove);
            socket.off('tokenUpdate', handleTokenUpdate);
            socket.off('backgroundUpdate', handleBackgroundUpdate);
        };
    }, [campaignId]);

    // Render game state
    const renderGame = () => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Apply zoom and pan transformation
        ctx.save();
        ctx.translate(viewport.offsetX, viewport.offsetY);
        ctx.scale(viewport.zoom, viewport.zoom);
        
        // Draw background if exists
        if (background.image) {
            ctx.save();
            ctx.globalAlpha = 0.5; // Optional: make grid visible through background
            ctx.drawImage(
                background.image,
                background.x,
                background.y,
                gameState.mapDimensions.width,
                gameState.mapDimensions.height
            );
            ctx.restore();
        }
        
        // Draw grid
        drawGrid(ctx);
        
        // Draw tokens
        gameState.tokens.forEach(token => {
            if (token.image) {
                ctx.drawImage(
                    token.image,
                    token.x,
                    token.y,
                    token.width * gameState.scale,
                    token.height * gameState.scale
                );
            }
        });
        
        // Draw selected token name label (hide during dragging)
        if (gameState.selectedToken && !gameState.isDragging) {
            // Get the current token data from the tokens array (has updated position)
            const currentToken = gameState.tokens.find(token => token.id === gameState.selectedToken.id);
            if (currentToken) {
                const tokenName = currentToken.name || 'Unnamed Token';
                
                // Calculate position under the token using current position
                const labelX = currentToken.x + (currentToken.width * gameState.scale) / 2;
                const labelY = currentToken.y + (currentToken.height * gameState.scale) + 20;
            
                // Set up text styling
                ctx.save();
                ctx.font = `${Math.max(12 / viewport.zoom, 8)}px Arial`;
                ctx.fillStyle = '#ffffff';
                ctx.strokeStyle = '#000000';
                ctx.lineWidth = 2 / viewport.zoom;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'top';
                
                // Draw text background
                const textMetrics = ctx.measureText(tokenName);
                const textWidth = textMetrics.width;
                const textHeight = Math.max(12 / viewport.zoom, 8);
                const padding = 4 / viewport.zoom;
                
                ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
                ctx.fillRect(
                    labelX - textWidth / 2 - padding,
                    labelY - padding,
                    textWidth + padding * 2,
                    textHeight + padding * 2
                );
                
                // Draw text with outline for better visibility
                ctx.strokeText(tokenName, labelX, labelY);
                ctx.fillStyle = '#ffffff';
                ctx.fillText(tokenName, labelX, labelY);
                
                ctx.restore();
            }
        }
        
        // Restore transformation
        ctx.restore();
    };

    // Helper function to convert screen coordinates to world coordinates
    const screenToWorld = (screenX, screenY) => {
        const worldX = (screenX - viewport.offsetX) / viewport.zoom;
        const worldY = (screenY - viewport.offsetY) / viewport.zoom;
        return { x: worldX, y: worldY };
    };

    // Helper function to detect clicks on token name labels
    const isClickOnTokenNameLabel = (worldX, worldY, token) => {
        if (!gameState.selectedToken || gameState.selectedToken.id !== token.id || gameState.isDragging) {
            return false; // Name not visible
        }
        
        // Calculate name label position (same as in renderGame)
        const labelX = token.x + (token.width * gameState.scale) / 2;
        const labelY = token.y + (token.height * gameState.scale) + 20;
        
        // Approximate label dimensions (rough estimation)
        const labelWidth = Math.max(100 / viewport.zoom, 80); // Rough width estimation
        const labelHeight = Math.max(20 / viewport.zoom, 16); // Rough height estimation
        
        // Check if click is within label bounds
        return worldX >= labelX - labelWidth / 2 && 
               worldX <= labelX + labelWidth / 2 && 
               worldY >= labelY && 
               worldY <= labelY + labelHeight;
    };

    // Mouse event handlers - Binary selection + dragging
    const handleMouseDown = (e) => {
        const { offsetX, offsetY } = e.nativeEvent;
        const worldPos = screenToWorld(offsetX, offsetY);
        const clickedToken = findTokenAtPosition(worldPos.x, worldPos.y);
        
        // Check if clicking on a token name label first
        if (gameState.selectedToken) {
            const selectedTokenData = gameState.tokens.find(t => t.id === gameState.selectedToken.id);
            if (selectedTokenData && isClickOnTokenNameLabel(worldPos.x, worldPos.y, selectedTokenData)) {
                // Check if user owns this token before allowing edit
                const tokenOwnerId = selectedTokenData?.ownerId?._id || selectedTokenData?.ownerId;
                if (tokenOwnerId === user.user.id) {
                    startEditingTokenName(selectedTokenData);
                    return; // Don't proceed with other click handling
                }
            }
        }
        
        if (clickedToken) {
            // Check if user owns this token for dragging
            const tokenOwnerId = clickedToken?.ownerId?._id || clickedToken?.ownerId;
            const canDragToken = tokenOwnerId === user.user.id;
            
            // Check if clicking the same token that's already selected
            const isSameToken = gameState.selectedToken && gameState.selectedToken.id === clickedToken.id;
            
            if (isSameToken && canDragToken) {
                // If clicking own selected token, start dragging (don't deselect)
                // Calculate offset from mouse position to token's top-left corner
                const tokenOffsetX = worldPos.x - clickedToken.x;
                const tokenOffsetY = worldPos.y - clickedToken.y;
                setDragOffset({ x: tokenOffsetX, y: tokenOffsetY });
                
                setGameState(prev => ({
                    ...prev,
                    isDragging: true
                }));
            } else if (isSameToken && !canDragToken) {
                // If clicking someone else's selected token, deselect it
                setGameState(prev => ({
                    ...prev,
                    selectedToken: null,
                    isDragging: false
                }));
            } else {
                // Select the new token and enable dragging if owned
                if (canDragToken) {
                    // Calculate offset from mouse position to token's top-left corner
                    const tokenOffsetX = worldPos.x - clickedToken.x;
                    const tokenOffsetY = worldPos.y - clickedToken.y;
                    setDragOffset({ x: tokenOffsetX, y: tokenOffsetY });
                }
                
                setGameState(prev => ({
                    ...prev,
                    selectedToken: clickedToken,
                    isDragging: canDragToken // Only enable dragging for owned tokens
                }));
            }
        } else {
            // Clicking on empty space or background
            if (gameState.selectedToken) {
                // Clear selection if a token was selected
                setGameState(prev => ({
                    ...prev,
                    selectedToken: null,
                    isDragging: false
                }));
            } else if (background.image && isGM) {
                // Start background dragging only if no token was selected and user is GM
                setBackground(prev => ({
                    ...prev,
                    isDragging: true,
                    dragStart: { 
                        x: offsetX, 
                        y: offsetY 
                    },
                    startPosition: {
                        x: prev.x,
                        y: prev.y
                    }
                }));
            }
        }
    };

    const handleMouseMove = (e) => {
        const { offsetX, offsetY } = e.nativeEvent;
        const worldPos = screenToWorld(offsetX, offsetY);

        if (gameState.isDragging && gameState.selectedToken) {
            // Handle token dragging - only for owned tokens
            const snapToGrid = (coord) => Math.round(coord / gridSettings.gridSize) * gridSettings.gridSize;
            
            // Calculate new position accounting for drag offset
            const newX = snapToGrid(worldPos.x - dragOffset.x);
            const newY = snapToGrid(worldPos.y - dragOffset.y);
            
            setGameState(prev => ({
                ...prev,
                tokens: prev.tokens.map(token =>
                    token.id === prev.selectedToken.id
                        ? { ...token, x: newX, y: newY }
                        : token
                )
            }));

            socket.emit('tokenMove', {
                campaignId: campaignId,
                tokenId: gameState.selectedToken.id,
                x: newX,
                y: newY,
                playerId: user.user.id
            });
        } else if (background.isDragging) {
            // Handle background dragging - convert screen movement to world coordinates
            const deltaX = (offsetX - background.dragStart.x) / viewport.zoom;
            const deltaY = (offsetY - background.dragStart.y) / viewport.zoom;
            const newX = background.startPosition.x + deltaX;
            const newY = background.startPosition.y + deltaY;
            
            setBackground(prev => ({
                ...prev,
                x: newX,
                y: newY
            }));

            // Optionally emit background position to other players
            socket.emit('backgroundMove', {
                x: newX,
                y: newY,
                playerId: user.user.id
            });
        }
    };

    const handleMouseUp = async () => {
        // Save token position to database if we were dragging a token
        if (gameState.isDragging && gameState.selectedToken) {
            try {
                const currentToken = gameState.tokens.find(token => token.id === gameState.selectedToken.id);
                if (currentToken) {
                    await axiosPrivate.patch(`/maps/${currentMap._id}/tokens/${gameState.selectedToken.id}`, {
                        x: currentToken.x,
                        y: currentToken.y
                    });
                }
            } catch (error) {
                console.error('Failed to save token position:', error);
                toast({
                    title: "Warning",
                    description: "Token position may not be saved",
                    status: "warning"
                });
            }
        }

        // Save background position to database if we were dragging background
        if (background.isDragging) {
            try {
                await axiosPrivate.patch(`/maps/${currentMap._id}`, {
                    backgroundImage: {
                        ...currentMap.backgroundImage,
                        position: { 
                            x: background.x, 
                            y: background.y 
                        }
                    }
                });
            } catch (error) {
                console.error('Failed to save background position:', error);
                toast({
                    title: "Warning",
                    description: "Background position may not be saved",
                    status: "warning"
                });
            }
        }

        // Only clear dragging states, but preserve token selection
        setGameState(prev => ({
            ...prev,
            isDragging: false
        }));
        setBackground(prev => ({
            ...prev,
            isDragging: false
        }));
    };

    // Mouse wheel handler for zoom - optimized for smoother scrolling
    const handleWheel = (e) => {
        e.preventDefault();
        
        const canvas = canvasRef.current;
        if (!canvas) return;
        
        const rect = canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        
        // Smaller zoom delta for smoother zoom
        const zoomDelta = e.deltaY > 0 ? 0.95 : 1.05;
        
        setViewport(prev => {
            const newZoom = Math.max(prev.minZoom, Math.min(prev.maxZoom, prev.zoom * zoomDelta));
            
            // Only update if zoom actually changed
            if (newZoom === prev.zoom) return prev;
            
            // Calculate new offset to zoom towards mouse position
            const zoomRatio = newZoom / prev.zoom;
            const newOffsetX = mouseX - (mouseX - prev.offsetX) * zoomRatio;
            const newOffsetY = mouseY - (mouseY - prev.offsetY) * zoomRatio;
            
            return {
                ...prev,
                zoom: newZoom,
                offsetX: newOffsetX,
                offsetY: newOffsetY
            };
        });
    };

    // Add wheel event listener with passive: false
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        canvas.addEventListener('wheel', handleWheel, { passive: false });

        return () => {
            canvas.removeEventListener('wheel', handleWheel);
        };
    }, [handleWheel]);

    // Helper functions
    const findTokenAtPosition = (x, y) => {
        return gameState.tokens.find(token => {
            return x >= token.x &&
                   x <= token.x + token.width * gameState.scale &&
                   y >= token.y &&
                   y <= token.y + token.height * gameState.scale;
        });
    };

    const drawGrid = useCallback((ctx) => {
        // Skip grid drawing if grid is not visible or zoomed out too far
        if (!gridSettings.visible || viewport.zoom < 0.5) return;
        
        const gridSize = gridSettings.gridSize;
        const { width, height } = gameState.mapDimensions;
        
        ctx.strokeStyle = gridSettings.color || '#ccc';
        ctx.lineWidth = Math.max(0.5 / viewport.zoom, 0.1);

        // Draw vertical lines
        for (let x = 0; x <= width; x += gridSize) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, height);
            ctx.stroke();
        }

        // Draw horizontal lines
        for (let y = 0; y <= height; y += gridSize) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(width, y);
            ctx.stroke();
        }
    }, [gridSettings, gameState.mapDimensions, viewport.zoom]);

    // Memoized render function for better performance
    const memoizedRenderGame = useCallback(() => {
        renderGame();
    }, [gameState, viewport, background]);

    // Animation loop - optimized with RAF
    useEffect(() => {
        let animationId;
        
        const animate = () => {
            memoizedRenderGame();
            animationId = requestAnimationFrame(animate);
        };
        
        animationId = requestAnimationFrame(animate);
        
        return () => {
            if (animationId) {
                cancelAnimationFrame(animationId);
            }
        };
    }, [memoizedRenderGame]);

    useEffect(() => {
        const handleBackgroundMove = (data) => {
            if (data.playerId !== user.user.id) {
                setBackground(prev => ({
                    ...prev,
                    x: data.x,
                    y: data.y
                }));
            }
        };

        socket.on('backgroundMove', handleBackgroundMove);
        
        return () => {
            socket.off('backgroundMove', handleBackgroundMove);
        };
    }, []);

    // Check if current user is GM
    const isGM = campaign?.gm?._id === user.user.id || campaign?.gm === user.user.id;

    // Get user's characters from tokens - Clean implementation
    const userCharacters = gameState.tokens.filter(token => {
        // Handle ownerId as user object with _id property
        const tokenOwnerId = token.ownerId?._id || token.ownerId;
        return tokenOwnerId === user.user.id;
    });

    // Load campaign maps when campaign and user data are available
    useEffect(() => {
        if (campaign && isGM) {
            loadCampaignMaps();
        }
    }, [campaign, isGM]);

    const handleBackToMain = () => {
        navigate('/campaigns');
    };

    // Load campaign maps for GM
    const loadCampaignMaps = async () => {
        if (!isGM || !campaignId) return;
        try {
            const response = await axiosPrivate.get(`/maps/campaign/${campaignId}`);
            setCampaignMaps(response.data);
        } catch (error) {
            console.error('Error loading campaign maps:', error);
            toast({
                title: "Error loading maps",
                description: "Failed to load campaign maps",
                status: "error"
            });
        }
    };

    // Create new map
    const handleCreateMap = async () => {
        if (!newMapName.trim()) {
            toast({
                title: "Map name required",
                description: "Please enter a name for the new map",
                status: "warning"
            });
            return;
        }

        try {
            const response = await axiosPrivate.post('/maps', {
                name: newMapName,
                campaign: campaignId,
                gridWidth: 20,
                gridHeight: 20,
                gridSize: 40
            });

            toast({
                title: "Map created",
                description: `"${newMapName}" has been created successfully`,
                status: "success"
            });

            setNewMapName('');
            setIsCreatingMap(false);
            await loadCampaignMaps();
        } catch (error) {
            console.error('Error creating map:', error);
            toast({
                title: "Error creating map",
                description: error.response?.data?.message || "Failed to create map",
                status: "error"
            });
        }
    };

    // Switch to different map
    const handleSwitchMap = async (mapId) => {
        try {
            // Update campaign's active map using POST with campaignId in body
            await axiosPrivate.post('/campaigns/update', {
                campaignId: campaignId,
                activeMap: mapId
            });

            // Reload the page to switch to the new map
            window.location.reload();
        } catch (error) {
            console.error('Error switching map:', error);
            toast({
                title: "Error switching map",
                description: "Failed to switch to the selected map",
                status: "error"
            });
        }
    };

    // Update grid settings
    const handleGridSettingsUpdate = async (newSettings) => {
        try {
            // Update local state immediately for responsive UI
            setGridSettings(newSettings);
            
            // Calculate new map dimensions
            const newMapDimensions = {
                width: newSettings.gridWidth * newSettings.gridSize,
                height: newSettings.gridHeight * newSettings.gridSize
            };
            
            // Update game state
            setGameState(prev => ({
                ...prev,
                gridSize: newSettings.gridSize,
                mapDimensions: newMapDimensions
            }));

            // Update map in database
            await axiosPrivate.patch(`/maps/${currentMap._id}`, {
                gridWidth: newSettings.gridWidth,
                gridHeight: newSettings.gridHeight,
                gridSettings: {
                    size: newSettings.gridSize,
                    visible: newSettings.visible,
                    color: newSettings.color
                }
            });

            toast({
                title: "Grid settings updated",
                description: "Map grid settings have been saved successfully",
                status: "success"
            });
        } catch (error) {
            console.error('Error updating grid settings:', error);
            toast({
                title: "Error updating grid settings",
                description: "Failed to save grid settings",
                status: "error"
            });
        }
    };

    // Token name editing functions
    const startEditingTokenName = (token) => {
        setEditingToken(token.id);
        setEditingName(token.name || '');
    };

    const cancelEditingTokenName = () => {
        setEditingToken(null);
        setEditingName('');
    };

    const saveTokenName = async (tokenId) => {
        try {
            // Update local state
            setGameState(prev => ({
                ...prev,
                tokens: prev.tokens.map(token =>
                    token.id === tokenId
                        ? { ...token, name: editingName }
                        : token
                )
            }));

            // Update database
            await axiosPrivate.patch(`/maps/${currentMap._id}/tokens/${tokenId}`, {
                name: editingName
            });

            // Notify other players
            socket.emit('tokenUpdated', {
                campaignId,
                mapId: currentMap._id,
                tokenId,
                updates: { name: editingName }
            });

            // Clear editing state
            setEditingToken(null);
            setEditingName('');

            toast({
                title: "Token name updated",
                description: `Token renamed to "${editingName}"`,
                status: "success"
            });
        } catch (error) {
            console.error('Error updating token name:', error);
            toast({
                title: "Error",
                description: "Failed to update token name",
                status: "error"
            });
        }
    };

    return (
        <Box position="relative" h="100vh" w="100vw" overflow="hidden" display="flex">
            {/* Menu Toggle Button - Fixed position */}
            <IconButton
                icon={<HiMenu />}
                onClick={onOpen}
                position="fixed"
                top={4}
                left={4}
                zIndex={1000}
                colorScheme="orange"
                variant="solid"
                size="md"
                aria-label="Open menu"
            />

            {/* Zoom Level Indicator - Fixed position on main screen */}
            <Box
                position="fixed"
                top={4}
                left="50%"
                transform="translateX(-50%)"
                zIndex={1000}
                bg="rgba(0, 0, 0, 0.8)"
                color="white"
                px={3}
                py={2}
                borderRadius="md"
                fontSize="sm"
                fontWeight="medium"
                border="1px solid"
                borderColor="orange.400"
                backdropFilter="blur(4px)"
            >
                <Text>
                    Zoom: {Math.round(viewport.zoom * 100)}%
                </Text>
            </Box>

            {/* Main Game Area - Left side */}
            <Box
                flex={1}
                position="relative"
                h="100%"
                display="flex"
                alignItems="center"
                justifyContent="center"
                bg="gray.900"
                mr="320px"
            >
                <canvas
                    ref={canvasRef}
                    width={gameState.mapDimensions.width}
                    height={gameState.mapDimensions.height}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    style={{ 
                        border: dragState.isDragOver 
                            ? `3px dashed ${dragState.dragType === 'token' ? '#F6AD55' : '#4FD1C7'}` 
                            : '2px solid #4A5568',
                        borderRadius: '8px',
                        cursor: background.isDragging ? 'grabbing' : (isGM ? 'grab' : 'default'),
                        boxShadow: dragState.isDragOver 
                            ? `0 0 20px ${dragState.dragType === 'token' ? 'rgba(246, 173, 85, 0.5)' : 'rgba(79, 209, 199, 0.5)'}` 
                            : '0 10px 25px rgba(0,0,0,0.3)',
                        transition: 'all 0.2s ease'
                    }}
                />
            </Box>

            {/* Video Chat Sidebar - Right side */}
            <Box
                position="fixed"
                top={0}
                right={0}
                w="320px"
                h="100vh"
                bg="gray.800"
                borderLeft="1px solid"
                borderColor="gray.600"
                p={4}
                overflowY="auto"
                zIndex={999}
            >
                <Text fontSize="lg" fontWeight="bold" color="orange.400" mb={4}>
                    Video Chat
                </Text>
                <VideoChat
                    socket={socket}
                    campaignId={campaignId}
                    userId={user.user.id}
                    userName={user.user.username}
                    campaign={campaign}
                    isOpen={true}
                    isRightSidebar={true}
                />
            </Box>

            {/* Drag and Drop Overlay */}
            {dragState.isDragOver && (
                <Box
                    position="fixed"
                    top="50%"
                    left="50%"
                    transform="translate(-50%, -50%)"
                    zIndex={1001}
                    bg="rgba(0, 0, 0, 0.8)"
                    color="white"
                    px={6}
                    py={4}
                    borderRadius="lg"
                    textAlign="center"
                    border="2px dashed"
                    borderColor={dragState.dragType === 'token' ? 'orange.400' : 'teal.400'}
                    backdropFilter="blur(8px)"
                >
                    <Text fontSize="lg" fontWeight="bold" mb={2}>
                        {dragState.dragType === 'token' ? '🎭 Drop to add Token' : '🖼️ Drop to set Background'}
                    </Text>
                    <Text fontSize="sm" color="gray.300">
                        {dragState.dragType === 'token' 
                            ? 'Drop in center area to add a character token'
                            : 'Drop near edges to set map background'
                        }
                    </Text>
                </Box>
            )}

            {/* Empty State Overlay - when user has no tokens */}
            {userCharacters.length === 0 && !dragState.isDragOver && (
                <Box
                    position="fixed"
                    top="50%"
                    left="50%"
                    transform="translate(-50%, -50%)"
                    zIndex={999}
                    bg="rgba(0, 0, 0, 0.7)"
                    color="white"
                    px={8}
                    py={6}
                    borderRadius="xl"
                    textAlign="center"
                    border="2px dashed"
                    borderColor="orange.400"
                    maxW="400px"
                    backdropFilter="blur(8px)"
                >
                    <Text fontSize="2xl" mb={2}>🎭</Text>
                    <Text fontSize="lg" fontWeight="bold" mb={3} color="orange.400">
                        No Tokens on the Map
                    </Text>
                    <Text fontSize="sm" mb={4} color="gray.300">
                        Drag and drop an image file onto the center of the map to add your character token.
                    </Text>
                    <Text fontSize="xs" color="gray.500">
                        💡 Drop in center for tokens, drop near edges for background images
                    </Text>
                </Box>
            )}

            {/* Selected Token Name Display */}
            {gameState.selectedToken && (
                <Box
                    position="fixed"
                    bottom={4}
                    left="50%"
                    transform="translateX(-50%)"
                    zIndex={1000}
                    bg="rgba(0, 0, 0, 0.8)"
                    color="white"
                    px={4}
                    py={2}
                    borderRadius="lg"
                    textAlign="center"
                    border="2px solid"
                    borderColor="orange.400"
                    backdropFilter="blur(8px)"
                    boxShadow="0 4px 12px rgba(0,0,0,0.3)"
                >
                    <HStack spacing={2}>
                        <Text fontSize="sm" color="orange.400" fontWeight="semibold">
                            Selected:
                        </Text>
                        <Text fontSize="sm" fontWeight="medium">
                            {gameState.selectedToken.name || 'Unnamed Token'}
                        </Text>
                    </HStack>
                </Box>
            )}

            {/* Token Name Editing Modal */}
            {editingToken && (
                <Box
                    position="fixed"
                    top="50%"
                    left="50%"
                    transform="translate(-50%, -50%)"
                    zIndex={1002}
                    bg="gray.800"
                    color="white"
                    p={6}
                    borderRadius="lg"
                    border="2px solid"
                    borderColor="orange.400"
                    boxShadow="0 10px 25px rgba(0,0,0,0.5)"
                    minW="300px"
                >
                    <Text fontSize="lg" fontWeight="bold" mb={4} color="orange.400">
                        Edit Token Name
                    </Text>
                    <VStack spacing={4}>
                        <Input
                            value={editingName}
                            onChange={(e) => setEditingName(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    saveTokenName(editingToken);
                                } else if (e.key === 'Escape') {
                                    cancelEditingTokenName();
                                }
                            }}
                            placeholder="Enter token name"
                            bg="gray.700"
                            color="white"
                            border="1px solid"
                            borderColor="gray.600"
                            _focus={{ borderColor: 'orange.400', boxShadow: 'none' }}
                            autoFocus
                        />
                        <HStack spacing={3} w="100%">
                            <Button
                                colorScheme="orange"
                                onClick={() => saveTokenName(editingToken)}
                                flex={1}
                            >
                                Save
                            </Button>
                            <Button
                                variant="outline"
                                onClick={cancelEditingTokenName}
                                flex={1}
                            >
                                Cancel
                            </Button>
                        </HStack>
                    </VStack>
                </Box>
            )}

            {/* Modal backdrop */}
            {editingToken && (
                <Box
                    position="fixed"
                    top={0}
                    left={0}
                    w="100%"
                    h="100%"
                    bg="rgba(0, 0, 0, 0.5)"
                    zIndex={1001}
                    onClick={cancelEditingTokenName}
                />
            )}

            {/* Side Drawer */}
            <Drawer isOpen={isOpen} placement="left" onClose={onClose} size="md">
                <DrawerOverlay />
                <DrawerContent bg="gray.800" color="white">
                    <DrawerCloseButton color="white" />
                    <DrawerHeader borderBottomWidth="1px" borderBottomColor="gray.600">
                        <Text fontSize="xl" fontWeight="bold" color="orange.400">
                            Game Menu
                        </Text>
                    </DrawerHeader>
                    
                    <DrawerBody>
                        <VStack spacing={6} align="stretch">
                            {/* Back to Main Button */}
                            <Button
                                leftIcon={<IoArrowBack />}
                                onClick={handleBackToMain}
                                colorScheme="orange"
                                variant="outline"
                                size="lg"
                                w="full"
                            >
                                Back to Campaigns
                            </Button>

                            {/* Campaign Info */}
                            <Box>
                                <Text fontSize="lg" fontWeight="semibold" mb={2} color="gray.200">
                                    Current Campaign
                                </Text>
                                <Card bg="gray.700" borderColor="gray.600">
                                    <CardBody>
                                        <Text color="white" fontWeight="medium">
                                            {campaign?.name || 'Loading...'}
                                        </Text>
                                        <Text color="gray.400" fontSize="sm" mt={1}>
                                            {campaign?.description || 'No description'}
                                        </Text>
                                    </CardBody>
                                </Card>
                            </Box>

                            {/* Map Management Section - GM Only */}
                            {isGM && (
                                <Box>
                                    <HStack 
                                        spacing={2} 
                                        mb={3} 
                                        cursor="pointer" 
                                        onClick={() => setIsMapSectionCollapsed(!isMapSectionCollapsed)}
                                        _hover={{ color: 'orange.400' }}
                                        transition="color 0.2s"
                                    >
                                        <Text fontSize="lg" fontWeight="semibold" color="gray.200">
                                            Map Management
                                        </Text>
                                        <IconButton
                                            icon={isMapSectionCollapsed ? <IoChevronDown /> : <IoChevronUp />}
                                            size="xs"
                                            variant="ghost"
                                            color="gray.400"
                                            aria-label={isMapSectionCollapsed ? "Expand map management" : "Collapse map management"}
                                            _hover={{ color: 'orange.400' }}
                                        />
                                    </HStack>
                                    {!isMapSectionCollapsed && (
                                        <VStack spacing={3} align="stretch">
                                        {/* Current Active Map */}
                                        {currentMap && (
                                            <Card bg="gray.700" borderColor="orange.400" borderWidth="2px">
                                                <CardBody>
                                                    <HStack spacing={3}>
                                                        <Box flex={1}>
                                                            <Text color="orange.400" fontWeight="bold" fontSize="sm">
                                                                ACTIVE MAP
                                                            </Text>
                                                            <Text color="white" fontWeight="medium">
                                                                {currentMap.name}
                                                            </Text>
                                                            <Text color="gray.400" fontSize="sm">
                                                                {currentMap.gridWidth}x{currentMap.gridHeight} grid
                                                            </Text>
                                                        </Box>
                                                    </HStack>
                                                </CardBody>
                                            </Card>
                                        )}

                                        {/* Available Maps */}
                                        {campaignMaps.length > 0 && (
                                            <Box>
                                                <Text fontSize="sm" fontWeight="semibold" mb={2} color="gray.300">
                                                    Switch to Map:
                                                </Text>
                                                <VStack spacing={2} align="stretch">
                                                    {campaignMaps
                                                        .filter(map => map._id !== currentMap?._id)
                                                        .map((map) => (
                                                        <Card key={map._id} bg="gray.700" borderColor="gray.600">
                                                            <CardBody py={3}>
                                                                <HStack spacing={3}>
                                                                    <Box flex={1}>
                                                                        <Text color="white" fontWeight="medium" fontSize="sm">
                                                                            {map.name}
                                                                        </Text>
                                                                        <Text color="gray.400" fontSize="xs">
                                                                            {map.gridWidth}x{map.gridHeight} grid
                                                                        </Text>
                                                                    </Box>
                                                                    <Button
                                                                        size="xs"
                                                                        colorScheme="orange"
                                                                        variant="outline"
                                                                        onClick={() => handleSwitchMap(map._id)}
                                                                    >
                                                                        Switch
                                                                    </Button>
                                                                </HStack>
                                                            </CardBody>
                                                        </Card>
                                                    ))}
                                                </VStack>
                                            </Box>
                                        )}

                                        {/* Create New Map */}
                                        <Box>
                                            {!isCreatingMap ? (
                                                <Button
                                                    colorScheme="orange"
                                                    variant="outline"
                                                    size="sm"
                                                    w="full"
                                                    onClick={() => setIsCreatingMap(true)}
                                                >
                                                    + Create New Map
                                                </Button>
                                            ) : (
                                                <VStack spacing={2}>
                                                    <Input
                                                        value={newMapName}
                                                        onChange={(e) => setNewMapName(e.target.value)}
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter') {
                                                                handleCreateMap();
                                                            } else if (e.key === 'Escape') {
                                                                setIsCreatingMap(false);
                                                                setNewMapName('');
                                                            }
                                                        }}
                                                        placeholder="Enter map name"
                                                        size="sm"
                                                        bg="gray.600"
                                                        color="white"
                                                        border="1px solid"
                                                        borderColor="orange.400"
                                                        _focus={{ borderColor: 'orange.500', boxShadow: 'none' }}
                                                        autoFocus
                                                    />
                                                    <HStack spacing={2} w="100%">
                                                        <Button
                                                            size="xs"
                                                            colorScheme="orange"
                                                            onClick={handleCreateMap}
                                                            flex={1}
                                                        >
                                                            Create
                                                        </Button>
                                                        <Button
                                                            size="xs"
                                                            variant="ghost"
                                                            onClick={() => {
                                                                setIsCreatingMap(false);
                                                                setNewMapName('');
                                                            }}
                                                            flex={1}
                                                        >
                                                            Cancel
                                                        </Button>
                                                    </HStack>
                                                </VStack>
                                            )}
                                        </Box>
                                        </VStack>
                                    )}
                                </Box>
                            )}

                            {/* Grid Settings Section - GM Only */}
                            {isGM && (
                                <Box>
                                    <HStack 
                                        spacing={2} 
                                        mb={3} 
                                        cursor="pointer" 
                                        onClick={() => setIsGridSectionCollapsed(!isGridSectionCollapsed)}
                                        _hover={{ color: 'orange.400' }}
                                        transition="color 0.2s"
                                    >
                                        <Text fontSize="lg" fontWeight="semibold" color="gray.200">
                                            Grid Settings
                                        </Text>
                                        <IconButton
                                            icon={isGridSectionCollapsed ? <IoChevronDown /> : <IoChevronUp />}
                                            size="xs"
                                            variant="ghost"
                                            color="gray.400"
                                            aria-label={isGridSectionCollapsed ? "Expand grid settings" : "Collapse grid settings"}
                                            _hover={{ color: 'orange.400' }}
                                        />
                                    </HStack>
                                    {!isGridSectionCollapsed && (
                                        <VStack spacing={4} align="stretch">
                                            <Card bg="gray.700" borderColor="gray.600">
                                                <CardBody>
                                                    <VStack spacing={4} align="stretch">
                                                        {/* Grid Dimensions */}
                                                        <Box>
                                                            <Text fontSize="sm" fontWeight="semibold" mb={3} color="gray.300">
                                                                Map Dimensions (Grid Squares)
                                                            </Text>
                                                            <HStack spacing={4}>
                                                                <FormControl>
                                                                    <FormLabel fontSize="xs" color="gray.400">Width</FormLabel>
                                                                    <NumberInput
                                                                        value={gridSettings.gridWidth}
                                                                        onChange={(value) => {
                                                                            const newSettings = { ...gridSettings, gridWidth: parseInt(value) || 1 };
                                                                            handleGridSettingsUpdate(newSettings);
                                                                        }}
                                                                        min={1}
                                                                        max={100}
                                                                        size="sm"
                                                                        bg="gray.600"
                                                                    >
                                                                        <NumberInputField 
                                                                            color="white"
                                                                            border="1px solid"
                                                                            borderColor="gray.500"
                                                                            _focus={{ borderColor: 'orange.400', boxShadow: 'none' }}
                                                                        />
                                                                        <NumberInputStepper>
                                                                            <NumberIncrementStepper color="gray.400" />
                                                                            <NumberDecrementStepper color="gray.400" />
                                                                        </NumberInputStepper>
                                                                    </NumberInput>
                                                                </FormControl>
                                                                <FormControl>
                                                                    <FormLabel fontSize="xs" color="gray.400">Height</FormLabel>
                                                                    <NumberInput
                                                                        value={gridSettings.gridHeight}
                                                                        onChange={(value) => {
                                                                            const newSettings = { ...gridSettings, gridHeight: parseInt(value) || 1 };
                                                                            handleGridSettingsUpdate(newSettings);
                                                                        }}
                                                                        min={1}
                                                                        max={100}
                                                                        size="sm"
                                                                        bg="gray.600"
                                                                    >
                                                                        <NumberInputField 
                                                                            color="white"
                                                                            border="1px solid"
                                                                            borderColor="gray.500"
                                                                            _focus={{ borderColor: 'orange.400', boxShadow: 'none' }}
                                                                        />
                                                                        <NumberInputStepper>
                                                                            <NumberIncrementStepper color="gray.400" />
                                                                            <NumberDecrementStepper color="gray.400" />
                                                                        </NumberInputStepper>
                                                                    </NumberInput>
                                                                </FormControl>
                                                            </HStack>
                                                        </Box>

                                                        {/* Grid Square Size */}
                                                        <Box>
                                                            <Text fontSize="sm" fontWeight="semibold" mb={3} color="gray.300">
                                                                Grid Square Size (Pixels)
                                                            </Text>
                                                            <NumberInput
                                                                value={gridSettings.gridSize}
                                                                onChange={(value) => {
                                                                    const newSettings = { ...gridSettings, gridSize: parseInt(value) || 10 };
                                                                    handleGridSettingsUpdate(newSettings);
                                                                }}
                                                                min={10}
                                                                max={200}
                                                                size="sm"
                                                                bg="gray.600"
                                                            >
                                                                <NumberInputField 
                                                                    color="white"
                                                                    border="1px solid"
                                                                    borderColor="gray.500"
                                                                    _focus={{ borderColor: 'orange.400', boxShadow: 'none' }}
                                                                />
                                                                <NumberInputStepper>
                                                                    <NumberIncrementStepper color="gray.400" />
                                                                    <NumberDecrementStepper color="gray.400" />
                                                                </NumberInputStepper>
                                                            </NumberInput>
                                                        </Box>

                                                        {/* Grid Visibility */}
                                                        <Box>
                                                            <HStack spacing={3}>
                                                                <Text fontSize="sm" fontWeight="semibold" color="gray.300">
                                                                    Show Grid Lines
                                                                </Text>
                                                                <Switch
                                                                    isChecked={gridSettings.visible}
                                                                    onChange={(e) => {
                                                                        const newSettings = { ...gridSettings, visible: e.target.checked };
                                                                        handleGridSettingsUpdate(newSettings);
                                                                    }}
                                                                    colorScheme="orange"
                                                                    size="sm"
                                                                />
                                                            </HStack>
                                                        </Box>

                                                        {/* Current Map Size Info */}
                                                        <Box bg="gray.600" p={3} borderRadius="md">
                                                            <Text fontSize="xs" color="gray.400" mb={1}>
                                                                Current Map Size:
                                                            </Text>
                                                            <Text fontSize="sm" color="white">
                                                                {gridSettings.gridWidth * gridSettings.gridSize} × {gridSettings.gridHeight * gridSettings.gridSize} pixels
                                                            </Text>
                                                            <Text fontSize="xs" color="gray.400">
                                                                ({gridSettings.gridWidth} × {gridSettings.gridHeight} grid squares @ {gridSettings.gridSize}px each)
                                                            </Text>
                                                        </Box>
                                                    </VStack>
                                                </CardBody>
                                            </Card>
                                        </VStack>
                                    )}
                                </Box>
                            )}

                            {/* User Characters Section */}
                            <Box>
                                <HStack 
                                    spacing={2} 
                                    mb={3} 
                                    cursor="pointer" 
                                    onClick={() => setIsCharacterSectionCollapsed(!isCharacterSectionCollapsed)}
                                    _hover={{ color: 'orange.400' }}
                                    transition="color 0.2s"
                                >
                                    <Text fontSize="lg" fontWeight="semibold" color="gray.200">
                                        Your Characters
                                    </Text>
                                    <IconButton
                                        icon={isCharacterSectionCollapsed ? <IoChevronDown /> : <IoChevronUp />}
                                        size="xs"
                                        variant="ghost"
                                        color="gray.400"
                                        aria-label={isCharacterSectionCollapsed ? "Expand characters" : "Collapse characters"}
                                        _hover={{ color: 'orange.400' }}
                                    />
                                </HStack>
                                {!isCharacterSectionCollapsed && (
                                    <VStack spacing={3} align="stretch">
                                    {userCharacters.length > 0 ? (
                                        userCharacters.map((character, index) => (
                                            <Card key={character.id || index} bg="gray.700" borderColor="gray.600">
                                                <CardBody>
                                                    <HStack spacing={3}>
                                                        <Avatar
                                                            size="md"
                                                            src={character.image?.src}
                                                            bg="orange.400"
                                                            color="white"
                                                            name={character.name || `Character ${index + 1}`}
                                                        />
                                                        <Box flex={1}>
                                                            {editingToken === character.id ? (
                                                                <HStack spacing={2}>
                                                                    <Input
                                                                        value={editingName}
                                                                        onChange={(e) => setEditingName(e.target.value)}
                                                                        onKeyDown={(e) => {
                                                                            if (e.key === 'Enter') {
                                                                                saveTokenName(character.id);
                                                                            } else if (e.key === 'Escape') {
                                                                                cancelEditingTokenName();
                                                                            }
                                                                        }}
                                                                        size="sm"
                                                                        bg="gray.600"
                                                                        color="white"
                                                                        border="1px solid"
                                                                        borderColor="orange.400"
                                                                        _focus={{ borderColor: 'orange.500', boxShadow: 'none' }}
                                                                        autoFocus
                                                                    />
                                                                    <Button
                                                                        size="xs"
                                                                        colorScheme="orange"
                                                                        onClick={() => saveTokenName(character.id)}
                                                                    >
                                                                        Save
                                                                    </Button>
                                                                    <Button
                                                                        size="xs"
                                                                        variant="ghost"
                                                                        onClick={cancelEditingTokenName}
                                                                    >
                                                                        Cancel
                                                                    </Button>
                                                                </HStack>
                                                            ) : (
                                                                <Text 
                                                                    color="white" 
                                                                    fontWeight="medium"
                                                                    cursor="pointer"
                                                                    _hover={{ color: 'orange.400' }}
                                                                    onClick={() => startEditingTokenName(character)}
                                                                    title="Click to edit name"
                                                                >
                                                                    {character.name || `Character ${index + 1}`}
                                                                </Text>
                                                            )}
                                                            <Text color="gray.400" fontSize="sm">
                                                                Position: ({Math.round(character.x / gridSettings.gridSize)}, {Math.round(character.y / gridSettings.gridSize)})
                                                            </Text>
                                                        </Box>
                                                    </HStack>
                                                </CardBody>
                                            </Card>
                                        ))
                                    ) : (
                                        <Card bg="gray.700" borderColor="orange.400" borderWidth="2px" borderStyle="dashed">
                                            <CardBody py={6}>
                                                <VStack spacing={3}>
                                                    <Text fontSize="3xl" color="orange.400">
                                                        🎭
                                                    </Text>
                                                    <Text color="orange.400" fontWeight="bold" textAlign="center">
                                                        No Characters Yet
                                                    </Text>
                                                    <Text color="gray.300" fontSize="sm" textAlign="center" lineHeight="1.5">
                                                        Add your character to the map by dragging an image file from your computer onto the center area of the game canvas
                                                    </Text>
                                                    <Box bg="gray.600" px={3} py={2} borderRadius="md" w="full">
                                                        <Text color="gray.200" fontSize="xs" fontWeight="medium" mb={1}>
                                                            Quick Tips:
                                                        </Text>
                                                        <Text color="gray.400" fontSize="xs" mb={1}>
                                                            • Drop in center area → Character token
                                                        </Text>
                                                        <Text color="gray.400" fontSize="xs" mb={1}>
                                                            • Drop near edges → Background image
                                                        </Text>
                                                        <Text color="gray.400" fontSize="xs">
                                                            • Supports JPG, PNG, and GIF files
                                                        </Text>
                                                    </Box>
                                                </VStack>
                                            </CardBody>
                                        </Card>
                                    )}
                                    </VStack>
                                )}
                            </Box>


                            {/* Zoom Controls & Status */}
                            <Box>
                                <Text fontSize="sm" color="gray.400" mb={2}>
                                    Zoom Level: {Math.round(viewport.zoom * 100)}%
                                </Text>
                                <HStack spacing={2}>
                                    <Button
                                        size="sm"
                                        onClick={() => setViewport(prev => ({ ...prev, zoom: Math.max(prev.minZoom, prev.zoom * 0.8) }))}
                                        disabled={viewport.zoom <= viewport.minZoom}
                                        variant="outline"
                                        colorScheme="orange"
                                    >
                                        Zoom Out
                                    </Button>
                                    <Button
                                        size="sm"
                                        onClick={() => setViewport({ zoom: 1, offsetX: 0, offsetY: 0, minZoom: 0.25, maxZoom: 4 })}
                                        variant="outline"
                                        colorScheme="orange"
                                    >
                                        Reset
                                    </Button>
                                    <Button
                                        size="sm"
                                        onClick={() => setViewport(prev => ({ ...prev, zoom: Math.min(prev.maxZoom, prev.zoom * 1.25) }))}
                                        disabled={viewport.zoom >= viewport.maxZoom}
                                        variant="outline"
                                        colorScheme="orange"
                                    >
                                        Zoom In
                                    </Button>
                                </HStack>
                            </Box>

                            {/* Connection Status */}
                            <Box>
                                <Text fontSize="sm" color="gray.400">
                                    Connection Status: 
                                    <Text as="span" color={isConnected ? 'green.400' : 'red.400'} ml={2}>
                                        {isConnected ? 'Connected' : 'Disconnected'}
                                    </Text>
                                </Text>
                            </Box>
                        </VStack>
                    </DrawerBody>
                </DrawerContent>
            </Drawer>
        </Box>
    );
};

export default Play;