import {React, useState, useEffect, useRef} from 'react';
import {useAuth} from '../providers/AuthProvider';
import { Flex, Box, Slider, SliderTrack, SliderFilledTrack, SliderThumb, SliderMark} from '@chakra-ui/react'
import { socket } from '../socket';
import { Events } from './Events';

import Canvas from './Canvas';
import './Play.css';


// Load an image file from a directory and convert it to an ImageBitmap
const loadImage = async (src) => {
    const img = new Image();
    img.src = src;
    await img.decode();
    const bitmap = await createImageBitmap(img);
    return bitmap;
}

const tokenImage = loadImage("token_1.png");

const initTokens = [
    {
        "name": "Player 1",
        "tokenId": 1,
        "locX": 0,
        "locY": 0,
        "width": 40,
        "isPlayer": true,
        "img": await tokenImage,
        "usedBy": ["659f074235616095a27f191f", "65b850312c27c48f56ae97a5"]
    }
]

const initCampaign = {
    "name": "Test Campaign",
    "id": "12345",
    maps: [
        {
            "name": "Test Map",
            "gridSize": 40,
            "gridWidth": 20,
            "gridHeight": 20,
            "tokens": initTokens, 
            "bgImage": "test_map.png"
        }
    ]

}
//console.debug(initTokens);

