import { useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
    <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-background">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h1 className="text-center text-3xl font-extrabold text-foreground">
          OCM Dashboard
        </h1>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <Card>
          <CardHeader>
            <CardTitle>Authentication</CardTitle>
            <CardDescription>
              Sign in with your bearer token to access the dashboard
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="token" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="token">Bearer Token</TabsTrigger>
                <TabsTrigger value="dev" disabled={!import.meta.env.DEV}>Development</TabsTrigger>
              </TabsList>
              <TabsContent value="token">
                <form className="space-y-4" onSubmit={handleSubmit}>
                  <div className="space-y-2">
                    <label htmlFor="token" className="text-sm font-medium">
                      Bearer Token
                    </label>
                    <textarea
                      id="token"
                      name="token"
                      rows={4}
                      className="min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      value={token}
                      onChange={(e) => setToken(e.target.value)}
                      placeholder="Paste your bearer token here..."
                    />
                    {error && (
                      <p className="text-sm font-medium text-destructive">{error}</p>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    The token will be stored locally in your browser and used to authenticate API requests.
                  </p>
                  <Button type="submit" className="w-full">
                    Sign in
                  </Button>
                </form>
              </TabsContent>
              <TabsContent value="dev">
                {import.meta.env.DEV && (
                  <div className="flex flex-col space-y-4 py-4">
                    <p className="text-sm text-muted-foreground">
                      Development mode allows you to use the dashboard without providing a valid token.
                    </p>
                    <Button
                      variant="outline"
                      onClick={() => {
                        login('development-mode-token');
                        navigate('/clusters');
                      }}
                    >
                      Continue without token (Dev Mode)
                    </Button>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
          <CardFooter className="flex justify-center border-t pt-6">
            <p className="text-xs text-muted-foreground">
              OCM Dashboard © {new Date().getFullYear()}
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default Login;