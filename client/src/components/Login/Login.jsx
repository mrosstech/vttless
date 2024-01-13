import { Link } from "react-router-dom";

const Login = () => {
    const backendUrlLogin = process.env.REACT_APP_BACKEND_BASE_URL + "/auth/login";
    function handleLoginFormSubmit(event) {
        event.preventDefault();
        
        const data = new FormData(event.target);
        
        const formJSON = Object.fromEntries(data.entries());
        console.log(formJSON);
        const response = fetch(backendUrlLogin, {
            method: 'POST',
            headers: new Headers({'content-type': 'application/json'}),
            mode: 'cors',
            credentials: 'include',
            body: JSON.stringify(formJSON)
        })
        const {token, user} = response.data;
        if (token && user) {
            localStorage.setItem('token', token);
            setUserState
        }
        

    }
    return (
        <div className="login">
            <div className="wrapper">
                <div className="left">
                    <h1 className="loginTitle">Login</h1>
                    <form onSubmit={handleLoginFormSubmit}>
                        <div>
                            <input id="username" name="username" type="text" />
                        </div>
                        <div>
                            <input id="password" name="password" type="password" />
                        </div>
                        <div>
                            <button className="submit" type="submit">Login</button>
                        </div>
                        <div>
                            <Link className="link" to="/signup">Don't have an account?  Sign up here.</Link>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Login;