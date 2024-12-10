import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../providers/AuthProvider';
import { Box } from '@chakra-ui/react';
import { socket } from '../socket';
import './Play.css';


const loadImage = async (src) => {
    const img = new Image();
    img.src = src;
    await img.decode();
    const bitmap = await createImageBitmap(img);
    return bitmap;
}

const Play2 = () => {
    const { user } = useAuth();
    const canvasRef = useRef(null);
    const [gameState, setGameState] = useState({
        tokens: [],
        selectedToken: null,
        isDragging: false,
        scale: 1,
        gridSize: 40,
        mapDimensions: { width: 800, height: 600 }
    });
    const [isConnected, setIsConnected] = useState(socket.connected);

    // Initialize canvas and load assets
    useEffect(() => {
        const loadAssets = async () => {
            const canvas = canvasRef.current;
            const ctx = canvas.getContext('2d');
            
            // Load token images
            const tokenImage = await loadImage("token_1.png");
            
            // Initialize game state with loaded assets
            setGameState(prev => ({
                ...prev,
                tokens: [{
                    id: 1,
                    x: 0,
                    y: 0,
                    width: 40,
                    height: 40,
                    image: tokenImage,
                    ownerId: user.user.id
                }]
            }));
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

    // Render game state
    const renderGame = () => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
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
        }
    };

    const handleMouseMove = (e) => {     
        if (!gameState.isDragging || !gameState.selectedToken) return;

        const { offsetX, offsetY } = e.nativeEvent;
        const snapToGrid = (coord) => Math.round(coord / gameState.gridSize) * gameState.gridSize;

        setGameState(prev => ({
            ...prev,
            tokens: prev.tokens.map(token =>
                token.id === prev.selectedToken.id
                    ? { ...token, x: snapToGrid(offsetX), y: snapToGrid(offsetY) }
                    : token
            )
        }));

        // Emit token move to other players
        socket.emit('tokenMove', {
            tokenId: gameState.selectedToken.id,
            x: snapToGrid(offsetX),
            y: snapToGrid(offsetY),
            playerId: user.user.id
        });
    };

    const handleMouseUp = () => {
        setGameState(prev => ({
            ...prev,
            selectedToken: null,
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
                style={{ border: '1px solid #ccc' }}
            />
        </Box>
    );
};

export default Play2;