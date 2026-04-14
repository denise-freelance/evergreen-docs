import { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Folder,
  ChevronRight,
  ChevronDown,
  Upload,
  FileText,
  X,
  Check,
} from "lucide-react";

interface FolderNode {
  name: string;
  path: string;
  children?: FolderNode[];
}

const defaultFolders: FolderNode[] = [
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

function FolderTreeItem({
  node,
  depth = 0,
  selectedPath,
  onSelect,
}: {
  node: FolderNode;
  depth?: number;
  selectedPath: string | null;
  onSelect: (path: string) => void;
}) {
  const [open, setOpen] = useState(depth === 0);
  const isSelected = selectedPath === node.path;

  return (
    <div>
      <button
        onClick={() => {
          onSelect(node.path);
          if (node.children) setOpen(!open);
        }}
        className={`flex items-center gap-1.5 w-full text-left py-1.5 px-2 rounded-md text-sm transition-colors ${
          isSelected
            ? "bg-accent/15 text-accent font-medium"
            : "hover:bg-secondary/80 text-foreground/80"
        }`}
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
      >
        {node.children ? (
          open ? (
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          ) : (
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          )
        ) : (
          <span className="w-3.5" />
        )}
        <Folder
          className={`h-4 w-4 shrink-0 ${isSelected ? "text-accent" : "text-muted-foreground"}`}
        />
        <span className="truncate">{node.name}</span>
      </button>
      {open &&
        node.children?.map((child) => (
          <FolderTreeItem
            key={child.path}
            node={child}
            depth={depth + 1}
            selectedPath={selectedPath}
            onSelect={onSelect}
          />
        ))}
    </div>
  );
}

interface ImportDocumentsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport?: (files: File[], folderPath: string) => void;
  folders?: FolderNode[];
}

export default function ImportDocumentsDialog({
  open,
  onOpenChange,
  onImport,
  folders = defaultFolders,
}: ImportDocumentsDialogProps) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setSelectedFiles((prev) => [...prev, ...Array.from(e.target.files!)]);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      setSelectedFiles((prev) => [...prev, ...Array.from(e.dataTransfer.files)]);
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleImport = () => {
    if (selectedFiles.length > 0 && selectedFolder) {
      onImport?.(selectedFiles, selectedFolder);
      setSelectedFiles([]);
      setSelectedFolder(null);
      onOpenChange(false);
    }
  };

  const handleClose = (value: boolean) => {
    if (!value) {
      setSelectedFiles([]);
      setSelectedFolder(null);
    }
    onOpenChange(value);
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} o`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} Ko`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5 text-accent" />
            Importer des documents
          </DialogTitle>
          <DialogDescription>
            Sélectionnez vos fichiers puis choisissez le dossier de destination.
          </DialogDescription>
        </DialogHeader>

        {/* File selection zone */}
        <div>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={handleFileChange}
          />
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`rounded-lg border-2 border-dashed p-6 text-center cursor-pointer transition-colors ${
              isDragging
                ? "border-accent bg-accent/10"
                : "border-border hover:border-accent/40 hover:bg-accent/5"
            }`}
          >
            <Upload className="h-6 w-6 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">
              Glissez-déposez ou{" "}
              <span className="text-accent font-medium">parcourir</span>
            </p>
          </div>

          {/* Selected files list */}
          {selectedFiles.length > 0 && (
            <div className="mt-3 space-y-1.5 max-h-32 overflow-y-auto">
              {selectedFiles.map((file, i) => (
                <div
                  key={`${file.name}-${i}`}
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-md bg-secondary text-sm"
                >
                  <FileText className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <span className="truncate flex-1">{file.name}</span>
                  <span className="text-xs text-muted-foreground shrink-0">
                    {formatSize(file.size)}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFile(i);
                    }}
                    className="text-muted-foreground hover:text-destructive shrink-0"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Folder selection */}
        {selectedFiles.length > 0 && (
          <div>
            <p className="text-sm font-medium mb-2">Dossier de destination</p>
            <ScrollArea className="h-48 rounded-md border border-border p-2">
              {folders.map((node) => (
                <FolderTreeItem
                  key={node.path}
                  node={node}
                  selectedPath={selectedFolder}
                  onSelect={setSelectedFolder}
                />
              ))}
            </ScrollArea>
            {selectedFolder && (
              <p className="text-xs text-muted-foreground mt-1.5 flex items-center gap-1">
                <Check className="h-3 w-3 text-accent" />
                <span className="font-medium text-accent">{selectedFolder}</span>
              </p>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => handleClose(false)}>
            Annuler
          </Button>
          <Button
            size="sm"
            className="bg-accent text-accent-foreground hover:bg-accent/90 gap-1.5"
            disabled={selectedFiles.length === 0 || !selectedFolder}
            onClick={handleImport}
          >
            <Upload className="h-3.5 w-3.5" />
            Importer ({selectedFiles.length})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
