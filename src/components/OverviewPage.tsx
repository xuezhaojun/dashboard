import { useState } from "react"
import {
  Box,
  Typography,
  Paper,
  Grid,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  alpha,
  useTheme,
  Card,
  CardContent,
  CardHeader,
  Button,
  LinearProgress,
  Tab,
  Tabs,
} from "@mui/material"
import {
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  ArrowUpward as ArrowUpwardIcon,
  ArrowDownward as ArrowDownwardIcon,
  Storage as StorageIcon,
  Memory as MemoryIcon,
  Speed as SpeedIcon,
  Dns as DnsIcon,
} from "@mui/icons-material"

// 模拟数据
const clusterStats = {
  total: 12,
  healthy: 8,
  warning: 3,
  critical: 1,
  regions: [
    { name: "us-west", count: 4 },
    { name: "us-east", count: 3 },
    { name: "eu-west", count: 3 },
    { name: "ap-south", count: 2 },
  ],
}

const resourceStats = {
  nodes: { total: 86, active: 82 },
  pods: { total: 342, running: 328 },
  deployments: { total: 48, healthy: 45 },
  services: { total: 64, healthy: 62 },
}

const recentActivities = [
  {
    id: 1,
    type: "warning",
    message: "High CPU usage detected on cluster-3.example.com",
    time: "10 minutes ago",
  },
  {
    id: 2,
    type: "success",
    message: "New node added to cluster-1.example.com",
    time: "25 minutes ago",
  },
  {
    id: 3,
    type: "error",
    message: "Failed to deploy application on cluster-5.example.com",
    time: "1 hour ago",
  },
  {
    id: 4,
    type: "success",
    message: "Kubernetes updated to v1.26.5 on cluster-2.example.com",
    time: "2 hours ago",
  },
  {
    id: 5,
    type: "warning",
    message: "Memory usage approaching limit on cluster-4.example.com",
    time: "3 hours ago",
  },
]

// 模拟资源使用数据
const resourceUsage = {
  cpu: 68,
  memory: 72,
  storage: 45,
  network: 58,
}

