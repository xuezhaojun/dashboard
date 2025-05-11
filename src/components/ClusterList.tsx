import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Divider,
  Chip,
  Button,
  IconButton,
  TextField,
  InputAdornment,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Grid,
  Tab,
  Tabs,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  alpha,
  useTheme,
} from "@mui/material";
import type { SelectChangeEvent } from "@mui/material";
import {
  Search as SearchIcon,
  FilterList as FilterListIcon,
  Refresh as RefreshIcon,
  Add as AddIcon,
  ChevronLeft as ChevronLeftIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  MoreVert as MoreVertIcon,
  ContentCopy as ContentCopyIcon,
  Download as DownloadIcon,
} from "@mui/icons-material";
import { fetchClusters } from '../api/clusterService';
import type { Cluster } from '../api/clusterService';

// Gets the Hub Accepted status of a cluster
const getHubAcceptedStatus = (cluster: Cluster) => {
  return cluster.hubAccepted ? 'Accepted' : 'Not Accepted';
};

const ClusterList = () => {
  const theme = useTheme();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterRegion, setFilterRegion] = useState("all");
  const [selectedCluster, setSelectedCluster] = useState<string | null>(null);
  const [detailTab, setDetailTab] = useState(0);
  const [clusters, setClusters] = useState<Cluster[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadClusters = async () => {
      try {
        setLoading(true);
        const clusterData = await fetchClusters();
        setClusters(clusterData);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching clusters:', error);
        setLoading(false);
      }
    };

    loadClusters();
  }, []);

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  const handleFilterTypeChange = (event: SelectChangeEvent) => {
    setFilterType(event.target.value);
  };

  const handleFilterRegionChange = (event: SelectChangeEvent) => {
    setFilterRegion(event.target.value);
  };

  const handleClusterSelect = (clusterId: string) => {
    setSelectedCluster(clusterId);
  };

  const handleCloseDetail = () => {
    setSelectedCluster(null);
  };

  const handleDetailTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setDetailTab(newValue);
  };

  // Get the selected cluster
  const selectedClusterData = clusters.find((cluster) => cluster.id === selectedCluster);

  // Format date string
  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString() + " " + date.toLocaleTimeString();
  };

  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "healthy":
        return <CheckCircleIcon sx={{ color: "success.main" }} />;
      case "warning":
        return <WarningIcon sx={{ color: "warning.main" }} />;
      case "critical":
        return <ErrorIcon sx={{ color: "error.main" }} />;
      default:
        return null;
    }
  };

  // Get status text
  const getStatusText = (status: string) => {
    switch (status) {
      case "healthy":
        return "Healthy";
      case "warning":
        return "Warning";
      case "critical":
        return "Critical";
      default:
        return status;
    }
  };

  return (
    <Box sx={{ display: "flex", height: "calc(100vh - 64px)" }}>
      {/* Cluster list */}
      <Box
        sx={{
          flex: selectedCluster ? "0 0 60%" : "1 1 auto",
          p: 3,
          transition: "flex 0.3s",
          overflow: "auto",
        }}
      >
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
          <Typography variant="h5" sx={{ fontWeight: "bold" }}>
            Clusters
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
          >
            Add Cluster
          </Button>
        </Box>

        {/* Filters and search */}
        <Paper sx={{ p: 2, mb: 3, borderRadius: 2 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                fullWidth
                placeholder="Search clusters..."
                value={searchTerm}
                onChange={handleSearchChange}
                variant="outlined"
                size="small"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 3 }}>
              <FormControl fullWidth size="small">
                <InputLabel id="filter-type-label">Type</InputLabel>
                <Select labelId="filter-type-label" value={filterType} label="Type" onChange={handleFilterTypeChange}>
                  <MenuItem value="all">All Types</MenuItem>
                  <MenuItem value="production">Production</MenuItem>
                  <MenuItem value="staging">Staging</MenuItem>
                  <MenuItem value="development">Development</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, md: 3 }}>
              <FormControl fullWidth size="small">
                <InputLabel id="filter-region-label">Region</InputLabel>
                <Select
                  labelId="filter-region-label"
                  value={filterRegion}
                  label="Region"
                  onChange={handleFilterRegionChange}
                >
                  <MenuItem value="all">All Regions</MenuItem>
                  <MenuItem value="us-west-2">US West (Oregon)</MenuItem>
                  <MenuItem value="us-east-1">US East (N. Virginia)</MenuItem>
                  <MenuItem value="eu-west-1">EU West (Ireland)</MenuItem>
                  <MenuItem value="eu-central-1">EU Central (Frankfurt)</MenuItem>
                  <MenuItem value="ap-south-1">Asia Pacific (Mumbai)</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, md: 2 }} sx={{ display: "flex", justifyContent: "flex-end" }}>
              <Tooltip title="Refresh">
                <IconButton>
                  <RefreshIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="More filters">
                <IconButton>
                  <FilterListIcon />
                </IconButton>
              </Tooltip>
            </Grid>
          </Grid>
        </Paper>

        {/* Cluster list */}
        <TableContainer component={Paper} sx={{ mt: 3 }}>
          <Table>
            <TableHead sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1) }}>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Hub Accepted</TableCell>
                <TableCell>Version</TableCell>
                <TableCell>Region</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">Loading clusters...</TableCell>
                </TableRow>
              ) : clusters.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">No clusters found</TableCell>
                </TableRow>
              ) : (
                clusters.map((cluster) => (
                  <TableRow
                    key={cluster.id}
                    onClick={() => handleClusterSelect(cluster.id)}
                    sx={{
                      cursor: "pointer",
                      "&:hover": { bgcolor: alpha(theme.palette.primary.main, 0.05) },
                      bgcolor: selectedCluster === cluster.id ? alpha(theme.palette.primary.main, 0.1) : "inherit"
                    }}
                  >
                    <TableCell>
                      <Box sx={{ display: "flex", alignItems: "center" }}>
                        {getStatusIcon(cluster.status)}
                        <Typography sx={{ ml: 1, fontWeight: "medium" }}>
                          {cluster.name}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={cluster.status}
                        size="small"
                        color={
                          cluster.status === "Online" ? "success" :
                          cluster.status === "Offline" ? "error" : "default"
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={getHubAcceptedStatus(cluster)}
                        size="small"
                        color={cluster.hubAccepted ? "success" : "default"}
                      />
                    </TableCell>
                    <TableCell>{cluster.version || "Unknown"}</TableCell>
                    <TableCell>
                      {cluster.labels?.region || "-"}
                    </TableCell>
                    <TableCell>
                      <IconButton size="small">
                        <MoreVertIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      {/* Detail drawer */}
      {selectedCluster && selectedClusterData && (
        <Box
          sx={{
            flex: "0 0 40%",
            borderLeft: 1,
            borderColor: "divider",
            p: 3,
            overflow: "auto",
            backgroundColor: "background.paper",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
            <Box sx={{ display: "flex", alignItems: "center", flex: 1 }}>
              {getStatusIcon(selectedClusterData.status)}
              <Typography variant="h6" sx={{ fontWeight: "bold", ml: 1 }}>
                {selectedClusterData.name}
              </Typography>
            </Box>
            <IconButton onClick={handleCloseDetail}>
              <ChevronLeftIcon />
            </IconButton>
          </Box>

          <Box sx={{ mb: 3 }}>
            <Grid container spacing={2}>
              <Grid size={6}>
                <Typography variant="body2" color="text.secondary">
                  Cluster ID
                </Typography>
                <Typography variant="body1">{selectedClusterData.id}</Typography>
              </Grid>
              <Grid size={6}>
                <Typography variant="body2" color="text.secondary">
                  Status
                </Typography>
                <Typography variant="body1">{getStatusText(selectedClusterData.status)}</Typography>
              </Grid>
              <Grid size={6}>
                <Typography variant="body2" color="text.secondary">
                  Type
                </Typography>
                <Typography variant="body1" sx={{ textTransform: "capitalize" }}>
                  {selectedClusterData.labels?.env || "N/A"}
                </Typography>
              </Grid>
              <Grid size={6}>
                <Typography variant="body2" color="text.secondary">
                  Region
                </Typography>
                <Typography variant="body1">{selectedClusterData.labels?.region || "N/A"}</Typography>
              </Grid>
              <Grid size={6}>
                <Typography variant="body2" color="text.secondary">
                  Nodes
                </Typography>
                <Typography variant="body1">{selectedClusterData.nodes}</Typography>
              </Grid>
              <Grid size={6}>
                <Typography variant="body2" color="text.secondary">
                  Kubernetes Version
                </Typography>
                <Typography variant="body1">{selectedClusterData.version}</Typography>
              </Grid>
              <Grid size={12}>
                <Typography variant="body2" color="text.secondary">
                  Last Updated
                </Typography>
                <Typography variant="body1">
                  {formatDate(selectedClusterData.conditions?.[0]?.lastTransitionTime)}
                </Typography>
              </Grid>
            </Grid>
          </Box>

          <Box sx={{ mb: 3 }}>
            <Box sx={{ display: "flex", gap: 1 }}>
              <Button variant="contained">
                Manage
              </Button>
              <Button variant="outlined" startIcon={<ContentCopyIcon />}>
                Copy ID
              </Button>
              <Button variant="outlined" startIcon={<DownloadIcon />}>
                Export
              </Button>
            </Box>
          </Box>

          <Divider sx={{ my: 3 }} />

          <Box sx={{ width: "100%" }}>
            <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
              <Tabs value={detailTab} onChange={handleDetailTabChange} aria-label="cluster detail tabs">
                <Tab label="Nodes" />
                <Tab label="Namespaces" />
                <Tab label="Events" />
              </Tabs>
            </Box>

            {/* Node tab */}
            {detailTab === 0 && (
              <Box sx={{ mt: 2 }}>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Name</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Role</TableCell>
                        <TableCell>CPU</TableCell>
                        <TableCell>Memory</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      <TableRow>
                        <TableCell colSpan={5} align="center">Node data not available</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            )}

            {/* Namespace tab */}
            {detailTab === 1 && (
              <Box sx={{ mt: 2 }}>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Name</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Pods</TableCell>
                        <TableCell>Services</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      <TableRow>
                        <TableCell colSpan={4} align="center">Namespace data not available</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            )}

            {/* Events tab */}
            {detailTab === 2 && (
              <Box sx={{ mt: 2, p: 2, bgcolor: alpha(theme.palette.primary.main, 0.05), borderRadius: 1 }}>
                <Typography variant="body2" sx={{ fontFamily: "monospace", textAlign: "center" }}>
                  No event data available
                </Typography>
              </Box>
            )}
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default ClusterList;
