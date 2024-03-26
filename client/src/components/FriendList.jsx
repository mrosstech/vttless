import {React, useEffect, useState} from 'react';
import axios from 'axios';
import {
    Table,
    Thead,
    Tbody,
    Tr,
    Th,
    Td,
    TableCaption,
    TableContainer,
  } from '@chakra-ui/react'
import {useAuth} from '../providers/AuthProvider';
//import CampaignEdit from './CampaignEdit';

const FriendList = () => {
    const {user} = useAuth();
    //const { isOpen, onOpen, onClose } = useDisclosure();
    const [friends, setFriends] = useState(null);
    //const [modalCampaign, setModalCampaign] = useState(null);
    const [error, setError] = useState(null);
    
    const API = axios.create({
      baseURL: process.env.REACT_APP_BACKEND_BASE_URL,
      headers: {
          'Content-Type': 'application/json'
      },
      withCredentials: true,
    });
    // function toggleModal(campaign) {
    //     console.log("Clicked td");
    //     setModalCampaign(campaign);
    //     onOpen();
    // } 

    const removeFriend = (friend) => {
        console.log("Friend removed");
    }
    useEffect(() => {
        // Get the users friends
        if (user) {
          try {
            const res =  API.get("/friends/list", {
            }).then((res) => {
                let listFriends = "";
                console.log("Got friends data back");
                console.log(res);
                if (res.data.length === 0) {
                    listFriends = <Tr><Td>No Friends</Td><Td>Click here to add one!</Td></Tr>;
                } else {
                    listFriends = res.data.map(friend => 
                        <Tr key={friend._id}>
                            <Td>{friend.username}</Td>
                            <Td>{friend.username}</Td>
                            <Td>
                                <div onClick={() => removeFriend(friend)}>Remove</div>
                            </Td>
                        </Tr>      
                    );
                }
                setFriends(listFriends);
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
            <TableContainer>
                <Table variant='simple' colorScheme="orange">
                    <TableCaption>My Friends</TableCaption>
                    <Thead>
                        <Tr>
                            <Th>Friend Name</Th>
                            <Th>Description</Th>
                            <Th> </Th>
                        </Tr>
                    </Thead>
                    <Tbody>
                        {friends}
                    </Tbody>
                </Table>
            </TableContainer>

        </div>
      );

}

export default FriendList;
