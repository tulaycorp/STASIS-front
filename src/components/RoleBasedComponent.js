import React from 'react';
import { getCurrentUser, hasRole } from '../services/api';

// Component that renders children only if user has the required role(s)
const RoleBasedComponent = ({ allowedRoles, children, fallback = null }) => {
  const currentUser = getCurrentUser();
  
  if (!currentUser.role) {
    return fallback;
  }
  
  // Allow single role or array of roles
  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
  
  if (roles.includes(currentUser.role)) {
    return children;
  }
  
  return fallback;
};

// Higher-order component for role-based access
export const withRoleAccess = (WrappedComponent, allowedRoles) => {
  return function RoleWrappedComponent(props) {
    return (
      <RoleBasedComponent allowedRoles={allowedRoles}>
        <WrappedComponent {...props} />
      </RoleBasedComponent>
    );
  };
};

// Hook for checking roles in functional components
export const useRole = () => {
  const currentUser = getCurrentUser();
  
  return {
    user: currentUser,
    hasRole: (role) => hasRole(role),
    isStudent: () => hasRole('STUDENT'),
    isFaculty: () => hasRole('FACULTY'),
    isAdmin: () => hasRole('ADMIN'),
    isAuthenticated: () => !!currentUser.role
  };
};

export default RoleBasedComponent;
