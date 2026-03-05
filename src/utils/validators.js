export const validateForceNumber = (forceNumber) => {
  return /^0\d{3,5}$/.test(forceNumber);
};

export const validatePhoneNumber = (phone) => {
  return /^\+266[56]\d{7}$/.test(phone);
};

export const validateEmail = (email) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

export const validateRequired = (value) => {
  return value && value.trim().length > 0;
};

export const validatePassword = (password) => {
  return password.length >= 8 && 
         /[A-Z]/.test(password) && 
         /[a-z]/.test(password) && 
         /\d/.test(password) && 
         /[!@#$%^&*]/.test(password);
};

export const validatePhoto = (file) => {
  if (!file) return false;
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png'];
  return validTypes.includes(file.type) && file.size <= 2 * 1024 * 1024;
};

export const validateTranscript = (file) => {
  if (!file) return false;
  const validTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
  return validTypes.includes(file.type) && file.size <= 5 * 1024 * 1024;
};

export const validateLocation = (location) => {
  return location && location.trim().length >= 5;
};

export const validateDateOfBirth = (dob) => {
  if (!dob) return false;
  const birthDate = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age >= 16 && age <= 40;
};

export const validateIDNumber = (id) => {
  return /^\d{12}$/.test(id);
};

export const validateHighSchool = (school) => {
  return school && school.trim().length >= 3;
};

export const validateUniversity = (uni) => {
  return uni && uni.trim().length >= 3;
};

export const validateCourse = (course) => {
  return course && course.trim().length >= 2;
};

export const validateWorkplace = (workplace) => {
  return workplace && workplace.trim().length >= 2;
};

export const validatePosition = (position) => {
  return position && position.trim().length >= 2;
};

export const validateYearOfStudy = (year) => {
  return year && year.trim().length > 0;
};