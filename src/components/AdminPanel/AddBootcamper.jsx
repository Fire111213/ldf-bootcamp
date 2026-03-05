import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { bootcamperService } from '../../firebase/firestore';
import {
  validateForceNumber,
  validatePhoneNumber,
  validateEmail,
  validateRequired,
  validateDateOfBirth,
  validateIDNumber,
  validatePassword,
  validatePhoto,
  validateLocation
} from '../../utils/validators';
import {
  DISTRICTS,
  SERIALS,
  GENDERS,
  EDUCATION_LEVELS,
  GRADES,
  UNIVERSITY_SUGGESTIONS,
  COURSE_SUGGESTIONS,
  POSITION_SUGGESTIONS,
  HIGH_SCHOOL_SUGGESTIONS
} from '../../utils/constants';

const AddBootcamper = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    forceNumber: '',
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    serial: '',
    dateOfBirth: '',
    idNumber: '',
    gender: '',
    district: '',
    location: '',
    phone: '+266',
    educationLevel: '',
    highSchool: '',
    grade: '',
    university: '',
    course: '',
    year: '',
    workplace: '',
    position: '',
    highSchoolTranscripts: [],
    tertiaryTranscripts: [],
    photo: null
  });
  
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [generatedPassword, setGeneratedPassword] = useState('');

  const generatePassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  };

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    
    if (files) {
      if (files.length > 0) {
        if (name === 'photo') {
          setFormData({ ...formData, [name]: files[0] });
        } else if (name === 'highSchoolTranscripts' || name === 'tertiaryTranscripts') {
          setFormData({ ...formData, [name]: Array.from(files) });
        }
      }
    } else {
      setFormData({ ...formData, [name]: value });
      
      if (name === 'dateOfBirth' && value) {
        const birthDate = new Date(value);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
          age--;
        }
        setFormData(prev => ({ ...prev, age: age.toString() }));
      }
    }
    
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }
  };

  const validateStep1 = () => {
    const newErrors = {};

    if (!validateForceNumber(formData.forceNumber)) {
      newErrors.forceNumber = 'Force Number must start with 0 followed by 3-5 digits';
    }

    if (!validateEmail(formData.email)) {
      newErrors.email = 'Valid email is required';
    }

    if (!validatePassword(formData.password)) {
      newErrors.password = 'Password must be at least 8 characters with uppercase, lowercase, number and special character';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (!validateRequired(formData.fullName)) {
      newErrors.fullName = 'Full name is required';
    }

    if (!validateRequired(formData.serial)) {
      newErrors.serial = 'Serial is required';
    }

    if (!validateDateOfBirth(formData.dateOfBirth)) {
      newErrors.dateOfBirth = 'Date of birth is required and must be valid (16-40 years)';
    }

    if (!validateIDNumber(formData.idNumber)) {
      newErrors.idNumber = 'ID/Birth Certificate number must be exactly 12 digits';
    }

    if (!validateRequired(formData.gender)) {
      newErrors.gender = 'Gender is required';
    }

    if (!validateRequired(formData.district)) {
      newErrors.district = 'District is required';
    }

    if (!validateLocation(formData.location)) {
      newErrors.location = 'Physical location is required (minimum 5 characters)';
    }

    if (!validatePhoneNumber(formData.phone)) {
      newErrors.phone = 'Phone must be +266 followed by 8 digits starting with 5 or 6';
    }

    return newErrors;
  };

  const handleNext = () => {
    const stepErrors = validateStep1();
    if (Object.keys(stepErrors).length === 0) {
      setStep(2);
    } else {
      setErrors(stepErrors);
    }
  };

  const handleBack = () => {
    setStep(1);
    setErrors({});
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    setLoading(true);

    const step1Errors = validateStep1();
    const allErrors = { ...step1Errors };

    // Validate photo
    if (!formData.photo) {
      allErrors.photo = 'Passport photo is required';
    } else if (!validatePhoto(formData.photo)) {
      allErrors.photo = 'Invalid photo. Must be JPG or PNG (max 2MB)';
    }

    if (Object.keys(allErrors).length > 0) {
      setErrors(allErrors);
      setLoading(false);
      return;
    }

    try {
      // Calculate age
      const birthDate = new Date(formData.dateOfBirth);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }

      // Create bootcamper data for Firebase
      const bootcamperData = {
        forceNumber: formData.forceNumber,
        email: formData.email,
        fullName: formData.fullName,
        serial: formData.serial,
        dateOfBirth: formData.dateOfBirth,
        idNumber: formData.idNumber,
        gender: formData.gender,
        district: formData.district,
        location: formData.location,
        phone: formData.phone,
        educationLevel: formData.educationLevel,
        highSchool: formData.highSchool || '',
        grade: formData.grade || '',
        university: formData.university || '',
        course: formData.course || '',
        year: formData.year || '',
        workplace: formData.workplace || '',
        position: formData.position || '',
        age: age,
        status: 'active',
        registeredAt: new Date().toISOString(),
        registeredBy: currentUser?.email || 'admin',
        passwordChanged: false,
        lastPasswordReset: new Date().toISOString(),
        resetBy: 'admin'
      };

      // Convert files to base64
      if (formData.photo) {
        const photoBase64 = await convertFileToBase64(formData.photo);
        bootcamperData.photo = photoBase64;
      }

      if (formData.highSchoolTranscripts.length > 0) {
        const transcriptsPromises = formData.highSchoolTranscripts.map(file => 
          convertFileToBase64(file)
        );
        bootcamperData.highSchoolTranscripts = await Promise.all(transcriptsPromises);
      }

      if (formData.tertiaryTranscripts.length > 0) {
        const transcriptsPromises = formData.tertiaryTranscripts.map(file => 
          convertFileToBase64(file)
        );
        bootcamperData.tertiaryTranscripts = await Promise.all(transcriptsPromises);
      }

      // Check if force number exists in Firebase
      const checkResult = await bootcamperService.checkForceNumberExists(formData.forceNumber);
      if (checkResult.success && checkResult.exists) {
        setErrors({ general: 'Force Number already registered.' });
        setLoading(false);
        return;
      }

      // Check if email exists
      const emailCheck = await bootcamperService.checkEmailExists(formData.email);
      if (emailCheck.success && emailCheck.exists) {
        setErrors({ general: 'Email already registered.' });
        setLoading(false);
        return;
      }

      // Register bootcamper with Firebase Auth
      const authResult = await bootcamperService.registerBootcamper({
        email: formData.email,
        password: formData.password,
        ...bootcamperData
      });

      if (authResult.success) {
        setGeneratedPassword(formData.password);
        setSuccess(true);
        
        setTimeout(() => {
          navigate('/admin/bootcampers');
        }, 3000);
      } else {
        setErrors({ general: authResult.error || 'Failed to register bootcamper' });
      }
    } catch (error) {
      console.error('Error registering bootcamper:', error);
      setErrors({ general: `Error: ${error.message}` });
    } finally {
      setLoading(false);
    }
  };

  const handleGeneratePassword = () => {
    const newPassword = generatePassword();
    setFormData({
      ...formData,
      password: newPassword,
      confirmPassword: newPassword
    });
  };

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="dashboard-welcome">
          <h1>Add New Bootcamper</h1>
          <p>Register a new bootcamper manually</p>
        </div>
        <div className="header-actions">
          <button onClick={() => navigate('/admin/dashboard')} className="btn btn-outline">
            Back to Dashboard
          </button>
        </div>
      </header>
      
      <div className="dashboard-content">
        <div className="card">
          <div className="card-header">
            <h2>Bootcamper Registration Form</h2>
            <div className="progress-steps">
              <div className={`step ${step >= 1 ? 'active' : ''}`}>1. Personal Info</div>
              <div className={`step ${step >= 2 ? 'active' : ''}`}>2. Education & Documents</div>
            </div>
          </div>
          
          <div className="card-body">
            {errors.general && (
              <div className="alert alert-danger">
                <strong>Error:</strong> {errors.general}
              </div>
            )}

            {success ? (
              <div className="alert alert-success">
                <h4>✅ Bootcamper Added Successfully!</h4>
                <p>Bootcamper has been registered and added to the system.</p>
                <p><strong>Login Details:</strong></p>
                <ul>
                  <li>Email: <strong>{formData.email}</strong></li>
                  <li>Password: <strong>{generatedPassword}</strong></li>
                  <li>Force Number: <strong>{formData.forceNumber}</strong></li>
                </ul>
                <p>Please save these credentials. Redirecting to bootcampers list...</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                {step === 1 ? (
                  <div className="form-section">
                    <h3 className="section-title">Personal Information</h3>
                    <div className="form-row">
                      <div className="form-group">
                        <label className="form-label required">Force Number</label>
                        <input
                          type="text"
                          name="forceNumber"
                          className={`form-control ${errors.forceNumber ? 'error' : ''}`}
                          value={formData.forceNumber}
                          onChange={handleChange}
                          placeholder="01234"
                          disabled={loading}
                        />
                        {errors.forceNumber && (
                          <div className="alert alert-danger">{errors.forceNumber}</div>
                        )}
                        <small className="form-text">Start with 0 followed by 3-5 digits</small>
                      </div>

                      <div className="form-group">
                        <label className="form-label required">Email Address</label>
                        <input
                          type="email"
                          name="email"
                          className={`form-control ${errors.email ? 'error' : ''}`}
                          value={formData.email}
                          onChange={handleChange}
                          placeholder="example@email.com"
                          disabled={loading}
                        />
                        {errors.email && (
                          <div className="alert alert-danger">{errors.email}</div>
                        )}
                      </div>

                      <div className="form-group">
                        <label className="form-label required">Password</label>
                        <div className="password-group">
                          <input
                            type="password"
                            name="password"
                            className={`form-control ${errors.password ? 'error' : ''}`}
                            value={formData.password}
                            onChange={handleChange}
                            placeholder="Enter password"
                            disabled={loading}
                          />
                          <button
                            type="button"
                            className="btn btn-sm btn-outline"
                            onClick={handleGeneratePassword}
                            disabled={loading}
                          >
                            Generate
                          </button>
                        </div>
                        {errors.password && (
                          <div className="alert alert-danger">{errors.password}</div>
                        )}
                        <small className="form-text">Minimum 8 characters with uppercase, lowercase, number & special character</small>
                      </div>

                      <div className="form-group">
                        <label className="form-label required">Confirm Password</label>
                        <input
                          type="password"
                          name="confirmPassword"
                          className={`form-control ${errors.confirmPassword ? 'error' : ''}`}
                          value={formData.confirmPassword}
                          onChange={handleChange}
                          placeholder="Confirm password"
                          disabled={loading}
                        />
                        {errors.confirmPassword && (
                          <div className="alert alert-danger">{errors.confirmPassword}</div>
                        )}
                      </div>

                      <div className="form-group">
                        <label className="form-label required">Full Name</label>
                        <input
                          type="text"
                          name="fullName"
                          className={`form-control ${errors.fullName ? 'error' : ''}`}
                          value={formData.fullName}
                          onChange={handleChange}
                          placeholder="John Doe"
                          disabled={loading}
                        />
                        {errors.fullName && (
                          <div className="alert alert-danger">{errors.fullName}</div>
                        )}
                      </div>

                      <div className="form-group">
                        <label className="form-label required">Serial</label>
                        <select
                          name="serial"
                          className={`form-control ${errors.serial ? 'error' : ''}`}
                          value={formData.serial}
                          onChange={handleChange}
                          disabled={loading}
                        >
                          <option value="">Select Serial</option>
                          {SERIALS.map(serial => (
                            <option key={serial} value={serial}>{serial}</option>
                          ))}
                        </select>
                        {errors.serial && (
                          <div className="alert alert-danger">{errors.serial}</div>
                        )}
                      </div>

                      <div className="form-group">
                        <label className="form-label required">Date of Birth</label>
                        <input
                          type="date"
                          name="dateOfBirth"
                          className={`form-control ${errors.dateOfBirth ? 'error' : ''}`}
                          value={formData.dateOfBirth}
                          onChange={handleChange}
                          max={new Date().toISOString().split('T')[0]}
                          min="1900-01-01"
                          disabled={loading}
                        />
                        {errors.dateOfBirth && (
                          <div className="alert alert-danger">{errors.dateOfBirth}</div>
                        )}
                        {formData.dateOfBirth && (
                          <small className="form-text text-success">
                            Age: {formData.age || 'Calculating...'} years
                          </small>
                        )}
                      </div>

                      <div className="form-group">
                        <label className="form-label required">ID/Birth Certificate Number</label>
                        <input
                          type="text"
                          name="idNumber"
                          className={`form-control ${errors.idNumber ? 'error' : ''}`}
                          value={formData.idNumber}
                          onChange={handleChange}
                          placeholder="12 digit number"
                          maxLength="12"
                          disabled={loading}
                        />
                        {errors.idNumber && (
                          <div className="alert alert-danger">{errors.idNumber}</div>
                        )}
                      </div>

                      <div className="form-group">
                        <label className="form-label required">Gender</label>
                        <select
                          name="gender"
                          className={`form-control ${errors.gender ? 'error' : ''}`}
                          value={formData.gender}
                          onChange={handleChange}
                          disabled={loading}
                        >
                          <option value="">Select Gender</option>
                          {GENDERS.map(gender => (
                            <option key={gender} value={gender}>{gender}</option>
                          ))}
                        </select>
                        {errors.gender && (
                          <div className="alert alert-danger">{errors.gender}</div>
                        )}
                      </div>

                      <div className="form-group">
                        <label className="form-label required">District</label>
                        <select
                          name="district"
                          className={`form-control ${errors.district ? 'error' : ''}`}
                          value={formData.district}
                          onChange={handleChange}
                          disabled={loading}
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

                      <div className="form-group">
                        <label className="form-label required">Physical Location</label>
                        <textarea
                          name="location"
                          className={`form-control ${errors.location ? 'error' : ''}`}
                          value={formData.location}
                          onChange={handleChange}
                          placeholder="Detailed physical address"
                          rows="2"
                          disabled={loading}
                        />
                        {errors.location && (
                          <div className="alert alert-danger">{errors.location}</div>
                        )}
                      </div>

                      <div className="form-group">
                        <label className="form-label required">Phone Number</label>
                        <div className="phone-input-group">
                          <div className="phone-prefix">+266</div>
                          <input
                            type="text"
                            name="phone"
                            className={`form-control ${errors.phone ? 'error' : ''}`}
                            value={formData.phone.replace('+266', '')}
                            onChange={(e) => handleChange({
                              target: {
                                name: 'phone',
                                value: '+266' + e.target.value
                              }
                            })}
                            placeholder="50123456"
                            maxLength="8"
                            disabled={loading}
                          />
                        </div>
                        {errors.phone && (
                          <div className="alert alert-danger">{errors.phone}</div>
                        )}
                      </div>
                    </div>

                    <div className="form-actions">
                      <button
                        type="button"
                        className="btn btn-primary"
                        onClick={handleNext}
                        disabled={loading}
                      >
                        Next: Education Details
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="form-section">
                      <h3 className="section-title">Education & Work Details</h3>
                      <div className="form-group">
                        <label className="form-label required">Education Level</label>
                        <select
                          name="educationLevel"
                          className="form-control"
                          value={formData.educationLevel}
                          onChange={handleChange}
                          disabled={loading}
                        >
                          <option value="">Select Education Level</option>
                          {EDUCATION_LEVELS.map(level => (
                            <option key={level} value={level}>{level}</option>
                          ))}
                        </select>
                      </div>

                      {formData.educationLevel === 'Still in High School' && (
                        <>
                          <div className="form-group">
                            <label className="form-label">High School</label>
                            <input
                              type="text"
                              name="highSchool"
                              className="form-control"
                              value={formData.highSchool}
                              onChange={handleChange}
                              placeholder="Name of high school"
                              disabled={loading}
                              list="highSchoolSuggestions"
                            />
                            <datalist id="highSchoolSuggestions">
                              {HIGH_SCHOOL_SUGGESTIONS.map(school => (
                                <option key={school} value={school} />
                              ))}
                            </datalist>
                          </div>
                          <div className="form-group">
                            <label className="form-label">Grade</label>
                            <select
                              name="grade"
                              className="form-control"
                              value={formData.grade}
                              onChange={handleChange}
                              disabled={loading}
                            >
                              <option value="">Select Grade</option>
                              {GRADES.map(grade => (
                                <option key={grade} value={grade}>{grade}</option>
                              ))}
                            </select>
                          </div>
                        </>
                      )}

                      {formData.educationLevel === 'In Tertiary/University' && (
                        <>
                          <div className="form-group">
                            <label className="form-label">University/College</label>
                            <input
                              type="text"
                              name="university"
                              className="form-control"
                              value={formData.university}
                              onChange={handleChange}
                              placeholder="Name of institution"
                              disabled={loading}
                              list="universitySuggestions"
                            />
                            <datalist id="universitySuggestions">
                              {UNIVERSITY_SUGGESTIONS.map(university => (
                                <option key={university} value={university} />
                              ))}
                            </datalist>
                          </div>
                          <div className="form-group">
                            <label className="form-label">Course</label>
                            <input
                              type="text"
                              name="course"
                              className="form-control"
                              value={formData.course}
                              onChange={handleChange}
                              placeholder="Course/Program"
                              disabled={loading}
                              list="courseSuggestions"
                            />
                            <datalist id="courseSuggestions">
                              {COURSE_SUGGESTIONS.map(course => (
                                <option key={course} value={course} />
                              ))}
                            </datalist>
                          </div>
                          <div className="form-group">
                            <label className="form-label">Year of Study</label>
                            <input
                              type="text"
                              name="year"
                              className="form-control"
                              value={formData.year}
                              onChange={handleChange}
                              placeholder="e.g., Year 2"
                              disabled={loading}
                            />
                          </div>
                        </>
                      )}

                      {formData.educationLevel === 'Graduate' && (
                        <>
                          <div className="form-group">
                            <label className="form-label">Workplace</label>
                            <input
                              type="text"
                              name="workplace"
                              className="form-control"
                              value={formData.workplace}
                              onChange={handleChange}
                              placeholder="Company/Organization"
                              disabled={loading}
                            />
                          </div>
                          <div className="form-group">
                            <label className="form-label">Position</label>
                            <input
                              type="text"
                              name="position"
                              className="form-control"
                              value={formData.position}
                              onChange={handleChange}
                              placeholder="Job title/Position"
                              disabled={loading}
                              list="positionSuggestions"
                            />
                            <datalist id="positionSuggestions">
                              {POSITION_SUGGESTIONS.map(position => (
                                <option key={position} value={position} />
                              ))}
                            </datalist>
                          </div>
                        </>
                      )}
                    </div>

                    <div className="form-section">
                      <h3 className="section-title">Document Uploads</h3>
                      <div className="form-group">
                        <label className="form-label required">Passport Photo</label>
                        <input
                          type="file"
                          name="photo"
                          className={`form-control ${errors.photo ? 'error' : ''}`}
                          onChange={handleChange}
                          accept=".jpg,.jpeg,.png"
                          disabled={loading}
                        />
                        {errors.photo && (
                          <div className="alert alert-danger">{errors.photo}</div>
                        )}
                        <small className="form-text">JPG or PNG format, maximum 2MB</small>
                      </div>

                      {formData.educationLevel === 'Still in High School' && (
                        <div className="form-group">
                          <label className="form-label">High School Transcripts</label>
                          <input
                            type="file"
                            name="highSchoolTranscripts"
                            className="form-control"
                            onChange={handleChange}
                            accept=".pdf,.jpg,.jpeg,.png"
                            multiple
                            disabled={loading}
                          />
                          <small className="form-text">Upload transcripts (PDF, JPG, PNG)</small>
                        </div>
                      )}

                      {(formData.educationLevel === 'In Tertiary/University' || formData.educationLevel === 'Graduate') && (
                        <div className="form-group">
                          <label className="form-label">Tertiary Transcripts/Certificates</label>
                          <input
                            type="file"
                            name="tertiaryTranscripts"
                            className="form-control"
                            onChange={handleChange}
                            accept=".pdf,.jpg,.jpeg,.png"
                            multiple
                            disabled={loading}
                          />
                          <small className="form-text">Upload transcripts or certificates (PDF, JPG, PNG)</small>
                        </div>
                      )}
                    </div>

                    <div className="form-actions">
                      <div className="button-group">
                        <button
                          type="button"
                          className="btn btn-outline"
                          onClick={handleBack}
                          disabled={loading}
                        >
                          Back
                        </button>
                        <button
                          type="submit"
                          className="btn btn-primary"
                          disabled={loading}
                        >
                          {loading ? (
                            <>
                              <span className="spinner spinner-sm"></span>
                              Adding Bootcamper...
                            </>
                          ) : (
                            'Complete Registration'
                          )}
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddBootcamper;