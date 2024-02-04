import { BrowserRouter, Route, Routes, Navigate } from 'react-router-dom';
import { useEffect, useState } from "react";
import MapDisplay from './components/MapDisplay.jsx';
import Home from './components/Home.jsx';
import Login from "./components/Login.jsx";
import Logout from "./components/Logout.jsx";
import Navbar from "./components/Navbar.jsx";
import Signup from "./components/Signup.jsx";
import Friends from "./components/Friends";
import { AuthProvider } from "./hooks/auth";
import { CookiesProvider, useCookies } from 'react-cookie';
import {ChakraProvider} from '@chakra-ui/react';
import axios from "axios";
import "./App.css";
import theme from "./theme.js";

const App = () => {
  // Create a variable that can be used to set the presence of a user to true or false.
  // Not sure what this impacts right now.
  const [user, setUser] = useState(null);
  const [error, setError] = useState(null);
  //const backendURL = process.env.REACT_APP_BACKEND_BASE_URL;
 
  const API = axios.create({
    baseURL: process.env.REACT_APP_BACKEND_BASE_URL,
    headers: {
        'Content-Type': 'application/json'
    },
    withCredentials: true,
  });

  useEffect( () => {
    // Check to see if there is a valid jwt token
    
    if (!user) {
      // Check for valid jwt
      try {
        const res =  API.get("/auth/validate", {
        }).then((res) => {
            console.log('No user logged in, checking for jwt');
            if (res?.data.username) {
                const role = res?.data.roles[0].name;
                setUser({username: res?.data.username, role: role});
            } else {
                console.log("incorrect submission");
                setError(res.message);
            }
        }).catch((err) => {
          // Do nothing because there was no valid jwt
        } );
      } catch (err) {
          if (!err?.response) {
              setError("no server responded");
          } else {
              setError("user not logged in");
          }
      }



    }
  }, []);

  return (
    <ChakraProvider theme={theme}>
      <BrowserRouter>
        <div>
          <Navbar user={user} />
          <Routes>
            <Route path="/" element={<Home user={user} />} />
            <Route path="/login"
              element={user ? <Navigate to="/" /> : <Login setUser={setUser} />}
            />
            <Route path="/logout"
              element={user ? <Logout setUser={setUser} /> : <Navigate to="/" /> }
            />
            <Route path="/signup" element={user ? <Navigate to="/" /> : <Signup />} />
            <Route path="/friends" element={user ? <Friends user={user}/> : <Login />} />
          </Routes>
        </div>
      </BrowserRouter>
    </ChakraProvider>
    
  );
}

export default App;
