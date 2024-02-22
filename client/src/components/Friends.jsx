import {React, useState} from 'react';
import { Flex, Box, Text, Grid, GridItem, Button } from '@chakra-ui/react'
import {AddFriendsInput} from './AddFriendsInput';
import FriendList from './FriendList';

const Friends = ({user}) => {
    const [emails, setEmails] = useState();

    return (
        <Grid
            templateAreas={`"header header" "friendslist addfriend" "friendslist footer"`}
            gridTemplateRows={'50px 1fr 30px'}
            gridTemplateColumns={'400px 400px'}
            h='200px'
            gap='50'
            fontWeight='bold'
        >
            <GridItem pl='2' bg='black.500' area={'header'}>
                <Text>Friends</Text>
            </GridItem>
            <GridItem pl='2' bg='black.500' area={'friendslist'}>
                <FriendList user={user} />
            </GridItem>
            <GridItem pl='2' bg='black.500' area={'addfriend'}>
                <Text fontSize='2xl' fontFamily="mono">Add Friend</Text>
                <Text fontFamily="mono" fontWeight="light">Enter the e-mail of the friend you would like to add.
                Any friends who don't have an account will be asked to
                create one.</Text>
                <AddFriendsInput />
            </GridItem>
        
        </Grid>
        
    )
}

export default Friends;