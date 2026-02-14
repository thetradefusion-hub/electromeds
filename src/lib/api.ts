import axios, { AxiosInstance, AxiosError } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Create axios instance with performance optimizations
const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    // Note: Accept-Encoding is automatically handled by the browser
    // Setting it manually causes "Refused to set unsafe header" warning
  },
  withCredentials: false,
  timeout: 60000, // 60 seconds timeout (increased for NLP operations)
});

// Request interceptor - Add auth token; allow FormData (e.g. audio) to set its own Content-Type
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // When sending FormData (e.g. transcribe-audio), do not set Content-Type so axios
    // sends multipart/form-data with boundary; otherwise backend multer gets no file
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Unauthorized - clear token and redirect to login
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/auth';
    }
    return Promise.reject(error);
  }
);

export default api;

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  count?: number;
  errors?: any[];
}

export interface ApiError {
  success: false;
  message: string;
  errors?: any[];
}

