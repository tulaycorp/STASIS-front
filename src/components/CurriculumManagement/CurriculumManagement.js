import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './CurriculumManagement.css';
import Sidebar from '../Sidebar';
import { useAdminData } from '../../hooks/useAdminData';
import { curriculumAPI, programAPI, courseAPI, curriculumDetailAPI, courseSectionAPI, testConnection } from '../../services/api';
import Loading from '../Loading';

const CurriculumManagement = () => {
  const { getUserInfo } = useAdminData();
    const navigate = useNavigate();
  
  // State management
  const [curriculumData, setCurriculumData] = useState([]);
  const [programsList, setProgramsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [studentCounts, setStudentCounts] = useState({});
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProgramFilter, setSelectedProgramFilter] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [availableCourses, setAvailableCourses] = useState([]);
  const [expandedCurricula, setExpandedCurricula] = useState(new Set());
  const [curriculumCourses, setCurriculumCourses] = useState({});
  
  const [formData, setFormData] = useState({
    curriculumName: '',
    curriculumCode: '',
    programId: '',
    academicYear: '',
    status: 'Draft',
    description: '',
    selectedCourses: [],
    courseYearLevels: {}, // Maps courseId to YearLevel
    courseSemesters: {},   // Maps courseId to Semester
    activeSemesterTab: '1', // Default to 1st semester tab
    autoCreateSections: false, // Enable/disable auto create sections
    autoCreateYear: '', // Selected year level for auto create
    sectionsPerYear: '' // Number of sections to create per year
  });
  const [courseSearchTerm, setCourseSearchTerm] = useState('');
  const [toasts, setToasts] = useState([]);

  const showToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4500);
  };

  // Load data on component mount
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Test connection first
      const connectionTest = await testConnection();
      if (!connectionTest.success) {
        throw new Error(`Connection failed: ${connectionTest.error}`);
      }

      // Load curriculums and programs in parallel
      await Promise.all([
        loadCurriculums(),
        loadPrograms()
      ]);
      
    } catch (err) {
      console.error('Error loading initial data:', err);
      handleConnectionError(err);
    } finally {
      setLoading(false);
    }
  };

  const loadCurriculums = async () => {
    try {
      console.log('Loading curriculums from API...');
      const response = await curriculumAPI.getAllCurriculums();
      console.log('Curriculums response:', response);
      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);
      console.log('Raw response data:', response.data);
      
      // Validate response
      if (!response || !response.data) {
        throw new Error('Invalid response from server');
      }
      
      // Handle empty response
      if (response.data === '') {
        console.log('Empty response from server');
        setCurriculumData([]);
        return;
      }
      
      // Check if response.data is an array
      if (!Array.isArray(response.data)) {
        console.error('Expected array but got:', typeof response.data);
        console.error('Response data:', response.data);
        setCurriculumData([]);
        setError('Invalid data format received from server. Expected array but got ' + typeof response.data);
        return;
      }
      
      // Transform backend data to match frontend expectations
      const transformedData = response.data.map(curriculum => {
        // Fetch student count for each curriculum
        curriculumAPI.getStudentCount(curriculum.curriculumID)
          .then(countResponse => {
            setStudentCounts(prev => ({
              ...prev,
              [curriculum.curriculumID]: countResponse.data
            }));
          })
          .catch(error => {
            console.error('Error fetching student count:', error);
            setStudentCounts(prev => ({
              ...prev,
              [curriculum.curriculumID]: 0
            }));
          });
        console.log('Processing curriculum:', curriculum);
        return {
          id: curriculum.curriculumID,
          name: curriculum.curriculumName,
          program: curriculum.program?.programName || 'No Program',
          programId: curriculum.program?.programID || null,
          academicYear: curriculum.academicYear || 'N/A',
          status: curriculum.status || 'Draft',
          lastUpdated: curriculum.lastUpdated || curriculum.effectiveStartDate,
          description: curriculum.description || '',
          effectiveStartDate: curriculum.effectiveStartDate,
          programObject: curriculum.program
        };
      });
      
      console.log('Transformed data:', transformedData);
      setCurriculumData(transformedData);
      setError(null);
    } catch (err) {
      console.error('Error loading curriculums:', err);
      console.error('Error details:', {
        message: err.message,
        stack: err.stack,
        response: err.response,
        status: err.response?.status,
        data: err.response?.data
      });
      setError(`Failed to load curricula: ${err.message}`);
      setCurriculumData([]);
    }
  };

  const loadPrograms = async () => {
    try {
      console.log('Loading programs from API...');
      const response = await programAPI.getAllPrograms();
      console.log('Programs response:', response);
      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);
      console.log('Raw response data:', response.data);
      
      // Validate response
      if (!response || !response.data) {
        throw new Error('Invalid response from server');
      }
      
      // Handle empty response
      if (response.data === '') {
        console.log('Empty response from server');
        setProgramsList([]);
        return;
      }
      
      // Check if response.data is an array
      if (!Array.isArray(response.data)) {
        console.error('Expected array but got:', typeof response.data);
        console.error('Response data:', response.data);
        setProgramsList([]);
        setError('Invalid program data format received from server');
        return;
      }
      
      console.log('Setting programs list:', response.data);
      setProgramsList(response.data);
    } catch (err) {
      console.error('Error loading programs:', err);
      console.error('Error details:', {
        message: err.message,
        stack: err.stack,
        response: err.response,
        status: err.response?.status,
        data: err.response?.data
      });
      setProgramsList([]);
    }
  };

  const handleConnectionError = (err) => {
    if (err.code === 'ERR_NETWORK' || err.message.includes('Network Error')) {
      setError('Cannot connect to server. Please check:\n1. Backend is running on http://localhost:8080\n2. No firewall blocking the connection\n3. Backend started without errors');
    } else if (err.code === 'ECONNREFUSED') {
      setError('Connection refused. The backend server is not running on http://localhost:8080');
    } else if (err.response?.status === 404) {
      setError('API endpoint not found. Please check if the CurriculumController is properly configured.');
    } else if (err.response?.status === 500) {
      setError('Server error. Please check the backend console for error details.');
    } else if (err.response?.status === 0) {
      setError('Network error. This might be a CORS issue or the server is not responding.');
    } else {
      setError(`Failed to load curricula: ${err.response?.data?.message || err.message}`);
    }
  };

  // Filter data based on search and program
  const filteredData = curriculumData.filter(curriculum => {
    const matchesSearch = curriculum.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (curriculum.code && curriculum.code.toLowerCase().includes(searchTerm.toLowerCase())) ||
      curriculum.program.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesProgram = selectedProgramFilter === '' || 
      curriculum.programId?.toString() === selectedProgramFilter;
    
    return matchesSearch && matchesProgram;
  });

  // Pagination
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedData = filteredData.slice(startIndex, endIndex);

  // Statistics
  const activeCurricula = curriculumData.filter(c => c.status === 'Active').length;
  
  // Program statistics
  const getProgramCurriculumCount = (programId) => {
    return curriculumData.filter(c => c.programId === programId).length;
  };
  
  const getProgramActiveCurriculumCount = (programId) => {
    return curriculumData.filter(c => c.programId === programId && c.status === 'Active').length;
  };

  // Format date using backend LocalDate
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      // Handle LocalDate format from backend (yyyy-mm-dd)
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: '2-digit', 
        day: '2-digit' 
      });
    } catch {
      return dateString;
    }
  };

  // Modal functions
  const openModal = () => {
    setIsModalOpen(true);
    setEditingId(null);
    setFormData({
      curriculumName: '',
      programId: '',
      academicYear: '',
      status: 'Draft',
      description: '',
      selectedCourses: [],
      courseYearLevels: {},
      courseSemesters: {},
      activeSemesterTab: '1',
      autoCreateSections: false,
      autoCreateYear: '',
      sectionsPerYear: ''
    });
    setAvailableCourses([]); // Clear available courses
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setFormData({
      curriculumName: '',
      programId: '',
      academicYear: '',
      status: 'Draft',
      description: '',
      selectedCourses: [],
      courseYearLevels: {},
      courseSemesters: {},
      activeSemesterTab: '1',
      autoCreateSections: false,
      autoCreateYear: '',
      sectionsPerYear: ''
    });
    setAvailableCourses([]); // Clear available courses
    setCourseSearchTerm(''); // Clear course search term
  };

  // Edit curriculum
  const editCurriculum = async (id) => {
    const curriculum = curriculumData.find(c => c.id === id);
    if (curriculum) {
      try {
        // Load curriculum details to get selected courses
        const detailsResponse = await curriculumDetailAPI.getDetailsByCurriculum(id);
        const selectedCourseIds = detailsResponse.data.map(detail => detail.course.id);
        
        // Build year levels and semesters mapping using actual field names
        const courseYearLevels = {};
        const courseSemesters = {};
        detailsResponse.data.forEach(detail => {
          courseYearLevels[detail.course.id] = detail.yearLevel; // Using yearLevel (lowercase from JSON)
          courseSemesters[detail.course.id] = detail.semester;   // Using semester (lowercase from JSON)
        });

        // Load available courses for the program
        const program = programsList.find(p => p.programID === curriculum.programId);
        if (program) {
          const coursesResponse = await courseAPI.getCoursesByProgram(program.programName);
          const transformedCourses = coursesResponse.data.map(course => ({
            id: course.id,
            courseCode: course.courseCode,
            courseDescription: course.courseDescription,
            credits: course.credits
          }));
          setAvailableCourses(transformedCourses);
        }

        setEditingId(id);
        setFormData({
          curriculumName: curriculum.name,
          programId: curriculum.programId?.toString() || '',
          academicYear: curriculum.academicYear,
          status: curriculum.status,
          description: curriculum.description,
          selectedCourses: selectedCourseIds,
          courseYearLevels: courseYearLevels,
          courseSemesters: courseSemesters,
          activeSemesterTab: '1',
          autoCreateSections: false, // Reset auto create for editing
          autoCreateYear: '',
          sectionsPerYear: ''
        });
        setIsModalOpen(true);
      } catch (error) {
        console.error('Error loading curriculum details:', error);
        showToast('Failed to load curriculum details. Please try again.', 'error');
      }
    }
  };

  // Check if section already exists for the program
  const checkSectionExists = async (programObj, sectionName) => {
    try {
      const sectionsResponse = await courseSectionAPI.getAllSections();
      const existingSections = sectionsResponse.data.filter(section => 
        (section.program?.programID === programObj.programID || 
         section.programId === programObj.programID) &&
        section.sectionName === sectionName
      );
      return existingSections.length > 0;
    } catch (error) {
      console.error('Error checking existing sections:', error);
      return false; // If we can't check, allow creation (API will handle duplicates)
    }
  };

  // Auto create sections function
  const autoCreateSectionsForProgram = async (programObj, yearLevel, sectionsCount) => {
    const createdSections = [];
    const skippedSections = [];
    const failedSections = [];

    for (let sectionNum = 1; sectionNum <= sectionsCount; sectionNum++) {
      const sectionName = `${yearLevel}-${sectionNum}`;
      
      try {
        // Check if section already exists
        const sectionExists = await checkSectionExists(programObj, sectionName);
        
        if (sectionExists) {
          skippedSections.push(sectionName);
          console.log(`Section ${sectionName} already exists for program ${programObj.programName}, skipping...`);
          continue;
        }

        // Create the section
        const sectionData = {
          sectionName: sectionName,
          program: programObj,
          status: 'ACTIVE'
        };

        await courseSectionAPI.createSection(sectionData);
        createdSections.push(sectionName);
        console.log(`Successfully created section: ${sectionName}`);
        
      } catch (error) {
        console.error(`Error creating section ${sectionName}:`, error);
        failedSections.push(sectionName);
      }
    }

    return { createdSections, skippedSections, failedSections };
  };

  // Save curriculum
  const saveCurriculum = async () => {
    // Enhanced validation
    if (!formData.curriculumName?.trim()) {
      showToast('Please enter a curriculum name', 'error');
      return;
    }
    
    if (!formData.programId) {
      showToast('Please select a program', 'error');
      return;
    }
    
    if (!formData.academicYear) {
      showToast('Please select an academic year', 'error');
      return;
    }
    
    if (!formData.status) {
      showToast('Please select a status', 'error');
      return;
    }

    // Validate auto create sections if enabled
    if (formData.autoCreateSections) {
      if (!formData.autoCreateYear) {
        showToast('Please select a year level for auto create sections', 'error');
        return;
      }
      
      if (!formData.sectionsPerYear || parseInt(formData.sectionsPerYear) < 1) {
        showToast('Please select number of sections to create (minimum 1)', 'error');
        return;
      }
    }

    try {
      const selectedProgramObj = programsList.find(p => p.programID.toString() === formData.programId);
      
      if (!selectedProgramObj) {
        showToast('Selected program not found', 'error');
        return;
      }
      
      const curriculumDataPayload = {
        curriculumName: formData.curriculumName.trim(),
        program: selectedProgramObj,
        academicYear: formData.academicYear,
        status: formData.status,
        description: formData.description?.trim() || '',
        effectiveStartDate: new Date().toISOString().split('T')[0]
      };

      let curriculumId;
      if (editingId) {
        // Update existing curriculum
        await curriculumAPI.updateCurriculum(editingId, curriculumDataPayload);
        curriculumId = editingId;
        
        // Delete existing curriculum details
        try {
          const existingDetails = await curriculumDetailAPI.getDetailsByCurriculum(editingId);
          if (existingDetails.data && existingDetails.data.length > 0) {
            for (const detail of existingDetails.data) {
              await curriculumDetailAPI.deleteCurriculumDetail(detail.curriculumDetailID);
            }
          }
        } catch (detailError) {
          console.warn('No existing details to delete or error deleting:', detailError);
        }
      } else {
        // Create new curriculum
        const response = await curriculumAPI.createCurriculum(curriculumDataPayload);
        curriculumId = response.data.curriculumID;
      }

      // Save curriculum details (selected courses) with correct field names
      if (formData.selectedCourses && formData.selectedCourses.length > 0) {
        const detailPromises = formData.selectedCourses.map(courseId => {
          const course = availableCourses.find(c => c.id === courseId);
          if (course) {
            return curriculumDetailAPI.createCurriculumDetail({
              curriculum: { curriculumID: curriculumId },
              course: { id: courseId },
              yearLevel: formData.courseYearLevels?.[courseId] || 1,
              semester: formData.courseSemesters?.[courseId] || "1"
            });
          }
          return null;
        }).filter(promise => promise !== null);

        if (detailPromises.length > 0) {
          await Promise.all(detailPromises);
        }
      }

      // Auto create sections if enabled and not editing
      if (formData.autoCreateSections && !editingId) {
        try {
          const sectionsResult = await autoCreateSectionsForProgram(
            selectedProgramObj,
            formData.autoCreateYear,
            parseInt(formData.sectionsPerYear)
          );

          // Show detailed results
          let sectionMessage = '';
          if (sectionsResult.createdSections.length > 0) {
            sectionMessage += `Created sections: ${sectionsResult.createdSections.join(', ')}. `;
          }
          if (sectionsResult.skippedSections.length > 0) {
            sectionMessage += `Skipped existing sections: ${sectionsResult.skippedSections.join(', ')}. `;
          }
          if (sectionsResult.failedSections.length > 0) {
            sectionMessage += `Failed to create: ${sectionsResult.failedSections.join(', ')}. `;
          }

          if (sectionsResult.createdSections.length > 0 || sectionsResult.skippedSections.length > 0) {
            showToast(`Curriculum saved successfully! ${sectionMessage}`, 'success');
          } else {
            showToast('Curriculum saved successfully, but no sections were created.', 'warning');
          }
        } catch (sectionError) {
          console.error('Error in auto create sections:', sectionError);
          showToast('Curriculum saved successfully, but section creation failed. Please create sections manually.', 'warning');
        }
      } else {
        showToast(editingId ? 'Curriculum updated successfully!' : 'Curriculum created successfully!', 'success');
      }

      closeModal();
      loadCurriculums(); // Fixed function name
    } catch (error) {
      console.error('Error saving curriculum:', error);
      
      // Better error handling
      if (error.response?.status === 400) {
        showToast('Invalid data provided. Please check your input.', 'error');
      } else if (error.response?.status === 409) {
        showToast('A curriculum with this code already exists.', 'error');
      } else if (error.response?.status === 500) {
        showToast('Server error. Please try again later.', 'error');
      } else {
        showToast('Failed to save curriculum. Please try again.', 'error');
      }
    }
  };

  // Toggle curriculum expansion
  const toggleCurriculumExpansion = async (curriculumId) => {
    const newExpandedCurricula = new Set(expandedCurricula);
    
    if (expandedCurricula.has(curriculumId)) {
      newExpandedCurricula.delete(curriculumId);
    } else {
      newExpandedCurricula.add(curriculumId);
      // Load courses if not already loaded
      if (!curriculumCourses[curriculumId]) {
        try {
          const response = await curriculumDetailAPI.getDetailsByCurriculum(curriculumId);
          setCurriculumCourses(prev => ({
            ...prev,
            [curriculumId]: response.data
          }));
        } catch (error) {
          console.error('Error loading curriculum courses:', error);
        }
      }
    }
    
    setExpandedCurricula(newExpandedCurricula);
  };

  // Delete curriculum
  const deleteCurriculum = async (id) => {
    if (window.confirm('Are you sure you want to delete this curriculum?')) {
      try {
        await curriculumAPI.deleteCurriculum(id);
        showToast('Curriculum deleted successfully!', 'success');
        loadCurriculums(); // Reload the list
      } catch (error) {
        console.error('Error deleting curriculum:', error);
        if (error.response?.status === 404) {
          showToast('Curriculum not found!', 'error');
        } else if (error.response?.status === 500) {
          showToast('Server error. Please try again later.', 'error');
        } else {
          showToast('Failed to delete curriculum. Please try again.', 'error');
        }
      }
    }
  };

  // Handle form input changes
  const handleInputChange = async (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
      // Reset selected courses and their mappings when program changes
      ...(name === 'programId' && { 
        selectedCourses: [],
        courseYearLevels: {},
        courseSemesters: {}
      })
    }));

    // Load courses when program is selected
    if (name === 'programId' && value) {
      setCourseSearchTerm('');
      try {
        const program = programsList.find(p => p.programID.toString() === value);
        if (program) {
          console.log('Loading courses for program:', program.programName);
          console.log('Program object:', program);
          const response = await courseAPI.getCoursesByProgram(program.programName);
          console.log('Courses response:', response.data);
          console.log('Number of courses found:', response.data.length);
          if (response.data.length > 0) {
            console.log('First course structure:', response.data[0]);
            console.log('First course program field:', response.data[0].program);
          }
          setAvailableCourses(response.data);
        }
      } catch (error) {
        console.error('Error loading courses:', error);
        setAvailableCourses([]);
      }
    } else if (name === 'programId' && !value) {
      // Clear courses when no program is selected
      setAvailableCourses([]);
      setCourseSearchTerm('');
    }
  };

  const handleCourseSelection = (courseId) => {
    setFormData(prev => {
      const isSelected = prev.selectedCourses.includes(courseId);
      const selectedCourses = isSelected
        ? prev.selectedCourses.filter(id => id !== courseId)
        : [...prev.selectedCourses, courseId];
    
      const courseYearLevels = { ...prev.courseYearLevels };
      const courseSemesters = { ...prev.courseSemesters };
    
      if (isSelected) {
        // Remove year level and semester when unchecking
        delete courseYearLevels[courseId];
        delete courseSemesters[courseId];
      } else {
        // Set default values when checking
        courseYearLevels[courseId] = 1;
        courseSemesters[courseId] = "1";
      }
    
      return { 
        ...prev, 
        selectedCourses,
        courseYearLevels,
        courseSemesters
      };
    });
  };

  const handleCourseYearChange = (courseId, yearLevel) => {
    setFormData(prev => ({
      ...prev,
      courseYearLevels: {
        ...prev.courseYearLevels,
        [courseId]: parseInt(yearLevel)
      }
    }));
  };

  const handleCourseSemesterChange = (courseId, semester) => {
    setFormData(prev => ({
      ...prev,
      courseSemesters: {
        ...prev.courseSemesters,
        [courseId]: semester
      }
    }));
  };

  // Pagination functions
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

  // Reset to first page when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  // Show loading state
  if (loading) {
    return (
      <div className="dashboard-container">
        <Sidebar userInfo={getUserInfo()}/>
        <div className="main-content">
          <div className="content-wrapper">
            <Loading message="Loading curricula..." />
          </div>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="dashboard-container">
        <Sidebar userInfo={getUserInfo()}/>
        <div className="main-content">
          <div className="content-wrapper">
            <div style={{ padding: '2rem', textAlign: 'center' }}>
              <div className="error-container">
                <h3>Connection Error</h3>
                <p style={{ whiteSpace: 'pre-line', margin: '1rem 0' }}>{error}</p>
                <div style={{ marginTop: '1rem' }}>
                  <h4>Troubleshooting Steps:</h4>
                  <ol style={{ textAlign: 'left', maxWidth: '500px', margin: '0 auto' }}>
                    <li>Check if Spring Boot is running: <code>http://localhost:8080</code></li>
                    <li>Check browser console for additional errors</li>
                    <li>Verify backend logs for any startup errors</li>
                    <li>Try accessing the API directly: <code>http://localhost:8080/api/curriculums</code></li>
                  </ol>
                </div>
                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '1rem' }}>
                  <button onClick={loadInitialData} className="btn btn-primary">
                    Retry Connection
                  </button>
                  <button 
                    onClick={() => window.open('http://localhost:8080/api/curriculums', '_blank')} 
                    className="btn btn-secondary"
                  >
                    Test API Directly
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

    // <<< ADDED: Filtering logic for courses in modal
  const filteredAvailableCourses = availableCourses.filter(course =>
    course.courseCode.toLowerCase().includes(courseSearchTerm.toLowerCase()) ||
    course.courseDescription.toLowerCase().includes(courseSearchTerm.toLowerCase())
  );

  return (
    <div className="container">
      {/* Toast Container */}
      <div id="toast-container">
        {toasts.map(toast => (
          <div key={toast.id} className={`toast ${toast.type}`}>
            {toast.message}
          </div>
        ))}
      </div>
      {/* Sidebar */}
      <Sidebar userInfo={getUserInfo()}/>

      {/* Main Content */}
      <div className="main-content">
        <div className="content-wrapper">
          {/* Breadcrumb */}
          <div className="breadcrumb">
            <span 
              className="breadcrumb-link" 
              onClick={() => navigate('/admin-dashboard')}
            >
              Dashboard
            </span>
            <span className="breadcrumb-separator"> / </span>
            <span className="breadcrumb-current">Curriculum Management</span>
          </div>

          {/* Header */}
          <div className="headerr">
            <div>
              <h1 className="page-title">Curriculum Management</h1>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon blue">📚</div>
              <div className="stat-content">
                <h3>Total Programs</h3>
                <div className="stat-value">{programsList.length}</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon purple">📅</div>
              <div className="stat-content">
                <h3>Total Curricula</h3>
                <div className="stat-value">{curriculumData.length}</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon blue">📘</div>
              <div className="stat-content">
                <h3>Active Curricula</h3>
                <div className="stat-value">{activeCurricula}</div>
              </div>
            </div>
          </div>

          {/* Curriculum Content Wrapper with Sidebar */}
          <div className="curriculum-content-wrapper">
            {/* Program Sidebar */}
            <div className="curriculum-sidebar">
              <div className="curriculum-nav-section">
                <div className="curriculum-nav-header">
                  <h2 className="curriculum-nav-title">Programs</h2>
                </div>
                <div className="curriculum-nav-list">
                  <div
                    className={`curriculum-nav-item ${selectedProgramFilter === '' ? 'curriculum-nav-item-active' : ''}`}
                    onClick={() => setSelectedProgramFilter('')}
                  >
                    <span className="curriculum-nav-icon">📚</span>
                    All Programs
                    <span className="curriculum-nav-count">{curriculumData.length}</span>
                  </div>
                  {programsList.map((program) => (
                    <div
                      key={program.programID}
                      className={`curriculum-nav-item ${selectedProgramFilter === program.programID.toString() ? 'curriculum-nav-item-active' : ''}`}
                      onClick={() => setSelectedProgramFilter(program.programID.toString())}
                    >
                      <span className="curriculum-nav-icon">📚</span>
                      {program.programName}
                      <span className="curriculum-nav-count">{getProgramCurriculumCount(program.programID)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Main Curriculum Section */}
            <div className="curriculum-main-section">
              <div className="curriculum-section-header">
                <h2 className="curriculum-section-title">
                  {selectedProgramFilter ? 
                    `Curricula for ${programsList.find(p => p.programID.toString() === selectedProgramFilter)?.programName}` : 
                    'All Curricula'
                  }
                </h2>
                <p className="curriculum-section-desc">Manage curriculum records and information</p>
              </div>

              <div className="curriculum-section-content">
                <div className="curriculum-filters">
                  <div className="curriculum-search-group">
                    <input
                      type="text"
                      className="form-input curriculum-search-input"
                      placeholder="Search curricula by name, code..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <div className="curriculum-filter-actions">
                    <button 
                      className="btn-add-curriculum"
                      onClick={openModal}
                    >
                      + Add New Curriculum
                    </button>
                  </div>
                </div>

                <div className="curriculum-table-container">
                  <table className="curriculum-table">
                    <thead>
                      <tr>
                        <th>Curriculum</th>
                        <th>Program</th>
                        <th>Academic Year</th>
                        <th>Status</th>
                        <th>Students</th>
                        <th>Last Updated</th>
                        <th>Actions</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedData.map(curriculum => (
                        <React.Fragment key={curriculum.id}>
                          <tr 
                            className={`curriculum-row ${expandedCurricula.has(curriculum.id) ? 'expanded' : ''}`}
                            onClick={() => toggleCurriculumExpansion(curriculum.id)}
                          >
                            <td>
                              <div className="curriculum-name">
                                <div>
                                  <div>{curriculum.name}</div>
                                  <div className="curriculum-code">{curriculum.code}</div>
                                </div>
                              </div>
                            </td>
                            <td>{curriculum.program}</td>
                            <td>{curriculum.academicYear}</td>
                            <td>
                              <span className={`status-badge status-${curriculum.status.toLowerCase()}`}>
                                {curriculum.status}
                              </span>
                            </td>
                            <td>{studentCounts[curriculum.id] || 0}</td>
                            <td>{formatDate(curriculum.lastUpdated)}</td>
                            <td>
                              <div className="action-buttons">
                                <button 
                                  className="btn-action btn-edit" 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    editCurriculum(curriculum.id);
                                  }}
                                  title="Edit"
                                > 
                                ✏️             
                                </button>
                                <button 
                                  className="btn-action btn-delete" 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    deleteCurriculum(curriculum.id);
                                  }}
                                  title="Delete"
                                >   
                                🗑️                    
                                </button>
                              </div>
                            </td>
                            <td>
                              <span className="expand-icon">
                                {expandedCurricula.has(curriculum.id) ? '🔽' : '▶️'}
                              </span>
                            </td>
                          </tr>
                          {expandedCurricula.has(curriculum.id) && (
                            <tr className="curriculum-details-row">
                              <td colSpan="8">
                                <div className="curriculum-courses">
                                  <h4>Courses</h4>
                                  {curriculumCourses[curriculum.id] ? (
                                    curriculumCourses[curriculum.id].length > 0 ? (
                                      <div className="courses-grid">
                                        {curriculumCourses[curriculum.id].map(detail => (
                                          <div key={detail.curriculumDetailID} className="course-card">
                                            <div className="course-code">{detail.course.courseCode}</div>
                                            <div className="course-name">{detail.course.courseDescription}</div>
                                            <div className="course-meta">
                                              <span>Credits: {detail.course.credits}</span>
                                              <span>Year {detail.yearLevel}, Semester {detail.semester}</span>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    ) : (
                                      <p>No courses assigned to this curriculum.</p>
                                    )
                                  ) : (
                                    <div className="loading-courses">Loading courses...</div>
                                  )}
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      ))}
                    </tbody>
                  </table>

                  {filteredData.length === 0 && (
                    <div className="no-curricula">
                      <p>No curricula found matching your criteria.</p>
                    </div>
                  )}

                  {/* Pagination only if there is data */}
                  {filteredData.length > 0 && (
                    <div className="pagination">
                      <div className="pagination-info">
                        Showing {startIndex + 1} to {Math.min(endIndex, filteredData.length)} of {filteredData.length} entries
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
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="modal">
          <div className="modal-contentt">
            <div className="modal-header">
              <h2 className="modal-title">
                {editingId ? 'Edit Curriculum' : 'Create New Curriculum'}
              </h2>
              <span className="close" onClick={closeModal}>x</span>
            </div>
            
            <div className="modal-body">
              <div className="modal-body-grid">
                {/* Left Container - Basic Information */}
                <div className="modal-left-container">
                  <div className="form-group">
                    <label className="form-label">Curriculum Name *</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      name="curriculumName"
                      value={formData.curriculumName}
                      onChange={handleInputChange}
                      required 
                    />
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label">Program *</label>
                    <select 
                      className="form-select" 
                      name="programId"
                      value={formData.programId}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="">Select Program</option>
                      {programsList.map(program => (
                        <option key={program.programID} value={program.programID}>
                          {program.programName}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Auto Create Sections Feature */}
                  {formData.programId && (
                    <div className="form-group auto-create-sections-group">
                      <div className="auto-create-sections-header">
                        <label className="form-label auto-create-checkbox-label">
                          <span>Create Sections</span>
                          <input
                            type="checkbox"
                            name="autoCreateSections"
                            checked={formData.autoCreateSections}
                            onChange={handleInputChange}
                            className="auto-create-checkbox"
                          />
                        </label>
                      </div>
                      
                      {formData.autoCreateSections && (
                        <div className="auto-create-sections-content">
                          <div className="auto-create-sections-form">
                            <div className="auto-create-field">
                              <label className="form-label">Year Level *</label>
                              <select
                                name="autoCreateYear"
                                value={formData.autoCreateYear}
                                onChange={handleInputChange}
                                className="form-select"
                                required
                              >
                                <option value="">Select Year</option>
                                <option value="1">1st Year</option>
                                <option value="2">2nd Year</option>
                                <option value="3">3rd Year</option>
                                <option value="4">4th Year</option>
                              </select>
                            </div>
                            
                            <div className="auto-create-field">
                              <label className="form-label">Sections per Year *</label>
                              <select
                                name="sectionsPerYear"
                                value={formData.sectionsPerYear}
                                onChange={handleInputChange}
                                className="form-select"
                                required
                              >
                                <option value="">Select Number</option>
                                <option value="1">1 Section</option>
                                <option value="2">2 Sections</option>
                                <option value="3">3 Sections</option>
                                <option value="4">4 Sections</option>
                                <option value="5">5 Sections</option>
                              </select>
                            </div>
                          </div>
                          
                          {formData.autoCreateYear && formData.sectionsPerYear && (
                            <div className="sections-preview">
                              <h4>Sections to be created:</h4>
                              <div className="preview-sections">
                                {Array.from({ length: parseInt(formData.sectionsPerYear) }, (_, index) => (
                                  <span key={index} className="preview-section">
                                    {formData.autoCreateYear}-{index + 1}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="form-group">
                    <label className="form-label">Academic Year *</label>
                    <select 
                      className="form-select" 
                      name="academicYear"
                      value={formData.academicYear}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="">Select Academic Year</option>
                      <option value="2024-2025">2024-2025</option>
                      <option value="2025-2026">2025-2026</option>
                      <option value="2026-2027">2026-2027</option>
                      <option value="2027-2028">2027-2028</option>
                    </select>
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label">Status *</label>
                    <select 
                      className="form-select" 
                      name="status"
                      value={formData.status}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="">Select Status</option>
                      <option value="Active">Active</option>
                      <option value="Draft">Draft</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label">Description</label>
                    <textarea 
                      className="form-textarea" 
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      rows="4"
                      placeholder="Enter curriculum description..."
                    />
                  </div>
                </div>

                {/* Right Container - Available Courses */}
                <div className="modal-right-container">
                  {formData.programId && (
                    <div className="form-group">
                      <div className="courses-header">
                        <label className="form-label">Available Courses</label>
                        <input
                          type="text"
                          placeholder="Search courses..."
                          value={courseSearchTerm}
                          onChange={(e) => setCourseSearchTerm(e.target.value)}
                          className="form-input courses-search"
                        />
                      </div>
                      
                      <div className="semester-tabs">
                        <div className="tab-headers">
                          <button 
                            type="button"
                            className={`tab-header ${formData.activeSemesterTab === '1' ? 'active' : ''}`}
                            onClick={() => setFormData(prev => ({ ...prev, activeSemesterTab: '1' }))}
                          >
                            1st Semester
                          </button>
                          <button 
                            type="button"
                            className={`tab-header ${formData.activeSemesterTab === '2' ? 'active' : ''}`}
                            onClick={() => setFormData(prev => ({ ...prev, activeSemesterTab: '2' }))}
                          >
                            2nd Semester
                          </button>
                          <button 
                            type="button"
                            className={`tab-header ${formData.activeSemesterTab === 'Summer' ? 'active' : ''}`}
                            onClick={() => setFormData(prev => ({ ...prev, activeSemesterTab: 'Summer' }))}
                          >
                            Summer
                          </button>
                        </div>
                        
                        <div className="tab-content">
                          <div className="courses-semester-section">
                            <div className="courses-grid-semester">
                              {filteredAvailableCourses
                                .filter(course => {
                                  const courseSemester = formData.courseSemesters[course.id] || "1";
                                  return courseSemester === formData.activeSemesterTab;
                                })
                                .map(course => (
                                  <div key={course.id} className="course-card-selection">
                                    <div className="course-card-header">
                                      <input
                                        type="checkbox"
                                        checked={formData.selectedCourses.includes(course.id)}
                                        onChange={() => handleCourseSelection(course.id)}
                                        className="course-checkbox"
                                      />
                                      <div className="course-card-info">
                                        <div className="course-code-checkbox-container">
                                          <div className="course-code-selection">{course.courseCode}</div>
                                          <div className="course-credits">({course.credits} credits)</div>
                                      </div>
                                      <div className="course-name-selection">{course.courseDescription}</div>
                                    </div>
                                  </div>
                                    
                                    {formData.selectedCourses.includes(course.id) && (
                                      <div className="course-details-inline">
                                        <div className="course-detail-group-inline">
                                          <label className="detail-label-inline">Year:</label>
                                          <select
                                            value={formData.courseYearLevels[course.id] || 1}
                                            onChange={(e) => handleCourseYearChange(course.id, e.target.value)}
                                            className="detail-select-inline"
                                          >
                                            <option value={1}>1</option>
                                            <option value={2}>2</option>
                                            <option value={3}>3</option>
                                            <option value={4}>4</option>
                                          </select>
                                        </div>
                                        <div className="course-detail-group-inline">
                                          <label className="detail-label-inline">Semester:</label>
                                          <select
                                            value={formData.courseSemesters[course.id] || "1"}
                                            onChange={(e) => handleCourseSemesterChange(course.id, e.target.value)}
                                            className="detail-select-inline"
                                          >
                                            <option value="1">1st</option>
                                            <option value="2">2nd</option>
                                            <option value="Summer">Summer</option>
                                          </select>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                ))}
                            </div>
                            
                            {filteredAvailableCourses.filter(course => {
                              const courseSemester = formData.courseSemesters[course.id] || "1";
                              return courseSemester === formData.activeSemesterTab;
                            }).length === 0 && (
                              <div className="no-courses-semester">
                                <p>No courses assigned to {formData.activeSemesterTab === '1' ? '1st' : formData.activeSemesterTab === '2' ? '2nd' : 'Summer'} semester.</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {availableCourses.length > 0 && filteredAvailableCourses.length === 0 && (
                         <p className="no-courses">No courses match your search.</p>
                      )}
                      {availableCourses.length === 0 && (
                        <p className="no-courses">No courses available for this program.</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="modal-footer">
              <button type="button" className="btn-secondary" onClick={closeModal}>
                Cancel
              </button>
              <button type="button" className="btn-primary" onClick={saveCurriculum}>
                {editingId ? 'Update Curriculum' : 'Save Curriculum'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CurriculumManagement;