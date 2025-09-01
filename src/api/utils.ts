import { oidcService } from '../auth/OidcService';

/**
 * Create headers for API requests
 * @returns Headers object with Authorization and Content-Type
 */
let cachedOidcToken: { value: string; expiresAt: number } | null = null;

const getCachedOidcToken = async (): Promise<string | null> => {
  if (cachedOidcToken && Date.now() < cachedOidcToken.expiresAt) {
    return cachedOidcToken.value;
  }
  
  const token = await oidcService.getIdToken();
  if (token) {
    cachedOidcToken = {
      value: token,
      expiresAt: Date.now() + (5 * 60 * 1000) // 5 minute cache
    };
  }
  return token;
};

export const createHeaders = async (): Promise<HeadersInit> => {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  if (oidcService.isOidcEnabled()) {
    const oidcToken = await getCachedOidcToken();
    if (oidcToken) {
      headers['Authorization'] = `Bearer ${oidcToken}`;
    }
  } else {
    const token = localStorage.getItem('authToken');
    if (token) {
      // Token is already stored with 'Bearer ' prefix
      headers['Authorization'] = token;
    }
  }

  return headers;
};
