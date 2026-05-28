import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Download, ZoomIn, ZoomOut, RotateCw, FileText, FileSpreadsheet, FileImage, File, Loader2, Printer, ChevronDown } from "lucide-react";
import { Document, Page, pdfjs } from "react-pdf";
import type { DocFile } from "@/stores/useDocumentStore";
import { useDocumentStore } from "@/stores/useDocumentStore";

pdfjs.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url).toString();

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
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const { getSignedUrl } = useDocumentStore();

  useEffect(() => {
    let objectUrl: string | null = null;

    if (!file?.storagePath || !open) {
      setSignedUrl(null);
      setPreviewUrl(null);
      return;
    }

    setLoading(true);
    setSignedUrl(null);
    setPreviewUrl(null);
    setPageCount(0);

    getSignedUrl(file.storagePath)
      .then(async (url) => {
        setSignedUrl(url);
        if (!url) return;

        if (file.type === "pdf" || file.type === "image") {
          const response = await fetch(url);
          if (!response.ok) throw new Error("preview_fetch_failed");
          const sourceBlob = await response.blob();
          const previewBlob = file.type === "pdf" && sourceBlob.type !== "application/pdf"
            ? new Blob([sourceBlob], { type: "application/pdf" })
            : sourceBlob;
          objectUrl = URL.createObjectURL(previewBlob);
          setPreviewUrl(objectUrl);
          return;
        }

        setPreviewUrl(url);
      })
      .catch((error) => {
        console.error("Preview load error", error);
        setPreviewUrl(null);
      })
      .finally(() => setLoading(false));

    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [file?.storagePath, open, getSignedUrl]);

  if (!file) return null;

  const Icon = fileIcons[file.type] || File;
  const isImage = file.type === "image";
  const isPdf = file.type === "pdf";

  const handleZoomIn = () => setZoom((z) => Math.min(z + 25, 200));
  const handleZoomOut = () => setZoom((z) => Math.max(z - 25, 50));
  const handleRotate = () => setRotation((r) => (r + 90) % 360);
  const pdfScale = useMemo(() => Math.max(0.5, zoom / 100), [zoom]);

  const handlePrint = () => {
    const printUrl = previewUrl || signedUrl;
    if (!printUrl) return;
    const w = window.open(printUrl, "_blank");
    if (w) {
      w.addEventListener("load", () => {
        try { w.focus(); w.print(); } catch (e) { console.error(e); }
      });
    }
  };

  const handleExport = () => {
    if (!signedUrl) return;
    const a = document.createElement("a");
    a.href = signedUrl;
    a.download = file.name;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl w-[95vw] h-[90vh] flex flex-col p-0 gap-0">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card">
          <div className="flex items-center gap-3 min-w-0">
            <Icon className="h-5 w-5 text-muted-foreground shrink-0" />
            <div className="min-w-0">
              <DialogHeader className="p-0 space-y-0">
                <DialogTitle className="text-sm font-semibold truncate">{file.name}</DialogTitle>
                <DialogDescription className="sr-only">Aperçu du document {file.name}</DialogDescription>
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
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5">
                    <Download className="h-3.5 w-3.5" /> Télécharger
                    <ChevronDown className="h-3 w-3 opacity-60" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52">
                  <DropdownMenuItem onClick={handleExport} className="gap-2 text-xs">
                    <Download className="h-3.5 w-3.5" /> Exporter sur la machine
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handlePrint} className="gap-2 text-xs">
                    <Printer className="h-3.5 w-3.5" /> Imprimer le document
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-hidden bg-muted/50 flex items-stretch justify-center p-4">
          <div
            className="bg-background shadow-lg rounded-lg border border-border transition-transform duration-200 origin-top w-full max-w-5xl flex flex-col overflow-auto"
            style={{
              transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
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
            {!loading && previewUrl && isImage && (
              <img src={previewUrl} alt={file.name} className="w-full h-auto rounded-lg" />
            )}
            {!loading && previewUrl && isPdf && (
              <div className="flex-1 min-h-[70vh] overflow-auto bg-muted/30 p-4">
                <Document
                  file={previewUrl}
                  loading={
                    <div className="flex items-center justify-center h-96">
                      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                  }
                  error={
                    <div className="flex flex-col items-center justify-center h-96 text-center p-6">
                      <FileText className="h-16 w-16 text-muted-foreground/60 mb-3" />
                      <p className="text-sm">Impossible d'afficher ce PDF dans l'application.</p>
                      <Button onClick={handleExport} size="sm" className="mt-4 gap-1.5">
                        <Download className="h-3.5 w-3.5" /> Télécharger le PDF
                      </Button>
                    </div>
                  }
                  onLoadSuccess={({ numPages }) => setPageCount(numPages)}
                  className="flex flex-col items-center gap-4"
                >
                  {Array.from({ length: pageCount }, (_, index) => (
                    <Page
                      key={`page_${index + 1}`}
                      pageNumber={index + 1}
                      scale={pdfScale}
                      rotate={rotation}
                      renderAnnotationLayer={false}
                      renderTextLayer={false}
                      className="overflow-hidden rounded-md border border-border bg-background shadow-sm"
                    />
                  ))}
                </Document>
              </div>
            )}
            {!loading && signedUrl && file.type === "doc" && (
              <iframe
                src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(signedUrl)}`}
                title={file.name}
                className="w-full flex-1 min-h-[70vh] rounded-lg border-0"
              />
            )}
            {!loading && signedUrl && !isImage && !isPdf && file.type !== "doc" && (
              <div className="flex flex-col items-center justify-center h-96 text-center p-6">
                <Icon className="h-16 w-16 text-muted-foreground/60 mb-3" />
                <p className="text-sm font-medium">{file.name}</p>
                <p className="text-xs text-muted-foreground mt-1">L'aperçu n'est pas disponible pour ce type de fichier.</p>
                <Button onClick={handleExport} size="sm" className="mt-4 bg-accent text-accent-foreground hover:bg-accent/90 gap-1.5">
                  <Download className="h-3.5 w-3.5" /> Télécharger pour ouvrir
                </Button>
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
