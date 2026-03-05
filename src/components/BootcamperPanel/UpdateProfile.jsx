import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../../firebase/config';
import { bootcamperService } from '../../firebase/firestore';
import { validateEmail, validatePhoneNumber, validateLocation } from '../../utils/validators';
import { DISTRICTS } from '../../utils/constants';

const UpdateProfile = () => {
  const [bootcamper, setBootcamper] = useState(null);
  const [formData, setFormData] = useState({
    email: '',
    phone: '+266',
    district: '',
    location: ''
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const loadBootcamperData = async () => {
      try {
        const currentUser = auth.currentUser;
        if (!currentUser) {
          navigate('/login');
          return;
        }

        const result = await bootcamperService.getBootcamperByEmail(currentUser.email);
        
        if (result.success && result.data) {
          const found = result.data;
          setBootcamper(found);
          setFormData({
            email: found.email || '',
            phone: found.phone || '+266',
            district: found.district || '',
            location: found.location || ''
          });
        }
      } catch (error) {
        console.error('Error loading bootcamper:', error);
      } finally {
        setLoading(false);
      }
    };

    loadBootcamperData();
  }, [navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handlePhoneChange = (e) => {
    const value = '+266' + e.target.value;
    setFormData(prev => ({ ...prev, phone: value }));
    
    if (errors.phone) {
      setErrors(prev => ({ ...prev, phone: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    
    const newErrors = {};
    
    if (!validateEmail(formData.email)) {
      newErrors.email = 'Valid email is required';
    }
    
    if (!validatePhoneNumber(formData.phone)) {
      newErrors.phone = 'Phone must be +266 followed by 8 digits starting with 5 or 6';
    }
    
    if (!formData.district) {
      newErrors.district = 'District is required';
    }
    
    if (!validateLocation(formData.location)) {
      newErrors.location = 'Physical location is required (minimum 5 characters)';
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    setSaving(true);
    
    try {
      const updateData = { 
        email: formData.email,
        phone: formData.phone,
        district: formData.district,
        location: formData.location,
        updatedAt: new Date().toISOString() 
      };

      await bootcamperService.updateBootcamper(bootcamper.id, updateData);
      
      setSaving(false);
      setMessage('Profile updated successfully!');
      
      setTimeout(() => {
        navigate('/bootcamper/dashboard');
      }, 1500);
    } catch (error) {
      setSaving(false);
      setErrors({ general: 'Failed to update profile: ' + error.message });
    }
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <p>Loading profile...</p>
      </div>
    );
  }

  if (!bootcamper) {
    return (
      <div className="dashboard">
        <header className="dashboard-header">
          <div>
            <h1>Bootcamper Not Found</h1>
            <p>Please login again</p>
          </div>
          <button onClick={() => navigate('/bootcamper/dashboard')} className="btn btn-outline">
            Back to Dashboard
          </button>
        </header>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="dashboard-welcome">
          <h1>Update Profile</h1>
          <div className="welcome-info">
            <span className="welcome-text">Update your personal information</span>
          </div>
        </div>
        <button onClick={() => navigate('/bootcamper/dashboard')} className="btn btn-outline">
          Back to Dashboard
        </button>
      </header>
      
      <div className="dashboard-content">
        <div className="card">
          <div className="card-header">
            <h2>Personal Information</h2>
            <p className="text-muted">Update your contact details and location information</p>
          </div>
          
          <div className="card-body">
            {errors.general && (
              <div className="alert alert-danger">{errors.general}</div>
            )}
            
            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label required">Email Address</label>
                  <input
                    type="email"
                    name="email"
                    className={`form-control ${errors.email ? 'error' : ''}`}
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="example@email.com"
                    disabled={saving}
                  />
                  {errors.email && (
                    <div className="alert alert-danger">{errors.email}</div>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label required">Phone Number</label>
                  <div className="phone-input-group">
                    <div className="phone-prefix">+266</div>
                    <input
                      type="text"
                      name="phoneDigits"
                      className={`form-control ${errors.phone ? 'error' : ''}`}
                      value={formData.phone.replace('+266', '')}
                      onChange={handlePhoneChange}
                      placeholder="50123456"
                      maxLength="8"
                      disabled={saving}
                    />
                  </div>
                  {errors.phone && (
                    <div className="alert alert-danger">{errors.phone}</div>
                  )}
                  <small className="form-text">Enter 8 digits starting with 5 or 6</small>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label required">District</label>
                  <select
                    name="district"
                    className={`form-control ${errors.district ? 'error' : ''}`}
                    value={formData.district}
                    onChange={handleChange}
                    disabled={saving}
                  >
                    <option value="">Select District</option>
                    {DISTRICTS.map(district => (
                      <option key={district} value={district}>{district}</option>
                    ))}
                  </select>
                  {errors.district && (
                    <div className="alert alert-danger">{errors.district}</div>
                  )}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label required">Physical Location</label>
                <textarea
                  name="location"
                  className={`form-control ${errors.location ? 'error' : ''}`}
                  value={formData.location}
                  onChange={handleChange}
                  placeholder="Detailed physical address (village, street, house number, etc.)"
                  rows="3"
                  disabled={saving}
                />
                {errors.location && (
                  <div className="alert alert-danger">{errors.location}</div>
                )}
                <small className="form-text">Minimum 5 characters required</small>
              </div>

              <div className="form-actions">
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? (
                    <>
                      <span className="spinner spinner-sm mr-2"></span>
                      Saving Changes...
                    </>
                  ) : 'Update Profile'}
                </button>
                <button 
                  type="button" 
                  className="btn btn-outline ml-2"
                  onClick={() => navigate('/bootcamper/dashboard')}
                  disabled={saving}
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

export default UpdateProfile;