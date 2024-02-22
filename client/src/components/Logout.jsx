import {useAuth} from '../providers/AuthProvider';
import AuthService from '../providers/AuthService';

const Logout = () => {
    const {setUser} = useAuth();

    AuthService.logout();
    setUser(null);

    

    // TODO: Add some logic to remove the local cookie for the JWT.

}

export default Logout;