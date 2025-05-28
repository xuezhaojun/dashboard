# OCM Dashboard Docker & Helm Deployment Guide

This guide covers building, deploying, and running the OCM Dashboard using Docker and Helm, following CNCF best practices.

## 📋 Overview

The OCM Dashboard is packaged as a single Docker image that includes:

- **Frontend**: React + TypeScript SPA built with Vite
- **Backend**: Go API server with Gin framework
- **Static Assets**: Served by the backend at `/static`

## 🏗️ Architecture

The Docker build uses a multi-stage approach:

1. **Frontend Builder**: Node.js 22 Alpine image to build the React application
2. **Backend Builder**: Go 1.24 Alpine image to compile the Go binary
3. **Runtime**: Distroless static image for minimal attack surface

## 🚀 Quick Start

### Build and Run Locally

```bash
# Build the image
./docker-build.sh

# Run with Docker Compose
docker-compose up ocm-dashboard
```

### Development Mode

```bash
# Run with mock data (no Kubernetes cluster required)
docker-compose --profile dev up ocm-dashboard-dev
```

## 🔧 Build Options

### Using the Build Script

```bash
# Basic build
./docker-build.sh

# Build with custom tag
./docker-build.sh -t v1.0.0

# Build for multiple architectures
./docker-build.sh --multi-arch --push

# Build and push to registry
./docker-build.sh -r ghcr.io/myorg -t v1.0.0 --push
```

### Manual Docker Build

```bash
# Single architecture
docker build -t ocm-dashboard:latest .

# Multi-architecture (requires buildx)
docker buildx build --platform linux/amd64,linux/arm64 -t ocm-dashboard:latest .
```

## 🐳 Docker Compose

### Production Configuration

```yaml
services:
  ocm-dashboard:
    image: ocm-dashboard:latest
    ports:
      - "8080:8080"
    environment:
      - DASHBOARD_BYPASS_AUTH=false # Enable authentication
      - DASHBOARD_DEBUG=false
      - DASHBOARD_USE_MOCK=false
    volumes:
      - ~/.kube/config:/home/nonroot/.kube/config:ro
```

### Development Configuration

```yaml
services:
  ocm-dashboard-dev:
    image: ocm-dashboard:latest
    ports:
      - "8081:8080"
    environment:
      - DASHBOARD_USE_MOCK=true # Use mock data
      - DASHBOARD_DEBUG=true
      - DASHBOARD_BYPASS_AUTH=true
```

## ☸️ Helm Deployment

### Quick Deploy

```bash
# Add OCM Helm repository
helm repo add ocm https://open-cluster-management.io/helm-charts
helm repo update

# Install OCM Dashboard
helm install ocm-dashboard ocm/ocm-dashboard \
  --namespace ocm-dashboard \
  --create-namespace

# Check status
kubectl get pods -n ocm-dashboard

# Access the dashboard
kubectl port-forward -n ocm-dashboard svc/ocm-dashboard 8080:80
```

### Production Considerations

1. **RBAC**: The chart includes proper RBAC for OCM resources
2. **Security**: Runs as non-root user with read-only filesystem
3. **Resources**: Configured with appropriate resource limits
4. **Health Checks**: Liveness and readiness probes configured
5. **High Availability**: Pod anti-affinity for distribution

### Customization

Use Helm values to customize:

```bash
# Install with custom values
helm install ocm-dashboard ocm/ocm-dashboard \
  --namespace ocm-dashboard \
  --create-namespace \
  --set ingress.enabled=true \
  --set ingress.hosts[0].host=ocm-dashboard.example.com \
  --set dashboard.env.DASHBOARD_BYPASS_AUTH=false \
  --set replicaCount=3
```

Or create a `values.yaml` file:

```yaml
ingress:
  enabled: true
  hosts:
    - host: ocm-dashboard.example.com
      paths:
        - path: /
          pathType: Prefix

dashboard:
  env:
    DASHBOARD_BYPASS_AUTH: "false"

replicaCount: 3
```

## 🔒 Security Features

### Container Security

