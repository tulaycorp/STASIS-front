import React, { useState, useEffect } from 'react';
import './AdminTools.css';
import Sidebar from '../Sidebar';
import { useAdminData } from '../../hooks/useAdminData';
import { userAPI } from '../../services/api';

const AdminTools = () => {
  const { getUserInfo } = useAdminData();
  const [activeSection, setActiveSection] = useState('logs');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [selectedUser, setSelectedUser] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // State for logs
  const [logs, setLogs] = useState([]);
  const [filteredLogs, setFilteredLogs] = useState([]);

  // State for users
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // Load data on component mount
  useEffect(() => {
    loadLogs();
    loadUsers();
  }, []);

  // Listen for user deletion events from other components
  useEffect(() => {
    const handleUserDeleted = (event) => {
      console.log('User deletion event received in AdminTools:', event.detail);
      // Reload users to reflect the deletion
      loadUsers();
    };

    // Add event listener for user deletions
    window.addEventListener('userDeleted', handleUserDeleted);

    // Cleanup event listener on component unmount
    return () => {
      window.removeEventListener('userDeleted', handleUserDeleted);
    };
  }, []);

  // Filter logs when search term or filter type changes
  useEffect(() => {
    filterLogs();
  }, [searchTerm, filterType, logs]);

  // Filter users when search term changes
  useEffect(() => {
    filterUsers();
  }, [searchTerm, users]);

  const loadLogs = async () => {
    setIsLoading(true);
    try {
      // Replace with actual API call
      // const response = await fetch('/api/admin/logs');
      // const data = await response.json();
      // setLogs(data);
      setLogs([]); // Empty for now - will be populated by API
    } catch (error) {
      console.error('Error loading logs:', error);
    }
    setIsLoading(false);
  };

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const response = await userAPI.getAllUsers();
      setUsers(response.data);
    } catch (error) {
      console.error('Error loading users:', error);
    }
    setIsLoading(false);
  };

  const filterLogs = () => {
    let filtered = logs;

    if (searchTerm) {
      filtered = filtered.filter(log =>
        log.user?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.action?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.details?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterType !== 'all') {
      filtered = filtered.filter(log => log.type === filterType);
    }

    setFilteredLogs(filtered);
    setCurrentPage(1);
  };

  const filterUsers = () => {
    let filtered = users;

    if (searchTerm) {
      filtered = filtered.filter(user =>
        `${user.firstName} ${user.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.userID?.toString().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredUsers(filtered);
    setCurrentPage(1);
  };

  const exportLogs = () => {
    console.log('Exporting logs...');
    // Implement CSV export functionality
  };

  const resetUserPassword = async (userId) => {
    if (window.confirm('Are you sure you want to reset this user\'s password? They will receive an email with a temporary password.')) {
      try {
        await userAPI.resetPassword(userId);
        alert('Password has been reset successfully');
      } catch (error) {
        console.error('Error resetting password:', error);
        alert('Failed to reset password');
      }
    }
  };

  const toggleUserStatus = async (userId, currentStatus) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    const action = currentStatus === 'active' ? 'deactivate' : 'activate';
    
    if (window.confirm(`Are you sure you want to ${action} this user account?`)) {
      try {
        await userAPI.updateUserStatus(userId, newStatus);
        loadUsers(); // Reload users to get updated status
      } catch (error) {
        console.error('Error updating user status:', error);
        alert('Failed to update user status');
      }
    }
  };

  const viewUserDetails = (user) => {
    setSelectedUser(user);
  };

  const closeUserModal = () => {
    setSelectedUser(null);
    setShowPassword(false);
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  // Pagination
  const getCurrentPageData = (data) => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return data.slice(startIndex, startIndex + itemsPerPage);
  };

  const getTotalPages = (data) => {
    return Math.ceil(data.length / itemsPerPage);
  };

  // Settings sections configuration
  const toolSections = [
    { id: 'logs', label: 'System Logs', icon: '📋' },
    { id: 'users', label: 'User Management', icon: '👥' }
  ];

  // Render Logs Section
  const renderLogsSection = () => (
    <div className="admin-section-content">
      <div className="admin-controls">
        <div className="admin-search-group">
          <input
            type="text"
            className="admin-search-input"
            placeholder="Search logs by user, action, or details..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <select
            className="admin-filter-select"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option value="all">All Types</option>
            <option value="login">Login</option>
            <option value="logout">Logout</option>
            <option value="create">Create</option>
            <option value="update">Update</option>
            <option value="delete">Delete</option>
            <option value="error">Error</option>
          </select>
        </div>
        <button className="admin-btn admin-btn-secondary" onClick={exportLogs}>
          Export CSV
        </button>
      </div>

      {isLoading ? (
        <div className="admin-loading">Loading logs...</div>
      ) : filteredLogs.length === 0 ? (
        <div className="admin-empty-state">
          <div className="admin-empty-icon">📋</div>
          <h3>No logs found</h3>
          <p>No system logs match your current search criteria.</p>
        </div>
      ) : (
        <>
          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>User</th>
                  <th>Action</th>
                  <th>Type</th>
                  <th>IP Address</th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody>
                {getCurrentPageData(filteredLogs).map((log, index) => (
                  <tr key={index}>
                    <td className="admin-table-timestamp">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="admin-table-user">{log.user}</td>
                    <td className="admin-table-action">{log.action}</td>
                    <td>
                      <span className={`admin-badge admin-badge-${log.type}`}>
                        {log.type}
                      </span>
                    </td>
                    <td className="admin-table-ip">{log.ipAddress}</td>
                    <td className="admin-table-details">{log.details}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {getTotalPages(filteredLogs) > 1 && (
            <div className="admin-pagination">
              <button
                className="admin-pagination-btn"
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
              >
                Previous
              </button>
              <span className="admin-pagination-info">
                Page {currentPage} of {getTotalPages(filteredLogs)}
              </span>
              <button
                className="admin-pagination-btn"
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, getTotalPages(filteredLogs)))}
                disabled={currentPage === getTotalPages(filteredLogs)}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );

  // Render Users Section
  const renderUsersSection = () => (
    <div className="admin-section-content">
      <div className="admin-controls">
        <div className="admin-search-group">
          <input
            type="text"
            className="admin-search-input"
            placeholder="Search users by name, email, or ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {isLoading ? (
        <div className="admin-loading">Loading users...</div>
      ) : filteredUsers.length === 0 ? (
        <div className="admin-empty-state">
          <div className="admin-empty-icon">👥</div>
          <h3>No users found</h3>
          <p>No users match your current search criteria. User accounts are automatically created when students and faculty are added through their respective management sections.</p>
        </div>
      ) : (
        <>
          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Username</th>
                  <th>Name</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Last Login</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {getCurrentPageData(filteredUsers).map((user) => (
                  <tr key={user.userID}>
                    <td className="admin-table-id">{user.username}</td>
                    <td className="admin-table-name">{`${user.firstName} ${user.lastName}`}</td>
                    <td>
                      <span className={`admin-badge admin-badge-role-${user.role?.toLowerCase()}`}>
                        {user.role}
                      </span>
                    </td>
                    <td>
                      <span className={`admin-badge admin-badge-status-${user.status}`}>
                        {user.status}
                      </span>
                    </td>
                    <td className="admin-table-timestamp">
                      {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="admin-table-timestamp">
                      {user.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'Never'}
                    </td>
                    <td className="admin-table-actions">
                      <button
                        className="admin-action-btn admin-action-btn-view"
                        onClick={() => viewUserDetails(user)}
                        title="View Details"
                      >
                        👁️
                      </button>
                      <button
                        className="admin-action-btn admin-action-btn-reset"
                        onClick={() => resetUserPassword(user.userID)}
                        title="Reset Password"
                      >
                        🔑
                      </button>
                      <button
                        className={`admin-action-btn ${user.status === 'active' ? 'admin-action-btn-deactivate' : 'admin-action-btn-activate'}`}
                        onClick={() => toggleUserStatus(user.userID, user.status)}
                        title={user.status === 'active' ? 'Deactivate' : 'Activate'}
                      >
                        {user.status === 'active' ? '🚫' : '✅'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {getTotalPages(filteredUsers) > 1 && (
            <div className="admin-pagination">
              <button
                className="admin-pagination-btn"
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
              >
                Previous
              </button>
              <span className="admin-pagination-info">
                Page {currentPage} of {getTotalPages(filteredUsers)}
              </span>
              <button
                className="admin-pagination-btn"
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, getTotalPages(filteredUsers)))}
                disabled={currentPage === getTotalPages(filteredUsers)}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );

  // Get current section data
  const getCurrentSectionData = () => {
    switch(activeSection) {
      case 'logs':
        return {
          title: 'System Logs',
          description: 'View and monitor all system activities and user actions',
          content: renderLogsSection()
        };
      case 'users':
        return {
          title: 'User Management',
          description: 'Manage user accounts, credentials, and access permissions. User accounts are automatically created when students and faculty are added.',
          content: renderUsersSection()
        };
      default:
        return {
          title: 'Admin Tools',
          description: 'System administration and monitoring tools',
          content: <div>Select a tool to get started</div>
        };
    }
  };

  const currentSection = getCurrentSectionData();

  return (
    <div className="admin-container">
      <Sidebar userInfo={getUserInfo()} />

      <div className="admin-main-content">
        <div className="admin-header">
          <h1 className="admin-title">Admin Tools</h1>
          <p className="admin-subtitle">System administration and monitoring</p>
        </div>

        <div className="admin-content-wrapper">
          <div className="admin-nav-section">
            <div className="admin-nav-header">
              <h2 className="admin-nav-title">Tools</h2>
            </div>
            <div className="admin-nav-list">
              {toolSections.map((section) => (
                <div
                  key={section.id}
                  className={`admin-nav-item ${activeSection === section.id ? 'admin-nav-item-active' : ''}`}
                  onClick={() => setActiveSection(section.id)}
                >
                  <span className="admin-nav-icon">{section.icon}</span>
                  {section.label}
                </div>
              ))}
            </div>
          </div>

          <div className="admin-main-section">
            <div className="admin-section-header">
              <h2 className="admin-section-title">{currentSection.title}</h2>
              <p className="admin-section-desc">{currentSection.description}</p>
            </div>
            
            {currentSection.content}
          </div>
        </div>
      </div>

      {/* User Details Modal */}
      {selectedUser && (
        <div className="admin-modal-overlay" onClick={closeUserModal}>
          <div className="admin-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3 className="admin-modal-title">User Details</h3>
              <button className="admin-modal-close" onClick={closeUserModal}>×</button>
            </div>
            <div className="admin-modal-body">
              <div className="admin-user-details">
                <div className="admin-user-avatar">
                  {selectedUser.firstName?.charAt(0)?.toUpperCase()}
                </div>
                <div className="admin-user-info">
                  <h4>{`${selectedUser.firstName} ${selectedUser.lastName}`}</h4>
                  <p className="admin-user-email">{selectedUser.username}</p>
                  <p className="admin-user-role">{selectedUser.role}</p>
                </div>
              </div>
              
              <div className="admin-user-meta">
                <div className="admin-meta-item">
                  <label>User ID:</label>
                  <span>{selectedUser.userID}</span>
                </div>
                <div className="admin-meta-item">
                  <label>Username:</label>
                  <span>{selectedUser.username}</span>
                </div>
                <div className="admin-meta-item">
                  <label>Status:</label>
                  <span className={`admin-badge admin-badge-status-${selectedUser.status}`}>
                    {selectedUser.status}
                  </span>
                </div>
                <div className="admin-meta-item">
                  <label>Role:</label>
                  <span>{selectedUser.role}</span>
                </div>
                <div className="admin-meta-item">
                  <label>Email:</label>
                  <span>{selectedUser.email || 'N/A'}</span>
                </div>
                <div className="admin-meta-item">
                  <label>Password:</label>
                  <div className="admin-password-field">
                    <span className={`admin-password-value ${!showPassword ? 'admin-password-blurred' : ''}`}>
                      {showPassword ? selectedUser.password || '••••••••' : '••••••••'}
                    </span>
                    <button 
                      className="admin-password-toggle"
                      onClick={togglePasswordVisibility}
                      title={showPassword ? 'Hide Password' : 'Show Password'}
                    >
                      {showPassword ? '🙈' : '👁️'}
                    </button>
                  </div>
                </div>
                <div className="admin-meta-item">
                  <label>Created:</label>
                  <span>{selectedUser.createdAt ? new Date(selectedUser.createdAt).toLocaleDateString() : 'N/A'}</span>
                </div>
                <div className="admin-meta-item">
                  <label>Last Login:</label>
                  <span>{selectedUser.lastLogin ? new Date(selectedUser.lastLogin).toLocaleString() : 'Never'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminTools;
