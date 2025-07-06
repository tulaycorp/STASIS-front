import React from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';
import './FacultySidebar.module.css';

// Utility function to get active page from current URL
const getActivePageFromURL = () => {
  const path = window.location.pathname;
  
  if (path === '/faculty-dashboard' || path === '/') {
    return 'FacultyDashboard';
  } else if (path === '/faculty-schedule') {
    return 'FacultySchedule';
  } else if (path === '/faculty-grades') {
    return 'FacultyGrades';
  } else if (path === '/faculty-settings') {
    return 'FacultySettings';
  }
  
  // Return empty string if no match so nothing is highlighted
  return '';
};

const FacultySidebar = ({ onNavigate, userInfo, sections }) => {
  // Automatically determine active page from URL instead of using prop
  const activePage = getActivePageFromURL();
  const navigate = useNavigate();
  const showSection = (section) => {
    switch(section){
      case 'FacultyDashboard':
        navigate('/faculty-dashboard');
        break;
      case 'FacultySchedule':
        navigate('/faculty-schedule');
        break;
        case 'FacultyGrades':
          navigate('/faculty-grades');
        break;
      case 'FacultySettings':
        navigate('/faculty-settings');
        break;
      default:
        // No action for unknown sections
    }
  };
  // Get user initials for avatar
  const getUserInitials = () => {
    if (!userInfo?.name) return 'FA';
    const names = userInfo.name.split(' ');
    return names.map(name => name.charAt(0)).join('').toUpperCase();
  };
  
  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <div className="logo">S</div>
      </div>
      <div className="sidebar-content">
        <div className="nav-section">
          <div className="nav-label">Main</div>
          <div className="nav-items">
            <div
              className={`nav-item${activePage === 'FacultyDashboard' ? ' active-page' : ''}`}
              onClick={() => showSection('FacultyDashboard')}
            >
              📊 Dashboard
            </div>
          </div>
        </div>
        <div className="nav-section">
          <div className="nav-label">Management</div>
          <div className="nav-items">
            <div
              className={`nav-item${activePage === 'FacultySchedule' ? ' active-page' : ''}`}
              onClick={() => showSection('FacultySchedule')}
            >
              📅 Schedule
            </div>
            <div
              className={`nav-item${activePage === 'FacultyGrades' ? ' active-page' : ''}`}
              onClick={() => showSection('FacultyGrades')}
            >
              📈 Grades
            </div>
          </div>
        </div>
      </div>
      <div className="sidebar-footer">
        <button className="logout-button" onClick={async () => {
          if (window.confirm('Are you sure you want to log out?')) {
            try {
              await authAPI.logout();
              window.location.href = '/';
            } catch (error) {
              console.error('Logout error:', error);
              // Still redirect even if logout request fails
              localStorage.clear();
              window.location.href = '/';
            }
          }
        }}>
          🚪 Log Out
        </button>
        <div className="user-profile">
          <div className="user-avatar">{getUserInitials()}</div>
          <div className="user-info">
            <div className="user-name">{userInfo?.name || 'Faculty User'}</div>
            <div className="user-role">{userInfo?.role || 'Faculty'}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FacultySidebar;