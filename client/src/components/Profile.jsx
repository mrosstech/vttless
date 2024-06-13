import {React} from 'react';
import axios from 'axios';
import {useAuth} from '../providers/AuthProvider';

const Profile = () => {
    const {user} = useAuth();
    return (
        <div>Profile</div>
    );
}

export default Profile;