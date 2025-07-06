import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { authAPI, isAuthenticated } from '../services/api';

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const [isChecking, setIsChecking] = useState(true);
  const [isAuth, setIsAuth] = useState(false);
  
  const userRole = localStorage.getItem('userRole');

  useEffect(() => {
    const checkAuthentication = async () => {
      try {
        // First check if we have local data
        if (!isAuthenticated()) {
          setIsAuth(false);
          setIsChecking(false);
          return;
        }

        // Then verify with the server
        const response = await authAPI.checkAuth();
        setIsAuth(response.data.authenticated);
      } catch (error) {
        console.error('Authentication check failed:', error);
        setIsAuth(false);
        // Clear local data if server check fails
        localStorage.removeItem('userRole');
        localStorage.removeItem('userId');
        localStorage.removeItem('username');
      } finally {
        setIsChecking(false);
      }
    };

    checkAuthentication();
  }, []);

  // Show loading while checking authentication
  if (isChecking) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh' 
      }}>
        <div>Checking authentication...</div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuth) {
    return <Navigate to="/login" replace />;
  }

  // Check role-based access
  if (allowedRoles.length > 0 && !allowedRoles.includes(userRole)) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        flexDirection: 'column' 
      }}>
        <h2>Access Denied</h2>
        <p>You don't have permission to access this page.</p>
        <p>Your role: {userRole}</p>
        <p>Required roles: {allowedRoles.join(', ')}</p>
      </div>
    );
  }

  return children;
};

export default ProtectedRoute;
