import { useState } from 'react';
import {
  Box,
  Typography,
  Grid,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Button,
  alpha,
  useTheme,
} from '@mui/material';
import {
  Download as DownloadIcon,
} from '@mui/icons-material';
import type { Cluster } from '../api/clusterService';

interface ClusterDetailContentProps {
  cluster: Cluster;
  compact?: boolean;
}

/**
 * Component for displaying cluster details
 * Can be used in both drawer and page layouts
 */
export default function ClusterDetailContent({ cluster, compact = false }: ClusterDetailContentProps) {
  const theme = useTheme();
  // Default to Events tab (index 0 after removing Nodes and Namespaces tabs)
  const [detailTab, setDetailTab] = useState(0);

  const handleDetailTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setDetailTab(newValue);
  };

  // Get status text
  const getStatusText = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'Healthy';
      case 'warning':
        return 'Warning';
      case 'critical':
        return 'Critical';
      default:
        return status;
    }
  };

  // Format date
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Unknown';
    return new Date(dateString).toLocaleString('en-US');
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Basic information */}
      <Box sx={{ mb: 3 }}>
        <Grid container spacing={2} sx={{ width: '100%' }}>
          <Grid size={{ xs: 6, sm: 6 }}>
            <Typography variant="body2" color="text.secondary">
              Cluster ID
            </Typography>
            <Typography variant="body1">{cluster.id}</Typography>
          </Grid>
          <Grid size={{ xs: 6, sm: 6 }}>
            <Typography variant="body2" color="text.secondary">
              Status
            </Typography>
            <Typography variant="body1">{getStatusText(cluster.status)}</Typography>
          </Grid>
          <Grid size={{ xs: 6, sm: 6 }}>
            <Typography variant="body2" color="text.secondary">
              Type
            </Typography>
            <Typography variant="body1" sx={{ textTransform: 'capitalize' }}>
              {cluster.labels?.env || 'Unknown'}
            </Typography>
          </Grid>
          <Grid size={{ xs: 6, sm: 6 }}>
            <Typography variant="body2" color="text.secondary">
              Region
            </Typography>
            <Typography variant="body1">{cluster.labels?.region || 'Unknown'}</Typography>
          </Grid>
          <Grid size={{ xs: 6, sm: 6 }}>
            <Typography variant="body2" color="text.secondary">
              Nodes
            </Typography>
            <Typography variant="body1">{cluster.nodes || 'Unknown'}</Typography>
          </Grid>
          <Grid size={{ xs: 6, sm: 6 }}>
            <Typography variant="body2" color="text.secondary">
              Kubernetes Version
            </Typography>
            <Typography variant="body1">{cluster.version || 'Unknown'}</Typography>
          </Grid>
          <Grid size={{ xs: 12 }}>
            <Typography variant="body2" color="text.secondary">
              Last Updated
            </Typography>
            <Typography variant="body1">
              {formatDate(cluster.conditions?.[0]?.lastTransitionTime)}
            </Typography>
          </Grid>
        </Grid>
      </Box>

      {/* Resource information if available */}
      {(cluster.capacity || cluster.allocatable) && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 'medium' }}>
            Resource Information
          </Typography>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Resource</TableCell>
                  <TableCell>Capacity</TableCell>
                  <TableCell>Allocatable</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow>
                  <TableCell>CPU</TableCell>
                  <TableCell>{cluster.capacity?.cpu || '-'}</TableCell>
                  <TableCell>{cluster.allocatable?.cpu || '-'}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Memory</TableCell>
                  <TableCell>{cluster.capacity?.memory || '-'}</TableCell>
                  <TableCell>{cluster.allocatable?.memory || '-'}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}

      {/* Tabs for additional information */}
      <Box sx={{ width: '100%', flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={detailTab} onChange={handleDetailTabChange} aria-label="cluster detail tabs">
            <Tab label="Events" />
            {!compact && <Tab label="Conditions" />}
          </Tabs>
        </Box>

        {/* Events tab */}
        {detailTab === 0 && (
          <Box sx={{ mt: 2, p: 2, bgcolor: alpha(theme.palette.primary.main, 0.05), borderRadius: 1, flexGrow: 1, overflow: 'auto' }}>
            <Typography variant="body2" sx={{ fontFamily: 'monospace', textAlign: 'center' }}>
              No event data available
            </Typography>
          </Box>
        )}

        {/* Conditions tab - only in full page mode */}
        {!compact && detailTab === 1 && cluster.conditions && cluster.conditions.length > 0 && (
          <Box sx={{ mt: 2, flexGrow: 1, overflow: 'auto' }}>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Type</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Reason</TableCell>
                    <TableCell>Message</TableCell>
                    <TableCell>Last Updated</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {cluster.conditions.map((condition, index) => (
                    <TableRow key={index}>
                      <TableCell>{condition.type}</TableCell>
                      <TableCell>
                        <Chip
                          label={condition.status}
                          size="small"
                          color={condition.status === 'True' ? 'success' : 'default'}
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
      </Box>

      {/* Actions */}
      {!compact && (
        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={() => {
              // In a real app, this would generate a YAML representation of the cluster
              alert('YAML download feature will be implemented in the future');
            }}
          >
            Download YAML
          </Button>
        </Box>
      )}
    </Box>
  );
}
