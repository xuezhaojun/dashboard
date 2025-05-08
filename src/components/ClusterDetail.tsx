import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Cluster, fetchClusterByName } from '../api/clusterService';

const ClusterDetail = () => {
  const { name } = useParams<{ name: string }>();
  const [cluster, setCluster] = useState<Cluster | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadClusterDetails = async () => {
      if (!name) {
        setError('Cluster name is required');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const data = await fetchClusterByName(name);
        setCluster(data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching cluster details:', err);
        setError('Failed to load cluster details');
        setLoading(false);
      }
    };

    loadClusterDetails();
  }, [name]);

  const getStatusColor = (status: string) => {
    if (status === 'Online') return 'bg-green-500';
    if (status === 'Offline') return 'bg-red-500';
    return 'bg-gray-400';
  };

  if (loading) {
    return (
      <div className="p-6 flex justify-center">
        <div className="text-center py-8">Loading cluster details...</div>
      </div>
    );
  }

  if (error || !cluster) {
    return (
      <div className="p-6">
        <div className="mb-4">
          <Link to="/clusters" className="text-blue-600 hover:text-blue-800">
            &lt; Back to clusters
          </Link>
        </div>
        <div className="bg-red-50 p-4 border border-red-200 rounded-md">
          <p className="text-red-600">{error || 'Cluster not found'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-4">
        <Link to="/clusters" className="text-blue-600 hover:text-blue-800">
          &lt; Back to clusters
        </Link>
      </div>

      <div className="bg-white shadow rounded-lg mb-6">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold">{cluster.name}</h1>
            <span className="inline-flex items-center">
              <span className={`h-3 w-3 rounded-full mr-2 ${getStatusColor(cluster.status)}`}></span>
              {cluster.status}
            </span>
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h2 className="text-lg font-medium mb-3">Cluster Information</h2>
              <table className="min-w-full">
                <tbody>
                  <tr>
                    <td className="py-2 pr-4 text-sm font-medium text-gray-500">ID</td>
                    <td className="py-2 text-sm text-gray-900">{cluster.id}</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-4 text-sm font-medium text-gray-500">Version</td>
                    <td className="py-2 text-sm text-gray-900">{cluster.version || 'Unknown'}</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-4 text-sm font-medium text-gray-500">Nodes</td>
                    <td className="py-2 text-sm text-gray-900">{cluster.nodes || 'Unknown'}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {cluster.labels && Object.keys(cluster.labels).length > 0 && (
              <div>
                <h2 className="text-lg font-medium mb-3">Labels</h2>
                <div className="bg-gray-50 p-4 rounded-md">
                  {Object.entries(cluster.labels).map(([key, value]) => (
                    <div key={key} className="mb-1">
                      <span className="text-xs font-medium bg-gray-200 text-gray-800 px-2 py-1 rounded mr-2">
                        {key}
                      </span>
                      <span className="text-xs text-gray-600">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {cluster.conditions && cluster.conditions.length > 0 && (
            <div className="mt-6">
              <h2 className="text-lg font-medium mb-3">Conditions</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white border border-gray-200">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Reason
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Last Transition
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {cluster.conditions.map((condition, index) => (
                      <tr key={index}>
                        <td className="px-4 py-2 whitespace-nowrap text-sm">{condition.type}</td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            condition.status === 'True' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {condition.status}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-sm">{condition.reason || '-'}</td>
                        <td className="px-4 py-2 text-sm">{condition.lastTransitionTime || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="mt-6">
            <button
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 text-sm font-medium rounded"
              onClick={() => {
                // In a real app, this would generate a YAML representation of the cluster
                alert('YAML download functionality will be implemented in the future');
              }}
            >
              Download YAML
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClusterDetail;