const BASE = import.meta.env.VITE_API_URL || 'https://precivox-backend.onrender.com';
const API_URL = `${BASE.replace(/\/$/, '')}/tenants`;

// 💡 FIX: Renamed to tenantsAPI and methods to match component usage
export const tenantsAPI = {
  async getAll() {
    try {
      const response = await fetch(API_URL, { credentials: 'include' });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'You do not have permission to view this section');
      }
      return await response.json();
    } catch (error) {
      throw error;
    }
  },

  async create(data) {
    try {
      const response = await fetch(API_URL, {
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
      throw error;
    }
  },

  async getModules(id) {
    try {
      const response = await fetch(`${API_URL}/${id}/modules`, { credentials: 'include' });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error fetching tenant modules');
      }
      return await response.json();
    } catch (error) {
      throw error;
    }
  },

  async updateModules(id, data) {
    try {
      const response = await fetch(`${API_URL}/${id}/modules`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
      });
      const responseData = await response.json();
      if (!response.ok) {
        throw new Error(responseData.error || 'Error updating tenant modules');
      }
      return responseData;
    } catch (error) {
      throw error;
    }
  }
};