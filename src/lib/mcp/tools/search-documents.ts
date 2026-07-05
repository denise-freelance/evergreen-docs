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
  name: "search_documents",
  title: "Search documents",
  description: "Search documents by name or folder for the signed-in user.",
  inputSchema: {
    query: z.string().min(1).describe("Search term matched against name and folder."),
    limit: z.number().int().min(1).max(100).default(25),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ query, limit }, ctx) => {
    if (!ctx.isAuthenticated()) return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    const like = `%${query}%`;
    const { data, error } = await clientFor(ctx)
      .from("documents")
      .select("id,name,type,folder,status,author,updated_at")
      .or(`name.ilike.${like},folder.ilike.${like}`)
      .order("updated_at", { ascending: false })
      .limit(limit);
    return error
      ? { content: [{ type: "text", text: error.message }], isError: true }
      : { content: [{ type: "text", text: JSON.stringify(data) }], structuredContent: { results: data ?? [] } };
  },
});
