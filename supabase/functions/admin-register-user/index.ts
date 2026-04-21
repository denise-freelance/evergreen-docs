import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Verify the caller is an admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Non autorisé" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const anonClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_PUBLISHABLE_KEY") ?? serviceRoleKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user: caller } } = await anonClient.auth.getUser();
    if (!caller) {
      return new Response(JSON.stringify({ error: "Non autorisé" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check admin role using service role client
    const adminClient = createClient(supabaseUrl, serviceRoleKey);
    const { data: roleData } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", caller.id)
      .eq("role", "admin")
      .single();

    if (!roleData) {
      return new Response(JSON.stringify({ error: "Accès réservé aux administrateurs" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { email, password, username, role, group_id } = await req.json();

    if (!email || !password || !username || !role || !group_id) {
      return new Response(JSON.stringify({ error: "Tous les champs sont requis" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create user with admin API
    let userId: string | null = null;
    const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (createError) {
      // If user already exists in auth but has no profile (orphan), recover by finding & reusing it
      const msg = (createError.message || "").toLowerCase();
      const alreadyExists = msg.includes("already") || msg.includes("registered") || msg.includes("exists");
      if (!alreadyExists) {
        return new Response(JSON.stringify({ error: createError.message }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Look up existing auth user by email
      const { data: list, error: listErr } = await adminClient.auth.admin.listUsers();
      if (listErr) {
        return new Response(JSON.stringify({ error: listErr.message }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const existing = list.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
      if (!existing) {
        return new Response(JSON.stringify({ error: "Un utilisateur avec cet email existe déjà." }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Check if a profile already exists for this auth user
      const { data: existingProfile } = await adminClient
        .from("profiles")
        .select("id")
        .eq("user_id", existing.id)
        .maybeSingle();

      if (existingProfile) {
        return new Response(JSON.stringify({ error: "Un utilisateur avec cet email est déjà enregistré." }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Orphan auth user — reset its password and reuse
      await adminClient.auth.admin.updateUserById(existing.id, { password });
      userId = existing.id;
    } else {
      userId = newUser.user.id;
    }

    // Create profile
    const { error: profileError } = await adminClient.from("profiles").insert({
      user_id: userId,
      username,
      email,
      group_id,
      is_active: false,
    });
    if (profileError) {
      return new Response(JSON.stringify({ error: `Profil: ${profileError.message}` }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create role (upsert-like: delete then insert to avoid duplicates)
    await adminClient.from("user_roles").delete().eq("user_id", userId);
    const { error: roleError } = await adminClient.from("user_roles").insert({
      user_id: userId,
      role,
    });
    if (roleError) {
      return new Response(JSON.stringify({ error: `Rôle: ${roleError.message}` }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true, user_id: userId }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
