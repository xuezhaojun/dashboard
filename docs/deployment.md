# Building for Production

## Build Application

```bash
# Build all components (UI, UI server, and API server)
make build

# Build specific components
make ui          # Frontend only
make apiserver   # API server only
make uiserver    # UI server only
```

## Docker Images

The project builds two separate Docker images:

- **API Image**: `dashboard-api` (Go backend)
- **UI Image**: `dashboard-ui` (React frontend with nginx)

### Configuration Variables

You can customize the build process using these variables:

- `VERSION`: Docker image tag (default: `latest`)
- `REGISTRY`: Docker registry (default: `quay.io/open-cluster-management`)
- `API_IMAGE_NAME`: API image name (default: `dashboard-api`)
- `UI_IMAGE_NAME`: UI image name (default: `dashboard-ui`)
- `PLATFORMS`: Target platforms (default: `linux/amd64,linux/arm64`)

### Using Make (Recommended)

```bash
# Setup Docker buildx for multi-arch builds (first time only)
make setup-buildx

# Build both images for local testing (single architecture)
make docker-build-local

# Build both images for production (multi-architecture)
make docker-build

# Build and push both images to registry
make docker-push

# Build with custom configuration
make docker-push VERSION=v1.0.0
make docker-push REGISTRY=myregistry.io/myorg VERSION=dev
make docker-build PLATFORMS=linux/amd64
```

### Docker Build Workflow

1. **Local Development**: Use `make docker-build-local` for single-arch builds that load into local Docker
2. **CI/CD Pipeline**: Use `make docker-build` for multi-arch builds without loading
3. **Release**: Use `make docker-push` to build and push multi-arch images to registry

### Available Make Targets

For a complete list of Make targets, run `make help` or see the [Make Targets reference](make-targets.md).

Key build and deployment targets:

**Development Targets:**
- `dev`: Run frontend development server
- `run-uiserver`: Run UI server (serves built frontend)
- `run-apiserver`: Run API server with development settings
- `run-apiserver-real`: Run API server with real Kubernetes connection
- `debug-apiserver`: Run API server in debug mode

**Build Targets:**
- `build`: Build all components
- `ui`: Build frontend only
- `apiserver`: Build API server only
- `uiserver`: Build UI server only

**Docker Targets:**
- `docker-build-local`: Build images for local development
- `docker-build`: Build multi-arch images
- `docker-push`: Build and push multi-arch images
- `setup-buildx`: Setup multi-arch builder

# Deployment

## Helm Chart Deployment

Deploy using Helm chart:

```bash
# Add OCM Helm repository
helm repo add ocm https://open-cluster-management.io/helm-charts
helm repo update

# Install OCM Dashboard
helm install ocm-dashboard ocm/ocm-dashboard \
  --namespace ocm-dashboard \
  --create-namespace

# Install with custom values
helm install ocm-dashboard ocm/ocm-dashboard \
  --namespace ocm-dashboard \
  --create-namespace \
  --set image.tag=latest \
  --set dashboard.env.DASHBOARD_BYPASS_AUTH=true

# Install with custom image
helm install ocm-dashboard ./charts/ocm-dashboard \
  --set api.image.registry=quay.io \
  --set api.image.repository=zhaoxue/dashboard-api \
  --set api.image.tag=latest \
  --set api.image.pullPolicy=Always \
  --set ui.image.registry=quay.io \
  --set ui.image.repository=zhaoxue/dashboard-ui \
  --set ui.image.tag=latest \
  --set ui.image.pullPolicy=Always \
  --namespace open-cluster-management-dashboard \
  --create-namespace

# Upgrade existing installation
helm upgrade ocm-dashboard ocm/ocm-dashboard \
  --namespace ocm-dashboard

# Access via port-forward
kubectl port-forward -n open-cluster-management-dashboard service/ocm-dashboard 3000:80
```

For development with local chart:

```bash
# Install from local chart
helm install ocm-dashboard ./charts/ocm-dashboard \
  --namespace ocm-dashboard \
  --create-namespace

# Install with custom values file
helm install ocm-dashboard ./charts/ocm-dashboard \
  --namespace ocm-dashboard \
  --create-namespace \
  --values my-values.yaml
```

## Configuration

For deployment configuration including environment variables and RBAC requirements, see the [configuration guide](configuration.md).
