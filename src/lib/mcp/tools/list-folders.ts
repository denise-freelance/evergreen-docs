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
  name: "list_folders",
  title: "List folders",
  description: "List folders (groups and subfolders) the signed-in user can access.",
  inputSchema: {
    parent_path: z.string().nullable().optional().describe("Filter by parent path. Pass null for top-level folders."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ parent_path }, ctx) => {
    if (!ctx.isAuthenticated()) return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    let q = clientFor(ctx).from("folders").select("id,name,path,parent_path").order("name");
    if (parent_path === null) q = q.is("parent_path", null);
    else if (parent_path) q = q.eq("parent_path", parent_path);
    const { data, error } = await q;
    return error
      ? { content: [{ type: "text", text: error.message }], isError: true }
      : { content: [{ type: "text", text: JSON.stringify(data) }], structuredContent: { folders: data ?? [] } };
  },
});
