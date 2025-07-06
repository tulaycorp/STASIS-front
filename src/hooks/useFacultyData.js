import { useState, useEffect } from 'react';

export const useFacultyData = () => {
  const [facultyData, setFacultyData] = useState(() => {
    const savedData = localStorage.getItem('facultyData');
    return savedData ? JSON.parse(savedData) : null;
  });

  useEffect(() => {
    if (facultyData) {
      localStorage.setItem('facultyData', JSON.stringify(facultyData));
    }
  }, [facultyData]);

  const setFacultyInfo = (data) => {
    setFacultyData(data);
    localStorage.setItem('facultyData', JSON.stringify(data));
  };

  const getFacultyName = () => {
    if (!facultyData) return '';
    return `${facultyData.firstName} ${facultyData.lastName}`;
  };

  const getUserInfo = () => {
    if (!facultyData) return { name: '', role: 'Faculty' };
    return {
      name: `${facultyData.firstName} ${facultyData.lastName}`,
      role: 'Faculty'
    };
  };

  const clearFacultyData = () => {
    setFacultyData(null);
    localStorage.removeItem('facultyData');
  };

  return {
    facultyData,
    setFacultyInfo,
    getFacultyName,
    getUserInfo,
    clearFacultyData
  };
};
