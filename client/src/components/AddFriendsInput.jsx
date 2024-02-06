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
    

}