import { useParams } from 'react-router-dom';
import { Box, CircularProgress, Typography, Button } from '@mui/material';
import { useCluster } from '../hooks/useCluster';
import ClusterDetailContent from './ClusterDetailContent';
import PageLayout from './layout/PageLayout';
import { CheckCircle as CheckCircleIcon, Warning as WarningIcon, Error as ErrorIcon } from '@mui/icons-material';

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
      case 'healthy':
        return <CheckCircleIcon sx={{ color: 'success.main' }} />;
      case 'warning':
        return <WarningIcon sx={{ color: 'warning.main' }} />;
      case 'Offline':
      case 'critical':
        return <ErrorIcon sx={{ color: 'error.main' }} />;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <PageLayout title="加载集群详情...">
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      </PageLayout>
    );
  }

  if (error || !cluster) {
    return (
      <PageLayout title="集群详情">
        <Box sx={{ py: 4, textAlign: 'center' }}>
          <Typography variant="h6" color="error" gutterBottom>
            {error || '找不到集群'}
          </Typography>
          <Button 
            variant="contained" 
            color="primary" 
            sx={{ mt: 2 }}
            onClick={() => window.history.back()}
          >
            返回
          </Button>
        </Box>
      </PageLayout>
    );
  }

  return (
    <PageLayout 
      title={cluster.name}
      backLink="/clusters"
      backLabel="返回集群列表"
    >
      <ClusterDetailContent cluster={cluster} />
    </PageLayout>
  );
}
