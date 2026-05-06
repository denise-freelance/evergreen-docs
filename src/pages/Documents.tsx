import { useState, useMemo, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Folder,
  FileText,
  FileSpreadsheet,
  FileImage,
  File,
  ChevronRight,
  ChevronDown,
  Grid3X3,
  List,
  Columns3,
  Upload,
  Plus,
  Download,
  Share2,
  Trash2,
  Eye,
  Clock,
  Tag,
  User,
  CalendarDays,
  Info,
  X,
  Search,
  Home,
} from "lucide-react";
import { useDocumentStore, type DocFile, type FolderNode } from "@/stores/useDocumentStore";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Printer } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import ShareModal from "@/components/ShareModal";
import DocumentPreview from "@/components/DocumentPreview";
import ImportDocumentsDialog from "@/components/ImportDocumentsDialog";
import NewFolderDialog from "@/components/NewFolderDialog";
import DocumentFilterPopover, { defaultFilters, type DocumentFilters } from "@/components/DocumentFilterPopover";
import { useToast } from "@/hooks/use-toast";

const fileIcons: Record<string, any> = {
  pdf: FileText,
  xlsx: FileSpreadsheet,
  image: FileImage,
  doc: File,
};

const statusColors: Record<string, string> = {
  pending: "bg-warning/10 text-warning border-warning/20",
  approved: "bg-success/10 text-success border-success/20",
  draft: "bg-muted text-muted-foreground border-border",
  rejected: "bg-destructive/10 text-destructive border-destructive/20",
};

const statusLabels: Record<string, string> = {
  pending: "En attente",
  approved: "Validé",
  draft: "Brouillon",
  rejected: "Rejeté",
};

// --- Folder tree filtering ---
function filterTree(nodes: FolderNode[], query: string): FolderNode[] {
  const q = query.toLowerCase().trim();
  if (!q) return nodes;
  const walk = (list: FolderNode[]): FolderNode[] => {
    return list.flatMap((n) => {
      const childMatches = n.children ? walk(n.children) : [];
      const selfMatch = n.name.toLowerCase().includes(q);
      if (selfMatch || childMatches.length > 0) {
        return [{ ...n, children: childMatches.length > 0 ? childMatches : n.children }];
      }
      return [];
    });
  };
  return walk(nodes);
}

function TreeItem({
  node,
  depth = 0,
  selectedPath,
  onSelect,
  forceOpen,
}: {
  node: FolderNode;
  depth?: number;
  selectedPath: string | null;
  onSelect: (path: string) => void;
  forceOpen?: boolean;
}) {
  const [open, setOpen] = useState(depth === 0 || forceOpen);
  const isSelected = selectedPath === node.path;
  const isOpen = forceOpen ?? open;

  return (
    <div>
      <button
        onClick={() => {
          onSelect(node.path);
          if (node.children) setOpen(!open);
        }}
        className={`flex items-center gap-1.5 w-full text-left py-1.5 px-2 rounded-md text-sm transition-colors ${
          isSelected ? "bg-accent/15 text-accent font-medium" : "hover:bg-secondary/80 text-foreground/80"
        }`}
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
      >
        {node.children && node.children.length > 0 ? (
          isOpen ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" /> : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
        ) : (
          <span className="w-3.5" />
        )}
        <Folder className={`h-4 w-4 shrink-0 ${isSelected ? "text-accent" : "text-accent/70"}`} />
        <span className="truncate">{node.name}</span>
      </button>
      {isOpen && node.children?.map((child) => (
        <TreeItem key={child.path} node={child} depth={depth + 1} selectedPath={selectedPath} onSelect={onSelect} forceOpen={forceOpen} />
      ))}
    </div>
  );
}

