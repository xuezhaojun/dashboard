import { Box, Typography, Paper, Button } from "@mui/material"
import { useNavigate } from "react-router-dom"

interface PlaceholderPageProps {
  title: string
}

export default function PlaceholderPage({ title }: PlaceholderPageProps) {
  const navigate = useNavigate()

  return (
    <Box sx={{ p: 3, height: "100%" }}>
      <Typography variant="h5" sx={{ mb: 3, fontWeight: "bold" }}>
        {title}
      </Typography>

      <Paper
        sx={{
          p: 4,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          height: "calc(100% - 80px)",
          borderRadius: 2,
          bgcolor: (theme) => (theme.palette.mode === "light" ? "white" : "background.paper"),
        }}
      >
        <Typography variant="h6" sx={{ mb: 2, color: "text.secondary" }}>
          {title} Page Coming Soon
        </Typography>
        <Typography variant="body1" sx={{ mb: 4, textAlign: "center", maxWidth: 600, color: "text.secondary" }}>
          This page is currently under development. Check back later for updates on {title.toLowerCase()} management
          features.
        </Typography>
        <Button
          variant="contained"
          onClick={() => navigate("/clusters")}
        >
          Back to Dashboard
        </Button>
      </Paper>
    </Box>
  )
}