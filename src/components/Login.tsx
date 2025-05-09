import { useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardHeader,
  CardContent,
  CardActions,
  TextField,
  Button,
  Typography,
  useTheme,
} from "@mui/material";

const Login = () => {
  const [token, setToken] = useState('');
  const [error, setError] = useState<string | null>(null);
  const { login } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!token.trim()) {
      setError('Token is required');
      return;
    }

    // Basic format validation
    if (token.trim().length < 10) {
      setError('Token seems too short');
      return;
    }

    // Clear any previous errors
    setError(null);

    // Store the token
    const formattedToken = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
    login(formattedToken);

    // Redirect to the clusters page
    navigate('/clusters');
  };

  const handleDevLogin = () => {
    login('development-mode-token');
    navigate('/clusters');
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        width: '100%',
        bgcolor: theme => theme.palette.background.default,
      }}
    >
      <Box
        sx={{
          width: '100%',
          maxWidth: '380px',
          margin: '0 auto',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
        }}
      >
        <Card
          sx={{
            width: "100%",
            boxShadow: theme.shadows[4],
            borderRadius: 2,
            p: 2,
          }}
        >
          <CardHeader
            sx={{ textAlign: "center", pb: 0 }}
            title={
              <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                {/* Title */}
                <Typography variant="h5" component="h1" fontWeight="bold">
                  Sign in to OCM Dashboard
                </Typography>
              </Box>
            }
            subheader={
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Paste your Kubernetes <strong>Bearer Token</strong> below
              </Typography>
            }
          />

          <form onSubmit={handleSubmit}>
            <CardContent sx={{ pt: 4 }}>
              {/* Token Input */}
              <TextField
                multiline
                fullWidth
                rows={4}
                placeholder="eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..."
                variant="outlined"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                error={!!error}
                helperText={error}
                slotProps={{
                  input: {
                    style: {
                      fontFamily: "JetBrains Mono, monospace",
                      fontSize: "0.75rem",
                    }
                  }
                }}
                sx={{ mb: 3 }}
              />

              {/* Buttons */}
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                <Button
                  type="submit"
                  variant="contained"
                  fullWidth
                  sx={{
                    bgcolor: "#0e0f45",
                    "&:hover": {
                      bgcolor: "#1a1b66",
                    },
                    textTransform: "none",
                  }}
                >
                  Sign In
                </Button>

                {import.meta.env.DEV && (
                  <Button
                    variant="outlined"
                    fullWidth
                    sx={{ textTransform: "none" }}
                    onClick={handleDevLogin}
                  >
                    Development Mode
                  </Button>
                )}
              </Box>
            </CardContent>
          </form>

          <CardActions sx={{ justifyContent: "center", pt: 0 }}>
            <Typography variant="caption" color="text.secondary">
              Token is stored locally in your browser only.
            </Typography>
          </CardActions>
        </Card>
      </Box>
    </Box>
  );
};

export default Login;
