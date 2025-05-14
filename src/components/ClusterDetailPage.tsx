import { useParams } from 'react-router-dom';
import { Box, CircularProgress, Typography, Button } from '@mui/material';
import { useCluster } from '../hooks/useCluster';
import ClusterDetailContent from './ClusterDetailContent';
import PageLayout from './layout/PageLayout';
import { CheckCircle as CheckCircleIcon, Error as ErrorIcon } from '@mui/icons-material';

/**
 * Page component for displaying cluster details
 */
export default function ClusterDetailPage() {
  const { name } = useParams<{ name: string }>();
  const { cluster, loading, error } = useCluster(name || null);

  // Get status icon based on cluster status
  const getStatusIcon = (status?: string) => {
    if (!status) return null;

    switch (status) {
      case 'Online':
        return <CheckCircleIcon sx={{ color: 'success.main' }} />;
      case 'Offline':
        return <ErrorIcon sx={{ color: 'error.main' }} />;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <PageLayout title="Loading Cluster Details...">
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      </PageLayout>
    );
  }

  if (error || !cluster) {
    return (
      <PageLayout title="Cluster Details">
        <Box sx={{ py: 4, textAlign: 'center' }}>
          <Typography variant="h6" color="error" gutterBottom>
            {error || 'Cluster not found'}
          </Typography>
          <Button
            variant="contained"
            color="primary"
            sx={{ mt: 2 }}
            onClick={() => window.history.back()}
          >
            Back
          </Button>
        </Box>
      </PageLayout>
    );
  }

  return (
    <PageLayout
      title={cluster.name}
      backLink="/clusters"
      backLabel="Back to Clusters"
    >
      <ClusterDetailContent cluster={cluster} />
    </PageLayout>
  );
}
