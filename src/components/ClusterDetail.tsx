import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { fetchClusterByName } from '../api/clusterService';
import type { Cluster } from '../api/clusterService';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
    if (status === 'Online') return 'bg-emerald-500';
    if (status === 'Offline') return 'bg-destructive';
    return 'bg-muted';
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center mb-6">
          <Button variant="outline" size="sm" asChild>
            <Link to="/clusters">Back to clusters</Link>
          </Button>
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-[200px]" />
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="space-y-4">
                <Skeleton className="h-4 w-[300px]" />
                <Skeleton className="h-4 w-[250px]" />
                <Skeleton className="h-4 w-[200px]" />
              </div>
              <Skeleton className="h-[200px] w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !cluster) {
    return (
      <div className="p-6">
        <div className="flex items-center mb-6">
          <Button variant="outline" size="sm" asChild>
            <Link to="/clusters">Back to clusters</Link>
          </Button>
        </div>
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center space-y-4">
              <p className="text-destructive font-medium">{error || 'Cluster not found'}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center mb-6">
        <Button variant="outline" size="sm" asChild>
          <Link to="/clusters">Back to clusters</Link>
        </Button>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
          <div className="flex items-center space-x-4">
            <Avatar className="h-10 w-10">
              <AvatarFallback className="bg-primary/10 text-primary">
                {cluster.name.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <CardTitle className="text-2xl">{cluster.name}</CardTitle>
          </div>
          <div className="flex items-center">
            <span className={`h-3 w-3 rounded-full mr-2 ${getStatusColor(cluster.status)}`}></span>
            <span>{cluster.status}</span>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="conditions" disabled={!cluster.conditions || cluster.conditions.length === 0}>
                Conditions
              </TabsTrigger>
              <TabsTrigger value="labels" disabled={!cluster.labels || Object.keys(cluster.labels).length === 0}>
                Labels
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview">
              <div className="space-y-4">
                <div className="rounded-md border">
                  <Table>
                    <TableBody>
                      <TableRow>
                        <TableCell className="font-medium w-32">ID</TableCell>
                        <TableCell>{cluster.id}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">Version</TableCell>
                        <TableCell>{cluster.version || 'Unknown'}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">Nodes</TableCell>
                        <TableCell>{cluster.nodes || 'Unknown'}</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="conditions">
              {cluster.conditions && cluster.conditions.length > 0 && (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Type</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Reason</TableHead>
                        <TableHead>Last Transition</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {cluster.conditions.map((condition, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{condition.type}</TableCell>
                          <TableCell>
                            <Badge variant={condition.status === 'True' ? "secondary" : "destructive"}>
                              {condition.status}
                            </Badge>
                          </TableCell>
                          <TableCell>{condition.reason || '-'}</TableCell>
                          <TableCell>{condition.lastTransitionTime || '-'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>

            <TabsContent value="labels">
              {cluster.labels && Object.keys(cluster.labels).length > 0 && (
                <div className="bg-muted/50 p-4 rounded-md">
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(cluster.labels).map(([key, value]) => (
                      <div key={key} className="inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 bg-background">
                        <span className="font-medium mr-1">{key}:</span>
                        <span className="text-muted-foreground">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
        <CardFooter className="flex justify-end border-t pt-6">
          <Button variant="outline" onClick={() => {
            alert('YAML download functionality will be implemented in the future');
          }}>
            Download YAML
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default ClusterDetail;