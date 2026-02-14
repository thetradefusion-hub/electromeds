import { api } from "./client";

export type User = {
  id: string;
  email: string;
  name?: string;
  role?: string;
};

export type AuthResponse = {
  token: string;
  user: User;
};

type BackendAuthResponse = {
  success: boolean;
  message: string;
  data: AuthResponse;
};

export async function loginRequest(email: string, password: string): Promise<AuthResponse> {
  const response = await api.post<BackendAuthResponse>("/auth/login", { email, password });
  return response.data.data;
}

export type DoctorSignupPayload = {
  name: string;
  email: string;
  password: string;
  phone?: string;
  registration_no: string;
  qualification: string;
  clinic_name: string;
};

export async function signupDoctor(payload: DoctorSignupPayload): Promise<AuthResponse> {
  const response = await api.post<BackendAuthResponse>("/auth/signup", {
    ...payload,
    role: "doctor",
  });
  return response.data.data;
}

