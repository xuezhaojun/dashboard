import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { fetchClusterByName } from '../api/clusterService';
import type { Cluster } from '../api/clusterService';

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
      <div>
        <div>Loading cluster details...</div>
      </div>
    );
  }

  if (error || !cluster) {
    return (
      <div>
        <div>
          <Link to="/clusters">
            &lt; Back to clusters
          </Link>
        </div>
        <div>
          <p>{error || 'Cluster not found'}</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div>
        <Link to="/clusters">
          &lt; Back to clusters
        </Link>
      </div>

      <div>
        <div>
          <div>
            <h1>{cluster.name}</h1>
            <span>
              <span></span>
              {cluster.status}
            </span>
          </div>
        </div>

        <div>
          <div>
            <div>
              <h2>Cluster Information</h2>
              <table>
                <tbody>
                  <tr>
                    <td>ID</td>
                    <td>{cluster.id}</td>
                  </tr>
                  <tr>
                    <td>Version</td>
                    <td>{cluster.version || 'Unknown'}</td>
                  </tr>
                  <tr>
                    <td>Nodes</td>
                    <td>{cluster.nodes || 'Unknown'}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {cluster.labels && Object.keys(cluster.labels).length > 0 && (
              <div>
                <h2>Labels</h2>
                <div>
                  {Object.entries(cluster.labels).map(([key, value]) => (
                    <div key={key}>
                      <span>
                        {key}
                      </span>
                      <span>{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {cluster.conditions && cluster.conditions.length > 0 && (
            <div>
              <h2>Conditions</h2>
              <div>
                <table>
                  <thead>
                    <tr>
                      <th>Type</th>
                      <th>Status</th>
                      <th>Reason</th>
                      <th>Last Transition</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cluster.conditions.map((condition, index) => (
                      <tr key={index}>
                        <td>{condition.type}</td>
                        <td>
                          <span>
                            {condition.status}
                          </span>
                        </td>
                        <td>{condition.reason || '-'}</td>
                        <td>{condition.lastTransitionTime || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div>
            <button
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