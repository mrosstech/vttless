import {React, useState} from 'react';

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
        "width": 1,
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

    const drawTokens = ctx => {
        const scaledGridSize = gridSize * zoomLevel;
        ctx.width = scaledGridSize * gridWidth;
        ctx.height = scaledGridSize * gridHeight;
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        for (let i = 0; i < tokens.length; i++) {
            ctx.drawImage(tokens[i].img, tokens[i].locX * scaledGridSize, tokens[i].locY * scaledGridSize, scaledGridSize, scaledGridSize);
        }
    }

    



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
                <Canvas id="tokenCanvas" draw={drawTokens} width={gridSize * gridWidth * zoomLevel} height={gridHeight * gridSize * zoomLevel}/>
                <Canvas id="gridCanvas" draw={drawGrid} width={gridSize * gridWidth * zoomLevel} height={gridHeight * gridSize * zoomLevel}/>    
            </Box>
            
            
        </Box>
    )
}

export default Play;