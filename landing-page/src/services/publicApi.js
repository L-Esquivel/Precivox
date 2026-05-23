import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'https://precivox-backend.onrender.com';

const publicApi = axios.create({
  baseURL: API_URL,
});

export const getStorefrontData = (tenantSlug) => {
  return publicApi.get(`/api/public/storefront/${tenantSlug}`);
};