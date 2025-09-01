# Configuration

## Environment Variables

### Backend Configuration

- `DASHBOARD_USE_MOCK`: Enable mock data mode (default: `false`)
- `DASHBOARD_DEBUG`: Enable debug logging (default: `false`)
- `DASHBOARD_BYPASS_AUTH`: Bypass authentication (default: `false`)
- `PORT`: Server port (default: `8080`)
- `KUBECONFIG`: Path to kubeconfig file (for out-of-cluster access)

#### OIDC Configuration

- `DASHBOARD_OIDC_ENABLED`: Enable OIDC authentication (default: `false`)
- `DASHBOARD_OIDC_ISSUER_URL`: OIDC provider issuer URL (e.g., `https://keycloak.example.com/auth/realms/myrealm`)
- `DASHBOARD_OIDC_CLIENT_ID`: OIDC client ID
- `DASHBOARD_OIDC_CLIENT_SECRET`: OIDC client secret
- `DASHBOARD_OIDC_REDIRECT_URI`: OIDC redirect URI (default: `http://localhost:3000/auth/callback`)

### Frontend Configuration

- `VITE_API_BASE_URL`: Backend API URL (default: `http://localhost:8080`)

### Build Configuration

The following environment variables can be used to customize Docker builds:

- `VERSION`: Docker image tag (default: `latest`)
- `REGISTRY`: Docker registry (default: `quay.io/open-cluster-management`)
- `API_IMAGE_NAME`: API image name (default: `dashboard-api`)
- `UI_IMAGE_NAME`: UI image name (default: `dashboard-ui`)
- `PLATFORMS`: Target platforms for multi-arch builds (default: `linux/amd64,linux/arm64`)
- `GOOS`: Target OS for Go builds (default: auto-detected)
- `GOARCH`: Target architecture for Go builds (default: auto-detected)

Example usage:
```bash
# Build with custom version and registry
make docker-push VERSION=v1.0.0 REGISTRY=myregistry.io/myorg

# Build for specific platform
make docker-build PLATFORMS=linux/amd64
```

---

## RBAC Requirements (For Backend)

For the backend to function correctly, it will need RBAC permissions to:

1. List, get, and watch all OCM resources (ManagedCluster, ManagedClusterSet, ManagedClusterSetBinding, Placement, ManifestWork, Addon, etc.)
2. Perform token reviews for authentication

<details>
<summary>Example RBAC configuration</summary>

```yaml
apiVersion: v1
kind: ServiceAccount
metadata:
  name: ocm-dashboard
  namespace: ocm-dashboard
---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: ocm-dashboard-reader
rules:
  - apiGroups: ["cluster.open-cluster-management.io"]
    resources:
      [
        "managedclusters",
        "managedclustersets",
        "managedclustersetbindings",
        "placements",
        "placementdecisions",
        "manifestworks",
        "managedclusteraddons",
      ]
    verbs: ["get", "list", "watch"]
  - apiGroups: ["authentication.k8s.io"]
    resources: ["tokenreviews"]
    verbs: ["create"]
---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: ocm-dashboard-reader-binding
subjects:
  - kind: ServiceAccount
    name: ocm-dashboard
    namespace: ocm-dashboard
roleRef:
  kind: ClusterRole
  name: ocm-dashboard-reader
  apiGroup: rbac.authorization.k8s.io
```

</details>
