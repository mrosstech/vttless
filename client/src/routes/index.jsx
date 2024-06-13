import { RouterProvider , createBrowserRouter } from "react-router-dom";
import { useAuth } from '../providers/AuthProvider';
import { ProtectedRoute } from './ProtectedRoute';
import Home from '../components/Home.jsx';
import Login from "../components/Login.jsx";
import Logout from "../components/Logout.jsx";
import Signup from "../components/Signup.jsx";
import Friends from "../components/Friends";
import Campaigns from "../components/Campaigns";
import NavBar from '../components/Navbar';
import Play from '../components/Play';
import Profile from '../components/Profile';

const Routes = () => {
    const { user } = useAuth();
    const routesForPublic = [
        {
            element: <NavBar />,
            children: [
                {
                    path: "/",
                    element: <Home />
                },
                {
                    path: "/login",
                    element: <Login />
                },
                {
                    path: "/signup",
                    element: <Signup />
                }
            ]
        }
       
    ];

    const routesForAuthenticatedOnly = [
        {
            element: <ProtectedRoute />,
            children: [
                {
                    element: <NavBar />,
                    children: [
                        {
                            path: "/campaigns",
                            element: <Campaigns />
                        },
                        {
                            path: "/friends",
                            element: <Friends />
                        },
                        {
                            path: "/logout",
                            element: <Logout />
                        },
                        {
                            path: "/profile",
                            element: <Profile />
                        }
                    ]
                }
            ]
        }   
    ];

    const routesForNotAuthenticatedOnly = [
        {
            path: "/login",
            element: <Login />
        }
    ];

    const routesForFullScreen = [
        {
            element: <ProtectedRoute />,
            children: [
                {
                    path: "/play",
                    element: <Play />
                }
                
            ]
        }
    ]

    const router = createBrowserRouter([
        ...routesForPublic,
        ...routesForFullScreen,
        ...(!user ? routesForNotAuthenticatedOnly : []),
        ...routesForAuthenticatedOnly
    ]);

    return <RouterProvider router={router} />;

}

export default Routes;