import axios from 'axios';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
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
  dashboard: {
    stats: '/dashboard/stats'
  }
};
