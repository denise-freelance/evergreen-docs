import { supabase } from "@/integrations/supabase/client";

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
    const { data: profiles, error } = await supabase
      .from("profiles")
      .select("user_id, username, email, is_active, group_id")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);

    const { data: roles, error: rolesError } = await supabase
      .from("user_roles")
      .select("user_id, role");
    if (rolesError) throw new Error(rolesError.message);

    const roleMap = new Map(roles?.map((r) => [r.user_id, r.role]) ?? []);
    return (profiles ?? []).map((p) => ({
      user_id: p.user_id,
      username: p.username,
      email: p.email,
      is_active: p.is_active,
      group_id: p.group_id,
      role: roleMap.get(p.user_id) ?? "reader",
    }));
  },

  async update(
    userId: string,
    data: { username?: string; group_id?: string; role?: string }
  ): Promise<UserProfile> {
    const profileUpdate: Record<string, unknown> = {};
    if (data.username !== undefined) profileUpdate.username = data.username;
    if (data.group_id !== undefined) profileUpdate.group_id = data.group_id;

    if (Object.keys(profileUpdate).length > 0) {
      const { error } = await supabase
        .from("profiles")
        .update(profileUpdate)
        .eq("user_id", userId);
      if (error) throw new Error(error.message);
    }

    if (data.role) {
      const { data: existing } = await supabase
        .from("user_roles")
        .select("id")
        .eq("user_id", userId)
        .maybeSingle();
      if (existing) {
        const { error } = await supabase
          .from("user_roles")
          .update({ role: data.role as "admin" | "editor" | "reader" })
          .eq("user_id", userId);
        if (error) throw new Error(error.message);
      } else {
        const { error } = await supabase
          .from("user_roles")
          .insert({ user_id: userId, role: data.role as "admin" | "editor" | "reader" });
        if (error) throw new Error(error.message);
      }
    }

    const { data: profile, error: fetchError } = await supabase
      .from("profiles")
      .select("user_id, username, email, is_active, group_id")
      .eq("user_id", userId)
      .single();
    if (fetchError) throw new Error(fetchError.message);

    return { ...profile, role: data.role ?? "reader" };
  },

  async toggleStatus(userId: string): Promise<UserProfile> {
    const { data: current, error: fetchError } = await supabase
      .from("profiles")
      .select("is_active")
      .eq("user_id", userId)
      .single();
    if (fetchError) throw new Error(fetchError.message);

    const { data, error } = await supabase
      .from("profiles")
      .update({ is_active: !current.is_active })
      .eq("user_id", userId)
      .select("user_id, username, email, is_active, group_id")
      .single();
    if (error) throw new Error(error.message);

    return { ...data, role: "reader" };
  },

  async delete(userId: string): Promise<void> {
    const { error } = await supabase.from("profiles").delete().eq("user_id", userId);
    if (error) throw new Error(error.message);
  },
};
