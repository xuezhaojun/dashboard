import { User, UserManager, WebStorageStateStore } from 'oidc-client-ts';
import type { UserManagerSettings } from 'oidc-client-ts';

const API_BASE = import.meta.env.VITE_API_BASE || (import.meta.env.PROD ? '' : 'http://localhost:8080');

export interface OidcConfig {
  authority: string;
  client_id: string;
  redirect_uri: string;
  response_type: string;
  scope: string;
  post_logout_redirect_uri: string;
  silent_redirect_uri: string;
  automaticSilentRenew: boolean;
  includeIdTokenInSilentRenew: boolean;
  userStore: WebStorageStateStore;
}

export interface AuthConfig {
  oidcEnabled: boolean;
  issuerUrl?: string;
  clientId?: string;
  clientSecret?: string;
  redirectUri?: string;
}

class OidcService {
  private userManager: UserManager | null = null;
  private config: AuthConfig | null = null;

  async initialize(): Promise<void> {
    try {
      const response = await fetch(`${API_BASE}/api/auth/config`);
      if (!response.ok) {
        throw new Error('Failed to fetch auth config');
      }
      
      this.config = await response.json();
      
      if (this.config?.oidcEnabled && this.config.issuerUrl && this.config.clientId && this.config.clientSecret) {
        const settings: UserManagerSettings = {
          authority: this.config.issuerUrl,
          client_id: this.config.clientId,
          client_secret: this.config.clientSecret,
          client_authentication: 'client_secret_post',
          redirect_uri: this.config.redirectUri || `${window.location.origin}/auth/callback`,
          response_type: 'code',
          scope: 'openid profile email',
          post_logout_redirect_uri: window.location.origin,
          silent_redirect_uri: `${window.location.origin}/auth/silent-callback`,
          automaticSilentRenew: true,
          includeIdTokenInSilentRenew: true,
          userStore: new WebStorageStateStore({ store: window.localStorage }),
        };

        this.userManager = new UserManager(settings);
        
        this.userManager.events.addUserLoaded((user: User) => {
          console.log('OIDC user loaded:', user.profile);
        });

        this.userManager.events.addUserUnloaded(() => {
          console.log('OIDC user unloaded');
        });

        this.userManager.events.addAccessTokenExpired(() => {
          console.log('OIDC access token expired');
          this.signoutRedirect();
        });

        this.userManager.events.addSilentRenewError((error) => {
          console.error('OIDC silent renew error:', error);
        });
      }
    } catch (error) {
      console.error('Failed to initialize OIDC service:', error);
      this.config = { oidcEnabled: false };
    }
  }

  isOidcEnabled(): boolean {
    return this.config?.oidcEnabled === true && this.userManager !== null;
  }

  async signinRedirect(): Promise<void> {
    if (!this.userManager) {
      throw new Error('OIDC not initialized');
    }
    await this.userManager.signinRedirect();
  }

  async signinRedirectCallback(): Promise<User> {
    if (!this.userManager) {
      throw new Error('OIDC not initialized');
    }
    return await this.userManager.signinRedirectCallback();
  }

  async signoutRedirect(): Promise<void> {
    if (!this.userManager) {
      throw new Error('OIDC not initialized');
    }
    await this.userManager.signoutRedirect();
  }

  async getUser(): Promise<User | null> {
    if (!this.userManager) {
      return null;
    }
    return await this.userManager.getUser();
  }

  async removeUser(): Promise<void> {
    if (!this.userManager) {
      return;
    }
    await this.userManager.removeUser();
  }

  async getAccessToken(): Promise<string | null> {
    const user = await this.getUser();
    return user?.access_token || null;
  }

  async getIdToken(): Promise<string | null> {
    const user = await this.getUser();
    return user?.id_token || null;
  }

  isAuthenticated(): Promise<boolean> {
    return this.getUser().then(user => user !== null && !user.expired);
  }
}

export const oidcService = new OidcService();
