

const Signup = () => {
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
            <div className="loginDiv">
                <div className="loginTitle"><p className="text-center">Sign Up</p></div>
                    <form className="loginForm" onSubmit={handleSignupFormSubmit}>
                        <div className="centeredDiv">
                            <input className="loginInput" id="username" name="accountname" type="text" placeholder="Username" />
                        </div>
                        <div className="centeredDiv">
                            <input className="loginInput" id="email" name="email" type="email" placeholder="E-mail address"/>
                        </div>
                        <div className="centeredDiv">
                            <input className="loginInput" id="password" name="password" type="password" placeholder="Password" />
                        </div>
                        <div className="centeredDiv">
                            <button className="standardButton" type="submit">Signup</button>
                        </div>
                    </form>
            </div>
        </div>
    );
};

export default Signup;