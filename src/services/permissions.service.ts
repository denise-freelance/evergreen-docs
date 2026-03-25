import apiClient from "@/lib/api-client";

export interface Permission {
  user_id: string;
  group_id: string;
  permission: string;
}

export const permissionsService = {
  async getAll(): Promise<Permission[]> {
    return apiClient.get<Permission[]>("/permissions");
  },

  async upsert(data: Permission): Promise<Permission> {
    return apiClient.put<Permission>("/permissions", data);
  },

  async remove(userId: string, groupId: string): Promise<void> {
    return apiClient.delete(`/permissions/${userId}/${groupId}`);
  },

  async saveAll(changes: Record<string, Record<string, string>>): Promise<void> {
    return apiClient.post("/permissions/batch", changes);
  },
};
