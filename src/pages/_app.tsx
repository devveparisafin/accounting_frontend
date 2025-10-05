// pages/_app.tsx

import type { AppProps } from 'next/app';
import { useRouter } from 'next/router'; // 👈 Import useRouter
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { CacheProvider, EmotionCache } from '@emotion/react';
import createEmotionCache from '../createEmotionCache';
import { AuthProvider, useAuth } from '@/context/AuthContext'; // 👈 Ensure useAuth is exported
import { CompanyProvider } from '@/context/CompanyContext';
import React, { useEffect } from 'react'; // 👈 Import React hooks

// Client-side cache, shared for the whole session of the user in the browser.
const clientSideEmotionCache = createEmotionCache();

interface MyAppProps extends AppProps {
  emotionCache?: EmotionCache;
}

// 1. Define your professional, SaaS-based theme (UNMODIFIED)
const theme = createTheme({
  // ... theme configuration ...
  palette: {
    primary: {
      main: '#039BE5', 
    },
    secondary: {
      main: '#FFC107',
    },
    background: {
      default: '#f4f6f8', 
    },
  },
  typography: {
    fontFamily: [
      'Inter',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
    ].join(','),
  },
  components: {
    MuiButton: {
      defaultProps: {
        disableElevation: true, 
      },
    },
    MuiPaper: {
        styleOverrides: {
            root: {
                boxShadow: '0 4px 20px 0 rgba(0,0,0,.05)' 
            }
        }
    }
  }
});

// --- NEW COMPONENT FOR GLOBAL AUTH REDIRECT LOGIC ---
const AuthRedirectWrapper: React.FC<React.PropsWithChildren<{}>> = ({ children }) => {
    const router = useRouter();
    // 💡 IMPORTANT: This assumes your useAuth hook provides an 'isAuthenticated' status
    const { user, isLoading } = useAuth(); 

    useEffect(() => {
        // Only run this client-side logic after auth state is determined
        if (isLoading) return; 

        // Define which routes are public (no authentication required)
        const publicRoutes = ['/login', '/register', '/forgot-password'];
        const currentPath = router.pathname;
        const isPublicRoute = publicRoutes.includes(currentPath);

        // 1. If user is at the root ('/') AND not authenticated, redirect to /login
        if (currentPath === '/' && !user) {
            router.replace('/login');
        } 
        
        // 2. If user is NOT authenticated AND trying to access a protected route (not public), redirect to /login
        else if (!user && !isPublicRoute) {
            router.replace('/login');
        }
        
        // 3. If user IS authenticated AND trying to access / or /login, redirect to /dashboard
        else if (user && (currentPath === '/' || currentPath === '/login')) {
            router.replace('/dashboard');
        }

    // Dependency array ensures this runs when router changes or auth state changes
    }, [user, isLoading, router.pathname, router]); 

    // If still loading, or if the user is on a public page and not authenticated, render the children immediately
    // If the user is authenticated and is on /dashboard, render dashboard immediately
    if (isLoading) {
        // You can return a global loading spinner here if preferred
        return <div>Loading authentication state...</div>; 
    }
    
    return <>{children}</>;
};

// --- MODIFIED MYAPP COMPONENT ---
export default function MyApp(props: MyAppProps) {
  const { Component, emotionCache = clientSideEmotionCache, pageProps } = props;

  return (
    <CacheProvider value={emotionCache}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
          <AuthProvider>
                {/* 👈 WRAPPER ADDED HERE */}
                <AuthRedirectWrapper> 
                    <CompanyProvider>
                        <Component {...pageProps} />
                    </CompanyProvider>
                </AuthRedirectWrapper>
          </AuthProvider>
      </ThemeProvider>
    </CacheProvider>
  );
}