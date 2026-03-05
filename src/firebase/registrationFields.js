// All registration fields for bootcampers
export const REGISTRATION_FIELDS = {
  // Personal Information (Required)
  PERSONAL: {
    forceNumber: {
      label: 'Force Number',
      required: true,
      type: 'text',
      pattern: '^0[0-9]{3,5}$',
      placeholder: '01234',
      help: 'Start with 0 followed by 3-5 digits'
    },
    fullName: {
      label: 'Full Name',
      required: true,
      type: 'text',
      placeholder: 'John Doe'
    },
    email: {
      label: 'Email Address',
      required: true,
      type: 'email',
      placeholder: 'example@email.com'
    },
    serial: {
      label: 'Serial',
      required: true,
      type: 'select',
      options: [
        'Serial 1', 'Serial 2', 'Serial 3', 'Serial 4',
        'Serial 5', 'Serial 6', 'Serial 7', 'Serial 8'
      ]
    }
  },
  
  // Demographic Information
  DEMOGRAPHIC: {
    dateOfBirth: {
      label: 'Date of Birth',
      required: true,
      type: 'date',
      min: '1975-01-01',
      max: '2008-12-31'
    },
    idNumber: {
      label: 'ID/Birth Certificate Number',
      required: true,
      type: 'text',
      pattern: '^[0-9]{12}$',
      placeholder: '12 digit number',
      maxLength: 12
    },
    gender: {
      label: 'Gender',
      required: true,
      type: 'select',
      options: ['Male', 'Female', 'Other']
    }
  },
  
  // Contact Information
  CONTACT: {
    district: {
      label: 'District',
      required: true,
      type: 'select',
      options: [
        'Maseru', 'Berea', 'Leribe', 'Butha-Buthe',
        'Mafeteng', 'Mohale\'s Hoek', 'Quthing', 'Qacha\'s Nek',
        'Mokhotlong', 'Thaba-Tseka'
      ]
    },
    location: {
      label: 'Physical Location',
      required: true,
      type: 'textarea',
      placeholder: 'Detailed physical address',
      minLength: 10
    },
    phone: {
      label: 'Phone Number',
      required: true,
      type: 'tel',
      pattern: '^\\+266[56][0-9]{7}$',
      placeholder: '+26650123456',
      prefix: '+266'
    }
  },
  
  // Education Information
  EDUCATION: {
    educationLevel: {
      label: 'Education Level',
      required: true,
      type: 'select',
      options: [
        'Still in High School',
        'In Tertiary/University',
        'Graduate',
        'Working'
      ]
    },
    highSchool: {
      label: 'High School',
      type: 'text',
      placeholder: 'Name of high school',
      showWhen: { educationLevel: 'Still in High School' }
    },
    grade: {
      label: 'Grade/Form',
      type: 'select',
      options: ['Form A', 'Form B', 'Form C', 'Form D', 'Form E'],
      showWhen: { educationLevel: 'Still in High School' }
    },
    university: {
      label: 'University/Institution',
      type: 'text',
      placeholder: 'Name of university or institution',
      showWhen: { educationLevel: ['In Tertiary/University', 'Graduate'] }
    },
    course: {
      label: 'Course/Program',
      type: 'text',
      placeholder: 'e.g., Computer Science, Business Administration',
      showWhen: { educationLevel: ['In Tertiary/University', 'Graduate'] }
    },
    year: {
      label: 'Year of Study',
      type: 'select',
      options: ['1st Year', '2nd Year', '3rd Year', '4th Year', 'Graduate'],
      showWhen: { educationLevel: ['In Tertiary/University', 'Graduate'] }
    }
  },
  
  // Work Information (for working bootcampers)
  WORK: {
    workplace: {
      label: 'Workplace/Organization',
      type: 'text',
      placeholder: 'Name of company or organization',
      showWhen: { educationLevel: 'Working' }
    },
    position: {
      label: 'Position/Job Title',
      type: 'text',
      placeholder: 'e.g., Manager, Officer, Assistant',
      showWhen: { educationLevel: 'Working' }
    }
  }
};

// Password requirements
export const PASSWORD_REQUIREMENTS = {
  minLength: 8,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: true,
  specialChars: '!@#$%^&*()_+-=[]{}|;:,.<>?'
};

// Age validation
export const AGE_REQUIREMENTS = {
  minAge: 16,
  maxAge: 40
};

// Phone number validation
export const PHONE_VALIDATION = {
  countryCode: '+266',
  validPrefixes: ['5', '6'],
  length: 8
};