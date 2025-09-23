# OIDC Integration Testing Guide

This document provides a comprehensive guide for testing OIDC (OpenID Connect) login functionality in the OCM Dashboard with Dex as the identity provider in a kind cluster environment.

## Overview

The OCM Dashboard now supports dual authentication methods:
- **OIDC Authentication**: Integration with identity providers like Dex, Keycloak
- **Bearer Token Authentication**: Traditional Kubernetes token-based authentication (backward compatible)

## Prerequisites

- Docker installed and running
- kubectl configured
- Helm 3.x installed
- kind cluster management tool
- Go 1.21+ and Node.js 18+ for local development

## Environment Setup

### 1. Create Kind Cluster

```bash
# Create kind cluster for OCM hub
kind create cluster --name ocm-hub

# Verify cluster is running
kubectl cluster-info --context kind-ocm-hub
```

### 2. Initialize OCM Hub

```bash
# Install clusteradm
curl -L https://raw.githubusercontent.com/open-cluster-management-io/clusteradm/main/install.sh | bash

# Initialize OCM hub
clusteradm init --wait --context kind-ocm-hub

# Get join command for managed clusters (optional)
clusteradm get token --context kind-ocm-hub
```

### 3. Install Dex OIDC Provider

```bash
# Add Dex Helm repository
helm repo add dex https://charts.dexidp.io
helm repo update

# Create dex namespace
kubectl create namespace dex
```

## Configuration Files

### Dex Configuration (`dex-values.yaml`)

```yaml
config:
  issuer: http://localhost:5556
  staticClients:
    - id: ocm-dashboard
      redirectURIs:
        - 'http://localhost:3000/auth/callback'
      name: 'OCM Dashboard'
      secret: dashboard-secret
  storage:
    type: kubernetes
    config:
      inCluster: true
  web:
    http: 0.0.0.0:5556
    allowedOrigins:
      - http://localhost:3000
  frontend:
    issuer: 'OCM Test Dex'
  connectors:
    - type: mockCallback
      id: mock
      name: Mock Login
```

### Dashboard OIDC Configuration (`dashboard-oidc-values.yaml`)

```yaml
api:
  image:
    registry: "docker.io/library"
    repository: "dashboard-api"
    tag: "latest"
    pullPolicy: Never
  extraEnv:
    - name: DASHBOARD_OIDC_ENABLED
      value: "true"
    - name: DASHBOARD_OIDC_ISSUER_URL
      value: "http://localhost:5556"
    - name: DASHBOARD_OIDC_CLIENT_ID
      value: "ocm-dashboard"
    - name: DASHBOARD_OIDC_CLIENT_SECRET
      value: "dashboard-secret"
    - name: DASHBOARD_OIDC_REDIRECT_URI
      value: "http://localhost:3000/auth/callback"
    - name: DASHBOARD_BYPASS_AUTH
      value: "false"

ui:
  image:
    registry: "docker.io/library"
    repository: "dashboard-ui"
    tag: "latest"
    pullPolicy: Never
```

## Deployment Steps

### 1. Build Dashboard Images

```bash
# Navigate to dashboard repository
cd /path/to/dashboard

# Build local Docker images
make docker-build-local

# Load images into kind cluster
kind load docker-image dashboard-api:latest --name ocm-hub
kind load docker-image dashboard-ui:latest --name ocm-hub
```

### 2. Deploy Dex

```bash
# Install Dex with custom configuration
helm install dex dex/dex \
  --namespace dex \
  --values dex-values.yaml

# Wait for Dex to be ready
kubectl wait --for=condition=available --timeout=300s deployment/dex -n dex
```

### 3. Deploy OCM Dashboard

```bash
# Create dashboard namespace
kubectl create namespace ocm-dashboard

# Install dashboard with OIDC configuration
helm install ocm-dashboard ./charts/ocm-dashboard \
  --namespace ocm-dashboard \
  --values dashboard-oidc-values.yaml

# Wait for dashboard to be ready
kubectl wait --for=condition=available --timeout=300s deployment/ocm-dashboard -n ocm-dashboard
```

## Network Configuration

### Port Forwarding Setup

The key to resolving CORS issues is proper port forwarding configuration:

```bash
# Terminal 1: Forward Dex service
kubectl port-forward -n dex svc/dex 5556:5556 &

# Terminal 2: Forward Dashboard UI
kubectl port-forward -n ocm-dashboard svc/ocm-dashboard 3000:80 &

# Terminal 3: Forward Dashboard API
kubectl port-forward -n ocm-dashboard svc/ocm-dashboard 8080:8080 &
```

### Verification Commands

```bash
# Verify Dex OIDC discovery endpoint
curl -s http://localhost:5556/.well-known/openid_configuration | jq .

# Verify dashboard auth configuration
curl http://localhost:8080/api/auth/config

# Expected response:
# {
#   "oidcEnabled": true,
#   "issuerUrl": "http://localhost:5556",
#   "clientId": "ocm-dashboard",
#   "redirectUri": "http://localhost:3000/auth/callback"
# }
```

