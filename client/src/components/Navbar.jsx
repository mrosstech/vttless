import React from "react";
import {useState} from "react";
import { Link, Box, Flex, Text, Button, Stack, Avatar } from "@chakra-ui/react";
import Logo from "./Logo";
import {useAuth} from '../providers/AuthProvider';
import {Outlet} from 'react-router-dom';

const NavBar = (props) => {

    const [isOpen, setIsOpen] = useState(false);

    const toggle = () => setIsOpen(!isOpen);
    console.log("Navbar:");
    console.log(props.user);
    return (
      <>
        <NavBarContainer {...props}>
            <Logo 
                w="100px" 
                color={["white", "white", "primary.500", "primary.500"]}
            />
            <MenuToggle toggle={toggle} isOpen={isOpen} />
            <MenuLinks isOpen={isOpen} user={props.user} isLoggedIn={props.isLoggedIn}/>
        </NavBarContainer>
        <Outlet />
      </>
    );

};

const CloseIcon = () => (
    <svg width="24" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
        <title>Close</title>
        <path
            fill="white"
            d="M9.00023 7.58599L13.9502 2.63599L15.3642 4.04999L10.4142 8.99999L15.3642 13.95L13.9502 15.364L9.00023 10.414L4.05023 15.364L2.63623 13.95L7.58623 8.99999L2.63623 4.04999L4.05023 2.63599L9.00023 7.58599Z"
        />

    </svg>
);

const MenuIcon = () => (
    <svg
        width="24px"
        viewBox="0 0 20 20"
        xmlns="http://www.w3.org/2000/svg"
        fill="white"
    >
    <title>Menu</title>
    <path d="M0 3h20v2H0V3zm0 6h20v2H0V9zm0 6h20v2H0v-2z" />
  </svg>
)

const MenuToggle = ({ toggle, isOpen }) => {
    return (
      <Box display={{ base: "block", md: "none" }} onClick={toggle}>
        {isOpen ? <CloseIcon /> : <MenuIcon />}
      </Box>
    );
  };
  
  const MenuItem = ({ children, isLast, to = "/", ...rest }) => {
    return (
      <Link href={to}>
        <Text as="span" display="block" {...rest}>
          {children}
        </Text>
      </Link>
    );
  };
  
  const MenuLinks = ({ isOpen }) => {
    const {user} = useAuth();
    return (
      <Box
        display={{ base: isOpen ? "block" : "none", md: "block" }}
        flexBasis={{ base: "100%", md: "auto" }}
      >
        <Stack
          spacing={8}
          align="center"
          justify={["center", "space-between", "flex-end", "flex-end"]}
          direction={["column", "row", "row", "row"]}
          pt={[4, 4, 0, 0]}
        >
          <MenuItem to="/">Home</MenuItem>
          <MenuItem to="/campaigns">Campaigns</MenuItem>
          <MenuItem to="/friends">Friends</MenuItem>
          { user ? 
              <>
              <MenuItem to="/logout">Logout</MenuItem>     
              <MenuItem to="/profile" isLast>
                <Avatar name={user.user.username} src={user.user.profilePicture} />{user.user.username}
              </MenuItem>
              </>
          : 
              <MenuItem to="/login" isLast>
                <Button
                  size="sm"
                  rounded="md"
                  color={"orange.100"}
                  bg={"orange.500"}
                  _hover={{
                    bg: ["primary.100", "primary.100", "primary.600", "primary.600"]
                  }}
                >
                  Login
                </Button>
            </MenuItem>
          }
        </Stack>
      </Box>
    );
  };
  
  const NavBarContainer = ({ children, ...props }) => {
    return (
      <Flex
        as="nav"
        align="center"
        justify="space-between"
        wrap="wrap"
        w="100%"
        mb={8}
        p={8}
        bg={"gray.700"}
        color={"orange.400"}
        {...props}
      >
        {children}
      </Flex>
    );
  };

  export default NavBar;