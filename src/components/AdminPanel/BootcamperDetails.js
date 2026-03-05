import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { bootcamperService } from '../../firebase/firestore';

const BootcamperDetails = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [bootcamper, setBootcamper] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showResetModal, setShowResetModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [statusAction, setStatusAction] = useState('');

  useEffect(() => {
    if (location.state?.bootcamper) {
      setBootcamper(location.state.bootcamper);
      setLoading(false);
    } else {
      loadBootcamper();
    }
  }, [id, location.state]);

  const loadBootcamper = async () => {
    try {
      setLoading(true);
      const result = await bootcamperService.getBootcamperById(id);
      
      if (result.success && result.data) {
        setBootcamper(result.data);
      } else {
        console.error('Failed to load bootcamper:', result.error);
      }
    } catch (error) {
      console.error('Error loading bootcamper:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!newPassword || !confirmPassword) {
      setPasswordError('Both fields are required');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }

    if (newPassword.length < 8) {
      setPasswordError('Password must be at least 8 characters long');
      return;
    }

    try {
      const result = await bootcamperService.resetPassword(id, newPassword);
      
      if (result.success) {
        // Update local state
        setBootcamper({
          ...bootcamper,
          passwordChanged: false,
          lastPasswordReset: new Date().toISOString(),
          resetBy: 'admin'
        });

        setShowResetModal(false);
        setNewPassword('');
        setConfirmPassword('');
        setPasswordError('');
        
        alert('Password has been reset successfully!');
      } else {
        setPasswordError(result.error || 'Failed to reset password');
      }
    } catch (error) {
      console.error('Error resetting password:', error);
      setPasswordError('Error resetting password');
    }
  };

  const handleStatusChange = async (action) => {
    const newStatus = action === 'activate' ? 'active' : 'inactive';
    
    try {
      const result = await bootcamperService.updateBootcamperStatus(id, newStatus);
      
      if (result.success) {
        // Update local state
        setBootcamper({
          ...bootcamper,
          status: newStatus,
          statusChangedAt: new Date().toISOString(),
          statusChangedBy: 'admin'
        });

        setShowStatusModal(false);
        setStatusAction('');
        
        alert(`Account has been ${action}d successfully!`);
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Error updating status');
    }
  };

  const getSerialColor = (serial) => {
    const colors = {
      'Serial 1': '#4CAF50',
      'Serial 2': '#2196F3',
      'Serial 3': '#FF9800',
      'Serial 4': '#9C27B0',
      'Serial 5': '#F44336',
      'Serial 6': '#00BCD4',
      'Serial 7': '#8BC34A',
      'Serial 8': '#FF5722'
    };
    return colors[serial] || '#607D8B';
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <p>Loading bootcamper details...</p>
      </div>
    );
  }

  if (!bootcamper) {
    return (
      <div className="dashboard">
        <header className="dashboard-header">
          <div className="dashboard-welcome">
            <h1>Bootcamper Not Found</h1>
          </div>
          <div className="header-actions">
            <button onClick={() => navigate('/admin/bootcampers')} className="btn btn-outline">
              Back to List
            </button>
          </div>
        </header>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="dashboard-welcome">
          <h1>Bootcamper Details</h1>
          <p>View full information for {bootcamper.fullName}</p>
        </div>
        <div className="header-actions">
          <button onClick={() => navigate('/admin/bootcampers')} className="btn btn-outline">
            Back to List
          </button>
        </div>
      </header>
      
      <div className="dashboard-content">
        {/* Admin Actions Card */}
        <div className="card">
          <div className="card-header">
            <h2>Admin Actions</h2>
          </div>
          <div className="admin-actions-grid">
            <div className="action-item">
              <button 
                className="btn btn-warning"
                onClick={() => setShowResetModal(true)}
              >
                🔐 Reset Password
              </button>
              <p>Set a new password for this bootcamper</p>
            </div>
            
            <div className="action-item">
              {bootcamper.status === 'active' ? (
                <button 
                  className="btn btn-danger"
                  onClick={() => {
                    setStatusAction('deactivate');
                    setShowStatusModal(true);
                  }}
                >
                  ⏸️ Deactivate Account
                </button>
              ) : (
                <button 
                  className="btn btn-success"
                  onClick={() => {
                    setStatusAction('activate');
                    setShowStatusModal(true);
                  }}
                >
                  ▶️ Activate Account
                </button>
              )}
              <p>
                Current Status: 
                <span className={`status-badge ${bootcamper.status === 'active' ? 'active' : 'inactive'}`}>
                  {bootcamper.status || 'active'}
                </span>
              </p>
            </div>
            
            <div className="action-item">
              <button 
                className="btn btn-info"
                onClick={() => navigate(`/admin/edit-bootcamper/${bootcamper.id || bootcamper.uid}`)}
              >
                ✏️ Edit Profile
              </button>
              <p>Update bootcamper information</p>
            </div>
          </div>
        </div>

        {/* Personal Information Card */}
        <div className="card">
          <div className="card-header">
            <h2>Personal Information</h2>
            <span className="badge" style={{ backgroundColor: getSerialColor(bootcamper.serial) }}>
              {bootcamper.serial}
            </span>
          </div>
          <div className="bootcamper-details">
            <div className="details-section">
              <h3>Basic Info</h3>
              <div className="details-grid">
                <div className="detail-item">
                  <label>Force Number:</label>
                  <span className="detail-value">{bootcamper.forceNumber}</span>
                </div>
                <div className="detail-item">
                  <label>Full Name:</label>
                  <span className="detail-value">{bootcamper.fullName}</span>
                </div>
                <div className="detail-item">
                  <label>Email:</label>
                  <span className="detail-value">{bootcamper.email}</span>
                </div>
                <div className="detail-item">
                  <label>Phone:</label>
                  <span className="detail-value">{bootcamper.phone}</span>
                </div>
                <div className="detail-item">
                  <label>Date of Birth:</label>
                  <span className="detail-value">{bootcamper.dateOfBirth}</span>
                </div>
                <div className="detail-item">
                  <label>Age:</label>
                  <span className="detail-value">{bootcamper.age} years</span>
                </div>
                <div className="detail-item">
                  <label>ID Number:</label>
                  <span className="detail-value">{bootcamper.idNumber}</span>
                </div>
                <div className="detail-item">
                  <label>Gender:</label>
                  <span className="detail-value">{bootcamper.gender}</span>
                </div>
                <div className="detail-item">
                  <label>District:</label>
                  <span className="detail-value">{bootcamper.district}</span>
                </div>
                <div className="detail-item">
                  <label>Location:</label>
                  <span className="detail-value">{bootcamper.location}</span>
                </div>
              </div>
            </div>

            <div className="details-section">
              <h3>Education & Work</h3>
              <div className="details-grid">
                <div className="detail-item">
                  <label>Education Level:</label>
                  <span className="detail-value">{bootcamper.educationLevel}</span>
                </div>
                {bootcamper.highSchool && (
                  <div className="detail-item">
                    <label>High School:</label>
                    <span className="detail-value">{bootcamper.highSchool}</span>
                  </div>
                )}
                {bootcamper.grade && (
                  <div className="detail-item">
                    <label>Grade:</label>
                    <span className="detail-value">{bootcamper.grade}</span>
                  </div>
                )}
                {bootcamper.university && (
                  <div className="detail-item">
                    <label>University:</label>
                    <span className="detail-value">{bootcamper.university}</span>
                  </div>
                )}
                {bootcamper.course && (
                  <div className="detail-item">
                    <label>Course:</label>
                    <span className="detail-value">{bootcamper.course}</span>
                  </div>
                )}
                {bootcamper.year && (
                  <div className="detail-item">
                    <label>Year:</label>
                    <span className="detail-value">{bootcamper.year}</span>
                  </div>
                )}
                {bootcamper.workplace && (
                  <div className="detail-item">
                    <label>Workplace:</label>
                    <span className="detail-value">{bootcamper.workplace}</span>
                  </div>
                )}
                {bootcamper.position && (
                  <div className="detail-item">
                    <label>Position:</label>
                    <span className="detail-value">{bootcamper.position}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="details-section">
              <h3>Registration Details</h3>
              <div className="details-grid">
                <div className="detail-item">
                  <label>Registered On:</label>
                  <span className="detail-value">
                    {bootcamper.registeredAt ? new Date(bootcamper.registeredAt).toLocaleString() : 
                     bootcamper.createdAt ? new Date(bootcamper.createdAt).toLocaleString() : 'N/A'}
                  </span>
                </div>
                <div className="detail-item">
                  <label>Registered By:</label>
                  <span className="detail-value">{bootcamper.registeredBy || 'Admin'}</span>
                </div>
                <div className="detail-item">
                  <label>Status:</label>
                  <span className={`detail-value status-badge ${bootcamper.status === 'active' ? 'active' : 'inactive'}`}>
                    {bootcamper.status || 'Active'}
                  </span>
                </div>
                <div className="detail-item">
                  <label>Password Status:</label>
                  <span className="detail-value">
                    {bootcamper.passwordChanged ? 'Changed by User' : 'Default Password'}
                  </span>
                </div>
                {bootcamper.lastPasswordReset && (
                  <div className="detail-item">
                    <label>Last Password Reset:</label>
                    <span className="detail-value">
                      {new Date(bootcamper.lastPasswordReset).toLocaleString()}
                    </span>
                  </div>
                )}
                {bootcamper.statusChangedAt && (
                  <div className="detail-item">
                    <label>Status Last Changed:</label>
                    <span className="detail-value">
                      {new Date(bootcamper.statusChangedAt).toLocaleString()}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Reset Password Modal */}
      {showResetModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>Reset Password</h3>
              <button onClick={() => setShowResetModal(false)} className="close-btn">
                ×
              </button>
            </div>
            <div className="modal-body">
              <p>Reset password for <strong>{bootcamper.fullName}</strong> ({bootcamper.forceNumber})</p>
              <div className="form-group">
                <label className="form-label">New Password</label>
                <input
                  type="password"
                  className="form-control"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Confirm New Password</label>
                <input
                  type="password"
                  className="form-control"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                />
              </div>
              {passwordError && (
                <div className="alert alert-danger">{passwordError}</div>
              )}
              <small className="form-text">
                The bootcamper will need to change this password on their first login.
              </small>
            </div>
            <div className="modal-footer">
              <button 
                onClick={() => setShowResetModal(false)}
                className="btn btn-outline"
              >
                Cancel
              </button>
              <button 
                onClick={handleResetPassword}
                className="btn btn-warning"
              >
                Reset Password
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Status Change Modal */}
      {showStatusModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>{statusAction === 'activate' ? 'Activate' : 'Deactivate'} Account</h3>
              <button onClick={() => setShowStatusModal(false)} className="close-btn">
                ×
              </button>
            </div>
            <div className="modal-body">
              <p>
                Are you sure you want to {statusAction} the account for{' '}
                <strong>{bootcamper.fullName}</strong> ({bootcamper.forceNumber})?
              </p>
              {statusAction === 'deactivate' ? (
                <div className="alert alert-warning">
                  <strong>⚠️ Warning:</strong> Deactivated bootcampers will not be able to:
                  <ul>
                    <li>Access their dashboard</li>
                    <li>Update their profile</li>
                    <li>Participate in bootcamp activities</li>
                  </ul>
                  This action can be reversed by activating the account later.
                </div>
              ) : (
                <div className="alert alert-success">
                  <strong>✅ Information:</strong> Activated bootcampers will regain access to all system features.
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button 
                onClick={() => setShowStatusModal(false)}
                className="btn btn-outline"
              >
                Cancel
              </button>
              <button 
                onClick={() => handleStatusChange(statusAction)}
                className={statusAction === 'activate' ? 'btn btn-success' : 'btn btn-danger'}
              >
                {statusAction === 'activate' ? 'Activate Account' : 'Deactivate Account'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BootcamperDetails;