import {React} from 'react';
import CampaignList from './CampaignList';
import { Card, CardHeader, CardBody, Heading } from '@chakra-ui/react'
import {useAuth} from '../providers/AuthProvider';

const Home = () => {
  const {user} = useAuth();

  return (
    <div>
      <Card maxW='lg' m={2} colorScheme='blue'>
        <CardHeader><Heading size='xs'>vttLess News</Heading></CardHeader>
        <CardBody>vttLess!  A new minimal vtt under construction. Tell yer friends.</CardBody>
      </Card>
      
      { user ? (
        <div>
            <Card maxW='lg' m={2}>
              <CardHeader><Heading size='xs'>Personal Updates</Heading></CardHeader>
              <CardBody>Only logged in users can see this</CardBody>
            </Card>
            <CampaignList />
        </div>
        ) : (
        <></>
      )

      }
    </div>
  );
};

export default Home;
