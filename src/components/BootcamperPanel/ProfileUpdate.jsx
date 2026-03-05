import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../../firebase/config';
import { bootcamperService } from '../../firebase/firestore';

const ProfileUpdate = () => {
  const navigate = useNavigate();
  const [bootcamper, setBootcamper] = useState(null);
  const [formData, setFormData] = useState({
    location: '',
    schoolOrWork: '',
    transcript: null
  });
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

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
          setBootcamper(result.data);
          setFormData({
            location: result.data.location || '',
            schoolOrWork: result.data.university || result.data.workplace || '',
            transcript: null
          });
        }
      } catch (error) {
        console.error('Error loading bootcamper:', error);
      } finally {
        setInitialLoading(false);
      }
    };

    loadBootcamperData();
  }, [navigate]);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (files) {
      setFormData(prev => ({ ...prev, [name]: files[0] }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Prepare update data
      const updateData = {
        location: formData.location,
        updatedAt: new Date().toISOString()
      };

      // Add school/work update based on education level
      if (bootcamper.educationLevel === 'In Tertiary/University' || 
          bootcamper.educationLevel === 'Graduate') {
        updateData.university = formData.schoolOrWork;
      } else if (bootcamper.educationLevel === 'Working') {
        updateData.workplace = formData.schoolOrWork;
      }

      // Handle transcript upload if provided
      if (formData.transcript) {
        const base64Transcript = await convertFileToBase64(formData.transcript);
        
        if (bootcamper.educationLevel === 'In Tertiary/University' || 
            bootcamper.educationLevel === 'Graduate') {
          updateData.tertiaryTranscript = base64Transcript;
        }
      }

      await bootcamperService.updateBootcamper(bootcamper.id, updateData);
      
      setSuccess(true);
      setLoading(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Failed to update profile: ' + error.message);
      setLoading(false);
    }
  };

  const convertFileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = error => reject(error);
    });
  };

  if (initialLoading) {
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
    <div className="container">
      <div className="card">
        <div className="card-header">
          <h2>Update Profile Information</h2>
        </div>
        
        {success && (
          <div className="alert alert-success">
            Profile updated successfully!
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <p className="text-muted">
            You can update your location, school, work, and transcript information here.
            Personal details like name, force number, and serial cannot be changed.
          </p>

          <div className="form-group">
            <label className="form-label">Location Update</label>
            <textarea
              className="form-control"
              name="location"
              value={formData.location}
              onChange={handleChange}
              rows="3"
              placeholder="Enter updated location details"
              disabled={loading || success}
            />
          </div>

          <div className="form-group">
            <label className="form-label">School/Work Update</label>
            <input
              type="text"
              className="form-control"
              name="schoolOrWork"
              value={formData.schoolOrWork}
              onChange={handleChange}
              placeholder="Enter updated school or work information"
              disabled={loading || success}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Upload New Transcript (Optional)</label>
            <input
              type="file"
              className="form-control"
              name="transcript"
              onChange={handleChange}
              accept=".pdf,.jpg,.jpeg,.png"
              disabled={loading || success}
            />
            <small className="form-text">
              Upload updated transcripts or documents
            </small>
          </div>

          <div className="form-actions">
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading || success}
            >
              {loading ? (
                <>
                  <span className="spinner spinner-sm"></span>
                  Updating...
                </>
              ) : success ? (
                'Updated!'
              ) : (
                'Update Profile'
              )}
            </button>
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => navigate('/bootcamper')}
              disabled={loading}
            >
              Back to Dashboard
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProfileUpdate;