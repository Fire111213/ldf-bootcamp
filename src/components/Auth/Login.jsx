import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated, userRole, loading, resetPassword } = useAuth();
  
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [errors, setErrors] = useState({});
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [fromRegister, setFromRegister] = useState(false);
  const [logoError, setLogoError] = useState(false);

  useEffect(() => {
    if (location.state?.fromRegister) {
      setFromRegister(true);
      setFormData({
        email: location.state.email || '',
        password: ''
      });
    }
  }, [location]);

  useEffect(() => {
    if (isAuthenticated && !loading) {
      if (userRole === 'admin') {
        navigate('/admin/dashboard');
      } else if (userRole === 'bootcamper') {
        navigate('/bootcamper/dashboard');
      }
    }
  }, [isAuthenticated, userRole, loading, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    setIsLoggingIn(true);

    const newErrors = {};
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setIsLoggingIn(false);
      return;
    }

    const result = await login(formData.email, formData.password);
    
    if (result.success) {
      setFormData({ email: '', password: '' });
      setFromRegister(false);
    } else {
      setErrors({ general: result.error });
      setIsLoggingIn(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleResetPassword = async () => {
    if (!formData.email) {
      setErrors({ general: 'Please enter your email first' });
      return;
    }
    
    const result = await resetPassword(formData.email);
    if (result.success) {
      setErrors({ general: 'Password reset email sent. Check your inbox.' });
    } else {
      setErrors({ general: result.error || 'Failed to send reset email' });
    }
  };

  if (loading) {
    return (
      <div className="login-container">
        <div className="login-card">
          <div className="loading-screen">
            <div className="spinner"></div>
            <p>Checking authentication...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="login-container">
      <div className="login-card">
        {fromRegister && (
          <div className="alert alert-success">
            <strong>🎉 Registration Successful!</strong>
            <p>Please login with your new account.</p>
            {formData.email && (
              <p><small>Email: <strong>{formData.email}</strong></small></p>
            )}
          </div>
        )}

        {/* Logo Header Section - Properly Centered */}
        <div className="login-header">
          <div className="logo-section">
            <div className="logo-wrapper">
              {!logoError ? (
                <img 
                  src="/images/ldf-logo.png" 
                  alt="LDF Logo" 
                  className="logo-image"
                  onError={() => setLogoError(true)}
                />
              ) : (
                <div className="logo-fallback">LDF</div>
              )}
            </div>
            <div className="system-title">
              <h1>LDF YOUTH DEVELOPMENT</h1>
              <h2>PROGRAM</h2>
              <h3>Management System</h3>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          {errors.general && (
            <div className={`alert ${errors.general.includes('sent') ? 'alert-success' : 'alert-danger'}`}>
              <strong>{errors.general.includes('sent') ? 'Success:' : 'Error:'}</strong> {errors.general}
            </div>
          )}

          <div className="form-group">
            <label className="form-label" htmlFor="email">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              className={`form-control ${errors.email ? 'error' : ''}`}
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value.trim()})}
              placeholder="your.email@example.com"
              disabled={isLoggingIn}
              autoComplete="email"
            />
            {errors.email && (
              <div className="alert alert-danger">{errors.email}</div>
            )}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">
              Password
            </label>
            <div className="password-input-container">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                className={`form-control ${errors.password ? 'error' : ''}`}
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                placeholder="Enter your password"
                disabled={isLoggingIn}
                autoComplete="current-password"
              />
              <button 
                type="button" 
                className="password-toggle-btn"
                onClick={togglePasswordVisibility}
                disabled={isLoggingIn}
                tabIndex="-1"
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
            {errors.password && (
              <div className="alert alert-danger">{errors.password}</div>
            )}
          </div>

          <div className="form-group">
            <button
              type="submit"
              className="btn btn-primary btn-block login-btn"
              disabled={isLoggingIn}
            >
              {isLoggingIn ? (
                <>
                  <span className="spinner spinner-sm"></span>
                  Authenticating...
                </>
              ) : (
                'Login to Dashboard'
              )}
            </button>
          </div>

          <div className="login-links">
            <div className="links-section">
              <p className="text-muted">
                <Link to="/register" className="text-primary register-link">
                  <strong>Register as Bootcamper</strong>
                </Link>
              </p>
            </div>
            
            <div className="links-section">
              <p className="text-muted small">
                <button 
                  type="button" 
                  className="btn-link support-link"
                  onClick={handleResetPassword}
                  disabled={isLoggingIn}
                >
                  Forgot Password?
                </button>
              </p>
            </div>
          </div>

          <div className="support-footer">
            <p className="text-center text-muted small">
              <strong>For support, contact:</strong>{' '}
              <a href="mailto:lesothodefenceforce04@gmail.com" className="support-link">
                lesothodefenceforce04@gmail.com
              </a>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;