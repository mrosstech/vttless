import {React} from 'react';
import { Box, VStack, Heading } from '@chakra-ui/react';
import axios from 'axios';
import {useAuth} from '../providers/AuthProvider';
import ProfilePhoto from './ProfilePhoto';


const Profile = () => {
    const {user} = useAuth();
    return (
        <Box maxW="container.md" mx="auto" pt={8}>
            <VStack spacing={8}>
                <Heading>Profile</Heading>
                <ProfilePhoto user={user} />
                {/* Add other profile information here */}
            </VStack>
        </Box>
    );
}

export default Profile;