import { create } from "zustand";
import { supabase } from "@/integrations/supabase/client";

export interface DocFile {
  id: string;
  name: string;
  type: "pdf" | "xlsx" | "image" | "doc";
  size: string;
  sizeBytes: number;
  modified: string;
  modifiedAt: number;
  createdAt: number;
  author: string;
  authorId: string;
  status: "pending" | "approved" | "draft" | "rejected";
  version: string;
  tags: string[];
  folder: string;
  storagePath?: string | null;
  rejectReason?: string | null;
  isArchived: boolean;
  archivedAt?: number | null;
  archivedByName?: string | null;
}

export interface ActivityEntry {
  id: string;
  userInitials: string;
  userName: string;
  action: string;
  target: string;
  time: string;
  timestamp: number;
}

export interface FolderNode {
  name: string;
  path: string;
  children?: FolderNode[];
}

interface FolderRow {
  id: string;
  name: string;
  path: string;
  parent_path: string | null;
}

interface DocumentStore {
  documents: DocFile[];
  activities: ActivityEntry[];
  folders: FolderNode[];
  loading: boolean;
  loaded: boolean;
  loadAll: () => Promise<void>;
  addDocuments: (files: File[], folder: string, author: string, authorId: string) => Promise<void>;
  viewDocument: (id: string, author: string, authorId: string) => Promise<void>;
  validateDocument: (id: string, approved: boolean, author: string, authorId: string, rejectReason?: string) => Promise<void>;
  searchDocuments: (query: string) => DocFile[];
  getRecentDocuments: (limit?: number) => DocFile[];
  getPendingValidations: () => DocFile[];
  getRecentActivities: (limit?: number) => ActivityEntry[];
  createFolder: (parentPath: string | null, name: string, author: string, authorId: string) => Promise<string>;
  saveEditedDocument: (original: DocFile, blob: Blob, author: string, authorId: string) => Promise<DocFile | null>;
  getSignedUrl: (storagePath: string) => Promise<string | null>;
}

function getInitials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

function formatDate(d: Date): string {
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
}

function formatRelative(ts: number): string {
  const diff = Date.now() - ts;
  if (diff < 60_000) return "à l'instant";
  if (diff < 3_600_000) return `il y a ${Math.floor(diff / 60_000)} min`;
  if (diff < 86_400_000) return `il y a ${Math.floor(diff / 3_600_000)}h`;
  return `il y a ${Math.floor(diff / 86_400_000)}j`;
}

function guessType(name: string): DocFile["type"] {
  const ext = name.split(".").pop()?.toLowerCase() || "";
  if (["pdf"].includes(ext)) return "pdf";
  if (["xlsx", "xls", "csv"].includes(ext)) return "xlsx";
  if (["jpg", "jpeg", "png", "gif", "webp", "bmp", "svg"].includes(ext)) return "image";
  return "doc";
}

function buildTree(rows: FolderRow[]): FolderNode[] {
  const byPath = new Map<string, FolderNode>();
  rows.forEach((r) => byPath.set(r.path, { name: r.name, path: r.path, children: [] }));
  const roots: FolderNode[] = [];
  rows.forEach((r) => {
    const node = byPath.get(r.path)!;
    if (r.parent_path && byPath.has(r.parent_path)) {
      byPath.get(r.parent_path)!.children!.push(node);
    } else {
      roots.push(node);
    }
  });
  // Clean empty children arrays
  const clean = (n: FolderNode): FolderNode => ({
    ...n,
    children: n.children && n.children.length > 0 ? n.children.map(clean) : undefined,
  });
  return roots.map(clean);
}

function mapDoc(row: any): DocFile {
  const updated = new Date(row.updated_at);
  const created = new Date(row.created_at);
  return {
    id: row.id,
    name: row.name,
    type: row.type,
    size: formatSize(row.size_bytes),
    sizeBytes: row.size_bytes,
    modified: formatDate(updated),
    modifiedAt: updated.getTime(),
    createdAt: created.getTime(),
    author: row.author_name,
    authorId: row.author_id,
    status: row.status,
    version: row.version,
    tags: row.tags || [],
    folder: row.folder,
    storagePath: row.storage_path,
    rejectReason: row.reject_reason,
    isArchived: !!row.is_archived,
    archivedAt: row.archived_at ? new Date(row.archived_at).getTime() : null,
    archivedByName: row.archived_by_name ?? null,
  };
}

function mapActivity(row: any): ActivityEntry {
  const ts = new Date(row.created_at).getTime();
  return {
    id: row.id,
    userInitials: row.user_initials,
    userName: row.user_name,
    action: row.action,
    target: row.target,
    time: formatRelative(ts),
    timestamp: ts,
  };
}

function bumpVersion(current: string): string {
  const m = /^v?(\d+)(?:\.(\d+))?(?:\.(\d+))?/i.exec(current || "");
  if (!m) return "v0.0.1";
  const major = parseInt(m[1] || "0", 10);
  const minor = parseInt(m[2] || "0", 10);
  const patch = parseInt(m[3] || "0", 10);
  return `v${major}.${minor}.${patch + 1}`;
}

