import {React} from 'react';
//import axios from 'axios';
import {
    Modal, ModalOverlay, ModalContent,
    ModalHeader, ModalFooter, ModalBody,
    ModalCloseButton, Input,
    Button
} from '@chakra-ui/react'
import {
    FormControl, FormLabel,
    FormErrorMessage, FormHelperText
} from '@chakra-ui/react'

const CampaignEdit = (props) => {
    // const [error, setError] = useState(null);
    // const [campaignName, setCampaignName] = useState(null);
    // const [campaignDescription, setCampaignDescription] = useState(null);
    // const [campaignPlayers, setCampaignPlayers] = useState(null);
    // const [campaignGm, setCampaignGm] = useState(null);
  
    // const API = axios.create({
    //   baseURL: process.env.REACT_APP_BACKEND_BASE_URL,
    //   headers: {
    //       'Content-Type': 'application/json'
    //   },
    //   withCredentials: true,
    // });

    //TODO:  Add routine to get friends.
    const submitForm = () => {

    }

    return (
    
        <Modal isOpen={props.isOpen} onClose={props.onClose}>
            <ModalOverlay />
            <ModalContent>
                <ModalHeader>Edit Campaign</ModalHeader>
                <ModalCloseButton />
                <ModalBody>
                    <FormControl isRequired>
                        <FormLabel>Edit Campaign Name</FormLabel>
                        <Input type='text' defaultValue={props.campaign?.name}/>
                        <FormHelperText>Enter the updated campaign name</FormHelperText>
                        <FormErrorMessage>Campaign name is required</FormErrorMessage>
                    </FormControl>
                    <FormControl isRequired>
                        <FormLabel>Edit Campaign Description</FormLabel>
                        <Input type='text' defaultValue={props.campaign?.description}/>
                        <FormHelperText>Enter the updated campaign desc.</FormHelperText>
                        <FormErrorMessage>Description is required</FormErrorMessage>
                    </FormControl>
                    <FormControl isRequired>
                        <FormLabel>Edit Players</FormLabel>
                        
                    </FormControl>
                </ModalBody>
                <ModalFooter>
                    <Button colorScheme='orange' mr={3} onClick={submitForm}>Update Campaign</Button>
                    <Button variant='ghost' onClick={props.onClose}>Cancel</Button>
                </ModalFooter>
            </ModalContent>
        </Modal>

    );

}

export default CampaignEdit;
