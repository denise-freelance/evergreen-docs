import { supabase } from "@/integrations/supabase/client";

export interface AuthUser {
  id: string;
  user_id: string;
  email: string;
  username: string;
  is_active: boolean;
  group_id: string | null;
  role: string;
}

export const authService = {
  async login({ email, password }: { email: string; password: string }) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw new Error(error.message === "Invalid login credentials" ? "Email ou mot de passe incorrect." : error.message);
    if (!data.user) throw new Error("Connexion impossible.");
    const user = await authService.fetchProfile(data.user.id);
    return { user };
  },

  async logout() {
    await supabase.auth.signOut();
  },

  async fetchProfile(userId: string): Promise<AuthUser> {
    const [{ data: profile }, { data: roleRow }] = await Promise.all([
      supabase.from("profiles").select("*").eq("user_id", userId).maybeSingle(),
      supabase.from("user_roles").select("role").eq("user_id", userId).maybeSingle(),
    ]);
    if (!profile) throw new Error("Profil introuvable.");
    return {
      id: profile.id,
      user_id: profile.user_id,
      email: profile.email,
      username: profile.username,
      is_active: profile.is_active,
      group_id: profile.group_id,
      role: roleRow?.role || "reader",
    };
  },

  async me(): Promise<AuthUser> {
    const { data } = await supabase.auth.getUser();
    if (!data.user) throw new Error("Non authentifié");
    return authService.fetchProfile(data.user.id);
  },
};
