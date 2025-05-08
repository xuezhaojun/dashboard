import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Cluster, fetchClusters, setupClusterEventSource } from '../api/clusterService';

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
      <div className="p-6">
        <div className="bg-red-50 p-4 border border-red-200 rounded-md">
          <p className="text-red-600">{error}</p>
          <button
            className="mt-2 px-4 py-1 bg-red-100 text-red-800 rounded text-sm"
            onClick={() => window.location.reload()}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Clusters</h1>

      {loading ? (
        <div className="text-center py-8">Loading...</div>
      ) : clusters.length === 0 ? (
        <div className="text-center py-8 text-gray-500">No clusters available</div>
      ) : (
        <div className="overflow-x-auto bg-white shadow rounded-lg">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Version
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nodes
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {clusters.map((cluster) => (
                <tr key={cluster.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Link
                      to={`/clusters/${cluster.name}`}
                      className="text-blue-600 hover:text-blue-900 font-medium"
                    >
                      {cluster.name}
                    </Link>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center">
                      <span className={`h-2.5 w-2.5 rounded-full mr-2 ${
                        cluster.status === 'Online' ? 'bg-green-500' : 'bg-gray-400'
                      }`}></span>
                      {cluster.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                    {cluster.version || 'Unknown'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-500">
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