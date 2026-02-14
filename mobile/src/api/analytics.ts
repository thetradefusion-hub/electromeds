import { api } from "./client";

export type DashboardStats = {
  totalPatients: number;
  todayPatients: number;
  pendingFollowUps: number;
  totalPrescriptions: number;
};

type ApiResponse<T> = {
  success: boolean;
  data: T;
};

export async function getDashboardStats(): Promise<DashboardStats> {
  const res = await api.get<ApiResponse<DashboardStats>>("/analytics/dashboard");
  if (!res.data?.success || res.data?.data == null) {
    throw new Error("Failed to load dashboard stats");
  }
  return res.data.data;
}
