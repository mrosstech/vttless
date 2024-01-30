import { BrowserRouter, Route, Routes, Navigate } from 'react-router-dom';
import { useEffect, useState } from "react";
import MapDisplay from './components/MapDisplay/MapDisplay';
import Home from './components/Home/Home';
import Login from "./components/Login/Login";
import Logout from "./components/Logout/Logout";
import Navbar from "./components/Navbar/Navbar";
import Signup from "./components/Signup/Signup";
import { AuthProvider } from "./hooks/auth";
import { CookiesProvider, useCookies } from 'react-cookie';
import axios from "axios";
import "./App.css";

const App = () => {
  // Create a variable that can be used to set the presence of a user to true or false.
  // Not sure what this impacts right now.
  const [user, setUser] = useState(null);
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
            console.log(res);
            if (res?.data.user.username) {
                const role = res?.data.user.roles[0].name;
                setUser({username: res?.data.user.username, role: role, token: res?.data.token });
            } else {
                console.log("incorrect submission");
                setError(res.message);
            }
        });
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
        </Routes>
      </div>
    </BrowserRouter>
    
  );
}

export default App;
