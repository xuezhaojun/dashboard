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

// 模拟集群数据
const clusters = [
  {
    id: "cluster-1",
    name: "production-us-west",
    status: "healthy",
    region: "us-west-2",
    nodes: 12,
    version: "1.26.5",
    type: "production",
    lastUpdated: "2023-05-15T10:30:00Z",
  },
  {
    id: "cluster-2",
    name: "production-us-east",
    status: "warning",
    region: "us-east-1",
    nodes: 8,
    version: "1.26.5",
    type: "production",
    lastUpdated: "2023-05-14T08:45:00Z",
  },
  {
    id: "cluster-3",
    name: "staging-eu-west",
    status: "healthy",
    region: "eu-west-1",
    nodes: 6,
    version: "1.25.9",
    type: "staging",
    lastUpdated: "2023-05-13T14:20:00Z",
  },
  {
    id: "cluster-4",
    name: "development-ap-south",
    status: "critical",
    region: "ap-south-1",
    nodes: 4,
    version: "1.25.9",
    type: "development",
    lastUpdated: "2023-05-12T09:15:00Z",
  },
  {
    id: "cluster-5",
    name: "production-eu-central",
    status: "healthy",
    region: "eu-central-1",
    nodes: 10,
    version: "1.26.5",
    type: "production",
    lastUpdated: "2023-05-11T16:40:00Z",
  },
  {
    id: "cluster-6",
    name: "staging-us-west",
    status: "warning",
    region: "us-west-2",
    nodes: 5,
    version: "1.25.9",
    type: "staging",
    lastUpdated: "2023-05-10T11:25:00Z",
  },
  {
    id: "cluster-7",
    name: "development-us-east",
    status: "healthy",
    region: "us-east-1",
    nodes: 3,
    version: "1.24.12",
    type: "development",
    lastUpdated: "2023-05-09T13:50:00Z",
  },
];

// 模拟节点数据
const nodes = [
  { id: "node-1", name: "ip-10-0-1-101", status: "ready", role: "master", cpu: "4 cores", memory: "16 GiB" },
  { id: "node-2", name: "ip-10-0-1-102", status: "ready", role: "worker", cpu: "8 cores", memory: "32 GiB" },
  { id: "node-3", name: "ip-10-0-1-103", status: "ready", role: "worker", cpu: "8 cores", memory: "32 GiB" },
  { id: "node-4", name: "ip-10-0-1-104", status: "not-ready", role: "worker", cpu: "8 cores", memory: "32 GiB" },
  { id: "node-5", name: "ip-10-0-1-105", status: "ready", role: "worker", cpu: "8 cores", memory: "32 GiB" },
];

// 模拟命名空间数据
const namespaces = [
  { id: "ns-1", name: "default", status: "active", pods: 5, services: 3 },
  { id: "ns-2", name: "kube-system", status: "active", pods: 12, services: 8 },
  { id: "ns-3", name: "monitoring", status: "active", pods: 8, services: 4 },
  { id: "ns-4", name: "logging", status: "active", pods: 6, services: 2 },
  { id: "ns-5", name: "app-frontend", status: "active", pods: 3, services: 1 },
  { id: "ns-6", name: "app-backend", status: "active", pods: 4, services: 2 },
];

