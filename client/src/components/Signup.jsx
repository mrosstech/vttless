

// const Signup = () => {
//     const backendUrlSignup = process.env.REACT_APP_BACKEND_BASE_URL + "/users/signup";
//     function handleSignupFormSubmit(event) {
//         event.preventDefault();
        
//         const data = new FormData(event.target);
        
//         const formJSON = Object.fromEntries(data.entries());
//         //results.innerText = JSON.stringify(formJSON, null, 2);
//         console.log(formJSON);
//         fetch(backendUrlSignup, {
//             method: 'POST',
//             headers: new Headers({'content-type': 'application/json'}),
//             mode: 'cors',
//             body: JSON.stringify(formJSON)
//         })
//     }
//     return (
//         <div className="login">
//             <div className="loginDiv">
//                 <div className="loginTitle"><p className="text-center">Sign Up</p></div>
//                     <form className="loginForm" onSubmit={handleSignupFormSubmit}>
//                         <div className="centeredDiv">
//                             <input className="loginInput" id="username" name="accountname" type="text" placeholder="Username" />
//                         </div>
//                         <div className="centeredDiv">
//                             <input className="loginInput" id="email" name="email" type="email" placeholder="E-mail address"/>
//                         </div>
//                         <div className="centeredDiv">
//                             <input className="loginInput" id="password" name="password" type="password" placeholder="Password" />
//                         </div>
//                         <div className="centeredDiv">
//                             <button className="standardButton" type="submit">Signup</button>
//                         </div>
//                     </form>
//             </div>
//         </div>
//     );
// };

// export default Signup;

import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@chakra-ui/react';
import {
    FormControl,
    FormLabel,
    Input,
    Button,
    VStack,
    Box,
    Heading,
    FormErrorMessage
} from '@chakra-ui/react';

const Signup = () => {
    const navigate = useNavigate();
    const toast = useToast();
    const backendUrlSignup = process.env.REACT_APP_BACKEND_BASE_URL + "/users/signup";

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting }
    } = useForm();

    const onSubmit = async (values) => {
        try {
            const response = await fetch(backendUrlSignup, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                mode: 'cors',
                body: JSON.stringify(values)
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error('Signup failed!\n' + data.suggestions);
            }

            toast({
                title: 'Account created.',
                description: "We've created your account for you.",
                status: 'success',
                duration: 5000,
                isClosable: true,
            });

            navigate('/login'); // Redirect to login page after successful signup
        } catch (error) {
            toast({
                title: 'Error',
                description: error.message,
                status: 'error',
                duration: 5000,
                isClosable: true,
            });
        }
    };

    return (
        <Box
            maxW="md"
            mx="auto"
            mt={8}
            p={6}
            borderWidth={1}
            borderRadius="lg"
            boxShadow="lg"
        >
            <VStack spacing={4} align="flex-start" w="full">
                <Heading size="lg" mb={4}>Sign Up</Heading>
                <form onSubmit={handleSubmit(onSubmit)} style={{ width: '100%' }}>
                    <VStack spacing={4} align="flex-start" w="full">
                        <FormControl isInvalid={errors.username}>
                            <FormLabel htmlFor="username">Username</FormLabel>
                            <Input
                                id="username"
                                {...register('username', {
                                    required: 'Username is required',
                                    minLength: { value: 3, message: 'Username must be at least 3 characters' }
                                })}
                            />
                            <FormErrorMessage>
                                {errors.username && errors.username.message}
                            </FormErrorMessage>
                        </FormControl>

                        <FormControl isInvalid={errors.email}>
                            <FormLabel htmlFor="email">Email</FormLabel>
                            <Input
                                id="email"
                                type="email"
                                {...register('email', {
                                    required: 'Email is required',
                                    pattern: {
                                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                                        message: 'Invalid email address'
                                    }
                                })}
                            />
                            <FormErrorMessage>
                                {errors.email && errors.email.message}
                            </FormErrorMessage>
                        </FormControl>

                        <FormControl isInvalid={errors.password}>
                            <FormLabel htmlFor="password">Password</FormLabel>
                            <Input
                                id="password"
                                type="password"
                                {...register('password', {
                                    required: 'Password is required',
                                    minLength: { value: 6, message: 'Password must be at least 6 characters' }
                                })}
                            />
                            <FormErrorMessage>
                                {errors.password && errors.password.message}
                            </FormErrorMessage>
                        </FormControl>

                        <Button
                            mt={4}
                            color={"orange.100"}
                            bg={"orange.500"}
                            isLoading={isSubmitting}
                            type="submit"
                            width="full"
                        >
                            Sign Up
                        </Button>
                    </VStack>
                </form>
            </VStack>
        </Box>
    );
};

export default Signup;