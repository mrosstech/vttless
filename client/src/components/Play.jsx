import {React, useState} from 'react';

import { Flex, Box } from '@chakra-ui/react'
import Canvas from './Canvas';

const Play = (props) => {
    const [tokens, setTokens] = useState();
    

    // We're going to need a few things here:
    //      - Token array:
    //          - isPlayer: bool
    //          - tokenId
    //          - LocX
    //          - LocY
    return (
        <Box>
            Play the game
            <Canvas width={600} height={400}/>
        </Box>
    )
}

export default Play;