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
  // For MVP development, always use mock data to avoid connection errors
  if (import.meta.env.DEV) {
    console.log('Using mock cluster data in development mode');
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve([
          {
            id: "mock-cluster-1",
            name: "mock-cluster-1",
            status: "Online",
            version: "4.12.0",
            nodes: 3,
            labels: {
              vendor: "OpenShift",
              region: "us-east-1",
              env: "development"
            }
          },
          {
            id: "mock-cluster-2",
            name: "mock-cluster-2",
            status: "Offline",
            version: "4.11.0",
            nodes: 5,
            labels: {
              vendor: "OpenShift",
              region: "us-west-1",
              env: "staging"
            }
          },
          {
            id: "mock-cluster-3",
            name: "production-cluster",
            status: "Online",
            version: "4.13.1",
            nodes: 8,
            labels: {
              vendor: "OpenShift",
              region: "eu-central-1",
              env: "production"
            }
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
  if (import.meta.env.DEV) {
    console.log('Using mock cluster detail data in development mode');
    return new Promise((resolve) => {
      setTimeout(() => {
        if (name === "mock-cluster-1") {
          resolve({
            id: "mock-cluster-1",
            name: "mock-cluster-1",
            status: "Online",
            version: "4.12.0",
            nodes: 3,
            labels: {
              vendor: "OpenShift",
              region: "us-east-1",
              env: "development",
              tier: "gold"
            },
            conditions: [
              {
                type: "ManagedClusterConditionAvailable",
                status: "True",
                reason: "ClusterAvailable",
                message: "Cluster is available"
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
            labels: {
              vendor: "OpenShift",
              region: "us-west-1",
              env: "staging",
              tier: "silver"
            },
            conditions: [
              {
                type: "ManagedClusterConditionAvailable",
                status: "False",
                reason: "ClusterOffline",
                message: "Cluster is not responding"
              }
            ]
          });
        } else if (name === "production-cluster" || name === "mock-cluster-3") {
          resolve({
            id: "mock-cluster-3",
            name: "production-cluster",
            status: "Online",
            version: "4.13.1",
            nodes: 8,
            labels: {
              vendor: "OpenShift",
              region: "eu-central-1",
              env: "production",
              tier: "platinum"
            },
            conditions: [
              {
                type: "ManagedClusterConditionAvailable",
                status: "True",
                reason: "ClusterAvailable",
                message: "Cluster is available and healthy"
              },
              {
                type: "ManagedClusterConditionUpgradeable",
                status: "True",
                reason: "ClusterUpgradeable",
                message: "Cluster is ready for upgrade"
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
  // In development mode, we don't set up SSE
  if (import.meta.env.DEV) {
    console.log('Skipping SSE setup in development mode');
    // Simulate adding a cluster after 5 seconds
    const timerId = setTimeout(() => {
      console.log('Simulating new cluster added');
      onAdd({
        id: "mock-cluster-4",
        name: "dynamic-test-cluster",
        status: "Online",
        version: "4.14.0",
        nodes: 4,
        labels: {
          vendor: "OpenShift",
          region: "ap-southeast-1",
          env: "testing"
        }
      });
    }, 5000);

    return () => {
      clearTimeout(timerId);
    };
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