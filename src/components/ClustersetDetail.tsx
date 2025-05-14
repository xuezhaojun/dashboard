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
import {
  ArrowBack as ArrowBackIcon,
} from "@mui/icons-material";
import { type ClusterSet } from '../api/clusterSetService';
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
  const [tabValue, setTabValue] = useState(0);
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
          {clusterSet.status?.conditions && clusterSet.status.conditions.length > 0 && (
            <Grid size={{ xs: 12 }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>Conditions</Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead sx={{ bgcolor: alpha(theme.palette.primary.main, 0.05) }}>
                    <TableRow>
                      <TableCell>Type</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Reason</TableCell>
                      <TableCell>Message</TableCell>
                      <TableCell>Last Transition</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {clusterSet.status.conditions.map((condition, index) => (
                      <TableRow key={index}>
                        <TableCell>{condition.type}</TableCell>
                        <TableCell>
                          <Chip
                            label={condition.status}
                            size="small"
                            color={condition.status === "True" ? "success" :
                                  condition.status === "False" ? "primary" : "default"}
                          />
                        </TableCell>
                        <TableCell>{condition.reason || "-"}</TableCell>
                        <TableCell>{condition.message || "-"}</TableCell>
                        <TableCell>{formatDate(condition.lastTransitionTime)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Grid>
          )}
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
  creationTimestamp: ${clusterSet.creationTimestamp || ''}
${clusterSet.labels ? `  labels:
${Object.entries(clusterSet.labels).map(([k, v]) => `    ${k}: ${v}`).join('\n')}` : ''}
spec:
  clusterSelector:
    selectorType: ${clusterSet.spec?.clusterSelector?.selectorType || 'LabelSelector'}
${clusterSet.spec?.clusterSelector?.labelSelector ? `    labelSelector: ${JSON.stringify(clusterSet.spec.clusterSelector.labelSelector, null, 2).replace(/^/gm, '    ')}` : ''}
status:
  conditions:
${clusterSet.status?.conditions?.map(c => `  - type: ${c.type}
    status: ${c.status}
    reason: ${c.reason || ''}
    message: ${c.message || ''}
    lastTransitionTime: ${c.lastTransitionTime || ''}`).join('\n') || '  []'}`}
          </Box>
        )}
      </Paper>
    </Box>
  );
};

export default ClustersetDetail;