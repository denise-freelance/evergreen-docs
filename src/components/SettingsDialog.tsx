import { useEffect, useState } from "react";
import { Wifi, RefreshCw, CheckCircle2, Save } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

const STORAGE_KEY = "docuflow.scanner.ip";

export function getSavedScannerIp(): string {
  return localStorage.getItem(STORAGE_KEY) ?? "";
}

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
}

export default function SettingsDialog({ open, onOpenChange }: Props) {
  const { toast } = useToast();
  const [ip, setIp] = useState("");
  const [status, setStatus] = useState<"idle" | "searching" | "connected" | "error">("idle");

  useEffect(() => {
    if (open) {
      setIp(getSavedScannerIp());
      setStatus(getSavedScannerIp() ? "connected" : "idle");
    }
  }, [open]);

  const test = async () => {
    if (!ip.trim()) {
      toast({ title: "Adresse manquante", description: "Saisissez l'IP du scanner.", variant: "destructive" });
      return;
    }
    setStatus("searching");
    try {
      await fetch(`http://${ip.trim()}/`, { mode: "no-cors", signal: AbortSignal.timeout(3000) });
      setStatus("connected");
      toast({ title: "Scanner détecté", description: `Connexion Wi-Fi à ${ip}.` });
    } catch {
      setStatus("error");
      toast({ title: "Scanner introuvable", description: "Vérifiez le réseau Wi-Fi.", variant: "destructive" });
    }
  };

  const save = () => {
    localStorage.setItem(STORAGE_KEY, ip.trim());
    toast({ title: "Paramètres enregistrés" });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Paramètres</DialogTitle>
          <DialogDescription>Configurez la connexion au scanner Wi-Fi de votre réseau.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <h3 className="text-sm font-semibold flex items-center gap-2"><Wifi className="h-4 w-4" /> Scanner Wi-Fi</h3>
            <p className="text-xs text-muted-foreground">
              Assurez-vous que le scanner est allumé et connecté au même réseau Wi-Fi que cet appareil.
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="scanner-ip">Adresse IP du scanner</Label>
            <Input id="scanner-ip" placeholder="192.168.1.42" value={ip} onChange={(e) => setIp(e.target.value)} />
          </div>
          <Button variant="outline" className="w-full" onClick={test} disabled={status === "searching"}>
            {status === "searching" ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Wifi className="h-4 w-4" />}
            Tester la connexion
          </Button>
          {status === "connected" && (
            <div className="flex items-center gap-2 text-xs text-success">
              <CheckCircle2 className="h-4 w-4" /> Scanner joignable sur le réseau
            </div>
          )}
          {status === "error" && (
            <div className="text-xs text-destructive">Impossible d'atteindre le scanner.</div>
          )}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Annuler</Button>
          <Button onClick={save}><Save className="h-4 w-4" /> Enregistrer</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
