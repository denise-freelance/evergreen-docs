import { useEffect, useMemo, useRef, useState } from "react";
import { Scan as ScanIcon, Camera, Wifi, WifiOff, Upload, X, Save, FileImage } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useDocumentStore, FolderNode } from "@/stores/useDocumentStore";

function flattenFolders(nodes: FolderNode[], acc: { path: string; label: string }[] = [], depth = 0) {
  nodes.forEach((n) => {
    acc.push({ path: n.path, label: `${"— ".repeat(depth)}${n.name}` });
    if (n.children) flattenFolders(n.children, acc, depth + 1);
  });
  return acc;
}

interface Scanned {
  id: string;
  dataUrl: string;
  blob: Blob;
}

export default function ScanPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const { folders, addDocuments } = useDocumentStore();
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [cameraOn, setCameraOn] = useState(false);
  const [scanned, setScanned] = useState<Scanned[]>([]);
  const [folder, setFolder] = useState<string>("");
  const [baseName, setBaseName] = useState("Scan");
  const [saving, setSaving] = useState(false);
  const [scannerIp, setScannerIp] = useState("");
  const [scannerStatus, setScannerStatus] = useState<"idle" | "searching" | "connected" | "error">("idle");
  const [online, setOnline] = useState(navigator.onLine);

  const folderOptions = useMemo(() => flattenFolders(folders), [folders]);

  useEffect(() => {
    if (!folder && folderOptions[0]) setFolder(folderOptions[0].path);
  }, [folderOptions, folder]);

  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraOn(true);
    } catch (e: any) {
      toast({ title: "Caméra indisponible", description: e?.message ?? "Autorisez l'accès à la caméra.", variant: "destructive" });
    }
  };

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setCameraOn(false);
  };

  const capture = async () => {
    const video = videoRef.current;
    if (!video) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);
    const blob: Blob = await new Promise((res) => canvas.toBlob((b) => res(b as Blob), "image/jpeg", 0.92)!);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.92);
    setScanned((s) => [...s, { id: crypto.randomUUID(), dataUrl, blob }]);
  };

  const handleFilePick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const items: Scanned[] = await Promise.all(
      files.map(
        (f) =>
          new Promise<Scanned>((resolve) => {
            const reader = new FileReader();
            reader.onload = () => resolve({ id: crypto.randomUUID(), dataUrl: reader.result as string, blob: f });
            reader.readAsDataURL(f);
          }),
      ),
    );
    setScanned((s) => [...s, ...items]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeScan = (id: string) => setScanned((s) => s.filter((x) => x.id !== id));

  const connectScanner = async () => {
    if (!scannerIp.trim()) {
      toast({ title: "Adresse manquante", description: "Saisissez l'IP du scanner sur votre réseau Wi-Fi.", variant: "destructive" });
      return;
    }
    setScannerStatus("searching");
    // Best-effort reachability probe (browsers block cross-origin reads, but the request is fired).
    try {
      await fetch(`http://${scannerIp.trim()}/`, { mode: "no-cors", signal: AbortSignal.timeout(3000) });
      setScannerStatus("connected");
      toast({ title: "Scanner détecté", description: `Connexion Wi-Fi à ${scannerIp}. Utilisez les boutons ci-dessous pour capturer.` });
    } catch {
      setScannerStatus("error");
      toast({ title: "Scanner introuvable", description: "Vérifiez que le scanner est allumé et sur le même réseau Wi-Fi.", variant: "destructive" });
    }
  };

  const saveAll = async () => {
    if (!user || scanned.length === 0 || !folder) return;
    setSaving(true);
    try {
      const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
      const files = scanned.map((s, i) => {
        const name = `${baseName || "Scan"}-${stamp}-${String(i + 1).padStart(2, "0")}.jpg`;
        return new File([s.blob], name, { type: "image/jpeg" });
      });
      await addDocuments(files, folder, user.username, user.id);
      toast({ title: "Documents enregistrés", description: `${files.length} document(s) ajouté(s) à ${folder}.` });
      setScanned([]);
      stopCamera();
    } catch (e: any) {
      toast({ title: "Erreur", description: e?.message ?? "Impossible d'enregistrer.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ScanIcon className="h-6 w-6 text-accent" /> Numérisation
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Numérisez un ou plusieurs documents et enregistrez-les directement dans l'arborescence.
          </p>
        </div>
        <Badge variant="outline" className={online ? "border-success/30 text-success" : "border-destructive/30 text-destructive"}>
          {online ? <Wifi className="h-3 w-3 mr-1" /> : <WifiOff className="h-3 w-3 mr-1" />}
          {online ? "En ligne" : "Hors ligne"}
        </Badge>
      </div>

      <Card className="p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold flex items-center gap-2"><Camera className="h-4 w-4" /> Source de numérisation</h2>
          <div className="flex gap-2">
            {!cameraOn ? (
              <Button size="sm" onClick={startCamera}><Camera className="h-4 w-4" /> Activer la caméra</Button>
            ) : (
              <Button size="sm" variant="outline" onClick={stopCamera}><X className="h-4 w-4" /> Arrêter</Button>
            )}
            <Button size="sm" variant="outline" onClick={() => fileInputRef.current?.click()}>
              <Upload className="h-4 w-4" /> Importer une image
            </Button>
            <input ref={fileInputRef} type="file" accept="image/*" multiple capture="environment" hidden onChange={handleFilePick} />
          </div>
        </div>

        <div className="relative rounded-lg overflow-hidden bg-black/90 aspect-video flex items-center justify-center">
          <video ref={videoRef} className={`w-full h-full object-contain ${cameraOn ? "" : "hidden"}`} playsInline muted />
          {!cameraOn && (
            <div className="text-center text-white/70 p-8">
              <ScanIcon className="h-12 w-12 mx-auto mb-3 opacity-60" />
              <p className="text-sm">Activez la caméra ou importez une image pour commencer. Configurez le scanner Wi-Fi dans <span className="font-semibold">Paramètres</span> (menu utilisateur).</p>
            </div>
          )}
        </div>

        {cameraOn && (
          <div className="flex justify-center gap-2">
            <Button onClick={capture}><ScanIcon className="h-4 w-4" /> Capturer une page</Button>
          </div>
        )}
      </Card>


      <Card className="p-5 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h2 className="font-semibold flex items-center gap-2">
            <FileImage className="h-4 w-4" /> Pages numérisées
            <Badge variant="secondary">{scanned.length}</Badge>
          </h2>
          {scanned.length > 0 && (
            <Button variant="ghost" size="sm" onClick={() => setScanned([])}>Tout effacer</Button>
          )}
        </div>

        {scanned.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">Aucune page numérisée pour le moment.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {scanned.map((s, i) => (
              <div key={s.id} className="relative group border border-border rounded-md overflow-hidden bg-secondary">
                <img src={s.dataUrl} alt={`Page ${i + 1}`} className="w-full aspect-[3/4] object-cover" />
                <div className="absolute top-1 left-1 bg-background/80 text-[10px] font-semibold px-1.5 py-0.5 rounded">
                  #{i + 1}
                </div>
                <button
                  onClick={() => removeScan(s.id)}
                  className="absolute top-1 right-1 h-6 w-6 rounded-full bg-destructive text-destructive-foreground opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                  aria-label="Supprimer"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}

        {scanned.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-border">
            <div className="space-y-2">
              <Label>Nom de base</Label>
              <Input value={baseName} onChange={(e) => setBaseName(e.target.value)} placeholder="Scan" />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>Dossier de destination</Label>
              <Select value={folder} onValueChange={setFolder}>
                <SelectTrigger><SelectValue placeholder="Sélectionner un dossier" /></SelectTrigger>
                <SelectContent>
                  {folderOptions.length === 0 ? (
                    <SelectItem value="__none" disabled>Aucun dossier disponible</SelectItem>
                  ) : (
                    folderOptions.map((f) => (
                      <SelectItem key={f.path} value={f.path}>{f.label}</SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="sm:col-span-3 flex justify-end">
              <Button onClick={saveAll} disabled={saving || !folder}>
                <Save className="h-4 w-4" /> {saving ? "Enregistrement..." : `Enregistrer ${scanned.length} document(s)`}
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
