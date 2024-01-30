import {React, useEffect} from 'react';


const Home = ({user}) => {
  useEffect(() => {
    // Get the users campaigns
    console.log("Using effect");
  }, []);

  return (
    <div>
      <h2>Home Screen</h2>
      <h1>Stuff you should see whether you're logged in or not.</h1>
      
      { user ? (
        <div>
          <h1>Stuff you should only see if you ARE logged in.</h1>
          <div>
            <div>My Campaigns</div>
            <ul>
              
            </ul>
          </div>
        </div>
      
        ) : (
        <h1>Log in to see the good stuff</h1>
      )

      }
      

    </div>
  );
};

export default Home;