export default function ClusterListPage() {
  const theme = useTheme();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterRegion, setFilterRegion] = useState("all");
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

  // 过滤集群
  const filteredClusters = clusters.filter((cluster) => {
    const matchesSearch = cluster.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === "all" || cluster.type === filterType;
    const matchesRegion = filterRegion === "all" || cluster.region === filterRegion;
    return matchesSearch && matchesType && matchesRegion;
  });

  // 获取选中的集群
  const selectedClusterData = clusters.find((cluster) => cluster.id === selectedCluster);

  // 格式化日期
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + " " + date.toLocaleTimeString();
  };

  // 获取状态图标
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

  // 获取状态文本
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
      {/* 集群列表 */}
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
            sx={{ bgcolor: "#4f46e5", "&:hover": { bgcolor: "#4338ca" } }}
          >
            Add Cluster
          </Button>
        </Box>

        {/* 过滤器和搜索 */}
        <Paper sx={{ p: 2, mb: 3, borderRadius: 2 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
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
            <Grid item xs={12} md={3}>
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
            <Grid item xs={12} md={3}>
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
            <Grid item xs={12} md={2} sx={{ display: "flex", justifyContent: "flex-end" }}>
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

        {/* 集群列表 */}
        <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
          <Table sx={{ minWidth: 650 }}>
            <TableHead>
              <TableRow>
                <TableCell>Status</TableCell>
                <TableCell>Name</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Region</TableCell>
                <TableCell>Nodes</TableCell>
                <TableCell>Version</TableCell>
                <TableCell>Last Updated</TableCell>
                <TableCell align="right">Actions</TableCell>
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
                  <TableCell>
                    <Chip
                      label={cluster.type}
                      size="small"
                      sx={{
                        bgcolor:
                          cluster.type === "production"
                            ? alpha(theme.palette.primary.main, 0.1)
                            : cluster.type === "staging"
                              ? alpha(theme.palette.warning.main, 0.1)
                              : alpha(theme.palette.info.main, 0.1),
                        color:
                          cluster.type === "production"
                            ? "primary.main"
                            : cluster.type === "staging"
                              ? "warning.main"
                              : "info.main",
                      }}
                    />
                  </TableCell>
                  <TableCell>{cluster.region}</TableCell>
                  <TableCell>{cluster.nodes}</TableCell>
                  <TableCell>{cluster.version}</TableCell>
                  <TableCell>{formatDate(cluster.lastUpdated)}</TableCell>
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

      {/* 详情抽屉 */}
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
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">
                  Cluster ID
                </Typography>
                <Typography variant="body1">{selectedClusterData.id}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">
                  Status
                </Typography>
                <Typography variant="body1">{getStatusText(selectedClusterData.status)}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">
                  Type
                </Typography>
                <Typography variant="body1" sx={{ textTransform: "capitalize" }}>
                  {selectedClusterData.type}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">
                  Region
                </Typography>
                <Typography variant="body1">{selectedClusterData.region}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">
                  Nodes
                </Typography>
                <Typography variant="body1">{selectedClusterData.nodes}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">
                  Kubernetes Version
                </Typography>
                <Typography variant="body1">{selectedClusterData.version}</Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="body2" color="text.secondary">
                  Last Updated
                </Typography>
                <Typography variant="body1">{formatDate(selectedClusterData.lastUpdated)}</Typography>
              </Grid>
            </Grid>
          </Box>

          <Box sx={{ mb: 3 }}>
            <Box sx={{ display: "flex", gap: 1 }}>
              <Button variant="contained" sx={{ bgcolor: "#4f46e5", "&:hover": { bgcolor: "#4338ca" } }}>
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

            {/* 节点选项卡 */}
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

            {/* 命名空间选项卡 */}
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
                      {namespaces.map((namespace) => (
                        <TableRow key={namespace.id}>
                          <TableCell>{namespace.name}</TableCell>
                          <TableCell>
                            <Chip
                              label={namespace.status}
                              size="small"
                              sx={{
                                bgcolor: alpha(theme.palette.success.main, 0.1),
                                color: "success.main",
                              }}
                            />
                          </TableCell>
                          <TableCell>{namespace.pods}</TableCell>
                          <TableCell>{namespace.services}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            )}

            {/* 事件选项卡 */}
            {detailTab === 2 && (
              <Box sx={{ mt: 2, p: 2, bgcolor: alpha(theme.palette.primary.main, 0.05), borderRadius: 1 }}>
                <Typography variant="body2" sx={{ fontFamily: "monospace" }}>
                  2023-05-15T10:30:00Z - System - ClusterHealthCheck - Cluster health check completed successfully
                  <br />
                  2023-05-15T10:15:00Z - System - NodeAdded - New node added to the cluster
                  <br />
                  2023-05-15T09:45:00Z - Warning - MemoryPressure - Node ip-10-0-1-104 is under memory pressure
                  <br />
                  2023-05-15T09:30:00Z - System - DeploymentScaled - Deployment frontend scaled to 3 replicas
                  <br />
                  2023-05-15T09:00:00Z - System - KubernetesUpgrade - Kubernetes upgraded to version 1.26.5
                </Typography>
              </Box>
            )}
          </Box>
        </Box>
      )}
    </Box>
  );
}