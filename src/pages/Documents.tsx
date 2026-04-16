import { useState, useMemo } from "react";
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
  MoreHorizontal,
  Download,
  Share2,
  Trash2,
  Star,
  Eye,
  Clock,
  Tag,
  User,
  CalendarDays,
  Info,
  X,
  Search,
  Filter,
} from "lucide-react";
import { useDocumentStore, type DocFile } from "@/stores/useDocumentStore";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import ShareModal from "@/components/ShareModal";
import DocumentPreview from "@/components/DocumentPreview";
import ImportDocumentsDialog from "@/components/ImportDocumentsDialog";
import { useToast } from "@/hooks/use-toast";

interface TreeNode {
  name: string;
  type: "folder" | "file";
  children?: TreeNode[];
  icon?: any;
}

const folderTree: TreeNode[] = [
  {
    name: "Projets",
    type: "folder",
    children: [
      { name: "Chantier Lyon", type: "folder", children: [
        { name: "Plans", type: "folder" },
        { name: "Devis", type: "folder" },
      ]},
      { name: "Rénovation Paris", type: "folder" },
    ],
  },
  {
    name: "Comptabilité",
    type: "folder",
    children: [
      { name: "Factures 2025", type: "folder" },
      { name: "Budgets", type: "folder" },
    ],
  },
  { name: "Ressources Humaines", type: "folder", children: [
    { name: "Contrats", type: "folder" },
    { name: "Formations", type: "folder" },
  ]},
  { name: "Modèles", type: "folder" },
];

// files now come from the store

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
};

const statusLabels: Record<string, string> = {
  pending: "En attente",
  approved: "Validé",
  draft: "Brouillon",
};

function TreeItem({ node, depth = 0 }: { node: TreeNode; depth?: number }) {
  const [open, setOpen] = useState(depth === 0);

  return (
    <div>
      <button
        onClick={() => node.children && setOpen(!open)}
        className="flex items-center gap-1.5 w-full text-left py-1.5 px-2 rounded-md text-sm hover:bg-secondary/80 transition-colors"
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
      >
        {node.children ? (
          open ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" /> : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
        ) : (
          <span className="w-3.5" />
        )}
        <Folder className="h-4 w-4 text-accent shrink-0" />
        <span className="truncate text-foreground/80">{node.name}</span>
      </button>
      {open && node.children?.map((child) => (
        <TreeItem key={child.name} node={child} depth={depth + 1} />
      ))}
    </div>
  );
}

