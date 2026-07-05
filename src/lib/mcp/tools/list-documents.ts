import { createClient } from "@supabase/supabase-js";
import { defineTool, type ToolContext } from "@lovable.dev/mcp-js";
import { z } from "zod";

function clientFor(ctx: ToolContext) {
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
    global: { headers: { Authorization: `Bearer ${ctx.getToken()}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export default defineTool({
  name: "list_documents",
  title: "List documents",
  description:
    "List documents the signed-in user can access. Optionally filter by folder path and status.",
  inputSchema: {
    folder: z.string().optional().describe("Folder path filter (exact match), e.g. 'Ressources Humaines/Recrutement'."),
    status: z.enum(["pending", "approved", "draft", "rejected"]).optional(),
    limit: z.number().int().min(1).max(200).default(50),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ folder, status, limit }, ctx) => {
    if (!ctx.isAuthenticated()) return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    let q = clientFor(ctx).from("documents").select("id,name,type,folder,status,version,author,updated_at").order("updated_at", { ascending: false }).limit(limit);
    if (folder) q = q.eq("folder", folder);
    if (status) q = q.eq("status", status);
    const { data, error } = await q;
    return error
      ? { content: [{ type: "text", text: error.message }], isError: true }
      : { content: [{ type: "text", text: JSON.stringify(data) }], structuredContent: { documents: data ?? [] } };
  },
});
