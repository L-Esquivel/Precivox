import { api } from './api';

export const storefrontAPI = {
  getSections: async () => {
    // FIX: The full URL path for this endpoint is prefixed with /api
    const response = await api.get('/api/tenant/storefront/sections');
    return response.data;
  },
  // Future functions like createSection, updateSection, etc., will go here
  createSection: async (sectionData) => {
    // sectionData should be an object like { section_type: 'hero' }
    const response = await api.post('/api/tenant/storefront/sections', sectionData);
    return response.data;
  },
  deleteSection: async (sectionId) => {
    const response = await api.delete(`/api/tenant/storefront/sections/${sectionId}`);
    return response.data;
  },
  reorderSections: async (orderedIds) => {
    const response = await api.put('/api/tenant/storefront/sections/reorder', { ordered_ids: orderedIds });
    return response.data;
  },
  updateSection: async (sectionId, updateData) => {
    const response = await api.put(`/api/tenant/storefront/sections/${sectionId}`, updateData);
    return response.data;
  },
  uploadImage: async (imageData) => {
    // imageData is a FormData object
    const response = await api.post('/api/tenant/storefront/upload-image', imageData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
};