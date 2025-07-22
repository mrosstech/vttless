import {useState} from 'react';
import {ChipList} from './ChipList';
import {ChipEmailInput} from './ChipEmailInput';
import {Button} from '@chakra-ui/react';
import DataService from '../providers/DataService';

export const AddFriendsInput = ({ initialEmails = []}) => {
    const EMAIL_REGEXP = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    const isValidEmail = (email) => EMAIL_REGEXP.test(email);

    const [inputValue, setInputValue] = useState("");
    const [emails, setEmails] = useState(initialEmails);

    // Check if e-mail is already included
    const emailChipExists = (email) => emails.includes(email);

    // Add an email to the list but only if it is valid
    // and not already part of the list.
    const addEmails = (emailsToAdd) => {
        const validatedEmails = emailsToAdd
            .map( (e) => e.trim())
            .filter( (email) => isValidEmail(email) && !emailChipExists(email));
        const newEmails = [...emails, ...validatedEmails];

        setEmails(newEmails);
        setInputValue("");
    };

    const removeEmail = (email) => {
        const index = emails.findIndex((e) => e === email);
        if (index !== -1) {
            const newEmails = [...emails];
            newEmails.splice(index, 1);
            setEmails(newEmails);
        }
    };

    const handleChange = (e) => {
        setInputValue(e.target.value);
    };

    const handleKeyDown = (e) => {
        if (["Enter", "Tab", ","].includes(e.key)) {
            e.preventDefault();
            addEmails([inputValue])
        }
    };

    const handlePaste = (e) => {
        e.preventDefault();

        const pastedData = e.clipboardData.getData("text");
        const pastedEmails = pastedData.split(",");
        addEmails(pastedEmails);
    };

    const handleCloseClick = (email) => {
        removeEmail(email);
    }

    const handleEmailClick = () => {
        DataService.addFriendEmails(emails);
    }

    return (
        <>
            <ChipEmailInput
                placeholder="enter emails"
                onPaste={handlePaste}
                onKeyDown={handleKeyDown}
                onChange={handleChange}
                value={inputValue}
            />
            <ChipList emails={emails} onCloseClick={handleCloseClick} />
            <Button onClick={handleEmailClick}>Add Emails</Button>
        </>
    )
}

export default AddFriendsInput;