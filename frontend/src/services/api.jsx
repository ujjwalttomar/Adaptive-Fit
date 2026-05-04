import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

const api = axios.create({ baseURL: API_URL });

api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  setupProfile: (data) => api.post('/auth/profile/setup', data),
  updateProfile: (data) => api.put('/auth/profile/update', data),
  getMe: () => api.get('/auth/me'),
};

export const mealAPI = {
  search: (query) => api.get(`/meals/search?query=${encodeURIComponent(query)}`),
  log: (data) => api.post('/meals/log', data),
  getToday: () => api.get('/meals/today'),
  getHistory: (days = 7) => api.get(`/meals/history?days=${days}`),
  delete: (id) => api.delete(`/meals/${id}`),
};

export const workoutAPI = {
  generatePlan: () => api.post('/workouts/plan/generate'),
  getPlan: () => api.get('/workouts/plan'),
  getToday: () => api.get('/workouts/today'),
  complete: (day) => api.post('/workouts/complete', { day }),
  skip: () => api.post('/workouts/skip'),
  getExercises: (params) => api.get('/workouts/exercises', { params }),
};

export const behaviorAPI = {
  getScore: () => api.get('/behavior/score'),
  getHistory: () => api.get('/behavior/history'),
};

export const chatAPI = {
  sendMessage: (message, sessionId) => api.post('/chat/message', { message, sessionId }),
  getHistory: () => api.get('/chat/history'),
  getSession: (sessionId) => api.get(`/chat/session/${sessionId}`),
};

export const dashboardAPI = {
  get: () => api.get('/dashboard'),
};

export default api;
