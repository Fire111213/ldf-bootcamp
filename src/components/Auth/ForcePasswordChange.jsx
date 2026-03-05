import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { auth, db } from '../../firebase/config';
import { updatePassword, EmailAuthProvider, reauthenticateWithCredential, signOut } from 'firebase/auth';
import { doc, updateDoc, serverTimestamp, setDoc, getDoc } from 'firebase/firestore';

const ForcePasswordChange = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser, userData, updateUserData, logout } = useAuth();
  
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [userInfo, setUserInfo] = useState(null);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    // Get user info from location state or from auth context
    if (location.state) {
      setUserInfo(location.state);
    } else if (userData) {
      setUserInfo({
        forceNumber: userData.forceNumber,
        email: userData.email,
        fullName: userData.fullName
      });
    } else if (currentUser) {
      // Try to get user data from Firestore
      const fetchUserData = async () => {
        try {
          const userDoc = await getDoc(doc(db, 'bootcampers', currentUser.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            setUserInfo({
              forceNumber: data.forceNumber || 'unknown',
              email: data.email || currentUser.email,
              fullName: data.fullName || currentUser.email.split('@')[0]
            });
          } else {
            setUserInfo({
              forceNumber: 'unknown',
              email: currentUser.email,
              fullName: currentUser.email.split('@')[0]
            });
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
          setUserInfo({
            forceNumber: 'unknown',
            email: currentUser.email,
            fullName: currentUser.email.split('@')[0]
          });
        }
      };
      
      fetchUserData();
    }
  }, [location.state, userData, currentUser]);

  const validatePassword = (password) => {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
    
    if (password.length < minLength) {
      return 'Password must be at least 8 characters long';
    }
    if (!hasUpperCase) {
      return 'Password must contain at least one uppercase letter';
    }
    if (!hasLowerCase) {
      return 'Password must contain at least one lowercase letter';
    }
    if (!hasNumbers) {
      return 'Password must contain at least one number';
    }
    if (!hasSpecialChar) {
      return 'Password must contain at least one special character';
    }
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    setLoading(true);

    // Validation
    const newErrors = {};
    
    if (!formData.currentPassword) {
      newErrors.currentPassword = 'Current password is required';
    }
    
    const passwordError = validatePassword(formData.newPassword);
    if (passwordError) {
      newErrors.newPassword = passwordError;
    }
    
    if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    if (formData.currentPassword === formData.newPassword) {
      newErrors.newPassword = 'New password must be different from current password';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setLoading(false);
      return;
    }

    try {
      if (!currentUser) {
        throw new Error('No user logged in');
      }

      console.log('Attempting to reauthenticate user:', currentUser.email);
      
      // Re-authenticate user with current password
      const credential = EmailAuthProvider.credential(
        currentUser.email,
        formData.currentPassword
      );
      
      await reauthenticateWithCredential(currentUser, credential);
      console.log('Reauthentication successful');
      
      // Update password in Firebase Auth
      await updatePassword(currentUser, formData.newPassword);
      console.log('Password updated in Firebase Auth');
      
      // Update user document in Firestore
      if (currentUser.uid) {
        const updateData = {
          passwordChanged: true,
          updatedAt: serverTimestamp(),
          lastPasswordChange: new Date().toISOString()
        };
        
        // First, check if document exists in bootcampers collection
        const bootcamperDoc = await getDoc(doc(db, 'bootcampers', currentUser.uid));
        if (bootcamperDoc.exists()) {
          await updateDoc(doc(db, 'bootcampers', currentUser.uid), updateData);
          console.log('Updated bootcampers collection');
        } else {
          // Create the document if it doesn't exist
          const userData = {
            email: currentUser.email,
            uid: currentUser.uid,
            role: 'bootcamper',
            status: 'active',
            createdAt: serverTimestamp(),
            ...updateData
          };
          await setDoc(doc(db, 'bootcampers', currentUser.uid), userData);
          console.log('Created document in bootcampers collection');
        }
        
        // Also update/create in users collection for compatibility
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (userDoc.exists()) {
          await updateDoc(doc(db, 'users', currentUser.uid), updateData);
          console.log('Updated users collection');
        } else {
          // Create if doesn't exist
          const userData = {
            email: currentUser.email,
            uid: currentUser.uid,
            role: 'bootcamper',
            status: 'active',
            createdAt: serverTimestamp(),
            ...updateData
          };
          await setDoc(doc(db, 'users', currentUser.uid), userData);
          console.log('Created document in users collection');
        }
      }
      
      // Update local state
      if (updateUserData) {
        await updateUserData({
          passwordChanged: true,
          lastPasswordChange: new Date().toISOString()
        });
      }
      
      // Update localStorage
      const storedUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
      localStorage.setItem('currentUser', JSON.stringify({
        ...storedUser,
        passwordChanged: true,
        lastPasswordChange: new Date().toISOString()
      }));
      
      setSuccess(true);
      setLoading(false);
      
      // Show success message for 2 seconds, then redirect
      setTimeout(() => {
        navigate('/bootcamper/dashboard');
      }, 2000);
      
    } catch (error) {
      console.error('Password change error:', error.code, error.message);
      setLoading(false);
      
      let errorMessage = 'Failed to change password. Please try again.';
      
      if (error.code === 'auth/wrong-password') {
        errorMessage = 'Current password is incorrect';
      } else if (error.code === 'auth/invalid-credential') {
        errorMessage = 'Invalid current password. Please enter the correct password you used during registration.';
      } else if (error.code === 'auth/requires-recent-login') {
        errorMessage = 'Session expired. Please logout and login again.';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'New password is too weak. Please use a stronger password.';
      } else if (error.code === 'auth/network-request-failed') {
        errorMessage = 'Network error. Please check your internet connection.';
      }
      
      setErrors({ general: errorMessage });
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleSkipForNow = () => {
    // Temporarily bypass password change (for development/testing only)
    // In production, this should be removed or restricted to admins
    const confirmSkip = window.confirm(
      'Are you sure you want to skip password change? ' +
      'This is not recommended for security. ' +
      'You will be required to change password on next login.'
    );
    
    if (confirmSkip) {
      navigate('/bootcamper/dashboard');
    }
  };

  return (
    <div className="force-password-change-container">
      <div className="force-password-change-card">
        <div className="header">
          <h1>Password Change Required</h1>
          <p className="subtitle">
            For security reasons, you must change your password on first login
          </p>
        </div>

        {userInfo && (
          <div className="user-info-alert">
            <div className="alert alert-info">
              <div className="user-details">
                <div>
                  <span className="label">Name:</span>
                  <span className="value">{userInfo.fullName}</span>
                </div>
                {userInfo.forceNumber && userInfo.forceNumber !== 'unknown' && (
                  <div>
                    <span className="label">Force Number:</span>
                    <span className="value">{userInfo.forceNumber}</span>
                  </div>
                )}
                <div>
                  <span className="label">Email:</span>
                  <span className="value">{userInfo.email}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {success ? (
          <div className="success-message">
            <div className="alert alert-success">
              <h4>✅ Password Changed Successfully!</h4>
              <p>Your password has been updated successfully.</p>
              <p>You will be redirected to your dashboard in a few seconds...</p>
              <div className="spinner spinner-sm mt-3"></div>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {errors.general && (
              <div className="alert alert-danger">
                <strong>Error:</strong> {errors.general}
              </div>
            )}

            <div className="form-group">
              <label className="form-label required">Current Password</label>
              <div className="password-input-container">
                <input
                  type={showCurrentPassword ? "text" : "password"}
                  className={`form-control ${errors.currentPassword ? 'error' : ''}`}
                  value={formData.currentPassword}
                  onChange={(e) => setFormData({...formData, currentPassword: e.target.value})}
                  placeholder="Enter your current password"
                  disabled={loading}
                  autoComplete="current-password"
                />
                <button 
                  type="button" 
                  className="password-toggle-btn"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  disabled={loading}
                  tabIndex="-1"
                >
                  {showCurrentPassword ? '🙈' : '👁️'}
                </button>
              </div>
              {errors.currentPassword && (
                <div className="alert alert-danger">{errors.currentPassword}</div>
              )}
              <small className="form-text">
                Enter the password you used during registration
              </small>
            </div>

            <div className="form-group">
              <label className="form-label required">New Password</label>
              <div className="password-input-container">
                <input
                  type={showNewPassword ? "text" : "password"}
                  className={`form-control ${errors.newPassword ? 'error' : ''}`}
                  value={formData.newPassword}
                  onChange={(e) => setFormData({...formData, newPassword: e.target.value})}
                  placeholder="Enter new password"
                  disabled={loading}
                  autoComplete="new-password"
                />
                <button 
                  type="button" 
                  className="password-toggle-btn"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  disabled={loading}
                  tabIndex="-1"
                >
                  {showNewPassword ? '🙈' : '👁️'}
                </button>
              </div>
              {errors.newPassword && (
                <div className="alert alert-danger">{errors.newPassword}</div>
              )}
              <div className="password-requirements">
                <small className="form-text">
                  <strong>Password Requirements:</strong>
                </small>
                <ul className="requirements-list">
                  <li className={formData.newPassword.length >= 8 ? 'valid' : ''}>
                    {formData.newPassword.length >= 8 ? '✓' : '○'} At least 8 characters
                  </li>
                  <li className={/[A-Z]/.test(formData.newPassword) ? 'valid' : ''}>
                    {/[A-Z]/.test(formData.newPassword) ? '✓' : '○'} One uppercase letter
                  </li>
                  <li className={/[a-z]/.test(formData.newPassword) ? 'valid' : ''}>
                    {/[a-z]/.test(formData.newPassword) ? '✓' : '○'} One lowercase letter
                  </li>
                  <li className={/\d/.test(formData.newPassword) ? 'valid' : ''}>
                    {/\d/.test(formData.newPassword) ? '✓' : '○'} One number
                  </li>
                  <li className={/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(formData.newPassword) ? 'valid' : ''}>
                    {/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(formData.newPassword) ? '✓' : '○'} One special character
                  </li>
                </ul>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label required">Confirm New Password</label>
              <div className="password-input-container">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  className={`form-control ${errors.confirmPassword ? 'error' : ''}`}
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                  placeholder="Confirm new password"
                  disabled={loading}
                  autoComplete="new-password"
                />
                <button 
                  type="button" 
                  className="password-toggle-btn"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  disabled={loading}
                  tabIndex="-1"
                >
                  {showConfirmPassword ? '🙈' : '👁️'}
                </button>
              </div>
              {errors.confirmPassword && (
                <div className="alert alert-danger">{errors.confirmPassword}</div>
              )}
              <small className="form-text">
                Re-enter your new password to confirm
              </small>
            </div>

            <div className="form-actions">
              <div className="button-group">
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={handleLogout}
                  disabled={loading}
                >
                  Logout
                </button>
                
                {/* Development only - remove in production */}
                {process.env.NODE_ENV === 'development' && (
                  <button
                    type="button"
                    className="btn btn-warning"
                    onClick={handleSkipForNow}
                    disabled={loading}
                  >
                    Skip For Now (Dev Only)
                  </button>
                )}
                
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="spinner spinner-sm"></span>
                      Changing Password...
                    </>
                  ) : (
                    'Change Password'
                  )}
                </button>
              </div>
            </div>

            <div className="help-section">
              <div className="alert alert-info">
                <strong>ℹ️ Need Help?</strong>
                <ul>
                  <li>If you forgot your current password, contact the administrator</li>
                  <li>Make sure you're entering the exact password used during registration</li>
                  <li>Password is case-sensitive</li>
                  <li>Contact: <strong>lesothodefenceforceydp244@gmail.com</strong></li>
                </ul>
              </div>
            </div>
          </form>
        )}

        <div className="footer-links">
          <p className="text-center text-muted small">
            <strong>System Security:</strong> Password change on first login is required for account security.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ForcePasswordChange;