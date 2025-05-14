import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Chip,
  Button,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  alpha,
  useTheme,
  CircularProgress,
} from "@mui/material";
import {
  ArrowBack as ArrowBackIcon,
} from "@mui/icons-material";
import { useClusterSet } from '../hooks/useClusterSet';
import { fetchClusters, type Cluster } from '../api/clusterService';

// Define the ClusterSetCluster interface to represent clusters in a set
interface ClusterSetCluster {
  id: string;
  name: string;
  status: string;
}

const ClustersetDetail = () => {
  const { name } = useParams<{ name: string }>();
  const theme = useTheme();
  const [clusterSetClusters, setClusterSetClusters] = useState<ClusterSetCluster[]>([]);
  const [clustersLoading, setClustersLoading] = useState<boolean>(false);
  const [clustersError, setClustersError] = useState<string | null>(null);

  // Use our custom hook to fetch and manage cluster set data
  const {
    clusterSet,
    loading: clusterSetLoading,
    error: clusterSetError
  } = useClusterSet(name || null);

  // Load clusters that belong to this cluster set
  useEffect(() => {
    const fetchClusterSetClusters = async () => {
      if (!name || !clusterSet) return;

      try {
        setClustersLoading(true);
        setClustersError(null);

        // Fetch all clusters
        const allClusters = await fetchClusters();
        let clustersInSet: Cluster[] = [];

        // Get the selector type from the cluster set
        const selectorType = clusterSet.spec?.clusterSelector?.selectorType || 'ExclusiveClusterSetLabel';

        // Filter clusters based on the selector type
        switch (selectorType) {
          case 'ExclusiveClusterSetLabel':
            // Use the exclusive cluster set label to filter clusters
            clustersInSet = allClusters.filter(cluster =>
              cluster.labels &&
              cluster.labels['cluster.open-cluster-management.io/clusterset'] === name
            );
            break;

          case 'LabelSelector': {
            // Use the label selector to filter clusters
            const labelSelector = clusterSet.spec?.clusterSelector?.labelSelector;

            if (!labelSelector || Object.keys(labelSelector).length === 0) {
              // If labelSelector is empty, select all clusters (labels.Everything())
              clustersInSet = allClusters;
            } else {
              // Filter clusters based on the label selector
              clustersInSet = allClusters.filter(cluster => {
                if (!cluster.labels) return false;

                // Check if all matchLabels are satisfied
                for (const [key, value] of Object.entries(labelSelector)) {
                  if (typeof value === 'string' && cluster.labels[key] !== value) {
                    return false;
                  }
                }

                // TODO: Implement support for matchExpressions part of the labelSelector
                // This would require handling various operators like In, NotIn, Exists, DoesNotExist
                // Currently only matchLabels is supported

                return true;
              });
            }
          }
            break;

          default:
            setClustersError(`Unsupported selector type: ${selectorType}`);
            setClustersLoading(false);
            return;
        }

        // Map to the simplified ClusterSetCluster format
        const mappedClusters = clustersInSet.map(cluster => ({
          id: cluster.id,
          name: cluster.name,
          status: cluster.status
        }));

        setClusterSetClusters(mappedClusters);
        setClustersLoading(false);
      } catch (error) {
        console.error('Error fetching clusters for cluster set:', error);
        setClustersError('Failed to load clusters for this cluster set');
        setClustersLoading(false);
      }
    };

    if (name && clusterSet) {
      fetchClusterSetClusters();
    }
  }, [name, clusterSet]);

  // Format date string
  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString() + " " + date.toLocaleTimeString();
  };

  // Show loading state when either cluster set or clusters are loading
  if (clusterSetLoading || clustersLoading) {
    return (
      <Box sx={{ p: 3, display: 'flex', alignItems: 'center' }}>
        <CircularProgress size={24} sx={{ mr: 2 }} />
        <Typography>
          {clusterSetLoading ? 'Loading cluster set details...' : 'Loading clusters...'}
        </Typography>
      </Box>
    );
  }

  // Show error state if there's an error with cluster set or clusters
  if (clusterSetError || !clusterSet || clustersError) {
    return (
      <Box sx={{ p: 3 }}>
        <Button
          component={Link}
          to="/clustersets"
          startIcon={<ArrowBackIcon />}
          sx={{ mb: 2 }}
        >
          Back to ClusterSets
        </Button>
        <Paper sx={{ p: 3, borderRadius: 2 }}>
          <Typography color="error">
            {clusterSetError || clustersError || 'Cluster set not found'}
          </Typography>
        </Paper>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Button
        component={Link}
        to="/clustersets"
        startIcon={<ArrowBackIcon />}
        sx={{ mb: 2 }}
      >
        Back to ClusterSets
      </Button>

      <Paper sx={{ p: 3, mb: 3, borderRadius: 2 }}>
        <Typography variant="h5" sx={{ mb: 2 }}>{clusterSet.name}</Typography>

        <Grid container spacing={3} sx={{ width: '100%' }}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Typography variant="body2" color="text.secondary">Cluster Count</Typography>
            <Typography variant="body1">{clusterSet.clusterCount}</Typography>
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <Typography variant="body2" color="text.secondary">Created</Typography>
            <Typography variant="body1">{formatDate(clusterSet.creationTimestamp)}</Typography>
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <Typography variant="body2" color="text.secondary">Selector Type</Typography>
            <Typography variant="body1">{clusterSet.spec?.clusterSelector?.selectorType || "N/A"}</Typography>
          </Grid>

        </Grid>
      </Paper>

      <Paper sx={{ p: 3, borderRadius: 2 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>Clusters</Typography>

        <TableContainer>
          <Table>
            <TableHead sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1) }}>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {clustersError ? (
                <TableRow>
                  <TableCell colSpan={2} align="center" sx={{ color: 'error.main' }}>
                    Error loading clusters: {clustersError}
                  </TableCell>
                </TableRow>
              ) : clusterSetClusters.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={2} align="center">No clusters in this set</TableCell>
                </TableRow>
              ) : (
                clusterSetClusters.map((cluster) => (
                  <TableRow
                    key={cluster.id}
                    onClick={() => {
                      window.location.href = `/clusters/${cluster.name}`;
                    }}
                    sx={{
                      cursor: 'pointer',
                      '&:hover': {
                        bgcolor: alpha(theme.palette.primary.main, 0.05),
                      }
                    }}
                  >
                    <TableCell>
                      <Typography sx={{ fontWeight: "medium" }}>
                        {cluster.name}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={cluster.status}
                        size="small"
                        color={cluster.status === "Online" ? "success" : "error"}
                      />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
};

export default ClustersetDetail;
