import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { fetchClusters, setupClusterEventSource } from '../api/clusterService';
import type { Cluster } from '../api/clusterService';

const ClusterList = () => {
  const [clusters, setClusters] = useState<Cluster[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadClusters = async () => {
      try {
        const data = await fetchClusters();
        setClusters(data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching clusters:', error);
        setError('Failed to load clusters');
        setLoading(false);
      }
    };

    loadClusters();
  }, []);

  // Set up real-time updates via Server-Sent Events
  useEffect(() => {
    // Only set up the event source if we've loaded the initial data
    if (loading) return;

    const cleanup = setupClusterEventSource(
      // onAdd handler
      (cluster) => {
        setClusters((prev) => [...prev, cluster]);
      },
      // onUpdate handler
      (updatedCluster) => {
        setClusters((prev) =>
          prev.map((cluster) =>
            cluster.id === updatedCluster.id ? updatedCluster : cluster
          )
        );
      },
      // onDelete handler
      (clusterId) => {
        setClusters((prev) =>
          prev.filter((cluster) => cluster.id !== clusterId)
        );
      },
      // onError handler
      (event) => {
        console.error('SSE error:', event);
        // We don't set an error state here to avoid disrupting the UI
        // Just log it, and the connection will auto-retry
      }
    );

    // Cleanup function to close the event source when component unmounts
    return cleanup;
  }, [loading]);

  if (error) {
    return (
      <div>
        <div>
          <p>{error}</p>
          <button
            onClick={() => window.location.reload()}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1>Clusters</h1>

      {loading ? (
        <div>Loading...</div>
      ) : clusters.length === 0 ? (
        <div>No clusters available</div>
      ) : (
        <div>
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Status</th>
                <th>Version</th>
                <th>Nodes</th>
              </tr>
            </thead>
            <tbody>
              {clusters.map((cluster, index) => (
                <tr key={`${cluster.id}-${index}`}>
                  <td>
                    <Link
                      to={`/clusters/${cluster.name}`}
                    >
                      {cluster.name}
                    </Link>
                  </td>
                  <td>
                    <span>
                      <span></span>
                      {cluster.status}
                    </span>
                  </td>
                  <td>
                    {cluster.version || 'Unknown'}
                  </td>
                  <td>
                    {cluster.nodes || 'Unknown'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ClusterList;