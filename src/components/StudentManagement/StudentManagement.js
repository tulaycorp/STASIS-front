import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './StudentManagement.css';
import Sidebar from '../Sidebar';
import { useAdminData } from '../../hooks/useAdminData';
import { studentAPI, programAPI, courseSectionAPI, curriculumAPI, testConnection } from '../../services/api';
import Loading from '../Loading';

const StudentManagement = () => {
  const { getUserInfo } = useAdminData();
  const navigate = useNavigate();
  const [studentsData, setStudentsData] = useState([]);
  const [programsList, setProgramsList] = useState([]);
  const [sectionsList, setSectionsList] = useState([]);
  const [curriculumsList, setCurriculumsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [showEditStudentModal, setShowEditStudentModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSection, setSelectedSection] = useState('All Sections');
  const [selectedProgram, setSelectedProgram] = useState('All Programs');
  const [selectedProgramSections, setSelectedProgramSections] = useState([]);
  const [selectedYear, setSelectedYear] = useState('All Years');
  const [availableYears, setAvailableYears] = useState([]);
  const [selectionMode, setSelectionMode] = useState('individual'); // 'individual' or 'year'
  const [filter, setFilter] = useState({ type: 'all', value: 'All' });
  const [editingStudent, setEditingStudent] = useState(null);
  const [availableSectionsForStudent, setAvailableSectionsForStudent] = useState([]);
  const [availableCurriculums, setAvailableCurriculums] = useState([]);
  const [showAddSectionModal, setShowAddSectionModal] = useState(false);
  const [sectionForm, setSectionForm] = useState({
    sectionName: '',
    programId: ''
  });
  const [showDeleteSectionModal, setShowDeleteSectionModal] = useState(false);
  const [deleteSectionForm, setDeleteSectionForm] = useState({
    programId: '',
    sectionId: ''
  });
  const [availableSectionsForDelete, setAvailableSectionsForDelete] = useState([]);
  const [showDeleteStudentModal, setShowDeleteStudentModal] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState(null); 
  const [deleteStudentError, setDeleteStudentError] = useState('');

  const [studentForm, setStudentForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    dateOfBirth: '',
    year_level: 1,
    programId: '',
    sectionId: '',
    curriculumId: ''
  });

  const studentFormInitialState = { 
    firstName: '',
    lastName: '',
    email: '',
    dateOfBirth: '',
    year_level: 1,
    programId: '',
    sectionId: '',
    curriculumId: ''
  };

  const [showCredentialsModal, setShowCredentialsModal] = useState(false);
  const [generatedCredentials, setGeneratedCredentials] = useState(null);
  const [toasts, setToasts] = useState([]);
  
  // Multi-select state
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [showMultiEditModal, setShowMultiEditModal] = useState(false);
  const [showMultiDeleteModal, setShowMultiDeleteModal] = useState(false);
  const [showMultiPromoteModal, setShowMultiPromoteModal] = useState(false);
  
  // Multi-edit form state
  const [multiEditForm, setMultiEditForm] = useState({
    programId: '',
    sectionId: '',
    year_level: '',
    curriculumId: ''
  });


  // Toast notification function
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

      // Load students and programs in parallel
      const [studentsResponse, programsResponse, sectionsResponse, curriculumResponse] = await Promise.all([
        studentAPI.getAllStudents(),
        programAPI.getAllPrograms(),
        courseSectionAPI.getAllSections(),
        curriculumAPI.getAllCurriculums()
      ]);

      setStudentsData(studentsResponse.data);
      setProgramsList(programsResponse.data);
      setSectionsList(sectionsResponse.data);
      setCurriculumsList(curriculumResponse.data);

      // Extract available years from students data
      const years = [...new Set(studentsResponse.data.map(student => student.year_level).filter(year => year !== null && year !== undefined))].sort((a, b) => a - b);
      setAvailableYears(years);

      // Set default selected program if programs exist
      if (programsResponse.data.length > 0) {
        setSelectedProgram('All Programs');
      }

    } catch (err) {
      console.error('Error loading data:', err);
      handleConnectionError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleConnectionError = (err) => {
    if (err.code === 'ERR_NETWORK' || err.message.includes('Network Error')) {
      setError('Cannot connect to server. Please check if the backend is running on http://localhost:8080');
    } else if (err.code === 'ECONNREFUSED') {
      setError('Connection refused. The backend server is not running.');
    } else if (err.response?.status === 404) {
      setError('API endpoint not found. Please check if the server is properly configured.');
    } else if (err.response?.status === 500) {
      setError('Server error. Please check the backend console for error details.');
    } else {
      setError(`Failed to load data: ${err.message}`);
    }
  };

  // Enhanced filtering logic that supports program, individual and year-based selection
  const filteredStudents = studentsData.filter(student => {
    const studentName = `${student.firstName || ''} ${student.lastName || ''}`.toLowerCase();
    const matchesSearch = studentName.includes(searchTerm.toLowerCase()) ||
                         student.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         student.username?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filter.type === 'all' || 
                         (filter.type === 'program' && student.program?.programName === filter.value) ||
                         (filter.type === 'section' && student.section?.sectionName === filter.value) ||
                         (filter.type === 'year' && student.year_level?.toString() === filter.value);

    // Program-based filtering
    let matchesProgram = true;
    if (selectedProgram !== 'All Programs') {
      matchesProgram = student.program?.programName === selectedProgram;
    }

    // Enhanced section/year filtering
    let matchesSelection = true;
    
    if (selectionMode === 'year' && selectedYear !== 'All Years') {
      // Year-based filtering: show all students for the selected year
      matchesSelection = student.year_level === selectedYear;
    } else if (selectionMode === 'individual' && selectedSection !== 'All Sections') {
      // Individual section filtering
      matchesSelection = student.section?.sectionName === selectedSection ||
        student.sectionName === selectedSection;
    }
    // If "All Sections" and "All Years" are selected, show everything (matchesSelection remains true)
    
    return matchesSearch && matchesFilter && matchesProgram && matchesSelection;
  });

  // Student Modal functions
   const showAddStudentForm = () => {
    setStudentForm(studentFormInitialState); 
    setShowAddStudentModal(true);
  };


  const closeAddStudentModal = () => {
    setShowAddStudentModal(false);
    setStudentForm(studentFormInitialState);
  };

  const showEditStudentForm = (student) => {
  setEditingStudent(student);

  // Filter available curriculums and sections for the student's program when modal opens
  const programId = student.program?.programID?.toString() || '';
  
  if (programId) {
      // Set available curriculums
      const programCurriculums = curriculumsList.filter(c => c.program?.programID?.toString() === programId);
      setAvailableCurriculums(programCurriculums);
      
      // ✅ ADD THIS: Set available sections for the student's program
      const programSections = sectionsList.filter(section =>
        section.program?.programID?.toString() === programId ||
        section.programId?.toString() === programId
      );
      setAvailableSectionsForStudent(programSections);
  } else {
      setAvailableCurriculums([]);
      setAvailableSectionsForStudent([]); // ✅ ADD THIS: Reset sections when no program
  }

  setStudentForm({
    firstName: student.firstName || '',
    lastName: student.lastName || '',
    email: student.email || '',
    dateOfBirth: student.dateOfBirth || '',
    year_level: student.year_level || 1,
    programId: programId,
    sectionId: student.section?.sectionID?.toString() || '',
    curriculumId: student.curriculum?.curriculumID?.toString() || '' 
  });
  setShowEditStudentModal(true);
};

  const closeEditStudentModal = () => {
    setShowEditStudentModal(false);
    setEditingStudent(null);
    setStudentForm(studentFormInitialState); 
  };

  const showAddSectionForm = () => {
    setSectionForm({
      sectionName: '',
      programId: ''
    });
    setShowAddSectionModal(true);
  };

  const closeAddSectionModal = () => {
    setShowAddSectionModal(false);
    setSectionForm({
      sectionName: '',
      programId: ''
    });
  };

  const handleSectionFormChange = (field, value) => {
    setSectionForm(prev => ({
      ...prev,
      [field]: value
    }));
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

  // Updated handleAddSection to use API with duplicate detection
  const handleAddSection = async () => {
    // Validate required fields
    if (!sectionForm.sectionName || !sectionForm.programId) {
      showToast('Please fill in all required fields', 'error');
      return;
    }

    try {
      const selectedProgramObj = programsList.find(
        (p) => p.programID.toString() === sectionForm.programId
      );

      // Add a check in case the program isn't found (unlikely but good practice)
      if (!selectedProgramObj) {
        showToast('Could not find the selected program. Please refresh and try again.', 'error');
        return;
      }

      // Generate section name in format "year-section" (e.g., "1-2")
      const generatedSectionName = `${sectionForm.yearLevel}-${sectionForm.sectionNumber}`;

      // Check if section already exists
      const sectionExists = await checkSectionExists(selectedProgramObj, generatedSectionName);
      
      if (sectionExists) {
        showToast(`Section ${generatedSectionName} already exists for ${selectedProgramObj.programName}. Please choose a different section number.`, 'error');
        return;
      }

      const sectionData = {
        sectionName: sectionForm.sectionName,
        program: selectedProgramObj,
        status: 'ACTIVE',
      };

      console.log("Sending this data to create section:", sectionData);
      await courseSectionAPI.createSection(sectionData);

      showToast('Section added successfully!', 'success');
      closeAddSectionModal(); // Close the modal
      loadInitialData();     // Reload all data to show the new section in the list

    } catch (error) {
      console.error('Error adding section:', error);
      if (error.response?.status === 409) { // 409 Conflict
        showToast('A section with this name already exists for the selected program.', 'error');
      } else if (error.response?.data?.message) {
        showToast(`Failed to add section: ${error.response.data.message}`, 'error');
      }
      else {
        showToast('Failed to add section. Please check the console for details.', 'error');
      }
    }
  };

  const handleStudentFormChange = (field, value) => {
    setStudentForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const showDeleteSectionForm = () => {
    setDeleteSectionForm({
      programId: '',
      sectionId: ''
    });
    setAvailableSectionsForDelete([]);
    setShowDeleteSectionModal(true);
  };

  const closeDeleteSectionModal = () => {
    setShowDeleteSectionModal(false);
    setDeleteSectionForm({
      programId: '',
      sectionId: ''
    });
    setAvailableSectionsForDelete([]);
  };

  const handleDeleteSectionFormChange = (field, value) => {
    setDeleteSectionForm(prev => ({
      ...prev,
      [field]: value
    }));

    // When program is selected, filter sections for that program
    if (field === 'programId') {
      // Filter sections for the selected program
      const sectionsForProgram = sectionsList.filter(section =>
        section.program?.programID?.toString() === value ||
        section.programId?.toString() === value
      );

      setAvailableSectionsForDelete(sectionsForProgram);

      // Reset section selection when program changes
      setDeleteSectionForm(prev => ({
        ...prev,
        programId: value,
        sectionId: ''
      }));
    }
  };

  // Updated handleDeleteSection to use API only
  const handleDeleteSection = async () => {
    if (!deleteSectionForm.sectionId) {
      showToast('Please select a section to delete', 'error');
      return;
    }

    if (window.confirm('Are you sure you want to delete this section? This action cannot be undone.')) {
      try {
        // Call API to delete section
        await courseSectionAPI.deleteSection(deleteSectionForm.sectionId);

        showToast('Section deleted successfully!', 'success');
        closeDeleteSectionModal();

        // Reload data to get the updated sections list
        loadInitialData();

      } catch (error) {
        console.error('Error deleting section:', error);
        if (error.response?.status === 404) {
          showToast('Section not found!', 'error');
        } else if (error.response?.status === 400) {
          showToast('Cannot delete section. It may have associated students.', 'error');
        } else {
          showToast('Failed to delete section. Please try again.', 'error');
        }
      }
    }
  };

  const handleAddStudent = async () => {
    // Validate required fields
    if (!studentForm.firstName || !studentForm.lastName || !studentForm.email || !studentForm.programId || !studentForm.curriculumId) {
      showToast('Please fill in all required fields', 'error');
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(studentForm.email)) {
      showToast('Please enter a valid email address', 'error');
      return;
    }

    try {
      // Find the selected program object
      const selectedProgramObj = programsList.find(p => p.programID.toString() === studentForm.programId);
      const selectedSectionObj = sectionsList.find(s => s.sectionID.toString() === studentForm.sectionId);
      const selectedCurriculumObj = curriculumsList.find(c => c.curriculumID.toString() === studentForm.curriculumId);

      const studentData = {
        firstName: studentForm.firstName,
        lastName: studentForm.lastName,
        email: studentForm.email,
        dateOfBirth: studentForm.dateOfBirth,
        year_level: parseInt(studentForm.year_level),
        program: selectedProgramObj || null,
        section: selectedSectionObj || null,
        curriculum: selectedCurriculumObj || null
      };

      // Await the API call and expect credentials in response
      const response = await studentAPI.createStudent(studentData);

      // If credentials are returned, show modal
      if (response.data && response.data.username && response.data.password) {
        setGeneratedCredentials({
          username: response.data.username,
          password: response.data.password
        });
        setShowCredentialsModal(true);
      } else {
        showToast('Student added successfully!', 'success');
      }

      closeAddStudentModal();
      loadInitialData(); // Reload student list
    } catch (error) {
      console.error('Error adding student:', error);
      if (error.response?.status === 400) {
        showToast('Email already exists or invalid data provided!', 'error');
      } else {
        showToast('Failed to add student. Please try again.', 'error');
      }
    }
  };

  const handleStudentProgramChange = (programId) => {
    handleStudentFormChange('programId', programId);
    handleStudentFormChange('sectionId', ''); // Reset section
    handleStudentFormChange('curriculumId', ''); // Reset curriculum

    // Filter sections for the selected program
    const programSections = sectionsList.filter(section =>
      section.program?.programID?.toString() === programId ||
      section.programId?.toString() === programId
    );
    setAvailableSectionsForStudent(programSections);

    const programCurriculums = curriculumsList.filter(curriculum => 
      curriculum.program?.programID?.toString() === programId
    );
    setAvailableCurriculums(programCurriculums);
  };


  const handleUpdateStudent = async () => {
    // Validate required fields
    if (!studentForm.firstName || !studentForm.lastName || !studentForm.email || !studentForm.programId || !studentForm.curriculumId) {
      showToast('Please fill in all required fields', 'error');
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(studentForm.email)) {
      showToast('Please enter a valid email address', 'error');
      return;
    }

    try {
      // Find the selected program object
      const selectedProgramObj = programsList.find(p => p.programID.toString() === studentForm.programId);
      const selectedSectionObj = sectionsList.find(s => s.sectionID.toString() === studentForm.sectionId);
      const selectedCurriculumObj = curriculumsList.find(c => c.curriculumID.toString() === studentForm.curriculumId);

      const studentData = {
        firstName: studentForm.firstName,
        lastName: studentForm.lastName,
        email: studentForm.email,
        dateOfBirth: studentForm.dateOfBirth,
        year_level: parseInt(studentForm.year_level),
        program: selectedProgramObj || null,
        section: selectedSectionObj || null,
        curriculum: selectedCurriculumObj || null
      };

      await studentAPI.updateStudent(editingStudent.id, studentData);
      showToast('Student updated successfully!', 'success');
      closeEditStudentModal();
      loadInitialData(); // Reload student list
    } catch (error) {
      console.error('Error updating student:', error);
      if (error.response?.status === 400) {
        // Check if the error message contains specific text
        const errorMessage = error.response?.data || 'Invalid data provided';
        if (typeof errorMessage === 'string' && errorMessage.includes('Email already exists')) {
          showToast('This email address is already in use by another student or faculty member.', 'error');
        } else {
          showToast('Invalid data provided. Please check your input.', 'error');
        }
      } else if (error.response?.status === 404) {
        showToast('Student not found!', 'error');
      } else {
        showToast('Failed to update student. Please try again.', 'error');
      }
    }
  };

  const openDeleteStudentModal = (student) => {
    setStudentToDelete(student); // Store the entire student object
    setDeleteStudentError('');   // Clear any previous errors
    setShowDeleteStudentModal(true); // Show the modal
  };

  const closeDeleteStudentModal = () => {
    setShowDeleteStudentModal(false);
    setStudentToDelete(null);
    setDeleteStudentError('');
  };

  const handleDeleteStudent = async () => {
    if (!studentToDelete) return; // Safety check

    try {
      // Use the ID from the stored student object
      await studentAPI.deleteStudent(studentToDelete.id);

      // Emit user deletion event for AdminTools to listen
      const deletionEvent = new CustomEvent('userDeleted', {
        detail: {
          userId: studentToDelete.id,
          userType: 'student',
          userName: `${studentToDelete.firstName} ${studentToDelete.lastName}`,
          timestamp: new Date().toISOString()
        }
      });
      window.dispatchEvent(deletionEvent);

      showToast('Student deleted successfully!', 'success');
      loadInitialData(); // Refresh the student list
      closeDeleteStudentModal(); // Close the modal on success
    } catch (error) {
      console.error('Error deleting student:', error);
      // Create a user-friendly error message
      const errorMessage = error.response?.status === 404
        ? 'Student not found. They may have already been deleted.'
        : 'Failed to delete student. Please try again.';
    
      setDeleteStudentError(errorMessage); // Display the error inside the modal
      showToast(errorMessage, 'error');    // Also show a toast notification
    }
  };

  const handlePromoteStudent = async (studentId) => {
    if (window.confirm('Are you sure you want to promote this student to the next year level?')) {
      try {
        await studentAPI.promoteStudent(studentId);
        showToast('Student promoted successfully!', 'success');
        loadInitialData(); // Reload student list
      } catch (error) {
        console.error('Error promoting student:', error);
        if (error.response?.status === 404) {
          showToast('Student not found!', 'error');
        } else {
          showToast('Failed to promote student. Please try again.', 'error');
        }
      }
    }
  };

  // Handle program selection
  const handleProgramSelect = (programName) => {
    setSelectedProgram(programName);
    // Reset selections when changing programs
    setSelectedSection('All Sections');
    setSelectedYear('All Years');
    setSelectionMode('individual');

    if (programName === 'All Programs') {
      // When "All Programs" is selected, we don't need to filter sections by program
      setSelectedProgramSections([]);
    } else {
      // Filter sections for the selected program
      const programSections = sectionsList.filter(section =>
        section.programName === programName ||
        section.program?.programName === programName
      );
      // Sort sections in ascending order
      const sortedProgramSections = programSections.sort((a, b) => {
        const sectionA = a.sectionName || '';
        const sectionB = b.sectionName || '';
        return sectionA.localeCompare(sectionB, undefined, { numeric: true, sensitivity: 'base' });
      });
      setSelectedProgramSections(sortedProgramSections);
    }
  };

  // Handle section selection
  const handleSectionSelect = (sectionName, sectionObj = null) => {
    setSelectedSection(sectionName);
    setSelectedYear('All Years'); // Reset year when selecting individual section
    setSelectionMode('individual');

    // If a specific section is selected while "All Programs" is active,
    // automatically filter to show only the program that has this section
    if (selectedProgram === 'All Programs' && sectionName !== 'All Sections' && sectionObj) {
      if (sectionObj.program?.programName) {
        setSelectedProgram(sectionObj.program.programName);
        // Filter sections for the selected program
        const programSections = sectionsList.filter(section =>
          section.programName === sectionObj.program.programName ||
          section.program?.programName === sectionObj.program.programName
        );
        const sortedProgramSections = programSections.sort((a, b) => {
          const sectionA = a.sectionName || '';
          const sectionB = b.sectionName || '';
          return sectionA.localeCompare(sectionB, undefined, { numeric: true, sensitivity: 'base' });
        });
        setSelectedProgramSections(sortedProgramSections);
      }
    }
  };

  // Handle year selection
  const handleYearSelect = (year) => {
    setSelectedYear(year);
    setSelectedSection('All Sections'); // Reset individual section when selecting year
    setSelectionMode('year');
  };

  // Get unique values from studentsData for dynamic filters
  const getUniquePrograms = () => {
    return [...new Set(studentsData.map(s => s.program?.programName).filter(Boolean))];
  };

  const getUniqueSections = () => {
    return [...new Set(studentsData.map(s => s.section?.sectionName).filter(Boolean))];
  };

  const getUniqueYears = () => {
    return [...new Set(studentsData.map(s => s.year_level).filter(Boolean))].sort((a, b) => a - b);
  };

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10; // Adjust as needed

  // Calculate pagination
  const totalPages = Math.ceil(filteredStudents.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedStudents = filteredStudents.slice(startIndex, endIndex);

  // Pagination handlers
  const goToPage = (page) => {
    setCurrentPage(page);
  };

  const previousPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const nextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  // Reset to first page when search/program/section changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedProgram, selectedSection]);

  // Multi-select functions
  const handleSelectStudent = (studentId) => {
    setSelectedStudents(prev => {
      if (prev.includes(studentId)) {
        return prev.filter(id => id !== studentId);
      } else {
        return [...prev, studentId];
      }
    });
  };

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedStudents([]);
      setSelectAll(false);
    } else {
      const allStudentIds = paginatedStudents.map(student => student.id);
      setSelectedStudents(allStudentIds);
      setSelectAll(true);
    }
  };

  const clearSelection = () => {
    setSelectedStudents([]);
    setSelectAll(false);
  };

  // Update selectAll state when individual selections change
  useEffect(() => {
    if (paginatedStudents.length > 0) {
      const allSelected = paginatedStudents.every(student => selectedStudents.includes(student.id));
      setSelectAll(allSelected);
    }
  }, [selectedStudents, paginatedStudents]);

  // Multi-operation functions
  const showMultiEditForm = () => {
    setMultiEditForm({
      programId: '',
      sectionId: '',
      year_level: '',
      curriculumId: ''
    });
    setAvailableSectionsForStudent([]);
    setAvailableCurriculums([]);
    setShowMultiEditModal(true);
  };

  const closeMultiEditModal = () => {
    setShowMultiEditModal(false);
    setMultiEditForm({
      programId: '',
      sectionId: '',
      year_level: '',
      curriculumId: ''
    });
    setAvailableSectionsForStudent([]);
    setAvailableCurriculums([]);
  };

  const handleMultiEditFormChange = (field, value) => {
    setMultiEditForm(prev => ({
      ...prev,
      [field]: value
    }));

    // Handle program change for multi-edit
    if (field === 'programId') {
      setMultiEditForm(prev => ({
        ...prev,
        sectionId: '',
        curriculumId: ''
      }));

      if (value) {
        const programSections = sectionsList.filter(section =>
          section.program?.programID?.toString() === value ||
          section.programId?.toString() === value
        );
        setAvailableSectionsForStudent(programSections);

        const programCurriculums = curriculumsList.filter(curriculum => 
          curriculum.program?.programID?.toString() === value
        );
        setAvailableCurriculums(programCurriculums);
      } else {
        setAvailableSectionsForStudent([]);
        setAvailableCurriculums([]);
      }
    }
  };

  const handleMultiEdit = async () => {
    if (selectedStudents.length === 0) {
      showToast('No students selected', 'error');
      return;
    }

    // Validate that at least one field is selected for update
    const hasUpdates = multiEditForm.programId || multiEditForm.sectionId || 
                      multiEditForm.year_level || multiEditForm.curriculumId;
    
    if (!hasUpdates) {
      showToast('Please select at least one field to update', 'error');
      return;
    }

    if (window.confirm(`Are you sure you want to update ${selectedStudents.length} student(s)?`)) {
      try {
        let successCount = 0;
        let errorCount = 0;

        for (const studentId of selectedStudents) {
          try {
            const student = studentsData.find(s => s.id === studentId);
            if (!student) continue;

            // Build update data with only changed fields
            const updateData = {};
            
            if (multiEditForm.programId) {
              const selectedProgramObj = programsList.find(p => p.programID.toString() === multiEditForm.programId);
              updateData.program = selectedProgramObj;
            } else {
              updateData.program = student.program;
            }

            if (multiEditForm.sectionId) {
              const selectedSectionObj = sectionsList.find(s => s.sectionID.toString() === multiEditForm.sectionId);
              updateData.section = selectedSectionObj;
            } else {
              updateData.section = student.section;
            }

            if (multiEditForm.curriculumId) {
              const selectedCurriculumObj = curriculumsList.find(c => c.curriculumID.toString() === multiEditForm.curriculumId);
              updateData.curriculum = selectedCurriculumObj;
            } else {
              updateData.curriculum = student.curriculum;
            }

            // Keep existing data for unchanged fields
            updateData.firstName = student.firstName;
            updateData.lastName = student.lastName;
            updateData.email = student.email;
            updateData.dateOfBirth = student.dateOfBirth;
            updateData.year_level = multiEditForm.year_level ? parseInt(multiEditForm.year_level) : student.year_level;

            await studentAPI.updateStudent(studentId, updateData);
            successCount++;
          } catch (error) {
            console.error(`Error updating student ${studentId}:`, error);
            errorCount++;
          }
        }

        if (successCount > 0) {
          showToast(`Successfully updated ${successCount} student(s)`, 'success');
        }
        if (errorCount > 0) {
          showToast(`Failed to update ${errorCount} student(s)`, 'error');
        }

        closeMultiEditModal();
        clearSelection();
        loadInitialData();
      } catch (error) {
        console.error('Error in multi-edit:', error);
        showToast('Failed to update students', 'error');
      }
    }
  };

  const handleMultiDelete = async () => {
    if (selectedStudents.length === 0) {
      showToast('No students selected', 'error');
      return;
    }

    if (window.confirm(`Are you sure you want to delete ${selectedStudents.length} student(s)? This action cannot be undone.`)) {
      try {
        let successCount = 0;
        let errorCount = 0;

        for (const studentId of selectedStudents) {
          try {
            await studentAPI.deleteStudent(studentId);
            successCount++;
          } catch (error) {
            console.error(`Error deleting student ${studentId}:`, error);
            errorCount++;
          }
        }

        if (successCount > 0) {
          showToast(`Successfully deleted ${successCount} student(s)`, 'success');
        }
        if (errorCount > 0) {
          showToast(`Failed to delete ${errorCount} student(s)`, 'error');
        }

        setShowMultiDeleteModal(false);
        clearSelection();
        loadInitialData();
      } catch (error) {
        console.error('Error in multi-delete:', error);
        showToast('Failed to delete students', 'error');
      }
    }
  };

  const handleMultiPromote = async () => {
    if (selectedStudents.length === 0) {
      showToast('No students selected', 'error');
      return;
    }

    if (window.confirm(`Are you sure you want to promote ${selectedStudents.length} student(s) to the next year level?`)) {
      try {
        let successCount = 0;
        let errorCount = 0;

        for (const studentId of selectedStudents) {
          try {
            await studentAPI.promoteStudent(studentId);
            successCount++;
          } catch (error) {
            console.error(`Error promoting student ${studentId}:`, error);
            errorCount++;
          }
        }

        if (successCount > 0) {
          showToast(`Successfully promoted ${successCount} student(s)`, 'success');
        }
        if (errorCount > 0) {
          showToast(`Failed to promote ${errorCount} student(s)`, 'error');
        }

        setShowMultiPromoteModal(false);
        clearSelection();
        loadInitialData();
      } catch (error) {
        console.error('Error in multi-promote:', error);
        showToast('Failed to promote students', 'error');
      }
    }
  };

  // Show loading state
  if (loading) {
    return (
      <div className="dashboard-container">
        <Sidebar userInfo={getUserInfo()}/>
        <div className="main-content">
          <div className="content-wrapper">
            <Loading message="Loading students..." />
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
            <div style={
              { padding: '2rem', textAlign: 'center' }}>
              <div className="error-container">
                <h3>Connection Error</h3>
                <p style={
                  { whiteSpace: 'pre-line', margin: '1rem 0' }}>{error}</p>
                <div style={
                  { marginTop: '1rem' }}>
                  <h4>Troubleshooting Steps:</h4>
                  <ol style={
                    { textAlign: 'left', maxWidth: '500px', margin: '0 auto' }}>
                    <li>Check if Spring Boot is running: <code>http://localhost:8080</code></li>
                    <li>Check browser console for additional errors</li>
                    <li>Verify backend logs for any startup errors</li>
                    <li>Try accessing the API directly: <code>http://localhost:8080/api/students</code></li>
                  </ol>
                </div>
                <div style={
                  { display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '1rem' }}>
                  <button onClick={loadInitialData}
                    className="btn btn-primary">
                    Retry Connection
                  </button>
                  <button onClick={
                    () => window.open('http://localhost:8080/api/students', '_blank')}
                    className="btn btn-secondary">
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

  return (
    <div className="dashboard-container">
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
            <span className="breadcrumb-current">Student Management</span>
          </div>

          <div className="dashboard-header">
            <h1 className="dashboard-welcome-title">Student Management</h1>
            {selectedProgram && selectedProgram !== 'All Programs' && (
              <div className="program-indicator">{selectedProgram}</div>
            )}
          </div>

          <div className="student-content-wrapper">
          <div className="student-sidebar">
            {/* Program Navigation Card */}
            <div className="student-nav-section">
              <div className="student-nav-header">
                <h2 className="student-nav-title">Programs</h2>
              </div>
              <div className="student-nav-list">
                <div
                  className={`student-nav-item ${selectedProgram === 'All Programs' ? 'student-nav-item-active' : ''}`}
                  onClick={() => handleProgramSelect('All Programs')}
                >
                  <span className="student-nav-icon">📚</span>
                  All Programs
                </div>
                {programsList.map((program) => (
                  <div
                    key={program.programID}
                    className={`student-nav-item ${selectedProgram === program.programName ? 'student-nav-item-active' : ''}`}
                    onClick={() => handleProgramSelect(program.programName)}
                  >
                    <span className="student-nav-icon">📚</span>
                    {program.programName}
                  </div>
                ))}
              </div>
            </div>

            {/* Year Level Navigation Card */}
            <div className="student-nav-section">
              <div className="student-nav-header">
                <h2 className="student-nav-title">Year Levels</h2>
              </div>
              <div className="student-nav-list">
                <div
                  className={`student-nav-item ${selectedYear === 'All Years' ? 'student-nav-item-active' : ''}`}
                  onClick={() => handleYearSelect('All Years')}
                >
                  <span className="student-nav-icon">🎓</span>
                  All Years
                </div>
                {availableYears.map((year) => (
                  <div
                    key={year}
                    className={`student-nav-item ${selectedYear === year ? 'student-nav-item-active' : ''}`}
                    onClick={() => handleYearSelect(year)}
                  >
                    <span className="student-nav-icon">🎓</span>
                    Year {year}
                  </div>
                ))}
                
              </div>
            </div>

            <div className="student-nav-section">
              <div className="student-nav-header">
                <h2 className="student-nav-title">Sections</h2>
              </div>
              <div className="student-nav-list">
                <div
                  className={`student-nav-item ${selectedSection === 'All Sections' ? 'student-nav-item-active' : ''}`}
                  onClick={() => handleSectionSelect('All Sections')}
                >
                  <span className="student-nav-icon">📋</span>
                  All Sections
                </div>

                {(selectedProgram === 'All Programs' 
                  ? [...sectionsList].sort((a, b) => {
                      const sectionA = a.sectionName || '';
                      const sectionB = b.sectionName || '';
                      return sectionA.localeCompare(sectionB, undefined, { numeric: true, sensitivity: 'base' });
                    })
                  : selectedProgramSections
                ).map((section) => {
                  // Create unique key combining section name and program
                  const uniqueKey = `${section.sectionID}-${section.program?.programID || 'no-program'}`;
                  const displayName = selectedProgram === 'All Programs' 
                    ? `${section.sectionName} (${section.program?.programName || 'No Program'})`
                    : section.sectionName;
                  
                  return (
                    <div
                      key={uniqueKey}
                      className={`student-nav-item ${selectedSection === section.sectionName ? 'student-nav-item-active' : ''}`}
                      onClick={() => handleSectionSelect(section.sectionName, section)}
                    >
                      <span className="student-nav-icon">📋</span>
                      <span className="section-name-text">{displayName}</span>
                    </div>
                  );
                })}
              </div>
              {/* Add Section Button */}
              <div className="add-section-container">
                <button className="btn-add-section" onClick={showAddSectionForm}>
                  Add New Section
                </button>
                <button className="btn-delete-section" onClick={showDeleteSectionForm}>
                  Delete Section
                </button>
              </div>
            </div>
          </div>

            {/* Main Student Management Section */}
            <div className="student-main-section">
              <div className="student-section-header">
                <h2 className="student-section-title">Students</h2>
                <p className="student-section-desc">Manage student records and information</p>
              </div>

              <div className="student-section-content">
                <div className="student-filters">
                  <div className="student-search-group">
                    <input
                      type="text"
                      className="form-input student-search-input"
                      placeholder="Search students by name or email..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <div className="student-header-actions">
                    <select
                      className="form-input"
                      value={`${filter.type}:${filter.value}`}
                      onChange={(e) => {
                        const [type, value] = e.target.value.split(':');
                        setFilter({ type, value });
                      }}
                    >
                      <option value="all:All">All Students</option>
                      {/* Dynamic program filters */}
                      {getUniquePrograms().map(program => (
                        <option key={program} value={`program:${program}`}>{program} Students</option>
                      ))}
                      {/* Dynamic section filters */}
                      {getUniqueSections().map(section => (
                        <option key={section} value={`section:${section}`}>{section}</option>
                      ))}
                      {/* Dynamic year filters */}
                      {getUniqueYears().map(year => (
                        <option key={year} value={`year:${year}`}>Year {year}</option>
                      ))}
                    </select>
                    <button className="student-btn-add-student" onClick={showAddStudentForm}>
                      + Add New Student
                    </button>
                  </div>
                </div>

                {/* Multi-Action Toolbar */}
                {selectedStudents.length > 0 && (
                  <div className="multi-action-toolbar">
                    <div className="multi-action-info">
                      <span className="selected-count">{selectedStudents.length} student(s) selected</span>
                    </div>
                    <div className="multi-action-buttons">
                      <button 
                        className="btn-multi-edit"
                        onClick={showMultiEditForm}
                        title="Edit selected students"
                      >
                        ✏️
                      </button>
                      <button 
                        className="btn-multi-promote"
                        onClick={handleMultiPromote}
                        title="Promote selected students"
                      >
                        ⬆️
                      </button>
                      <button 
                        className="btn-multi-delete"
                        onClick={handleMultiDelete}
                        title="Delete selected students"
                      >
                        🗑️
                      </button>
                      <button 
                        className="btn-clear-selection"
                        onClick={clearSelection}
                        title="Clear selection"
                      >
                        ✖️
                      </button>
                    </div>
                  </div>
                )}

                <div className="student-table-container">
                  <table className="student-table">
                    <thead>
                      <tr>
                        <th className="checkbox-column">
                          <input
                            type="checkbox"
                            checked={selectAll}
                            onChange={handleSelectAll}
                            className="select-all-checkbox"
                            title="Select all students on this page"
                          />
                        </th>
                        <th>Student Number</th>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Program</th>
                        <th>Section</th>
                        <th>Year Level</th>
                        <th>Date of Birth</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedStudents.map((student) => (
                        <tr 
                          key={student.id}
                          className={selectedStudents.includes(student.id) ? 'selected-row' : ''}
                        >
                          <td className="checkbox-column">
                            <input
                              type="checkbox"
                              checked={selectedStudents.includes(student.id)}
                              onChange={() => handleSelectStudent(student.id)}
                              className="student-checkbox"
                            />
                          </td>
                          <td className="student-id">{student.username || 'N/A'}</td>
                          <td className="student-name">
                            {student.firstName} {student.lastName}
                          </td>
                          <td className="student-email">{student.email}</td>
                          <td>{student.program?.programName || 'No Program'}</td>
                          <td>{student.section?.sectionName || student.sectionName || 'No Section'}</td>
                          <td>Year {student.year_level}</td>
                          <td>{student.dateOfBirth}</td>
                          <td>
                            <div className="action-buttons">
                              <button
                                className="btn-action btn-edit" // Edit Student
                                onClick={() => showEditStudentForm(student)}
                                title="Edit Student"
                              >
                                ✏️
                              </button>
                              <button
                                className="btn-action btn-delete"
                                onClick={() => openDeleteStudentModal(student)} // Change this line
                                title="Delete Student"
                              >
                                🗑️  
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {filteredStudents.length === 0 && (
                    <div className="no-students">
                      <p>No students found matching your criteria.</p>
                    </div>
                  )}

                  {/* Pagination Controls - only show if there is data */}
                  {filteredStudents.length > 0 && (
                    <div className="pagination">
                      <div className="pagination-info">
                        Showing {startIndex + 1} to {Math.min(endIndex, filteredStudents.length)} of {filteredStudents.length} entries
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

      {/* Combined Add/Edit Student Modal */}
      {(showAddStudentModal || showEditStudentModal) && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2 className="modal-title">
                {editingStudent ? 'Edit Student' : 'Add New Student'}
              </h2>
            </div>

            <div className="modal-body">
              <div className="modal-grid">
                <div className="form-group">
                  <label className="form-label">First Name *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Enter first name"
                    value={studentForm.firstName}
                    onChange={(e) => handleStudentFormChange('firstName', e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Last Name *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Enter last name"
                    value={studentForm.lastName}
                    onChange={(e) => handleStudentFormChange('lastName', e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Email *</label>
                  <input
                    type="email"
                    className="form-input"
                    placeholder="Enter email address"
                    value={studentForm.email}
                    onChange={(e) => handleStudentFormChange('email', e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Date of Birth</label>
                  <input
                    type="date"
                    className="form-input"
                    value={studentForm.dateOfBirth}
                    onChange={(e) => handleStudentFormChange('dateOfBirth', e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Year Level</label>
                  <select
                    className="form-input"
                    value={studentForm.year_level}
                    onChange={(e) => handleStudentFormChange('year_level', e.target.value)}
                  >
                    <option value={1}>Year 1</option>
                    <option value={2}>Year 2</option>
                    <option value={3}>Year 3</option>
                    <option value={4}>Year 4</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Program *</label>
                  <select
                    className="form-input"
                    value={studentForm.programId}
                    onChange={(e) => handleStudentProgramChange(e.target.value)}
                  >
                    <option value="">Select Program</option>
                    {programsList.map((program) => (
                      <option key={program.programID} value={program.programID}>
                        {program.programName}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Curriculum *</label>
                  <select
                    className="form-input"
                    value={studentForm.curriculumId}
                    onChange={(e) => handleStudentFormChange('curriculumId', e.target.value)}
                    disabled={!studentForm.programId}
                  >
                    <option value="">Select Curriculum</option>
                    {availableCurriculums.map((curriculum) => (
                      <option key={curriculum.curriculumID} value={curriculum.curriculumID}>
                        {curriculum.curriculumName} ({curriculum.academicYear})
                      </option>
                    ))}
                  </select>
                  {studentForm.programId && availableCurriculums.length === 0 && (
                    <p style={{ color: '#6c757d', fontSize: '12px', marginTop: '5px' }}>
                      No curriculums available for this program.
                    </p>
                  )}
                </div>
                <div className="form-group">
                  <label className="form-label">Section</label>
                  <select
                    className="form-input"
                    value={studentForm.sectionId}
                    onChange={(e) => handleStudentFormChange('sectionId', e.target.value)}
                    disabled={!studentForm.programId}
                  >
                    <option value="">Select Section</option>
                    {[...availableSectionsForStudent]
                      .sort((a, b) => {
                        const sectionA = a.sectionName || '';
                        const sectionB = b.sectionName || '';
                        return sectionA.localeCompare(sectionB, undefined, { numeric: true, sensitivity: 'base' });
                      })
                      .map((section) => (
                        <option key={section.sectionID} value={section.sectionID}>
                          {section.sectionName}
                        </option>
                      ))}
                  </select>
                  {studentForm.programId && availableSectionsForStudent.length === 0 && (
                    <p style={{ color: '#6c757d', fontSize: '12px', marginTop: '5px' }}>
                      No sections available for this program.
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button
                className="btn btn-secondary"
                onClick={() => {
                  if (editingStudent) {
                    closeEditStudentModal();
                  } else {
                    closeAddStudentModal();
                  }
                }}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={editingStudent ? handleUpdateStudent : handleAddStudent}
              >
                {editingStudent ? 'Update Student' : 'Add Student'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Section Modal */}
      {showAddSectionModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2 className="modal-title">Add New Section</h2>
            </div>

            <div className="modal-body">
              <div className="modal-grid">
                <div className="form-group">
                  <label className="form-label">Section Name *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Enter section name (e.g., BSIT-1A, Year 1 - Section A)"
                    value={sectionForm.sectionName}
                    onChange={(e) => handleSectionFormChange('sectionName', e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Program *</label>
                  <select
                    className="form-input"
                    value={sectionForm.programId}
                    onChange={(e) => handleSectionFormChange('programId', e.target.value)}
                  >
                    <option value="">Select Program</option>
                    {programsList.map((program) => (
                      <option key={program.programID} value={program.programID}>
                        {program.programName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={closeAddSectionModal}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={handleAddSection}>
                Add Section
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Section Modal */}
      {showDeleteSectionModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2 className="modal-title">Delete Section</h2>
            </div>

            <div className="modal-body">
              <div className="modal-grid">
                <div className="form-group">
                  <label className="form-label">Program *</label>
                  <select
                    className="form-input"
                    value={deleteSectionForm.programId}
                    onChange={(e) => handleDeleteSectionFormChange('programId', e.target.value)}
                  >
                    <option value="">Select Program</option>
                    {programsList.map((program) => (
                      <option key={program.programID} value={program.programID}>
                        {program.programName}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Section *</label>
                  <select
                    className="form-input"
                    value={deleteSectionForm.sectionId}
                    onChange={(e) => handleDeleteSectionFormChange('sectionId', e.target.value)}
                    disabled={!deleteSectionForm.programId}
                  >
                    <option value="">Select Section</option>
                    {[...availableSectionsForDelete]
                      .sort((a, b) => {
                        const sectionA = a.sectionName || '';
                        const sectionB = b.sectionName || '';
                        return sectionA.localeCompare(sectionB, undefined, { numeric: true, sensitivity: 'base' });
                      })
                      .map((section) => (
                        <option key={section.sectionID} value={section.sectionID}>
                          {section.sectionName}
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              {deleteSectionForm.programId && availableSectionsForDelete.length === 0 && (
                <p style={{ color: '#6c757d', fontSize: '14px', marginTop: '10px' }}>
                  No sections found for this program.
                </p>
              )}
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={closeDeleteSectionModal}>
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={handleDeleteSection}
                disabled={!deleteSectionForm.sectionId}
              >
                Delete Section
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Multi-Edit Modal */}
      {showMultiEditModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2 className="modal-title">Multi Edit Students ({selectedStudents.length} selected)</h2>
            </div>

            <div className="modal-body">
              <p style={{ marginBottom: '20px', color: '#6c757d' }}>
                Only fill in the fields you want to update. Empty fields will remain unchanged.
              </p>
              
              <div className="modal-grid">
                <div className="form-group">
                  <label className="form-label">Program</label>
                  <select
                    className="form-input"
                    value={multiEditForm.programId}
                    onChange={(e) => handleMultiEditFormChange('programId', e.target.value)}
                  >
                    <option value="">Keep current program</option>
                    {programsList.map((program) => (
                      <option key={program.programID} value={program.programID}>
                        {program.programName}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Year Level</label>
                  <select
                    className="form-input"
                    value={multiEditForm.year_level}
                    onChange={(e) => handleMultiEditFormChange('year_level', e.target.value)}
                  >
                    <option value="">Keep current year level</option>
                    <option value={1}>Year 1</option>
                    <option value={2}>Year 2</option>
                    <option value={3}>Year 3</option>
                    <option value={4}>Year 4</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Section</label>
                  <select
                    className="form-input"
                    value={multiEditForm.sectionId}
                    onChange={(e) => handleMultiEditFormChange('sectionId', e.target.value)}
                    disabled={!multiEditForm.programId}
                  >
                    <option value="">Keep current section</option>
                    {[...availableSectionsForStudent]
                      .sort((a, b) => {
                        const sectionA = a.sectionName || '';
                        const sectionB = b.sectionName || '';
                        return sectionA.localeCompare(sectionB, undefined, { numeric: true, sensitivity: 'base' });
                      })
                      .map((section) => (
                        <option key={section.sectionID} value={section.sectionID}>
                          {section.sectionName}
                        </option>
                      ))}
                  </select>
                  {multiEditForm.programId && availableSectionsForStudent.length === 0 && (
                    <p style={{ color: '#6c757d', fontSize: '12px', marginTop: '5px' }}>
                      No sections available for this program.
                    </p>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label">Curriculum</label>
                  <select
                    className="form-input"
                    value={multiEditForm.curriculumId}
                    onChange={(e) => handleMultiEditFormChange('curriculumId', e.target.value)}
                    disabled={!multiEditForm.programId}
                  >
                    <option value="">Keep current curriculum</option>
                    {availableCurriculums.map((curriculum) => (
                      <option key={curriculum.curriculumID} value={curriculum.curriculumID}>
                        {curriculum.curriculumName} ({curriculum.academicYear})
                      </option>
                    ))}
                  </select>
                  {multiEditForm.programId && availableCurriculums.length === 0 && (
                    <p style={{ color: '#6c757d', fontSize: '12px', marginTop: '5px' }}>
                      No curriculums available for this program.
                    </p>
                  )}
                </div>
              </div>

              <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
                <h4 style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#495057' }}>Selected Students:</h4>
                <div style={{ maxHeight: '120px', overflowY: 'auto' }}>
                  {selectedStudents.map(studentId => {
                    const student = studentsData.find(s => s.id === studentId);
                    return student ? (
                      <div key={studentId} style={{ fontSize: '13px', color: '#6c757d', marginBottom: '5px' }}>
                        • {student.firstName} {student.lastName} ({student.username || 'N/A'})
                      </div>
                    ) : null;
                  })}
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={closeMultiEditModal}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={handleMultiEdit}>
                Update {selectedStudents.length} Student(s)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Credentials Modal */}
      {showCredentialsModal && generatedCredentials && (
        <div className="modal-overlay">
          <div className="modal-container">
            <div className="modal-header">
              <h2 className="modal-title">Student Account Created</h2>
              <button className="modal-close" onClick={() => setShowCredentialsModal(false)}>×</button>
            </div>
            
            <div className="modal-content">
              <div className="credentials-info">
                <p>Student account has been created successfully. Please save these credentials:</p>
                <div className="credentials-details">
                  <div className="credential-item">
                    <label>Username:</label>
                    <span className="credential-value">{generatedCredentials.username}</span>
                  </div>
                  <div className="credential-item">
                    <label>Password:</label>
                    <span className="credential-value">{generatedCredentials.password}</span>
                  </div>
                </div>
                <p className="credentials-note">
                  Note: These credentials will be shown only once. Please make sure to save them.
                </p>
              </div>
            </div>
            
            <div className="modal-footer">
              <button 
                className="btn btn-primary" 
                onClick={() => setShowCredentialsModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {showDeleteStudentModal && studentToDelete && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">Delete Student</h3>
            </div>
            <div className="modal-body">
              <p>
                Are you sure you want to delete the student:{' '}
                <strong>
                  {studentToDelete.firstName} {studentToDelete.lastName}
                </strong>
                ?
                <br/>
                <span style={{fontSize: '14px', color: '#6c757d'}}>
                  (Student No: {studentToDelete.username || 'N/A'})
                </span>
              </p>
              <div style={{ color: 'red', marginTop: 12 }}>
                Warning: Deleting a student is permanent and cannot be undone.
              </div>
              {deleteStudentError && (
                <div style={{ color: 'red', marginTop: 10, fontWeight: 500 }}>{deleteStudentError}</div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={closeDeleteStudentModal}>
                Cancel
              </button>
              <button
                className="btn btn-danger"
                onClick={handleDeleteStudent}
              >
                Delete Student
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentManagement;