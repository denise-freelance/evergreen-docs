import { useEffect, useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Download, ZoomIn, ZoomOut, RotateCw, FileText, FileSpreadsheet, FileImage, File, Loader2, Printer, ChevronDown, Pencil, Save, X } from "lucide-react";
import { getDocument, GlobalWorkerOptions } from "pdfjs-dist";
import type { DocFile } from "@/stores/useDocumentStore";
import { useDocumentStore } from "@/stores/useDocumentStore";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { getSavedPrinter } from "@/components/SettingsDialog";
import mammoth from "mammoth";
import * as XLSX from "xlsx";
import { Document as DocxDocument, Packer, Paragraph, TextRun } from "docx";

GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url).toString();

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

function extIs(name: string, list: string[]) {
  const ext = name.split(".").pop()?.toLowerCase() || "";
  return list.includes(ext);
}

export default function DocumentPreview({ open, onOpenChange, file }: DocumentPreviewProps) {
  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState(0);
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [pdfRendering, setPdfRendering] = useState(false);
  const [pdfError, setPdfError] = useState(false);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [docHtml, setDocHtml] = useState<string>("");
  const [sheet, setSheet] = useState<{ names: string[]; active: string; data: Record<string, string[][]> } | null>(null);
  const pdfContainerRef = useRef<HTMLDivElement | null>(null);
  const docEditorRef = useRef<HTMLDivElement | null>(null);
  const { getSignedUrl, saveEditedDocument } = useDocumentStore();
  const { user } = useAuth();
  const { toast } = useToast();

  const isDocx = !!file && extIs(file.name, ["docx"]);
  const isXlsx = !!file && extIs(file.name, ["xlsx", "xls"]);
  const editable = isDocx || isXlsx;

  useEffect(() => {
    let objectUrl: string | null = null;
    setEditing(false);
    setDocHtml("");
    setSheet(null);

    if (!file?.storagePath || !open) {
      setSignedUrl(null);
      setPreviewUrl(null);
      return;
    }

    setLoading(true);
    setSignedUrl(null);
    setPreviewUrl(null);
    setPageCount(0);
    setPdfError(false);

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

        // Word (.docx) — render editable HTML via mammoth
        if (isDocx) {
          try {
            const buf = await (await fetch(url)).arrayBuffer();
            const res = await mammoth.convertToHtml({ arrayBuffer: buf });
            setDocHtml(res.value || "<p></p>");
          } catch (e) {
            console.error("docx read error", e);
          }
          return;
        }

        // Excel (.xlsx / .xls) — parse into editable grid
        if (isXlsx) {
          try {
            const buf = await (await fetch(url)).arrayBuffer();
            const wb = XLSX.read(buf, { type: "array" });
            const data: Record<string, string[][]> = {};
            wb.SheetNames.forEach((n) => {
              const rows = XLSX.utils.sheet_to_json<string[]>(wb.Sheets[n], { header: 1, defval: "" });
              // Normalize row width
              const maxCols = Math.max(1, ...rows.map((r) => r.length));
              data[n] = rows.map((r) => {
                const copy = [...r];
                while (copy.length < maxCols) copy.push("");
                return copy.map((c) => (c == null ? "" : String(c)));
              });
              if (data[n].length === 0) data[n] = [["", "", ""], ["", "", ""]];
            });
            setSheet({ names: wb.SheetNames, active: wb.SheetNames[0], data });
          } catch (e) {
            console.error("xlsx read error", e);
          }
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
  }, [file?.storagePath, open, getSignedUrl, isDocx, isXlsx]);

  useEffect(() => {
    if (!open || file?.type !== "pdf" || !previewUrl || !pdfContainerRef.current) {
      setPdfRendering(false);
      return;
    }

    let cancelled = false;
    const container = pdfContainerRef.current;

    const renderPdf = async () => {
      try {
        setPdfRendering(true);
        setPdfError(false);
        container.innerHTML = "";

        const loadingTask = getDocument(previewUrl);
        const pdf = await loadingTask.promise;
        if (cancelled) return;

        setPageCount(pdf.numPages);

        for (let pageIndex = 1; pageIndex <= pdf.numPages; pageIndex += 1) {
          const page = await pdf.getPage(pageIndex);
          if (cancelled) return;

          const initialViewport = page.getViewport({ scale: 1, rotation });
          const availableWidth = Math.max((container.clientWidth || 900) - 32, 320);
          const fitScale = availableWidth / initialViewport.width;
          const viewport = page.getViewport({
            scale: Math.max(0.5, fitScale * (zoom / 100)),
            rotation,
          });

          const pageWrapper = document.createElement("div");
          pageWrapper.className = "overflow-hidden rounded-md border border-border bg-background shadow-sm";

          const canvas = document.createElement("canvas");
          const context = canvas.getContext("2d");
          if (!context) continue;

          const pixelRatio = window.devicePixelRatio || 1;
          canvas.width = Math.floor(viewport.width * pixelRatio);
          canvas.height = Math.floor(viewport.height * pixelRatio);
          canvas.style.width = `${Math.floor(viewport.width)}px`;
          canvas.style.height = `${Math.floor(viewport.height)}px`;

          context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
          await page.render({ canvas, canvasContext: context, viewport }).promise;

          pageWrapper.appendChild(canvas);
          container.appendChild(pageWrapper);
        }
      } catch (error) {
        console.error("PDF render error", error);
        if (!cancelled) {
          setPdfError(true);
          container.innerHTML = "";
        }
      } finally {
        if (!cancelled) setPdfRendering(false);
      }
    };

    renderPdf();

    return () => {
      cancelled = true;
      container.innerHTML = "";
    };
  }, [file?.type, open, previewUrl, rotation, zoom]);

  if (!file) return null;

  const Icon = fileIcons[file.type] || File;
  const isImage = file.type === "image";
  const isPdf = file.type === "pdf";

  const handleZoomIn = () => setZoom((z) => Math.min(z + 25, 200));
  const handleZoomOut = () => setZoom((z) => Math.max(z - 25, 50));
  const handleRotate = () => setRotation((r) => (r + 90) % 360);

  const printBlob = (blob: Blob) => {
    const url = URL.createObjectURL(blob);
    const w = window.open(url, "_blank");
    if (w) {
      w.addEventListener("load", () => {
        try { w.focus(); w.print(); } catch (e) { console.error(e); }
      });
    }
  };

  const handlePrint = async () => {
    const printer = getSavedPrinter();
    if (!printer.ip) {
      toast({
        title: "Imprimante non configurée",
        description: "Configurez l'imprimante Wi-Fi dans Paramètres (menu utilisateur).",
        variant: "destructive",
      });
      return;
    }
    // Try to reach printer on local Wi-Fi network
    try {
      await fetch(`http://${printer.ip}/`, { mode: "no-cors", signal: AbortSignal.timeout(2500) });
    } catch {
      toast({
        title: "Imprimante injoignable",
        description: `Impossible d'atteindre ${printer.ip}. Vérifiez le réseau Wi-Fi.`,
        variant: "destructive",
      });
      return;
    }
    toast({
      title: "Envoi à l'imprimante",
      description: `${printer.name || "Imprimante"} (${printer.ip}) — utilisez la boîte système pour sélectionner cette imprimante Wi-Fi.`,
    });

    // For editable modes, print current edits directly
    if (editing && isDocx && docEditorRef.current) {
      const w = window.open("", "_blank");
      if (w) {
        w.document.write(`<html><head><title>${file.name}</title></head><body>${docEditorRef.current.innerHTML}</body></html>`);
        w.document.close();
        w.addEventListener("load", () => { try { w.focus(); w.print(); } catch (e) { console.error(e); } });
      }
      return;
    }
    if (editing && isXlsx && sheet) {
      const w = window.open("", "_blank");
      if (w) {
        const rows = sheet.data[sheet.active] || [];
        const html = `<table border="1" cellspacing="0" cellpadding="4">${rows.map(r => `<tr>${r.map(c => `<td>${c ?? ""}</td>`).join("")}</tr>`).join("")}</table>`;
        w.document.write(`<html><head><title>${file.name}</title></head><body>${html}</body></html>`);
        w.document.close();
        w.addEventListener("load", () => { try { w.focus(); w.print(); } catch (e) { console.error(e); } });
      }
      return;
    }
    const url = previewUrl || signedUrl;
    if (!url) return;
    const w = window.open(url, "_blank");
    if (w) w.addEventListener("load", () => { try { w.focus(); w.print(); } catch (e) { console.error(e); } });
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

  const handleSaveEdits = async () => {
    if (!user) return;
    setSaving(true);
    try {
      let blob: Blob | null = null;
      if (isDocx && docEditorRef.current) {
        // Convert HTML content into paragraphs (simple text preservation).
        const text = docEditorRef.current.innerText;
        const paragraphs = text.split(/\n+/).map((line) => new Paragraph({ children: [new TextRun(line)] }));
        const doc = new DocxDocument({ sections: [{ children: paragraphs.length ? paragraphs : [new Paragraph("")] }] });
        const buf = await Packer.toBlob(doc);
        blob = new Blob([await buf.arrayBuffer()], { type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" });
      } else if (isXlsx && sheet) {
        const wb = XLSX.utils.book_new();
        sheet.names.forEach((n) => {
          const ws = XLSX.utils.aoa_to_sheet(sheet.data[n] || [[""]]);
          XLSX.utils.book_append_sheet(wb, ws, n);
        });
        const array = XLSX.write(wb, { type: "array", bookType: "xlsx" });
        blob = new Blob([array], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
      }
      if (!blob) throw new Error("nothing to save");
      const saved = await saveEditedDocument(file, blob, user.username, user.user_id);
      if (saved) {
        toast({ title: "Nouvelle version enregistrée", description: `${saved.name} · ${saved.version}` });
        setEditing(false);
        onOpenChange(false);
      } else {
        toast({ title: "Échec de l'enregistrement", variant: "destructive" });
      }
    } catch (e) {
      console.error(e);
      toast({ title: "Erreur", description: "Impossible d'enregistrer la nouvelle version.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const updateSheetCell = (r: number, c: number, v: string) => {
    if (!sheet) return;
    const rows = sheet.data[sheet.active].map((row) => [...row]);
    rows[r][c] = v;
    setSheet({ ...sheet, data: { ...sheet.data, [sheet.active]: rows } });
  };
  const addSheetRow = () => {
    if (!sheet) return;
    const rows = sheet.data[sheet.active];
    const width = rows[0]?.length || 3;
    setSheet({ ...sheet, data: { ...sheet.data, [sheet.active]: [...rows, Array(width).fill("")] } });
  };
  const addSheetCol = () => {
    if (!sheet) return;
    const rows = sheet.data[sheet.active].map((r) => [...r, ""]);
    setSheet({ ...sheet, data: { ...sheet.data, [sheet.active]: rows } });
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
            {!editing && (
              <>
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
              </>
            )}
            {editable && !editing && !file?.isArchived && (
              <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5" onClick={() => setEditing(true)}>
                <Pencil className="h-3.5 w-3.5" /> Modifier
              </Button>
            )}
            {file?.isArchived && (
              <Badge variant="outline" className="h-8 text-[11px] gap-1.5 px-2 border-warning/30 bg-warning/10 text-warning">
                Archivé — lecture seule
              </Badge>
            )}
            {editing && (
              <>
                <Button variant="ghost" size="sm" className="h-8 text-xs gap-1.5" onClick={() => setEditing(false)} disabled={saving}>
                  <X className="h-3.5 w-3.5" /> Annuler
                </Button>
                <Button size="sm" className="h-8 text-xs gap-1.5" onClick={handleSaveEdits} disabled={saving}>
                  {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                  Enregistrer la nouvelle version
                </Button>
              </>
            )}
            {signedUrl && !editing && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5">
                    <Download className="h-3.5 w-3.5" /> Télécharger
                    <ChevronDown className="h-3 w-3 opacity-60" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem onClick={handleExport} className="gap-2 text-xs">
                    <Download className="h-3.5 w-3.5" /> Exporter sur la machine
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handlePrint} className="gap-2 text-xs">
                    <Printer className="h-3.5 w-3.5" /> Imprimer via imprimante Wi-Fi
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-hidden bg-muted/50 flex items-stretch justify-center p-4">
          <div
            className="bg-background shadow-lg rounded-lg border border-border transition-transform duration-200 origin-top w-full max-w-5xl flex flex-col overflow-auto"
            style={isPdf || editable ? undefined : { transform: `scale(${zoom / 100}) rotate(${rotation}deg)` }}
          >
            {(loading || pdfRendering) && (
              <div className="flex items-center justify-center h-96">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            )}
            {!loading && !pdfRendering && !signedUrl && (
              <div className="flex flex-col items-center justify-center h-96 text-center p-6">
                <Icon className="h-16 w-16 text-muted-foreground/40 mb-3" />
                <p className="text-sm text-muted-foreground">Aperçu indisponible</p>
              </div>
            )}
            {!loading && !pdfRendering && previewUrl && isImage && (
              <img src={previewUrl} alt={file.name} className="w-full h-auto rounded-lg" />
            )}
            {!loading && previewUrl && isPdf && (
              <div className="flex-1 min-h-[70vh] overflow-auto bg-muted/30 p-4">
                {pdfError ? (
                  <div className="flex flex-col items-center justify-center h-96 text-center p-6">
                    <FileText className="h-16 w-16 text-muted-foreground/60 mb-3" />
                    <p className="text-sm">Impossible d'afficher ce PDF dans l'application.</p>
                    <Button onClick={handleExport} size="sm" className="mt-4 gap-1.5">
                      <Download className="h-3.5 w-3.5" /> Télécharger le PDF
                    </Button>
                  </div>
                ) : (
                  <div ref={pdfContainerRef} className="flex flex-col items-center gap-4" />
                )}
              </div>
            )}

            {!loading && isDocx && (
              <div className="p-6 overflow-auto min-h-[70vh]">
                <div
                  ref={docEditorRef}
                  contentEditable={editing}
                  suppressContentEditableWarning
                  className={`prose prose-sm max-w-none focus:outline-none ${editing ? "ring-2 ring-accent/40 rounded p-3" : ""}`}
                  dangerouslySetInnerHTML={{ __html: docHtml }}
                />
              </div>
            )}

            {!loading && isXlsx && sheet && (
              <div className="p-4 overflow-auto min-h-[70vh]">
                {sheet.names.length > 1 && (
                  <div className="flex gap-1 mb-3 flex-wrap">
                    {sheet.names.map((n) => (
                      <Button key={n} variant={n === sheet.active ? "default" : "outline"} size="sm" className="h-7 text-xs" onClick={() => setSheet({ ...sheet, active: n })}>{n}</Button>
                    ))}
                  </div>
                )}
                <div className="overflow-auto border rounded">
                  <table className="text-xs w-full border-collapse">
                    <tbody>
                      {(sheet.data[sheet.active] || []).map((row, r) => (
                        <tr key={r}>
                          {row.map((cell, c) => (
                            <td key={c} className="border border-border p-0">
                              {editing ? (
                                <input
                                  className="w-full min-w-24 px-2 py-1 bg-transparent focus:bg-accent/10 focus:outline-none"
                                  value={cell}
                                  onChange={(e) => updateSheetCell(r, c, e.target.value)}
                                />
                              ) : (
                                <div className="px-2 py-1 min-w-24">{cell}</div>
                              )}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {editing && (
                  <div className="flex gap-2 mt-3">
                    <Button variant="outline" size="sm" className="h-7 text-xs" onClick={addSheetRow}>+ Ligne</Button>
                    <Button variant="outline" size="sm" className="h-7 text-xs" onClick={addSheetCol}>+ Colonne</Button>
                  </div>
                )}
              </div>
            )}

            {!loading && !pdfRendering && signedUrl && file.type === "doc" && !isDocx && (
              <iframe
                src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(signedUrl)}`}
                title={file.name}
                className="w-full flex-1 min-h-[70vh] rounded-lg border-0"
              />
            )}
            {!loading && !pdfRendering && signedUrl && !isImage && !isPdf && !isDocx && !isXlsx && file.type !== "doc" && (
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
