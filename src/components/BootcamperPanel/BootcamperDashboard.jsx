import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { auth } from '../../firebase/config';
import { bootcamperService } from '../../firebase/firestore';

const BootcamperDashboard = ({ onLogout }) => {
  const [bootcamper, setBootcamper] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const navigate = useNavigate();

  useEffect(() => {
    const loadBootcamperData = async () => {
      try {
        // Get current authenticated user from Firebase
        const currentUser = auth.currentUser;
        
        if (!currentUser) {
          console.log('No authenticated user found');
          setLoading(false);
          navigate('/login');
          return;
        }

        console.log('Current user UID:', currentUser.uid);
        console.log('Current user email:', currentUser.email);
        
        // Try to get bootcamper by authUid (most reliable)
        try {
          console.log('Getting bootcamper by authUid:', currentUser.uid);
          const result = await bootcamperService.getBootcamperByAuthUid(currentUser.uid);
          
          if (result.success && result.data) {
            console.log('Found bootcamper by authUid:', result.data);
            setBootcamper(result.data);
            
            // Store in localStorage for backward compatibility
            localStorage.setItem('currentEmail', result.data.email);
            localStorage.setItem('currentForceNumber', result.data.forceNumber);
            localStorage.setItem('currentUser', JSON.stringify({
              uid: currentUser.uid,
              email: currentUser.email
            }));
            
            // Check if password needs to be changed
            if (result.data.passwordChanged === false) {
              navigate('/bootcamper/force-password-change', { 
                state: { 
                  forceNumber: result.data.forceNumber,
                  email: result.data.email,
                  authUid: currentUser.uid
                } 
              });
              return;
            }
            
            setLoading(false);
            return;
          } else {
            console.log('Bootcamper not found by authUid, trying email...');
            
            // Fallback: Try by email
            if (currentUser.email) {
              const emailResult = await bootcamperService.getBootcamperByEmail(currentUser.email);
              if (emailResult.success && emailResult.data) {
                console.log('Found bootcamper by email:', emailResult.data);
                setBootcamper(emailResult.data);
                
                localStorage.setItem('currentEmail', emailResult.data.email);
                localStorage.setItem('currentForceNumber', emailResult.data.forceNumber);
                localStorage.setItem('currentUser', JSON.stringify({
                  uid: currentUser.uid,
                  email: currentUser.email
                }));
                
                if (emailResult.data.passwordChanged === false) {
                  navigate('/bootcamper/force-password-change', { 
                    state: { 
                      forceNumber: emailResult.data.forceNumber,
                      email: emailResult.data.email,
                      authUid: currentUser.uid
                    } 
                  });
                  return;
                }
                
                setLoading(false);
                return;
              }
            }
          }
        } catch (firebaseError) {
          console.error('Error fetching from Firebase:', firebaseError);
          
          // Show specific error message
          if (firebaseError.code === 'permission-denied') {
            console.error('Permission denied. Check Firestore rules.');
          }
        }

        // Fallback: Check localStorage for bootcampers array
        console.log('Trying localStorage fallback...');
        const bootcampers = JSON.parse(localStorage.getItem('bootcampers') || '[]');
        const emailFromStorage = localStorage.getItem('currentEmail');
        const forceNumberFromStorage = localStorage.getItem('currentForceNumber');
        
        const foundBootcamper = bootcampers.find(b => 
          b.email === emailFromStorage || b.forceNumber === forceNumberFromStorage
        );
        
        if (foundBootcamper) {
          console.log('Found bootcamper in localStorage:', foundBootcamper);
          setBootcamper(foundBootcamper);
          
          if (foundBootcamper.passwordChanged === false) {
            navigate('/bootcamper/force-password-change', { 
              state: { 
                forceNumber: foundBootcamper.forceNumber,
                email: foundBootcamper.email,
                authUid: currentUser.uid
              } 
            });
          }
        } else {
          console.log('Bootcamper not found anywhere');
          
          // If we have a current user but no bootcamper record, redirect to registration
          if (currentUser.email) {
            alert('No registration found for your account. Please complete registration.');
            navigate('/register');
          }
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Error loading bootcamper data:', error);
        setLoading(false);
        alert('Error loading dashboard: ' + error.message);
      }
    };

    // Set up auth state listener
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        loadBootcamperData();
      } else {
        console.log('No user authenticated, redirecting to login');
        navigate('/login');
      }
    });

    // Cleanup subscription
    return () => unsubscribe();
  }, [navigate]);

  const handleLogout = async () => {
    try {
      // Clear localStorage
      localStorage.removeItem('currentForceNumber');
      localStorage.removeItem('currentEmail');
      localStorage.removeItem('currentUser');
      
      // Sign out from Firebase
      await auth.signOut();
      
      // Call parent logout handler if provided
      if (onLogout) onLogout();
      
      // Navigate to login
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
      // Still navigate to login even if logout fails
      navigate('/login');
    }
  };

  const getPhotoUrl = (photoData) => {
    if (!photoData) return null;
    
    // Check if it's a base64 data URL
    if (typeof photoData === 'string' && photoData.startsWith('data:image')) {
      return photoData;
    }
    
    // COMMENTED OUT: Firebase Storage URLs (requires payment)
    // if (typeof photoData === 'string' && photoData.startsWith('https://')) {
    //   return photoData;
    // }
    
    return null;
  };

  const renderTranscriptPreview = (files, label) => {
    // Handle both old single file format and new array format
    if (!files || (Array.isArray(files) && files.length === 0) || files === '') {
      return <span className="text-muted">No transcripts uploaded</span>;
    }
    
    // Convert single file to array for consistency
    let transcriptFiles = files;
    if (!Array.isArray(files)) {
      transcriptFiles = [files];
    }
    
    return (
      <div className="transcript-list">
        <div className="transcript-count">
          <strong>{transcriptFiles.length}</strong> {transcriptFiles.length === 1 ? 'transcript' : 'transcripts'} uploaded
        </div>
        
        <div className="transcript-items">
          {transcriptFiles.map((file, index) => {
            const isBase64 = typeof file === 'string' && file.startsWith('data:');
            const isPDF = isBase64 && file.startsWith('data:application/pdf');
            const isImage = isBase64 && file.startsWith('data:image');
            // COMMENTED OUT: Firebase Storage URLs
            // const isUrl = typeof file === 'string' && file.startsWith('https://');
            
            return (
              <div key={index} className="transcript-item">
                <div className="transcript-info">
                  <span className="transcript-number">#{index + 1}</span>
                  <span className="transcript-type">
                    {isPDF ? 'PDF Document' : isImage ? 'Image File' : 'Document'}
                  </span>
                </div>
                
                <div className="transcript-actions">
                  <button 
                    className="btn btn-sm btn-primary"
                    onClick={() => {
                      if (isBase64) {
                        const newWindow = window.open();
                        if (newWindow) {
                          newWindow.document.write(`
                            <html>
                              <head>
                                <title>${label} - Document ${index + 1}</title>
                                <style>
                                  body { margin: 0; padding: 20px; font-family: Arial, sans-serif; }
                                  .container { max-width: 800px; margin: 0 auto; }
                                  .header { margin-bottom: 20px; padding-bottom: 10px; border-bottom: 2px solid #007bff; }
                                  iframe { width: 100%; height: 600px; border: 1px solid #ddd; border-radius: 4px; }
                                  img { max-width: 100%; height: auto; display: block; margin: 0 auto; }
                                </style>
                              </head>
                              <body>
                                <div class="container">
                                  <div class="header">
                                    <h2>${label} - Document ${index + 1}</h2>
                                    <p>Viewing for ${bootcamper?.fullName || 'Bootcamper'}</p>
                                  </div>
                                  ${isPDF ? 
                                    `<iframe src="${file}"></iframe>` : 
                                    isImage ? 
                                      `<img src="${file}" alt="${label} ${index + 1}" />` :
                                      `<p>Document loaded successfully.</p>`
                                  }
                                  <br/>
                                  <button onclick="window.close()" style="padding: 10px 20px; background: #6c757d; color: white; border: none; border-radius: 4px; cursor: pointer;">Close</button>
                                </div>
                              </body>
                            </html>
                          `);
                        }
                      }
                    }}
                  >
                    View
                  </button>
                  
                  <button 
                    className="btn btn-sm btn-secondary ml-2"
                    onClick={() => {
                      if (typeof file === 'string' && isBase64) {
                        const link = document.createElement('a');
                        link.href = file;
                        
                        // Determine file extension
                        let extension = '.pdf';
                        if (file.startsWith('data:image/jpeg')) extension = '.jpg';
                        else if (file.startsWith('data:image/png')) extension = '.png';
                        else if (file.startsWith('data:image/jpg')) extension = '.jpg';
                        
                        link.download = `${label.replace(/\s+/g, '_')}_${index + 1}${extension}`;
                        link.target = '_blank';
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                      }
                    }}
                  >
                    Download
                  </button>
                  
                  <button 
                    className="btn btn-sm btn-outline-danger ml-2"
                    onClick={async () => {
                      if (window.confirm(`Are you sure you want to delete transcript #${index + 1}?`)) {
                        try {
                          // Get current user
                          const currentUser = auth.currentUser;
                          if (!currentUser || !bootcamper) return;
                          
                          // Remove the transcript from array
                          const updatedFiles = [...transcriptFiles];
                          updatedFiles.splice(index, 1);
                          
                          // Prepare update data
                          const updateData = {};
                          if (label === 'High School Transcript') {
                            updateData.highSchoolTranscripts = updatedFiles;
                            updateData.highSchoolTranscript = updatedFiles.length > 0 ? updatedFiles[0] : null;
                          } else if (label === 'Tertiary Transcript') {
                            updateData.tertiaryTranscripts = updatedFiles;
                            updateData.tertiaryTranscript = updatedFiles.length > 0 ? updatedFiles[0] : null;
                          }
                          updateData.updatedAt = new Date().toISOString();
                          
                          // Update in Firebase using authUid
                          await bootcamperService.updateBootcamper(currentUser.uid, updateData);
                          
                          // Refresh bootcamper data
                          const result = await bootcamperService.getBootcamperByAuthUid(currentUser.uid);
                          if (result.success) {
                            setBootcamper(result.data);
                          }
                          
                          alert('Transcript deleted successfully!');
                        } catch (error) {
                          console.error('Error deleting transcript:', error);
                          alert('Failed to delete transcript: ' + error.message);
                        }
                      }
                    }}
                  >
                    Remove
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderPhotoPreview = (photoData) => {
    const photoUrl = getPhotoUrl(photoData);
    
    if (photoUrl) {
      return (
        <div className="photo-preview">
          <img 
            src={photoUrl} 
            alt="Passport" 
            className="passport-photo" 
            onError={(e) => {
              console.error('Error loading image');
              e.target.style.display = 'none';
              e.target.parentElement.innerHTML = `
                <div class="no-photo-placeholder">
                  <span class="placeholder-icon">📷</span>
                  <small class="d-block text-muted mt-1">Error loading image</small>
                </div>
              `;
            }}
          />
          <small className="d-block text-muted mt-1">Passport Photo</small>
        </div>
      );
    }
    
    return (
      <div className="photo-preview">
        <div className="no-photo-placeholder">
          <span className="placeholder-icon">👤</span>
          <small className="d-block text-muted mt-1">No photo uploaded</small>
        </div>
      </div>
    );
  };

  // Helper function to determine if high school transcripts should be shown
  const shouldShowHighSchoolTranscripts = () => {
    if (!bootcamper) return false;
    
    // Show high school transcripts for:
    // 1. Tertiary/University students (required)
    // 2. Graduates (required)
    // 3. Working individuals (optional - only if they uploaded any)
    return (
      bootcamper.educationLevel === 'In Tertiary/University' ||
      bootcamper.educationLevel === 'Graduate' ||
      (bootcamper.educationLevel === 'Working' && 
       ((bootcamper.highSchoolTranscripts && bootcamper.highSchoolTranscripts.length > 0) || 
        bootcamper.highSchoolTranscript))
    );
  };

  // Helper function to determine if tertiary transcripts should be shown
  const shouldShowTertiaryTranscripts = () => {
    if (!bootcamper) return false;
    
    // Show tertiary transcripts for:
    // 1. Tertiary/University students (optional)
    // 2. Graduates (required)
    return (
      bootcamper.educationLevel === 'In Tertiary/University' ||
      bootcamper.educationLevel === 'Graduate'
    );
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  if (!bootcamper) {
    return (
      <div className="dashboard">
        <header className="dashboard-header">
          <div>
            <h1>Bootcamper Not Found</h1>
            <p>Please login again or complete registration</p>
          </div>
          <div className="button-group">
            <button onClick={() => navigate('/login')} className="btn btn-outline">
              Back to Login
            </button>
            <button onClick={() => navigate('/register')} className="btn btn-primary">
              Register
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
          <h1>Bootcamper Dashboard</h1>
          <div className="welcome-info">
            <span className="welcome-text">Welcome,</span>
            <span className="bootcamper-name">{bootcamper.fullName}</span>
            <span className="separator">|</span>
            <span className="force-number">Force Number: {bootcamper.forceNumber}</span>
            <span className="separator">|</span>
            <span className="serial">Serial: {bootcamper.serial}</span>
          </div>
        </div>
        <div className="header-actions">
          <Link to="/bootcamper/profile" className="btn btn-outline mr-2">
            Update Profile
          </Link>
          <Link to="/bootcamper/education" className="btn btn-outline mr-2">
            Update Education
          </Link>
          <button onClick={handleLogout} className="btn btn-outline">
            Logout
          </button>
        </div>
      </header>

      <div className="dashboard-layout">
        <nav className="dashboard-sidebar">
          <div className="sidebar-header">
            <div className="user-info">
              {renderPhotoPreview(bootcamper.photo)}
              <h4>{bootcamper.fullName}</h4>
              <p className="text-muted">{bootcamper.forceNumber}</p>
            </div>
          </div>
          <ul className="sidebar-menu">
            <li>
              <button 
                className={`sidebar-item ${activeTab === 'overview' ? 'active' : ''}`}
                onClick={() => setActiveTab('overview')}
              >
                📊 Overview
              </button>
            </li>
            <li>
              <button 
                className={`sidebar-item ${activeTab === 'personal' ? 'active' : ''}`}
                onClick={() => setActiveTab('personal')}
              >
                👤 Personal Info
              </button>
            </li>
            <li>
              <button 
                className={`sidebar-item ${activeTab === 'education' ? 'active' : ''}`}
                onClick={() => setActiveTab('education')}
              >
                🎓 Education
              </button>
            </li>
            <li>
              <button 
                className={`sidebar-item ${activeTab === 'documents' ? 'active' : ''}`}
                onClick={() => setActiveTab('documents')}
              >
                📄 Documents
              </button>
            </li>
            <li>
              <Link to="/bootcamper/password" className="sidebar-item">
                🔐 Change Password
              </Link>
            </li>
          </ul>
        </nav>

        <main className="dashboard-content">
          {activeTab === 'overview' && (
            <div className="overview-section">
              <div className="stats-grid">
                <div className="stat-card">
                  <p>Registration Status</p>
                  <h3 className="text-success">✓ Active</h3>
                </div>
                <div className="stat-card">
                  <p>Password Status</p>
                  <h3 className={bootcamper.passwordChanged ? 'text-success' : 'text-warning'}>
                    {bootcamper.passwordChanged ? '✓ Changed' : '⚠️ Default'}
                  </h3>
                </div>
                <div className="stat-card">
                  <p>District</p>
                  <h3>{bootcamper.district}</h3>
                </div>
                <div className="stat-card">
                  <p>Education Level</p>
                  <h3>{bootcamper.educationLevel}</h3>
                </div>
              </div>

              <div className="card">
                <div className="card-header">
                  <h2>Quick Actions</h2>
                </div>
                <div className="button-group">
                  <Link to="/bootcamper/profile" className="btn btn-primary">
                    Update Profile Information
                  </Link>
                  <Link to="/bootcamper/education" className="btn btn-primary">
                    Update Education
                  </Link>
                  <Link to="/bootcamper/password" className="btn btn-secondary">
                    Change Password
                  </Link>
                  <button className="btn btn-outline" onClick={() => window.print()}>
                    Print Registration Details
                  </button>
                </div>
              </div>

              <div className="card">
                <div className="card-header">
                  <h2>Registration Summary</h2>
                </div>
                <div className="summary-grid">
                  <div className="summary-item">
                    <strong>Registered On:</strong>
                    <span>{bootcamper.createdAt ? new Date(bootcamper.createdAt).toLocaleDateString() : 'N/A'}</span>
                  </div>
                  <div className="summary-item">
                    <strong>Last Updated:</strong>
                    <span>{bootcamper.updatedAt ? new Date(bootcamper.updatedAt).toLocaleDateString() : 'Never'}</span>
                  </div>
                  <div className="summary-item">
                    <strong>Status:</strong>
                    <span className="badge badge-success">Active</span>
                  </div>
                  <div className="summary-item">
                    <strong>Email Verified:</strong>
                    <span className={bootcamper.emailVerified ? 'badge badge-success' : 'badge badge-warning'}>
                      {bootcamper.emailVerified ? 'Verified' : 'Pending'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'personal' && (
            <div className="personal-info-section">
              <div className="card">
                <div className="card-header">
                  <h2>Personal Information</h2>
                  <div className="card-actions">
                    <Link to="/bootcamper/profile" className="btn btn-sm btn-primary">
                      Update
                    </Link>
                  </div>
                </div>
                <div className="info-grid">
                  <div className="info-item">
                    <strong>Force Number:</strong>
                    <span>{bootcamper.forceNumber}</span>
                  </div>
                  <div className="info-item">
                    <strong>Full Name:</strong>
                    <span>{bootcamper.fullName}</span>
                  </div>
                  <div className="info-item">
                    <strong>Email:</strong>
                    <span>{bootcamper.email}</span>
                  </div>
                  <div className="info-item">
                    <strong>Phone:</strong>
                    <span>{bootcamper.phone}</span>
                  </div>
                  <div className="info-item">
                    <strong>Date of Birth:</strong>
                    <span>{bootcamper.dateOfBirth ? new Date(bootcamper.dateOfBirth).toLocaleDateString() : 'N/A'}</span>
                  </div>
                  <div className="info-item">
                    <strong>Age:</strong>
                    <span>{bootcamper.age} years</span>
                  </div>
                  <div className="info-item">
                    <strong>ID/Birth Certificate:</strong>
                    <span>{bootcamper.idNumber || 'N/A'}</span>
                  </div>
                  <div className="info-item">
                    <strong>Gender:</strong>
                    <span>{bootcamper.gender}</span>
                  </div>
                  <div className="info-item">
                    <strong>Serial:</strong>
                    <span>{bootcamper.serial}</span>
                  </div>
                  <div className="info-item">
                    <strong>District:</strong>
                    <span>{bootcamper.district}</span>
                  </div>
                  <div className="info-item full-width">
                    <strong>Physical Location:</strong>
                    <span>{bootcamper.location}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'education' && (
            <div className="education-section">
              <div className="card">
                <div className="card-header">
                  <h2>Education & Work Information</h2>
                  <div className="card-actions">
                    <Link to="/bootcamper/education" className="btn btn-sm btn-primary">
                      Update Education
                    </Link>
                  </div>
                </div>
                
                <div className="info-grid">
                  <div className="info-item">
                    <strong>Education Level:</strong>
                    <span>{bootcamper.educationLevel}</span>
                  </div>

                  {(bootcamper.educationLevel === 'Still in High School' || 
                    (bootcamper.educationLevel === 'Working' && bootcamper.highSchool)) && (
                    <>
                      <div className="info-item">
                        <strong>High School:</strong>
                        <span>{bootcamper.highSchool || 'N/A'}</span>
                      </div>
                      {bootcamper.educationLevel === 'Still in High School' && (
                        <div className="info-item">
                          <strong>Grade:</strong>
                          <span>{bootcamper.grade || 'N/A'}</span>
                        </div>
                      )}
                    </>
                  )}

                  {(bootcamper.educationLevel === 'In Tertiary/University' || 
                    bootcamper.educationLevel === 'Graduate') && (
                    <>
                      <div className="info-item">
                        <strong>Institution:</strong>
                        <span>{bootcamper.university || 'N/A'}</span>
                      </div>
                      <div className="info-item">
                        <strong>Course/Program:</strong>
                        <span>{bootcamper.course || 'N/A'}</span>
                      </div>
                      {bootcamper.year && (
                        <div className="info-item">
                          <strong>Year of Study:</strong>
                          <span>{bootcamper.year}</span>
                        </div>
                      )}
                    </>
                  )}

                  {bootcamper.educationLevel === 'Working' && (
                    <>
                      <div className="info-item">
                        <strong>Workplace:</strong>
                        <span>{bootcamper.workplace || 'N/A'}</span>
                      </div>
                      <div className="info-item">
                        <strong>Position:</strong>
                        <span>{bootcamper.position || 'N/A'}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'documents' && (
            <div className="documents-section">
              <div className="card">
                <div className="card-header">
                  <h2>Documents & Photos</h2>
                </div>
                
                <div className="documents-grid">
                  <div className="document-card">
                    <h3>Passport Photo</h3>
                    <div className="document-preview">
                      {renderPhotoPreview(bootcamper.photo)}
                    </div>
                    <small className="text-muted">Passport-sized photo in bootcamp attire</small>
                  </div>

                  {shouldShowHighSchoolTranscripts() && (
                    <div className="document-card">
                      <h3>High School Transcripts</h3>
                      <div className="document-preview">
                        {renderTranscriptPreview(
                          bootcamper.highSchoolTranscripts || bootcamper.highSchoolTranscript, 
                          'High School Transcript'
                        )}
                      </div>
                      <small className="text-muted">
                        {bootcamper.educationLevel === 'Working' 
                          ? 'Optional: Uploaded high school transcripts' 
                          : 'Required for tertiary students and graduates'}
                      </small>
                    </div>
                  )}

                  {shouldShowTertiaryTranscripts() && (
                    <div className="document-card">
                      <h3>Tertiary Transcripts</h3>
                      <div className="document-preview">
                        {renderTranscriptPreview(
                          bootcamper.tertiaryTranscripts || bootcamper.tertiaryTranscript, 
                          'Tertiary Transcript'
                        )}
                      </div>
                      <small className="text-muted">
                        {bootcamper.educationLevel === 'Graduate' 
                          ? 'Required for graduates' 
                          : 'Optional for current students'}
                      </small>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default BootcamperDashboard;