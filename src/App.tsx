import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './auth/AuthContext';
import ClusterDetail from './components/ClusterDetail';
import Login from './components/Login';
import AppShell from './components/layout/AppShell';
import PlaceholderPage from './components/PlaceholderPage';
import OverviewPage from './components/OverviewPage';
import ClusterList from './components/ClusterList';
import { MuiThemeProvider } from './theme/ThemeProvider';

// Protected route component that redirects to login if not authenticated
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuth();

  console.log('ProtectedRoute: isAuthenticated =', isAuthenticated);

  if (!isAuthenticated) {
    console.log('Redirecting to login...');
    return <Navigate to="/login" />;
  }

  return children;
};

function AppContent() {
  console.log('AppContent rendering...');

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />

        {/* Use AppShell as the parent layout for all protected routes */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <AppShell />
            </ProtectedRoute>
          }
        >
          {/* Child routes will be rendered at <Outlet /> in AppShell */}
          <Route path="overview" element={<OverviewPage />} />
          <Route path="clusters" element={<ClusterList />} />
          <Route path="clusters/:name" element={<ClusterDetail />} />
          <Route path="placements" element={<PlaceholderPage title="Placements" />} />
          <Route path="addons" element={<PlaceholderPage title="Add-ons" />} />
          <Route path="settings" element={<PlaceholderPage title="Settings" />} />
          <Route index element={<Navigate to="/overview" />} />
          <Route path="*" element={<Navigate to="/overview" />} />
        </Route>
      </Routes>
    </Router>
  );
}

function App() {
  console.log('App component rendering...');

  useEffect(() => {
    console.log('App mounted, DEV =', import.meta.env.DEV);
    // Force log in for development
    if (import.meta.env.DEV) {
      localStorage.setItem('authToken', 'dev-mock-token');
      console.log('Dev token set in localStorage');
    }
  }, []);

  return (
    <MuiThemeProvider mode="light">
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </MuiThemeProvider>
  );
}

export default App;