export default function OverviewPage() {
  const theme = useTheme()
  const [tabValue, setTabValue] = useState(0)

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue)
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" sx={{ mb: 3, fontWeight: "bold" }}>
        Overview
      </Typography>

      {/* KPI 卡片 */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={6} lg={3}>
          <Paper
            sx={{
              p: 2,
              display: "flex",
              flexDirection: "column",
              height: 140,
              borderRadius: 2,
            }}
          >
            <Typography variant="subtitle2" color="text.secondary">
              Total Clusters
            </Typography>
            <Typography variant="h3" sx={{ my: 2, fontWeight: "medium" }}>
              {clusterStats.total}
            </Typography>
            <Box sx={{ display: "flex", alignItems: "center" }}>
              <ArrowUpwardIcon sx={{ color: "success.main", mr: 0.5, fontSize: "0.9rem" }} />
              <Typography variant="body2" color="success.main">
                2 new this month
              </Typography>
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12} md={6} lg={3}>
          <Paper
            sx={{
              p: 2,
              display: "flex",
              flexDirection: "column",
              height: 140,
              borderRadius: 2,
            }}
          >
            <Typography variant="subtitle2" color="text.secondary">
              Total Nodes
            </Typography>
            <Typography variant="h3" sx={{ my: 2, fontWeight: "medium" }}>
              {resourceStats.nodes.total}
            </Typography>
            <Box sx={{ display: "flex", alignItems: "center" }}>
              <ArrowUpwardIcon sx={{ color: "success.main", mr: 0.5, fontSize: "0.9rem" }} />
              <Typography variant="body2" color="success.main">
                4 new this week
              </Typography>
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12} md={6} lg={3}>
          <Paper
            sx={{
              p: 2,
              display: "flex",
              flexDirection: "column",
              height: 140,
              borderRadius: 2,
            }}
          >
            <Typography variant="subtitle2" color="text.secondary">
              Running Pods
            </Typography>
            <Typography variant="h3" sx={{ my: 2, fontWeight: "medium" }}>
              {resourceStats.pods.running}
            </Typography>
            <Box sx={{ display: "flex", alignItems: "center" }}>
              <ArrowUpwardIcon sx={{ color: "success.main", mr: 0.5, fontSize: "0.9rem" }} />
              <Typography variant="body2" color="success.main">
                12 more than yesterday
              </Typography>
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12} md={6} lg={3}>
          <Paper
            sx={{
              p: 2,
              display: "flex",
              flexDirection: "column",
              height: 140,
              borderRadius: 2,
            }}
          >
            <Typography variant="subtitle2" color="text.secondary">
              Deployments
            </Typography>
            <Typography variant="h3" sx={{ my: 2, fontWeight: "medium" }}>
              {resourceStats.deployments.total}
            </Typography>
            <Box sx={{ display: "flex", alignItems: "center" }}>
              <ArrowDownwardIcon sx={{ color: "error.main", mr: 0.5, fontSize: "0.9rem" }} />
              <Typography variant="body2" color="error.main">
                2 less than last week
              </Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* 集群健康状态和资源使用情况 */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* 集群健康状态 */}
        <Grid item xs={12} lg={6}>
          <Card sx={{ borderRadius: 2 }}>
            <CardHeader title="Cluster Health" />
            <Divider />
            <CardContent>
              <Box sx={{ display: "flex", justifyContent: "space-around", mb: 3 }}>
                <Box sx={{ textAlign: "center" }}>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: 60,
                      height: 60,
                      borderRadius: "50%",
                      bgcolor: alpha(theme.palette.success.main, 0.1),
                      mb: 1,
                      mx: "auto",
                    }}
                  >
                    <CheckCircleIcon sx={{ color: "success.main", fontSize: 30 }} />
                  </Box>
                  <Typography variant="h6">{clusterStats.healthy}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Healthy
                  </Typography>
                </Box>
                <Box sx={{ textAlign: "center" }}>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: 60,
                      height: 60,
                      borderRadius: "50%",
                      bgcolor: alpha(theme.palette.warning.main, 0.1),
                      mb: 1,
                      mx: "auto",
                    }}
                  >
                    <WarningIcon sx={{ color: "warning.main", fontSize: 30 }} />
                  </Box>
                  <Typography variant="h6">{clusterStats.warning}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Warning
                  </Typography>
                </Box>
                <Box sx={{ textAlign: "center" }}>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: 60,
                      height: 60,
                      borderRadius: "50%",
                      bgcolor: alpha(theme.palette.error.main, 0.1),
                      mb: 1,
                      mx: "auto",
                    }}
                  >
                    <ErrorIcon sx={{ color: "error.main", fontSize: 30 }} />
                  </Box>
                  <Typography variant="h6">{clusterStats.critical}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Critical
                  </Typography>
                </Box>
              </Box>

              <Divider sx={{ my: 2 }} />

              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Clusters by Region
              </Typography>
              <Grid container spacing={2}>
                {clusterStats.regions.map((region) => (
                  <Grid item xs={6} key={region.name}>
                    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <Typography variant="body2">{region.name}</Typography>
                      <Chip
                        label={region.count}
                        size="small"
                        sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1), color: "primary.main" }}
                      />
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* 资源使用情况 */}
        <Grid item xs={12} lg={6}>
          <Card sx={{ borderRadius: 2 }}>
            <CardHeader title="Resource Utilization" />
            <Divider />
            <CardContent>
              <Box sx={{ mb: 3 }}>
                <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                  <MemoryIcon sx={{ mr: 1, color: "primary.main" }} />
                  <Typography variant="body2">CPU Usage</Typography>
                  <Typography variant="body2" sx={{ ml: "auto" }}>
                    {resourceUsage.cpu}%
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={resourceUsage.cpu}
                  sx={{
                    height: 8,
                    borderRadius: 4,
                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                    "& .MuiLinearProgress-bar": {
                      bgcolor:
                        resourceUsage.cpu > 80
                          ? "error.main"
                          : resourceUsage.cpu > 60
                            ? "warning.main"
                            : "primary.main",
                    },
                  }}
                />
              </Box>

              <Box sx={{ mb: 3 }}>
                <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                  <StorageIcon sx={{ mr: 1, color: "primary.main" }} />
                  <Typography variant="body2">Memory Usage</Typography>
                  <Typography variant="body2" sx={{ ml: "auto" }}>
                    {resourceUsage.memory}%
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={resourceUsage.memory}
                  sx={{
                    height: 8,
                    borderRadius: 4,
                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                    "& .MuiLinearProgress-bar": {
                      bgcolor:
                        resourceUsage.memory > 80
                          ? "error.main"
                          : resourceUsage.memory > 60
                            ? "warning.main"
                            : "primary.main",
                    },
                  }}
                />
              </Box>

              <Box sx={{ mb: 3 }}>
                <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                  <DnsIcon sx={{ mr: 1, color: "primary.main" }} />
                  <Typography variant="body2">Storage Usage</Typography>
                  <Typography variant="body2" sx={{ ml: "auto" }}>
                    {resourceUsage.storage}%
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={resourceUsage.storage}
                  sx={{
                    height: 8,
                    borderRadius: 4,
                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                    "& .MuiLinearProgress-bar": {
                      bgcolor:
                        resourceUsage.storage > 80
                          ? "error.main"
                          : resourceUsage.storage > 60
                            ? "warning.main"
                            : "primary.main",
                    },
                  }}
                />
              </Box>

              <Box>
                <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                  <SpeedIcon sx={{ mr: 1, color: "primary.main" }} />
                  <Typography variant="body2">Network Usage</Typography>
                  <Typography variant="body2" sx={{ ml: "auto" }}>
                    {resourceUsage.network}%
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={resourceUsage.network}
                  sx={{
                    height: 8,
                    borderRadius: 4,
                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                    "& .MuiLinearProgress-bar": {
                      bgcolor:
                        resourceUsage.network > 80
                          ? "error.main"
                          : resourceUsage.network > 60
                            ? "warning.main"
                            : "primary.main",
                    },
                  }}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* 最近活动 */}
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Card sx={{ borderRadius: 2 }}>
            <CardHeader
              title="Recent Activities"
              action={
                <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
                  <Tabs value={tabValue} onChange={handleTabChange} aria-label="activity tabs">
                    <Tab label="All" />
                    <Tab label="Warnings" />
                    <Tab label="System" />
                  </Tabs>
                </Box>
              }
            />
            <Divider />
            <List>
              {recentActivities.map((activity) => (
                <div key={activity.id}>
                  <ListItem>
                    <ListItemIcon>
                      {activity.type === "success" ? (
                        <CheckCircleIcon sx={{ color: "success.main" }} />
                      ) : activity.type === "warning" ? (
                        <WarningIcon sx={{ color: "warning.main" }} />
                      ) : (
                        <ErrorIcon sx={{ color: "error.main" }} />
                      )}
                    </ListItemIcon>
                    <ListItemText
                      primary={activity.message}
                      secondary={activity.time}
                      primaryTypographyProps={{ variant: "body2" }}
                      secondaryTypographyProps={{ variant: "caption" }}
                    />
                  </ListItem>
                  <Divider variant="inset" component="li" />
                </div>
              ))}
            </List>
            <Box sx={{ p: 2, display: "flex", justifyContent: "center" }}>
              <Button variant="text" sx={{ color: "#4f46e5" }}>
                View All Activities
              </Button>
            </Box>
          </Card>
        </Grid>
      </Grid>
    </Box>
  )
}