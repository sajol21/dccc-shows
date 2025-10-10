
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { UserRole } from '../constants';
import Spinner from './Spinner';

const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { userProfile, loading } = useAuth();

  if (loading) {
    return <div className="h-screen flex items-center justify-center"><Spinner /></div>;
  }

  if (!userProfile || userProfile.role !== UserRole.ADMIN) {
    return <Navigate to="/" />;
  }

  return <>{children}</>;
};

export default AdminRoute;
