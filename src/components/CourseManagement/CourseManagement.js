import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './CourseManagement.css';
import Sidebar from '../Sidebar';
import { useAdminData } from '../../hooks/useAdminData';
import { courseAPI, courseSectionAPI, testConnection, programAPI, scheduleAPI } from '../../services/api';
import axios from 'axios';
import Loading from '../Loading';

const CourseManagement = () => {
  const { getUserInfo } = useAdminData();
  const navigate = useNavigate();
  const [coursesData, setCoursesData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddCourseModal, setShowAddCourseModal] = useState(false);
  const [showEditCourseModal, setShowEditCourseModal] = useState(false);
  const [showAddProgramModal, setShowAddProgramModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProgram, setSelectedProgram] = useState('');
  const [editingCourse, setEditingCourse] = useState(null);
  
  const [courseForm, setCourseForm] = useState({
    courseCode: '',
    courseDescription: '',
    credits: '',
    program: '',
    status: 'Active'
  });

  const [programForm, setProgramForm] = useState({
    programName: '',
    programCode: '',
    facultyChairman: ''
  });

  const [programs, setPrograms] = useState([]);
  const [programsLoading, setProgramsLoading] = useState(true);
  const [programsError, setProgramsError] = useState(null);

  const [showDeleteProgramModal, setShowDeleteProgramModal] = useState(false);
  const [programToDelete, setProgramToDelete] = useState('');
  const [deleteProgramError, setDeleteProgramError] = useState('');

  const [facultyList, setFacultyList] = useState([]);

  // Toast state and helpers
  const [toasts, setToasts] = useState([]);

  // Add a toast
  const showToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4500);
  };

  // Available Faculty Chairmen
  const facultyChairmen = [
    'Dr. Maria Santos',
    'Prof. John Rodriguez',
    'Dr. Sarah Chen',
    'Prof. Michael Torres',
    'Dr. Elena Fernandez',
    'Prof. Robert Kim',
    'Dr. Ana Gutierrez',
    'Prof. David Thompson'
  ];

  // Filter courses based on search and program
  const filteredCourses = coursesData.filter(course => {
    // Safely access course properties with null/undefined checks
    const courseDescription = course.courseDescription || '';
    const courseCode = course.courseCode || '';
    const program = course.program || '';
    
    const matchesSearch = courseDescription.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         courseCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         program.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesProgram = selectedProgram === '' || program === selectedProgram;
    
    return matchesSearch && matchesProgram;
  });
  
  // Debug: Log filtering results
  console.log('Total courses:', coursesData.length);
  console.log('Filtered courses:', filteredCourses.length);
  console.log('Search term:', searchTerm);
  console.log('Selected program:', selectedProgram);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10; // You can adjust this as needed

  const totalPages = Math.ceil(filteredCourses.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedCourses = filteredCourses.slice(startIndex, endIndex);

  // Pagination handlers
  const goToPage = (page) => {
    setCurrentPage(page);
  };

  const previousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const nextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  // Load courses from API on component mount
  useEffect(() => {
    testConnectionAndLoadCourses();
  }, []);

  // Fetch faculty on mount
  useEffect(() => {
    axios.get('/api/faculty')
      .then(res => setFacultyList(res.data))
      .catch(() => setFacultyList([]));
  }, []);

  // Fetch programs on mount
  useEffect(() => {
    loadPrograms();
  }, []);

  const testConnectionAndLoadCourses = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Testing backend connection...');
      
      const connectionTest = await testConnection();
      
      if (!connectionTest.success) {
        throw new Error(`Connection failed: ${connectionTest.error} (Code: ${connectionTest.code})`);
      }
      
      console.log('Connection successful, loading courses...');
      await loadCourses();
      
    } catch (err) {
      console.error('Connection test or course loading failed:', err);
      handleConnectionError(err);
    }
  };

  const loadCourses = async () => {
    try {
      console.log('Attempting to load courses from API...');
      
      const response = await courseAPI.getAllCourses();
      console.log('API Response:', response.data);
      
      // Debug: Log the structure of each course
      if (response.data && response.data.length > 0) {
        console.log('First course structure:', response.data[0]);
        console.log('Course keys:', Object.keys(response.data[0]));
      }
      
      setCoursesData(response.data);
      setError(null);
    } catch (err) {
      console.error('Error loading courses:', err);
      handleConnectionError(err);
    } finally {
      setLoading(false);
    }
  };

  const loadPrograms = async () => {
    setProgramsLoading(true);
    try {
      const res = await programAPI.getAllPrograms();
      setPrograms(res.data);
      setProgramsError(null);
    } catch (err) {
      setProgramsError('Failed to load programs.');
    }
    setProgramsLoading(false);
  };

  const handleConnectionError = (err) => {
    if (err.code === 'ERR_NETWORK' || err.message.includes('Network Error')) {
      setError('Cannot connect to server. Please check:\n1. Backend is running on http://localhost:8080\n2. No firewall blocking the connection\n3. Backend started without errors');
    } else if (err.code === 'ECONNREFUSED') {
      setError('Connection refused. The backend server is not running on http://localhost:8080');
    } else if (err.response?.status === 404) {
      setError('API endpoint not found. Please check if the CourseController is properly configured.');
    } else if (err.response?.status === 500) {
      setError('Server error. Please check the backend console for error details.');
    } else if (err.response?.status === 0) {
      setError('Network error. This might be a CORS issue or the server is not responding.');
    } else {
      setError(`Failed to load courses: ${err.response?.data?.message || err.message}`);
    }
  };

  // Course Modal functions
  const showAddCourseForm = () => {
    setEditingCourse(null);
    setCourseForm({
      courseCode: '',
      courseDescription: '',
      credits: '',
      program: '',
      status: 'Active'
    });
    setShowAddCourseModal(true);
  };

  const showEditCourseForm = (course) => {
    setEditingCourse(course);
    setCourseForm({
      courseCode: course.courseCode,
      courseDescription: course.courseDescription,
      credits: course.credits,
      program: course.program,
      status: course.status
    });
    setShowEditCourseModal(true);
  };

  const closeModal = () => {
    setShowAddCourseModal(false);
    setShowEditCourseModal(false);
    setEditingCourse(null);
    setCourseForm({
      courseCode: '',
      courseDescription: '',
      credits: '',
      program: '',
      status: 'Active'
    });
  };

  const handleCourseFormChange = (field, value) => {
    setCourseForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAddCourse = async () => {
    if (!courseForm.courseCode || !courseForm.courseDescription || !courseForm.credits || !courseForm.program) {
      showToast('Please fill in all required fields', 'error');
      return;
    }
    if (isNaN(courseForm.credits) || courseForm.credits <= 0) {
      showToast('Credits must be a positive number', 'error');
      return;
    }
    try {
      const courseData = {
        courseCode: courseForm.courseCode,
        courseDescription: courseForm.courseDescription,
        credits: parseInt(courseForm.credits),
        program: courseForm.program
      };
      await courseAPI.createCourse(courseData);
      showToast('Course added successfully!', 'success');
      closeModal();
      loadCourses();
    } catch (error) {
      if (error.response?.status === 400) {
        showToast('Course code already exists or invalid data provided!', 'error');
      } else {
        showToast('Failed to add course. Please try again.', 'error');
      }
    }
  };

  const handleEditCourse = async () => {
    if (!courseForm.courseCode || !courseForm.courseDescription || !courseForm.credits || !courseForm.program) {
      showToast('Please fill in all required fields', 'error');
      return;
    }
    if (isNaN(courseForm.credits) || courseForm.credits <= 0) {
      showToast('Credits must be a positive number', 'error');
      return;
    }
    try {
      const courseData = {
        courseCode: courseForm.courseCode,
        courseDescription: courseForm.courseDescription,
        credits: parseInt(courseForm.credits),
        program: courseForm.program
      };
      await courseAPI.updateCourse(editingCourse.id, courseData);
      showToast('Course updated successfully!', 'success');
      closeModal();
      loadCourses();
    } catch (error) {
      if (error.response?.status === 400) {
        showToast('Course code already exists or invalid data provided!', 'error');
      } else if (error.response?.status === 404) {
        showToast('Course not found!', 'error');
      } else {
        showToast('Failed to update course. Please try again.', 'error');
      }
    }
  };

  const handleDeleteCourse = async (courseId) => {
    if (window.confirm('Are you sure you want to delete this course?')) {
      try {
        await courseAPI.deleteCourse(courseId);
        showToast('Course deleted successfully!', 'success');
        loadCourses();
      } catch (error) {
        if (error.response?.status === 404) {
          showToast('Course not found!', 'error');
        } else {
          showToast('Failed to delete course. Please try again.', 'error');
        }
      }
    }
  };

  // Program Modal functions
  const handleProgramFormChange = (field, value) => {
    setProgramForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const showAddProgramForm = () => {
    setProgramForm({
      programName: '',
      programCode: '',
      facultyChairman: ''
    });
    setShowAddProgramModal(true);
  };

  const closeAddProgramModal = () => {
    setShowAddProgramModal(false);
    setProgramForm({
      programName: '',
      programCode: '',
      facultyChairman: ''
    });
  };

  const handleAddProgram = async () => {
    if (!programForm.programName) {
      showToast('Please enter a program name.', 'error');
      return;
    }
    const payload = { programName: programForm.programName };
    if (programForm.facultyChairman) {
      payload.chairFaculty = { facultyID: Number(programForm.facultyChairman) };
    }
    try {
      await programAPI.createProgram(payload);
      setShowAddProgramModal(false);
      setProgramForm({ programName: '', facultyChairman: '' });
      showToast('Program added successfully!', 'success');
      loadPrograms();
    } catch (err) {
      showToast('Failed to add program.', 'error');
    }
  };

  const openDeleteProgramModal = () => {
    setProgramToDelete('');
    setDeleteProgramError('');
    setShowDeleteProgramModal(true);
  };

  const closeDeleteProgramModal = () => {
    setShowDeleteProgramModal(false);
    setDeleteProgramError('');
  };

  const handleDeleteProgram = async () => {
    if (!programToDelete) return;
    try {
      await programAPI.deleteProgram(programToDelete);
      loadPrograms();
      setShowDeleteProgramModal(false);
      setProgramToDelete('');
      setDeleteProgramError('');
      showToast('Program deleted successfully!', 'success');
    } catch (err) {
      setDeleteProgramError(
        err.response?.status === 409
          ? 'Cannot delete: Program has courses assigned.'
          : 'Failed to delete program.'
      );
      showToast(
        err.response?.status === 409
          ? 'Cannot delete: Program has courses assigned.'
          : 'Failed to delete program.',
        'error'
      );
    }
  };


  const handleProgramSelect = (program) => {
    setSelectedProgram(program);
  };

  // Show loading state
  if (loading) {
    return (
      <div className="container">
        <Sidebar userInfo={getUserInfo()} />
        <div className="main-content">
          <div className="content-wrapper">
            <Loading message="Loading courses..." />
          </div>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="container">
        <Sidebar userInfo={getUserInfo()} />
        <div className="main-content">
          <div className="content-wrapper">
            <div style={{ padding: '2rem', textAlign: 'center' }}>
              <div style={{ color: '#ef4444', marginBottom: '1rem' }}>
                <h3>Error Loading Courses</h3>
                <pre style={{ 
                  background: '#f5f5f5', 
                  padding: '1rem', 
                  borderRadius: '4px', 
                  textAlign: 'left',
                  whiteSpace: 'pre-wrap',
                  fontSize: '14px'
                }}>
                  {error}
                </pre>  
                <div style={{ marginTop: '1rem', fontSize: '14px', color: '#666' }}>
                  <p><strong>Troubleshooting steps:</strong></p>
                  <ol style={{ textAlign: 'left', display: 'inline-block' }}>
                    <li>Check if Spring Boot is running: <code>http://localhost:8080</code></li>
                    <li>Check browser console for additional errors</li>
                    <li>Verify backend logs for any startup errors</li>
                    <li>Try accessing the API directly: <code>http://localhost:8080/api/courses</code></li>
                  </ol>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                <button onClick={testConnectionAndLoadCourses} className="btn btn-primary">
                  Retry Connection
                </button>
                <button 
                  onClick={() => window.open('http://localhost:8080/api/courses', '_blank')} 
                  className="btn btn-secondary"
                >
                  Test API Directly
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
  <div className="container">
    {/* Toast Container */}
    <div id="toast-container">
      {toasts.map(t => (
        <div key={t.id} className={`toast ${t.type}`}>
          {t.message}
        </div>
      ))}
    </div>

    <Sidebar userInfo={getUserInfo()} />
    <div className="main-content">
      <div className="content-wrapper">
        <div className="breadcrumb">
          <span 
            className="breadcrumb-link" 
            onClick={() => navigate('/admin-dashboard')}
          >
            Dashboard
          </span>
          <span className="breadcrumb-separator"> / </span>
          <span className="breadcrumb-current">Course Management</span>
        </div>
        
        <div className="course-header">
          <h1 className="dashboard-welcome-title">Course Management</h1>
          {selectedProgram && (
            <div className="program-indicator">{selectedProgram}</div>
          )}
        </div>

        <div className="course-content-wrapper">
          <div className="course-nav-section">
            <div className="course-nav-header">
              <h2 className="course-nav-title">Programs</h2>
            </div>
            <div className="course-nav-list">
                <div
                className={`course-nav-item ${selectedProgram === '' ? 'course-nav-item-active' : ''}`}
                onClick={() => handleProgramSelect('')}>
                <span className="course-nav-icon">📚</span>
                All Programs
                <span className="course-nav-count">{coursesData.length}</span>
              </div>

            {programs.map((program) => (
             <div key={program.programID}
               className={`course-nav-item ${selectedProgram === program.programName ? 'course-nav-item-active' : ''}`}
               onClick={() => handleProgramSelect(program.programName)}>
              <span className="course-nav-icon">📚</span>
              {program.programName}
             </div>
            ))}
          </div>
            <div className="course-nav-actions">
              <button className="course-btn-add-program" onClick={showAddProgramForm}>
                Add Program
              </button>
              <button className="course-btn-delete-program" onClick={openDeleteProgramModal}>
                Delete Program
              </button>
            </div>
          </div>

          <div className="course-main-section">
            <div className="course-section-header">
              <h2 className="course-section-title">Courses</h2>
              <p className="course-section-desc">Manage course records and information</p>
            </div>
            
            <div className="course-section-content">
              <div className="course-filters">
                <div className="course-search-group">
                  <input
                    type="text"
                    className="form-input course-search-input"
                    placeholder="Search courses..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className="course-header-actions">
                  <button className="course-btn-add-course" onClick={showAddCourseForm}>
                    + Add New Course
                  </button>
                </div>
              </div>

              <div className="course-table-container">
                <table className="course-table">
                  <thead>
                    <tr>
                      <th>Course Code</th>
                      <th>Course Description</th>
                      <th>Credits</th>
                      <th>Program</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedCourses.map((course) => (
                      <tr key={course.id}>
                        <td className="course-code">{course.courseCode}</td>
                        <td className="course-description">{course.courseDescription}</td>
                        <td className="course-credits">{course.credits}</td>
                        <td className="course-program">{course.program}</td>
                        <td>
                          <div className="action-buttons">
                            <button //Edit Button
                              className="btn-action btn-edit"
                              onClick={() => showEditCourseForm(course)}
                              title="Edit Course"
                            >
                              ✏️
                            </button>
                            <button //Delete Button
                              className="btn-action btn-delete"
                              onClick={() => handleDeleteCourse(course.id)}
                              title="Delete Course"
                            >
                              🗑️
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {filteredCourses.length > 0 && (
                  <div className="pagination">
                    <div className="pagination-info">
                      Showing {startIndex + 1} to {Math.min(endIndex, filteredCourses.length)} of {filteredCourses.length} entries
                    </div>
                    <div className="pagination-controls">
                      <button className="page-btn" onClick={previousPage} disabled={currentPage === 1}>
                        Previous
                      </button>
                      {[...Array(Math.min(3, totalPages))].map((_, index) => {
                        const pageNum = index + 1;
                        return (
                          <button
                            key={pageNum}
                            className={`page-btn ${currentPage === pageNum ? 'active' : ''}`}
                            onClick={() => goToPage(pageNum)}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                      <button className="page-btn" onClick={nextPage} disabled={currentPage === totalPages}>
                        Next
                      </button>
                    </div>
                  </div>
                )}

                {filteredCourses.length === 0 && (
                  <div className="no-courses">
                    <p>No courses found matching your criteria.</p>
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>

    {/*Add Course Modal */}
    {(showAddCourseModal || showEditCourseModal) && (
      <div className="modal-overlay">
        <div className="modal-content">
          <div className="modal-header">
            <h2 className="modal-title">
              {editingCourse ? 'Edit Course' : 'Add New Course'}
            </h2>
          </div>
          
          <div className="modal-body">
            <div className="modal-grid">
              <div className="form-group">
                <label className="form-label">Course Code *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Enter Course Code (e.g., CS101)"
                  value={courseForm.courseCode}
                  onChange={(e) => handleCourseFormChange('courseCode', e.target.value)}
                />
              </div>
              
              <div className="form-group">
                <label className="form-label">Course Description *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Enter Course Description"
                  value={courseForm.courseDescription}
                  onChange={(e) => handleCourseFormChange('courseDescription', e.target.value)}
                />
              </div>
              
              <div className="form-group">
                <label className="form-label">Credits *</label>
                <input
                  type="number"
                  className="form-input"
                  placeholder="Enter number of credits"
                  min="1"
                  max="6"
                  value={courseForm.credits}
                  onChange={(e) => handleCourseFormChange('credits', e.target.value)}
                />
              </div>
              
              <div className="form-group">
                <label className="form-label">Program *</label>
                <select
                  className="form-input"
                  value={courseForm.program}
                  onChange={(e) => handleCourseFormChange('program', e.target.value)}
                >
                  <option value="">Select Program</option>
                  {programs.map((program) => (
                    <option key={program.programID} value={program.programName}>{program.programName}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
          
          <div className="modal-footer">
            <button className="btn btn-secondary" onClick={closeModal}>
              Cancel
            </button>
            <button 
              className="btn btn-primary" 
              onClick={editingCourse ? handleEditCourse : handleAddCourse}
            >
              {editingCourse ? 'Update Course' : 'Add Course'}
            </button>
          </div>
        </div>
      </div>
    )}

    {/* Add Program Modal */}
    {showAddProgramModal && (
      <div className="modal-overlay">
        <div className="modal-content">
          <div className="modal-header">
            <h2 className="modal-title">Add New Program</h2>
          </div>
          
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label">Program Name *</label>
              <input
                type="text"
                className="form-input"
                placeholder="Enter Program Name (e.g., BS Computer Science)"
                value={programForm.programName}
                onChange={(e) => handleProgramFormChange('programName', e.target.value)}
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">Program Code *</label>
              <input
                type="text"
                className="form-input"
                placeholder="Enter Program Code (e.g., BSCS)"
                value={programForm.programCode}
                onChange={(e) => handleProgramFormChange('programCode', e.target.value)}
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">Faculty Chairman</label>
              <select
                className="form-select"
                value={programForm.facultyChairman}
                onChange={e => setProgramForm({ ...programForm, facultyChairman: e.target.value })}
              >
                <option value="">Select Faculty Chairman</option>
                {facultyList.map(faculty => (
                  <option key={faculty.facultyID} value={faculty.facultyID}>
                    {faculty.firstName} {faculty.lastName}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="modal-footer">
            <button className="btn btn-secondary" onClick={closeAddProgramModal}>
              Cancel
            </button>
            <button className="btn btn-primary" onClick={handleAddProgram}>
              Add Program
            </button>
          </div>
        </div>
      </div>
    )}

    {/* Delete Program Modal */}
    {showDeleteProgramModal && (
      <div className="modal-overlay">
        <div className="modal-content">
          <div className="modal-header">
            <h3 className="modal-title">Delete Program</h3>
          </div>
          <div className="modal-body">
            <label htmlFor="delete-program-dropdown">Select Program to Delete:</label>
            <select
              id="delete-program-dropdown"
              value={programToDelete}
              onChange={e => setProgramToDelete(e.target.value)}
              className="form-select"
            >
              <option value="">-- Select Program --</option>
              {programs.map(program => (
                <option key={program.programID} value={program.programID}>
                  {program.programName}
                </option>
              ))}
            </select>
            <div style={{ color: 'red', marginTop: 12 }}>
              Warning: Deleting a program is permanent. You cannot delete a program that has courses assigned.
            </div>
            {deleteProgramError && (
              <div style={{ color: 'red', marginTop: 8 }}>{deleteProgramError}</div>
            )}
          </div>
          <div className="modal-footer">
            <button className="btn btn-secondary" onClick={closeDeleteProgramModal}>
              Cancel
            </button>
            <button
              className="btn btn-danger"
              onClick={handleDeleteProgram}
              disabled={!programToDelete}
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    )}
  </div>
);
};

export default CourseManagement;