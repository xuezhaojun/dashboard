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
} from "@mui/material";
import {
  ArrowBack as ArrowBackIcon,
} from "@mui/icons-material";
import { useClusterSet } from '../hooks/useClusterSet';

interface ClusterReference {
  name: string;
  status: string;
}

// Mock cluster references - in a real app, this would come from the API
const mockClusterReferences: Record<string, ClusterReference[]> = {
  "default": [
    { name: "cluster-1", status: "Online" },
    { name: "cluster-2", status: "Online" },
  ],
  "global": [
    { name: "cluster-1", status: "Online" },
    { name: "cluster-2", status: "Online" },
  ]
};

const ClustersetDetail = () => {
  const { name } = useParams<{ name: string }>();
  const theme = useTheme();
  const [clusterReferences, setClusterReferences] = useState<ClusterReference[]>([]);

  // Use our custom hook to fetch and manage cluster set data
  const {
    clusterSet,
    loading,
    error
  } = useClusterSet(name || null);

  // Load cluster references when cluster set changes
  useEffect(() => {
    if (name && clusterSet) {
      // In a real app, this would be an API call to get clusters in this set
      setClusterReferences(mockClusterReferences[name] || []);
    }
  }, [name, clusterSet]);

  // Format date string
  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString() + " " + date.toLocaleTimeString();
  };

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography>Loading cluster set details...</Typography>
      </Box>
    );
  }

  if (error || !clusterSet) {
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
          <Typography color="error">{error || 'Cluster set not found'}</Typography>
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
              {clusterReferences.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={2} align="center">No clusters in this set</TableCell>
                </TableRow>
              ) : (
                clusterReferences.map((cluster) => (
                  <TableRow
                    key={cluster.name}
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