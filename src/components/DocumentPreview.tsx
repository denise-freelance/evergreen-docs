import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, ZoomIn, ZoomOut, RotateCw, FileText, FileSpreadsheet, FileImage, File, X } from "lucide-react";

interface DocumentFile {
  name: string;
  type: string;
  size: string;
  modified: string;
  author: string;
  status: string;
  version: string;
  tags: string[];
}

interface DocumentPreviewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  file: DocumentFile | null;
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
};

const mockContent: Record<string, string[]> = {
  pdf: [
    "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
    "Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.",
    "Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.",
    "Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.",
    "Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium.",
  ],
  xlsx: [
    "| Poste | Prévu | Réalisé | Écart |",
    "|---|---|---|---|",
    "| Main d'œuvre | 150 000 € | 142 500 € | -7 500 € |",
    "| Matériaux | 85 000 € | 91 200 € | +6 200 € |",
    "| Sous-traitance | 45 000 € | 44 800 € | -200 € |",
    "| Frais généraux | 20 000 € | 18 900 € | -1 100 € |",
    "| **Total** | **300 000 €** | **297 400 €** | **-2 600 €** |",
  ],
  doc: [
    "OBJET : Spécifications techniques du projet",
    "",
    "1. INTRODUCTION",
    "Le présent document décrit les spécifications techniques relatives au projet en cours. Il définit les exigences fonctionnelles et non-fonctionnelles.",
    "",
    "2. PÉRIMÈTRE",
    "Le périmètre du projet couvre l'ensemble des livrables identifiés lors de la phase d'analyse préliminaire.",
    "",
    "3. EXIGENCES TECHNIQUES",
    "3.1 Performance : Le système doit pouvoir traiter 1000 requêtes simultanées.",
    "3.2 Disponibilité : Taux de disponibilité cible de 99.9%.",
    "3.3 Sécurité : Conformité aux normes ISO 27001.",
  ],
  image: [],
};

export default function DocumentPreview({ open, onOpenChange, file }: DocumentPreviewProps) {
  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState(0);

  if (!file) return null;

  const Icon = fileIcons[file.type] || File;
  const content = mockContent[file.type] || mockContent.doc;
  const isImage = file.type === "image";
  const isSpreadsheet = file.type === "xlsx";

  const handleZoomIn = () => setZoom((z) => Math.min(z + 25, 200));
  const handleZoomOut = () => setZoom((z) => Math.max(z - 25, 50));
  const handleRotate = () => setRotation((r) => (r + 90) % 360);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[85vh] flex flex-col p-0 gap-0">
        {/* Header */}
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
            <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5">
              <Download className="h-3.5 w-3.5" /> Télécharger
            </Button>
          </div>
        </div>

        {/* Preview area */}
        <div className="flex-1 overflow-auto bg-muted/50 flex items-start justify-center p-6">
          <div
            className="bg-background shadow-lg rounded-lg border border-border transition-transform duration-200 origin-center"
            style={{
              transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
              minWidth: isSpreadsheet ? "700px" : "600px",
              maxWidth: "800px",
              width: "100%",
            }}
          >
            {isImage ? (
              <div className="flex flex-col items-center justify-center p-12 space-y-4">
                <div className="w-full aspect-video bg-gradient-to-br from-accent/10 via-primary/5 to-secondary rounded-lg flex items-center justify-center">
                  <FileImage className="h-24 w-24 text-muted-foreground/30" />
                </div>
                <p className="text-xs text-muted-foreground">
                  Aperçu de l'image : {file.name}
                </p>
              </div>
            ) : isSpreadsheet ? (
              <div className="p-6">
                <h3 className="text-sm font-semibold mb-4 text-foreground">Budget Prévisionnel</h3>
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="bg-secondary">
                      <th className="text-left px-3 py-2 border border-border font-medium">Poste</th>
                      <th className="text-right px-3 py-2 border border-border font-medium">Prévu</th>
                      <th className="text-right px-3 py-2 border border-border font-medium">Réalisé</th>
                      <th className="text-right px-3 py-2 border border-border font-medium">Écart</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      ["Main d'œuvre", "150 000 €", "142 500 €", "-7 500 €", false],
                      ["Matériaux", "85 000 €", "91 200 €", "+6 200 €", false],
                      ["Sous-traitance", "45 000 €", "44 800 €", "-200 €", false],
                      ["Frais généraux", "20 000 €", "18 900 €", "-1 100 €", false],
                      ["Total", "300 000 €", "297 400 €", "-2 600 €", true],
                    ].map(([poste, prevu, realise, ecart, isBold], i) => (
                      <tr key={i} className={isBold ? "bg-secondary/50 font-semibold" : "hover:bg-secondary/30"}>
                        <td className="px-3 py-2 border border-border">{poste}</td>
                        <td className="px-3 py-2 border border-border text-right">{prevu}</td>
                        <td className="px-3 py-2 border border-border text-right">{realise}</td>
                        <td className={`px-3 py-2 border border-border text-right ${
                          String(ecart).startsWith("+") ? "text-destructive" : "text-green-600"
                        }`}>{ecart}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-8 space-y-4">
                <div className="flex items-center justify-between mb-6">
                  <Badge variant="outline" className="text-[10px]">{statusLabels[file.status]}</Badge>
                  <span className="text-[10px] text-muted-foreground">{file.modified}</span>
                </div>
                {content.map((line, i) => (
                  <p key={i} className={`text-sm leading-relaxed text-foreground/80 ${
                    line === "" ? "h-3" : line.match(/^\d+\./) ? "font-semibold text-foreground mt-4" : ""
                  }`}>
                    {line}
                  </p>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-2 border-t border-border bg-card">
          <p className="text-[11px] text-muted-foreground">
            Dernière modification : {file.modified} par {file.author}
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
