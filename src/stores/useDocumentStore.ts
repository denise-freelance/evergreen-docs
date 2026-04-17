import { create } from "zustand";

export interface DocFile {
  id: string;
  name: string;
  type: "pdf" | "xlsx" | "image" | "doc";
  size: string;
  sizeBytes: number;
  modified: string;
  modifiedAt: number; // timestamp for sorting
  createdAt: number;
  author: string;
  status: "pending" | "approved" | "draft" | "rejected";
  version: string;
  tags: string[];
  folder: string;
  /** If imported from local, store the object URL for preview */
  previewUrl?: string;
  /** The raw File object if imported */
  rawFile?: File;
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

interface DocumentStore {
  documents: DocFile[];
  activities: ActivityEntry[];
  folders: FolderNode[];
  addDocuments: (files: File[], folder: string, author: string) => void;
  viewDocument: (id: string, author: string) => void;
  validateDocument: (id: string, approved: boolean, author: string) => void;
  searchDocuments: (query: string) => DocFile[];
  getRecentDocuments: (limit?: number) => DocFile[];
  getPendingValidations: () => DocFile[];
  getRecentActivities: (limit?: number) => ActivityEntry[];
  createFolder: (parentPath: string | null, name: string, author: string) => string;
}

function generateId() {
  return Math.random().toString(36).slice(2, 10);
}

function getInitials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

function guessType(name: string): DocFile["type"] {
  const ext = name.split(".").pop()?.toLowerCase() || "";
  if (["pdf"].includes(ext)) return "pdf";
  if (["xlsx", "xls", "csv"].includes(ext)) return "xlsx";
  if (["jpg", "jpeg", "png", "gif", "webp", "bmp", "svg"].includes(ext)) return "image";
  return "doc";
}

const now = Date.now();

const SEED_FOLDERS: FolderNode[] = [
  {
    name: "Projets",
    path: "/Projets",
    children: [
      {
        name: "Chantier Lyon",
        path: "/Projets/Chantier Lyon",
        children: [
          { name: "Plans", path: "/Projets/Chantier Lyon/Plans" },
          { name: "Devis", path: "/Projets/Chantier Lyon/Devis" },
        ],
      },
      { name: "Rénovation Paris", path: "/Projets/Rénovation Paris" },
    ],
  },
  {
    name: "Comptabilité",
    path: "/Comptabilité",
    children: [
      { name: "Factures 2025", path: "/Comptabilité/Factures 2025" },
      { name: "Budgets", path: "/Comptabilité/Budgets" },
    ],
  },
  {
    name: "Ressources Humaines",
    path: "/Ressources Humaines",
    children: [
      { name: "Contrats", path: "/Ressources Humaines/Contrats" },
      { name: "Formations", path: "/Ressources Humaines/Formations" },
    ],
  },
  { name: "Modèles", path: "/Modèles" },
];

const SEED_DOCUMENTS: DocFile[] = [
  { id: "d1", name: "Rapport Q4 2025.pdf", type: "pdf", size: "2.4 Mo", sizeBytes: 2516582, modified: "13 Fév 2026", modifiedAt: now - 300000, createdAt: now - 86400000 * 5, author: "Marie Curie", status: "pending", version: "v3", tags: ["rapport", "Q4"], folder: "/Projets/Chantier Lyon" },
  { id: "d2", name: "Budget_previsionnel.xlsx", type: "xlsx", size: "890 Ko", sizeBytes: 911360, modified: "12 Fév 2026", modifiedAt: now - 1380000, createdAt: now - 86400000 * 7, author: "Pierre Martin", status: "approved", version: "v2", tags: ["budget"], folder: "/Comptabilité/Budgets" },
  { id: "d3", name: "Photo_chantier_03.jpg", type: "image", size: "5.1 Mo", sizeBytes: 5347737, modified: "11 Fév 2026", modifiedAt: now - 3600000, createdAt: now - 86400000 * 10, author: "Sophie Lemoine", status: "draft", version: "v1", tags: ["chantier", "photo"], folder: "/Projets/Chantier Lyon" },
  { id: "d4", name: "Contrat_fournisseur_v3.pdf", type: "pdf", size: "1.2 Mo", sizeBytes: 1258291, modified: "10 Fév 2026", modifiedAt: now - 7200000, createdAt: now - 86400000 * 15, author: "Jean Dupont", status: "rejected", version: "v3", tags: ["contrat", "juridique"], folder: "/Ressources Humaines/Contrats" },
  { id: "d5", name: "Specs_techniques.docx", type: "doc", size: "3.7 Mo", sizeBytes: 3880140, modified: "9 Fév 2026", modifiedAt: now - 10800000, createdAt: now - 86400000 * 20, author: "Luc Bernard", status: "approved", version: "v1", tags: ["technique"], folder: "/Projets" },
  { id: "d6", name: "Facture_02_2026.pdf", type: "pdf", size: "145 Ko", sizeBytes: 148480, modified: "8 Fév 2026", modifiedAt: now - 14400000, createdAt: now - 86400000 * 3, author: "Marie Curie", status: "approved", version: "v1", tags: ["facture"], folder: "/Comptabilité/Factures 2025" },
  { id: "d7", name: "Plan_formation.pptx", type: "doc", size: "12.3 Mo", sizeBytes: 12897484, modified: "7 Fév 2026", modifiedAt: now - 18000000, createdAt: now - 86400000 * 12, author: "Pierre Martin", status: "pending", version: "v2", tags: ["formation", "RH"], folder: "/Ressources Humaines/Formations" },
  { id: "d8", name: "Organigramme.png", type: "image", size: "780 Ko", sizeBytes: 798720, modified: "6 Fév 2026", modifiedAt: now - 21600000, createdAt: now - 86400000 * 30, author: "Sophie Lemoine", status: "approved", version: "v4", tags: ["organisation"], folder: "/Ressources Humaines" },
  { id: "d9", name: "Devis_renovation.pdf", type: "pdf", size: "560 Ko", sizeBytes: 573440, modified: "5 Fév 2026", modifiedAt: now - 25200000, createdAt: now - 86400000 * 8, author: "Sophie Lemoine", status: "pending", version: "v1", tags: ["devis"], folder: "/Projets/Rénovation Paris" },
  { id: "d10", name: "Plan_formation_2026.docx", type: "doc", size: "2.1 Mo", sizeBytes: 2202009, modified: "4 Fév 2026", modifiedAt: now - 28800000, createdAt: now - 86400000 * 6, author: "Pierre Martin", status: "pending", version: "v1", tags: ["formation"], folder: "/Ressources Humaines/Formations" },
  { id: "d11", name: "Audit_sécurité.pdf", type: "pdf", size: "3.4 Mo", sizeBytes: 3565158, modified: "3 Fév 2026", modifiedAt: now - 32400000, createdAt: now - 86400000 * 4, author: "Luc Bernard", status: "pending", version: "v1", tags: ["audit", "sécurité"], folder: "/Projets" },
];

const SEED_ACTIVITIES: ActivityEntry[] = [
  { id: "a1", userInitials: "MC", userName: "Marie Curie", action: "a modifié", target: "Rapport Q4 2025.pdf", time: "il y a 5 min", timestamp: now - 300000 },
  { id: "a2", userInitials: "PM", userName: "Pierre Martin", action: "a partagé", target: "Budget_previsionnel.xlsx", time: "il y a 23 min", timestamp: now - 1380000 },
  { id: "a3", userInitials: "SL", userName: "Sophie Lemoine", action: "a commenté", target: "Plan_chantier.pdf", time: "il y a 1h", timestamp: now - 3600000 },
  { id: "a4", userInitials: "JD", userName: "Jean Dupont", action: "a validé", target: "Contrat_fournisseur_v2.pdf", time: "il y a 2h", timestamp: now - 7200000 },
  { id: "a5", userInitials: "LB", userName: "Luc Bernard", action: "a importé", target: "3 documents", time: "il y a 3h", timestamp: now - 10800000 },
];

function insertFolder(tree: FolderNode[], parentPath: string | null, newNode: FolderNode): FolderNode[] {
  if (parentPath === null) return [...tree, newNode];
  return tree.map((n) => {
    if (n.path === parentPath) {
      return { ...n, children: [...(n.children || []), newNode] };
    }
    if (n.children) return { ...n, children: insertFolder(n.children, parentPath, newNode) };
    return n;
  });
}

export const useDocumentStore = create<DocumentStore>((set, get) => ({
  documents: SEED_DOCUMENTS,
  activities: SEED_ACTIVITIES,
  folders: SEED_FOLDERS,

  addDocuments: (files, folder, author) => {
    const newDocs: DocFile[] = files.map((f) => {
      const id = generateId();
      const previewUrl = f.type.startsWith("image/") ? URL.createObjectURL(f) : undefined;
      return {
        id,
        name: f.name,
        type: guessType(f.name),
        size: formatSize(f.size),
        sizeBytes: f.size,
        modified: new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" }),
        modifiedAt: Date.now(),
        createdAt: Date.now(),
        author,
        status: "draft" as const,
        version: "v1",
        tags: [],
        folder,
        previewUrl,
        rawFile: f,
      };
    });

    const activity: ActivityEntry = {
      id: generateId(),
      userInitials: getInitials(author),
      userName: author,
      action: "a importé",
      target: files.length === 1 ? files[0].name : `${files.length} documents`,
      time: "à l'instant",
      timestamp: Date.now(),
    };

    set((state) => ({
      documents: [...newDocs, ...state.documents],
      activities: [activity, ...state.activities],
    }));
  },

  viewDocument: (id, author) => {
    set((state) => {
      const doc = state.documents.find((d) => d.id === id);
      if (!doc) return state;
      const activity: ActivityEntry = {
        id: generateId(),
        userInitials: getInitials(author),
        userName: author,
        action: "a consulté",
        target: doc.name,
        time: "à l'instant",
        timestamp: Date.now(),
      };
      return {
        documents: state.documents.map((d) =>
          d.id === id ? { ...d, modifiedAt: Date.now(), modified: new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" }) } : d
        ),
        activities: [activity, ...state.activities],
      };
    });
  },

  validateDocument: (id, approved, author) => {
    set((state) => {
      const doc = state.documents.find((d) => d.id === id);
      if (!doc) return state;
      const activity: ActivityEntry = {
        id: generateId(),
        userInitials: getInitials(author),
        userName: author,
        action: approved ? "a validé" : "a rejeté",
        target: doc.name,
        time: "à l'instant",
        timestamp: Date.now(),
      };
      return {
        documents: state.documents.map((d) =>
          d.id === id ? { ...d, status: approved ? "approved" : "rejected", modifiedAt: Date.now() } : d
        ),
        activities: [activity, ...state.activities],
      };
    });
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

  createFolder: (parentPath, name, author) => {
    const cleanName = name.trim();
    const newPath = `${parentPath ?? ""}/${cleanName}`;
    const newNode: FolderNode = { name: cleanName, path: newPath };
    const activity: ActivityEntry = {
      id: generateId(),
      userInitials: getInitials(author),
      userName: author,
      action: "a créé le dossier",
      target: cleanName,
      time: "à l'instant",
      timestamp: Date.now(),
    };
    set((state) => ({
      folders: insertFolder(state.folders, parentPath, newNode),
      activities: [activity, ...state.activities],
    }));
    return newPath;
  },
}));
