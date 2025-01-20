import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../providers/AuthProvider';
import { Box, useToast } from '@chakra-ui/react';
import { socket } from '../socket';
import axios from 'axios';
import './Play.css';
import axiosPrivate from '../utils/axiosPrivate';


const loadImage = async (src) => {
    const img = new Image();
    img.src = src;
    await img.decode();
    const bitmap = await createImageBitmap(img);
    return bitmap;
}

const Play = () => {
    const { campaignId } = useParams(); // Get the campaignId from URL parameters
    const { user } = useAuth();
    const toast = useToast();
    const canvasRef = useRef(null);
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
    const [isConnected, setIsConnected] = useState(socket.connected);
    const [background, setBackground] = useState({
        image: null,
        x: 0,
        y: 0,
        isDragging: false,
        dragStart: { x: 0, y: 0 }
    });


    // Load campaign and map data
    useEffect(() => {
        const loadCampaignData = async () => {
            try {
                const response = await axiosPrivate.get(`/campaigns/${campaignId}`);
                setCampaign(response.data);
                
                if (response.data.activeMap) {
                    const mapResponse = await axiosPrivate.get(`/maps/${response.data.activeMap}`);
                    setCurrentMap(mapResponse.data);
                    
                    // Initialize game state from map data
                    await initializeGameState(mapResponse.data);
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
        // Load background image if exists
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

        setGameState(prev => ({
            ...prev,
            tokens: loadedTokens,
            gridSize: mapData.gridSettings.size
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

    // Add drag and drop event handlers for background upload
    const handleDragOver = (e) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleDrop = async (e) => {
        e.preventDefault();
        e.stopPropagation();

        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith('image/')) {
            try {
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
            } catch (error) {
                toast({
                    title: "Failed to update background",
                    description: error.message,
                    status: "error"
                });
            }
        }
    };


    // Initialize canvas and load assets
    useEffect(() => {
        const loadAssets = async () => {
            const canvas = canvasRef.current;
            const ctx = canvas.getContext('2d');
            
            // Load token images
            //const tokenImage = await loadImage("token_1.png");
            
            // Initialize game state with loaded assets
            // setGameState(prev => ({
            //     ...prev,
            //     tokens: [{
            //         id: 1,
            //         x: 0,
            //         y: 0,
            //         width: 40,
            //         height: 40,
            //         image: tokenImage,
            //         ownerId: user.user.id
            //     }]
            // }));
        };

        loadAssets();
    }, []);

    // Socket.io event handlers
    useEffect(() => {
        const handleConnect = () => setIsConnected(true);
        const handleDisconnect = () => setIsConnected(false);
        
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

        socket.on('connect', handleConnect);
        socket.on('disconnect', handleDisconnect);
        socket.on('tokenMove', handleTokenMove);

        return () => {
            socket.off('connect', handleConnect);
            socket.off('disconnect', handleDisconnect);
            socket.off('tokenMove', handleTokenMove);
        };
    }, []);

    // Socket.io event handlers
    useEffect(() => {
        socket.emit('joinCampaign', campaignId);

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

        socket.on('tokenUpdate', handleTokenUpdate);
        socket.on('backgroundUpdate', handleBackgroundUpdate);

        return () => {
            socket.emit('leaveCampaign', campaignId);
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
        
        // Draw background if exists
        if (background.image) {
            ctx.save();
            ctx.globalAlpha = 0.5; // Optional: make grid visible through background
            ctx.drawImage(
                background.image,
                background.x,
                background.y,
                canvas.width,
                canvas.height
            );
            ctx.restore();
        }
        
        // Draw grid
        drawGrid(ctx);
        
        // Draw tokens
        gameState.tokens.forEach(token => {
            ctx.drawImage(
                token.image,
                token.x,
                token.y,
                token.width * gameState.scale,
                token.height * gameState.scale
            );
        });
    };

    // Mouse event handlers
    const handleMouseDown = (e) => {
        const { offsetX, offsetY } = e.nativeEvent;
        const clickedToken = findTokenAtPosition(offsetX, offsetY);
        
        if (clickedToken && clickedToken.ownerId === user.user.id) {
            setGameState(prev => ({
                ...prev,
                selectedToken: clickedToken,
                isDragging: true
            }));
        } else if (background.image) {
            // If clicking on background (no token selected)
            setBackground(prev => ({
                ...prev,
                isDragging: true,
                dragStart: { 
                    x: offsetX - prev.x, 
                    y: offsetY - prev.y 
                }
            }));
        }
    };

    const handleMouseMove = (e) => {
        const { offsetX, offsetY } = e.nativeEvent;

        if (gameState.isDragging && gameState.selectedToken) {
            // Handle token dragging (previous code)
            const snapToGrid = (coord) => Math.round(coord / gameState.gridSize) * gameState.gridSize;
            
            setGameState(prev => ({
                ...prev,
                tokens: prev.tokens.map(token =>
                    token.id === prev.selectedToken.id
                        ? { ...token, x: snapToGrid(offsetX), y: snapToGrid(offsetY) }
                        : token
                )
            }));

            socket.emit('tokenMove', {
                tokenId: gameState.selectedToken.id,
                x: snapToGrid(offsetX),
                y: snapToGrid(offsetY),
                playerId: user.user.id
            });
        } else if (background.isDragging) {
            // Handle background dragging
            setBackground(prev => ({
                ...prev,
                x: offsetX - prev.dragStart.x,
                y: offsetY - prev.dragStart.y
            }));

            // Optionally emit background position to other players
            socket.emit('backgroundMove', {
                x: offsetX - background.dragStart.x,
                y: offsetY - background.dragStart.y,
                playerId: user.user.id
            });
        }
    };

    const handleMouseUp = () => {
        setGameState(prev => ({
            ...prev,
            selectedToken: null,
            isDragging: false
        }));
        setBackground(prev => ({
            ...prev,
            isDragging: false
        }));
    };

    // Helper functions
    const findTokenAtPosition = (x, y) => {
        return gameState.tokens.find(token => {
            return x >= token.x &&
                   x <= token.x + token.width * gameState.scale &&
                   y >= token.y &&
                   y <= token.y + token.height * gameState.scale;
        });
    };

    const drawGrid = (ctx) => {
        ctx.strokeStyle = '#ccc';
        ctx.lineWidth = 0.5;

        for (let x = 0; x <= gameState.mapDimensions.width; x += gameState.gridSize) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, gameState.mapDimensions.height);
            ctx.stroke();
        }

        for (let y = 0; y <= gameState.mapDimensions.height; y += gameState.gridSize) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(gameState.mapDimensions.width, y);
            ctx.stroke();
        }
    };

    // Animation loop
    useEffect(() => {
        const animate = () => {
            renderGame();
            requestAnimationFrame(animate);
        };
        
        animate();
    }, [gameState]);

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

    return (
        <Box className="game-container">
            <canvas
                ref={canvasRef}
                width={gameState.mapDimensions.width}
                height={gameState.mapDimensions.height}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                style={{ 
                    border: '1px solid #ccc',
                    cursor: background.isDragging ? 'grabbing' : 'grab'
                }}
            />
        </Box>
    );
};

export default Play;