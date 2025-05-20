import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Chip,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tab,
  Tabs,
  Divider,
  Button,
  IconButton,
  Alert,
  CircularProgress,
  Tooltip,
} from "@mui/material";
import {
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  ArrowBack as ArrowBackIcon,
  Refresh as RefreshIcon,
} from "@mui/icons-material";
import { fetchPlacementByName, fetchPlacementDecisions } from '../api/placementService';
import type { Placement, PlacementDecision } from '../api/placementService';
import { useTheme } from '@mui/material/styles';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`tabpanel-${index}`}
      aria-labelledby={`tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ py: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

/**
 * Page component for displaying detailed information about a placement
 */
export default function PlacementDetailPage() {
  const { namespace, name } = useParams<{ namespace: string; name: string }>();
  const navigate = useNavigate();
  const theme = useTheme();

  const [placement, setPlacement] = useState<Placement | null>(null);
  const [decisions, setDecisions] = useState<PlacementDecision[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState(0);

  // Load placement data on component mount
  useEffect(() => {
    const loadPlacement = async () => {
      if (!namespace || !name) {
        setError("Invalid placement reference");
        setLoading(false);
        return;
      }

      console.log(`Loading placement data for ${namespace}/${name}`);

      try {
        setLoading(true);

        // Handle the case where URL parameters might include namespace
        let actualNamespace = namespace;
        let actualName = name;

        // Check if name contains a slash, which means it might be in "namespace/name" format
        // But avoid re-parsing if it has already been processed in the component
        if (namespace && namespace.includes('/')) {
          console.log(`Namespace contains slash, parsing: ${namespace}`);
          const parts = namespace.split('/');
          if (parts.length === 2) {
            actualNamespace = parts[0];
            actualName = parts[1];
          }
        }

        // Remove marker
        if (actualNamespace.includes('_PARSED_')) {
          actualNamespace = actualNamespace.replace('_PARSED_', '');
        } else if (actualNamespace !== namespace || actualName !== name) {
          // Add marker to avoid API from re-parsing
          actualNamespace = `${actualNamespace}_PARSED_`;
        }

        console.log(`Using namespace=${actualNamespace}, name=${actualName} for API call`);
        const placementData = await fetchPlacementByName(actualNamespace, actualName);
        console.log("Received placement data:", placementData);

        if (placementData) {
          setPlacement(placementData);

          // Fetch decisions if not included in the placement data
          if (!placementData.decisions) {
            console.log(`Fetching additional decisions for ${actualNamespace}/${actualName}`);
            const decisionsData = await fetchPlacementDecisions(actualNamespace, actualName);
            console.log("Received decisions data:", decisionsData);
            setDecisions(decisionsData);
          } else {
            setDecisions(placementData.decisions || []);
          }
        } else {
          console.error(`Placement ${actualNamespace}/${actualName} not found`);
          setError(`Placement ${actualNamespace}/${actualName} not found`);
        }
        setLoading(false);
      } catch (error) {
        console.error(`Error fetching placement ${namespace}/${name}:`, error);
        setError(`Failed to load placement: ${error instanceof Error ? error.message : String(error)}`);
        setLoading(false);
      }
    };

    loadPlacement();
  }, [namespace, name]);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleRefresh = () => {
    window.location.reload();
  };

  const handleBack = () => {
    navigate('/placements');
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 'calc(100vh - 120px)' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={handleBack}
          sx={{ mb: 2 }}
        >
          Back to Placements
        </Button>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  if (!placement) {
    return (
      <Box sx={{ p: 3 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={handleBack}
          sx={{ mb: 2 }}
        >
          Back to Placements
        </Button>
        <Alert severity="warning">Placement not found</Alert>
      </Box>
    );
  }

  // Get status icon based on satisfied condition
  const getStatusIcon = (satisfied: boolean | undefined) => {
    return satisfied ? (
      <CheckCircleIcon sx={{ color: "success.main" }} />
    ) : (
      <ErrorIcon sx={{ color: "error.main" }} />
    );
  };

  // Determine if placement is satisfied based on conditions
  const isPlacementSatisfied = () => {
    if (placement.satisfied !== undefined) {
      return placement.satisfied;
    }

    // Check if PlacementSatisfied condition is True
    return placement.conditions?.some(
      condition => condition.type === 'PlacementSatisfied' && condition.status === 'True'
    ) || false;
  };

  const placementStatusText = () => {
    const satisfied = isPlacementSatisfied();

    if (satisfied) {
      return "Satisfied";
    } else {
      // Look for message in conditions
      const message = placement.conditions?.find(
        condition => condition.type === 'PlacementSatisfied' && condition.status === 'False'
      )?.message;

      return message || placement.reasonMessage || "Unsatisfied";
    }
  };

  // Check if the placement is satisfied
  const satisfied = isPlacementSatisfied();

  return (
    <Box sx={{ p: 3 }}>
      {/* Header with back button and title */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <IconButton onClick={handleBack} sx={{ mr: 2 }}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h5" sx={{ fontWeight: "bold", flex: 1 }}>
          Placement: {namespace}/{name}
        </Typography>
        <Tooltip title="Refresh">
          <IconButton onClick={handleRefresh}>
            <RefreshIcon />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Status card */}
      <Paper sx={{ p: 3, mb: 3, borderRadius: 2 }}>
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 4 }}>
            <Typography variant="subtitle2" color="text.secondary">Status</Typography>
            <Box sx={{ display: "flex", alignItems: "center", mt: 1 }}>
              {getStatusIcon(satisfied)}
              <Typography variant="body1" sx={{ ml: 1, fontWeight: 'medium' }}>
                {placementStatusText()}
              </Typography>
            </Box>
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <Typography variant="subtitle2" color="text.secondary">Clusters</Typography>
            <Box sx={{ display: "flex", alignItems: "center", mt: 1 }}>
              <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                {placement.numberOfSelectedClusters || 0} / {placement.numberOfClusters ?? "∞"}
              </Typography>
            </Box>
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <Typography variant="subtitle2" color="text.secondary">Created</Typography>
            <Typography variant="body1" sx={{ mt: 1, fontWeight: 'medium' }}>
              {placement.creationTimestamp
                ? new Date(placement.creationTimestamp).toLocaleString()
                : "-"}
            </Typography>
          </Grid>
        </Grid>
      </Paper>

      {/* Tabs for different sections */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="placement tabs">
          <Tab label="Overview" id="tab-0" aria-controls="tabpanel-0" />
          <Tab label="Decisions" id="tab-1" aria-controls="tabpanel-1" />
          <Tab label="YAML" id="tab-2" aria-controls="tabpanel-2" />
        </Tabs>
      </Box>

      {/* Overview Tab */}
      <TabPanel value={tabValue} index={0}>
        <Grid container spacing={3}>
          {/* ClusterSets */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Paper sx={{ p: 3, borderRadius: 2, height: '100%' }}>
              <Typography variant="h6" sx={{ mb: 2 }}>ClusterSets</Typography>
              {!placement.clusterSets || placement.clusterSets.length === 0 ? (
                <Typography color="text.secondary">No cluster sets specified</Typography>
              ) : (
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                  {placement.clusterSets.map((set) => (
                    <Chip
                      key={set}
                      label={set}
                      size="small"
                      onClick={() => navigate(`/clustersets/${set}`)}
                      sx={{ cursor: 'pointer' }}
                    />
                  ))}
                </Box>
              )}
            </Paper>
          </Grid>

          {/* Conditions */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Paper sx={{ p: 3, borderRadius: 2, height: '100%' }}>
              <Typography variant="h6" sx={{ mb: 2 }}>Conditions</Typography>
              {!placement.conditions || placement.conditions.length === 0 ? (
                <Typography color="text.secondary">No conditions</Typography>
              ) : (
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Type</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Reason</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {placement.conditions.map((condition, index) => (
                        <TableRow key={`${condition.type}-${index}`}>
                          <TableCell>{condition.type}</TableCell>
                          <TableCell>
                            <Box sx={{ display: "flex", alignItems: "center" }}>
                              {condition.status === "True" ? (
                                <CheckCircleIcon sx={{ color: "success.main", fontSize: 16, mr: 1 }} />
                              ) : (
                                <ErrorIcon sx={{ color: "error.main", fontSize: 16, mr: 1 }} />
                              )}
                              {condition.status}
                            </Box>
                          </TableCell>
                          <TableCell>{condition.reason || "-"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Paper>
          </Grid>

          {/* Predicates */}
          <Grid size={{ xs: 12 }}>
            <Paper sx={{ p: 3, borderRadius: 2 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>Predicates</Typography>
              {!placement.predicates || placement.predicates.length === 0 ? (
                <Typography color="text.secondary">No predicates defined (all clusters are eligible)</Typography>
              ) : (
                placement.predicates.map((predicate, index) => (
                  <Box key={index} sx={{ mb: index < placement.predicates!.length - 1 ? 2 : 0 }}>
                    {index > 0 && <Divider sx={{ my: 2 }} />}
                    <Typography variant="subtitle1" sx={{ mb: 1 }}>Predicate {index + 1}</Typography>

                    {/* Label Selector */}
                    {predicate.requiredClusterSelector?.labelSelector && (
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="subtitle2">Label Selector</Typography>
                        {predicate.requiredClusterSelector.labelSelector.matchLabels && (
                          <Box sx={{ mt: 1 }}>
                            <Typography variant="body2" color="text.secondary">Match Labels:</Typography>
                            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, mt: 0.5 }}>
                              {Object.entries(predicate.requiredClusterSelector.labelSelector.matchLabels).map(([key, value]) => (
                                <Chip
                                  key={key}
                                  label={`${key}: ${value}`}
                                  size="small"
                                  variant="outlined"
                                />
                              ))}
                            </Box>
                          </Box>
                        )}

                        {predicate.requiredClusterSelector.labelSelector.matchExpressions && (
                          <Box sx={{ mt: 1 }}>
                            <Typography variant="body2" color="text.secondary">Match Expressions:</Typography>
                            <TableContainer sx={{ mt: 0.5 }}>
                              <Table size="small">
                                <TableHead>
                                  <TableRow>
                                    <TableCell>Key</TableCell>
                                    <TableCell>Operator</TableCell>
                                    <TableCell>Values</TableCell>
                                  </TableRow>
                                </TableHead>
                                <TableBody>
                                  {predicate.requiredClusterSelector.labelSelector.matchExpressions.map((expr, i) => (
                                    <TableRow key={i}>
                                      <TableCell>{expr.key}</TableCell>
                                      <TableCell>{expr.operator}</TableCell>
                                      <TableCell>{expr.values ? expr.values.join(', ') : ''}</TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </TableContainer>
                          </Box>
                        )}
                      </Box>
                    )}

                    {/* Claim Selector */}
                    {predicate.requiredClusterSelector?.claimSelector?.matchExpressions && (
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="subtitle2">Claim Selector</Typography>
                        <TableContainer sx={{ mt: 0.5 }}>
                          <Table size="small">
                            <TableHead>
                              <TableRow>
                                <TableCell>Key</TableCell>
                                <TableCell>Operator</TableCell>
                                <TableCell>Values</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {predicate.requiredClusterSelector.claimSelector.matchExpressions.map((expr, i) => (
                                <TableRow key={i}>
                                  <TableCell>{expr.key}</TableCell>
                                  <TableCell>{expr.operator}</TableCell>
                                  <TableCell>{expr.values ? expr.values.join(', ') : ''}</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </TableContainer>
                      </Box>
                    )}

                    {/* CEL Selector */}
                    {predicate.requiredClusterSelector?.celSelector?.celExpressions && (
                      <Box>
                        <Typography variant="subtitle2">CEL Expressions</Typography>
                        <Paper variant="outlined" sx={{ mt: 0.5, p: 1.5, bgcolor: theme.palette.mode === 'dark' ? 'grey.800' : 'grey.50' }}>
                          {predicate.requiredClusterSelector.celSelector.celExpressions.map((expr, i) => (
                            <Typography key={i} variant="body2" fontFamily="monospace" sx={{ mb: i < predicate.requiredClusterSelector!.celSelector!.celExpressions!.length - 1 ? 1 : 0 }}>
                              {expr}
                            </Typography>
                          ))}
                        </Paper>
                      </Box>
                    )}
                  </Box>
                ))
              )}
            </Paper>
          </Grid>

          {/* Prioritizers */}
          {placement.prioritizerPolicy && (
            <Grid size={{ xs: 12 }}>
              <Paper sx={{ p: 3, borderRadius: 2 }}>
                <Typography variant="h6" sx={{ mb: 2 }}>Prioritizers</Typography>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2">Mode: {placement.prioritizerPolicy.mode || "Additive"}</Typography>
                </Box>

                {placement.prioritizerPolicy.configurations && placement.prioritizerPolicy.configurations.length > 0 ? (
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Type</TableCell>
                          <TableCell>Name</TableCell>
                          <TableCell align="right">Weight</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {placement.prioritizerPolicy.configurations.map((config, index) => (
                          <TableRow key={index}>
                            <TableCell>{config.scoreCoordinate.type || "BuiltIn"}</TableCell>
                            <TableCell>
                              {config.scoreCoordinate.type === "BuiltIn" || !config.scoreCoordinate.type
                                ? config.scoreCoordinate.builtIn
                                : config.scoreCoordinate.addOn
                                  ? `${config.scoreCoordinate.addOn.resourceName}/${config.scoreCoordinate.addOn.scoreName}`
                                  : "-"
                              }
                            </TableCell>
                            <TableCell align="right">{config.weight || 1}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                ) : (
                  <Typography color="text.secondary">No prioritizer configurations</Typography>
                )}
              </Paper>
            </Grid>
          )}

          {/* Tolerations */}
          {placement.tolerations && placement.tolerations.length > 0 && (
            <Grid size={{ xs: 12 }}>
              <Paper sx={{ p: 3, borderRadius: 2 }}>
                <Typography variant="h6" sx={{ mb: 2 }}>Tolerations</Typography>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Key</TableCell>
                        <TableCell>Value</TableCell>
                        <TableCell>Operator</TableCell>
                        <TableCell>Effect</TableCell>
                        <TableCell>Toleration Seconds</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {placement.tolerations.map((toleration, index) => (
                        <TableRow key={index}>
                          <TableCell>{toleration.key || "-"}</TableCell>
                          <TableCell>{toleration.value || "-"}</TableCell>
                          <TableCell>{toleration.operator || "Equal"}</TableCell>
                          <TableCell>{toleration.effect || "-"}</TableCell>
                          <TableCell>{toleration.tolerationSeconds !== undefined ? toleration.tolerationSeconds : "∞"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>
            </Grid>
          )}

          {/* Decision Strategy */}
          {placement.decisionStrategy?.groupStrategy && (
            <Grid size={{ xs: 12 }}>
              <Paper sx={{ p: 3, borderRadius: 2 }}>
                <Typography variant="h6" sx={{ mb: 2 }}>Decision Strategy</Typography>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2">
                    Clusters Per Decision Group: {placement.decisionStrategy.groupStrategy.clustersPerDecisionGroup || "100%"}
                  </Typography>
                </Box>

                {placement.decisionStrategy.groupStrategy.decisionGroups && placement.decisionStrategy.groupStrategy.decisionGroups.length > 0 ? (
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Group Name</TableCell>
                          <TableCell>Label Selectors</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {placement.decisionStrategy.groupStrategy.decisionGroups.map((group, index) => (
                          <TableRow key={index}>
                            <TableCell>{group.groupName}</TableCell>
                            <TableCell>
                              {group.groupClusterSelector.labelSelector ? (
                                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                                  {group.groupClusterSelector.labelSelector.matchLabels &&
                                    Object.entries(group.groupClusterSelector.labelSelector.matchLabels).map(([key, value]) => (
                                      <Chip
                                        key={key}
                                        label={`${key}: ${value}`}
                                        size="small"
                                        variant="outlined"
                                      />
                                    ))
                                  }
                                </Box>
                              ) : "-"}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                ) : (
                  <Typography color="text.secondary">No decision groups defined</Typography>
                )}
              </Paper>
            </Grid>
          )}

          {/* Decision Groups */}
          {placement.decisionGroups && placement.decisionGroups.length > 0 && (
            <Grid size={{ xs: 12 }}>
              <Paper sx={{ p: 3, borderRadius: 2 }}>
                <Typography variant="h6" sx={{ mb: 2 }}>Decision Group Results</Typography>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Group Index</TableCell>
                        <TableCell>Group Name</TableCell>
                        <TableCell align="center">Cluster Count</TableCell>
                        <TableCell>Decisions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {placement.decisionGroups.map((group) => (
                        <TableRow key={`${group.decisionGroupIndex}-${group.decisionGroupName}`}>
                          <TableCell>{group.decisionGroupIndex}</TableCell>
                          <TableCell>{group.decisionGroupName || "(default)"}</TableCell>
                          <TableCell align="center">{group.clusterCount}</TableCell>
                          <TableCell>{group.decisions ? group.decisions.join(", ") : "-"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>
            </Grid>
          )}
        </Grid>
      </TabPanel>

      {/* Decisions Tab */}
      <TabPanel value={tabValue} index={1}>
        <Paper sx={{ p: 3, borderRadius: 2 }}>
          <Typography variant="h6" sx={{ mb: 3 }}>Selected Clusters</Typography>

          {(!decisions || decisions.length === 0) ? (
            <Typography color="text.secondary">No placement decisions found</Typography>
          ) : (
            decisions.map((decision, index) => (
              <Box key={decision.name} sx={{ mb: index < decisions.length - 1 ? 4 : 0 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 'medium' }}>
                    {decision.name}
                  </Typography>
                  {placement.decisionGroups && placement.decisionGroups.some(g => g.decisions && g.decisions.includes(decision.name) && g.decisionGroupName) && (
                    <Chip
                      label={placement.decisionGroups.find(g => g.decisions && g.decisions.includes(decision.name))?.decisionGroupName}
                      size="small"
                      sx={{ ml: 2 }}
                    />
                  )}
                </Box>

                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Cluster Name</TableCell>
                        <TableCell>Reason</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {decision.decisions && decision.decisions.map((clusterDecision, i) => (
                        <TableRow
                          key={`${clusterDecision.clusterName}-${i}`}
                          hover
                          sx={{ cursor: "pointer" }}
                          onClick={() => navigate(`/clusters/${clusterDecision.clusterName}`)}
                        >
                          <TableCell>{clusterDecision.clusterName}</TableCell>
                          <TableCell>{clusterDecision.reason || "Selected by placement"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            ))
          )}
        </Paper>

        {placement.selectedClusters && placement.selectedClusters.length > 0 && (
          <Paper sx={{ p: 3, borderRadius: 2, mt: 3 }}>
            <Typography variant="h6" sx={{ mb: 3 }}>Cluster Status</Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Cluster Name</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {placement.selectedClusters.map((cluster) => (
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
      </TabPanel>

      {/* YAML Tab */}
      <TabPanel value={tabValue} index={2}>
        <Paper sx={{ p: 3, borderRadius: 2 }}>
          <Box sx={{ bgcolor: theme.palette.mode === 'dark' ? 'grey.800' : 'grey.50', p: 2, borderRadius: 1, fontFamily: 'monospace', overflow: 'auto' }}>
            <pre style={{ margin: 0 }}>
              {`apiVersion: cluster.open-cluster-management.io/v1beta1
kind: Placement
metadata:
  name: ${placement.name}
  namespace: ${placement.namespace}${placement.creationTimestamp ? `
  creationTimestamp: ${placement.creationTimestamp}` : ''}
spec:
  clusterSets: ${placement.clusterSets ? JSON.stringify(placement.clusterSets, null, 2).replace(/\n/g, '\n  ') : '[]'}${placement.numberOfClusters ? `
  numberOfClusters: ${placement.numberOfClusters}` : ''}${placement.predicates && placement.predicates.length > 0 ? `
  predicates: ${JSON.stringify(placement.predicates, null, 2).replace(/\n/g, '\n  ')}` : ''}${placement.prioritizerPolicy ? `
  prioritizerPolicy: ${JSON.stringify(placement.prioritizerPolicy, null, 2).replace(/\n/g, '\n  ')}` : ''}${placement.tolerations && placement.tolerations.length > 0 ? `
  tolerations: ${JSON.stringify(placement.tolerations, null, 2).replace(/\n/g, '\n  ')}` : ''}${placement.decisionStrategy ? `
  decisionStrategy: ${JSON.stringify(placement.decisionStrategy, null, 2).replace(/\n/g, '\n  ')}` : ''}
status:
  numberOfSelectedClusters: ${placement.numberOfSelectedClusters || 0}${placement.decisionGroups ? `
  decisionGroups: ${JSON.stringify(placement.decisionGroups, null, 2).replace(/\n/g, '\n  ')}` : ''}${placement.conditions ? `
  conditions: ${JSON.stringify(placement.conditions, null, 2).replace(/\n/g, '\n  ')}` : ''}
`}
            </pre>
          </Box>
        </Paper>
      </TabPanel>
    </Box>
  );
}