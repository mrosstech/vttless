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
import CampaignEdit from './CampaignEdit';

const CampaignList = ({user}) => {
    const { isOpen, onOpen, onClose } = useDisclosure();
    const [campaigns, setCampaigns] = useState(null);
    const [modalCampaign, setModalCampaign] = useState(null);
    const [error, setError] = useState(null);
    
    const API = axios.create({
      baseURL: process.env.REACT_APP_BACKEND_BASE_URL,
      headers: {
          'Content-Type': 'application/json'
      },
      withCredentials: true,
    });
    function toggleModal(campaign) {
        console.log("Clicked td");
        setModalCampaign(campaign);
        onOpen();
    } 
    useEffect(() => {
        // Get the users campaigns
        if (user) {
          try {
            const res =  API.get("/campaigns/list", {
            }).then((res) => {
                let listCampaigns = "";
                console.log("Got campaign data back");
                if (res?.data.campaigns) {
                    console.log(res.data.campaigns);
                    if (res.data.campaigns.length == 0) {
                      listCampaigns = <Tr><Td>No Campaigns</Td><Td>Click here to create one!</Td></Tr>;
                    } else {
                        listCampaigns = res.data.campaigns.map(campaign => 
                            <Tr key={campaign._id}>
                                <Td>{campaign.name}</Td>
                                <Td>{campaign.description}</Td>
                                <Td>
                                    <div onClick={() => toggleModal(campaign)}>Edit</div>
                                </Td>
                            </Tr>      
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
            <TableContainer>
                <Table variant='simple' colorScheme="orange">
                    <TableCaption>My Campaigns</TableCaption>
                    <Thead>
                        <Tr>
                            <Th>Campaign Name</Th>
                            <Th>Description</Th>
                            <Th> </Th>
                        </Tr>
                    </Thead>
                    <Tbody>
                        {campaigns}
                    </Tbody>
                </Table>
            </TableContainer>
            <CampaignEdit isOpen={isOpen} onClose={onClose} campaign={modalCampaign} />

        </div>
      );

}

export default CampaignList;
