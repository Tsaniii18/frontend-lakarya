import axios from 'axios';
import { waitForServer } from './server-readiness';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: {
    Accept: 'application/json',
  },
});

api.interceptors.request.use(async (config) => {
  await waitForServer();
  return config;
});

export default api;
