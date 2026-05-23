import axios from 'axios';

// Use environment variables for the API URL with a fallback for local development
const API_URL = import.meta.env.VITE_API_URL || 'https://precivox-backend.onrender.com';

// Create and EXPORT the axios instance so it can be reused by other services
export const api = axios.create({
  baseURL: API_URL,
  withCredentials: true, // Important for sending cookies with session info
});

// Authentication endpoints, used by AuthContext
export const authAPI = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  
  // This is for the public customer registration
  register: (userData) => api.post('/auth/public/register', userData),

  logout: () => api.post('/auth/logout'),

  // Gets the current user from the server session
  me: () => api.get('/auth/me')
};

// The default export of fetchAPI is removed.
// The new standard is to import the 'api' instance and use it directly in service files.