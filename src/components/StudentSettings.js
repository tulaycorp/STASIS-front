import React, { useState } from 'react';
import './StudentSettings.module.css';
import Sidebar from './StudentSidebar';
import { useStudentData } from '../hooks/useStudentData';

const StudentSettings = () => {
  const { getUserInfo } = useStudentData();
  const [activeSection, setActiveSection] = useState('profile');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Profile Settings State
  const [profileSettings, setProfileSettings] = useState({
    firstName: 'David',
    lastName: 'Anderson',
    email: 'david.anderson@school.edu',
    phone: '+1 (555) 123-4567',
    department: 'Computer Science',
    position: 'Schedule Admin',
    bio: 'Experienced administrator with 10+ years in educational technology and student information systems.',
    officeLocation: 'Admin Building, Room 201',
    workingHours: '8:00 AM - 5:00 PM'
  });

  // Account Settings State
  const [accountSettings, setAccountSettings] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    twoFactorEnabled: true,
    loginNotifications: true,
    sessionTimeout: '30'
  });

  // Handle form changes
  const handleProfileChange = (field, value) => {
    setProfileSettings(prev => ({
      ...prev,
      [field]: value
    }));
    setHasUnsavedChanges(true);
  };

  const handleAccountChange = (field, value) => {
    setAccountSettings(prev => ({
      ...prev,
      [field]: value
    }));
    setHasUnsavedChanges(true);
  };

  // Save functions
  const saveSettings = () => {
    // Here you would typically send to API
    console.log('Saving settings for section:', activeSection);
    console.log('Profile:', profileSettings);
    console.log('Account:', accountSettings);
    
    alert('Settings saved successfully!');
    setHasUnsavedChanges(false);
  };

  const resetSettings = () => {
    if (window.confirm('Are you sure you want to reset all changes? This action cannot be undone.')) {
      // Reset to default values based on active section
      switch(activeSection) {
        case 'profile':
          setProfileSettings({
            firstName: 'David',
            lastName: 'Anderson',
            email: 'david.anderson@school.edu',
            phone: '+1 (555) 123-4567',
            department: 'Computer Science',
            position: 'Schedule Admin',
            bio: 'Experienced administrator with 10+ years in educational technology and student information systems.',
            officeLocation: 'Admin Building, Room 201',
            workingHours: '8:00 AM - 5:00 PM'
          });
          break;
        case 'account':
          setAccountSettings({
            currentPassword: '',
            newPassword: '',
            confirmPassword: '',
            twoFactorEnabled: true,
            loginNotifications: true,
            sessionTimeout: '30'
          });
          break;
      }
      setHasUnsavedChanges(false);
      alert('Settings reset to defaults');
    }
  };

  const deleteAccount = () => {
    if (window.confirm('Are you sure you want to delete your account? This action cannot be undone and will permanently remove all your data.')) {
      console.log('Account deletion requested');
      alert('Account deletion request has been submitted. You will receive an email confirmation shortly.');
    }
  };

  // Settings sections configuration (system preferences removed)
  const settingsSections = [
    { id: 'profile', label: 'Profile', icon: '👤' },
    { id: 'account', label: 'Account & Security', icon: '🔒' }
  ];

  // Render different sections
  const renderProfileSection = () => (
    <div className="settings-section-content">
      <div className="settings-profile-photo-section">
        <div className="settings-profile-photo">
          {profileSettings.firstName.charAt(0)}{profileSettings.lastName.charAt(0)}
        </div>
        <div className="settings-profile-photo-info">
          <h3 className="settings-profile-photo-title">Profile Photo</h3>
          <p className="settings-profile-photo-desc">
            Update your profile photo to help colleagues recognize you
          </p>
          <div className="settings-profile-photo-actions">
            <button className="settings-btn settings-btn-primary settings-btn-small">
              Upload Photo
            </button>
            <button className="settings-btn settings-btn-secondary settings-btn-small">
              Remove
            </button>
          </div>
        </div>
      </div>

      <div className="settings-form-row">
        <div className="settings-form-group">
          <label className="settings-form-label">First Name *</label>
          <input
            type="text"
            className="settings-form-input"
            value={profileSettings.firstName}
            onChange={(e) => handleProfileChange('firstName', e.target.value)}
            placeholder="Enter your first name"
          />
        </div>
        <div className="settings-form-group">
          <label className="settings-form-label">Last Name *</label>
          <input
            type="text"
            className="settings-form-input"
            value={profileSettings.lastName}
            onChange={(e) => handleProfileChange('lastName', e.target.value)}
            placeholder="Enter your last name"
          />
        </div>
      </div>

      <div className="settings-form-group">
        <label className="settings-form-label">Email Address *</label>
        <input
          type="email"
          className="settings-form-input"
          value={profileSettings.email}
          onChange={(e) => handleProfileChange('email', e.target.value)}
          placeholder="Enter your email address"
        />
      </div>

      <div className="settings-form-row">   
        <div className="settings-form-group">
          <label className="settings-form-label">Phone Number</label>
          <input
            type="tel"
            className="settings-form-input"
            value={profileSettings.phone}
            onChange={(e) => handleProfileChange('phone', e.target.value)}
            placeholder="Enter your phone number"
          />
        </div>
        <div className="settings-form-group">
          <label className="settings-form-label">Department</label>
          <select
            className="settings-form-select"
            value={profileSettings.department}
            onChange={(e) => handleProfileChange('department', e.target.value)}
          >
            <option value="">Select Department</option>
            <option value="Computer Science">Computer Science</option>
            <option value="Information Technology">Information Technology</option>
            <option value="Engineering">Engineering</option>
            <option value="Mathematics">Mathematics</option>
            <option value="Administration">Administration</option>
          </select>
        </div>
      </div>

      <div className="settings-form-row">
        <div className="settings-form-group">
          <label className="settings-form-label">Position</label>
          <input
            type="text"
            className="settings-form-input"
            value={profileSettings.position}
            onChange={(e) => handleProfileChange('position', e.target.value)}
            placeholder="Enter your position"
          />
        </div>
        <div className="settings-form-group">
          <label className="settings-form-label">Office Location</label>
          <input
            type="text"
            className="settings-form-input"
            value={profileSettings.officeLocation}
            onChange={(e) => handleProfileChange('officeLocation', e.target.value)}
            placeholder="Enter your office location"
          />
        </div>
      </div>

      <div className="settings-form-group">
        <label className="settings-form-label">Working Hours</label>
        <input
          type="text"
          className="settings-form-input"
          value={profileSettings.workingHours}
          onChange={(e) => handleProfileChange('workingHours', e.target.value)}
          placeholder="e.g., 9:00 AM - 5:00 PM"
        />
      </div>

      <div className="settings-form-group">
        <label className="settings-form-label">Bio</label>
        <div className="settings-form-sublabel">
          Tell others about yourself and your role in the organization
        </div>
        <textarea
          className="settings-form-textarea"
          value={profileSettings.bio}
          onChange={(e) => handleProfileChange('bio', e.target.value)}
          placeholder="Write a brief bio about yourself..."
        />
      </div>
    </div>
  );

  const renderAccountSection = () => (
    <div className="settings-section-content">
      <div className="settings-info-box">
        <h4 className="settings-info-box-title">Password Security</h4>
        <p className="settings-info-box-desc">
          Use a strong password that's at least 8 characters long and includes numbers, letters, and special characters.
        </p>
      </div>

      <div className="settings-form-group">
        <label className="settings-form-label">Current Password</label>
        <input
          type="password"
          className="settings-form-input"
          value={accountSettings.currentPassword}
          onChange={(e) => handleAccountChange('currentPassword', e.target.value)}
          placeholder="Enter your current password"
        />
      </div>

      <div className="settings-form-row">
        <div className="settings-form-group">
          <label className="settings-form-label">New Password</label>
          <input
            type="password"
            className="settings-form-input"
            value={accountSettings.newPassword}
            onChange={(e) => handleAccountChange('newPassword', e.target.value)}
            placeholder="Enter new password"
          />
        </div>
        <div className="settings-form-group">
          <label className="settings-form-label">Confirm New Password</label>
          <input
            type="password"
            className="settings-form-input"
            value={accountSettings.confirmPassword}
            onChange={(e) => handleAccountChange('confirmPassword', e.target.value)}
            placeholder="Confirm new password"
          />
        </div>
      </div>

      <hr className="settings-divider" />

      <div className="settings-form-group">
        <div className="settings-form-checkbox-group">
          <input
            type="checkbox"
            className="settings-form-checkbox"
            checked={accountSettings.twoFactorEnabled}
            onChange={(e) => handleAccountChange('twoFactorEnabled', e.target.checked)}
            id="twoFactor"
          />
          <label htmlFor="twoFactor" className="settings-form-checkbox-label">
            Enable Two-Factor Authentication
            <div className="settings-form-checkbox-desc">
              Add an extra layer of security to your account with 2FA
            </div>
          </label>
        </div>
      </div>

      <div className="settings-form-group">
        <div className="settings-form-checkbox-group">
          <input
            type="checkbox"
            className="settings-form-checkbox"
            checked={accountSettings.loginNotifications}
            onChange={(e) => handleAccountChange('loginNotifications', e.target.checked)}
            id="loginNotifications"
          />
          <label htmlFor="loginNotifications" className="settings-form-checkbox-label">
            Login Notifications
            <div className="settings-form-checkbox-desc">
              Get notified when someone logs into your account
            </div>
          </label>
        </div>
      </div>

      <div className="settings-form-group">
        <label className="settings-form-label">Session Timeout</label>
        <div className="settings-form-sublabel">
          Automatically log out after period of inactivity
        </div>
        <select
          className="settings-form-select"
          value={accountSettings.sessionTimeout}
          onChange={(e) => handleAccountChange('sessionTimeout', e.target.value)}
        >
          <option value="15">15 minutes</option>
          <option value="30">30 minutes</option>
          <option value="60">1 hour</option>
          <option value="240">4 hours</option>
          <option value="480">8 hours</option>
        </select>
      </div>

      <div className="settings-danger-zone">
        <h4 className="settings-danger-title">Danger Zone</h4>
        <p className="settings-danger-desc">
          Once you delete your account, there is no going back. Please be certain.
        </p>
        <button className="settings-btn settings-btn-danger" onClick={deleteAccount}>
          Delete Account
        </button>
      </div>
    </div>
  );

  // Get current section data
  const getCurrentSectionData = () => {
    switch(activeSection) {
      case 'profile':
        return {
          title: 'Profile Settings',
          description: 'Manage your personal information and profile details',
          content: renderProfileSection()
        };
      case 'account':
        return {
          title: 'Account & Security',
          description: 'Manage your account security and authentication settings',
          content: renderAccountSection()
        };
      default:
        return {
          title: 'Settings',
          description: 'Configure your preferences',
          content: <div>Select a section to configure</div>
        };
    }
  };

  const currentSection = getCurrentSectionData();

  return (
    <div className="settings-container">
      {/* Sidebar */}
      <Sidebar userInfo={getUserInfo()} />

      <div className="settings-main-content">
        <div className="settings-header">
          <h1 className="settings-title">Settings</h1>
          <p className="settings-subtitle">Manage your account and system preferences</p>
        </div>

        <div className="settings-content-wrapper">
          <div className="settings-nav-section">
            <div className="settings-nav-header">
              <h2 className="settings-nav-title">Configuration</h2>
            </div>
            <div className="settings-nav-list">
              {settingsSections.map((section) => (
                <div
                  key={section.id}
                  className={`settings-nav-item ${activeSection === section.id ? 'settings-nav-item-active' : ''}`}
                  onClick={() => setActiveSection(section.id)}
                >
                  <span className="settings-nav-icon">{section.icon}</span>
                  {section.label}
                </div>
              ))}
            </div>
          </div>

          <div className="settings-main-section">
            <div className="settings-section-header">
              <h2 className="settings-section-title">{currentSection.title}</h2>
              <p className="settings-section-desc">{currentSection.description}</p>
            </div>
            
            {currentSection.content}

            <div className="settings-action-buttons">
              <button 
                className="settings-btn settings-btn-secondary" 
                onClick={resetSettings}
              >
                Reset Changes
              </button>
              <button 
                className={`settings-btn settings-btn-primary ${!hasUnsavedChanges ? 'settings-btn-primary:disabled' : ''}`}
                onClick={saveSettings}
                disabled={!hasUnsavedChanges}
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentSettings;