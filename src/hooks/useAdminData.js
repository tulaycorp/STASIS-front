import { useState } from 'react';

export const useAdminData = () => {
  const [adminInfo, setAdminInfo] = useState(() => {
    // Initialize from localStorage if available
    const savedData = localStorage.getItem('adminData');
    return savedData ? JSON.parse(savedData) : null;
  });

  // Function to set admin info and save to localStorage
  const updateAdminInfo = (info) => {
    setAdminInfo(info);
    localStorage.setItem('adminData', JSON.stringify(info));
  };

  // Clear admin info from state and localStorage
  const clearAdminInfo = () => {
    setAdminInfo(null);
    localStorage.removeItem('adminData');
  };

  // Get admin name for display
  const getAdminName = () => {
    if (!adminInfo) return "Administrator";
    return `${adminInfo.firstName} ${adminInfo.lastName}`;
  };

  // Get user info object for components
  const getUserInfo = () => ({
    name: getAdminName(),
    role: "Administrator"
  });

  return {
    adminInfo,
    setAdminInfo: updateAdminInfo,
    clearAdminInfo,
    getAdminName,
    getUserInfo
  };
};
