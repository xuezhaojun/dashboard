# Setup & Development

## Prerequisites

- Node.js 18+ and npm
- Go 1.22+ (for backend development)
- Docker with buildx support (for building images)
- Access to a Kubernetes cluster with OCM installed (for backend integration)
- Make (for using the Makefile commands)

For detailed environment configuration, refer to [environment variables](configuration.md).

## Quick Start

```bash
# Install all dependencies
make install

# Start frontend development server
make dev

# View all available commands
make help
```

## Frontend Development

### Development Server

```bash
# Install dependencies and run development server
make install-ui-deps
make dev

# Or directly with npm:
npm install
npm run dev
```

Open your browser at the URL shown in the terminal (usually http://localhost:5173)

### Building Frontend

```bash
# Build frontend for production
make ui

# Or directly with npm:
npm run build
```

## Backend Development

### API Server

```bash
# Run API server with mock data (recommended for development)
make run-apiserver

# Run API server with real Kubernetes connection
make run-apiserver-real

# Run API server with debugger
make debug-apiserver
```

### UI Server

```bash
# Run UI server (serves built frontend via Go server)
make run-uiserver
```

The UI server serves the built frontend files through a Go HTTP server, useful for testing the production build locally.

### Development Tips

- The `run-apiserver` target runs the debug script which sets appropriate environment variables for development
- You can modify the `debug.sh` script or set environment variables directly to change behavior (e.g., `KUBECONFIG` path, `PORT`)
- Use `run-apiserver-real` when you need to test against a real Kubernetes cluster

## Connecting Frontend to Backend

The frontend (`src/api/utils.ts`) is configured to connect to the backend API, typically running on `http://localhost:8080`.

- Ensure the backend server is running when developing the frontend
- The `VITE_API_BASE_URL` in `.env.development` (for frontend) should match the backend server address
- For development, the frontend dev server (port 5173) will proxy API requests to the backend (port 8080)

## Building Everything

```bash
# Build all components (frontend + backend)
make build

# Build specific components
make ui          # Frontend only
make apiserver   # API server only
make uiserver    # UI server only
```

## Testing

```bash
# Run all tests
make test

# Run specific test suites
make test-ui         # Frontend tests
make test-apiserver  # API server tests
make test-uiserver   # UI server tests

# Run linting
make lint
```

For more information about testing, see the [testing guide](testing.md).

## Docker Development

```bash
# Build Docker images for local development
make docker-build-local

# Setup multi-arch builder (one-time setup)
make setup-buildx

# Build multi-arch images
make docker-build
```

## Cleanup

```bash
# Clean build artifacts
make clean
```
