// pages/login.tsx (Updated with Auth Context for testing)

import {
  Box,
  Typography,
  TextField,
  Button,
  Container,
  Paper,
  Link,
  useMediaQuery,
  useTheme,
  InputAdornment,
  IconButton,
  Alert, // For displaying login errors
} from '@mui/material';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import NextLink from 'next/link';
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext'; 
import { useRouter } from 'next/router'; 

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({ 
    email: '', 
    password: '' 
  });
  
  // Use Auth context and Next.js router
  const { login, user, error: authError, isLoading } = useAuth();
  const router = useRouter();

  // Redirect if user is already logged in
  useEffect(() => {
    if (user) {
        // If logged in, redirect to the company creation page (Phase 1 start)
        router.push('/dashboard/'); 
    }
  }, [user, router]);


  // MUI hooks for responsive design
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md')); 

  // Handle form field changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Call the login function from AuthContext
      await login(formData.email, formData.password);
      // Success redirection happens via the useEffect hook above
    } catch (err) {
      // Error handling is managed via the authError state
      console.error("Login failed:", err);
    }
  };

  return (
    <Box 
      sx={{
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        backgroundColor: isMobile ? 'white' : theme.palette.background.default, 
        padding: theme.spacing(2),
      }}
    >
      <Container component="main" maxWidth="xs">
        <Paper 
            elevation={isMobile ? 0 : 3} 
            sx={{ p: isMobile ? 3 : 4, width: '100%' }}
        >
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            <Typography component="h1" variant="h4" color="primary" sx={{ mb: 1 }}>
              Welcome Back
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
              Log in to manage your finances.
            </Typography>
            
            {/* Display error message from the backend */}
            {authError && (
              <Alert severity="error" sx={{ width: '100%', mb: 2 }}>
                {authError}
              </Alert>
            )}

            <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
              <TextField
                margin="normal"
                required
                fullWidth
                label="Email Address"
                name="email"
                type="email"
                onChange={handleChange}
                size="medium" 
              />
              <TextField
                margin="normal"
                required
                fullWidth
                name="password"
                label="Password"
                type={showPassword ? 'text' : 'password'}
                onChange={handleChange}
                size="medium"
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
              
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', width: '100%', mt: 1, mb: 2 }}>
                <NextLink href="/forgot-password" passHref legacyBehavior>
                  <Link variant="body2" color="text.secondary">
                    Forgot password?
                  </Link>
                </NextLink>
              </Box>

              <Button
                type="submit"
                fullWidth
                variant="contained"
                color="primary"
                size="large" 
                sx={{ mt: 1, mb: 2 }}
                disabled={isLoading}
              >
                {isLoading ? 'Logging In...' : 'Login'}
              </Button>
            </Box>

            <NextLink href="/register" passHref legacyBehavior>
              <Link variant="body2" sx={{ mt: 2 }}>
                Don't have an account? Sign Up
              </Link>
            </NextLink>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default Login;