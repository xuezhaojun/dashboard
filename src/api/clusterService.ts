export interface Cluster {
  id: string;
  name: string;
  status: string;
  version?: string;
  nodes?: number;
  conditions?: {
    type: string;
    status: string;
    reason?: string;
    message?: string;
    lastTransitionTime?: string;
  }[];
  labels?: Record<string, string>;
  hubAccepted?: boolean;
  capacity?: Record<string, string>;
  allocatable?: Record<string, string>;
  clusterClaims?: {
    name: string;
    value: string;
  }[];
  taints?: {
    key: string;
    value?: string;
    effect: string;
  }[];
}

// Make sure we also export a type to avoid compiler issues
export type { Cluster as ClusterType };

// Backend API base URL - will be configurable for production
const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8080';

// Function to fetch the auth token - can be replaced with a proper auth system later
const getAuthToken = (): string => {
  return localStorage.getItem('authToken') || '';
};

// Helper to create headers with authorization
const createHeaders = (): HeadersInit => {
  const token = getAuthToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
};

// Fetch all clusters
export const fetchClusters = async (): Promise<Cluster[]> => {
  // Use mock data in development mode unless specifically requested to use real API
  if (import.meta.env.DEV && !import.meta.env.VITE_USE_REAL_API) {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve([
          {
            id: "mock-cluster-1",
            name: "mock-cluster-1",
            status: "Online",
            version: "4.12.0",
            nodes: 3,
            hubAccepted: true,
            labels: {
              vendor: "OpenShift",
              region: "us-east-1",
              env: "development"
            },
            capacity: {
              cpu: "12",
              memory: "32Gi"
            },
            allocatable: {
              cpu: "10",
              memory: "28Gi"
            },
            clusterClaims: [
              { name: "id.k8s.io", value: "mock-cluster-1" },
              { name: "kubeversion.open-cluster-management.io", value: "v1.25.0" }
            ],
            conditions: [
              {
                type: "ManagedClusterConditionAvailable",
                status: "True",
                reason: "ClusterAvailable",
                message: "Cluster is available",
                lastTransitionTime: new Date().toISOString()
              },
              {
                type: "ManagedClusterJoined",
                status: "True",
                reason: "ClusterJoined",
                message: "Cluster has joined the hub",
                lastTransitionTime: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
              }
            ]
          },
          {
            id: "mock-cluster-2",
            name: "mock-cluster-2",
            status: "Offline",
            version: "4.11.0",
            nodes: 5,
            hubAccepted: true,
            labels: {
              vendor: "OpenShift",
              region: "us-west-1",
              env: "staging"
            },
            capacity: {
              cpu: "24",
              memory: "64Gi"
            },
            allocatable: {
              cpu: "20",
              memory: "56Gi"
            },
            clusterClaims: [
              { name: "id.k8s.io", value: "mock-cluster-2" },
              { name: "kubeversion.open-cluster-management.io", value: "v1.24.0" }
            ],
            conditions: [
              {
                type: "ManagedClusterConditionAvailable",
                status: "False",
                reason: "ClusterOffline",
                message: "Cluster is not responding",
                lastTransitionTime: new Date().toISOString()
              }
            ],
            taints: [
              {
                key: "cluster.open-cluster-management.io/unavailable",
                effect: "NoSelect"
              }
            ]
          }
        ]);
      }, 800);
    });
  }

  try {
    const response = await fetch(`${API_BASE}/api/clusters`, {
      headers: createHeaders()
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching clusters:', error);
    return [];
  }
};

// Fetch a single cluster by name
export const fetchClusterByName = async (name: string): Promise<Cluster | null> => {
  // Use mock data in development mode unless specifically requested to use real API
  if (import.meta.env.DEV && !import.meta.env.VITE_USE_REAL_API) {
    return new Promise((resolve) => {
      setTimeout(() => {
        if (name === "mock-cluster-1") {
          resolve({
            id: "mock-cluster-1",
            name: "mock-cluster-1",
            status: "Online",
            version: "4.12.0",
            nodes: 3,
            hubAccepted: true,
            labels: {
              vendor: "OpenShift",
              region: "us-east-1",
              env: "development",
              tier: "gold"
            },
            capacity: {
              cpu: "12",
              memory: "32Gi"
            },
            allocatable: {
              cpu: "10",
              memory: "28Gi"
            },
            clusterClaims: [
              { name: "id.k8s.io", value: "mock-cluster-1" },
              { name: "kubeversion.open-cluster-management.io", value: "v1.25.0" },
              { name: "platform.open-cluster-management.io", value: "AWS" }
            ],
            conditions: [
              {
                type: "ManagedClusterConditionAvailable",
                status: "True",
                reason: "ClusterAvailable",
                message: "Cluster is available",
                lastTransitionTime: new Date().toISOString()
              },
              {
                type: "ManagedClusterJoined",
                status: "True",
                reason: "ClusterJoined",
                message: "Cluster has joined the hub",
                lastTransitionTime: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
              },
              {
                type: "HubAcceptedManagedCluster",
                status: "True",
                reason: "HubClusterAdminAccepted",
                message: "Cluster has been accepted by hub",
                lastTransitionTime: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
              }
            ]
          });
        } else if (name === "mock-cluster-2") {
          resolve({
            id: "mock-cluster-2",
            name: "mock-cluster-2",
            status: "Offline",
            version: "4.11.0",
            nodes: 5,
            hubAccepted: true,
            labels: {
              vendor: "OpenShift",
              region: "us-west-1",
              env: "staging",
              tier: "silver"
            },
            capacity: {
              cpu: "24",
              memory: "64Gi"
            },
            allocatable: {
              cpu: "20",
              memory: "56Gi"
            },
            clusterClaims: [
              { name: "id.k8s.io", value: "mock-cluster-2" },
              { name: "kubeversion.open-cluster-management.io", value: "v1.24.0" },
              { name: "platform.open-cluster-management.io", value: "GCP" }
            ],
            conditions: [
              {
                type: "ManagedClusterConditionAvailable",
                status: "False",
                reason: "ClusterOffline",
                message: "Cluster is not responding",
                lastTransitionTime: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
              },
              {
                type: "ManagedClusterJoined",
                status: "True",
                reason: "ClusterJoined",
                message: "Cluster has joined the hub",
                lastTransitionTime: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
              }
            ],
            taints: [
              {
                key: "cluster.open-cluster-management.io/unavailable",
                effect: "NoSelect"
              }
            ]
          });
        } else {
          resolve(null);
        }
      }, 800);
    });
  }

  try {
    const response = await fetch(`${API_BASE}/api/clusters/${name}`, {
      headers: createHeaders()
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`Error fetching cluster ${name}:`, error);
    return null;
  }
};

// SSE for real-time cluster updates
export const setupClusterEventSource = (
  onAdd: (cluster: Cluster) => void,
  onUpdate: (cluster: Cluster) => void,
  onDelete: (clusterId: string) => void,
  onError: (error: Event) => void
): () => void => {
  // Use no-op in development mode unless specifically requested to use real API
  if (import.meta.env.DEV && !import.meta.env.VITE_USE_REAL_API) {
    return () => {}; // Return no-op cleanup function
  }

  // Create EventSource for SSE
  const token = getAuthToken();
  const eventSource = new EventSource(
    `${API_BASE}/api/stream/clusters${token ? `?token=${token}` : ''}`
  );

  // Set up event listeners
  eventSource.addEventListener('ADDED', (event) => {
    const cluster = JSON.parse(event.data);
    onAdd(cluster);
  });

  eventSource.addEventListener('MODIFIED', (event) => {
    const cluster = JSON.parse(event.data);
    onUpdate(cluster);
  });

  eventSource.addEventListener('DELETED', (event) => {
    const clusterId = JSON.parse(event.data).id;
    onDelete(clusterId);
  });

  eventSource.addEventListener('error', onError);

  // Return cleanup function to close the SSE connection
  return () => {
    eventSource.close();
  };
};