import axios from 'axios';
import { auth } from './firebase';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(async (config) => {
  if (auth.currentUser) {
    const token = await auth.currentUser.getIdToken();
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const endpoints = {
  workflows: {
    list: '/workflows',
    create: '/workflows',
    get: (id: string) => `/workflows/${id}`,
    update: (id: string) => `/workflows/${id}`,
    delete: (id: string) => `/workflows/${id}`,
    run: (id: string) => `/workflows/${id}/run`,
  },
  github: {
    deploy: '/github/deploy',
    download: (id: string) => `/github/download/${id}`,
  },
  dashboard: {
    stats: '/dashboard/stats'
  }
};
