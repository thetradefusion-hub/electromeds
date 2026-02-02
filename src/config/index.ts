/**
 * Application Configuration
 * Centralized configuration management
 */

import { API_CONFIG, STORAGE_KEYS } from '@/constants';

// Environment configuration
export const env = {
  apiUrl: API_CONFIG.BASE_URL,
  isDevelopment: import.meta.env.DEV,
  isProduction: import.meta.env.PROD,
  mode: import.meta.env.MODE,
} as const;

// App configuration
export const appConfig = {
  name: 'Homeolytics',
  version: '1.0.0',
  description: 'Electro Homeopathy Clinical Management System',
  defaultLanguage: 'en',
  supportedLanguages: ['en', 'hi'],
} as const;

// API configuration
export const apiConfig = {
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
} as const;

// Storage configuration
export const storageConfig = {
  keys: STORAGE_KEYS,
  tokenKey: STORAGE_KEYS.TOKEN,
  userKey: STORAGE_KEYS.USER,
} as const;

// Export all config
export default {
  env,
  app: appConfig,
  api: apiConfig,
  storage: storageConfig,
};

