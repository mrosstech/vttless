import {React, useState, useEffect, useRef} from 'react';

import { Flex, Box, Slider, SliderTrack, SliderFilledTrack, SliderThumb} from '@chakra-ui/react'
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
        "img": await tokenImage
    }
]

console.log(initTokens);

const Play = (props) => {
    const [tokens, setTokens] = useState(initTokens);
    const [zoomLevel, setZoomLevel] = useState(1);
    const [gridSize, setGridSize] = useState(40);
    const [gridWidth, setGridWidth] = useState(20);
    const [gridHeight, setGridHeight] = useState(20);
    const [offsets, setOffsets] = useState({x: 0, y: 0})
    const [isDragging, setIsDragging] = useState(null);
    const [dragStart, setDragStart] = useState({x: 0, y: 0});
    const [selectedToken, setSelectedToken] = useState(null);

    const gridRef = useRef(null);
    const tokenRef = useRef(null);

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
            tokenXmin = tokens[i].locX * gridSize * zoomLevel;
            tokenXmax = tokenXmin + tokens[i].width * zoomLevel;
            tokenYmin = tokens[i].locY * gridSize * zoomLevel;
            tokenYmax = tokenYmin + tokens[i].width * zoomLevel;
            console.log(tokenXmin + " < " + x + " < " + tokenXmax); 
            if (x > tokenXmin && x < tokenXmax && y > tokenYmin && y > tokenYmax) {
                setSelectedToken(i);
                return true;
            }
        }
        return false;
    }

    const updateTokenPosition = (dx, dy, index) => {
        const nextToken = tokens.map((token, i) => {
            if (i === index) {
                return {...token, locX: token.locX + dx, locY: token.locY + dy};
            }
            return token;
        })
        setTokens(nextToken);
    }

    const mouseDownHandler = (e) => {
        // Prevent default
        e.preventDefault();
        console.log(e);
        if (isOverToken(e.clientX, e.clientY) && !isDragging) {
            console.log('over token');
            setDragStart({x: e.clientX, y: e.clientY});
            setIsDragging(true);
        }
    }
    const mouseMoveHandler = (e) => {
        // Prevent default
        e.preventDefault();
        if  (!isDragging) {
            return;
        }
        if (isDragging) {
            const dx = (e.clientX - dragStart.x) / zoomLevel;
            const dy = (e.clientY - dragStart.y) / zoomLevel;
            //console.log(dx, dy);
            updateTokenPosition(dx, dy, selectedToken);
            setDragStart({x: e.clientX, y: e.clientY});
        }
    }

    const mouseUpHandler = (e) => {
        // Prevent default
        e.preventDefault();
        console.log(e);
        if (isDragging) {
            setIsDragging(false);
        }
    }

    useEffect(() => {
        getOffset(gridRef.current);
        console.log(offsets);
    }, []);



    return (
        <Box >
            <Slider aria-label='slider-ex-2' colorScheme='orange' defaultValue={1} max={4} min={0} step={0.5} onChange={(v) => setZoomLevel(v)}>
                <SliderTrack>
                    <SliderFilledTrack />
                </SliderTrack>
                <SliderThumb />
            </Slider>
            Play the game
            <Box className='mapwrapper'>
                <Canvas id="tokenCanvas" forwardedRef={tokenRef} draw={drawTokens} width={gridSize * gridWidth * zoomLevel} height={gridHeight * gridSize * zoomLevel}/>
                <Canvas id="gridCanvas" 
                    forwardedRef={gridRef}
                    draw={drawGrid} 
                    width={gridSize * gridWidth * zoomLevel} height={gridHeight * gridSize * zoomLevel}
                    onMouseDown={mouseDownHandler}
                    onMouseMove={mouseMoveHandler}
                    onMouseUp={mouseUpHandler}
                />    
            </Box>
            
            
        </Box>
    )
}

export default Play;