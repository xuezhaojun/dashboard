# Make Targets

This document describes all available Make targets for the OCM Dashboard project.

## Quick Reference

Run `make help` to see all available targets with descriptions.

## Available Make Targets

### Development Targets

- `dev`: Run frontend development server with hot reload
- `run-uiserver`: Run UI server (serves built frontend via Go server)
- `run-apiserver`: Run API server with development settings (mock mode)
- `run-apiserver-real`: Run API server with real Kubernetes connection
- `debug-apiserver`: Run API server in debug mode

### Build Targets

- `all`: Default target - build all components (same as `build`)
- `build`: Build all components (UI, UI server, and API server)
- `ui`: Build frontend only
- `apiserver`: Build API server only
- `uiserver`: Build UI server only

### Dependency Management

- `install`: Install all dependencies (Go modules + npm packages)
- `install-deps`: Install Go dependencies for both servers
- `install-ui-deps`: Install npm dependencies for frontend

### Docker Targets

- `docker-build-local`: Build Docker images for local development (single arch)
- `docker-build`: Build multi-arch Docker images (for CI/CD)
- `docker-push`: Build and push multi-arch Docker images to registry
- `docker`: Legacy alias for `docker-build-local`
- `setup-buildx`: Setup Docker buildx for multi-arch builds

### Testing Targets

- `test`: Run all tests (frontend + backend)
- `test-ui`: Run frontend tests
- `test-apiserver`: Run API server tests
- `test-uiserver`: Run UI server tests
- `lint`: Run linters for all components

### Utility Targets

- `clean`: Clean build artifacts and binaries
- `help`: Show detailed help with all available targets

## Environment Variables

The following environment variables can be used to customize builds:

- `VERSION`: Image version tag (default: `latest`)
- `REGISTRY`: Docker registry (default: `quay.io/open-cluster-management`)
- `PLATFORMS`: Build platforms for multi-arch (default: `linux/amd64,linux/arm64`)
- `GOOS`: Target OS for Go builds (default: auto-detected)
- `GOARCH`: Target architecture for Go builds (default: auto-detected)

## Examples

### Development Workflow

```bash
# Install dependencies
make install

# Start frontend development server
make dev

# Build everything
make build

# Run tests
make test
```

### Docker Workflow

```bash
# Build for local development
make docker-build-local

# Build and push to registry
make docker-push
```

### Component-specific Builds

```bash
# Build only frontend
make ui

# Build only API server
make apiserver

# Build only UI server
make uiserver
```
