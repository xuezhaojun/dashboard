import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  CircularProgress,
} from "@mui/material";
import type { SelectChangeEvent } from "@mui/material";
import {
  Search as SearchIcon,
  Refresh as RefreshIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Launch as LaunchIcon,
} from "@mui/icons-material";
import { fetchPlacements } from '../api/placementService';
import type { Placement } from '../api/placementService';
import DrawerLayout from './layout/DrawerLayout';

/**
 * Page component for displaying a list of placements
 */
export default function PlacementListPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [placements, setPlacements] = useState<Placement[]>([]);
  const [loading, setLoading] = useState(true);

  // Get selected placement from URL query parameter
  const selectedPlacementId = searchParams.get('selected');

  // Find the selected placement in the list
  const selectedPlacementData = placements.find(p => p.id === selectedPlacementId);

  // Load placements on component mount
  useEffect(() => {
    const loadPlacements = async () => {
      try {
        setLoading(true);
        const placementData = await fetchPlacements();
        setPlacements(placementData);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching placement list:', error);
        setLoading(false);
      }
    };

    loadPlacements();
  }, []);

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  const handleFilterStatusChange = (event: SelectChangeEvent) => {
    setFilterStatus(event.target.value);
  };

  const handlePlacementSelect = (placementId: string) => {
    // Update URL with selected placement
    setSearchParams({ selected: placementId });
  };

  const handleCloseDetail = () => {
    // Remove selected parameter from URL
    setSearchParams({});
  };

  const handleViewFullDetails = () => {
    if (selectedPlacementId && selectedPlacementData) {
      navigate(`/placements/${selectedPlacementData.namespace}/${selectedPlacementData.name}`);
    }
  };

  // Get status icon based on satisfied condition
  const getStatusIcon = (satisfied: boolean) => {
    return satisfied ? (
      <CheckCircleIcon sx={{ color: "success.main" }} />
    ) : (
      <ErrorIcon sx={{ color: "error.main" }} />
    );
  };

  // Filter placements based on search term and status filter
  const filteredPlacements = placements.filter(placement => {
    const matchesSearch =
      placement.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      placement.namespace.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      filterStatus === 'all' ||
      (filterStatus === 'satisfied' && placement.satisfied) ||
      (filterStatus === 'unsatisfied' && !placement.satisfied);

    return matchesSearch && matchesStatus;
  });

  const placementStatusText = (placement: Placement) => {
    if (placement.satisfied) {
      return "Satisfied";
    } else {
      return placement.reasonMessage || "Unsatisfied";
    }
  };

  return (
    <Box sx={{ display: "flex", height: "calc(100vh - 64px)" }}>
      {/* Placement list */}
      <Box
        sx={{
          flex: selectedPlacementId ? "0 0 60%" : "1 1 auto",
          p: 3,
          transition: "flex 0.3s",
          overflow: "auto",
        }}
      >
        <Typography variant="h5" sx={{ mb: 3, fontWeight: "bold" }}>
          Placements
        </Typography>

        {/* Filters and search */}
        <Paper sx={{ p: 2, mb: 3, borderRadius: 2 }}>
          <Grid container spacing={2} alignItems="center" sx={{ width: '100%' }}>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                placeholder="Search placements..."
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
            <Grid size={{ xs: 12, md: 5 }}>
              <FormControl fullWidth size="small">
                <InputLabel id="filter-status-label">Status</InputLabel>
                <Select labelId="filter-status-label" value={filterStatus} label="Status" onChange={handleFilterStatusChange}>
                  <MenuItem value="all">All Statuses</MenuItem>
                  <MenuItem value="satisfied">Satisfied</MenuItem>
                  <MenuItem value="unsatisfied">Unsatisfied</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, md: 1 }} sx={{ display: "flex", justifyContent: "flex-end" }}>
              <Tooltip title="Refresh">
                <IconButton onClick={() => window.location.reload()}>
                  <RefreshIcon />
                </IconButton>
              </Tooltip>
            </Grid>
          </Grid>
        </Paper>

        {/* Placement Table */}
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Namespace</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="center">Requested</TableCell>
                  <TableCell align="center">Selected</TableCell>
                  <TableCell>ClusterSets</TableCell>
                  <TableCell>Created</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredPlacements.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center">
                      <Typography sx={{ py: 2 }}>
                        No placements found
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredPlacements.map((placement) => (
                    <TableRow
                      key={placement.id}
                      hover
                      selected={selectedPlacementId === placement.id}
                      sx={{
                        cursor: "pointer",
                        py: 1.5,
                        '& > td': {
                          padding: '12px 16px',
                        }
                      }}
                      onClick={() => handlePlacementSelect(placement.id)}
                    >
                      <TableCell>{placement.name}</TableCell>
                      <TableCell>{placement.namespace}</TableCell>
                      <TableCell>
                        <Box sx={{ display: "flex", alignItems: "center" }}>
                          {getStatusIcon(placement.satisfied)}
                          <Typography variant="body2" sx={{ ml: 1 }}>
                            {placementStatusText(placement)}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell align="center">
                        {placement.numberOfClusters ?? "All"}
                      </TableCell>
                      <TableCell align="center">
                        {placement.numberOfSelectedClusters}
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                          {placement.clusterSets && placement.clusterSets.length > 0 ? (
                            placement.clusterSets.map((set) => (
                              <Chip
                                key={set}
                                label={set}
                                size="small"
                                variant="outlined"
                              />
                            ))
                          ) : (
                            <Typography variant="body2" color="text.secondary">-</Typography>
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>
                        {placement.creationTimestamp
                          ? new Date(placement.creationTimestamp).toLocaleDateString()
                          : "-"}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Box>

      {/* Detail drawer */}
      {selectedPlacementId && selectedPlacementData && (
        <DrawerLayout
          title={`${selectedPlacementData.namespace}/${selectedPlacementData.name}`}
          onClose={handleCloseDetail}
        >
          <Box sx={{ mb: 2, display: "flex", justifyContent: "flex-start" }}>
            <Button
              variant="contained"
              onClick={handleViewFullDetails}
              endIcon={<LaunchIcon />}
            >
              View Full Details
            </Button>
          </Box>

          {/* Basic Placement Info */}
          <Paper sx={{ p: 2, mb: 3, borderRadius: 2 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Placement Overview
            </Typography>

            <Box sx={{ display: "flex", mb: 1 }}>
              <Typography variant="subtitle2" sx={{ width: 160 }}>Status:</Typography>
              <Box sx={{ display: "flex", alignItems: "center" }}>
                {getStatusIcon(selectedPlacementData.satisfied)}
                <Typography variant="body2" sx={{ ml: 1 }}>
                  {placementStatusText(selectedPlacementData)}
                </Typography>
              </Box>
            </Box>

            <Box sx={{ display: "flex", mb: 1 }}>
              <Typography variant="subtitle2" sx={{ width: 160 }}>Requested Clusters:</Typography>
              <Typography>{selectedPlacementData.numberOfClusters ?? "All matching"}</Typography>
            </Box>

            <Box sx={{ display: "flex", mb: 1 }}>
              <Typography variant="subtitle2" sx={{ width: 160 }}>Selected Clusters:</Typography>
              <Typography>{selectedPlacementData.numberOfSelectedClusters}</Typography>
            </Box>

            <Box sx={{ display: "flex", mb: 1 }}>
              <Typography variant="subtitle2" sx={{ width: 160 }}>ClusterSets:</Typography>
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                {selectedPlacementData.clusterSets && selectedPlacementData.clusterSets.length > 0 ? (
                  selectedPlacementData.clusterSets.map((set) => (
                    <Chip
                      key={set}
                      label={set}
                      size="small"
                      variant="outlined"
                    />
                  ))
                ) : (
                  <Typography variant="body2" color="text.secondary">None</Typography>
                )}
              </Box>
            </Box>

            <Box sx={{ display: "flex", mb: 1 }}>
              <Typography variant="subtitle2" sx={{ width: 160 }}>Created:</Typography>
              <Typography>
                {selectedPlacementData.creationTimestamp
                  ? new Date(selectedPlacementData.creationTimestamp).toLocaleString()
                  : "-"}
              </Typography>
            </Box>
          </Paper>

          {/* Decision Groups */}
          {selectedPlacementData.decisionGroups && selectedPlacementData.decisionGroups.length > 0 && (
            <Paper sx={{ p: 2, mb: 3, borderRadius: 2 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Decision Groups
              </Typography>

              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Group Index</TableCell>
                      <TableCell>Group Name</TableCell>
                      <TableCell align="center">Cluster Count</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {selectedPlacementData.decisionGroups.map((group) => (
                      <TableRow key={`${group.decisionGroupIndex}-${group.decisionGroupName}`}>
                        <TableCell>{group.decisionGroupIndex}</TableCell>
                        <TableCell>{group.decisionGroupName || "(default)"}</TableCell>
                        <TableCell align="center">{group.clusterCount}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          )}

          {/* Selected Clusters */}
          {selectedPlacementData.selectedClusters && selectedPlacementData.selectedClusters.length > 0 && (
            <Paper sx={{ p: 2, mb: 3, borderRadius: 2 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Selected Clusters
              </Typography>

              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Cluster Name</TableCell>
                      <TableCell>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {selectedPlacementData.selectedClusters.map((cluster) => (
                      <TableRow
                        key={cluster.id}
                        hover
                        sx={{ cursor: "pointer" }}
                        onClick={() => navigate(`/clusters/${cluster.name}`)}
                      >
                        <TableCell>{cluster.name}</TableCell>
                        <TableCell>
                          <Box sx={{ display: "flex", alignItems: "center" }}>
                            {cluster.status === "Online" ? (
                              <CheckCircleIcon sx={{ color: "success.main", fontSize: 16, mr: 1 }} />
                            ) : (
                              <ErrorIcon sx={{ color: "error.main", fontSize: 16, mr: 1 }} />
                            )}
                            {cluster.status}
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          )}
        </DrawerLayout>
      )}
    </Box>
  );
}