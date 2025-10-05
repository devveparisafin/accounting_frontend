// src/components/PrivateRoute.tsx

import React, { ReactNode } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../context/AuthContext';
import { CircularProgress, Box } from '@mui/material'; // <-- Correct MUI imports

interface PrivateRouteProps {
  children: ReactNode;
}

const PrivateRoute = ({ children }: PrivateRouteProps) => {
  // Destructure user and isLoading from the AuthContext
  const { user, isLoading } = useAuth();
  const router = useRouter();

  // 1. Show loading state while AuthContext is initializing (checking localStorage)
  if (isLoading) {
    return (
        <Box 
            display="flex" 
            justifyContent="center" 
            alignItems="center" 
            minHeight="100vh"
            // Use a light background consistent with your app theme
            sx={(theme) => ({ backgroundColor: theme.palette.background.default })} 
        >
            <CircularProgress color="primary" />
        </Box>
    );
  }

  // 2. If not loading and no user is found, redirect to the login page
  if (!user && !isLoading) {
    // router.replace prevents the unauthorized page from being added to the browser history
    router.replace('/login'); 
    return null; // Don't render children while redirecting
  }

  // 3. If user is logged in, render the protected content
  return <>{children}</>;
};

export default PrivateRoute;