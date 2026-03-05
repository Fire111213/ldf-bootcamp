// Helper to ensure unique keys for React lists
export const getUniqueKey = (item, index) => {
  if (typeof item === 'object' && item.id) {
    return item.id;
  }
  return `${item}_${index}`;
};

// Format phone number
export const formatPhoneNumber = (phone) => {
  if (!phone) return '';
  if (phone.startsWith('+266')) return phone;
  if (phone.startsWith('266')) return `+${phone}`;
  if (phone.startsWith('0')) return `+266${phone.slice(1)}`;
  return `+266${phone}`;
};

// Format date for display
export const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-LS', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

// Calculate age from date of birth
export const calculateAge = (dateOfBirth) => {
  if (!dateOfBirth) return null;
  const birthDate = new Date(dateOfBirth);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
};