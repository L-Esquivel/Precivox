import { api } from './api';

export const storefrontAPI = {
  getSections: async () => {
    // FIX: The full URL path for this endpoint is prefixed with /api
    const response = await api.get('/api/tenant/storefront/sections');
    return response.data;
  },
  // Future functions like createSection, updateSection, etc., will go here
};