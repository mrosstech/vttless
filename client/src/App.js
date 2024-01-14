import { BrowserRouter, Route, Routes, Navigate } from 'react-router-dom';
import { useEffect, useState } from "react";
import MapDisplay from './components/MapDisplay/MapDisplay';
import Home from './components/Home/Home';
import Login from "./components/Login/Login";
import Navbar from "./components/Navbar/Navbar";
import Signup from "./components/Signup/Signup";
import { AuthProvider } from "./hooks/auth";

const App = () => {
  // Create a variable that can be used to set the presence of a user to true or false.
  // Not sure what this impacts right now.
  const [user, setUser] = useState(null);
  //const backendURL = process.env.REACT_APP_BACKEND_BASE_URL;

  useEffect( () => {
  }, []);

  return (
    <BrowserRouter>
      <div>
        <Navbar user={user} />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login"
            element={user ? <Navigate to="/" /> : <Login setUser={setUser} />}
          />
          <Route path="/signup" element={user ? <Navigate to="/" /> : <Signup />} />
        </Routes>
      </div>
    </BrowserRouter>
    
  );
}

export default App;
