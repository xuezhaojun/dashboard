# Architecture

The OCM Dashboard follows a modern architecture pattern for Kubernetes dashboards:

- **Frontend**: React 19 + TypeScript SPA with Material UI 7 and real-time updates
- **Backend**: Go API service that connects to the Kubernetes API for OCM resources
- **Build System**: Simplified Makefile with clear development and production workflows

## Frontend Components

- **Authentication**: Bearer token authentication (JWT) stored in localStorage
- **Overview Page**: High-level KPIs for clusters, cluster sets, and placements
- **Cluster List & Detail**: Table view and detail drawer for clusters, including status, version, claims, and addons
- **Placement List & Detail**: Table view and detail drawer for placements, including status, predicates, and decisions
- **ClusterSet List & Detail**: Table view and detail drawer for ManagedClusterSets, including cluster and binding counts
- **ManifestWorks List**: View manifest works for clusters, including manifest and condition details
- **Addons List**: View managed cluster addons, including status, registrations, and supported configs
- **Login Page**: Token-based login with development mode support
- **Layout**: Responsive layout with navigation drawer and app bar
- **API Service Layer**: Abstraction for backend communication using `fetch`

## Backend Components

- **API Server**: Go service built with Gin, providing endpoints for OCM resources:
  - `GET /api/clusters` - List all ManagedClusters
  - `GET /api/clusters/:name` - Get details for a specific ManagedCluster
  - `GET /api/clustersets` - List all ManagedClusterSets
  - `GET /api/clustersets/:name` - Get details for a specific ManagedClusterSet
  - `GET /api/clustersetbindings` - List all ManagedClusterSetBindings
  - `GET /api/clustersetbindings/:namespace` - List bindings in a namespace
  - `GET /api/clustersetbindings/:namespace/:name` - Get a specific binding
  - `GET /api/placements` - List all Placements
  - `GET /api/placements/:namespace` - List Placements in a namespace
  - `GET /api/placements/:namespace/:name` - Get a specific Placement
  - `GET /api/placements/:namespace/:name/decisions` - Get PlacementDecisions for a Placement
  - `GET /api/manifestworks/:namespace` - List ManifestWorks in a namespace (cluster)
  - `GET /api/manifestworks/:namespace/:name` - Get a specific ManifestWork
  - `GET /api/addons/:name` - List all Addons for a cluster
  - `GET /api/addons/:name/:addonName` - Get a specific Addon for a cluster
  - `GET /api/stream/clusters` - SSE endpoint for real-time ManagedCluster updates
- **Authentication**: Basic authorization header check. TokenReview validation is a TODO. Can be bypassed with `DASHBOARD_BYPASS_AUTH=true`.
- **Kubernetes Client**: Uses `client-go` to interact with the Kubernetes API for OCM resources (ManagedCluster, ManagedClusterSet, Placement, ManifestWork, Addon, etc.)
- **Mock Data Mode**: Supports running with mock data for development via `DASHBOARD_USE_MOCK=true`.

For detailed API documentation, see the [API Reference](api-reference.md).

---

# Current Features

**Frontend:**

- Read-only view of clusters, placements, cluster sets, manifest works, and addons
- Table and detail views for all major OCM resources
- Real-time cluster status updates via SSE
- Authentication flow with token support (bearer token in localStorage)
- Responsive UI with Material UI components
- Overview dashboard with KPIs
- Error handling and loading states

**Backend:**

- API endpoints for all major OCM resources (Clusters, ClusterSets, ClusterSetBindings, Placements, ManifestWorks, Addons)
- Placement and PlacementDecision support
- ManifestWork and Addon support
- SSE endpoint for streaming cluster updates
- Kubernetes client integration using `client-go`
- Support for in-cluster and out-of-cluster kubeconfig
- CORS configured for broad access (e.g. `*`)
- Debug mode (`DASHBOARD_DEBUG=true`) and mock data mode (`DASHBOARD_USE_MOCK=true`)
