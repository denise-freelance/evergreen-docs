import { supabase } from "@/integrations/supabase/client";

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
    const { data, error } = await supabase
      .from("groups")
      .select("id, name, icon, description, parent_id, created_at")
      .order("name", { ascending: true });
    if (error) throw new Error(error.message);
    return data ?? [];
  },

  async create(data: { name: string; description?: string | null; icon?: string; parent_id?: string | null }): Promise<Group> {
    const { data: group, error } = await supabase
      .from("groups")
      .insert({
        name: data.name,
        description: data.description ?? null,
        icon: data.icon ?? "📁",
        parent_id: data.parent_id ?? null,
      })
      .select("id, name, icon, description, parent_id, created_at")
      .single();
    if (error) throw new Error(error.message);
    return group;
  },

  async update(id: string, data: Partial<Group>): Promise<Group> {
    const updateData: Record<string, string | null> = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.icon !== undefined) updateData.icon = data.icon;
    if (data.parent_id !== undefined) updateData.parent_id = data.parent_id;

    const { data: group, error } = await supabase
      .from("groups")
      .update(updateData)
      .eq("id", id)
      .select("id, name, icon, description, parent_id, created_at")
      .single();
    if (error) throw new Error(error.message);
    return group;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from("groups").delete().eq("id", id);
    if (error) throw new Error(error.message);
  },
};