async function logActivity(userId: string, userName: string, action: string, target: string) {
  const initials = getInitials(userName);
  await supabase.from("activities").insert({
    user_id: userId,
    user_name: userName,
    user_initials: initials,
    action,
    target,
  });
  // Persist to audit log too (real-time visible in the Administration > Audit tab)
  await supabase.from("audit_logs").insert({
    user_id: userId,
    user_name: userName,
    action,
    target,
  });
}


export const useDocumentStore = create<DocumentStore>((set, get) => ({
  documents: [],
  activities: [],
  folders: [],
  loading: false,
  loaded: false,

  loadAll: async () => {
    set({ loading: true });
    const [foldersRes, docsRes, actsRes] = await Promise.all([
      supabase.from("folders").select("*").order("path"),
      supabase.from("documents").select("*").order("updated_at", { ascending: false }),
      supabase.from("activities").select("*").order("created_at", { ascending: false }).limit(50),
    ]);
    set({
      folders: buildTree((foldersRes.data || []) as FolderRow[]),
      documents: (docsRes.data || []).map(mapDoc),
      activities: (actsRes.data || []).map(mapActivity),
      loading: false,
      loaded: true,
    });
  },

  addDocuments: async (files, folder, author, authorId) => {
    const uploaded: DocFile[] = [];
    for (const f of files) {
      const ext = f.name.split(".").pop() || "bin";
      const storagePath = `${authorId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error: upErr } = await supabase.storage.from("documents").upload(storagePath, f, {
        contentType: f.type || "application/octet-stream",
      });
      if (upErr) {
        console.error("Upload error", upErr);
        continue;
      }
      const { data, error } = await supabase.from("documents").insert({
        name: f.name,
        type: guessType(f.name),
        size_bytes: f.size,
        folder,
        status: "draft",
        version: "v1",
        tags: [],
        author_id: authorId,
        author_name: author,
        storage_path: storagePath,
      }).select().single();
      if (error || !data) {
        console.error("Insert doc error", error);
        continue;
      }
      uploaded.push(mapDoc(data));
    }
    if (uploaded.length > 0) {
      await logActivity(authorId, author, "a importé", uploaded.length === 1 ? uploaded[0].name : `${uploaded.length} documents`);
    }
    await get().loadAll();
  },

  viewDocument: async (id, author, authorId) => {
    const doc = get().documents.find((d) => d.id === id);
    if (!doc) return;
    await supabase.from("documents").update({ updated_at: new Date().toISOString() }).eq("id", id);
    await logActivity(authorId, author, "a consulté", doc.name);
    await get().loadAll();
  },

  validateDocument: async (id, approved, author, authorId, rejectReason) => {
    const doc = get().documents.find((d) => d.id === id);
    if (!doc) return;
    await supabase.from("documents").update({
      status: approved ? "approved" : "rejected",
      reject_reason: approved ? null : (rejectReason || null),
    }).eq("id", id);
    await logActivity(authorId, author, approved ? "a validé" : "a rejeté", doc.name);
    await get().loadAll();
  },

  createFolder: async (parentPath, name, author, authorId) => {
    const cleanName = name.trim();
    const newPath = `${parentPath ?? ""}/${cleanName}`;
    const { error } = await supabase.from("folders").insert({
      name: cleanName,
      path: newPath,
      parent_path: parentPath,
      created_by: authorId,
      created_by_name: author,
    });
    if (error) {
      console.error("Create folder error", error);
      throw error;
    }
    await logActivity(authorId, author, "a créé le dossier", cleanName);
    await get().loadAll();
    return newPath;
  },

  saveEditedDocument: async (original, blob, author, authorId) => {
    const ext = original.name.split(".").pop() || "bin";
    const storagePath = `${authorId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const { error: upErr } = await supabase.storage.from("documents").upload(storagePath, blob, {
      contentType: blob.type || "application/octet-stream",
    });
    if (upErr) { console.error("Upload edit error", upErr); return null; }
    const newVersion = bumpVersion(original.version);
    const { data, error } = await supabase.from("documents").insert({
      name: original.name,
      type: original.type,
      size_bytes: blob.size,
      folder: original.folder,
      status: "draft",
      version: newVersion,
      tags: original.tags,
      author_id: authorId,
      author_name: author,
      storage_path: storagePath,
    }).select().single();
    if (error || !data) { console.error("Insert edit error", error); return null; }
    await logActivity(authorId, author, "a modifié", `${original.name} (${newVersion})`);
    await get().loadAll();
    return mapDoc(data);
  },



  searchDocuments: (query) => {
    const q = query.toLowerCase().trim();
    if (!q) return [];
    return get().documents.filter(
      (d) =>
        d.name.toLowerCase().includes(q) ||
        d.folder.toLowerCase().includes(q) ||
        d.tags.some((t) => t.toLowerCase().includes(q)) ||
        d.author.toLowerCase().includes(q)
    );
  },

  getRecentDocuments: (limit = 5) => {
    return [...get().documents].sort((a, b) => b.modifiedAt - a.modifiedAt).slice(0, limit);
  },

  getPendingValidations: () => {
    return get().documents.filter((d) => d.status === "pending");
  },

  getRecentActivities: (limit = 8) => {
    return get().activities.slice(0, limit);
  },

  getSignedUrl: async (storagePath) => {
    const { data, error } = await supabase.storage.from("documents").createSignedUrl(storagePath, 3600);
    if (error) {
      console.error("Signed URL error", error);
      return null;
    }
    return data.signedUrl;
  },
}));
