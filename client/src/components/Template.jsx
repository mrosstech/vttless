import {React} from 'react';
import NavBar from './Navbar';


const Template = (content) => {

    return (
        <>
            <NavBar />
            {content}
        </>
    )
}

export default Template;