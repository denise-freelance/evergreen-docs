import apiClient from "@/lib/api-client";

export interface AuditLog {
  id: string;
  user_name: string;
  action: string;
  target: string | null;
  ip_address: string | null;
  created_at: string;
}

export interface AuditFilters {
  action?: string;
  date_from?: string;
  date_to?: string;
  limit?: string;
}

export const auditService = {
  async getLogs(filters?: AuditFilters): Promise<AuditLog[]> {
    const params: Record<string, string> = {};
    if (filters?.action && filters.action !== "all") params.action = filters.action;
    if (filters?.date_from) params.date_from = filters.date_from;
    if (filters?.date_to) params.date_to = filters.date_to;
    if (filters?.limit) params.limit = filters.limit;
    return apiClient.get<AuditLog[]>("/audit-logs", params);
  },
};
