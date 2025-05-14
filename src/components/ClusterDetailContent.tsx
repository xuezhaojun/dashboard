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
  Button,
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
// 格式化内存和存储大小为人类可读格式
const formatResourceSize = (value: string | undefined): string => {
  if (!value) return '-';

  // 处理带有单位的字符串，如 "16417196Ki"
  const match = value.match(/^(\d+)(\w+)$/);
  if (!match) return value;

  const [, numStr, unit] = match;
  const num = parseInt(numStr, 10);

  // 根据单位进行转换
  switch (unit) {
    case 'Ki': // Kibibytes
      if (num > 1024 * 1024) {
        return `${(num / (1024 * 1024)).toFixed(2)} GiB`;
      } else if (num > 1024) {
        return `${(num / 1024).toFixed(2)} MiB`;
      }
      return `${num} KiB`;

    case 'Mi': // Mebibytes
      if (num > 1024) {
        return `${(num / 1024).toFixed(2)} GiB`;
      }
      return `${num} MiB`;

    case 'Gi': // Gibibytes
      return `${num} GiB`;

    case 'Ti': // Tebibytes
      return `${num} TiB`;

    default:
      return value;
  }
};

export default function ClusterDetailContent({ cluster, compact = false }: ClusterDetailContentProps) {

  // Get status text
  const getStatusText = (status: string) => {
    // 直接返回状态值，不再进行转换
    return status;
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
              Creation Date
            </Typography>
            <Typography variant="body1">
              {cluster.creationTimestamp
                ? new Date(cluster.creationTimestamp).toLocaleString('en-US')
                : 'Unknown'}
            </Typography>
          </Grid>
          <Grid size={{ xs: 6, sm: 6 }}>
            <Typography variant="body2" color="text.secondary">
              Hub Accepted
            </Typography>
            <Typography variant="body1">{cluster.hubAccepted ? 'Yes' : 'No'}</Typography>
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
          <Grid size={{ xs: 12 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Labels
            </Typography>
            {cluster.labels ? (
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                {Object.entries(cluster.labels).map(([key, value]) => (
                  <Chip
                    key={key}
                    label={`${key}: ${value}`}
                    size="small"
                    variant="outlined"
                  />
                ))}
              </Box>
            ) : (
              <Typography variant="body1">-</Typography>
            )}
          </Grid>
        </Grid>
      </Box>

      {/* Cluster URL information if available */}
      {cluster.managedClusterClientConfigs && cluster.managedClusterClientConfigs.length > 0 && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 'medium' }}>
            Cluster URL Information
          </Typography>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>URL</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {cluster.managedClusterClientConfigs.map((config, index) => (
                  <TableRow key={index}>
                    <TableCell>{config.url}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}

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
                  <TableCell>{formatResourceSize(cluster.capacity?.memory)}</TableCell>
                  <TableCell>{formatResourceSize(cluster.allocatable?.memory)}</TableCell>
                </TableRow>
                {cluster.capacity?.['ephemeral-storage'] && (
                  <TableRow>
                    <TableCell>Storage</TableCell>
                    <TableCell>{formatResourceSize(cluster.capacity?.['ephemeral-storage'])}</TableCell>
                    <TableCell>{formatResourceSize(cluster.allocatable?.['ephemeral-storage'])}</TableCell>
                  </TableRow>
                )}
                {cluster.capacity?.pods && (
                  <TableRow>
                    <TableCell>Pods</TableCell>
                    <TableCell>{cluster.capacity?.pods || '-'}</TableCell>
                    <TableCell>{cluster.allocatable?.pods || '-'}</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}

      {/* Conditions information */}
      <Box sx={{ width: '100%', flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 'medium' }}>
            Conditions
          </Typography>
        </Box>

        {/* Conditions content */}
        {cluster.conditions && cluster.conditions.length > 0 && (
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
