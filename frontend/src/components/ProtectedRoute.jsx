import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

function ProtectedRoute({ children, requireAdmin }) {
  const { isAuthenticated, user } = useAuth();
  const isAdmin = user?.isAdmin;

  if (!isAuthenticated) {
    return <Navigate to={requireAdmin ? "/admin/login" : "/login"} replace />;
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