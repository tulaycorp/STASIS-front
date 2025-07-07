// FIXED API CONFIGURATION FOR SPRING SECURITY
import axios from 'axios';

// Configure axios for session-based authentication
const api = axios.create({
  baseURL: 'http://localhost:8080',
  withCredentials: true, // CRITICAL - enables session cookies
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor for debugging
api.interceptors.request.use(
  request => {
    console.log('API Request:', request.method?.toUpperCase(), request.url);
    return request;
  },
  error => {
    console.error('Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor with comprehensive error handling
api.interceptors.response.use(
  response => {
    console.log('API Success:', response.config.method?.toUpperCase(), response.config.url);
    return response;
  },
  error => {
    console.error('API Error:', error.config?.method?.toUpperCase(), error.config?.url, error.response?.status);
    
    if (error.response?.status === 401) {
      // Clear any stored user data
      localStorage.removeItem('userRole');
      localStorage.removeItem('userId');
      localStorage.removeItem('username');
      // Redirect to login
      window.location.href = '/login';
    } else if (error.response?.status === 403) {
      console.error('Access denied - insufficient permissions');
    }
    
    return Promise.reject(error);
  }
);

// Authentication API methods
const authAPI = {
  // Fixed login method for Spring Security
  login: async (credentials) => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username: credentials.username,
          password: credentials.password,
          role: credentials.role // Must include role for Spring Security
        }),
        credentials: 'include' // CRITICAL for session cookies
      });

      if (response.ok) {
        const data = await response.json();
        
        // Store user info in localStorage
        localStorage.setItem('userRole', data.role);
        localStorage.setItem('userId', data.userId);
        localStorage.setItem('username', data.username);
        
        // Store complete user data for compatibility with existing hooks
        const userData = {
          userId: data.userId,
          username: data.username,
          firstName: data.firstName,
          lastName: data.lastName,
          role: data.role,
          status: data.status
        };
        
        // Add role-specific IDs
        if (data.role === 'STUDENT' && data.studentId) {
          userData.studentId = data.studentId;
          userData.yearLevel = data.yearLevel;
          userData.program = data.program;
        } else if (data.role === 'FACULTY' && data.facultyId) {
          userData.facultyId = data.facultyId;
          userData.position = data.position;
          userData.email = data.email;
          userData.program = data.program;
        }
        
        localStorage.setItem('userData', JSON.stringify(userData));
        
        return { success: true, data };
      } else {
        const errorData = await response.json();
        return { success: false, message: errorData.message || 'Login failed' };
      }
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, message: 'Network error - please try again' };
    }
  },

  // Logout method
  logout: async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      });
      
      // Clear stored data
      localStorage.clear();
      
      return { success: true };
    } catch (error) {
      console.error('Logout error:', error);
      // Still clear data even if logout request fails
      localStorage.clear();
      return { success: false, message: 'Logout failed but local data cleared' };
    }
  },

  // Check authentication status
  checkAuth: async () => {
    try {
      const response = await fetch('/api/auth/check', { 
        credentials: 'include' 
      });
      return response.ok;
    } catch (error) {
      console.error('Auth check failed:', error);
      return false;
    }
  }
};

// Schedule API methods (updated for authentication)
const scheduleAPI = {
  createScheduleWithCourse: async (scheduleData, sectionId) => {
    try {
      const response = await api.post(
        `/api/schedules/with-course?courseSectionId=${sectionId}&courseId=${scheduleData.courseId}`,
        scheduleData
      );
      return response.data;
    } catch (error) {
      console.error('Failed to create schedule with course:', error);
      throw error;
    }
  },

  updateScheduleWithCourse: async (scheduleId, scheduleData) => {
    try {
      const response = await api.put(
        `/api/schedules/${scheduleId}/with-course?courseId=${scheduleData.courseId}`,
        scheduleData
      );
      return response.data;
    } catch (error) {
      console.error('Failed to update schedule with course:', error);
      throw error;
    }
  },

  checkConflicts: async (scheduleData, excludeId = null) => {
    try {
      const params = new URLSearchParams({
        day: scheduleData.day,
        startTime: scheduleData.startTime,
        endTime: scheduleData.endTime
      });
      
      if (excludeId) {
        params.append('excludeId', excludeId);
      }
      
      const response = await api.get(`/api/schedules/conflicts/check?${params}`);
      return response.data;
    } catch (error) {
      console.error('Failed to check conflicts:', error);
      throw error;
    }
  }
};

// Enrolled Courses API methods (updated for authentication)
const enrolledCourseAPI = {
  getByStudent: async (studentId) => {
    try {
      const response = await api.get(`/api/enrolled-courses/student/${studentId}`);
      return response.data;
    } catch (error) {
      console.error('Failed to get student enrollments:', error);
      throw error;
    }
  },

  updateGrades: async (enrollmentId, gradeData) => {
    try {
      const response = await api.put(`/api/enrolled-courses/${enrollmentId}/grades`, gradeData);
      return response.data;
    } catch (error) {
      console.error('Failed to update grades:', error);
      throw error;
    }
  },

  getByFaculty: async (facultyId) => {
    try {
      const response = await api.get(`/api/enrolled-courses/faculty/${facultyId}`);
      return response.data;
    } catch (error) {
      console.error('Failed to get faculty enrollments:', error);
      throw error;
    }
  }
};

// Utility functions
const getCurrentUser = () => {
  try {
    const userData = localStorage.getItem('userData');
    if (userData) {
      return JSON.parse(userData);
    }
    // Fallback to old format
    return {
      role: localStorage.getItem('userRole'),
      userId: localStorage.getItem('userId'),
      username: localStorage.getItem('username')
    };
  } catch (error) {
    console.error('Failed to parse user data:', error);
    return {
      role: localStorage.getItem('userRole'),
      userId: localStorage.getItem('userId'),
      username: localStorage.getItem('username')
    };
  }
};

const getCurrentStudentId = () => {
  const user = getCurrentUser();
  if (user.role === 'STUDENT') {
    // Return the actual studentId, not the userId
    return user.studentId || null;
  }
  return null;
};

const getCurrentFacultyId = () => {
  const user = getCurrentUser();
  if (user.role === 'FACULTY') {
    // Return the actual facultyId, not the userId
    return user.facultyId || null;
  }
  return null;
};

const isAuthenticated = () => {
  return !!localStorage.getItem('userRole');
};

export default api;
export { 
  authAPI, 
  scheduleAPI, 
  enrolledCourseAPI,
  getCurrentUser,
  getCurrentStudentId,
  getCurrentFacultyId,
  isAuthenticated
};
