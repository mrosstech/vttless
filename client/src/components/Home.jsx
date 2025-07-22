import React, { Suspense } from 'react';
import { VStack, Container, Spinner, Center, Text, useColorModeValue } from '@chakra-ui/react';
import { useAuth } from '../providers/AuthProvider';
import Hero from './Hero';
import UnauthenticatedCTA from './UnauthenticatedCTA';
import AuthenticatedDashboard from './AuthenticatedDashboard';
import Features from './Features';

const Home = () => {
  const { user } = useAuth();
  const bgColor = useColorModeValue('gray.50', 'gray.900');

  return (
    <VStack 
      spacing={0} 
      minH="100vh" 
      w="full" 
      bg={bgColor}
      align="stretch"
    >
      {/* Hero Section - Always visible */}
      <Hero />
      
      {/* Conditional Content */}
      <Suspense fallback={<LoadingSection />}>
        {user ? (
          <AuthenticatedDashboard />
        ) : (
          <>
            <UnauthenticatedCTA />
            <Features />
          </>
        )}
      </Suspense>
    </VStack>
  );
};

const LoadingSection = () => {
  return (
    <Container maxW="container.xl" py={12}>
      <Center>
        <VStack spacing={4}>
          <Spinner
            thickness="4px"
            speed="0.65s"
            emptyColor="gray.200"
            color="orange.500"
            size="xl"
          />
          <Text color="gray.500">Loading your dashboard...</Text>
        </VStack>
      </Center>
    </Container>
  );
};

export default Home;
