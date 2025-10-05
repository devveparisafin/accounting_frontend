// pages/register.tsx (Using Material UI and AuthContext)

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
  Alert, // For displaying registration errors
} from '@mui/material';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import NextLink from 'next/link';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext'; // Import useAuth hook
import { useRouter } from 'next/router'; // Import useRouter for redirection

const Register = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({ 
    name: '', 
    email: '', 
    password: '' 
  });

  // Use Auth context and Next.js router
  const { register, error: authError, isLoading } = useAuth();
  const router = useRouter();

  // MUI hooks for responsive design
  const theme = useTheme();
  // isMobile is true below the 'md' breakpoint
  const isMobile = useMediaQuery(theme.breakpoints.down('md')); 
  
  // Handle form field changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Call the register function from AuthContext
      await register(formData.name, formData.email, formData.password);
      
      // Success! Redirect user to the company creation stage (Phase 1)
      router.push('/login'); // Redirect to login after successful registration
    } catch (err) {
      // Error handling is managed via the authError state
      console.error("Registration failed:", err);
    }
  };

  return (
    <Box 
      sx={{
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        // Responsive background color: white on mobile, light gray on desktop
        backgroundColor: isMobile ? 'white' : theme.palette.background.default, 
        padding: theme.spacing(2),
      }}
    >
      <Container component="main" maxWidth="xs">
        {/* Paper provides the premium card look on desktop */}
        <Paper 
            elevation={isMobile ? 0 : 3} // No shadow on mobile for app feel
            sx={{ 
                p: isMobile ? 3 : 4, // Adjust padding
                width: '100%' 
            }}
        >
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            <Typography component="h1" variant="h4" color="primary" sx={{ mb: 1 }}>
              Create Your Account
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
              Start managing your company's finances today.
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
                label="Full Name"
                name="name"
                onChange={handleChange}
                size="medium" 
              />
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
              <Button
                type="submit"
                fullWidth
                variant="contained"
                color="primary"
                size="large" // Large button for mobile-friendly tapping
                sx={{ mt: 3, mb: 2 }}
                disabled={isLoading} // Disable button while API call is running
              >
                {isLoading ? 'Registering...' : 'Register'}
              </Button>
            </Box>

            <NextLink href="/login" passHref legacyBehavior>
              <Link variant="body2" sx={{ mt: 2 }}>
                Already have an account? Log In
              </Link>
            </NextLink>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default Register;