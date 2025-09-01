import { oidcService } from '../auth/OidcService';

/**
 * Create headers for API requests
 * @returns Headers object with Authorization and Content-Type
 */
export const createHeaders = async (): Promise<HeadersInit> => {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  if (oidcService.isOidcEnabled()) {
    const oidcToken = await oidcService.getIdToken();
    if (oidcToken) {
      headers['Authorization'] = `Bearer ${oidcToken}`;
      return headers;
    }
  }

  const token = localStorage.getItem('authToken');
  if (token) {
    // Token is already stored with 'Bearer ' prefix
    headers['Authorization'] = token;
  }

  return headers;
};
