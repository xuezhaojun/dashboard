import { useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

const Login = () => {
  const [token, setToken] = useState('');
  const [error, setError] = useState<string | null>(null);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!token.trim()) {
      setError('Token is required');
      return;
    }

    // Basic format validation - should be a non-empty string
    // In a real app, we might do more validation or even verify with the API
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

  return (
    <div className="min-h-screen flex flex-col justify-center items-center py-12 sm:px-6 lg:px-8 bg-background">
      <div className="w-full max-w-md">
        <Card className="shadow-xl border-0 rounded-xl">
          <CardHeader className="flex flex-col items-center space-y-2 pb-2">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary w-6 h-6">
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
              </svg>
            </div>
            <CardTitle className="text-2xl font-bold text-center">Sign in to OCM Dashboard</CardTitle>
            <CardDescription className="text-center">
              Paste your Kubernetes <span className="font-medium">Bearer Token</span> below
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <form className="space-y-4" onSubmit={handleSubmit}>
              <textarea
                id="token"
                name="token"
                rows={4}
                className="min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="eyJhbGciOiJSUzI1NiIsImtpZCI6IkpXVCJ9..."
              />
              {error && (
                <p className="text-sm font-medium text-destructive">{error}</p>
              )}
              <Button type="submit" className="w-full font-medium">
                Sign In
              </Button>
              {import.meta.env.DEV && (
                <Button
                  variant="outline"
                  type="button"
                  className="w-full mt-2"
                  onClick={() => {
                    login('development-mode-token');
                    navigate('/clusters');
                  }}
                >
                  Use Dev Token
                </Button>
              )}
            </form>
          </CardContent>
          <CardFooter className="flex justify-center pt-2 pb-6">
            <p className="text-xs text-muted-foreground">
              Token is stored locally in your browser only.
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default Login;
