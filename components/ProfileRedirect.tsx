import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.js';
import Spinner from './Spinner.js';

const ProfileRedirect: React.FC = () => {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return <div className="h-screen flex items-center justify-center"><Spinner /></div>;
  }

  if (!currentUser) {
    return <Navigate to="/login" />;
  }

  return <Navigate to={`/user/${currentUser.uid}`} replace />;
};

export default ProfileRedirect;