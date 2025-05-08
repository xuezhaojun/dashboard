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
  // For MVP, we'll still use mock data if no API is available
  if (import.meta.env.DEV && !import.meta.env.VITE_USE_REAL_API) {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve([]);
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
  if (import.meta.env.DEV && !import.meta.env.VITE_USE_REAL_API) {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(null);
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
  // In development mode without real API, we don't set up SSE
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