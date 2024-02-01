import {React, useEffect, useState} from 'react';
import axios from 'axios';

const Home = ({user}) => {
  const [campaigns, setCampaigns] = useState(null);
  const [error, setError] = useState(null);

  const API = axios.create({
    baseURL: process.env.REACT_APP_BACKEND_BASE_URL,
    headers: {
        'Content-Type': 'application/json'
    },
    withCredentials: true,
  });

  useEffect(() => {
    // Get the users campaigns
    //console.log(user);
    if (user) {
      try {
        const res =  API.get("/campaigns/list", {
        }).then((res) => {
            let listCampaigns = "";
            console.log("Got campaign data back");
            if (res?.data.campaigns) {
                console.log(res.data.campaigns);
                if (res.data.campaigns.length == 0) {
                  listCampaigns = "<li>No campaigns<li>";
                } else {
                  listCampaigns = res.data.campaigns.map(campaign => 
                      <tr key={campaign._id}><td>{campaign.name}</td><td>{campaign.description}</td><td>Edit</td></tr>
                    );
                }
                setCampaigns(listCampaigns);
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
    } else {
      console.log("no user logged in");
    }
  }, [user]);

  return (
    <div>
      <h2>Home Screen</h2>
      <h1>Stuff you should see whether you're logged in or not.</h1>
      
      { user ? (
        <div>
          <h1>Stuff you should only see if you ARE logged in.</h1>
          <div>
            <div>My Campaigns</div>
            <table>
              {campaigns}
            </table>
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