const Play = (props) => {
    const {user} = useAuth();
    const [tokens, setTokens] = useState(initTokens);
    const [zoomLevel, setZoomLevel] = useState(1);
    const [gridSize, setGridSize] = useState(40);
    const [gridWidth, setGridWidth] = useState(20);
    const [gridHeight, setGridHeight] = useState(20);
    const [offsets, setOffsets] = useState({x: 0, y: 0})
    const [isDragging, setIsDragging] = useState(null);
    const [dragStart, setDragStart] = useState({x: 0, y: 0});
    let selectedToken = useRef(null);
    const [layer, setLayer] = useState(1);

    
    // Socket.io State
    const [isConnected, setIsConnected] = useState(socket.connected);
    const [tokenMoveEvents, setTokenMoveEvents] = useState([]);


    const gridRef = useRef(null);
    const tokenRef = useRef(null);
    let originRef = useRef(null);

    // We're going to need a few things here:
    //      - Token array:
    //          - isPlayer: bool
    //          - tokenId
    //          - LocX
    //          - LocY


    const drawGrid = ctx => {
        const scaledGridSize = gridSize * zoomLevel;
        ctx.width = scaledGridSize * gridWidth;
        ctx.height = scaledGridSize * gridHeight;
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        ctx.fillStyle = 'gray';
        ctx.lineColor = 'white';
        for (let i = 0; i < gridWidth; i++) {
            ctx.moveTo(i * scaledGridSize, 0);
            ctx.lineTo(i * scaledGridSize, scaledGridSize * gridHeight);
            ctx.stroke();
        }
        for (let i = 0; i < gridHeight; i++) {
            ctx.moveTo(0, i * scaledGridSize);
            ctx.lineTo(scaledGridSize * gridWidth, i * scaledGridSize );
            ctx.stroke();
        }
    }
    const getOffset = (el) => {
        const rect = el.getBoundingClientRect();
        setOffsets({x: rect.left + window.scrollX, y: rect.top + window.scrollY});
        return {
            left: rect.left + window.scrollX,
            top: rect.top + window.scrollY
        };
    }

    const drawTokens = ctx => {
        const scaledGridSize = gridSize * zoomLevel;
        ctx.width = scaledGridSize * gridWidth;
        ctx.height = scaledGridSize * gridHeight;
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        for (let i = 0; i < tokens.length; i++) {
            ctx.drawImage(tokens[i].img, tokens[i].locX * zoomLevel, tokens[i].locY * zoomLevel, tokens[i].width * zoomLevel, tokens[i].width * zoomLevel);
        }
    }

    // add a function to detect if the mouse position is over a player token
    const isOverToken = (x, y) => {
        let tokenXmax = 0;
        let tokenXmin = 0;
        let tokenYmax = 0;
        let tokenYmin = 0;

        for (let i = 0; i < tokens.length; i++) {
            tokenXmin = tokens[i].locX * zoomLevel + offsets.x;
            tokenXmax = tokenXmin + tokens[i].width * zoomLevel + offsets.x;
            tokenYmin = tokens[i].locY * zoomLevel + offsets.y;
            tokenYmax = tokenYmin + tokens[i].width * zoomLevel + offsets.y;
            if (x > tokenXmin && x < tokenXmax && y > tokenYmin && y < tokenYmax) {
                selectedToken.current = i;
                return true;
            }
        }
        return false;
    }

    const findSnapPoint = (x, y) => {
        // Find the nearest grid crossing to the x, y coordinates given
        // First get the nearest x coordinate
        const scaledGridSize = gridSize * zoomLevel;
        const nearestX = gridSize * Math.floor((x - offsets.x)/scaledGridSize) ;
        const nearestY = gridSize * Math.floor((y - offsets.y)/scaledGridSize) ;

        return {x: nearestX, y: nearestY}
    }

    const updateTokenPositionRelative = (dx, dy, index) => {
        const nextToken = tokens.map((token, i) => {
            if (i === index) {
                return {...token, locX: token.locX + dx, locY: token.locY + dy};
            }
            return token;
        })
        setTokens(nextToken);
    }
    const updateTokenPositionAbsolute = (x, y, index, external) => {
        const nextToken = tokens.map((token, i) => {
            if (i === index) {
                return {...token, locX: x, locY: y};
            }
            return token;
        })
        setTokens(nextToken);
        if (isConnected && !external) {
            console.log("Emitting tokenMove");
            socket.emit('tokenMove', {x: x, y: y, tokenId: index, campaignId: initCampaign.id, playerId: user.user.id});
        }
    }

    const tokenSelectCheck = (x, y) => {
        if (Math.abs(x-originRef.current.x) < 3 && Math.abs(y-originRef.current.y) < 3) {
            return true;
        } else {
            return false;
        }
    }

    const mouseDownHandler = (e) => {
        // Prevent default
        e.preventDefault();
        //console.debug(e);
        if (isOverToken(e.pageX, e.pageY) && !isDragging) {
            // Check if the user can move this token
            console.log("Checking token for ownership " + selectedToken.current);
            initTokens[selectedToken.current].usedBy.forEach((playerID) => {
                if (playerID === user.user.id) {
                    console.log("You can move this.");
                    setDragStart({x: e.pageX, y: e.pageY});
                    originRef.current = {x: e.pageX, y: e.pageY};
                    setIsDragging(true);
                    return;
                } else {
                }
            })
            
        }
    }
    const mouseMoveHandler = (e) => {
        // Prevent default
        e.preventDefault();
        if  (!isDragging) {
            return;
        }
        if (isDragging) {
            const dx = (e.pageX - dragStart.x) / zoomLevel;
            const dy = (e.pageY - dragStart.y) / zoomLevel;
            updateTokenPositionRelative(dx, dy, selectedToken.current);
            setDragStart({x: e.pageX, y: e.pageY});
        }
    }

    const mouseUpHandler = (e) => {
        // Prevent default
        e.preventDefault();
        //console.debug(e);
        // Check to see if the move was just a token select.
        if (isDragging && !tokenSelectCheck(e.pageX, e.pageY)) {
            setIsDragging(false);
            const newPos = findSnapPoint(e.pageX, e.pageY);
            updateTokenPositionAbsolute(newPos.x, newPos.y, selectedToken.current, false);
        } else if (isDragging && tokenSelectCheck(e.pageX, e.pageY)) {
            // TODO: Create token select function to mark token as selected and draw the token select graphics around it.
            console.log("Token just selected");
            setIsDragging(false);
        }
    }

    useEffect(() => {
        getOffset(gridRef.current);
        //console.debug(offsets);
    }, []);


    useEffect(() => {
        function onConnect() {
            setIsConnected(true);
        }
        function onDisconnect() {
            setIsConnected(false);
        }
        function tokenMoveEvents(value) {
            setTokenMoveEvents(tokenMoveEvents.concat(value));
        }

        socket.on('connect', onConnect);
        socket.on('disconnect', onDisconnect);
        socket.on('tokenMove', (data) => {
            console.log("Token Move Recieved by the Server");
            console.log("Token move for campaign: " + data.campaignId + " and token: " + data.tokenId + " and x: " + data.x + " and y: " + data.y + "and player: " + data.playerId);
        
            updateTokenPositionAbsolute(data.x, data.y, data.tokenId, true);
        });
        // Connect manually to the socket server.
        socket.connect();
        // Change the room to the campaign room.
        socket.emit('joinCampaign', initCampaign.id);
        return () => {
            socket.off('connect', onConnect);
            socket.off('disconnect', onDisconnect);
        };

    }, []);

    const labelStyles = {
        mt: '2',
        ml: '-2.5',
        fontSize: 'sm',
    }

    return (
        <Box >
            <Box p={4}>
                Zoom Level
                <Slider aria-label='slider-ex-2' colorScheme='orange' defaultValue={1} max={4} min={0} step={0.5} onChange={(v) => setZoomLevel(v)}>
                    <SliderMark value={0.5} {...labelStyles}>0.5x</SliderMark>
                    <SliderMark value={1} {...labelStyles}>1x</SliderMark>
                    <SliderMark value={1.5} {...labelStyles}>1.5x</SliderMark>
                    <SliderMark value={2} {...labelStyles}>2x</SliderMark>
                    <SliderTrack>
                        <SliderFilledTrack />
                    </SliderTrack>
                    <SliderThumb />
                </Slider>
            </Box>
            <Box p={4}>
                Layer
                <Slider aria-label='slider-ex-2' colorScheme='orange' defaultValue={"1"} max={2} min={0} step={1} onChange={(v) => setLayer(v)}>
                    <SliderMark value={0} {...labelStyles}>Background</SliderMark>
                    <SliderMark value={1} {...labelStyles}>Token</SliderMark>
                    <SliderMark value={2} {...labelStyles}>GM</SliderMark>
                    <SliderTrack>
                        <SliderFilledTrack />
                    </SliderTrack>
                    <SliderThumb />
                </Slider>
            </Box>
            
            Play the game
            <Box className='mapwrapper'>
                <Canvas id="bgCanvas"
                    forwardedRef={gridRef}
                    draw={drawGrid} width={gridSize * gridWidth * zoomLevel} 
                    height={gridHeight * gridSize * zoomLevel}
                />
                <Canvas id="gridCanvas" 
                    forwardedRef={gridRef}
                    draw={drawGrid} 
                    width={gridSize * gridWidth * zoomLevel} height={gridHeight * gridSize * zoomLevel}
                />
                <Canvas id="tokenCanvas" 
                    forwardedRef={tokenRef} 
                    draw={drawTokens} width={gridSize * gridWidth * zoomLevel} 
                    height={gridHeight * gridSize * zoomLevel}
                    onMouseDown={mouseDownHandler}
                    onMouseMove={mouseMoveHandler}
                    onMouseUp={mouseUpHandler}
                />
            </Box>
            
            
        </Box>
    )
}

export default Play;