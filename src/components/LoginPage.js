import React from 'react';
import './LoginPage.css';
import { FaGraduationCap, FaUserTie, FaChevronRight } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom'; // Import useNavigate

// Ensure you have logo.png in frontend/src/assets/images/
const logo = require('../assets/images/logo.png');

const LoginPage = () => {
  const navigate = useNavigate(); // Get the navigate function

  // Update the handler to use navigate
  const handleRoleSelection = (role) => {
    console.log(`Navigating to ${role} login view`);
    if (role === 'student') {
      navigate('/login/student'); // Navigate to student route
    } else if (role === 'faculty' || role === 'admin') {
      navigate('/login/faculty'); // Navigate to faculty/admin route
    }
  };

  return (
    <div className="login-page">
      {/* Left Side - Image Section */}
       <div className="login-image-section">
            <div className="login-logo">
                 <img src={logo} alt="Academy Logo" />
            </div>
            <div className="login-image-text">
              <h2>Science and Technology Academy</h2>
              <p>Helping students step towards brighter tomorrow.</p>
            </div>
        </div>


      {/* Right Side - Form/Selection Section */}
      <div className="login-form-section">
         <h1>Hi!</h1>
         <p className="continue-as-label">Continue as</p>

        {/* Role Selection: Student */}
        <button
          className="role-button"
          onClick={() => handleRoleSelection('student')}
          aria-label="Continue as Student"
        >
          <div className="role-button-content">
            <span className="role-button-icon"><FaGraduationCap /></span>
            <span className="role-button-text">Student</span>
          </div>
          <span className="role-button-arrow"><FaChevronRight /></span>
        </button>

        {/* Role Selection: Faculty/Admin */}
        <button
          className="role-button"
          onClick={() => handleRoleSelection('faculty')}
          aria-label="Continue as Faculty or Administrator"
        >
          <div className="role-button-content">
            <span className="role-button-icon"><FaUserTie /></span>
            <span className="role-button-text">Faculty / Administrator</span>
          </div>
          <span className="role-button-arrow"><FaChevronRight /></span>
        </button>

        {/* Footer Links */}
        <div className="login-footer">
            {/* Replace # with actual links eventually */}
            <a href="#">Privacy Policy</a>
            <a href="#">About Us</a>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;