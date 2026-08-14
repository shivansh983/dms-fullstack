export const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v).trim());

export function validateLogin({ email, password }) {
  const errors = {};

  if (!email?.trim()) errors.email = 'Email is required';
  else if (!isEmail(email)) errors.email = 'Enter a valid email address';

  if (!password) errors.password = 'Password is required';
  else if (password.length < 6) errors.password = 'Password must be at least 6 characters';

  return { errors, isValid: Object.keys(errors).length === 0 };
}

export function validateRegister(values) {
  const { errors } = validateLogin(values);
  if (!values.name?.trim()) errors.name = 'Name is required';
  if (values.password !== values.confirmPassword) errors.confirmPassword = 'Passwords do not match';
  return { errors, isValid: Object.keys(errors).length === 0 };
}