import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  auth, 
  db 
} from '../../firebase/config';
import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
  fetchSignInMethodsForEmail
} from 'firebase/auth';
import { 
  doc, 
  setDoc, 
  serverTimestamp 
} from 'firebase/firestore';
import {
  validateForceNumber,
  validatePhoneNumber,
  validateEmail,
  validateRequired,
  validateUniversity,
  validateCourse,
  validateHighSchool,
  validateWorkplace,
  validatePosition,
  validateLocation,
  validateYearOfStudy,
  validateDateOfBirth,
  validateIDNumber,
  validatePassword,
  validatePhoto,
  validateTranscript
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

const Register = () => {
  const navigate = useNavigate();
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

  // Helper function to compress image and convert to base64 with size limit
  const compressImage = (file, maxSizeKB = 500) => {
    return new Promise((resolve, reject) => {
      if (!file.type.match('image.*')) {
        reject(new Error('File is not an image'));
        return;
      }

      const maxSizeBytes = maxSizeKB * 1024;
      
      // If file is already small enough, just convert to base64
      if (file.size <= maxSizeBytes) {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
        return;
      }

      // Create image to compress
      const img = new Image();
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      img.onload = () => {
        // Calculate new dimensions (max 800px width/height)
        const maxDimension = 800;
        let width = img.width;
        let height = img.height;
        
        if (width > height && width > maxDimension) {
          height = (height * maxDimension) / width;
          width = maxDimension;
        } else if (height > maxDimension) {
          width = (width * maxDimension) / height;
          height = maxDimension;
        }
        
        canvas.width = width;
        canvas.height = height;
        
        // Draw compressed image
        ctx.drawImage(img, 0, 0, width, height);
        
        // Convert to base64 with quality adjustment
        let quality = 0.9;
        let compressedBase64;
        
        const compressIteration = () => {
          compressedBase64 = canvas.toDataURL('image/jpeg', quality);
          const base64Size = compressedBase64.length - (compressedBase64.indexOf(',') + 1);
          const sizeInKB = (base64Size * 0.75) / 1024; // Approximate base64 to bytes
          
          if (sizeInKB > maxSizeKB && quality > 0.3) {
            quality -= 0.1;
            compressIteration();
          } else {
            resolve(compressedBase64);
          }
        };
        
        compressIteration();
      };
      
      img.onerror = reject;
      img.src = URL.createObjectURL(file);
    });
  };

  // Helper function to check if email exists before registration
  const checkEmailExists = async (email) => {
    try {
      const methods = await fetchSignInMethodsForEmail(auth, email);
      return methods.length > 0;
    } catch (error) {
      console.error('Error checking email:', error);
      return false;
    }
  };

  // Convert file to base64 (for non-image files or already small files)
  const convertFileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = error => reject(error);
    });
  };

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    
    if (files) {
      if (files.length > 0) {
        if (name === 'photo') {
          setFormData({ ...formData, [name]: files[0] });
        } 
        else if (name === 'highSchoolTranscripts' || name === 'tertiaryTranscripts') {
          const filesArray = Array.from(files);
          setFormData({ ...formData, [name]: filesArray });
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

  const validateStep2 = () => {
    const newErrors = {};

    if (!validateRequired(formData.educationLevel)) {
      newErrors.educationLevel = 'Education level is required';
    }

    if (formData.educationLevel === 'Still in High School') {
      if (!validateHighSchool(formData.highSchool)) {
        newErrors.highSchool = 'High school name is required (minimum 3 characters)';
      }
      if (!validateRequired(formData.grade)) {
        newErrors.grade = 'Grade is required';
      }
    } 
    else if (formData.educationLevel === 'In Tertiary/University' || 
             formData.educationLevel === 'Graduate') {
      if (!validateUniversity(formData.university)) {
        newErrors.university = 'University/Institution is required (minimum 3 characters)';
      }
      if (!validateCourse(formData.course)) {
        newErrors.course = 'Course/Program is required (minimum 2 characters)';
      }
      
      if (formData.highSchoolTranscripts.length === 0) {
        newErrors.highSchoolTranscripts = 'At least one high school transcript is required';
      }
      
      if (formData.educationLevel === 'Graduate' && formData.tertiaryTranscripts.length === 0) {
        newErrors.tertiaryTranscripts = 'At least one tertiary transcript is required for graduates';
      }
    } 
    else if (formData.educationLevel === 'Working') {
      if (!validateWorkplace(formData.workplace)) {
        newErrors.workplace = 'Workplace is required (minimum 2 characters)';
      }
      if (!validatePosition(formData.position)) {
        newErrors.position = 'Position is required (minimum 2 characters)';
      }
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    setLoading(true);

    const step1Errors = validateStep1();
    const step2Errors = validateStep2();
    const allErrors = { ...step1Errors, ...step2Errors };

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
      // 1. Check if email already exists BEFORE attempting registration
      const emailExists = await checkEmailExists(formData.email);
      if (emailExists) {
        setErrors({ 
          general: 'Email already registered. Please use a different email or try logging in.' 
        });
        setLoading(false);
        return;
      }

      // 2. Create Firebase Auth user
      const userCredential = await createUserWithEmailAndPassword(
        auth, 
        formData.email, 
        formData.password
      );
      
      const user = userCredential.user;
      const userId = user.uid; // This is the authUid

      // 3. Send verification email
      await sendEmailVerification(user);

      // 4. Process photo - compress to avoid Firestore size limits
      let photoBase64;
      try {
        photoBase64 = await compressImage(formData.photo, 300); // Max 300KB
        console.log('Photo compressed, size:', photoBase64.length, 'chars');
      } catch (photoError) {
        console.error('Photo compression error:', photoError);
        photoBase64 = await convertFileToBase64(formData.photo);
      }

      // 5. Process transcripts (limit size for Firestore)
      const highSchoolTranscriptsBase64 = await Promise.all(
        formData.highSchoolTranscripts.map(async (file) => {
          if (file.type.match('image.*')) {
            try {
              return await compressImage(file, 200); // Max 200KB for transcript images
            } catch (error) {
              return await convertFileToBase64(file);
            }
          } else {
            return await convertFileToBase64(file);
          }
        })
      );

      const tertiaryTranscriptsBase64 = await Promise.all(
        formData.tertiaryTranscripts.map(async (file) => {
          if (file.type.match('image.*')) {
            try {
              return await compressImage(file, 200); // Max 200KB for transcript images
            } catch (error) {
              return await convertFileToBase64(file);
            }
          } else {
            return await convertFileToBase64(file);
          }
        })
      );

      // 6. Check if total data is reasonable for Firestore
      const totalSize = photoBase64.length + 
                       highSchoolTranscriptsBase64.reduce((sum, item) => sum + item.length, 0) +
                       tertiaryTranscriptsBase64.reduce((sum, item) => sum + item.length, 0);
      
      const maxFirestoreDocSize = 1048487; // ~1MB
      if (totalSize > maxFirestoreDocSize) {
        throw new Error('Total document size exceeds Firestore limit. Please upload smaller files.');
      }

      // 7. Calculate age
      const birthDate = new Date(formData.dateOfBirth);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }

      // 8. Prepare user data for Firestore
      const userData = {
        // Personal Information
        email: formData.email.toLowerCase(),
        fullName: formData.fullName,
        forceNumber: formData.forceNumber,
        serial: formData.serial,
        dateOfBirth: formData.dateOfBirth,
        idNumber: formData.idNumber,
        gender: formData.gender,
        age: age,
        
        // Contact Information
        district: formData.district,
        location: formData.location,
        phone: formData.phone,
        
        // Education Information
        educationLevel: formData.educationLevel,
        highSchool: formData.highSchool || '',
        grade: formData.grade || '',
        university: formData.university || '',
        course: formData.course || '',
        year: formData.year || '',
        workplace: formData.workplace || '',
        position: formData.position || '',
        
        // Files stored as base64 strings (compressed)
        photo: photoBase64,
        highSchoolTranscripts: highSchoolTranscriptsBase64,
        tertiaryTranscripts: tertiaryTranscriptsBase64,
        
        // For backward compatibility with your dashboard
        photoUrl: photoBase64,
        highSchoolTranscriptURLs: highSchoolTranscriptsBase64,
        tertiaryTranscriptURLs: tertiaryTranscriptsBase64,
        
        // System Information
        authUid: userId,
        passwordChanged: false,
        status: 'active',
        registeredBy: 'self',
        registeredAt: serverTimestamp(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        emailVerified: false,
        role: 'bootcamper',
        
        // Metadata for debugging
        fileSizes: {
          photo: photoBase64.length,
          highSchoolTranscripts: highSchoolTranscriptsBase64.reduce((sum, item) => sum + item.length, 0),
          tertiaryTranscripts: tertiaryTranscriptsBase64.reduce((sum, item) => sum + item.length, 0),
          total: totalSize
        }
      };

      // 9. Save to Firestore (bootcampers collection) with authUid as document ID
      await setDoc(doc(db, 'bootcampers', userId), userData);
      
      setSuccess(true);
      setLoading(false);
      
      // Store user info in localStorage for immediate access
      localStorage.setItem('currentEmail', formData.email);
      localStorage.setItem('currentForceNumber', formData.forceNumber);
      localStorage.setItem('currentUser', JSON.stringify({
        uid: userId,
        email: formData.email,
        forceNumber: formData.forceNumber
      }));
      
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (error) {
      console.error('Registration error:', error);
      
      let errorMessage = 'Registration failed. Please try again.';
      
      switch (error.code) {
        case 'auth/email-already-in-use':
          errorMessage = 'Email already registered. Please use a different email.';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Invalid email address.';
          break;
        case 'auth/weak-password':
          errorMessage = 'Password is too weak.';
          break;
        case 'auth/network-request-failed':
          errorMessage = 'Network error. Please check your internet connection.';
          break;
        case 'permission-denied':
          errorMessage = 'Permission denied. Please check if you have proper access rights.';
          break;
        default:
          if (error.message.includes('Firestore limit')) {
            errorMessage = error.message;
          } else if (error.message.includes('insufficient permissions')) {
            errorMessage = 'Database permission error. Please contact support.';
          }
      }
      
      setErrors({ general: errorMessage });
      setLoading(false);
    }
  };

  const renderStep1 = () => (
    <div className="form-section">
      <h3 className="section-title">Step 1: Personal Information & Login Details</h3>
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
            disabled={loading || success}
          />
          {errors.forceNumber && (
            <div className="alert alert-danger">{errors.forceNumber}</div>
          )}
          <small className="form-text">Must start with 0 followed by 3-5 digits</small>
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
            disabled={loading || success}
          />
          {errors.email && (
            <div className="alert alert-danger">{errors.email}</div>
          )}
          <small className="form-text">This will be your username for login</small>
          <small className="form-text text-warning">
            We'll check if this email is already registered before submission
          </small>
        </div>

        <div className="form-group">
          <label className="form-label required">Password</label>
          <input
            type="password"
            name="password"
            className={`form-control ${errors.password ? 'error' : ''}`}
            value={formData.password}
            onChange={handleChange}
            placeholder="Enter password"
            disabled={loading || success}
          />
          {errors.password && (
            <div className="alert alert-danger">{errors.password}</div>
          )}
          <small className="form-text">Minimum 8 characters with letters, numbers, and special characters</small>
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
            disabled={loading || success}
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
            disabled={loading || success}
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
            disabled={loading || success}
          >
            <option value="">Select Serial</option>
            {SERIALS.map((serial, index) => (
              <option key={index} value={serial}>{serial}</option>
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
            disabled={loading || success}
          />
          {errors.dateOfBirth && (
            <div className="alert alert-danger">{errors.dateOfBirth}</div>
          )}
          <small className="form-text">Your </small> 
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
            disabled={loading || success}
          />
          {errors.idNumber && (
            <div className="alert alert-danger">{errors.idNumber}</div>
          )}
          <small className="form-text">Must be exactly 12 digits</small>
        </div>

        <div className="form-group">
          <label className="form-label required">Gender</label>
          <select
            name="gender"
            className={`form-control ${errors.gender ? 'error' : ''}`}
            value={formData.gender}
            onChange={handleChange}
            disabled={loading || success}
          >
            <option value="">Select Gender</option>
            {GENDERS.map((gender, index) => (
              <option key={index} value={gender}>{gender}</option>
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
            disabled={loading || success}
          >
            <option value="">Select District</option>
            {DISTRICTS.map((district, index) => (
              <option key={index} value={district}>{district}</option>
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
            disabled={loading || success}
          />
          {errors.location && (
            <div className="alert alert-danger">{errors.location}</div>
          )}
          <small className="form-text">Provide detailed location for easier contact</small>
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
              disabled={loading || success}
            />
          </div>
          {errors.phone && (
            <div className="alert alert-danger">{errors.phone}</div>
          )}
          <small className="form-text">Enter 8 digits starting with 5 or 6</small>
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
  );

  const renderStep2 = () => (
    <>
      <div className="form-section education-section">
        <h3 className="section-title">Step 2: Education & Work Details</h3>
        <div className="form-group">
          <label className="form-label required">Education Level</label>
          <select
            name="educationLevel"
            className={`form-control ${errors.educationLevel ? 'error' : ''}`}
            value={formData.educationLevel}
            onChange={handleChange}
            disabled={loading || success}
          >
            <option value="">Select Education Level</option>
            {EDUCATION_LEVELS.map((level, index) => (
              <option key={index} value={level}>{level}</option>
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
                placeholder="Type your high school name"
                list="highSchoolSuggestions"
                disabled={loading || success}
              />
              <datalist id="highSchoolSuggestions">
                {HIGH_SCHOOL_SUGGESTIONS.map((school, index) => (
                  <option key={index} value={school}>{school}</option>
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
                disabled={loading || success}
              >
                <option value="">Select Grade</option>
                {GRADES.map((grade, index) => (
                  <option key={index} value={grade}>{grade}</option>
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
                  disabled={loading || success}
                />
                <datalist id="universitySuggestions">
                  {UNIVERSITY_SUGGESTIONS.map((univ, index) => (
                    <option key={index} value={univ}>{univ}</option>
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
                  disabled={loading || success}
                />
                <datalist id="courseSuggestions">
                  {COURSE_SUGGESTIONS.map((course, index) => (
                    <option key={index} value={course}>{course}</option>
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
                  disabled={loading || success}
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
                placeholder="Type where you work"
                disabled={loading || success}
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
                disabled={loading || success}
              />
              <datalist id="positionSuggestions">
                {POSITION_SUGGESTIONS.map((position, index) => (
                  <option key={index} value={position}>{position}</option>
                ))}
              </datalist>
              {errors.position && (
                <div className="alert alert-danger">{errors.position}</div>
              )}
            </div>
            
            <div className="form-group">
              <label className="form-label">High School Name (Optional)</label>
              <input
                type="text"
                name="highSchool"
                className={`form-control ${errors.highSchool ? 'error' : ''}`}
                value={formData.highSchool}
                onChange={handleChange}
                placeholder="Type your high school name if applicable"
                list="highSchoolSuggestions"
                disabled={loading || success}
              />
              <datalist id="highSchoolSuggestions">
                {HIGH_SCHOOL_SUGGESTIONS.map((school, index) => (
                  <option key={index} value={school}>{school}</option>
                ))}
              </datalist>
              {errors.highSchool && (
                <div className="alert alert-danger">{errors.highSchool}</div>
              )}
            </div>
          </div>
        )}

        <div className="form-row">
          {(formData.educationLevel === 'In Tertiary/University' || 
            formData.educationLevel === 'Graduate' || 
            formData.educationLevel === 'Working') && (
            <div className="form-group">
              <label className="form-label">
                High School Transcript(s)
                {(formData.educationLevel === 'In Tertiary/University' || 
                  formData.educationLevel === 'Graduate') && 
                  <span className="text-danger"> *</span>}
              </label>
              <input
                type="file"
                name="highSchoolTranscripts"
                className={`form-control ${errors.highSchoolTranscripts ? 'error' : ''}`}
                onChange={handleChange}
                accept=".pdf,.jpg,.jpeg,.png"
                disabled={loading || success}
                multiple
              />
              {errors.highSchoolTranscripts && (
                <div className="alert alert-danger">{errors.highSchoolTranscripts}</div>
              )}
              <small className="form-text">
                {formData.educationLevel === 'In Tertiary/University' || formData.educationLevel === 'Graduate' 
                  ? 'Upload your high school transcript(s) (Images will be compressed automatically)' 
                  : 'Optional: Upload your high school transcript(s) (Images will be compressed automatically)'}
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
                disabled={loading || success}
                multiple
              />
              {errors.tertiaryTranscripts && (
                <div className="alert alert-danger">{errors.tertiaryTranscripts}</div>
              )}
              <small className="form-text">Images will be compressed automatically to save space</small>
            </div>
          )}
        </div>
      </div>

      <div className="form-section">
        <h3 className="section-title">Step 3: Photo Upload</h3>
        <div className="form-group">
          <label className="form-label required">Passport Photo</label>
          <input
            type="file"
            name="photo"
            className={`form-control ${errors.photo ? 'error' : ''}`}
            onChange={handleChange}
            accept=".jpg,.jpeg,.png"
            disabled={loading || success}
          />
          {errors.photo && (
            <div className="alert alert-danger">{errors.photo}</div>
          )}
          <small className="form-text">
            Upload a passport-sized photo in bootcamp attire (max 2MB, will be compressed automatically)
          </small>
        </div>
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
            disabled={loading || success}
          >
            {loading ? (
              <>
                <span className="spinner spinner-sm"></span>
                Registering...
              </>
            ) : success ? (
              'Registration Complete!'
            ) : (
              'Complete Registration'
            )}
          </button>
        </div>
      </div>
    </>
  );

  return (
    <div className="register-container">
      <div className="register-card">
        <div className="register-header">
          <h1>Bootcamper Registration</h1>
          <p>Lesotho Defense Force Youth Development Program</p>
          <div className="progress-steps">
            <div className={`step ${step >= 1 ? 'active' : ''}`}>1. Personal Info & Login</div>
            <div className={`step ${step >= 2 ? 'active' : ''}`}>2. Education Details</div>
            <div className={`step ${step === 3 ? 'active' : ''}`}>3. Finalize</div>
          </div>
        </div>

        {errors.general && (
          <div className="alert alert-danger">
            <strong>Error:</strong> {errors.general}
          </div>
        )}

        {success ? (
          <div className="alert alert-success">
            <h4>🎉 Registration Successful!</h4>
            <p>Your account has been created successfully.</p>
            <p><strong>Important:</strong> Please check your email to verify your account.</p>
            <p><strong>Login Details:</strong></p>
            <ul>
              <li>Email: <strong>{formData.email}</strong></li>
              <li>Force Number: <strong>{formData.forceNumber}</strong></li>
              <li>You will be required to change your password on first login</li>
            </ul>
            <p>You will be redirected to the login page in a few seconds...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {step === 1 ? renderStep1() : renderStep2()}
            
            <div className="text-center mt-3">
              <p className="text-muted">
                Already have an account?{' '}
                <Link to="/login" className="text-primary">
                  Login here
                </Link>
              </p>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default Register;