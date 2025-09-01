package auth

import (
	"context"
	"crypto/rand"
	"encoding/base64"
	"fmt"
	"log"
	"net/http"
	"os"

	"github.com/coreos/go-oidc/v3/oidc"
	"github.com/gin-gonic/gin"
	"golang.org/x/oauth2"
)

type OIDCConfig struct {
	Enabled      bool
	IssuerURL    string
	ClientID     string
	ClientSecret string
	RedirectURI  string
	Provider     *oidc.Provider
	OAuth2Config *oauth2.Config
	Verifier     *oidc.IDTokenVerifier
}

type AuthConfig struct {
	OIDCEnabled bool   `json:"oidcEnabled"`
	IssuerURL   string `json:"issuerUrl,omitempty"`
	ClientID    string `json:"clientId,omitempty"`
	RedirectURI string `json:"redirectUri,omitempty"`
}

func NewOIDCConfig(ctx context.Context) (*OIDCConfig, error) {
	enabled := os.Getenv("DASHBOARD_OIDC_ENABLED") == "true"
	if !enabled {
		return &OIDCConfig{Enabled: false}, nil
	}

	issuerURL := os.Getenv("DASHBOARD_OIDC_ISSUER_URL")
	clientID := os.Getenv("DASHBOARD_OIDC_CLIENT_ID")
	clientSecret := os.Getenv("DASHBOARD_OIDC_CLIENT_SECRET")
	redirectURI := os.Getenv("DASHBOARD_OIDC_REDIRECT_URI")

	if issuerURL == "" || clientID == "" || clientSecret == "" {
		return nil, fmt.Errorf("OIDC configuration incomplete: missing required environment variables")
	}

	if redirectURI == "" {
		redirectURI = "http://localhost:3000/auth/callback"
	}

	provider, err := oidc.NewProvider(ctx, issuerURL)
	if err != nil {
		log.Printf("Warning: Failed to create OIDC provider: %v", err)
		log.Printf("OIDC will be enabled for UI demonstration but authentication will not work")
		
		return &OIDCConfig{
			Enabled:      true,
			IssuerURL:    issuerURL,
			ClientID:     clientID,
			ClientSecret: clientSecret,
			RedirectURI:  redirectURI,
			Provider:     nil,
			OAuth2Config: nil,
			Verifier:     nil,
		}, nil
	}

	oauth2Config := &oauth2.Config{
		ClientID:     clientID,
		ClientSecret: clientSecret,
		RedirectURL:  redirectURI,
		Endpoint:     provider.Endpoint(),
		Scopes:       []string{oidc.ScopeOpenID, "profile", "email"},
	}

	verifier := provider.Verifier(&oidc.Config{ClientID: clientID})

	return &OIDCConfig{
		Enabled:      true,
		IssuerURL:    issuerURL,
		ClientID:     clientID,
		ClientSecret: clientSecret,
		RedirectURI:  redirectURI,
		Provider:     provider,
		OAuth2Config: oauth2Config,
		Verifier:     verifier,
	}, nil
}

func (oc *OIDCConfig) GetAuthConfig() AuthConfig {
	if !oc.Enabled {
		return AuthConfig{OIDCEnabled: false}
	}

	return AuthConfig{
		OIDCEnabled: true,
		IssuerURL:   oc.IssuerURL,
		ClientID:    oc.ClientID,
		RedirectURI: oc.RedirectURI,
	}
}

func (oc *OIDCConfig) HandleLogin(c *gin.Context) {
	if !oc.Enabled {
		c.JSON(http.StatusBadRequest, gin.H{"error": "OIDC not enabled"})
		return
	}

	if oc.OAuth2Config == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{
			"error": "OIDC provider not available",
			"message": "OIDC is configured but the identity provider is not reachable. Please check your OIDC configuration.",
		})
		return
	}

	state, err := generateRandomString(32)
	if err != nil {
		log.Printf("Failed to generate state: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate state"})
		return
	}

	nonce, err := generateRandomString(32)
	if err != nil {
		log.Printf("Failed to generate nonce: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate nonce"})
		return
	}

	authURL := oc.OAuth2Config.AuthCodeURL(state,
		oidc.Nonce(nonce),
		oauth2.SetAuthURLParam("response_type", "code"),
	)

	c.JSON(http.StatusOK, gin.H{
		"authUrl": authURL,
		"state":   state,
		"nonce":   nonce,
	})
}

func (oc *OIDCConfig) HandleCallback(c *gin.Context) {
	if !oc.Enabled {
		c.JSON(http.StatusBadRequest, gin.H{"error": "OIDC not enabled"})
		return
	}

	if oc.OAuth2Config == nil || oc.Verifier == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{
			"error": "OIDC provider not available",
			"message": "OIDC is configured but the identity provider is not reachable. Please check your OIDC configuration.",
		})
		return
	}

	code := c.Query("code")
	state := c.Query("state")

	if code == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Missing authorization code"})
		return
	}

	if state == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Missing state parameter"})
		return
	}

	oauth2Token, err := oc.OAuth2Config.Exchange(c.Request.Context(), code)
	if err != nil {
		log.Printf("Failed to exchange code for token: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to exchange code for token"})
		return
	}

	rawIDToken, ok := oauth2Token.Extra("id_token").(string)
	if !ok {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "No id_token field in oauth2 token"})
		return
	}

	idToken, err := oc.Verifier.Verify(c.Request.Context(), rawIDToken)
	if err != nil {
		log.Printf("Failed to verify ID token: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to verify ID token"})
		return
	}

	var claims struct {
		Email    string `json:"email"`
		Name     string `json:"name"`
		Username string `json:"preferred_username"`
	}

	if err := idToken.Claims(&claims); err != nil {
		log.Printf("Failed to parse claims: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to parse claims"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"access_token": oauth2Token.AccessToken,
		"id_token":     rawIDToken,
		"user": gin.H{
			"email":    claims.Email,
			"name":     claims.Name,
			"username": claims.Username,
		},
	})
}

func (oc *OIDCConfig) ValidateToken(ctx context.Context, token string) (bool, error) {
	if !oc.Enabled {
		return false, fmt.Errorf("OIDC not enabled")
	}

	if oc.Verifier == nil {
		return false, fmt.Errorf("OIDC provider not available")
	}

	_, err := oc.Verifier.Verify(ctx, token)
	if err != nil {
		return false, err
	}

	return true, nil
}

func generateRandomString(length int) (string, error) {
	bytes := make([]byte, length)
	if _, err := rand.Read(bytes); err != nil {
		return "", err
	}
	return base64.URLEncoding.EncodeToString(bytes)[:length], nil
}
