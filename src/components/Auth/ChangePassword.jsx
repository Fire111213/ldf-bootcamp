import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { validatePassword } from '../../utils/validators';

const ChangePassword = () => {
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrors({});
    setMessage('');

    const email = localStorage.getItem('currentEmail');
    const forceNumber = localStorage.getItem('currentForceNumber');
    const bootcampers = JSON.parse(localStorage.getItem('bootcampers') || '[]');
    
    // Find bootcamper by email or force number
    const bootcamper = bootcampers.find(b => 
      b.email === email || b.forceNumber === forceNumber
    );

    if (!bootcamper) {
      setErrors({ general: 'Bootcamper not found. Please login again.' });
      return;
    }

    const newErrors = {};

    // Check current password
    if (!formData.currentPassword) {
      newErrors.currentPassword = 'Current password is required';
    } else if (formData.currentPassword !== bootcamper.password) {
      newErrors.currentPassword = 'Current password is incorrect';
    }

    // Validate new password
    if (!formData.newPassword) {
      newErrors.newPassword = 'New password is required';
    } else if (!validatePassword(formData.newPassword)) {
      newErrors.newPassword = 'Password must be at least 8 characters with uppercase, lowercase, number and special character';
    } else if (formData.newPassword === formData.currentPassword) {
      newErrors.newPassword = 'New password must be different from current password';
    }

    // Confirm password
    if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);

    // Update password
    setTimeout(() => {
      const updatedBootcampers = bootcampers.map(b => {
        if (b.email === email || b.forceNumber === forceNumber) {
          return {
            ...b,
            password: formData.newPassword,
            passwordChanged: true,
            updatedAt: new Date().toISOString()
          };
        }
        return b;
      });

      localStorage.setItem('bootcampers', JSON.stringify(updatedBootcampers));
      setLoading(false);
      setMessage('Password changed successfully!');

      // Clear form
      setFormData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });

      // Redirect after 2 seconds
      setTimeout(() => {
        navigate('/bootcamper/dashboard');
      }, 2000);
    }, 1000);
  };

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="dashboard-welcome">
          <h1>Change Password</h1>
          <div className="welcome-info">
            <span className="welcome-text">Update your account password</span>
          </div>
        </div>
        <button onClick={() => navigate('/bootcamper/dashboard')} className="btn btn-outline">
          Back to Dashboard
        </button>
      </header>
      
      <div className="dashboard-content">
        <div className="card">
          <div className="card-header">
            <h2>Password Update</h2>
            <p className="text-muted">Update your account password for security</p>
          </div>
          
          <div className="card-body">
            {errors.general && (
              <div className="alert alert-danger">{errors.general}</div>
            )}
            
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label required">Current Password</label>
                <input
                  type="password"
                  className={`form-control ${errors.currentPassword ? 'error' : ''}`}
                  value={formData.currentPassword}
                  onChange={(e) => setFormData({...formData, currentPassword: e.target.value})}
                  placeholder="Enter current password"
                  disabled={loading}
                />
                {errors.currentPassword && (
                  <div className="alert alert-danger">{errors.currentPassword}</div>
                )}
              </div>

              <div className="form-group">
                <label className="form-label required">New Password</label>
                <input
                  type="password"
                  className={`form-control ${errors.newPassword ? 'error' : ''}`}
                  value={formData.newPassword}
                  onChange={(e) => setFormData({...formData, newPassword: e.target.value})}
                  placeholder="Enter new password"
                  disabled={loading}
                />
                {errors.newPassword && (
                  <div className="alert alert-danger">{errors.newPassword}</div>
                )}
                <small className="form-text">
                  Minimum 8 characters with letters, numbers, and special characters
                </small>
              </div>

              <div className="form-group">
                <label className="form-label required">Confirm New Password</label>
                <input
                  type="password"
                  className={`form-control ${errors.confirmPassword ? 'error' : ''}`}
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                  placeholder="Confirm new password"
                  disabled={loading}
                />
                {errors.confirmPassword && (
                  <div className="alert alert-danger">{errors.confirmPassword}</div>
                )}
              </div>

              <div className="form-actions">
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? (
                    <>
                      <span className="spinner spinner-sm mr-2"></span>
                      Changing Password...
                    </>
                  ) : 'Change Password'}
                </button>
                <button 
                  type="button" 
                  className="btn btn-outline ml-2"
                  onClick={() => navigate('/bootcamper/dashboard')}
                  disabled={loading}
                >
                  Cancel
                </button>
              </div>
              
              {message && (
                <div className="alert alert-success mt-3">
                  <strong>Success!</strong> {message}
                </div>
              )}
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChangePassword;