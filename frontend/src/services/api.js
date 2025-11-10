import axios from 'axios';

const API_BASE_URL = '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authAPI = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  requestOTP: (email) => api.post('/auth/request-otp', { email }),
  verifyOTP: (email, otp) => api.post('/auth/verify-otp', { email, otp })
};

export const pdfAPI = {
  generatePDF: async (letterType, data) => {
    const response = await api.post('/pdf/generate', { letterType, data }, {
      responseType: 'blob'
    });
    return response.data;
  },
  sendEmail: async (letterType, data) => {
    const response = await api.post('/pdf/send-email', { letterType, data });
    return response.data;
  }
};

export default api;
