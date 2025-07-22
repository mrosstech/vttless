import { createContext, useContext, useEffect, useMemo, useState } from "react";
import AuthService from './AuthService';

const AuthContext = createContext();

const AuthProvider = ({ children }) => {
  // State to hold the user object
  const [user, setUser] = useState(AuthService.getCurrentUser());

  // console.log('Initial Authprovider user value: ');
  // console.log(user);

  useEffect(() => {
    if (user) {
      //axios.defaults.headers.common["Authorization"] = "Bearer " + token;
      //localStorage.setItem('token',token);
    } else {
      //delete axios.defaults.headers.common["Authorization"];
      localStorage.removeItem('token')
    }
  }, [user]);

  // Memoized value of the authentication context
  const contextValue = useMemo(
    () => ({
      user,
      setUser,
    }),
    [user]
  );

  // Provide the authentication context to the children components
  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};

export default AuthProvider;