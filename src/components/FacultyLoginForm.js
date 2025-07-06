import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useFacultyData } from '../hooks/useFacultyData';
import { useAdminData } from '../hooks/useAdminData';
import './LoginForm.css';
import { authAPI } from '../services/api-fixed';

const FacultyLoginForm = () => {
    const [credentials, setCredentials] = useState({
        username: '',
        password: '',
        role: 'FACULTY'
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const { setFacultyInfo } = useFacultyData();
    const { setAdminInfo } = useAdminData();

    // Modal state
    const [showModal, setShowModal] = useState(false);
    const [modalStep, setModalStep] = useState(1); // 1: Faculty ID & Email, 2: Verification Code, 3: New Password
    const [facultyId, setFacultyId] = useState('');
    const [email, setEmail] = useState('');
    const [verificationCode, setVerificationCode] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [modalError, setModalError] = useState('');
    const [modalLoading, setModalLoading] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setCredentials(prev => ({
            ...prev,
            [name]: value
        }));
        // Clear error when user starts typing
        if (error) setError('');
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        
        if (!credentials.username || !credentials.password) {
            setError('Please fill in all fields');
            return;
        }

        setLoading(true);
        setError('');

        try {
            console.log('Attempting faculty login with credentials:', {
                username: credentials.username,
                role: credentials.role
            });

            // Try FACULTY login first
            let result = await authAPI.login(credentials);
            
            // If faculty login fails, try ADMIN login
            if (!result.success && (result.message?.toLowerCase().includes('role') || result.message?.toLowerCase().includes('invalid'))) {
                console.log('Faculty login failed, trying ADMIN role...');
                const adminCredentials = { ...credentials, role: 'ADMIN' };
                result = await authAPI.login(adminCredentials);
            }

            if (result.success) {
                console.log('Login Successful:', result.data);
                
                // Check user role and navigate accordingly
                if (result.data.role === 'ADMIN') {
                    // Store admin data in the admin hook
                    setAdminInfo({
                        userId: result.data.userId,
                        firstName: result.data.firstName,
                        lastName: result.data.lastName,
                        username: result.data.username,
                        role: result.data.role
                    });
                    // Navigate to admin dashboard
                    navigate('/admin-dashboard');
                } else if (result.data.role === 'FACULTY') {
                    // Store faculty data in the faculty hook
                    setFacultyInfo({
                        facultyId: result.data.facultyId,
                        firstName: result.data.firstName,
                        lastName: result.data.lastName,
                        email: result.data.email,
                        position: result.data.position,
                        program: result.data.program,
                        username: result.data.username,
                        userId: result.data.userId
                    });
                    // Navigate to faculty dashboard
                    navigate('/faculty-dashboard');
                } else {
                    setError('Invalid role for this login page. Expected FACULTY or ADMIN role.');
                }
            } else {
                // Handle specific error messages
                if (result.message && result.message.toLowerCase().includes('credentials')) {
                    setError('Invalid username or password. Please check your credentials.');
                } else if (result.message && result.message.toLowerCase().includes('role')) {
                    setError('This account does not have faculty or admin access.');
                } else {
                    setError(result.message || 'Login failed. Please try again.');
                }
            }
        } catch (err) {
            console.error('Login request failed:', err);
            setError('Network error. Please check your connection and try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleForgotPassword = () => {
        setShowModal(true);
        setModalStep(1);
        setModalError('');
        setFacultyId('');
        setEmail('');
        setVerificationCode('');
        setNewPassword('');
        setConfirmPassword('');
    };

    const handleModalSubmit = (event) => {
        event.preventDefault();
        setModalError('');
        setModalLoading(true);

        if (modalStep === 1) {
            // Simple alert for sending verification code
            setTimeout(() => {
                setModalLoading(false);
                alert('Verification code sent successfully to your email!');
                setModalStep(2);
            }, 1000);
        } else if (modalStep === 2) {
            // Simple alert for verifying code
            setTimeout(() => {
                setModalLoading(false);
                alert('Code verified successfully!');
                setModalStep(3);
            }, 1000);
        } else if (modalStep === 3) {
            // Reset password
            if (newPassword !== confirmPassword) {
                setModalError('Passwords do not match.');
                setModalLoading(false);
                return;
            }
            
            setTimeout(() => {
                setModalLoading(false);
                alert('Password reset successful! Please login with your new password.');
                setShowModal(false);
            }, 1000);
        }
    };

    const closeModal = () => {
        setShowModal(false);
        setModalStep(1);
        setModalError('');
        setFacultyId('');
        setEmail('');
        setVerificationCode('');
        setNewPassword('');
        setConfirmPassword('');
    };

    const renderModalContent = () => {
        switch (modalStep) {
            case 1:
                return (
                    <>
                        <h2 className="modal-title">Reset Password</h2>
                        <p className="modal-subtitle">Enter your Faculty ID and email to receive a verification code.</p>
                        <div className="form-group">
                            <label htmlFor="faculty-id">Faculty ID:</label>
                            <input
                                type="text"
                                id="faculty-id"
                                placeholder="Enter your Faculty ID"
                                value={facultyId}
                                onChange={(e) => setFacultyId(e.target.value)}
                                required
                                className="form-input"
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="email">Email:</label>
                            <input
                                type="email"
                                id="email"
                                placeholder="Enter your email address"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="form-input"
                            />
                        </div>
                    </>
                );
            case 2:
                return (
                    <>
                        <h2 className="modal-title">Verify Email</h2>
                        <p className="modal-subtitle">Enter the verification code sent to your email.</p>
                        <div className="form-group">
                            <label htmlFor="verification-code">Verification Code:</label>
                            <input
                                type="text"
                                id="verification-code"
                                placeholder="Enter verification code"
                                value={verificationCode}
                                onChange={(e) => setVerificationCode(e.target.value)}
                                required
                                className="form-input"
                            />
                        </div>
                    </>
                );
            case 3:
                return (
                    <>
                        <h2 className="modal-title">Set New Password</h2>
                        <p className="modal-subtitle">Enter your new password.</p>
                        <div className="form-group">
                            <label htmlFor="new-password">New Password:</label>
                            <input
                                type="password"
                                id="new-password"
                                placeholder="Enter new password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                required
                                className="form-input"
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="confirm-password">Confirm Password:</label>
                            <input
                                type="password"
                                id="confirm-password"
                                placeholder="Confirm new password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                                className="form-input"
                            />
                        </div>
                    </>
                );
            default:
                return null;
        }
    };

    return (
        <div className='login-container'>
            <div className='header'>Faculty/Admin Login Portal</div>
            <p className='subtitle'>Enter your credentials below.</p>
            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label htmlFor="faculty-username" style={{ display: 'block', marginBottom: '5px' }}>Username:</label>
                    <input
                        type="text"
                        id="faculty-username"
                        name="username"
                        placeholder="e.g., 2024-10001-F"
                        value={credentials.username}
                        onChange={handleChange}
                        required
                        className="form-input"
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="faculty-password" style={{ display: 'block', marginBottom: '5px' }}>Password:</label>
                    <input
                        type="password"
                        id="faculty-password"
                        name="password"
                        placeholder="Enter your password"
                        value={credentials.password}
                        onChange={handleChange}
                        required
                        className="form-input"
                    />
                </div>
                <button 
                    type="button" 
                    className="forgot-password"
                    onClick={handleForgotPassword}
                >
                    Forgot password?
                </button>
                {error && <p className="error-message">{error}</p>}
                <button type="submit" disabled={loading} className="sign-in-btn">
                    {loading ? 'Logging in...' : 'LOGIN'}
                </button>
            </form>
            <p className="help-text">
                <Link to="/">Back to role selection</Link>
            </p>

            {/* Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={closeModal}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <button className="modal-close" onClick={closeModal}>&times;</button>
                        <form onSubmit={handleModalSubmit}>
                            {renderModalContent()}
                            {modalError && <p className="error-message">{modalError}</p>}
                            <div className="modal-buttons">
                                <button 
                                    type="button" 
                                    className="modal-btn secondary"
                                    onClick={closeModal}
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit" 
                                    className="modal-btn primary"
                                    disabled={modalLoading}
                                >
                                    {modalLoading ? 'Processing...' : 
                                     modalStep === 1 ? 'Send Code' :
                                     modalStep === 2 ? 'Verify' :
                                     'Reset Password'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FacultyLoginForm;