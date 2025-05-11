import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Divider,
  Chip,
  IconButton,
  TextField,
  InputAdornment,
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
import {
  Search as SearchIcon,
  ChevronLeft as ChevronLeftIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  MoreVert as MoreVertIcon,
} from "@mui/icons-material";
import { fetchClusters } from '../api/clusterService';

// Simulated cluster data
const clusters = [
  {
    id: "cluster-1",
    name: "production-us-west",
    status: "healthy",
    region: "us-west-2",
    nodes: 12,
    version: "1.26.5",
    lastUpdated: "2023-05-15T10:30:00Z",
  },
  {
    id: "cluster-2",
    name: "production-us-east",
    status: "warning",
    region: "us-east-1",
    nodes: 8,
    version: "1.26.5",
    lastUpdated: "2023-05-14T08:45:00Z",
  },
  {
    id: "cluster-3",
    name: "staging-eu-west",
    status: "healthy",
    region: "eu-west-1",
    nodes: 6,
    version: "1.25.9",
    lastUpdated: "2023-05-13T14:20:00Z",
  },
  {
    id: "cluster-4",
    name: "development-ap-south",
    status: "critical",
    region: "ap-south-1",
    nodes: 4,
    version: "1.25.9",
    lastUpdated: "2023-05-12T09:15:00Z",
  },
  {
    id: "cluster-5",
    name: "production-eu-central",
    status: "healthy",
    region: "eu-central-1",
    nodes: 10,
    version: "1.26.5",
    lastUpdated: "2023-05-11T16:40:00Z",
  },
  {
    id: "cluster-6",
    name: "staging-us-west",
    status: "warning",
    region: "us-west-2",
    nodes: 5,
    version: "1.25.9",
    lastUpdated: "2023-05-10T11:25:00Z",
  },
  {
    id: "cluster-7",
    name: "development-us-east",
    status: "healthy",
    region: "us-east-1",
    nodes: 3,
    version: "1.24.12",
    lastUpdated: "2023-05-09T13:50:00Z",
  },
];

// Simulated node data
const nodes = [
  { id: "node-1", name: "ip-10-0-1-101", status: "ready", role: "master", cpu: "4 cores", memory: "16 GiB" },
  { id: "node-2", name: "ip-10-0-1-102", status: "ready", role: "worker", cpu: "8 cores", memory: "32 GiB" },
  { id: "node-3", name: "ip-10-0-1-103", status: "ready", role: "worker", cpu: "8 cores", memory: "32 GiB" },
  { id: "node-4", name: "ip-10-0-1-104", status: "not-ready", role: "worker", cpu: "8 cores", memory: "32 GiB" },
  { id: "node-5", name: "ip-10-0-1-105", status: "ready", role: "worker", cpu: "8 cores", memory: "32 GiB" },
];



export default function ClusterListPage() {
  const theme = useTheme();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCluster, setSelectedCluster] = useState<string | null>(null);
  const [detailTab, setDetailTab] = useState(0);

  useEffect(() => {
    const loadClusters = async () => {
      try {
        await fetchClusters();
      } catch (error) {
        console.error('Error fetching clusters:', error);
      }
    };

    loadClusters();
  }, []);

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
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

  // Filter clusters
  const filteredClusters = clusters.filter((cluster) => {
    const matchesSearch = cluster.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  // Get selected cluster
  const selectedClusterData = clusters.find((cluster) => cluster.id === selectedCluster);

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
          </Grid>
        </Paper>

        {/* Cluster list */}
        <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
          <Table sx={{ minWidth: 650 }}>
            <TableHead>
              <TableRow>
                <TableCell>Status</TableCell>
                <TableCell>Name</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredClusters.map((cluster) => (
                <TableRow
                  key={cluster.id}
                  hover
                  onClick={() => handleClusterSelect(cluster.id)}
                  sx={{ cursor: "pointer", "&:last-child td, &:last-child th": { border: 0 } }}
                >
                  <TableCell>
                    <Tooltip title={getStatusText(cluster.status)}>
                      <Box>{getStatusIcon(cluster.status)}</Box>
                    </Tooltip>
                  </TableCell>
                  <TableCell component="th" scope="row">
                    {cluster.name}
                  </TableCell>
                  <TableCell align="right">
                    <IconButton size="small" onClick={(e) => e.stopPropagation()}>
                      <MoreVertIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
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
                  Status
                </Typography>
                <Typography variant="body1">{getStatusText(selectedClusterData.status)}</Typography>
              </Grid>
            </Grid>
          </Box>

          <Divider sx={{ my: 3 }} />

          <Box sx={{ width: "100%" }}>
            <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
              <Tabs value={detailTab} onChange={handleDetailTabChange} aria-label="cluster detail tabs">
                <Tab label="Nodes" />
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
                      {nodes.map((node) => (
                        <TableRow key={node.id}>
                          <TableCell>{node.name}</TableCell>
                          <TableCell>
                            <Chip
                              label={node.status}
                              size="small"
                              sx={{
                                bgcolor:
                                  node.status === "ready"
                                    ? alpha(theme.palette.success.main, 0.1)
                                    : alpha(theme.palette.error.main, 0.1),
                                color: node.status === "ready" ? "success.main" : "error.main",
                              }}
                            />
                          </TableCell>
                          <TableCell>{node.role}</TableCell>
                          <TableCell>{node.cpu}</TableCell>
                          <TableCell>{node.memory}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            )}
          </Box>
        </Box>
      )}
    </Box>
  );
}