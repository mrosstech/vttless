import {React, useEffect, useState} from 'react';
import axios from 'axios';
import { Card, CardHeader, CardBody, CardFooter, Heading, Flex, Box } from '@chakra-ui/react'
import {AddFriendsInput} from './AddFriendsInput';
import {FriendList} from './FriendList';

const Friends = ({user}) => {

    return (
        <Flex minWidth='max-content' alignItems='left' gap='1'>
            
            <Box>
                <FriendList user={user} />
            </Box>
            <Box>
                <AddFriendsInput />
            </Box>
            
        </Flex>
    )
}

export default Friends;