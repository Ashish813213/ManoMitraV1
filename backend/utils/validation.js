// Validation utilities

/**
 * Validate password strength
 */
const validatePassword = (password) => {
  const errors = [];

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  if (!/[!@#$%^&*]/.test(password)) {
    errors.push('Password must contain at least one special character (!@#$%^&*)');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Validate user registration data
 */
const validateRegistration = (data) => {
  const errors = {};

  if (!data.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.email = 'Valid email is required';
  }

  if (!data.fullName || data.fullName.trim().length < 2) {
    errors.fullName = 'Full name must be at least 2 characters';
  }

  const passwordValidation = validatePassword(data.password);
  if (!passwordValidation.isValid) {
    errors.password = passwordValidation.errors;
  }

  if (data.password !== data.confirmPassword) {
    errors.confirmPassword = 'Passwords do not match';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

/**
 * Validate therapist data
 */
const validateTherapistProfile = (data) => {
  const errors = {};

  if (!data.qualifications || data.qualifications.trim().length < 10) {
    errors.qualifications = 'Qualifications must be at least 10 characters';
  }

  if (!data.experienceYears || data.experienceYears < 0) {
    errors.experienceYears = 'Valid experience years required';
  }

  if (!data.specialization || !Array.isArray(data.specialization) || data.specialization.length === 0) {
    errors.specialization = 'At least one specialization is required';
  }

  if (!data.licenseNumber || data.licenseNumber.trim().length < 5) {
    errors.licenseNumber = 'Valid license number required';
  }

  if (!data.hourlyRate || data.hourlyRate <= 0) {
    errors.hourlyRate = 'Hourly rate must be greater than 0';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

module.exports = {
  validatePassword,
  validateRegistration,
  validateTherapistProfile,
};
