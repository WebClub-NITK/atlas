import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

function PublicRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (isAuthenticated) {
    return <Navigate to="/challenges" replace />;
  }

  return children;
}

export default PublicRoute;
