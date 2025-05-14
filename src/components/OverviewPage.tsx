import { Box, Typography, Paper, Grid, alpha, useTheme } from "@mui/material"
import { CheckCircle as CheckCircleIcon, Storage as StorageIcon } from "@mui/icons-material"
import { useEffect, useState } from "react"
import { fetchClusters } from "../api/clusterService"
import type { Cluster } from "../api/clusterService"

export default function OverviewPage() {
  const theme = useTheme()
  const [clusters, setClusters] = useState<Cluster[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadClusters = async () => {
      setLoading(true)
      try {
        const data = await fetchClusters()
        setClusters(data)
      } finally {
        setLoading(false)
      }
    }
    loadClusters()
  }, [])

  // Calculate stats from real data
  const total = clusters.length
  const available = clusters.filter(
    c => c.status === "Online" || c.status === "healthy" || c.status === "Available"
  ).length

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" sx={{ mb: 3, fontWeight: "bold" }}>
        Overview
      </Typography>

      {/* Simplified KPI cards */}
      <Grid container spacing={3} sx={{ width: '100%' }}>
        {/* All clusters card */}
        <Grid size={{ xs: 12, md: 6 }}>
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
                  {loading ? "-" : total}
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>

        {/* Available clusters card */}
        <Grid size={{ xs: 12, md: 6 }}>
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
                  {loading ? "-" : available}
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
                    width: total > 0 ? `${(available / total) * 100}%` : 0,
                    bgcolor: "success.main",
                    borderRadius: 4,
                  }}
                />
              </Box>
              <Typography variant="body2" fontWeight="medium" sx={{ ml: 2, minWidth: 40 }}>
                {loading || total === 0 ? '-' : Math.round((available / total) * 100)}%
              </Typography>
            </Box>

            <Box sx={{ mt: "auto" }}>
              <Typography variant="body2" color="text.secondary">
                {loading ? '-' : total - available} clusters currently unavailable
              </Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  )
}