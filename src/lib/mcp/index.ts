import { auth, defineMcp } from "@lovable.dev/mcp-js";
import whoamiTool from "./tools/whoami";
import listDocumentsTool from "./tools/list-documents";
import searchDocumentsTool from "./tools/search-documents";
import listFoldersTool from "./tools/list-folders";
import listPendingValidationsTool from "./tools/list-pending-validations";

// Build the direct Supabase issuer from the project ref (import-safe: inlined by Vite).
const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "docuflow-mcp",
  title: "DocuFlow",
  version: "0.1.0",
  instructions:
    "Tools for the DocuFlow document management app. Use whoami to identify the signed-in user, list_folders to browse the folder tree, list_documents and search_documents to find files, and list_pending_validations to see items awaiting approval. All calls run under the user's permissions.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [
    whoamiTool,
    listFoldersTool,
    listDocumentsTool,
    searchDocumentsTool,
    listPendingValidationsTool,
  ],
});
