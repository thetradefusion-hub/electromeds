import axios from "axios";

// For web preview, localhost works directly if backend is running on the same machine.
// You can override this with EXPO_PUBLIC_API_URL for device testing.
const API_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:5000/api";

export const api = axios.create({
  baseURL: API_URL,
  timeout: 15000,
});

export function setAuthToken(token: string | null) {
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common.Authorization;
  }
}

