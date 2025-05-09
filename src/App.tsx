import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './auth/AuthContext';
import ClusterList from './components/ClusterList';
import ClusterDetail from './components/ClusterDetail';
import Login from './components/Login';
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

// Layout component with header for authenticated pages
const AuthenticatedLayout = ({ children }: { children: React.ReactNode }) => {
  const { logout } = useAuth();

  return (
    <div>
      <header>
        <div>
          <h1>OCM Dashboard</h1>
          <button
            onClick={logout}
          >
            Logout
          </button>
        </div>
      </header>
      <main>
        {children}
      </main>
    </div>
  );
};

function AppContent() {
  console.log('AppContent rendering...');

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/clusters"
          element={
            <ProtectedRoute>
              <AuthenticatedLayout>
                <ClusterList />
              </AuthenticatedLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/clusters/:name"
          element={
            <ProtectedRoute>
              <AuthenticatedLayout>
                <ClusterDetail />
              </AuthenticatedLayout>
            </ProtectedRoute>
          }
        />
        <Route path="/" element={<Navigate to="/clusters" />} />
        <Route path="*" element={<Navigate to="/clusters" />} />
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
