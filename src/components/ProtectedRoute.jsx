import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/contexts/ProfileContext';

const ProtectedRoute = ({ children, requiredRole }) => {
  const { user, loading: authLoading } = useAuth();
  const { profile, loading: profileLoading } = useProfile();

  console.log('ProtectedRoute - Auth loading:', authLoading);
  console.log('ProtectedRoute - Profile loading:', profileLoading);
  console.log('ProtectedRoute - User:', user);
  console.log('ProtectedRoute - Profile:', profile);
  console.log('ProtectedRoute - Required role:', requiredRole);

  if (authLoading || profileLoading) {
    console.log('ProtectedRoute - Showing loading spinner');
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    console.log('ProtectedRoute - No user, redirecting to login');
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && profile?.role !== requiredRole) {
    console.log('ProtectedRoute - Role mismatch, redirecting to home');
    // If profile is loaded but role doesn't match, redirect.
    // This also handles cases where profile is null after loading.
    return <Navigate to="/" replace />;
  }

  console.log('ProtectedRoute - Rendering children');
  return children;
};

export default ProtectedRoute;