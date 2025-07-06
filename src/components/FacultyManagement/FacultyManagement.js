import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './FacultyManagement.css';
import Sidebar from '../Sidebar';
import { useAdminData } from '../../hooks/useAdminData';
import { facultyAPI, programAPI } from '../../services/api';
import Loading from '../Loading';

const FacultyManagement = () => {
  const { getUserInfo } = useAdminData();
  const navigate = useNavigate();
  const [facultyList, setFacultyList] = useState([]);
  const [programsList, setProgramsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddFacultyModal, setShowAddFacultyModal] = useState(false);
  const [showEditFacultyModal, setShowEditFacultyModal] = useState(false);
  const [showCredentialsModal, setShowCredentialsModal] = useState(false);
  const [editingFaculty, setEditingFaculty] = useState(null);
  const [generatedCredentials, setGeneratedCredentials] = useState(null);
  const [facultyForm, setFacultyForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    programId: '',
    position: '',
    status: 'Active'
  });

  const [selectedProgram, setSelectedProgram] = useState('All Programs');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All'); // 'All', 'Active', 'Inactive'
  const [toasts, setToasts] = useState([]);

  // Position options for faculty
  const positionOptions = [
    'Professor',
    'Associate Professor',
    'Assistant Professor',
    'Lecturer',
    'Instructor',
    'Department Head',
    'Dean'
  ];

  // Status options
  const statusOptions = [
    'Active',
    'Inactive',
    'On Leave',
    'Retired'
  ];

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
      
      // Load both faculty and programs
      await Promise.all([
        loadFaculty(),
        loadPrograms()
      ]);
    } catch (err) {
      console.error('Error loading initial data:', err);
      setError('Failed to load data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const loadFaculty = async () => {
    try {
      const response = await facultyAPI.getAllFaculty();
      console.log('Faculty loaded:', response.data);
      setFacultyList(response.data);
    } catch (error) {
      console.error('Error loading faculty:', error);
      throw error;
    }
  };

  const loadPrograms = async () => {
    try {
      const response = await programAPI.getAllPrograms();
      console.log('Programs loaded:', response.data);
      setProgramsList(response.data);
    } catch (error) {
      console.error('Error loading programs:', error);
      throw error;
    }
  };

  // Statistics calculations
  const totalFaculty = facultyList.length;
  const activeFaculty = facultyList.filter(f => f.status === 'Active').length;
  const inactiveFaculty = facultyList.filter(f => f.status === 'Inactive').length;
  // CORRECTED: Count all programs from the programs list, not from the faculty list.
  const totalPrograms = programsList.length;

  // Filter faculty based on search, program, and status
  const filteredFaculty = facultyList.filter(faculty => {
    const searchTermLower = searchTerm.toLowerCase();

    const matchesSearch = 
      faculty.firstName?.toLowerCase().includes(searchTermLower) ||
      faculty.lastName?.toLowerCase().includes(searchTermLower) ||
      faculty.email?.toLowerCase().includes(searchTermLower) ||
      (faculty.username && faculty.username.toLowerCase().includes(searchTermLower));
    
    const matchesProgram = selectedProgram === 'All Programs' || 
      faculty.program?.programName === selectedProgram;
    
    const matchesStatus = statusFilter === 'All' || faculty.status === statusFilter;
    
    return matchesSearch && matchesProgram && matchesStatus;
  });

  // Add Faculty Modal functions
  const showAddFacultyForm = () => {
    console.log('Programs available for dropdown:', programsList);
    setFacultyForm({
      firstName: '',
      lastName: '',
      email: '',
      programId: '',
      position: '',
      status: 'Active'
    });
    setShowAddFacultyModal(true);
  };

  const closeAddFacultyModal = () => {
    setShowAddFacultyModal(false);
    setFacultyForm({
      firstName: '',
      lastName: '',
      email: '',
      programId: '',
      position: '',
      status: 'Active'
    });
  };

  // Edit Faculty Modal functions
  const showEditFacultyForm = (faculty) => {
    console.log('Editing faculty:', faculty);
    console.log('Programs available for edit dropdown:', programsList);
    
    setEditingFaculty(faculty);
    setFacultyForm({
      firstName: faculty.firstName || '',
      lastName: faculty.lastName || '',
      email: faculty.email || '',
      programId: faculty.program?.programID?.toString() || '',
      position: faculty.position || '',
      status: faculty.status || 'Active'
    });
    setShowEditFacultyModal(true);
  };

  const closeEditFacultyModal = () => {
    setShowEditFacultyModal(false);
    setEditingFaculty(null);
    setFacultyForm({
      firstName: '',
      lastName: '',
      email: '',
      programId: '',
      position: '',
      status: 'Active'
    });
  };

  const handleFacultyFormChange = (field, value) => {
    console.log(`Form field changed: ${field} = ${value}`);
    setFacultyForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAddFaculty = async () => {
    // Validate required fields
    if (!facultyForm.firstName || !facultyForm.lastName || !facultyForm.email) {
      alert('Please fill in all required fields');
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(facultyForm.email)) {
      alert('Please enter a valid email address');
      return;
    }
    
    try {
      // Find the selected program object
      const selectedProgramObj = programsList.find(p => p.programID.toString() === facultyForm.programId);
      console.log('Selected program for new faculty:', selectedProgramObj);
      
      const facultyData = {
        firstName: facultyForm.firstName,
        lastName: facultyForm.lastName,
        email: facultyForm.email,
        position: facultyForm.position || 'Assistant Professor',
        status: facultyForm.status || 'Active',
        program: selectedProgramObj || null
      };

      console.log('Sending faculty data:', facultyData);
      const response = await facultyAPI.createFaculty(facultyData);
      setGeneratedCredentials(response.data);
      closeAddFacultyModal();
      setShowCredentialsModal(true);
      loadFaculty();
      showToast('Faculty added successfully!', 'success');
    } catch (error) {
      console.error('Error adding faculty:', error);
      if (error.response?.status === 400) {
        showToast('Email already exists or invalid data provided!', 'error');
      } else {
        showToast('Failed to add faculty. Please try again.', 'error');
      }
    }
  };

  const handleEditFaculty = async () => {
    // Validate required fields
    if (!facultyForm.firstName || !facultyForm.lastName || !facultyForm.email) {
      alert('Please fill in all required fields');
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(facultyForm.email)) {
      alert('Please enter a valid email address');
      return;
    }
    
    try {
      // Find the selected program object
      const selectedProgramObj = programsList.find(p => p.programID.toString() === facultyForm.programId);
      console.log('Selected program for editing faculty:', selectedProgramObj);
      
      const facultyData = {
        firstName: facultyForm.firstName,
        lastName: facultyForm.lastName,
        email: facultyForm.email,
        position: facultyForm.position || 'Assistant Professor',
        status: facultyForm.status || 'Active',
        program: selectedProgramObj || null
      };

      console.log('Sending updated faculty data:', facultyData);
      await facultyAPI.updateFaculty(editingFaculty.facultyID, facultyData);
      showToast('Faculty updated successfully!', 'success');
      closeEditFacultyModal();
      loadFaculty();
    } catch (error) {
      console.error('Error updating faculty:', error);
      if (error.response?.status === 400) {
        const errorMessage = error.response?.data || 'Invalid data provided';
        if (typeof errorMessage === 'string' && errorMessage.includes('Email already exists')) {
          showToast('This email address is already in use by another student or faculty member.', 'error');
        } else {
          showToast('Invalid data provided. Please check your input.', 'error');
        }
      } else if (error.response?.status === 404) {
        showToast('Faculty not found!', 'error');
      } else {
        showToast('Failed to update faculty. Please try again.', 'error');
      }
    }
  };

  const handleDeleteFaculty = async (facultyId) => {
    if (window.confirm('Are you sure you want to delete this faculty member?')) {
      try {
        // Find the faculty member to get their details for the event
        const facultyToDelete = facultyList.find(f => f.facultyID === facultyId);
        
        await facultyAPI.deleteFaculty(facultyId);

        // Emit user deletion event for AdminTools to listen
        if (facultyToDelete) {
          const deletionEvent = new CustomEvent('userDeleted', {
            detail: {
              userId: facultyId,
              userType: 'faculty',
              userName: `${facultyToDelete.firstName} ${facultyToDelete.lastName}`,
              timestamp: new Date().toISOString()
            }
          });
          window.dispatchEvent(deletionEvent);
        }

        showToast('Faculty deleted successfully!', 'success');
        loadFaculty();
      } catch (error) {
        console.error('Error deleting faculty:', error);
        if (error.response?.status === 404) {
          showToast('Faculty not found!', 'error');
        } else {
          showToast('Failed to delete faculty. Please try again.', 'error');
        }
      }
    }
  };

  // Show loading state
  if (loading) {
    return (
      <div className="dashboard-container">
        <Sidebar userInfo={getUserInfo()} />
        <div className="main-content">
          <div className="content-wrapper">
            <Loading message="Loading faculty data..." />
          </div>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="dashboard-container">
        <Sidebar userInfo={getUserInfo()} />
        <div className="main-content">
          <div className="content-wrapper">
            <div style={{ padding: '2rem', textAlign: 'center' }}>
              <div style={{ color: '#ef4444', marginBottom: '1rem' }}>
                <h3>Error Loading Faculty Data</h3>
                <p>{error}</p>
              </div>
              <button onClick={loadInitialData} className="btn btn-primary">
                Retry
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div id="toast-container">
        {toasts.map(toast => (
          <div key={toast.id} className={`toast ${toast.type}`}>
            {toast.message}
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
            <span className="breadcrumb-current">Faculty Management</span>
          </div>
          
          <div className="page-header">
            <h1 className="page-title">Faculty Management</h1>
          </div>

          <div className="stats-grid">
            <div 
              className={`stat-card ${statusFilter === 'All' ? 'active' : ''}`}
              onClick={() => setStatusFilter('All')}
            >
              <div className="stat-icon blue">👨‍🏫</div>
              <div className="stat-content">
                <div className="stat-label"><h3>Total Faculty</h3></div>
                <div className="stat-value">{totalFaculty}</div>
              </div>
            </div>
            <div 
              className={`stat-card ${statusFilter === 'Active' ? 'active' : ''}`}
              onClick={() => setStatusFilter('Active')}
            >
              <div className="stat-icon green">✅</div>
              <div className="stat-content">
                <div className="stat-label"><h3>Active</h3></div>
                <div className="stat-value">{activeFaculty}</div>
              </div>
            </div>
            <div className={`stat-card ${statusFilter === 'Inactive' ? 'active' : ''}`}
              onClick={() => setStatusFilter('Inactive')}
            >
              <div className="stat-icon red">❌</div>
              <div className="stat-content">
                <div className="stat-label"><h3>Inactive</h3></div>
                <div className="stat-value">{inactiveFaculty}</div>
              </div>
            </div>
            <div className="stat-card no-action">
              <div className="stat-icon blue">📚</div>
              <div className="stat-content">
                <div className="stat-label"><h3>Total Programs</h3></div>
                <div className="stat-value">{totalPrograms}</div>
              </div>
            </div>
          </div>

          <div className="faculty-list-container">
            <div className="list-header">
              <div className="list-controls">
                <h2 className="list-title">Faculty List</h2>
                <div className="controls">
                  <select 
                    value={selectedProgram}
                    onChange={(e) => setSelectedProgram(e.target.value)}
                    className="select-input"
                  >
                    <option>All Programs</option>
                    {programsList.map(program => (
                      <option key={program.programID} value={program.programName}>
                        {program.programName}
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    placeholder="Search faculty..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="search-input"
                  />
                  <button 
                    onClick={showAddFacultyForm}
                    className="add-faculty-btn"
                  >
                    + Add New Faculty
                  </button>
                </div>
              </div>
            </div>

            <div className="table-container">
              <table className="faculty-table">
                <thead>
                  <tr>
                    <th>Faculty Number</th>
                    <th>Name</th>
                    <th>Program</th>
                    <th>Email</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredFaculty.map((faculty) => (
                    <tr key={faculty.facultyID}>
                      <td>{faculty.username || 'N/A'}</td>
                      <td>
                        <div className="faculty-info">
                          <div className="faculty-name">
                            {faculty.firstName} {faculty.lastName}
                          </div>
                          <div className="faculty-position">{faculty.position}</div>
                        </div>
                      </td>
                      <td>{faculty.program?.programName || 'No Program'}</td>
                      <td>{faculty.email}</td>
                      <td>
                        <span className={`status-badge ${faculty.status === 'Active' ? 'status-active' : 'status-inactive'}`}>
                          {faculty.status}
                        </span>
                      </td>
                      <td className="action-buttons">
                        <button
                          className="btn-edit"
                          onClick={() => showEditFacultyForm(faculty)}
                          title="Edit Faculty"
                        >
                          ✏️
                        </button>
                        <button
                          className="btn-delete"
                          onClick={() => handleDeleteFaculty(faculty.facultyID)}
                          title="Delete Faculty"
                        >
                          🗑️
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="table-footer">
              <div className="table-info">
                Showing {filteredFaculty.length} of {totalFaculty} entries
              </div>
            </div>
          </div>
        </div>
      </div>

      {(showAddFacultyModal || showEditFacultyModal) && (
        <div className="modal-overlay">
          <div className="modal-container">
            <div className="modal-header">
              <h2 className="modal-title">
                {showEditFacultyModal ? 'Edit Faculty' : 'Add New Faculty'}
              </h2>
            </div>
            
            <div className="modal-content">
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">First Name *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Enter First Name"
                    value={facultyForm.firstName}
                    onChange={(e) => handleFacultyFormChange('firstName', e.target.value)}
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">Last Name *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Enter Last Name"
                    value={facultyForm.lastName}
                    onChange={(e) => handleFacultyFormChange('lastName', e.target.value)}
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">Email *</label>
                  <input
                    type="email"
                    className="form-input"
                    placeholder="Enter Email Address"
                    value={facultyForm.email}
                    onChange={(e) => handleFacultyFormChange('email', e.target.value)}
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">Program</label>
                  <select
                    className="form-input"
                    value={facultyForm.programId}
                    onChange={(e) => handleFacultyFormChange('programId', e.target.value)}
                  >
                    <option value="">Select Program</option>
                    {programsList && programsList.length > 0 ? (
                      programsList.map((program) => (
                        <option key={program.programID} value={program.programID}>
                          {program.programName}
                        </option>
                      ))
                    ) : (
                      <option value="" disabled>No programs available</option>
                    )}
                  </select>
                  {programsList.length === 0 && (
                    <small style={{ color: '#666', marginTop: '4px', display: 'block' }}>
                      No programs loaded. Please refresh the page.
                    </small>
                  )}
                </div>
                
                <div className="form-group">
                  <label className="form-label">Position</label>
                  <select
                    className="form-input"
                    value={facultyForm.position}
                    onChange={(e) => handleFacultyFormChange('position', e.target.value)}
                  >
                    <option value="">Select position</option>
                    {positionOptions.map((pos) => (
                      <option key={pos} value={pos}>{pos}</option>
                    ))}
                  </select>
                </div>
                
                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select
                    className="form-input"
                    value={facultyForm.status}
                    onChange={(e) => handleFacultyFormChange('status', e.target.value)}
                  >
                    {statusOptions.map((status) => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            
            <div className="modal-footer">
              <button 
                className="btn btn-secondary"
                onClick={showEditFacultyModal ? closeEditFacultyModal : closeAddFacultyModal}
              >
                Cancel
              </button>
              <button 
                className="btn btn-primary"
                onClick={showEditFacultyModal ? handleEditFaculty : handleAddFaculty}
              >
                {showEditFacultyModal ? 'Update Faculty' : 'Add Faculty'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showCredentialsModal && generatedCredentials && (
        <div className="modal-overlay">
          <div className="modal-container">
            <div className="modal-header">
              <h2 className="modal-title">Faculty Account Created</h2>
              <button className="modal-close" onClick={() => setShowCredentialsModal(false)}>×</button>
            </div>
            
            <div className="modal-content">
              <div className="credentials-info">
                <p>Faculty account has been created successfully. Please save these credentials:</p>
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
    </div>
  );
};

export default FacultyManagement;