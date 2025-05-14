import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Chip,
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
} from "@mui/material";
import {
  Search as SearchIcon,
  Refresh as RefreshIcon,
  MoreVert as MoreVertIcon,
} from "@mui/icons-material";
import { useNavigate } from 'react-router-dom';
import { fetchClusterSets, type ClusterSet } from '../api/clusterSetService';

const ClustersetList = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [clusterSets, setClusterSets] = useState<ClusterSet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  const handleClusterSetSelect = (id: string) => {
    navigate(`/clustersets/${id}`);
  };

  // Format date string
  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString() + " " + date.toLocaleTimeString();
  };

  // Filter cluster sets based on search term
  const filteredClusterSets = clusterSets.filter(
    (clusterSet) => clusterSet.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ mb: 3 }}>ClusterSets</Typography>

      <Paper sx={{ p: 2, mb: 3, borderRadius: 2 }}>
        <Grid container spacing={2} alignItems="center" sx={{ width: '100%' }}>
          <Grid size={{ xs: 12, md: 10 }}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search cluster sets..."
              value={searchTerm}
              onChange={handleSearchChange}
              variant="outlined"
              sx={{ '& .MuiOutlinedInput-root': { paddingLeft: 0 } }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 2 }} sx={{ display: "flex", justifyContent: "flex-end" }}>
            <Tooltip title="Refresh">
              <IconButton>
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

      <TableContainer component={Paper} sx={{ mt: 3 }}>
        <Table>
          <TableHead sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1) }}>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Clusters</TableCell>
              <TableCell>Selector Type</TableCell>
              <TableCell>Labels</TableCell>
              <TableCell>Created</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} align="center">Loading cluster sets...</TableCell>
              </TableRow>
            ) : filteredClusterSets.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center">No cluster sets found</TableCell>
              </TableRow>
            ) : (
              filteredClusterSets.map((clusterSet) => (
                <TableRow
                  key={clusterSet.id}
                  onClick={() => handleClusterSetSelect(clusterSet.name)}
                  sx={{
                    cursor: "pointer",
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
                  <TableCell>
                    <Chip
                      label={clusterSet.clusterCount}
                      size="small"
                      color="primary"
                    />
                  </TableCell>
                  <TableCell>
                    {clusterSet.spec?.clusterSelector?.selectorType || "N/A"}
                  </TableCell>
                  <TableCell>
                    {clusterSet.labels ? (
                      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
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
                      "-"
                    )}
                  </TableCell>
                  <TableCell>{formatDate(clusterSet.creationTimestamp)}</TableCell>
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
  );
};

export default ClustersetList;