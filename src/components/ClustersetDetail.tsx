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
  Tabs,
  Tab,
  alpha,
  useTheme,
} from "@mui/material";
import { ArrowBack as ArrowBackIcon } from "@mui/icons-material";

// Define interfaces
interface ClusterSet {
  id: string;
  name: string;
  clusterCount: number;
  labels?: Record<string, string>;
  creationTimestamp?: string;
  clusters?: string[];
}

interface ClusterReference {
  name: string;
  status: string;
}

// Mock data for development
const mockClusterSets: Record<string, ClusterSet> = {
  "default": {
    id: "default",
    name: "default",
    clusterCount: 3,
    labels: { environment: "production" },
    creationTimestamp: new Date().toISOString(),
    clusters: ["cluster-1", "cluster-2", "cluster-3"]
  },
  "dev-clusters": {
    id: "dev-clusters",
    name: "dev-clusters",
    clusterCount: 5,
    labels: { environment: "development" },
    creationTimestamp: new Date().toISOString(),
    clusters: ["dev-cluster-1", "dev-cluster-2", "dev-cluster-3", "dev-cluster-4", "dev-cluster-5"]
  },
  "regional-eu": {
    id: "regional-eu",
    name: "regional-eu",
    clusterCount: 2,
    labels: { region: "europe" },
    creationTimestamp: new Date().toISOString(),
    clusters: ["eu-west-1", "eu-central-1"]
  }
};

// Mock cluster references
const mockClusterReferences: Record<string, ClusterReference[]> = {
  "default": [
    { name: "cluster-1", status: "Online" },
    { name: "cluster-2", status: "Online" },
    { name: "cluster-3", status: "Offline" }
  ],
  "dev-clusters": [
    { name: "dev-cluster-1", status: "Online" },
    { name: "dev-cluster-2", status: "Online" },
    { name: "dev-cluster-3", status: "Online" },
    { name: "dev-cluster-4", status: "Offline" },
    { name: "dev-cluster-5", status: "Online" }
  ],
  "regional-eu": [
    { name: "eu-west-1", status: "Online" },
    { name: "eu-central-1", status: "Online" }
  ]
};

const ClustersetDetail = () => {
  const { name } = useParams<{ name: string }>();
  const theme = useTheme();
  const [clusterSet, setClusterSet] = useState<ClusterSet | null>(null);
  const [clusterReferences, setClusterReferences] = useState<ClusterReference[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState(0);

  useEffect(() => {
    // Simulate API call
    const loadClusterSet = async () => {
      try {
        setLoading(true);
        // In a real app, this would be an API call
        // const data = await fetchClusterSet(name);
        if (name && mockClusterSets[name]) {
          setClusterSet(mockClusterSets[name]);
          setClusterReferences(mockClusterReferences[name] || []);
        } else {
          setError(`Cluster set "${name}" not found`);
        }
        setLoading(false);
      } catch (error) {
        console.error('Error fetching cluster set:', error);
        setError('Failed to load cluster set details');
        setLoading(false);
      }
    };

    loadClusterSet();
  }, [name]);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

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
          Back to Cluster Sets
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
        Back to Cluster Sets
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
          <Grid size={{ xs: 12 }}>
            <Typography variant="body2" color="text.secondary">Labels</Typography>
            {clusterSet.labels ? (
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mt: 1 }}>
                {Object.entries(clusterSet.labels).map(([key, value]) => (
                  <Chip
                    key={key}
                    label={`${key}: ${value}`}
                    size="small"
                    variant="outlined"
                  />
                ))}
              </Box>
            ) : (
              <Typography variant="body1">No labels</Typography>
            )}
          </Grid>
        </Grid>
      </Paper>

      <Paper sx={{ p: 3, borderRadius: 2 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
          <Tabs value={tabValue} onChange={handleTabChange} aria-label="clusterset detail tabs">
            <Tab label="Clusters" />
            <Tab label="YAML" />
          </Tabs>
        </Box>

        {tabValue === 0 && (
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
        )}

        {tabValue === 1 && (
          <Box sx={{
            p: 2,
            bgcolor: alpha(theme.palette.primary.main, 0.05),
            borderRadius: 1,
            fontFamily: 'monospace',
            whiteSpace: 'pre-wrap'
          }}>
            {`apiVersion: cluster.open-cluster-management.io/v1beta2
kind: ManagedClusterSet
metadata:
  name: ${clusterSet.name}
  labels:
${Object.entries(clusterSet.labels || {}).map(([k, v]) => `    ${k}: ${v}`).join('\n')}
spec:
  clusterSelector:
    selectorType: LabelSelector
    labelSelector:
      matchLabels:
        clusterset: ${clusterSet.name}`}
          </Box>
        )}
      </Paper>
    </Box>
  );
};

export default ClustersetDetail;