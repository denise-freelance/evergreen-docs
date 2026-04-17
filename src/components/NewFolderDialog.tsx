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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Folder, ChevronRight, ChevronDown, Upload, FileText, X, FolderPlus } from "lucide-react";
import type { FolderNode } from "@/stores/useDocumentStore";

interface NewFolderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  folders: FolderNode[];
  onCreate: (parentPath: string | null, folderName: string, subfolderName: string | null, files: File[]) => void;
}

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
        type="button"
        onClick={() => {
          onSelect(node.path);
          if (node.children) setOpen(!open);
        }}
        className={`flex items-center gap-1.5 w-full text-left py-1.5 px-2 rounded-md text-sm transition-colors ${
          isSelected ? "bg-accent/15 text-accent font-medium" : "hover:bg-secondary/80 text-foreground/80"
        }`}
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
      >
        {node.children ? (
          open ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" /> : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
        ) : (
          <span className="w-3.5" />
        )}
        <Folder className={`h-4 w-4 shrink-0 ${isSelected ? "text-accent" : "text-muted-foreground"}`} />
        <span className="truncate">{node.name}</span>
      </button>
      {open && node.children?.map((child) => (
        <FolderTreeItem key={child.path} node={child} depth={depth + 1} selectedPath={selectedPath} onSelect={onSelect} />
      ))}
    </div>
  );
}

export default function NewFolderDialog({ open, onOpenChange, folders, onCreate }: NewFolderDialogProps) {
  const [parentPath, setParentPath] = useState<string | null>(null);
  const [folderName, setFolderName] = useState("");
  const [subfolderName, setSubfolderName] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} o`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} Ko`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
  };

  const reset = () => {
    setParentPath(null);
    setFolderName("");
    setSubfolderName("");
    setFiles([]);
  };

  const handleClose = (v: boolean) => {
    if (!v) reset();
    onOpenChange(v);
  };

  const handleSubmit = () => {
    if (!folderName.trim()) return;
    onCreate(parentPath, folderName.trim(), subfolderName.trim() || null, files);
    reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FolderPlus className="h-5 w-5 text-accent" /> Nouveau dossier
          </DialogTitle>
          <DialogDescription>
            Créez un dossier, optionnellement un sous-dossier, et importez des documents directement.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label className="text-xs">Emplacement parent (optionnel)</Label>
            <ScrollArea className="h-32 rounded-md border border-border p-2 mt-1.5">
              <button
                type="button"
                onClick={() => setParentPath(null)}
                className={`flex items-center gap-1.5 w-full text-left py-1.5 px-2 rounded-md text-sm transition-colors ${
                  parentPath === null ? "bg-accent/15 text-accent font-medium" : "hover:bg-secondary/80 text-foreground/80"
                }`}
              >
                <Folder className="h-4 w-4 shrink-0" />
                <span>Racine</span>
              </button>
              {folders.map((n) => (
                <FolderTreeItem key={n.path} node={n} selectedPath={parentPath} onSelect={setParentPath} />
              ))}
            </ScrollArea>
          </div>

          <div>
            <Label htmlFor="folder-name" className="text-xs">Nom du dossier *</Label>
            <Input
              id="folder-name"
              value={folderName}
              onChange={(e) => setFolderName(e.target.value)}
              placeholder="Ex: Projet 2026"
              className="mt-1.5 h-9"
            />
          </div>

          <div>
            <Label htmlFor="subfolder-name" className="text-xs">Nom du sous-dossier (facultatif)</Label>
            <Input
              id="subfolder-name"
              value={subfolderName}
              onChange={(e) => setSubfolderName(e.target.value)}
              placeholder="Ex: Plans"
              className="mt-1.5 h-9"
            />
          </div>

          <div>
            <Label className="text-xs">Documents à importer (facultatif)</Label>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={(e) => e.target.files && setFiles((p) => [...p, ...Array.from(e.target.files!)])}
            />
            <div
              onClick={() => fileInputRef.current?.click()}
              className="mt-1.5 rounded-lg border-2 border-dashed border-border hover:border-accent/40 hover:bg-accent/5 p-4 text-center cursor-pointer transition-colors"
            >
              <Upload className="h-5 w-5 mx-auto text-muted-foreground mb-1" />
              <p className="text-xs text-muted-foreground">
                Glissez-déposez ou <span className="text-accent font-medium">parcourir</span>
              </p>
            </div>
            {files.length > 0 && (
              <div className="mt-2 space-y-1.5 max-h-28 overflow-y-auto">
                {files.map((f, i) => (
                  <div key={`${f.name}-${i}`} className="flex items-center gap-2 px-2.5 py-1.5 rounded-md bg-secondary text-sm">
                    <FileText className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <span className="truncate flex-1">{f.name}</span>
                    <span className="text-xs text-muted-foreground shrink-0">{formatSize(f.size)}</span>
                    <button
                      type="button"
                      onClick={() => setFiles((p) => p.filter((_, idx) => idx !== i))}
                      className="text-muted-foreground hover:text-destructive shrink-0"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => handleClose(false)}>Annuler</Button>
          <Button
            size="sm"
            className="bg-accent text-accent-foreground hover:bg-accent/90 gap-1.5"
            disabled={!folderName.trim()}
            onClick={handleSubmit}
          >
            <FolderPlus className="h-3.5 w-3.5" /> Créer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