export default function Documents() {
  const { documents, addDocuments, viewDocument } = useDocumentStore();
  const { profile } = useAuth();
  const files = documents;

  const [selectedFile, setSelectedFile] = useState<DocFile | null>(files[0] || null);
  const [viewMode, setViewMode] = useState<"list" | "grid" | "columns">("list");
  const [propertiesOpen, setPropertiesOpen] = useState(true);
  const [shareOpen, setShareOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const { toast } = useToast();

  const handleImport = (importedFiles: File[], folderPath: string) => {
    const author = profile?.username || "Utilisateur";
    addDocuments(importedFiles, folderPath, author);
    toast({
      title: "Import réussi",
      description: `${importedFiles.length} fichier(s) importé(s) dans ${folderPath}`,
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
            <Input placeholder="Filtrer les dossiers..." className="pl-8 h-8 text-xs bg-secondary border-0" />
          </div>
        </div>
        <ScrollArea className="flex-1 p-2">
          {folderTree.map((node) => (
            <TreeItem key={node.name} node={node} />
          ))}
        </ScrollArea>
        <div className="p-3 border-t border-border">
          <Button variant="outline" size="sm" className="w-full text-xs gap-1.5">
            <Plus className="h-3.5 w-3.5" /> Nouveau dossier
          </Button>
        </div>
      </div>

      {/* Main file list */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Toolbar */}
        <div className="flex items-center gap-2 p-3 border-b border-border bg-card">
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <span className="font-medium text-foreground">Projets</span>
            <ChevronRight className="h-3.5 w-3.5" />
            <span className="font-medium text-foreground">Chantier Lyon</span>
          </div>
          <div className="ml-auto flex items-center gap-1.5">
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Filter className="h-4 w-4" />
              <span className="sr-only">Filtres</span>
            </Button>
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
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setPropertiesOpen(!propertiesOpen)}
            >
              <Info className="h-4 w-4" />
              <span className="sr-only">Propriétés</span>
            </Button>
          </div>
        </div>

        {/* Drag and drop zone */}
        <div className="mx-3 mt-3 mb-1 rounded-lg border-2 border-dashed border-accent/30 bg-accent/5 p-4 text-center">
          <Upload className="h-5 w-5 mx-auto text-accent/50 mb-1" />
          <p className="text-xs text-muted-foreground">
            Glissez-déposez vos fichiers ici ou{" "}
            <button className="text-accent font-medium hover:underline">parcourir</button>
          </p>
        </div>

        {/* File list */}
        <ScrollArea className="flex-1">
          {viewMode === "list" && (
            <div className="px-3 pb-3">
              {/* Header */}
              <div className="grid grid-cols-[1fr_100px_100px_100px] gap-2 px-3 py-2 text-[10px] uppercase tracking-wider font-semibold text-muted-foreground border-b border-border">
                <span>Nom</span>
                <span>Taille</span>
                <span>Modifié</span>
                <span>Statut</span>
              </div>
              {files.map((file) => {
                const Icon = fileIcons[file.type] || File;
                return (
                  <div
                    key={file.name}
                    onClick={() => setSelectedFile(file)}
                    onDoubleClick={() => { setSelectedFile(file); setPreviewOpen(true); }}
                    className={`grid grid-cols-[1fr_100px_100px_100px] gap-2 items-center px-3 py-2.5 rounded-lg cursor-pointer transition-colors text-sm ${
                      selectedFile?.name === file.name ? "bg-accent/10 border border-accent/20" : "hover:bg-secondary/50 border border-transparent"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span className="truncate font-medium">{file.name}</span>
                    </div>
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

          {viewMode === "grid" && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 p-3">
              {files.map((file) => {
                const Icon = fileIcons[file.type] || File;
                return (
                  <div
                    key={file.name}
                    onClick={() => setSelectedFile(file)}
                    className={`flex flex-col items-center gap-2 p-4 rounded-xl border cursor-pointer transition-all ${
                      selectedFile?.name === file.name
                        ? "bg-accent/10 border-accent/20 shadow-card-hover"
                        : "border-border hover:shadow-card-hover hover:border-border/80"
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

          {viewMode === "columns" && (
            <div className="flex h-full">
              <div className="w-64 border-r border-border p-2">
                {files.map((file) => {
                  const Icon = fileIcons[file.type] || File;
                  return (
                    <div
                      key={file.name}
                      onClick={() => setSelectedFile(file)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer text-sm transition-colors ${
                        selectedFile?.name === file.name ? "bg-accent/10" : "hover:bg-secondary/50"
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
                      <Button size="sm" variant="outline" className="gap-1.5 text-xs" onClick={() => setPreviewOpen(true)}>
                        <Eye className="h-3.5 w-3.5" /> Aperçu
                      </Button>
                      <Button size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90 gap-1.5 text-xs">
                        <Download className="h-3.5 w-3.5" /> Télécharger
                      </Button>
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
              ].map((prop) => (
                <div key={prop.label} className="flex items-start gap-3">
                  <prop.icon className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">{prop.label}</p>
                    <p className="text-sm">{prop.value}</p>
                  </div>
                </div>
              ))}
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
            </div>

            <Separator className="my-4" />

            <div className="space-y-2">
              <Button variant="outline" size="sm" className="w-full text-xs gap-1.5 justify-start" onClick={() => setShareOpen(true)}>
                <Share2 className="h-3.5 w-3.5" /> Partager
              </Button>
              <Button variant="outline" size="sm" className="w-full text-xs gap-1.5 justify-start">
                <Download className="h-3.5 w-3.5" /> Télécharger
              </Button>
              <Button variant="outline" size="sm" className="w-full text-xs gap-1.5 justify-start">
                <Clock className="h-3.5 w-3.5" /> Historique des versions
              </Button>
              <Button variant="outline" size="sm" className="w-full text-xs gap-1.5 justify-start text-destructive hover:text-destructive">
                <Trash2 className="h-3.5 w-3.5" /> Supprimer
              </Button>
            </div>
          </ScrollArea>
        </div>
      )}

      <ShareModal open={shareOpen} onOpenChange={setShareOpen} documentName={selectedFile?.name} />
      <DocumentPreview open={previewOpen} onOpenChange={setPreviewOpen} file={selectedFile} />
      <ImportDocumentsDialog open={importOpen} onOpenChange={setImportOpen} onImport={handleImport} />
    </div>
  );
}
