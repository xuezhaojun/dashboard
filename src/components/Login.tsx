import { useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const [token, setToken] = useState('');
  const [error, setError] = useState<string | null>(null);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!token.trim()) {
      setError('Token is required');
      return;
    }

    // Basic format validation - should be a non-empty string
    // In a real app, we might do more validation or even verify with the API
    if (token.trim().length < 10) {
      setError('Token seems too short');
      return;
    }

    // Clear any previous errors
    setError(null);

    // Store the token
    const formattedToken = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
    login(formattedToken);

    // Redirect to the clusters page
    navigate('/clusters');
  };

  return (
    <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-gray-50">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h1 className="text-center text-3xl font-extrabold text-gray-900">
          OCM Dashboard
        </h1>
        <h2 className="mt-6 text-center text-xl font-medium text-gray-900">
          Sign in with your bearer token
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="token" className="block text-sm font-medium text-gray-700">
                Bearer Token
              </label>
              <div className="mt-1">
                <textarea
                  id="token"
                  name="token"
                  rows={3}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  placeholder="Paste your bearer token here..."
                />
              </div>
              {error && (
                <p className="mt-2 text-sm text-red-600">{error}</p>
              )}
            </div>

            <div className="text-sm">
              <p className="text-gray-500">
                The token will be stored locally in your browser and used to authenticate API requests.
              </p>
            </div>

            <div>
              <button
                type="submit"
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Sign in
              </button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">
                  Development Mode
                </span>
              </div>
            </div>

            {import.meta.env.DEV && (
              <div className="mt-6">
                <button
                  type="button"
                  className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  onClick={() => {
                    login('development-mode-token');
                    navigate('/clusters');
                  }}
                >
                  Continue without token (Dev Mode)
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;