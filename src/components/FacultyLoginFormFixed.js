// FIXED LOGIN COMPONENT FOR SPRING SECURITY
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api-fixed';
import './LoginForm.css';

const FacultyLoginFormFixed = () => {
  const [credentials, setCredentials] = useState({
    username: '',
    password: '',
    role: 'FACULTY' // Fixed role for faculty login
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCredentials(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!credentials.username || !credentials.password) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    setError('');

    try {
      console.log('Attempting login with credentials:', {
        username: credentials.username,
        role: credentials.role
      });

      const result = await authAPI.login(credentials);
      
      if (result.success) {
        console.log('Login successful:', result.data);
        
        // Verify the role matches
        if (result.data.role !== 'FACULTY') {
          setError('Invalid role for faculty login');
          localStorage.clear(); // Clear any stored data
          return;
        }
        
        // Redirect to faculty dashboard
        navigate('/faculty-dashboard');
      } else {
        console.error('Login failed:', result.message);
        setError(result.message || 'Login failed. Please check your credentials.');
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-form-container">
      <form onSubmit={handleSubmit} className="login-form">
        <h2>Faculty Login</h2>
        
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}
        
        <div className="form-group">
          <label htmlFor="username">Username:</label>
          <input
            type="text"
            id="username"
            name="username"
            value={credentials.username}
            onChange={handleChange}
            disabled={loading}
            autoComplete="username"
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="password">Password:</label>
          <input
            type="password"
            id="password"
            name="password"
            value={credentials.password}
            onChange={handleChange}
            disabled={loading}
            autoComplete="current-password"
            required
          />
        </div>
        
        <button 
          type="submit" 
          className="login-button"
          disabled={loading}
        >
          {loading ? 'Logging in...' : 'Login'}
        </button>
        
        <div className="login-info">
          <p>Logging in as: <strong>Faculty</strong></p>
          <p>Need to login as a different role? 
            <button 
              type="button" 
              onClick={() => navigate('/login')}
              className="link-button"
              disabled={loading}
            >
              Go to main login
            </button>
          </p>
        </div>
      </form>
    </div>
  );
};

export default FacultyLoginFormFixed;
