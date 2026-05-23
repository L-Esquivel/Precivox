import { api } from './api';

export const storefrontAPI = {
  getSections: async () => {
    const response = await api.get('/tenant/storefront/sections');
    return response.data;
  },
  // Future functions like createSection, updateSection, etc., will go here
};