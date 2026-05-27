import axios from 'axios';

// It's a good practice to have a single, configured Axios instance.
// If you have a central apiClient, you should import and use it here.
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000',
  withCredentials: true, // Crucial for session management
});

/**
 * API service for tenant management.
 */
export const tenantsAPI = {
  getAll: () => apiClient.get('/api/tenants'),
  getById: (id) => apiClient.get(`/api/tenants/${id}`),
  update: (id, data) => apiClient.put(`/api/tenants/${id}`, data),
  create: (data) => apiClient.post('/api/tenants', data),
  delete: (id) => apiClient.delete(`/api/tenants/${id}`),
};