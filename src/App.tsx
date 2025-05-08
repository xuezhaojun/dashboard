import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './auth/AuthContext';
import ClusterList from './components/ClusterList';
import ClusterDetail from './components/ClusterDetail';
import Login from './components/Login';

// Protected route component that redirects to login if not authenticated
const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  return children;
};

// Layout component with header for authenticated pages
const AuthenticatedLayout = ({ children }: { children: JSX.Element }) => {
  const { logout } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-xl font-bold text-gray-900">OCM Dashboard</h1>
          <button
            onClick={logout}
            className="text-sm text-gray-600 hover:text-gray-900 focus:outline-none"
          >
            Logout
          </button>
        </div>
      </header>
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
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
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