## Testing Procedures

### 1. OIDC Login Flow Test

1. **Access Login Page**
   - Navigate to `http://localhost:3000/login`
   - Verify both "Sign in with OIDC" and Bearer token options are visible

2. **Initiate OIDC Login**
   - Click "Sign in with OIDC" button
   - Should redirect to Dex authorization page at `http://localhost:5556`

3. **Complete Authentication**
   - On Dex page, click "Grant Access" to approve permissions
   - Should redirect back to dashboard overview page

4. **Verify Authentication**
   - Check that you can access dashboard features
   - Navigate to different pages (Clusters, Placements, etc.)

### 2. Bearer Token Authentication Test

1. **Prepare Test Token**
   ```bash
   # Create service account for testing
   kubectl create serviceaccount dashboard-test -n default
   kubectl create clusterrolebinding dashboard-test-binding \
     --clusterrole=cluster-admin \
     --serviceaccount=default:dashboard-test
   
   # Get token (Kubernetes 1.24+)
   kubectl create token dashboard-test --duration=24h
   ```

2. **Test Bearer Token Login**
   - Navigate to `http://localhost:3000/login`
   - Paste the token in the Bearer token field
   - Click "Sign in with Token"
   - Verify successful authentication

### 3. Browser Console Verification

Open browser developer tools (F12) and check:
- **Network Tab**: No failed requests to OIDC endpoints
- **Console Tab**: No CORS policy violation errors
- **Application Tab**: Verify OIDC tokens are stored correctly

## Troubleshooting

### Common Issues and Solutions

#### 1. CORS Policy Violations

**Symptoms**: Browser console shows CORS errors when accessing Dex endpoints

**Solution**: Ensure proper port forwarding and CORS configuration:
```yaml
# In dex-values.yaml
web:
  allowedOrigins:
    - http://localhost:3000
```

#### 2. Connection Refused Errors

**Symptoms**: `net::ERR_CONNECTION_REFUSED` when accessing OIDC endpoints

**Solution**: Verify port forwarding is active:
```bash
# Check running port-forward processes
ps aux | grep port-forward

# Restart if needed
kubectl port-forward -n dex svc/dex 5556:5556 &
```

#### 3. Image Pull Errors

**Symptoms**: Pods stuck in `ImagePullBackOff` state

**Solution**: Ensure images are built and loaded into kind cluster:
```bash
make docker-build-local
kind load docker-image dashboard-api:latest --name ocm-hub
kind load docker-image dashboard-ui:latest --name ocm-hub
```

#### 4. Service Discovery Issues

**Symptoms**: Dashboard cannot connect to Dex service

**Solution**: Verify service endpoints and DNS resolution:
```bash
kubectl get endpoints dex -n dex
kubectl get svc dex -n dex
```

## Test Results

### Successful OIDC Login Flow

The following screenshots demonstrate successful OIDC integration:

#### 1. Login Page with Dual Authentication
![Login Page](../screenshots/localhost_3000_login_073216.png)
*Shows both OIDC and Bearer token authentication options*

#### 2. Dex Authorization Page
![Dex Authorization](../screenshots/localhost_5556_073059.png)
*Dex consent screen requesting permissions for OCM Dashboard*

#### 3. Authenticated Dashboard Overview
![Dashboard Overview](../screenshots/localhost_3000_073143.png)
*Successfully authenticated and accessing dashboard features*

### Verification Checklist

- [x] OIDC login redirects to Dex authorization page
- [x] Dex authorization completes without errors
- [x] Successful redirect back to dashboard
- [x] Dashboard overview page accessible after OIDC login
- [x] Bearer token authentication still functional
- [x] No CORS errors in browser console
- [x] OIDC discovery endpoint accessible
- [x] Dashboard auth configuration correct

## Security Considerations

### Production Deployment

For production environments, consider:

1. **TLS/HTTPS Configuration**
   - Use proper TLS certificates for all endpoints
   - Configure HTTPS redirects

2. **Secret Management**
   - Store OIDC client secrets in Kubernetes secrets
   - Use proper RBAC for service accounts

3. **Network Policies**
   - Implement network policies to restrict pod-to-pod communication
   - Use ingress controllers instead of port forwarding

4. **Token Validation**
   - Configure proper token validation and refresh
   - Set appropriate token expiration times

## Conclusion

The OIDC integration has been successfully implemented and tested. The dual authentication approach provides:

- **Flexibility**: Users can choose between OIDC and Bearer token authentication
- **Backward Compatibility**: Existing Bearer token workflows remain unchanged
- **Security**: Proper OIDC implementation with PKCE and secure token handling
- **Scalability**: Easy integration with various identity providers

The testing demonstrates that CORS issues have been resolved through proper network configuration, and both authentication methods work reliably in the kind cluster environment.
