import { createContext, useState, useContext, type ReactNode, useEffect } from 'react';
import { oidcService } from './OidcService';

interface AuthContextType {
  token: string | null;
  isAuthenticated: boolean;
  login: (token: string) => void;
  loginWithOidc: () => Promise<void>;
  logout: () => void;
  isLoading: boolean;
  error: string | null;
  isOidcEnabled: boolean;
  authMethod: 'bearer' | 'oidc' | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('authToken');
  });

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOidcEnabled, setIsOidcEnabled] = useState(false);
  const [authMethod, setAuthMethod] = useState<'bearer' | 'oidc' | null>(null);

  const isAuthenticated = !!token;

  useEffect(() => {
    const initializeAuth = async () => {
      setIsLoading(true);
      try {
        await oidcService.initialize();
        setIsOidcEnabled(oidcService.isOidcEnabled());
        
        if (oidcService.isOidcEnabled()) {
          const oidcUser = await oidcService.getUser();
          if (oidcUser && !oidcUser.expired) {
            const idToken = await oidcService.getIdToken();
            if (idToken) {
              setToken(idToken);
              setAuthMethod('oidc');
              setIsLoading(false);
              return;
            }
          }
        }
        
        const bearerToken = localStorage.getItem('authToken');
        if (bearerToken) {
          setToken(bearerToken);
          setAuthMethod('bearer');
        }
      } catch (err) {
        console.error('Failed to initialize auth:', err);
        setError('Failed to initialize authentication');
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  useEffect(() => {
    if (token && authMethod === 'bearer') {
      localStorage.setItem('authToken', token);
    } else if (!token || authMethod === 'oidc') {
      localStorage.removeItem('authToken');
    }
  }, [token, authMethod]);



  const login = (newToken: string) => {
    setError(null);
    // Clean and format the token
    const cleanToken = newToken.trim();
    const formattedToken = cleanToken.startsWith('Bearer ')
      ? cleanToken
      : `Bearer ${cleanToken}`;

    setToken(formattedToken);
    setAuthMethod('bearer');
    setIsLoading(false);
  };

  const loginWithOidc = async () => {
    if (!oidcService.isOidcEnabled()) {
      setError('OIDC is not enabled');
      return;
    }

    try {
      setError(null);
      setIsLoading(true);
      await oidcService.signinRedirect();
    } catch (err) {
      console.error('OIDC login failed:', err);
      setError('OIDC login failed');
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setError(null);
    setIsLoading(true);

    try {
      if (authMethod === 'oidc' && oidcService.isOidcEnabled()) {
        await oidcService.removeUser();
      }
      
      setToken(null);
      setAuthMethod(null);
      localStorage.removeItem('authToken');
    } catch (err) {
      console.error('Logout failed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const value = {
    token,
    isAuthenticated,
    login,
    loginWithOidc,
    logout,
    isLoading,
    error,
    isOidcEnabled,
    authMethod
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