- **Distroless base image**: Minimal attack surface
- **Non-root user**: Runs as UID 65532 (nonroot)
- **Read-only filesystem**: Prevents runtime modifications
- **No shell**: Distroless images don't include shell
- **Capability dropping**: All Linux capabilities dropped

### Kubernetes Security

- **Security contexts**: Comprehensive security settings
- **RBAC**: Least-privilege access to OCM resources
- **Network policies**: Can be added for network isolation
- **Pod security standards**: Compatible with restricted PSS

## 📊 Monitoring and Observability

### Health Checks

The application exposes health endpoints:

- **Liveness**: `GET /api/clusters`
- **Readiness**: `GET /api/clusters`

### Metrics (Future)

Placeholder for Prometheus metrics at `/metrics` endpoint.

### Logging

Structured logging with configurable levels:

- `DASHBOARD_DEBUG=true`: Debug level logging
- `GIN_MODE=release`: Production logging

## 🔧 Configuration

### Environment Variables

| Variable                | Default   | Description                         |
| ----------------------- | --------- | ----------------------------------- |
| `PORT`                  | `8080`    | Server port                         |
| `GIN_MODE`              | `release` | Gin framework mode                  |
| `DASHBOARD_DEBUG`       | `false`   | Enable debug logging                |
| `DASHBOARD_USE_MOCK`    | `false`   | Use mock data instead of Kubernetes |
| `DASHBOARD_BYPASS_AUTH` | `false`   | Bypass authentication (dev only)    |

### Volume Mounts

- **Kubeconfig**: Mount at `/home/nonroot/.kube/config` for cluster access
- **Temp directory**: `/tmp` for temporary files

## 🚀 CI/CD

### GitHub Actions

The repository includes automated workflows:

- **Post Submit**: Builds and pushes images to `quay.io/open-cluster-management/ocm-dashboard` on merge
- **Release**: Creates versioned releases with images and Helm charts
- **Security**: Trivy vulnerability scanning
- **Signing**: Cosign image signing for supply chain security

### Image Registry

Images are published to: `quay.io/open-cluster-management/ocm-dashboard`

### Image Tags

- `latest`: Latest build from main branch
- `v*.*.*`: Semantic version releases
- `release-*`: Release branch builds
- `main-<sha>`: Commit-specific builds from main

### Helm Chart Repository

Helm charts are published to: https://open-cluster-management.io/helm-charts

## 🐛 Troubleshooting

### Common Issues

1. **Permission denied**: Ensure kubeconfig is readable by UID 65532
2. **Connection refused**: Check if Kubernetes cluster is accessible
3. **RBAC errors**: Verify the service account has proper permissions
4. **Build failures**: Ensure Docker buildx is available for multi-arch builds

### Debug Mode

Enable debug mode for troubleshooting:

```bash
docker run -e DASHBOARD_DEBUG=true -e DASHBOARD_USE_MOCK=true ocm-dashboard:latest
```

### Logs

View container logs:

```bash
# Docker
docker logs <container-id>

# Kubernetes
kubectl logs -n ocm-dashboard deployment/ocm-dashboard
```

## 📚 Best Practices

1. **Use specific tags**: Avoid `latest` in production
2. **Resource limits**: Always set CPU/memory limits
3. **Health checks**: Configure appropriate timeouts
4. **Security scanning**: Regularly scan images for vulnerabilities
5. **Image signing**: Verify image signatures in production
6. **Backup**: Backup kubeconfig and configuration files

## 🔗 Related Files

- [`Dockerfile`](./Dockerfile) - Multi-stage Docker build
- [`docker-compose.yml`](./docker-compose.yml) - Local development setup
- [`charts/ocm-dashboard/`](./charts/ocm-dashboard/) - Helm chart
- [`docker-build.sh`](./docker-build.sh) - Local build script
- [`.dockerignore`](./.dockerignore) - Build context exclusions
- [`.github/workflows/post-submit.yml`](./.github/workflows/post-submit.yml) - Post-merge CI/CD
- [`.github/workflows/release.yml`](./.github/workflows/release.yml) - Release workflow
