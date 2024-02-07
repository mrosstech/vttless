import {React, useEffect, useState} from 'react';
import axios from 'axios';
import {
    Table,
    Thead,
    Tbody,
    Tfoot,
    Tr,
    Th,
    Td,
    TableCaption,
    TableContainer,
    useDisclosure
  } from '@chakra-ui/react'
//import CampaignEdit from './CampaignEdit';

const FriendList = ({user}) => {
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
                if (res?.data.friends) {
                    console.log(res.data.friends);
                    if (res.data.friends.length == 0) {
                      listFriends = <Tr><Td>No Friends</Td><Td>Click here to add one!</Td></Tr>;
                    } else {
                        listFriends = res.data.friends.map(friend => 
                            <Tr key={friend._id}>
                                <Td>{friend.name}</Td>
                                <Td>{friend.name}</Td>
                                <Td>
                                    <div onClick={() => removeFriend(friend)}>Remove</div>
                                </Td>
                            </Tr>      
                        );
                    }
                    setFriends(listFriends);
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
      }, [friends]);

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
