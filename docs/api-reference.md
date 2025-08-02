# API Reference

The OCM Dashboard API provides RESTful endpoints for accessing Open Cluster Management (OCM) resources. The API supports bearer token authentication for secure access, with an optional mock mode available for development and testing purposes.

## Authentication

The API uses bearer token authentication. Include your authentication token in the `Authorization` header:

```
Authorization: Bearer <your-token>
```

For development purposes, authentication can be bypassed by setting the environment variable `DASHBOARD_BYPASS_AUTH=true`. Additionally, the API supports a mock data mode that can be enabled with `DASHBOARD_USE_MOCK=true`, which provides sample data without requiring a live Kubernetes cluster connection.

For complete configuration options, see the [configuration guide](configuration.md).

## Endpoints

| **Method** | **Path** | **Description** |
|------------|----------|----------------|
| GET | `/api/clusters` | List all ManagedClusters |
| GET | `/api/clusters/:name` | Get details for a specific ManagedCluster |
| GET | `/api/clustersets` | List all ManagedClusterSets |
| GET | `/api/clustersets/:name` | Get details for a specific ManagedClusterSet |
| GET | `/api/clustersetbindings` | List all ManagedClusterSetBindings |
| GET | `/api/clustersetbindings/:namespace` | List bindings in a namespace |
| GET | `/api/clustersetbindings/:namespace/:name` | Get a specific binding |
| GET | `/api/placements` | List all Placements |
| GET | `/api/placements/:namespace` | List Placements in a namespace |
| GET | `/api/placements/:namespace/:name` | Get a specific Placement |
| GET | `/api/placements/:namespace/:name/decisions` | Get PlacementDecisions for a Placement |
| GET | `/api/manifestworks/:namespace` | List ManifestWorks in a namespace (cluster) |
| GET | `/api/manifestworks/:namespace/:name` | Get a specific ManifestWork |
| GET | `/api/addons/:name` | List all Addons for a cluster |
| GET | `/api/addons/:name/:addonName` | Get a specific Addon for a cluster |
| GET | `/api/stream/clusters` | SSE endpoint for real-time ManagedCluster updates |
