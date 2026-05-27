// 💡 FIX: Import the central, correctly configured 'api' instance from api.js
// This ensures it uses the VITE_API_URL environment variable and is consistent
// with the rest of the application.
import { api } from './api';

/**
 * API service for tenant management.
 */
export const tenantsAPI = {
  getAll: () => api.get('/api/tenants'),
  getById: (id) => api.get(`/api/tenants/${id}`),
  update: (id, data) => api.put(`/api/tenants/${id}`, data),
  create: (data) => api.post('/api/tenants', data),
  delete: (id) => api.delete(`/api/tenants/${id}`),
};