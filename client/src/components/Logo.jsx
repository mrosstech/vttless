import React from "react";
import { Link } from "react-router-dom";
import vttlessicon from "../assets/vttless_orange.jpg";
import { Image, Box, Text } from "@chakra-ui/react";

export default function Logo(props) {
    return (
        <Box {...props}>     
                <Link to="/">
                    <Image borderRadius='full' boxSize='80px' src={vttlessicon} />
                </Link>
        </Box>
    );
}