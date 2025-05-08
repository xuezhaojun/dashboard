# OCM Dashboard

A dashboard for displaying and monitoring Open Cluster Management (OCM) clusters.

## Architecture

The OCM Dashboard follows a modern architecture pattern for Kubernetes dashboards:

- **Frontend**: React + TypeScript SPA with real-time updates
- **Backend** (to be implemented): Go API service that connects to the Kubernetes API

![Architecture Diagram](https://mermaid.ink/img/pako:eNqNkctqwzAQRX9lmFUCtiHtplAw2LjEdJVlkYUwY40tVaOJJdmy-6D_XtlxIE3bQjca5p47nJEGa26AMKwkL4VsuUK4cCAEtuBO63euw0aAgtZQS3wV1tJ6g9-1pI4pwbRr2oxwGgE0mYZr3UnXUfOCrthzfXrQ2yzSoJzAD-JCGCVD-y9dxZxJU91Y50VlsfgZbXfMSWsQ3NzXiY73_QcPT_Dx-PoSFbKVcS1dLPtI9gqrVhvU3lEpnrU9j7YwzV2lEUPT8Mq6uOYHkiRJGI5GJI6z-TSYcg_VsJ5xfzYJ4qNIgjNm6TTK8uQYBPvpNMjG433OxbMeJhGGnGrSQ2Mw5JbXEHoeNkZ3GOqmgcpzxNQYA5xpiDqX-Puf93stxeFNHdnPbxY00Wc?type=png)

### Frontend Components

1. **Authentication**: Bearer token authentication (JWT) stored in localStorage
2. **ClusterList**: Table view with real-time status updates via Server-Sent Events
3. **ClusterDetail**: Detailed view of a single cluster with conditions and labels
4. **API Service**: Abstraction layer for backend communication

### Backend Components (Planned)

1. **API Server**: Go service with the following endpoints:
   - `GET /api/clusters` - List all clusters
   - `GET /api/clusters/:name` - Get details for a specific cluster
   - `GET /api/stream/clusters` - SSE endpoint for real-time updates
2. **Authentication**: Token validation against Kubernetes TokenReview API
3. **Kubernetes Client**: Uses client-go to interact with the OCM hub's API

## Current Features

- Read-only view of clusters
- Table displaying cluster name, status, version, and nodes
- Detailed view for individual clusters
- Authentication flow with token support
- Preparation for real-time updates via SSE

## Setup & Development

### Prerequisites

- Node.js 16+ and npm/pnpm
- Go 1.22+ (for backend development)
- Access to a Kubernetes cluster with OCM installed (for backend integration)

### Frontend Development

1. Install dependencies:

```bash
npm install
```

2. Start the development server:

```bash
npm run dev
```

3. Open your browser at the URL shown in the terminal (usually http://localhost:5173)

### Backend Integration (Coming Soon)

The frontend is designed to connect to a Go backend that will be implemented in a separate repository. The backend will:

1. Connect to the Kubernetes API using client-go
2. Authenticate users via TokenReview
3. Provide RESTful endpoints for listing and viewing clusters
4. Stream real-time updates using Server-Sent Events

## Building for Production

```bash
npm run build
```

## RBAC Requirements (For Backend)

For the backend to function correctly, it will need RBAC permissions to:

1. List, get, and watch ManagedCluster resources
2. Perform token reviews for authentication

Example RBAC configuration:

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
    resources: ["managedclusters"]
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

## Next Steps

1. Implement the Go backend with real API endpoints
2. Connect the frontend to the backend
3. Implement real-time updates using SSE
4. Create a Helm chart for deployment
5. Add unit and integration tests
