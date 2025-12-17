# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

The OCM Dashboard is a web-based interface for monitoring and managing Open Cluster Management (OCM) resources including clusters, placements, cluster sets, manifest works, and addons.

**Requirements**: Node.js ≥22.0.0, Go ≥1.23

## Architecture

**Frontend**: React + TypeScript SPA with Material-UI, built with Vite
**Backend**: Go API server using Gin framework, connecting to Kubernetes API via client-go
**Deployment**: Two separate Docker images (API server + UI), deployable via Helm chart

### Component Structure

- **apiserver/**: Go backend API server (`main.go:22`)
  - RESTful API endpoints for OCM resources
  - Kubernetes client integration via `client-go`
  - SSE streaming for real-time updates (`/api/stream/clusters`)
  - Authentication via Bearer token validation

- **src/**: React frontend
  - **api/**: Service layer for backend communication (`src/api/utils.ts:5`)
  - **components/**: React components for different resource views
  - **hooks/**: Custom React hooks for data fetching

- **uiserver/**: Go server serving built frontend assets
- **charts/**: Helm chart for Kubernetes deployment

## Key Development Commands

### Frontend Development
```bash
npm install          # Install dependencies
npm run dev          # Start Vite dev server (localhost:5173)
npm run build        # Build for production
npm run lint         # ESLint check
make dev             # Alternative via make (same as npm run dev)
```

### Backend Development
```bash
make run-apiserver          # API server with mock data
make run-apiserver-real     # API server with real K8s connection
make debug-apiserver        # API server with debugger
make run-uiserver           # UI server (serves built frontend)
```

### Testing & Building
```bash
make test                   # Run all tests
make test-ui                # Frontend tests
make test-apiserver         # Go backend tests
make test-uiserver          # UI server tests
make lint                   # Run linting (ESLint + go vet)
make build                  # Build all components
make docker-build-local     # Build local Docker images
```

### Docker Operations
```bash
make docker-build           # Build multi-arch images
make docker-push            # Build and push to registry
make setup-buildx           # Setup buildx for multi-arch builds
```

## Environment Variables

**Backend (apiserver):**
- `DASHBOARD_USE_MOCK=true` - Use mock data for development
- `DASHBOARD_DEBUG=true` - Enable debug logging
- `DASHBOARD_BYPASS_AUTH=true` - Skip authentication
- `PORT=8080` - Server port
- `KUBECONFIG=path` - Path to kubeconfig file

**Frontend:**
- `VITE_API_BASE_URL=http://localhost:8080` - Backend API URL

## API Endpoints

Core endpoints for OCM resources:
- `GET /api/clusters` - List ManagedClusters
- `GET /api/clusters/:name` - Get cluster details
- `GET /api/clustersets` - List ManagedClusterSets
- `GET /api/placements` - List Placements
- `GET /api/manifestworks/:namespace` - List ManifestWorks
- `GET /api/addons/:name` - List cluster addons
- `GET /api/stream/clusters` - SSE for real-time updates

## Key Files & Patterns

- **Authentication**: Bearer token stored in localStorage (`src/api/utils.ts:6`)
- **API Client**: All API calls use `createHeaders()` for auth headers
- **Routing**: React Router for SPA navigation
- **State Management**: React hooks for data fetching
- **Styling**: Material-UI components
- **Build**: Vite for frontend, Go build for backend

## Development Workflow

1. **Setup**: `make install` (installs all dependencies)
2. **Frontend**: `npm run dev` (localhost:5173)
3. **Backend**: `make run-apiserver` (localhost:8080 with mock data)
4. **Access**: Open browser to frontend URL

### Quick Development Setup
```bash
# Install all dependencies
make install

# Run backend with mock data in one terminal
make run-apiserver

# Run frontend in another terminal
npm run dev
```

## Testing

### Running Tests
```bash
make test                    # Run all tests (frontend + backend)
make test-ui                 # Frontend tests only
make test-apiserver          # API server tests only
make test-uiserver           # UI server tests only
```

### Test Coverage
```bash
# Go test coverage
cd apiserver && go test -cover ./...
cd uiserver && go test -cover ./...
```

### Test Structure
- **Frontend**: Tests alongside components in `src/`, uses Vitest
- **Backend**: `*_test.go` files using Go's built-in testing framework
- **API Tests**: Located in `apiserver/pkg/handlers/*_test.go` and `apiserver/pkg/models/*_test.go`

## Deployment

- **Docker Images**: Separate API and UI images
- **Helm Chart**: `charts/ocm-dashboard/` for Kubernetes deployment
- **Registry**: Default `quay.io/open-cluster-management`
- **Multi-arch**: Supports linux/amd64 and linux/arm64

### Helm Deployment
```bash
helm install ocm-dashboard ./charts/ocm-dashboard \
  --namespace ocm-dashboard \
  --create-namespace
```