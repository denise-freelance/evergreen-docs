import apiClient from "@/lib/api-client";

export interface Group {
  id: string;
  name: string;
  icon: string | null;
  description: string | null;
  parent_id: string | null;
  created_at: string;
}

export const groupsService = {
  async getAll(): Promise<Group[]> {
    return apiClient.get<Group[]>("/groups");
  },

  async create(data: { name: string; description?: string | null; icon?: string; parent_id?: string | null }): Promise<Group> {
    return apiClient.post<Group>("/groups", data);
  },

  async update(id: string, data: Partial<Group>): Promise<Group> {
    return apiClient.put<Group>(`/groups/${id}`, data);
  },

  async delete(id: string): Promise<void> {
    return apiClient.delete(`/groups/${id}`);
  },
};
