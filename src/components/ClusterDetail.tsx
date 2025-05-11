/**
 * @deprecated This component is deprecated and will be removed in a future version.
 * Please use the new ClusterDetailPage component instead.
 */


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

  // Get readable status from conditions
  const getHubAcceptedStatus = () => {
    if (cluster?.hubAccepted) return 'Accepted';
    return 'Not Accepted';
  };

  const getJoinedStatus = () => {
    const joinedCondition = cluster?.conditions?.find(c => c.type === 'ManagedClusterJoined');
    return joinedCondition?.status === 'True' ? 'Joined' : 'Not Joined';
  };

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
                  <tr>
                    <td>Hub Accepted</td>
                    <td>{getHubAcceptedStatus()}</td>
                  </tr>
                  <tr>
                    <td>Joined</td>
                    <td>{getJoinedStatus()}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Resource Capacity & Allocatable */}
            {(cluster.capacity || cluster.allocatable) && (
              <div>
                <h2>Cluster Resources</h2>
                <table>
                  <thead>
                    <tr>
                      <th>Resource</th>
                      <th>Capacity</th>
                      <th>Allocatable</th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* CPU Resources */}
                    <tr>
                      <td>CPU</td>
                      <td>{cluster.capacity?.cpu || '-'}</td>
                      <td>{cluster.allocatable?.cpu || '-'}</td>
                    </tr>
                    {/* Memory Resources */}
                    <tr>
                      <td>Memory</td>
                      <td>{cluster.capacity?.memory || '-'}</td>
                      <td>{cluster.allocatable?.memory || '-'}</td>
                    </tr>
                    {/* Add any other resources that might be present */}
                  </tbody>
                </table>
              </div>
            )}

            {/* Cluster Claims */}
            {cluster.clusterClaims && cluster.clusterClaims.length > 0 && (
              <div>
                <h2>Cluster Claims</h2>
                <table>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cluster.clusterClaims.map((claim, index) => (
                      <tr key={index}>
                        <td>{claim.name}</td>
                        <td>{claim.value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

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

          {/* Taints */}
          {cluster.taints && cluster.taints.length > 0 && (
            <div>
              <h2>Taints</h2>
              <table>
                <thead>
                  <tr>
                    <th>Key</th>
                    <th>Value</th>
                    <th>Effect</th>
                  </tr>
                </thead>
                <tbody>
                  {cluster.taints.map((taint, index) => (
                    <tr key={index}>
                      <td>{taint.key}</td>
                      <td>{taint.value || '-'}</td>
                      <td>{taint.effect}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

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
                      <th>Message</th>
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
                        <td>{condition.message || '-'}</td>
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