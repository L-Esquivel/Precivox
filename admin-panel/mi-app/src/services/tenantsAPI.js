// 💡 FIX: Use the fetch-based pattern consistent with other services.
const BASE = import.meta.env.VITE_API_URL || 'https://precivox-backend.onrender.com';
// The endpoint for tenants is under /api/tenants
const API_URL = `${BASE.replace(/\/$/, '')}/api/tenants`;

/**
 * API service for tenant management.
 */
export const tenantsAPI = {
  async getAll() {
    try {
      const response = await fetch(`${API_URL}/`, { credentials: 'include' });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Error loading tenants');
      }
      // The response from fetch is the data itself, not wrapped in a .data property
      return await response.json();
    } catch (error) {
      console.error('Error in tenantsAPI.getAll:', error);
      throw error;
    }
  },

  async getById(id) {
    try {
      const response = await fetch(`${API_URL}/${id}`, { credentials: 'include' });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Error loading tenant details');
      }
      return await response.json();
    } catch (error) {
      console.error(`Error in tenantsAPI.getById for id ${id}:`, error);
      throw error;
    }
  },

  async create(data) {
    try {
      const response = await fetch(`${API_URL}/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
      });
      const responseData = await response.json();
      if (!response.ok) {
        throw new Error(responseData.error || 'Error creating tenant');
      }
      return responseData;
    } catch (error) {
      console.error('Error in tenantsAPI.create:', error);
      throw error;
    }
  },

  async update(id, data) {
    try {
      const response = await fetch(`${API_URL}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
      });
      const responseData = await response.json();
      if (!response.ok) {
        throw new Error(responseData.error || 'Error updating tenant');
      }
      return responseData;
    } catch (error) {
      console.error(`Error in tenantsAPI.update for id ${id}:`, error);
      throw error;
    }
  },

  async delete(id) {
    try {
      const response = await fetch(`${API_URL}/${id}`, { method: 'DELETE', credentials: 'include' });
      const responseData = await response.json();
      if (!response.ok) {
        throw new Error(responseData.error || 'Error deleting tenant');
      }
      return responseData;
    } catch (error) {
      console.error(`Error in tenantsAPI.delete for id ${id}:`, error);
      throw error;
    }
  },
};