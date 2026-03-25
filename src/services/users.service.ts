import apiClient from "@/lib/api-client";

export interface UserProfile {
  user_id: string;
  username: string;
  email: string;
  is_active: boolean;
  group_id: string | null;
  role: string;
}

export const usersService = {
  async getAll(): Promise<UserProfile[]> {
    return apiClient.get<UserProfile[]>("/users");
  },

  async update(userId: string, data: { username?: string; group_id?: string; role?: string }): Promise<UserProfile> {
    return apiClient.put<UserProfile>(`/users/${userId}`, data);
  },

  async toggleStatus(userId: string): Promise<UserProfile> {
    return apiClient.patch<UserProfile>(`/users/${userId}/toggle-status`);
  },

  async delete(userId: string): Promise<void> {
    return apiClient.delete(`/users/${userId}`);
  },
};
