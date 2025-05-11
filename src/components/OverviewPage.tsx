import { Box, Typography, Paper, Grid, alpha, useTheme } from "@mui/material"
import { CheckCircle as CheckCircleIcon, Storage as StorageIcon } from "@mui/icons-material"

// Mock data
const clusterStats = {
  total: 12,
  available: 8,
  regions: [
    { name: "us-west", count: 4 },
    { name: "us-east", count: 3 },
    { name: "eu-west", count: 3 },
    { name: "ap-south", count: 2 },
  ],
}

export default function OverviewPage() {
  const theme = useTheme()

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" sx={{ mb: 3, fontWeight: "bold" }}>
        Overview
      </Typography>

      {/* Simplified KPI cards */}
      <Grid container spacing={3}>
        {/* All clusters card */}
        <Grid sx={{ gridColumn: { xs: "span 12", md: "span 6" } }}>
          <Paper
            sx={{
              p: 3,
              height: "100%",
              borderRadius: 2,
              display: "flex",
              flexDirection: "column",
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 48,
                  height: 48,
                  borderRadius: 2,
                  bgcolor: alpha(theme.palette.primary.main, 0.1),
                  mr: 2,
                }}
              >
                <StorageIcon sx={{ color: "primary.main", fontSize: 24 }} />
              </Box>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  All Clusters
                </Typography>
                <Typography variant="h3" sx={{ fontWeight: "medium" }}>
                  {clusterStats.total}
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>

        {/* Available clusters card */}
        <Grid sx={{ gridColumn: { xs: "span 12", md: "span 6" } }}>
          <Paper
            sx={{
              p: 3,
              height: "100%",
              borderRadius: 2,
              display: "flex",
              flexDirection: "column",
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 48,
                  height: 48,
                  borderRadius: 2,
                  bgcolor: alpha(theme.palette.success.main, 0.1),
                  mr: 2,
                }}
              >
                <CheckCircleIcon sx={{ color: "success.main", fontSize: 24 }} />
              </Box>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  Available Clusters
                </Typography>
                <Typography variant="h3" sx={{ fontWeight: "medium" }}>
                  {clusterStats.available}
                </Typography>
              </Box>
            </Box>

            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Availability Rate
            </Typography>

            <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
              <Box
                sx={{
                  height: 8,
                  width: "100%",
                  bgcolor: alpha(theme.palette.success.main, 0.1),
                  borderRadius: 4,
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                <Box
                  sx={{
                    position: "absolute",
                    left: 0,
                    top: 0,
                    height: "100%",
                    width: `${(clusterStats.available / clusterStats.total) * 100}%`,
                    bgcolor: "success.main",
                    borderRadius: 4,
                  }}
                />
              </Box>
              <Typography variant="body2" fontWeight="medium" sx={{ ml: 2, minWidth: 40 }}>
                {Math.round((clusterStats.available / clusterStats.total) * 100)}%
              </Typography>
            </Box>

            <Box sx={{ mt: "auto" }}>
              <Typography variant="body2" color="text.secondary">
                {clusterStats.total - clusterStats.available} clusters currently unavailable
              </Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  )
}