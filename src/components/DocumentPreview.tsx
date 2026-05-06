import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Download, ZoomIn, ZoomOut, RotateCw, FileText, FileSpreadsheet, FileImage, File, Loader2, Printer, ChevronDown } from "lucide-react";
import type { DocFile } from "@/stores/useDocumentStore";
import { useDocumentStore } from "@/stores/useDocumentStore";

interface DocumentPreviewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  file: DocFile | null;
}

const fileIcons: Record<string, any> = {
  pdf: FileText,
  xlsx: FileSpreadsheet,
  image: FileImage,
  doc: File,
};

const statusLabels: Record<string, string> = {
  pending: "En attente",
  approved: "Validé",
  draft: "Brouillon",
  rejected: "Rejeté",
};

export default function DocumentPreview({ open, onOpenChange, file }: DocumentPreviewProps) {
  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState(0);
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { getSignedUrl } = useDocumentStore();

  useEffect(() => {
    if (!file?.storagePath || !open) {
      setSignedUrl(null);
      return;
    }
    setLoading(true);
    getSignedUrl(file.storagePath)
      .then((url) => setSignedUrl(url))
      .finally(() => setLoading(false));
  }, [file?.storagePath, open, getSignedUrl]);

  if (!file) return null;

  const Icon = fileIcons[file.type] || File;
  const isImage = file.type === "image";
  const isPdf = file.type === "pdf";

  const handleZoomIn = () => setZoom((z) => Math.min(z + 25, 200));
  const handleZoomOut = () => setZoom((z) => Math.max(z - 25, 50));
  const handleRotate = () => setRotation((r) => (r + 90) % 360);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[85vh] flex flex-col p-0 gap-0">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card">
          <div className="flex items-center gap-3 min-w-0">
            <Icon className="h-5 w-5 text-muted-foreground shrink-0" />
            <div className="min-w-0">
              <DialogHeader className="p-0 space-y-0">
                <DialogTitle className="text-sm font-semibold truncate">{file.name}</DialogTitle>
              </DialogHeader>
              <p className="text-[11px] text-muted-foreground">
                {file.size} · {file.version} · {file.author}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleZoomOut} title="Zoom arrière">
              <ZoomOut className="h-4 w-4" />
            </Button>
            <span className="text-xs text-muted-foreground w-10 text-center">{zoom}%</span>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleZoomIn} title="Zoom avant">
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleRotate} title="Pivoter">
              <RotateCw className="h-4 w-4" />
            </Button>
            <div className="w-px h-5 bg-border mx-1" />
            {signedUrl && (
              <a href={signedUrl} download={file.name} target="_blank" rel="noreferrer">
                <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5">
                  <Download className="h-3.5 w-3.5" /> Télécharger
                </Button>
              </a>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-auto bg-muted/50 flex items-start justify-center p-6">
          <div
            className="bg-background shadow-lg rounded-lg border border-border transition-transform duration-200 origin-center"
            style={{
              transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
              minWidth: "600px",
              maxWidth: "800px",
              width: "100%",
              minHeight: "400px",
            }}
          >
            {loading && (
              <div className="flex items-center justify-center h-96">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            )}
            {!loading && !signedUrl && (
              <div className="flex flex-col items-center justify-center h-96 text-center p-6">
                <Icon className="h-16 w-16 text-muted-foreground/40 mb-3" />
                <p className="text-sm text-muted-foreground">Aperçu indisponible</p>
              </div>
            )}
            {!loading && signedUrl && isImage && (
              <img src={signedUrl} alt={file.name} className="w-full h-auto rounded-lg" />
            )}
            {!loading && signedUrl && isPdf && (
              <iframe src={signedUrl} title={file.name} className="w-full h-[600px] rounded-lg" />
            )}
            {!loading && signedUrl && !isImage && !isPdf && (
              <div className="flex flex-col items-center justify-center h-96 text-center p-6">
                <Icon className="h-16 w-16 text-muted-foreground/60 mb-3" />
                <p className="text-sm font-medium">{file.name}</p>
                <p className="text-xs text-muted-foreground mt-1">L'aperçu n'est pas disponible pour ce type de fichier.</p>
                <a href={signedUrl} download={file.name} target="_blank" rel="noreferrer" className="mt-4">
                  <Button size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90 gap-1.5">
                    <Download className="h-3.5 w-3.5" /> Télécharger pour ouvrir
                  </Button>
                </a>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between px-4 py-2 border-t border-border bg-card">
          <p className="text-[11px] text-muted-foreground">
            <Badge variant="outline" className="text-[10px] mr-2">{statusLabels[file.status]}</Badge>
            Modifié {file.modified} · {file.author}
          </p>
          <div className="flex gap-1">
            {file.tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="text-[10px]">{tag}</Badge>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
