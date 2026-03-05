import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../../firebase/config';
import { bootcamperService } from '../../firebase/firestore';
import {
  validateUniversity,
  validateCourse,
  validateHighSchool,
  validateWorkplace,
  validatePosition,
  validateYearOfStudy,
  validateRequired
} from '../../utils/validators';
import {
  EDUCATION_LEVELS,
  GRADES,
  UNIVERSITY_SUGGESTIONS,
  COURSE_SUGGESTIONS,
  POSITION_SUGGESTIONS,
  HIGH_SCHOOL_SUGGESTIONS
} from '../../utils/constants';

const UpdateEducation = () => {
  const [bootcamper, setBootcamper] = useState(null);
  const [formData, setFormData] = useState({
    educationLevel: '',
    highSchool: '',
    grade: '',
    university: '',
    course: '',
    year: '',
    workplace: '',
    position: '',
    highSchoolTranscripts: [], // CHANGED to array
    tertiaryTranscripts: [] // CHANGED to array
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
            educationLevel: found.educationLevel || '',
            highSchool: found.highSchool || '',
            grade: found.grade || '',
            university: found.university || '',
            course: found.course || '',
            year: found.year || '',
            workplace: found.workplace || '',
            position: found.position || '',
            highSchoolTranscripts: found.highSchoolTranscripts || found.highSchoolTranscript ? 
              (Array.isArray(found.highSchoolTranscripts) ? found.highSchoolTranscripts : [found.highSchoolTranscript]) : [],
            tertiaryTranscripts: found.tertiaryTranscripts || found.tertiaryTranscript ? 
              (Array.isArray(found.tertiaryTranscripts) ? found.tertiaryTranscripts : [found.tertiaryTranscript]) : []
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
    const { name, value, files } = e.target;
    if (files) {
      if (files.length > 0) {
        const filesArray = Array.from(files);
        setFormData(prev => ({ ...prev, [name]: filesArray }));
      }
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const convertFileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      if (!file) resolve(null);
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = error => reject(error);
    });
  };

  const convertMultipleFilesToBase64 = async (files) => {
    const base64Promises = files.map(file => convertFileToBase64(file));
    return Promise.all(base64Promises);
  };

  const validateFile = (file) => {
    if (!file) return true;
    
    if (typeof file === 'string') return true;
    
    const validTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    if (!validTypes.includes(file.type)) {
      return false;
    }
    
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    
    const newErrors = {};
    
    if (!formData.educationLevel) {
      newErrors.educationLevel = 'Education level is required';
    }

    if (formData.educationLevel === 'Still in High School') {
      if (!validateHighSchool(formData.highSchool)) {
        newErrors.highSchool = 'High school name is required (minimum 3 characters)';
      }
      if (!validateRequired(formData.grade)) {
        newErrors.grade = 'Grade is required';
      }
    } else if (formData.educationLevel === 'In Tertiary/University' || 
               formData.educationLevel === 'Graduate') {
      if (!validateUniversity(formData.university)) {
        newErrors.university = 'University/Institution is required (minimum 3 characters)';
      }
      if (!validateCourse(formData.course)) {
        newErrors.course = 'Course/Program is required (minimum 2 characters)';
      }
      
      // Check if files are valid
      if (formData.highSchoolTranscripts.length > 0) {
        for (const file of formData.highSchoolTranscripts) {
          if (typeof file !== 'string' && !validateFile(file)) {
            newErrors.highSchoolTranscripts = 'Invalid file. Must be PDF or image (max 5MB)';
            break;
          }
        }
      }
      
      if (formData.educationLevel === 'Graduate' && formData.tertiaryTranscripts.length === 0) {
        newErrors.tertiaryTranscripts = 'At least one tertiary transcript is required for graduates';
      } else if (formData.tertiaryTranscripts.length > 0) {
        for (const file of formData.tertiaryTranscripts) {
          if (typeof file !== 'string' && !validateFile(file)) {
            newErrors.tertiaryTranscripts = 'Invalid file. Must be PDF or image (max 5MB)';
            break;
          }
        }
      }
      
      if (formData.year && !validateYearOfStudy(formData.year)) {
        newErrors.year = 'Please enter a valid year (e.g., 1st Year, 2nd Year)';
      }
    } else if (formData.educationLevel === 'Working') {
      if (!validateWorkplace(formData.workplace)) {
        newErrors.workplace = 'Workplace is required (minimum 2 characters)';
      }
      if (!validatePosition(formData.position)) {
        newErrors.position = 'Position is required (minimum 2 characters)';
      }
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    setSaving(true);
    
    try {
      // Convert new files to base64 (keep existing base64 strings)
      let highSchoolTranscriptsBase64 = [];
      let tertiaryTranscriptsBase64 = [];
      
      for (const file of formData.highSchoolTranscripts) {
        if (typeof file === 'string') {
          // Already base64
          highSchoolTranscriptsBase64.push(file);
        } else {
          // Convert File to base64
          const base64 = await convertFileToBase64(file);
          highSchoolTranscriptsBase64.push(base64);
        }
      }
      
      for (const file of formData.tertiaryTranscripts) {
        if (typeof file === 'string') {
          // Already base64
          tertiaryTranscriptsBase64.push(file);
        } else {
          // Convert File to base64
          const base64 = await convertFileToBase64(file);
          tertiaryTranscriptsBase64.push(base64);
        }
      }

      const updateData = { 
        educationLevel: formData.educationLevel,
        highSchool: formData.highSchool,
        grade: formData.grade,
        university: formData.university,
        course: formData.course,
        year: formData.year,
        workplace: formData.workplace,
        position: formData.position,
        highSchoolTranscripts: highSchoolTranscriptsBase64,
        tertiaryTranscripts: tertiaryTranscriptsBase64,
        // For backward compatibility
        highSchoolTranscript: highSchoolTranscriptsBase64.length > 0 ? highSchoolTranscriptsBase64[0] : null,
        tertiaryTranscript: tertiaryTranscriptsBase64.length > 0 ? tertiaryTranscriptsBase64[0] : null,
        updatedAt: new Date().toISOString() 
      };

      await bootcamperService.updateBootcamper(bootcamper.id, updateData);
      
      setSaving(false);
      setMessage('Education information updated successfully!');
      
      setTimeout(() => {
        navigate('/bootcamper/dashboard');
      }, 1500);
    } catch (error) {
      setSaving(false);
      setErrors({ general: 'Failed to update education: ' + error.message });
    }
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <p>Loading education information...</p>
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
          <h1>Update Education Information</h1>
          <div className="welcome-info">
            <span className="welcome-text">Update your education and work details</span>
          </div>
        </div>
        <button onClick={() => navigate('/bootcamper/dashboard')} className="btn btn-outline">
          Back to Dashboard
        </button>
      </header>
      
      <div className="dashboard-content">
        <div className="card">
          <div className="card-header">
            <h2>Education & Work Information</h2>
            <p className="text-muted">Update your education level and related information</p>
          </div>
          
          <div className="card-body">
            {errors.general && (
              <div className="alert alert-danger">{errors.general}</div>
            )}
            
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label required">Education Level</label>
                <select
                  name="educationLevel"
                  className={`form-control ${errors.educationLevel ? 'error' : ''}`}
                  value={formData.educationLevel}
                  onChange={handleChange}
                  disabled={saving}
                >
                  <option value="">Select Education Level</option>
                  {EDUCATION_LEVELS.map(level => (
                    <option key={level} value={level}>{level}</option>
                  ))}
                </select>
                {errors.educationLevel && (
                  <div className="alert alert-danger">{errors.educationLevel}</div>
                )}
              </div>

              {formData.educationLevel === 'Still in High School' && (
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label required">High School Name</label>
                    <input
                      type="text"
                      name="highSchool"
                      className={`form-control ${errors.highSchool ? 'error' : ''}`}
                      value={formData.highSchool}
                      onChange={handleChange}
                      placeholder="Type your high school name (e.g., Maseru High School)"
                      list="highSchoolSuggestions"
                      disabled={saving}
                    />
                    <datalist id="highSchoolSuggestions">
                      {HIGH_SCHOOL_SUGGESTIONS.map(school => (
                        <option key={school} value={school}>{school}</option>
                      ))}
                    </datalist>
                    {errors.highSchool && (
                      <div className="alert alert-danger">{errors.highSchool}</div>
                    )}
                  </div>
                  <div className="form-group">
                    <label className="form-label required">Grade</label>
                    <select
                      name="grade"
                      className={`form-control ${errors.grade ? 'error' : ''}`}
                      value={formData.grade}
                      onChange={handleChange}
                      disabled={saving}
                    >
                      <option value="">Select Grade</option>
                      {GRADES.map(grade => (
                        <option key={grade} value={grade}>{grade}</option>
                      ))}
                    </select>
                    {errors.grade && (
                      <div className="alert alert-danger">{errors.grade}</div>
                    )}
                  </div>
                </div>
              )}

              {(formData.educationLevel === 'In Tertiary/University' || 
                formData.educationLevel === 'Graduate') && (
                <>
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label required">University/Institution</label>
                      <input
                        type="text"
                        name="university"
                        className={`form-control ${errors.university ? 'error' : ''}`}
                        value={formData.university}
                        onChange={handleChange}
                        placeholder="Type your university/institution name"
                        list="universitySuggestions"
                        disabled={saving}
                      />
                      <datalist id="universitySuggestions">
                        {UNIVERSITY_SUGGESTIONS.map(univ => (
                          <option key={univ} value={univ}>{univ}</option>
                        ))}
                      </datalist>
                      {errors.university && (
                        <div className="alert alert-danger">{errors.university}</div>
                      )}
                    </div>
                    <div className="form-group">
                      <label className="form-label required">Course/Program</label>
                      <input
                        type="text"
                        name="course"
                        className={`form-control ${errors.course ? 'error' : ''}`}
                        value={formData.course}
                        onChange={handleChange}
                        placeholder="Type your course/program name"
                        list="courseSuggestions"
                        disabled={saving}
                      />
                      <datalist id="courseSuggestions">
                        {COURSE_SUGGESTIONS.map(course => (
                          <option key={course} value={course}>{course}</option>
                        ))}
                      </datalist>
                      {errors.course && (
                        <div className="alert alert-danger">{errors.course}</div>
                      )}
                    </div>
                  </div>
                  {formData.educationLevel === 'In Tertiary/University' && (
                    <div className="form-group">
                      <label className="form-label">Year of Study</label>
                      <input
                        type="text"
                        name="year"
                        className={`form-control ${errors.year ? 'error' : ''}`}
                        value={formData.year}
                        onChange={handleChange}
                        placeholder="e.g., 2nd Year, 3rd Year, etc."
                        disabled={saving}
                      />
                      {errors.year && (
                        <div className="alert alert-danger">{errors.year}</div>
                      )}
                    </div>
                  )}
                </>
              )}

              {formData.educationLevel === 'Working' && (
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label required">Workplace/Company</label>
                    <input
                      type="text"
                      name="workplace"
                      className={`form-control ${errors.workplace ? 'error' : ''}`}
                      value={formData.workplace}
                      onChange={handleChange}
                      placeholder="Type where you work (company/organization name)"
                      disabled={saving}
                    />
                    {errors.workplace && (
                      <div className="alert alert-danger">{errors.workplace}</div>
                    )}
                  </div>
                  <div className="form-group">
                    <label className="form-label required">Position/Job Title</label>
                    <input
                      type="text"
                      name="position"
                      className={`form-control ${errors.position ? 'error' : ''}`}
                      value={formData.position}
                      onChange={handleChange}
                      placeholder="Type your job title/position"
                      list="positionSuggestions"
                      disabled={saving}
                    />
                    <datalist id="positionSuggestions">
                      {POSITION_SUGGESTIONS.map(position => (
                        <option key={position} value={position}>{position}</option>
                      ))}
                    </datalist>
                    {errors.position && (
                      <div className="alert alert-danger">{errors.position}</div>
                    )}
                  </div>
                </div>
              )}

              <div className="form-row">
                {formData.educationLevel !== 'Still in High School' && formData.educationLevel !== 'Working' && (
                  <div className="form-group">
                    <label className="form-label">
                      High School Transcript(s)
                      {formData.educationLevel !== 'Still in High School' && <span className="text-danger"> *</span>}
                    </label>
                    <input
                      type="file"
                      name="highSchoolTranscripts"
                      className={`form-control ${errors.highSchoolTranscripts ? 'error' : ''}`}
                      onChange={handleChange}
                      accept=".pdf,.jpg,.jpeg,.png"
                      disabled={saving}
                      multiple
                    />
                    {errors.highSchoolTranscripts && (
                      <div className="alert alert-danger">{errors.highSchoolTranscripts}</div>
                    )}
                    <small className="form-text">
                      {formData.highSchoolTranscripts && formData.highSchoolTranscripts.length > 0 && typeof formData.highSchoolTranscripts[0] === 'string'
                        ? `${formData.highSchoolTranscripts.length} transcript(s) already uploaded. Upload new files to add/replace.`
                        : 'Upload your high school transcript(s) (PDF or image files, max 5MB each)'}
                    </small>
                  </div>
                )}

                {(formData.educationLevel === 'In Tertiary/University' || 
                  formData.educationLevel === 'Graduate') && (
                  <div className="form-group">
                    <label className="form-label">
                      {formData.educationLevel === 'Graduate' 
                        ? 'Tertiary Transcript(s) (Required)' 
                        : 'Tertiary Transcript(s) (Optional)'}
                    </label>
                    <input
                      type="file"
                      name="tertiaryTranscripts"
                      className={`form-control ${errors.tertiaryTranscripts ? 'error' : ''}`}
                      onChange={handleChange}
                      accept=".pdf,.jpg,.jpeg,.png"
                      disabled={saving}
                      multiple
                    />
                    {errors.tertiaryTranscripts && (
                      <div className="alert alert-danger">{errors.tertiaryTranscripts}</div>
                    )}
                    <small className="form-text">
                      {formData.tertiaryTranscripts && formData.tertiaryTranscripts.length > 0 && typeof formData.tertiaryTranscripts[0] === 'string'
                        ? `${formData.tertiaryTranscripts.length} transcript(s) already uploaded. Upload new files to add/replace.`
                        : 'Upload your tertiary transcript(s) (PDF or image files, max 5MB each)'}
                    </small>
                  </div>
                )}
              </div>

              <div className="form-actions">
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? (
                    <>
                      <span className="spinner spinner-sm mr-2"></span>
                      Saving...
                    </>
                  ) : 'Save Changes'}
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

export default UpdateEducation;