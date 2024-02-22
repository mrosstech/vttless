import axios from "axios";

const addFriendEmails = (emails) => {
    return axios.post("/friends/add", {
        emails
    });
}

const DataService = {
    addFriendEmails
}

export default DataService;