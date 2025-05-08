import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { fetchClusters, setupClusterEventSource } from '../api/clusterService';
import type { Cluster } from '../api/clusterService';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const ClusterList = () => {
  const [clusters, setClusters] = useState<Cluster[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadClusters = async () => {
      try {
        const data = await fetchClusters();
        if (data && data.length > 0) {
          setClusters(data);
        } else {
          console.log('No clusters returned from API');
        }
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
    // Only set up the event source if we've loaded the initial data and we're not in an error state
    if (loading || error) return;

    try {
      const cleanup = setupClusterEventSource(
        // onAdd handler
        (cluster) => {
          console.log('Cluster added event received', cluster);
          setClusters((prev) => [...prev, cluster]);
        },
        // onUpdate handler
        (updatedCluster) => {
          console.log('Cluster updated event received', updatedCluster);
          setClusters((prev) =>
            prev.map((cluster) =>
              cluster.id === updatedCluster.id ? updatedCluster : cluster
            )
          );
        },
        // onDelete handler
        (clusterId) => {
          console.log('Cluster deleted event received', clusterId);
          setClusters((prev) =>
            prev.filter((cluster) => cluster.id !== clusterId)
          );
        },
        // onError handler
        (event) => {
          console.error('SSE error:', event);
          // We don't set an error state here to avoid disrupting the UI
          // Just log it, and the connection will auto-retry or be handled in the service
        }
      );

      // Cleanup function to close the event source when component unmounts
      return cleanup;
    } catch (e) {
      console.error('Error setting up event source:', e);
      // We handle this gracefully and don't disrupt the UI
      return () => {};
    }
  }, [loading, error]);

  if (error) {
    return (
      <div className="p-6">
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center space-y-4">
              <p className="text-destructive font-medium">{error}</p>
              <button
                className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-destructive text-destructive-foreground hover:bg-destructive/90 h-10 px-4 py-2"
                onClick={() => window.location.reload()}
              >
                Retry
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Loading skeleton UI
  if (loading) {
    return (
      <div className="p-6">
        <Card>
          <CardHeader>
            <CardTitle>
              <Skeleton className="h-8 w-[150px]" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Array(5).fill(0).map((_, i) => (
                <div key={i} className="flex items-center space-x-4">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-[250px]" />
                    <Skeleton className="h-4 w-[200px]" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6">
      <Card>
        <CardHeader>
          <CardTitle>Clusters</CardTitle>
        </CardHeader>
        <CardContent>
          {clusters.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40">
              <p className="text-muted-foreground">No clusters available</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Version</TableHead>
                  <TableHead>Nodes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clusters.map((cluster, index) => (
                  <TableRow key={`${cluster.id}-${index}`}>
                    <TableCell className="font-medium">
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-9 w-9">
                          <AvatarFallback className="bg-primary/10 text-primary">
                            {cluster.name.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <Link
                          to={`/clusters/${cluster.name}`}
                          className="font-medium text-primary hover:underline"
                        >
                          {cluster.name}
                        </Link>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <span className={`mr-2 h-2.5 w-2.5 rounded-full ${
                          cluster.status === 'Online' ? 'bg-emerald-500' : 'bg-muted'
                        }`}></span>
                        {cluster.status}
                      </div>
                    </TableCell>
                    <TableCell>{cluster.version || 'Unknown'}</TableCell>
                    <TableCell>{cluster.nodes || 'Unknown'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ClusterList;