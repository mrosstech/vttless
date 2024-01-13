

const Signup = () => {
    const backendUrlLogin = process.env.REACT_APP_BACKEND_BASE_URL + "/auth/login";
    const backendUrlSignup = process.env.REACT_APP_BACKEND_BASE_URL + "/users/signup";
    function handleSignupFormSubmit(event) {
        event.preventDefault();
        
        const data = new FormData(event.target);
        
        const formJSON = Object.fromEntries(data.entries());
        //results.innerText = JSON.stringify(formJSON, null, 2);
        console.log(formJSON);
        fetch(backendUrlSignup, {
            method: 'POST',
            headers: new Headers({'content-type': 'application/json'}),
            mode: 'cors',
            body: JSON.stringify(formJSON)
        })
    }
    return (
        <div className="login">
            <div className="wrapper">
                <div className="right">
                    <h1 className="loginTitle">Sign Up</h1>
                    <form onSubmit={handleSignupFormSubmit}>
                        <div>
                            <input id="username" name="accountname" type="text" />
                        </div>
                        <div>
                            <input id="email" name="email" type="email" />
                        </div>
                        <div>
                            <input id="password" name="password" type="password" />
                        </div>
                        <div>
                            <button className="submit" type="submit">Signup</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Signup;