export default function Documents() {
  const { documents, folders, addDocuments, viewDocument, createFolder, getSignedUrl } = useDocumentStore();
  const { profile, user, isAdmin } = useAuth();
  const author = profile?.username || "Utilisateur";
  const authorId = user?.user_id || "";
  const groupName = user?.group_name || null;

  const [currentFolder, setCurrentFolder] = useState<string | null>(null); // null = all
  const [folderQuery, setFolderQuery] = useState("");
  const [filters, setFilters] = useState<DocumentFilters>(defaultFilters);
  const [sharedDocIds, setSharedDocIds] = useState<Set<string>>(new Set());

  const [selectedFile, setSelectedFile] = useState<DocFile | null>(null);
  const [viewMode, setViewMode] = useState<"list" | "grid" | "columns">("list");
  const [propertiesOpen, setPropertiesOpen] = useState(true);
  const [shareOpen, setShareOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [newFolderOpen, setNewFolderOpen] = useState(false);
  const { toast } = useToast();

  // Load shared document IDs for current user
  useEffect(() => {
    if (!authorId || isAdmin) return;
    supabase
      .from("document_shares")
      .select("document_id")
      .eq("shared_with_user_id", authorId)
      .then(({ data }) => setSharedDocIds(new Set((data || []).map((r) => r.document_id))));
  }, [authorId, isAdmin]);

  // Folder tree filtered by group access (admin sees all)
  const accessibleFolders = useMemo(() => {
    if (isAdmin) return folders;
    if (!groupName) return [];
    return folders.filter((root) => root.name === groupName);
  }, [folders, isAdmin, groupName]);

  const visibleTree = useMemo(() => filterTree(accessibleFolders, folderQuery), [accessibleFolders, folderQuery]);
  const treeOpenAll = folderQuery.trim().length > 0;

  // Documents accessible to user: those in their group folder + those shared with them. Admin sees all.
  const accessibleDocs = useMemo(() => {
    if (isAdmin) return documents;
    const groupRoot = groupName ? `/${groupName}` : null;
    return documents.filter((d) => {
      if (d.authorId === authorId) return true;
      if (sharedDocIds.has(d.id)) return true;
      if (groupRoot && (d.folder === groupRoot || d.folder.startsWith(groupRoot + "/"))) return true;
      return false;
    });
  }, [documents, isAdmin, groupName, authorId, sharedDocIds]);

  // Documents in current folder (or all subfolders)
  const folderDocs = useMemo(() => {
    if (!currentFolder) return accessibleDocs;
    return accessibleDocs.filter((d) => d.folder === currentFolder || d.folder.startsWith(currentFolder + "/"));
  }, [accessibleDocs, currentFolder]);

  const authors = useMemo(() => Array.from(new Set(documents.map((d) => d.author))).sort(), [documents]);

  // Apply advanced filters + sorting
  const files = useMemo(() => {
    let list = folderDocs.filter((d) => {
      if (filters.name && !d.name.toLowerCase().includes(filters.name.toLowerCase())) return false;
      if (filters.author && d.author !== filters.author) return false;
      if (filters.createdFrom && d.createdAt < new Date(filters.createdFrom).getTime()) return false;
      if (filters.createdTo && d.createdAt > new Date(filters.createdTo).getTime() + 86400000) return false;
      if (filters.modifiedFrom && d.modifiedAt < new Date(filters.modifiedFrom).getTime()) return false;
      if (filters.modifiedTo && d.modifiedAt > new Date(filters.modifiedTo).getTime() + 86400000) return false;
      return true;
    });
    list = [...list].sort((a, b) => {
      const dir = filters.sortDir === "asc" ? 1 : -1;
      switch (filters.sortBy) {
        case "name": return a.name.localeCompare(b.name) * dir;
        case "author": return a.author.localeCompare(b.author) * dir;
        case "createdAt": return (a.createdAt - b.createdAt) * dir;
        case "modifiedAt": default: return (a.modifiedAt - b.modifiedAt) * dir;
      }
    });
    return list;
  }, [folderDocs, filters]);

  const breadcrumbs = useMemo(() => {
    if (!currentFolder) return [];
    const parts = currentFolder.split("/").filter(Boolean);
    return parts.map((p, i) => ({ name: p, path: "/" + parts.slice(0, i + 1).join("/") }));
  }, [currentFolder]);

  const handleImport = async (importedFiles: File[], folderPath: string) => {
    await addDocuments(importedFiles, folderPath, author, authorId);
    toast({ title: "Import réussi", description: `${importedFiles.length} fichier(s) importé(s) dans ${folderPath}` });
  };

  const handlePreview = (file: DocFile) => {
    setSelectedFile(file);
    viewDocument(file.id, author, authorId);
    setPreviewOpen(true);
  };

  const handleExport = async (file: DocFile) => {
    if (!file.storagePath) {
      toast({ title: "Export impossible", description: "Aucun fichier source disponible.", variant: "destructive" });
      return;
    }
    const url = await getSignedUrl(file.storagePath);
    if (!url) {
      toast({ title: "Erreur", description: "Impossible de récupérer le document.", variant: "destructive" });
      return;
    }
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      // Use File System Access API when available to let user pick folder
      const anyWin = window as any;
      if (anyWin.showSaveFilePicker) {
        try {
          const handle = await anyWin.showSaveFilePicker({ suggestedName: file.name });
          const writable = await handle.createWritable();
          await writable.write(blob);
          await writable.close();
          toast({ title: "Document exporté", description: `${file.name} a été enregistré.` });
          return;
        } catch (err: any) {
          if (err?.name === "AbortError") return;
        }
      }
      // Fallback: classic download
      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = objectUrl;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(objectUrl);
      toast({ title: "Téléchargement lancé", description: file.name });
    } catch (e) {
      toast({ title: "Erreur", description: "Échec de l'export.", variant: "destructive" });
    }
  };

  const handlePrint = async (file: DocFile) => {
    if (!file.storagePath) return;
    const url = await getSignedUrl(file.storagePath);
    if (!url) {
      toast({ title: "Erreur", description: "Impossible de charger le document.", variant: "destructive" });
      return;
    }
    const w = window.open(url, "_blank");
    if (w) {
      w.addEventListener("load", () => {
        try { w.focus(); w.print(); } catch (e) { console.error(e); }
      });
    }
  };

  const DownloadMenu = ({ file, full = false }: { file: DocFile; full?: boolean }) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {full ? (
          <Button variant="outline" size="sm" className="w-full text-xs gap-1.5 justify-start">
            <Download className="h-3.5 w-3.5" /> Télécharger
          </Button>
        ) : (
          <Button size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90 gap-1.5 text-xs">
            <Download className="h-3.5 w-3.5" /> Télécharger
          </Button>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem onClick={() => handleExport(file)} className="gap-2 text-xs">
          <Download className="h-3.5 w-3.5" /> Exporter sur la machine
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handlePrint(file)} className="gap-2 text-xs">
          <Printer className="h-3.5 w-3.5" /> Imprimer le document
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );


  const handleCreateFolder = async (parentPath: string | null, name: string, sub: string | null, files: File[]) => {
    const folderPath = await createFolder(parentPath, name, author, authorId);
    let targetPath = folderPath;
    if (sub) {
      targetPath = await createFolder(folderPath, sub, author, authorId);
    }
    if (files.length > 0) {
      await addDocuments(files, targetPath, author, authorId);
    }
    setCurrentFolder(targetPath);
    toast({
      title: "Dossier créé",
      description: `${targetPath}${files.length > 0 ? ` · ${files.length} document(s) importé(s)` : ""}`,
    });
  };

  const FileIcon = selectedFile ? fileIcons[selectedFile.type] || File : File;

  return (
    <div className="flex h-[calc(100vh-4rem)] animate-fade-in">
      {/* Folder tree sidebar */}
      <div className="hidden md:flex w-56 lg:w-64 flex-col border-r border-border bg-card">
        <div className="p-3 border-b border-border">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Filtrer les dossiers..."
              value={folderQuery}
              onChange={(e) => setFolderQuery(e.target.value)}
              className="pl-8 h-8 text-xs bg-secondary border-0"
            />
          </div>
        </div>
        <ScrollArea className="flex-1 p-2">
          <button
            onClick={() => setCurrentFolder(null)}
            className={`flex items-center gap-1.5 w-full text-left py-1.5 px-2 rounded-md text-sm transition-colors mb-1 ${
              currentFolder === null ? "bg-accent/15 text-accent font-medium" : "hover:bg-secondary/80 text-foreground/80"
            }`}
          >
            <Home className="h-4 w-4 shrink-0" />
            <span>Tous les documents</span>
          </button>
          {visibleTree.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-4">Aucun dossier</p>
          ) : (
            visibleTree.map((node) => (
              <TreeItem
                key={node.path}
                node={node}
                selectedPath={currentFolder}
                onSelect={setCurrentFolder}
                forceOpen={treeOpenAll || undefined}
              />
            ))
          )}
        </ScrollArea>
        <div className="p-3 border-t border-border">
          <Button variant="outline" size="sm" className="w-full text-xs gap-1.5" onClick={() => setNewFolderOpen(true)}>
            <Plus className="h-3.5 w-3.5" /> Nouveau dossier
          </Button>
        </div>
      </div>

      {/* Main file list */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Toolbar */}
        <div className="flex items-center gap-2 p-3 border-b border-border bg-card">
          <div className="flex items-center gap-1 text-sm text-muted-foreground min-w-0 overflow-hidden">
            <button onClick={() => setCurrentFolder(null)} className="font-medium text-foreground hover:text-accent transition-colors shrink-0">
              Documents
            </button>
            {breadcrumbs.map((b) => (
              <div key={b.path} className="flex items-center gap-1 min-w-0">
                <ChevronRight className="h-3.5 w-3.5 shrink-0" />
                <button onClick={() => setCurrentFolder(b.path)} className="font-medium text-foreground hover:text-accent transition-colors truncate">
                  {b.name}
                </button>
              </div>
            ))}
          </div>
          <div className="ml-auto flex items-center gap-1.5">
            <DocumentFilterPopover filters={filters} onChange={setFilters} authors={authors} />
            <Separator orientation="vertical" className="h-5" />
            <div className="flex rounded-md border border-border overflow-hidden">
              {([["list", List], ["grid", Grid3X3], ["columns", Columns3]] as const).map(([mode, Icon]) => (
                <Button
                  key={mode}
                  variant="ghost"
                  size="icon"
                  className={`h-8 w-8 rounded-none ${viewMode === mode ? "bg-secondary" : ""}`}
                  onClick={() => setViewMode(mode)}
                >
                  <Icon className="h-4 w-4" />
                  <span className="sr-only">{mode}</span>
                </Button>
              ))}
            </div>
            <Separator orientation="vertical" className="h-5" />
            <Button size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90 gap-1.5 h-8 text-xs" onClick={() => setImportOpen(true)}>
              <Upload className="h-3.5 w-3.5" /> Importer
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setPropertiesOpen(!propertiesOpen)}>
              <Info className="h-4 w-4" />
              <span className="sr-only">Propriétés</span>
            </Button>
          </div>
        </div>

        {/* File list */}
        <ScrollArea className="flex-1">
          {files.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center px-6">
              <Folder className="h-10 w-10 text-muted-foreground/50 mb-3" />
              <p className="text-sm font-medium">Aucun document</p>
              <p className="text-xs text-muted-foreground mt-1">
                {currentFolder ? "Ce dossier est vide ou aucun document ne correspond aux filtres." : "Aucun document ne correspond aux filtres."}
              </p>
              <Button size="sm" variant="outline" className="mt-4 gap-1.5 text-xs" onClick={() => setImportOpen(true)}>
                <Upload className="h-3.5 w-3.5" /> Importer un document
              </Button>
            </div>
          )}

          {viewMode === "list" && files.length > 0 && (
            <div className="px-3 pb-3 pt-3">
              <div className="grid grid-cols-[1fr_120px_100px_100px_100px] gap-2 px-3 py-2 text-[10px] uppercase tracking-wider font-semibold text-muted-foreground border-b border-border">
                <span>Nom</span>
                <span>Auteur</span>
                <span>Taille</span>
                <span>Modifié</span>
                <span>Statut</span>
              </div>
              {files.map((file) => {
                const Icon = fileIcons[file.type] || File;
                return (
                  <div
                    key={file.id}
                    onClick={() => setSelectedFile(file)}
                    onDoubleClick={() => handlePreview(file)}
                    className={`grid grid-cols-[1fr_120px_100px_100px_100px] gap-2 items-center px-3 py-2.5 rounded-lg cursor-pointer transition-colors text-sm ${
                      selectedFile?.id === file.id ? "bg-accent/10 border border-accent/20" : "hover:bg-secondary/50 border border-transparent"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span className="truncate font-medium">{file.name}</span>
                    </div>
                    <span className="text-xs text-muted-foreground truncate">{file.author}</span>
                    <span className="text-xs text-muted-foreground">{file.size}</span>
                    <span className="text-xs text-muted-foreground">{file.modified}</span>
                    <Badge variant="outline" className={`text-[10px] w-fit ${statusColors[file.status]}`}>
                      {statusLabels[file.status]}
                    </Badge>
                  </div>
                );
              })}
            </div>
          )}

          {viewMode === "grid" && files.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 p-3">
              {files.map((file) => {
                const Icon = fileIcons[file.type] || File;
                return (
                  <div
                    key={file.id}
                    onClick={() => setSelectedFile(file)}
                    onDoubleClick={() => handlePreview(file)}
                    className={`flex flex-col items-center gap-2 p-4 rounded-xl border cursor-pointer transition-all ${
                      selectedFile?.id === file.id ? "bg-accent/10 border-accent/20 shadow-card-hover" : "border-border hover:shadow-card-hover hover:border-border/80"
                    }`}
                  >
                    <div className="rounded-lg bg-secondary p-4">
                      <Icon className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <p className="text-xs font-medium text-center truncate w-full">{file.name}</p>
                    <p className="text-[10px] text-muted-foreground">{file.size}</p>
                  </div>
                );
              })}
            </div>
          )}

          {viewMode === "columns" && files.length > 0 && (
            <div className="flex h-full">
              <div className="w-64 border-r border-border p-2">
                {files.map((file) => {
                  const Icon = fileIcons[file.type] || File;
                  return (
                    <div
                      key={file.id}
                      onClick={() => setSelectedFile(file)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer text-sm transition-colors ${
                        selectedFile?.id === file.id ? "bg-accent/10" : "hover:bg-secondary/50"
                      }`}
                    >
                      <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span className="truncate">{file.name}</span>
                    </div>
                  );
                })}
              </div>
              <div className="flex-1 flex items-center justify-center bg-secondary/30 p-8">
                {selectedFile && (
                  <div className="text-center space-y-3">
                    <div className="rounded-2xl bg-card shadow-card p-8 inline-block">
                      <FileIcon className="h-16 w-16 text-muted-foreground" />
                    </div>
                    <p className="font-medium">{selectedFile.name}</p>
                    <p className="text-sm text-muted-foreground">{selectedFile.size} · {selectedFile.modified}</p>
                    <div className="flex gap-2 justify-center">
                      <Button size="sm" variant="outline" className="gap-1.5 text-xs" onClick={() => handlePreview(selectedFile)}>
                        <Eye className="h-3.5 w-3.5" /> Aperçu
                      </Button>
                      <DownloadMenu file={selectedFile} />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Properties panel */}
      {propertiesOpen && selectedFile && viewMode !== "columns" && (
        <div className="hidden lg:flex w-72 flex-col border-l border-border bg-card animate-slide-right">
          <div className="flex items-center justify-between p-3 border-b border-border">
            <h3 className="text-sm font-semibold">Propriétés</h3>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setPropertiesOpen(false)}>
              <X className="h-4 w-4" />
              <span className="sr-only">Fermer</span>
            </Button>
          </div>
          <ScrollArea className="flex-1 p-4 space-y-5">
            <div className="text-center pb-4 border-b border-border">
              <div className="rounded-xl bg-secondary p-6 inline-block mb-3">
                <FileIcon className="h-12 w-12 text-muted-foreground" />
              </div>
              <p className="font-semibold text-sm">{selectedFile.name}</p>
              <Badge variant="outline" className={`mt-2 text-[10px] ${statusColors[selectedFile.status]}`}>
                {statusLabels[selectedFile.status]}
              </Badge>
            </div>

            <div className="space-y-4 pt-4">
              {[
                { icon: User, label: "Auteur", value: selectedFile.author },
                { icon: CalendarDays, label: "Modifié", value: selectedFile.modified },
                { icon: Info, label: "Taille", value: selectedFile.size },
                { icon: Clock, label: "Version", value: selectedFile.version },
                { icon: Folder, label: "Dossier", value: selectedFile.folder },
              ].map((prop) => (
                <div key={prop.label} className="flex items-start gap-3">
                  <prop.icon className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">{prop.label}</p>
                    <p className="text-sm break-words">{prop.value}</p>
                  </div>
                </div>
              ))}
              {selectedFile.tags.length > 0 && (
                <div className="flex items-start gap-3">
                  <Tag className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Tags</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {selectedFile.tags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-[10px]">{tag}</Badge>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <Separator className="my-4" />

            <div className="space-y-2">
              <Button variant="outline" size="sm" className="w-full text-xs gap-1.5 justify-start" onClick={() => handlePreview(selectedFile)}>
                <Eye className="h-3.5 w-3.5" /> Aperçu
              </Button>
              <Button variant="outline" size="sm" className="w-full text-xs gap-1.5 justify-start" onClick={() => setShareOpen(true)}>
                <Share2 className="h-3.5 w-3.5" /> Partager
              </Button>
              <DownloadMenu file={selectedFile} full />
              <Button variant="outline" size="sm" className="w-full text-xs gap-1.5 justify-start text-destructive hover:text-destructive">
                <Trash2 className="h-3.5 w-3.5" /> Supprimer
              </Button>
            </div>
          </ScrollArea>
        </div>
      )}

      <ShareModal open={shareOpen} onOpenChange={setShareOpen} documentId={selectedFile?.id} documentName={selectedFile?.name} />
      <DocumentPreview open={previewOpen} onOpenChange={setPreviewOpen} file={selectedFile} />
      <ImportDocumentsDialog open={importOpen} onOpenChange={setImportOpen} onImport={handleImport} folders={folders} />
      <NewFolderDialog open={newFolderOpen} onOpenChange={setNewFolderOpen} folders={folders} onCreate={handleCreateFolder} />
    </div>
  );
}
