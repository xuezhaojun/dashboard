import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, CircularProgress, Typography, Alert } from '@mui/material';
import { oidcService } from '../auth/OidcService';
import { useAuth } from '../auth/AuthContext';

const OidcCallback = () => {
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { login } = useAuth();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const user = await oidcService.signinRedirectCallback();
        
        if (user && user.id_token) {
          login(user.id_token);
          navigate('/overview');
        } else {
          setError('No valid token received from OIDC provider');
        }
      } catch (err: unknown) {
        console.error('OIDC callback error:', err);
        setError('Authentication failed. Please try again.');
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      }
    };

    handleCallback();
  }, [navigate, login]);

  if (error) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          p: 2,
        }}
      >
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Typography variant="body2" color="text.secondary">
          Redirecting to login page...
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        gap: 2,
      }}
    >
      <CircularProgress size={48} />
      <Typography variant="h6">
        Completing authentication...
      </Typography>
      <Typography variant="body2" color="text.secondary">
        Please wait while we process your login.
      </Typography>
    </Box>
  );
};

export default OidcCallback;
