import {React, useEffect, useState} from 'react';
import axios from 'axios';
import CampaignList from './CampaignList';
import { Card, CardHeader, CardBody, CardFooter, Heading } from '@chakra-ui/react'


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


  return (
    <div>
      <Card maxW='lg' m={2} colorScheme='blue'>
        <CardHeader><Heading size='xs'>vttLess News</Heading></CardHeader>
        <CardBody>Public news that everyone should see</CardBody>
      </Card>
      
      { user ? (
        <div>
            <Card maxW='lg' m={2}>
              <CardHeader><Heading size='xs'>Personal Updates</Heading></CardHeader>
              <CardBody>Only logged in users can see this</CardBody>
            </Card>
            <CampaignList user={user}/>
        </div>
        ) : (
        <h1>Log in to see the good stuff</h1>
      )

      }
    </div>
  );
};

export default Home;
