const BASE = import.meta.env.VITE_API_URL || 'https://precivox-backend.onrender.com';
const API_URL = `${BASE.replace(/\/$/, '')}/settings/public/storefront`;

export const storefrontService = {
  async getStorefrontData(subdomain) {
    try {
      const response = await fetch(`${API_URL}/${subdomain}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Store not found for subdomain: ${subdomain}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error in storefrontService.getStorefrontData:', error);
      throw error;
    }
  },
};