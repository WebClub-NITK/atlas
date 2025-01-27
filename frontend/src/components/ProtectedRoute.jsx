import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

function ProtectedRoute({ children, requireAdmin }) {
  const { isAuthenticated, isAdmin } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to={requireAdmin ? "/admin/login" : "/login"} state={{ from: location }} replace />;
  }

  if (requireAdmin && !isAdmin) {
    return <Navigate to="/challenges" replace />;
  }

  if (!requireAdmin && isAdmin) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  return children;
}

export default ProtectedRoute;
