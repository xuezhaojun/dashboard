import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './auth/AuthContext';
import ClusterList from './components/ClusterList';
import ClusterDetail from './components/ClusterDetail';
import Login from './components/Login';
import { Button } from '@/components/ui/button';

// Protected route component that redirects to login if not authenticated
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  return children;
};

// Layout component with header for authenticated pages
const AuthenticatedLayout = ({ children }: { children: React.ReactNode }) => {
  const { logout } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 max-w-screen-2xl items-center">
          <div className="mr-4 flex">
            <a className="mr-6 flex items-center space-x-2" href="/">
              <span className="font-bold inline-block">OCM Dashboard</span>
            </a>
          </div>
          <div className="flex flex-1 items-center justify-end space-x-2">
            <Button
              onClick={logout}
              variant="ghost"
              className="text-sm"
            >
              Logout
            </Button>
          </div>
        </div>
      </header>
      <main className="container max-w-screen-2xl py-6">
        {children}
      </main>
    </div>
  );
};

function AppContent() {
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
  useEffect(() => {
    // Force log in for development
    if (import.meta.env.DEV) {
      localStorage.setItem('authToken', 'dev-mock-token');
    }
  }, []);

  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
