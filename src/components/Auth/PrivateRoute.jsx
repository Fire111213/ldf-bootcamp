import React from 'react';
import { Navigate } from 'react-router-dom';

const PrivateRoute = ({ children, isAuthenticated, role }) => {
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }
  
  const currentRole = localStorage.getItem('role');
  if (role && currentRole !== role) {
    return <Navigate to="/login" />;
  }
  
  return children;
};

export default PrivateRoute;