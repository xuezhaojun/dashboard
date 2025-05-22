import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  IconButton,
  TextField,
  InputAdornment,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  alpha,
  useTheme,
  CircularProgress,
  FormControl,
  Select,
  MenuItem,
  InputLabel,
} from "@mui/material";
import type { SelectChangeEvent } from '@mui/material';
import {
  Search as SearchIcon,
  Refresh as RefreshIcon,
} from "@mui/icons-material";
import { useNavigate } from 'react-router-dom';
import { fetchClusterSets, type ClusterSet } from '../api/clusterSetService';
import { fetchClusters, type Cluster } from '../api/clusterService';
import { fetchClusterSetBindings, type ManagedClusterSetBinding } from '../api/clusterSetBindingService';

const ClustersetList = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectorTypeFilter, setSelectorTypeFilter] = useState<string>("all");
  const [clusterSets, setClusterSets] = useState<ClusterSet[]>([]);
  const [clusters, setClusters] = useState<Cluster[]>([]);
  const [bindings, setBindings] = useState<ManagedClusterSetBinding[]>([]);
  const [loading, setLoading] = useState(true);
  const [clustersLoading, setClustersLoading] = useState(true);
  const [bindingsLoading, setBindingsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [clusterSetCounts, setClusterSetCounts] = useState<Record<string, number>>({});
  const [bindingCounts, setBindingCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    const loadClusterSets = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await fetchClusterSets();
        setClusterSets(data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching cluster sets:', error);
        setError('Failed to load cluster sets');
        setLoading(false);
      }
    };

    loadClusterSets();
  }, []);

  useEffect(() => {
    const loadClusters = async () => {
      try {
        setClustersLoading(true);
        const data = await fetchClusters();
        setClusters(data);
        setClustersLoading(false);
      } catch (error) {
        console.error('Error fetching clusters:', error);
        setClustersLoading(false);
      }
    };

    loadClusters();
  }, []);

  useEffect(() => {
    const loadBindings = async () => {
      try {
        setBindingsLoading(true);
        const data = await fetchClusterSetBindings();
        setBindings(data);
        setBindingsLoading(false);
      } catch (error) {
        console.error('Error fetching cluster set bindings:', error);
        setBindingsLoading(false);
      }
    };

    loadBindings();
  }, []);

  // Calculate cluster counts for each cluster set
  useEffect(() => {
    if (clusters.length === 0 || clusterSets.length === 0 || loading || clustersLoading) return;

    const counts: Record<string, number> = {};

    clusterSets.forEach(clusterSet => {
      // Get the selector type from the cluster set
      const selectorType = clusterSet.spec?.clusterSelector?.selectorType || 'ExclusiveClusterSetLabel';
      let count = 0;

      // Filter clusters based on the selector type
      switch (selectorType) {
        case 'ExclusiveClusterSetLabel':
          // Use the exclusive cluster set label to filter clusters
          count = clusters.filter(cluster =>
            cluster.labels &&
            cluster.labels['cluster.open-cluster-management.io/clusterset'] === clusterSet.name
          ).length;
          break;

        case 'LabelSelector': {
          // Use the label selector to filter clusters
          const labelSelector = clusterSet.spec?.clusterSelector?.labelSelector;

          if (!labelSelector || Object.keys(labelSelector).length === 0) {
            // If labelSelector is empty, select all clusters (labels.Everything())
            count = clusters.length;
          } else {
            // Filter clusters based on the label selector
            count = clusters.filter(cluster => {
              if (!cluster.labels) return false;

              // Check if all matchLabels are satisfied
              for (const [key, value] of Object.entries(labelSelector)) {
                if (typeof value === 'string' && cluster.labels[key] !== value) {
                  return false;
                }
              }
              return true;
            }).length;
          }
        }
          break;

        default:
          count = 0;
      }

      counts[clusterSet.id] = count;
    });

    setClusterSetCounts(counts);
  }, [clusters, clusterSets, loading, clustersLoading]);

  // Calculate binding counts for each cluster set
  useEffect(() => {
    if (bindings.length === 0 || clusterSets.length === 0 || loading || bindingsLoading) return;

    const counts: Record<string, number> = {};

    clusterSets.forEach(clusterSet => {
      const count = bindings.filter(binding => binding.clusterSet === clusterSet.name).length;
      counts[clusterSet.id] = count;
    });

    setBindingCounts(counts);
  }, [bindings, clusterSets, loading, bindingsLoading]);

  // Get unique selector types from cluster sets
  const getSelectorTypes = () => {
    const types = new Set<string>();
    clusterSets.forEach(clusterSet => {
      const selectorType = clusterSet.spec?.clusterSelector?.selectorType || 'Unknown';
      types.add(selectorType);
    });
    return Array.from(types);
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  const handleSelectorTypeChange = (event: SelectChangeEvent) => {
    setSelectorTypeFilter(event.target.value);
  };

  const handleClusterSetSelect = (id: string) => {
    navigate(`/clustersets/${id}`);
  };

  const handleRefresh = () => {
    const loadData = async () => {
      try {
        setLoading(true);
        setClustersLoading(true);
        setBindingsLoading(true);
        setError(null);

        const [clusterSetsData, clustersData, bindingsData] = await Promise.all([
          fetchClusterSets(),
          fetchClusters(),
          fetchClusterSetBindings()
        ]);

        setClusterSets(clusterSetsData);
        setClusters(clustersData);
        setBindings(bindingsData);

        setLoading(false);
        setClustersLoading(false);
        setBindingsLoading(false);
      } catch (error) {
        console.error('Error refreshing data:', error);
        setError('Failed to refresh data');
        setLoading(false);
        setClustersLoading(false);
        setBindingsLoading(false);
      }
    };

    loadData();
  };

  // Format date string
  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  // Filter cluster sets based on search term and selector type
  const filteredClusterSets = clusterSets.filter(
    (clusterSet) => {
      const nameMatches = clusterSet.name.toLowerCase().includes(searchTerm.toLowerCase());
      const selectorType = clusterSet.spec?.clusterSelector?.selectorType || 'Unknown';
      const selectorMatches = selectorTypeFilter === 'all' || selectorType === selectorTypeFilter;

      return nameMatches && selectorMatches;
    }
  );

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" sx={{ mb: 3, fontWeight: "bold" }}>
        ClusterSets
      </Typography>

      <Paper sx={{ p: 2, mb: 3, borderRadius: 2 }}>
        <Grid container spacing={2} alignItems="center" sx={{ width: '100%' }}>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search cluster sets..."
              value={searchTerm}
              onChange={handleSearchChange}
              variant="outlined"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <FormControl fullWidth size="small">
              <InputLabel id="selector-type-label">Selector Type</InputLabel>
              <Select
                labelId="selector-type-label"
                value={selectorTypeFilter}
                label="Selector Type"
                onChange={handleSelectorTypeChange}
              >
                <MenuItem value="all">All Types</MenuItem>
                {getSelectorTypes().map(type => (
                  <MenuItem key={type} value={type}>{type}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, md: 2 }} sx={{ display: "flex", justifyContent: "flex-end" }}>
            <Tooltip title="Refresh">
              <IconButton onClick={handleRefresh}>
                <RefreshIcon />
              </IconButton>
            </Tooltip>
          </Grid>
        </Grid>
      </Paper>

      {error && (
        <Paper sx={{ p: 2, mb: 3, bgcolor: alpha(theme.palette.error.main, 0.1), color: 'error.main' }}>
          <Typography>{error}</Typography>
        </Paper>
      )}

      {loading || clustersLoading || bindingsLoading ? (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell align="center">Clusters</TableCell>
                <TableCell align="center">Bindings</TableCell>
                <TableCell>Selector Type</TableCell>
                <TableCell>Created</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredClusterSets.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    <Typography sx={{ py: 2 }}>
                      No cluster sets found
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filteredClusterSets.map((clusterSet) => (
                  <TableRow
                    key={clusterSet.id}
                    onClick={() => handleClusterSetSelect(clusterSet.name)}
                    hover
                    sx={{
                      cursor: "pointer",
                      py: 1.5,
                      '& > td': {
                        padding: '12px 16px',
                      },
                      "&:hover": {
                        bgcolor: alpha(theme.palette.primary.main, 0.05),
                      },
                    }}
                  >
                    <TableCell>
                      <Typography sx={{ fontWeight: "medium" }}>
                        {clusterSet.name}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      {clusterSetCounts[clusterSet.id] || 0}
                    </TableCell>
                    <TableCell align="center">
                      {bindingCounts[clusterSet.id] || 0}
                    </TableCell>
                    <TableCell>
                      {clusterSet.spec?.clusterSelector?.selectorType || "N/A"}
                    </TableCell>
                    <TableCell>{formatDate(clusterSet.creationTimestamp)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
};

export default ClustersetList;