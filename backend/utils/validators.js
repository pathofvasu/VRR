const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const passwordPattern = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;

const normalizeEmail = (email) => email.trim().toLowerCase();

const isValidEmail = (email) => emailPattern.test(normalizeEmail(email));

const isValidPassword = (password) => passwordPattern.test(password);

module.exports = {
  normalizeEmail,
  isValidEmail,
  isValidPassword,
};
