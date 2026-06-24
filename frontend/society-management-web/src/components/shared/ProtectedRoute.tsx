import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { UserRole } from '../../types';

interface ProtectedRouteProps {
  children: React.ReactElement;
  allowedRoles?: UserRole[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary-500 border-t-transparent"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect to dashboard corresponding to their role
    switch (user.role) {
      case 'SuperAdmin':
      case 'SocietyAdmin':
        return <Navigate to="/admin" replace />;
      case 'Resident':
        return <Navigate to="/resident" replace />;
      case 'SecurityGuard':
        return <Navigate to="/security" replace />;
      default:
        return <Navigate to="/login" replace />;
    }
  }

  return children;
};
