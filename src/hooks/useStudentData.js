import { useState, useEffect } from 'react';
import { studentAPI } from '../services/api';

export const useStudentData = () => {
  const [studentData, setStudentData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStudentData = async () => {
      try {
        const userData = JSON.parse(localStorage.getItem('userData'));
        if (!userData || !userData.studentId) {
          throw new Error('No student data found');
        }

        const response = await studentAPI.getStudentById(userData.studentId);
        setStudentData(response.data);
        setLoading(false);
      } catch (err) {
        console.error('Failed to fetch student data:', err);
        setError(err.message);
        setLoading(false);
      }
    };

    fetchStudentData();
  }, []);

  // Get student name for display
  const getStudentName = () => {
    if (loading) return "Loading...";
    if (error) return "Student";
    if (studentData) {
      return `${studentData.firstName} ${studentData.lastName}`;
    }
    // Fallback to localStorage data
    const userData = JSON.parse(localStorage.getItem('userData') || '{}');
    return userData.firstName && userData.lastName 
      ? `${userData.firstName} ${userData.lastName}` 
      : "Student";
  };

  // Get user info object for components
  const getUserInfo = () => ({
    name: getStudentName(),
    role: "Student"
  });

  return {
    studentData,
    loading,
    error,
    getStudentName,
    getUserInfo
  };
};
