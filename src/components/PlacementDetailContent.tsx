import {
  Box,
  Typography,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Tabs,
  Tab,
  Paper,
  Alert,
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
} from '@mui/icons-material';
import type { Placement } from '../api/placementService';
import { useState } from 'react';

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
      style={{ flexGrow: 1, overflow: 'auto' }}
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

function a11yProps(index: number) {
  return {
    id: `tab-${index}`,
    'aria-controls': `tabpanel-${index}`,
  };
}

interface PlacementDetailContentProps {
  placement: Placement;
  compact?: boolean;
}

export default function PlacementDetailContent({ placement, compact = false }: PlacementDetailContentProps) {
  const [tabValue, setTabValue] = useState(0);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // Format date
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Unknown';
    return new Date(dateString).toLocaleString('en-US');
  };

  // Get status text and icon
  const getStatusIcon = (succeeded: boolean) => {
    return succeeded ? (
      <CheckCircleIcon sx={{ color: "success.main" }} />
    ) : (
      <ErrorIcon sx={{ color: "error.main" }} />
    );
  };

  const placementStatusText = (placement: Placement) => {
    if (placement.succeeded) {
      return "Succeeded";
    } else {
      return placement.reasonMessage || "Not Succeeded";
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {!compact && (
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            aria-label="placement detail tabs"
            variant="scrollable"
            scrollButtons="auto"
          >
            <Tab
              label={
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <span>Overview</span>
                </Box>
              }
              {...a11yProps(0)}
            />
            <Tab
              label={
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <span>Selected Clusters</span>
                </Box>
              }
              {...a11yProps(1)}
            />
            <Tab
              label={
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <span>Configuration</span>
                </Box>
              }
              {...a11yProps(2)}
            />
          </Tabs>
        </Box>
      )}

      <TabPanel value={tabValue} index={0}>
        {/* Basic information */}
        <Box sx={{ mb: 3 }}>
          <Grid container spacing={2} sx={{ width: '100%' }}>
            <Grid size={{ xs: 6, sm: 6 }}>
              <Typography variant="body2" color="text.secondary">
                Placement ID
              </Typography>
              <Typography variant="body1">{placement.id}</Typography>
            </Grid>
            <Grid size={{ xs: 6, sm: 6 }}>
              <Typography variant="body2" color="text.secondary">
                Status
              </Typography>
              <Box sx={{ display: "flex", alignItems: "center" }}>
                {getStatusIcon(!!placement.succeeded)}
                <Typography variant="body1" sx={{ ml: 1 }}>
                  {placementStatusText(placement)}
                </Typography>
              </Box>
            </Grid>
            <Grid size={{ xs: 6, sm: 6 }}>
              <Typography variant="body2" color="text.secondary">
                Created
              </Typography>
              <Typography variant="body1">
                {placement.creationTimestamp
                  ? formatDate(placement.creationTimestamp)
                  : 'Unknown'}
              </Typography>
            </Grid>
            <Grid size={{ xs: 6, sm: 6 }}>
              <Typography variant="body2" color="text.secondary">
                Namespace
              </Typography>
              <Typography variant="body1">{placement.namespace}</Typography>
            </Grid>
            <Grid size={{ xs: 6, sm: 6 }}>
              <Typography variant="body2" color="text.secondary">
                Requested Clusters
              </Typography>
              <Typography variant="body1">{placement.numberOfClusters ?? "All matching"}</Typography>
            </Grid>
            <Grid size={{ xs: 6, sm: 6 }}>
              <Typography variant="body2" color="text.secondary">
                Selected Clusters
              </Typography>
              <Typography variant="body1">{placement.numberOfSelectedClusters}</Typography>
            </Grid>
            <Grid size={{ xs: 12 }}>
              <Typography variant="body2" color="text.secondary">
                Last Updated
              </Typography>
              <Typography variant="body1">
                {formatDate(placement.conditions?.[0]?.lastTransitionTime)}
              </Typography>
            </Grid>
          </Grid>
        </Box>

        {/* Cluster Sets */}
        {placement.clusterSets && placement.clusterSets.length > 0 && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 'medium' }}>
              Cluster Sets
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {placement.clusterSets.map((clusterSet, index) => (
                <Chip key={index} label={clusterSet} color="primary" variant="outlined" />
              ))}
            </Box>
          </Box>
        )}

        {/* Conditions */}
        {placement.conditions && placement.conditions.length > 0 && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 'medium' }}>
              Conditions
            </Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Type</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Reason</TableCell>
                    <TableCell>Message</TableCell>
                    <TableCell>Last Transition</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {placement.conditions.map((condition, index) => (
                    <TableRow key={index}>
                      <TableCell>{condition.type}</TableCell>
                      <TableCell>
                        <Chip
                          label={condition.status}
                          color={condition.status === 'True' ? 'success' : 'error'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{condition.reason || '-'}</TableCell>
                      <TableCell>{condition.message || '-'}</TableCell>
                      <TableCell>{formatDate(condition.lastTransitionTime)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        {/* Selected Clusters */}
        {placement.selectedClusters && placement.selectedClusters.length > 0 ? (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Cluster Name</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Kubernetes Version</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {placement.selectedClusters.map((cluster, index) => (
                  <TableRow key={index}>
                    <TableCell>{cluster.name}</TableCell>
                    <TableCell>{cluster.status}</TableCell>
                    <TableCell>{cluster.version || 'Unknown'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          <Alert severity="info">No clusters are currently selected by this placement.</Alert>
        )}

        {/* Placement Decisions */}
        {placement.decisions && placement.decisions.length > 0 && (
          <Box sx={{ mt: 3 }}>
            <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 'medium' }}>
              Placement Decisions
            </Typography>
            {placement.decisions.map((decision, decisionIndex) => (
              <Paper key={decisionIndex} sx={{ p: 2, mb: 2 }}>
                <Typography variant="subtitle2">
                  Decision: {decision.name}
                </Typography>
                <TableContainer sx={{ mt: 1 }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Cluster</TableCell>
                        <TableCell>Reason</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {decision.decisions.map((d, idx) => (
                        <TableRow key={idx}>
                          <TableCell>{d.clusterName}</TableCell>
                          <TableCell>{d.reason}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>
            ))}
          </Box>
        )}
      </TabPanel>

      <TabPanel value={tabValue} index={2}>
        {/* Placement Predicates */}
        {placement.predicates && placement.predicates.length > 0 ? (
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 'medium' }}>
              Predicates
            </Typography>
            {placement.predicates.map((predicate, predicateIndex) => (
              <Paper key={predicateIndex} sx={{ p: 2, mb: 2 }}>
                {predicate.requiredClusterSelector && (
                  <Box>
                    <Typography variant="subtitle2">Required Cluster Selector</Typography>

                    {/* Label Selector */}
                    {predicate.requiredClusterSelector.labelSelector && (
                      <Box sx={{ mt: 1, mb: 2 }}>
                        <Typography variant="body2" color="text.secondary">
                          Label Selector
                        </Typography>

                        {/* Match Labels */}
                        {predicate.requiredClusterSelector.labelSelector.matchLabels &&
                         Object.keys(predicate.requiredClusterSelector.labelSelector.matchLabels).length > 0 && (
                          <Box sx={{ mt: 1 }}>
                            <Typography variant="body2">Match Labels:</Typography>
                            <TableContainer>
                              <Table size="small">
                                <TableHead>
                                  <TableRow>
                                    <TableCell>Key</TableCell>
                                    <TableCell>Value</TableCell>
                                  </TableRow>
                                </TableHead>
                                <TableBody>
                                  {Object.entries(predicate.requiredClusterSelector.labelSelector.matchLabels).map(([key, value], idx) => (
                                    <TableRow key={idx}>
                                      <TableCell>{key}</TableCell>
                                      <TableCell>{value}</TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </TableContainer>
                          </Box>
                        )}

                        {/* Match Expressions */}
                        {predicate.requiredClusterSelector.labelSelector.matchExpressions &&
                         predicate.requiredClusterSelector.labelSelector.matchExpressions.length > 0 && (
                          <Box sx={{ mt: 1 }}>
                            <Typography variant="body2">Match Expressions:</Typography>
                            <TableContainer>
                              <Table size="small">
                                <TableHead>
                                  <TableRow>
                                    <TableCell>Key</TableCell>
                                    <TableCell>Operator</TableCell>
                                    <TableCell>Values</TableCell>
                                  </TableRow>
                                </TableHead>
                                <TableBody>
                                  {predicate.requiredClusterSelector.labelSelector.matchExpressions.map((expr, idx) => (
                                    <TableRow key={idx}>
                                      <TableCell>{expr.key}</TableCell>
                                      <TableCell>{expr.operator}</TableCell>
                                      <TableCell>{expr.values.join(', ')}</TableCell>
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
                    {predicate.requiredClusterSelector.claimSelector &&
                     predicate.requiredClusterSelector.claimSelector.matchExpressions &&
                     predicate.requiredClusterSelector.claimSelector.matchExpressions.length > 0 && (
                      <Box sx={{ mt: 1, mb: 2 }}>
                        <Typography variant="body2" color="text.secondary">
                          Claim Selector
                        </Typography>
                        <TableContainer>
                          <Table size="small">
                            <TableHead>
                              <TableRow>
                                <TableCell>Key</TableCell>
                                <TableCell>Operator</TableCell>
                                <TableCell>Values</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {predicate.requiredClusterSelector.claimSelector.matchExpressions.map((expr, idx) => (
                                <TableRow key={idx}>
                                  <TableCell>{expr.key}</TableCell>
                                  <TableCell>{expr.operator}</TableCell>
                                  <TableCell>{expr.values.join(', ')}</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </TableContainer>
                      </Box>
                    )}

                    {/* CEL Selector */}
                    {predicate.requiredClusterSelector.celSelector &&
                     predicate.requiredClusterSelector.celSelector.celExpressions &&
                     predicate.requiredClusterSelector.celSelector.celExpressions.length > 0 && (
                      <Box sx={{ mt: 1 }}>
                        <Typography variant="body2" color="text.secondary">
                          CEL Expressions
                        </Typography>
                        <Box sx={{ mt: 1 }}>
                          {predicate.requiredClusterSelector.celSelector.celExpressions.map((expr, idx) => (
                            <Chip key={idx} label={expr} sx={{ m: 0.5 }} />
                          ))}
                        </Box>
                      </Box>
                    )}
                  </Box>
                )}
              </Paper>
            ))}
          </Box>
        ) : (
          <Alert severity="info">No predicates defined for this placement.</Alert>
        )}

        {/* Tolerations */}
        {placement.tolerations && placement.tolerations.length > 0 && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 'medium' }}>
              Tolerations
            </Typography>
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
                      <TableCell>{toleration.key || '-'}</TableCell>
                      <TableCell>{toleration.value || '-'}</TableCell>
                      <TableCell>{toleration.operator || '-'}</TableCell>
                      <TableCell>{toleration.effect || '-'}</TableCell>
                      <TableCell>{toleration.tolerationSeconds || '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}

        {/* Priority Policy */}
        {placement.prioritizerPolicy && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 'medium' }}>
              Prioritizer Policy
            </Typography>
            <Box sx={{ display: 'flex', mb: 1 }}>
              <Typography variant="body2" color="text.secondary" sx={{ width: 160 }}>
                Mode:
              </Typography>
              <Typography variant="body1">{placement.prioritizerPolicy.mode}</Typography>
            </Box>

            {placement.prioritizerPolicy.configurations &&
             placement.prioritizerPolicy.configurations.length > 0 && (
              <Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  Configurations:
                </Typography>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Type</TableCell>
                        <TableCell>Built-In</TableCell>
                        <TableCell>Add-On Resource</TableCell>
                        <TableCell>Add-On Score</TableCell>
                        <TableCell>Weight</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {placement.prioritizerPolicy.configurations.map((config, index) => (
                        <TableRow key={index}>
                          <TableCell>{config.scoreCoordinate.type}</TableCell>
                          <TableCell>{config.scoreCoordinate.builtIn || '-'}</TableCell>
                          <TableCell>{config.scoreCoordinate.addOn?.resourceName || '-'}</TableCell>
                          <TableCell>{config.scoreCoordinate.addOn?.scoreName || '-'}</TableCell>
                          <TableCell>{config.weight}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            )}
          </Box>
        )}

        {/* Decision Strategy */}
        {placement.decisionStrategy && placement.decisionStrategy.groupStrategy && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 'medium' }}>
              Decision Group Strategy
            </Typography>

            <Box sx={{ display: 'flex', mb: 1 }}>
              <Typography variant="body2" color="text.secondary" sx={{ width: 200 }}>
                Clusters Per Decision Group:
              </Typography>
              <Typography variant="body1">
                {placement.decisionStrategy.groupStrategy.clustersPerDecisionGroup || 'All'}
              </Typography>
            </Box>

            {placement.decisionStrategy.groupStrategy.decisionGroups &&
             placement.decisionStrategy.groupStrategy.decisionGroups.length > 0 && (
              <Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  Decision Groups:
                </Typography>
                {placement.decisionStrategy.groupStrategy.decisionGroups.map((group, groupIndex) => (
                  <Paper key={groupIndex} sx={{ p: 2, mb: 2 }}>
                    <Typography variant="subtitle2">
                      Group: {group.groupName}
                    </Typography>

                    {group.groupClusterSelector.labelSelector && (
                      <Box sx={{ mt: 1 }}>
                        <Typography variant="body2" color="text.secondary">
                          Label Selector:
                        </Typography>

                        {/* Match Labels */}
                        {group.groupClusterSelector.labelSelector.matchLabels &&
                         Object.keys(group.groupClusterSelector.labelSelector.matchLabels).length > 0 && (
                          <TableContainer sx={{ mt: 1 }}>
                            <Table size="small">
                              <TableHead>
                                <TableRow>
                                  <TableCell>Key</TableCell>
                                  <TableCell>Value</TableCell>
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {Object.entries(group.groupClusterSelector.labelSelector.matchLabels).map(([key, value], idx) => (
                                  <TableRow key={idx}>
                                    <TableCell>{key}</TableCell>
                                    <TableCell>{value}</TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </TableContainer>
                        )}

                        {/* Match Expressions */}
                        {group.groupClusterSelector.labelSelector.matchExpressions &&
                         group.groupClusterSelector.labelSelector.matchExpressions.length > 0 && (
                          <TableContainer sx={{ mt: 1 }}>
                            <Table size="small">
                              <TableHead>
                                <TableRow>
                                  <TableCell>Key</TableCell>
                                  <TableCell>Operator</TableCell>
                                  <TableCell>Values</TableCell>
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {group.groupClusterSelector.labelSelector.matchExpressions.map((expr, idx) => (
                                  <TableRow key={idx}>
                                    <TableCell>{expr.key}</TableCell>
                                    <TableCell>{expr.operator}</TableCell>
                                    <TableCell>{expr.values.join(', ')}</TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </TableContainer>
                        )}
                      </Box>
                    )}
                  </Paper>
                ))}
              </Box>
            )}
          </Box>
        )}
      </TabPanel>
    </Box>
  );
}