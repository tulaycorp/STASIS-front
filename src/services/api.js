import axios from 'axios';

// Create axios instance with base configuration for session-based auth
const api = axios.create({
  baseURL: 'http://localhost:8080/api',
  withCredentials: true, // CRITICAL - enables session cookies for Spring Security
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for debugging
api.interceptors.request.use(
  (config) => {
    console.log('Making API request to:', config.baseURL + config.url);
    console.log('Request method:', config.method);
    console.log('Request data:', config.data);
    
    // No more JWT token handling - using session cookies instead
    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for debugging and error handling
api.interceptors.response.use(
  (response) => {
    console.log('API response received:', response.status, response.data);
    return response;
  },
  (error) => {
    console.error('API Error Details:', {
      message: error.message,
      code: error.code,
      response: error.response?.data,
      status: error.response?.status,
      config: {
        url: error.config?.url,
        method: error.config?.method,
        baseURL: error.config?.baseURL
      }
    });
    
    // Handle authentication errors
    if (error.response?.status === 401) {
      console.warn('Authentication error - session may be invalid');
      // Clear user data and redirect to login
      localStorage.removeItem('userRole');
      localStorage.removeItem('userId');
      localStorage.removeItem('username');
      window.location.href = '/login';
    } else if (error.response?.status === 403) {
      console.error('Access denied - insufficient permissions');
    }
    
    return Promise.reject(error);
  }
);

// Course API endpoints
export const courseAPI = {
  // Get all courses
  getAllCourses: () => {
    console.log('Calling getAllCourses API...');
    return api.get('/courses');
  },
  
  // Get course by ID
  getCourseById: (id) => api.get(`/courses/${id}`),

  // Get courses by program
  getCoursesByProgram: (program) => {
    console.log('Calling getCoursesByProgram API for program:', program);
    return api.get(`/courses/program/${program}`);
  },
  
  // Create new course
  createCourse: (courseData) => {
    console.log('Calling createCourse API with data:', courseData);
    return api.post('/courses', courseData);
  },
  
  // Update course
  updateCourse: (id, courseData) => {
    console.log('Calling updateCourse API for ID:', id, 'with data:', courseData);
    return api.put(`/courses/${id}`, courseData);
  },
  
  // Delete course
  deleteCourse: (id) => {
    console.log('Calling deleteCourse API for ID:', id);
    return api.delete(`/courses/${id}`);
  },
};

// Course Sections API endpoints
export const courseSectionAPI = {
  // Get all sections
  getAllSections: () => {
    console.log('Calling getAllSections API...');
    return api.get('/course-sections');
  },
  
  // Get section by ID
  getSectionById: (id) => api.get(`/course-sections/${id}`),
  
  // Create new section
  createSection: (sectionData) => {
    console.log('Calling createSection API with data:', sectionData);
    return api.post('/course-sections', sectionData);
  },
  
  // Update section
  updateSection: (id, sectionData) => {
    console.log('Calling updateSection API for ID:', id, 'with data:', sectionData);
    return api.put(`/course-sections/${id}`, sectionData);
  },
  
  // Delete section
  deleteSection: (id) => {
    console.log('Calling deleteSection API for ID:', id);
    return api.delete(`/course-sections/${id}`);
  },
  
  // Get sections by status
  getSectionsByStatus: (status) => api.get(`/course-sections/status/${status}`),
  
  // Get sections by day
  getSectionsByDay: (day) => api.get(`/course-sections/day/${day}`),
  
  // Get sections by section name
  getSectionsBySectionName: (sectionName) => api.get(`/course-sections/section-name/${sectionName}`),
  
  // Get active sections
  getActiveSections: () => api.get('/course-sections/active'),
  
  // Update section status
  updateSectionStatus: (id, status) => api.put(`/course-sections/${id}/status?status=${encodeURIComponent(status)}`),
  
  // Validate section
  validateSection: (sectionData) => api.post('/course-sections/validate', sectionData),

  // Get sections by program ID
  getSectionsByProgram: (programId) => {
    console.log('Calling getSectionsByProgram API for program ID:', programId);
    return api.get(`/course-sections/program/${programId}`);
  },

  // Get sections by faculty ID
  getSectionsByFaculty: (facultyId) => {
    console.log('Calling getSectionsByFaculty API for faculty ID:', facultyId);
    return api.get(`/course-sections/faculty/${facultyId}`);
  },
};

// Enrolled Courses API endpoints
export const enrolledCourseAPI = {
  // Get all enrolled courses
  getAllEnrolledCourses: () => {
    console.log('Calling getAllEnrolledCourses API...');
    return api.get('/enrolled-courses');
  },
  
  // Get enrolled course by ID
  getEnrolledCourseById: (id) => api.get(`/enrolled-courses/${id}`),
  
  // Get enrolled courses by semester enrollment
  getEnrolledCoursesBySemester: (semesterEnrollmentId) => 
    api.get(`/enrolled-courses/semester-enrollment/${semesterEnrollmentId}`),
  
  // Get enrolled courses by section
  getEnrolledCoursesBySection: (sectionId) => {
    console.log('Calling getEnrolledCoursesBySection API for section ID:', sectionId);
    return api.get(`/enrolled-courses/section/${sectionId}`);
  },

  // Get enrolled courses by student
  getEnrolledCoursesByStudent: (studentId) => {
    console.log('Calling getEnrolledCoursesByStudent API for student ID:', studentId);
    return api.get(`/enrolled-courses/student/${studentId}`);
  },
  
  // Create enrollment
  createEnrollment: (enrollmentData) => {
    console.log('Calling createEnrollment API with data:', enrollmentData);
    return api.post('/enrolled-courses', enrollmentData);
  },

  // Update enrollment
  updateEnrollment: (id, enrollmentData) => {
    console.log('Calling updateEnrollment API for ID:', id, 'with data:', enrollmentData);
    return api.put(`/enrolled-courses/${id}`, enrollmentData);
  },

  // Update grades for enrollment
  updateGrades: (id, gradeData) => {
    console.log('Calling updateGrades API for enrollment ID:', id, 'with grades:', gradeData);
    return api.put(`/enrolled-courses/${id}/grades`, gradeData);
  },

  // Update midterm grade
  updateMidtermGrade: (id, grade) => {
    console.log('Calling updateMidtermGrade API for enrollment ID:', id, 'with grade:', grade);
    return api.put(`/enrolled-courses/${id}/midterm-grade`, { midtermGrade: grade });
  },

  // Update final grade
  updateFinalGrade: (id, grade) => {
    console.log('Calling updateFinalGrade API for enrollment ID:', id, 'with grade:', grade);
    return api.put(`/enrolled-courses/${id}/final-grade`, { finalGrade: grade });
  },

  // Update overall grade
  updateOverallGrade: (id, grade) => {
    console.log('Calling updateOverallGrade API for enrollment ID:', id, 'with grade:', grade);
    return api.put(`/enrolled-courses/${id}/overall-grade`, { overallGrade: grade });
  },

  // Bulk update grades
  bulkUpdateGrades: (gradeUpdates) => {
    console.log('Calling bulkUpdateGrades API with updates:', gradeUpdates);
    return api.put('/enrolled-courses/bulk-update-grades', gradeUpdates);
  },

  // Delete enrollment (with optional course-specific deletion)
  deleteEnrollment: (id, scheduleId = null) => {
    console.log('Calling deleteEnrollment API for ID:', id, scheduleId ? `(schedule: ${scheduleId})` : '(entire enrollment)');
    const url = scheduleId 
      ? `/enrolled-courses/${id}?scheduleId=${scheduleId}`
      : `/enrolled-courses/${id}`;
    return api.delete(url);
  },

  // Get enrolled courses by faculty's sections
  getEnrolledCoursesByFaculty: (facultyId) => {
    console.log('Calling getEnrolledCoursesByFaculty API for faculty ID:', facultyId);
    return api.get(`/enrolled-courses/faculty/${facultyId}`);
  },

  // Get enrolled courses by faculty's sections (explicit endpoint)
  getEnrolledCoursesByFacultySections: (facultyId) => {
    console.log('Calling getEnrolledCoursesByFacultySections API for faculty ID:', facultyId);
    return api.get(`/enrolled-courses/faculty/${facultyId}/sections`);
  },

  // Get enrolled courses by faculty and program
  getEnrolledCoursesByFacultyAndProgram: (facultyId, programId) => {
    console.log('Calling getEnrolledCoursesByFacultyAndProgram API for faculty ID:', facultyId, 'and program ID:', programId);
    return api.get(`/enrolled-courses/faculty/${facultyId}/program/${programId}`);
  },

  // Get all students enrolled in a specific course (across all sections)
  getEnrolledStudentsByCourse: (courseId) => {
    console.log('Calling getEnrolledStudentsByCourse API for course ID:', courseId);
    return api.get(`/enrolled-courses/course/${courseId}/students`);
  },
};

// Course Prerequisites API endpoints
export const coursePrerequisiteAPI = {
  // Get all prerequisites
  getAllPrerequisites: () => api.get('/course-prerequisites'),
  
  // Get prerequisites for a course
  getPrerequisitesByCourse: (courseId) => api.get(`/course-prerequisites/course/${courseId}`),
  
  // Get courses that have a specific prerequisite
  getCoursesByPrerequisite: (courseId) => api.get(`/course-prerequisites/prerequisite-for/${courseId}`),
  
  // Add prerequisite to course
  addPrerequisite: (courseId, prerequisiteId) => 
    api.post(`/course-prerequisites/course/${courseId}/prerequisite/${prerequisiteId}`),
  
  // Remove prerequisite from course
  removePrerequisite: (courseId, prerequisiteId) => 
    api.delete(`/course-prerequisites/course/${courseId}/prerequisite/${prerequisiteId}`),
  
  // Check if course has prerequisites
  hasPrerequisites: (courseId) => api.get(`/course-prerequisites/course/${courseId}/has-prerequisites`),
  
  // Check if course is prerequisite for others
  isPrerequisiteFor: (courseId) => api.get(`/course-prerequisites/course/${courseId}/is-prerequisite`),
};

// Program API endpoints
export const programAPI = {
  // Get all programs
  getAllPrograms: () => {
    console.log('Calling getAllPrograms API...');
    return api.get('/programs');
  },
  
  // Get program by ID
  getProgramById: (id) => {
    console.log('Calling getProgramById API for ID:', id);
    return api.get(`/programs/${id}`);
  },
  
  // Create new program
  createProgram: (programData) => {
    console.log('Calling createProgram API with data:', programData);
    return api.post('/programs', programData);
  },
  
  // Update program
  updateProgram: (id, programData) => {
    console.log('Calling updateProgram API for ID:', id, 'with data:', programData);
    return api.put(`/programs/${id}`, programData);
  },
  
  // Delete program
  deleteProgram: (id) => {
    console.log('Calling deleteProgram API for ID:', id);
    return api.delete(`/programs/${id}`);
  },
};

// Faculty API endpoints
export const facultyAPI = {
  // Get all faculty
  getAllFaculty: () => {
    console.log('Calling getAllFaculty API...');
    return api.get('/faculty');
  },
  
  // Get faculty by ID
  getFacultyById: (id) => api.get(`/faculty/${id}`),
  
  // Create new faculty
  createFaculty: (facultyData) => {
    console.log('Calling createFaculty API with data:', facultyData);
    return api.post('/faculty', facultyData);
  },
  
  // Update faculty
  updateFaculty: (id, facultyData) => {
    console.log('Calling updateFaculty API for ID:', id, 'with data:', facultyData);
    return api.put(`/faculty/${id}`, facultyData);
  },
  
  // Delete faculty
  deleteFaculty: (id) => {
    console.log('Calling deleteFaculty API for ID:', id);
    return api.delete(`/faculty/${id}`);
  },
  
  // Get faculty by program
  getFacultyByProgram: (programId) => api.get(`/faculty/program/${programId}`),
  
  // Get faculty by status
  getFacultyByStatus: (status) => api.get(`/faculty/status/${status}`),
  
  // Get faculty by position
  getFacultyByPosition: (position) => api.get(`/faculty/position/${position}`),
  
  // Search faculty
  searchFaculty: (searchTerm) => api.get(`/faculty/search?searchTerm=${encodeURIComponent(searchTerm)}`),
  
  // Get active faculty
  getActiveFaculty: () => api.get('/faculty/active'),
  
  // Update faculty status
  updateFacultyStatus: (id, status) => api.put(`/faculty/${id}/status?status=${encodeURIComponent(status)}`),
  
  // Get faculty by email
  getFacultyByEmail: (email) => api.get(`/faculty/email/${encodeURIComponent(email)}`),
  
  // Check if email exists
  checkEmailExists: (email) => api.get(`/faculty/email-exists/${encodeURIComponent(email)}`),
  
  // Validate faculty data
  validateFaculty: (facultyData) => api.post('/faculty/validate', facultyData),
};

// Student API endpoints
export const studentAPI = {
  // Get all students
  getAllStudents: () => {
    console.log('Calling getAllStudents API...');
    return api.get('/students');
  },
  
  // Get total student count
  getStudentCount: () => {
    return axios.get('/api/students/count');
  },
  
  // Get student by ID
  getStudentById: (id) => {
    console.log('Calling getStudentById API for ID:', id);
    return api.get(`/students/${id}`);
  },
  
  // Create new student
  createStudent: (studentData) => {
    console.log('Calling createStudent API with data:', studentData);
    return api.post('/students', studentData);
  },
  
  // Update student
  updateStudent: (id, studentData) => {
    console.log('Calling updateStudent API for ID:', id, 'with data:', studentData);
    return api.put(`/students/${id}`, studentData);
  },
  
  // Delete student
  deleteStudent: (id) => {
    console.log('Calling deleteStudent API for ID:', id);
    return api.delete(`/students/${id}`);
  },
  
  // Promote student
  promoteStudent: (id) => {
    console.log('Calling promoteStudent API for ID:', id);
    return api.put(`/students/${id}/promote`);
  },
  
  // Get students by program
  getStudentsByProgram: (programId) => api.get(`/students/program/${programId}`),

  // Get students by section
  getStudentsBySection: (sectionId) => {
    console.log('Calling getStudentsBySection API for section ID:', sectionId);
    return api.get(`/students/section/${sectionId}`);
  },
  
  // Search students
  searchStudents: (searchTerm) => api.get(`/students/search?searchTerm=${encodeURIComponent(searchTerm)}`),
  
  // Validate student data
  validateStudent: (studentData) => api.post('/students/validate', studentData),
};

// Grades API endpoints (dedicated grade management)
export const gradeAPI = {
  // Get grades by section
  getGradesBySection: (sectionId) => {
    console.log('Calling getGradesBySection API for section ID:', sectionId);
    return api.get(`/grades/section/${sectionId}`);
  },

  // Get grades by student
  getGradesByStudent: (studentId) => {
    console.log('Calling getGradesByStudent API for student ID:', studentId);
    return api.get(`/grades/student/${studentId}`);
  },

  // Get grades by faculty
  getGradesByFaculty: (facultyId) => {
    console.log('Calling getGradesByFaculty API for faculty ID:', facultyId);
    return api.get(`/grades/faculty/${facultyId}`);
  },

  // Submit grades for a section
  submitSectionGrades: (sectionId, gradesData) => {
    console.log('Calling submitSectionGrades API for section ID:', sectionId, 'with grades:', gradesData);
    return api.post(`/grades/section/${sectionId}/submit`, gradesData);
  },

  // Finalize grades for a section
  finalizeSectionGrades: (sectionId) => {
    console.log('Calling finalizeSectionGrades API for section ID:', sectionId);
    return api.put(`/grades/section/${sectionId}/finalize`);
  },

  // Export grades
  exportGrades: (sectionId, format = 'csv') => {
    console.log('Calling exportGrades API for section ID:', sectionId, 'format:', format);
    return api.get(`/grades/section/${sectionId}/export?format=${format}`, {
      responseType: 'blob'
    });
  },
};

// Curriculum API endpoints
export const curriculumAPI = {
  // Get all curriculums
  getAllCurriculums: () => {
    console.log('Calling getAllCurriculums API...');
    return api.get('/curriculums');
  },
  
  // Get curriculum by ID
  getCurriculumById: (id) => {
    console.log('Calling getCurriculumById API for ID:', id);
    return api.get(`/curriculums/${id}`);
  },
  
  // Create new curriculum
  createCurriculum: (curriculumData) => {
    console.log('Calling createCurriculum API with data:', curriculumData);
    return api.post('/curriculums', curriculumData);
  },
  
  // Update curriculum
  updateCurriculum: (id, curriculumData) => {
    console.log('Calling updateCurriculum API for ID:', id, 'with data:', curriculumData);
    return api.put(`/curriculums/${id}`, curriculumData);
  },
  
  // Delete curriculum
  deleteCurriculum: (id) => {
    console.log('Calling deleteCurriculum API for ID:', id);
    return api.delete(`/curriculums/${id}`);
  },
  
  // Get curriculums by program
  getCurriculumsByProgram: (programId) => {
    console.log('Calling getCurriculumsByProgram API for program ID:', programId);
    return api.get(`/curriculums/program/${programId}`);
  },
  
  // Get active curriculums
  getActiveCurriculums: () => {
    console.log('Calling getActiveCurriculums API...');
    return api.get('/curriculums/active');
  },
  
  // Activate curriculum
  activateCurriculum: (id) => {
    console.log('Calling activateCurriculum API for ID:', id);
    return api.put(`/curriculums/${id}/activate`);
  },
  
  // Deactivate curriculum
  deactivateCurriculum: (id) => {
    console.log('Calling deactivateCurriculum API for ID:', id);
    return api.put(`/curriculums/${id}/deactivate`);
  },
  
  // Search curriculums
  searchCurriculums: (searchTerm) => {
    console.log('Calling searchCurriculums API with term:', searchTerm);
    return api.get(`/curriculums/search?name=${encodeURIComponent(searchTerm)}`);
  },

  // Get student count for curriculum
  getStudentCount: (curriculumId) => {
    console.log('Calling getStudentCount API for curriculum:', curriculumId);
    return api.get(`/curriculums/${curriculumId}/student-count`);
  }
};

// User API endpoints
export const userAPI = {
  // Get all users
  getAllUsers: () => {
    console.log('Calling getAllUsers API...');
    return api.get('/users');
  },
  
  // Get user by ID
  getUserById: (id) => api.get(`/users/${id}`),
  
  // Update user
  updateUser: (id, userData) => {
    console.log('Calling updateUser API for ID:', id, 'with data:', userData);
    return api.put(`/users/${id}`, userData);
  },
  
  // Delete user
  deleteUser: (id) => {
    console.log('Calling deleteUser API for ID:', id);
    return api.delete(`/users/${id}`);
  },
  
  // Reset user password
  resetPassword: (id) => {
    console.log('Calling resetPassword API for ID:', id);
    return api.post(`/users/${id}/reset-password`);
  },
  
  // Update user status
  updateUserStatus: (id, status) => {
    console.log('Calling updateUserStatus API for ID:', id, 'with status:', status);
    return api.put(`/users/${id}/status?status=${encodeURIComponent(status)}`);
  },
};

// Authentication API endpoints - Updated for Spring Security session-based auth
export const authAPI = {
  // Login user - using fetch for better session cookie handling
  login: async (loginData) => {
    console.log('Calling login API with data:', loginData);
    try {
      const response = await fetch('http://localhost:8080/api/auth/login', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username: loginData.username,
          password: loginData.password,
          role: loginData.role // Role is required for Spring Security
        }),
        credentials: 'include' // CRITICAL for session cookies
      });

      if (response.ok) {
        const data = await response.json();
        
        // Store user info in localStorage for frontend use
        localStorage.setItem('userRole', data.role);
        localStorage.setItem('userId', data.userId);
        localStorage.setItem('username', data.username);
        
        return { data: { success: true, ...data } };
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  },
  
  // Logout user
  logout: async () => {
    console.log('Calling logout API...');
    try {
      await fetch('http://localhost:8080/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      });
      
      // Clear stored data
      localStorage.removeItem('userRole');
      localStorage.removeItem('userId');
      localStorage.removeItem('username');
      
      return { data: { success: true } };
    } catch (error) {
      // Still clear data even if logout request fails
      localStorage.removeItem('userRole');
      localStorage.removeItem('userId');
      localStorage.removeItem('username');
      throw error;
    }
  },
  
  // Check authentication status
  checkAuth: async () => {
    console.log('Calling auth check API...');
    try {
      const response = await fetch('http://localhost:8080/api/auth/check', { 
        credentials: 'include' 
      });
      return { data: { authenticated: response.ok } };
    } catch (error) {
      console.error('Auth check failed:', error);
      return { data: { authenticated: false } };
    }
  },
  
  // Verify token (kept for compatibility but uses session check)
  verifyToken: async () => {
    console.log('Calling verify token API (session check)...');
    return await authAPI.checkAuth();
  },
};

// Convenience function for login (used by components) - Updated for Spring Security
export const loginUser = async (loginData) => {
  try {
    console.log('Attempting login with data:', loginData);
    const response = await authAPI.login(loginData);
    return response.data;
  } catch (error) {
    console.error('Login error:', error);
    if (error.response?.data) {
      return { success: false, message: error.response.data.message };
    }
    return {
      success: false,
      message: error.message || 'Network error occurred during login'
    };
  }
};

// Utility functions for authentication
export const getCurrentUser = () => {
  return {
    role: localStorage.getItem('userRole'),
    id: localStorage.getItem('userId'),
    username: localStorage.getItem('username')
  };
};

export const getCurrentStudentId = () => {
  const user = getCurrentUser();
  return user.role === 'STUDENT' ? user.id : null;
};

export const getCurrentFacultyId = () => {
  const user = getCurrentUser();
  return user.role === 'FACULTY' ? user.id : null;
};

export const isAuthenticated = () => {
  return !!localStorage.getItem('userRole');
};

export const hasRole = (role) => {
  return localStorage.getItem('userRole') === role;
};

// Test connection function
export const testConnection = async () => {
  try {
    console.log('Testing connection to backend...');
    const response = await api.get('/courses');
    console.log('Connection test successful:', response.status);
    return { success: true, status: response.status };
  } catch (error) {
    console.error('Connection test failed:', error);
    return { 
      success: false, 
      error: error.message, 
      code: error.code,
      status: error.response?.status 
    };
  }
};

// Test all endpoints function
export const testAllEndpoints = async () => {
  const tests = [
    { name: 'Courses', test: () => api.get('/courses') },
    { name: 'Programs', test: () => api.get('/programs') },
    { name: 'Faculty', test: () => api.get('/faculty') },
  ];

  const results = {};
  
  for (const { name, test } of tests) {
    try {
      await test();
      results[name] = { success: true };
    } catch (error) {
      results[name] = { 
        success: false, 
        error: error.message,
        status: error.response?.status 
      };
    }
  }
  
  return results;
};

// Curriculum Detail API endpoints
export const curriculumDetailAPI = {
  // Get all curriculum details
  getAllCurriculumDetails: () => {
    console.log('Calling getAllCurriculumDetails API...');
    return api.get('/curriculum-details');
  },
  
  // Get curriculum detail by ID
  getCurriculumDetailById: (id) => api.get(`/curriculum-details/${id}`),
  
  // Create new curriculum detail
  createCurriculumDetail: (detailData) => {
    console.log('Calling createCurriculumDetail API with data:', detailData);
    return api.post('/curriculum-details', detailData);
  },
  
  // Update curriculum detail
  updateCurriculumDetail: (id, detailData) => {
    console.log('Calling updateCurriculumDetail API for ID:', id, 'with data:', detailData);
    return api.put(`/curriculum-details/${id}`, detailData);
  },
  
  // Delete curriculum detail
  deleteCurriculumDetail: (id) => {
    console.log('Calling deleteCurriculumDetail API for ID:', id);
    return api.delete(`/curriculum-details/${id}`);
  },
  
  // Get details by curriculum
  getDetailsByCurriculum: (curriculumId) => {
    console.log('Calling getDetailsByCurriculum API for curriculum ID:', curriculumId);
    return api.get(`/curriculum-details/curriculum/${curriculumId}`);
  },
  
  // Get details by year level
  getDetailsByYearLevel: (yearLevel) => api.get(`/curriculum-details/year/${yearLevel}`),
  
  // Get details by curriculum and year
  getDetailsByCurriculumAndYear: (curriculumId, yearLevel) => 
    api.get(`/curriculum-details/curriculum/${curriculumId}/year/${yearLevel}`)
};

// Semester Enrollment API endpoints
export const semesterEnrollmentAPI = {
  // Get all semester enrollments
  getAllSemesterEnrollments: () => {
    console.log('Calling getAllSemesterEnrollments API...');
    return api.get('/semester-enrollments');
  },
  
  // Get semester enrollment by ID
  getSemesterEnrollmentById: (id) => api.get(`/semester-enrollments/${id}`),
  
  // Get semester enrollments by student
  getSemesterEnrollmentsByStudent: (studentId) => {
    console.log('Calling getSemesterEnrollmentsByStudent API for student ID:', studentId);
    return api.get(`/semester-enrollments/student/${studentId}`);
  },
  
  // Create semester enrollment
  createSemesterEnrollment: (enrollmentData) => {
    console.log('Calling createSemesterEnrollment API with data:', enrollmentData);
    return api.post('/semester-enrollments', enrollmentData);
  },
  
  // Update semester enrollment
  updateSemesterEnrollment: (id, enrollmentData) => {
    console.log('Calling updateSemesterEnrollment API for ID:', id, 'with data:', enrollmentData);
    return api.put(`/semester-enrollments/${id}`, enrollmentData);
  },

  // Delete semester enrollment
  deleteSemesterEnrollment: (id) => {
    console.log('Calling deleteSemesterEnrollment API for ID:', id);
    return api.delete(`/semester-enrollments/${id}`);
  },
  
  // Get current semester enrollment for student
  getCurrentSemesterEnrollment: (studentId) => {
    console.log('Calling getCurrentSemesterEnrollment API for student ID:', studentId);
    return api.get(`/semester-enrollments/student/${studentId}/current`);
  },
};

// Schedule API endpoints
export const scheduleAPI = {
  // Get all schedules
  getAllSchedules: () => {
    console.log('Calling getAllSchedules API...');
    return api.get('/schedules');
  },
  
  // Get schedule by ID
  getScheduleById: (id) => {
    console.log('Calling getScheduleById API for ID:', id);
    return api.get(`/schedules/${id}`);
  },
  
  // Create new schedule. Pass courseSectionId as optional second argument.
  createSchedule: (scheduleData, courseSectionId) => {
    const url = courseSectionId ? `/schedules?courseSectionId=${encodeURIComponent(courseSectionId)}` : '/schedules';
    console.log('Calling createSchedule API to', url, 'with data:', scheduleData);
    return api.post(url, scheduleData);
  },
  
  // Create new schedule with course assignment
  createScheduleWithCourse: (scheduleData, courseSectionId) => {
    let url = '/schedules/with-course';
    const params = [];
    if (courseSectionId) params.push(`courseSectionId=${encodeURIComponent(courseSectionId)}`);
    if (scheduleData.courseId) params.push(`courseId=${encodeURIComponent(scheduleData.courseId)}`);
    if (params.length > 0) url += '?' + params.join('&');
    
    console.log('Calling createScheduleWithCourse API to', url, 'with data:', scheduleData);
    console.log('Full API URL will be:', api.defaults.baseURL + url);
    console.log('Course Section ID:', courseSectionId);
    console.log('Course ID from scheduleData:', scheduleData.courseId);
    return api.post(url, scheduleData);
  },
  
  // Update schedule
  updateSchedule: (id, scheduleData) => {
    console.log('Calling updateSchedule API for ID:', id, 'with data:', scheduleData);
    return api.put(`/schedules/${id}`, scheduleData);
  },
  
  // Update schedule with course assignment
  updateScheduleWithCourse: (id, scheduleData) => {
    let url = `/schedules/${id}/with-course`;
    if (scheduleData.courseId) url += `?courseId=${encodeURIComponent(scheduleData.courseId)}`;
    
    console.log('Calling updateScheduleWithCourse API for ID:', id, 'with data:', scheduleData);
    return api.put(url, scheduleData);
  },
  
  // Delete schedule
  deleteSchedule: (id) => {
    console.log('Calling deleteSchedule API for ID:', id);
    return api.delete(`/schedules/${id}`);
  },
  
  // Get schedules by status
  getSchedulesByStatus: (status) => api.get(`/schedules/status/${status}`),
  
  // Get schedules by day
  getSchedulesByDay: (day) => api.get(`/schedules/day/${day}`),
  
  // Get schedules by room
  getSchedulesByRoom: (room) => api.get(`/schedules/room/${room}`),
  
  // Check for schedule conflicts with optional exclusion
  checkConflicts: (day, startTime, endTime, excludeScheduleId) => {
    let url = `/schedules/conflicts/check?day=${encodeURIComponent(day)}&startTime=${encodeURIComponent(startTime)}&endTime=${encodeURIComponent(endTime)}`;
    if (excludeScheduleId) url += `&excludeScheduleId=${encodeURIComponent(excludeScheduleId)}`;
    
    console.log('Calling checkConflicts API with URL:', url);
    return api.get(url);
  },
  
  // Find conflicting schedules
  findConflictingSchedules: (day, startTime, endTime) => {
    console.log('Calling findConflictingSchedules API...');
    return api.get(`/schedules/conflicts?day=${encodeURIComponent(day)}&startTime=${encodeURIComponent(startTime)}&endTime=${encodeURIComponent(endTime)}`);
  },
  
  // Get schedules by time range
  getSchedulesByTimeRange: (startTime, endTime) => {
    console.log('Calling getSchedulesByTimeRange API...');
    return api.get(`/schedules/time-range?startTime=${encodeURIComponent(startTime)}&endTime=${encodeURIComponent(endTime)}`);
  },
  
  // Validate schedule
  validateSchedule: (scheduleData) => api.post('/schedules/validate', scheduleData),
  
  // Update schedule status
  updateScheduleStatus: (id, status) => api.put(`/schedules/${id}/status?status=${encodeURIComponent(status)}`)
};

// Faculty Grades API endpoints
export const facultyGradesAPI = {
  // Get all sections assigned to a faculty member with grade summary
  getFacultySections: (facultyId) => {
    console.log('Calling getFacultySections API for faculty ID:', facultyId);
    return api.get(`/faculty-grades/faculty/${facultyId}/sections`);
  },

  // Get detailed enrolled students for a specific section
  getSectionStudents: (sectionId) => {
    console.log('Calling getSectionStudents API for section ID:', sectionId);
    return api.get(`/faculty-grades/section/${sectionId}/students`);
  },

  // Update midterm grade for a student enrollment
  updateMidtermGrade: (enrollmentId, grade) => {
    console.log('Calling updateMidtermGrade API for enrollment ID:', enrollmentId, 'with grade:', grade);
    return api.put(`/faculty-grades/enrollment/${enrollmentId}/midterm-grade`, { midtermGrade: grade });
  },

  // Update final grade for a student enrollment
  updateFinalGrade: (enrollmentId, grade) => {
    console.log('Calling updateFinalGrade API for enrollment ID:', enrollmentId, 'with grade:', grade);
    return api.put(`/faculty-grades/enrollment/${enrollmentId}/final-grade`, { finalGrade: grade });
  },

  // Update complete grade information for a student enrollment
  updateGrades: (enrollmentId, gradeData) => {
    console.log('Calling updateGrades API for enrollment ID:', enrollmentId, 'with grades:', gradeData);
    return api.put(`/faculty-grades/enrollment/${enrollmentId}/grades`, gradeData);
  },

  // Bulk update grades for multiple enrollments
  bulkUpdateGrades: (gradeUpdates) => {
    console.log('Calling bulkUpdateGrades API with updates:', gradeUpdates);
    return api.put('/faculty-grades/bulk-update-grades', gradeUpdates);
  }
};

export default api;