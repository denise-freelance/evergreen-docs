import { useEffect, useState } from "react";
import { Wifi, RefreshCw, CheckCircle2, Save, Printer } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

const SCANNER_KEY = "docuflow.scanner.ip";
const PRINTER_KEY = "docuflow.printer.ip";
const PRINTER_NAME_KEY = "docuflow.printer.name";

export function getSavedScannerIp(): string {
  return localStorage.getItem(SCANNER_KEY) ?? "";
}
export function getSavedPrinter(): { ip: string; name: string } {
  return {
    ip: localStorage.getItem(PRINTER_KEY) ?? "",
    name: localStorage.getItem(PRINTER_NAME_KEY) ?? "",
  };
}

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
}

export default function SettingsDialog({ open, onOpenChange }: Props) {
  const { toast } = useToast();
  const [ip, setIp] = useState("");
  const [status, setStatus] = useState<"idle" | "searching" | "connected" | "error">("idle");
  const [printerIp, setPrinterIp] = useState("");
  const [printerName, setPrinterName] = useState("");
  const [printerStatus, setPrinterStatus] = useState<"idle" | "searching" | "connected" | "error">("idle");

  useEffect(() => {
    if (open) {
      setIp(getSavedScannerIp());
      setStatus(getSavedScannerIp() ? "connected" : "idle");
      const p = getSavedPrinter();
      setPrinterIp(p.ip);
      setPrinterName(p.name);
      setPrinterStatus(p.ip ? "connected" : "idle");
    }
  }, [open]);

  const testScanner = async () => {
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

  const testPrinter = async () => {
    if (!printerIp.trim()) {
      toast({ title: "Adresse manquante", description: "Saisissez l'IP de l'imprimante.", variant: "destructive" });
      return;
    }
    setPrinterStatus("searching");
    try {
      await fetch(`http://${printerIp.trim()}/`, { mode: "no-cors", signal: AbortSignal.timeout(3000) });
      setPrinterStatus("connected");
      toast({ title: "Imprimante détectée", description: `Connexion Wi-Fi à ${printerIp}.` });
    } catch {
      setPrinterStatus("error");
      toast({ title: "Imprimante introuvable", description: "Vérifiez le réseau Wi-Fi.", variant: "destructive" });
    }
  };

  const save = () => {
    localStorage.setItem(SCANNER_KEY, ip.trim());
    localStorage.setItem(PRINTER_KEY, printerIp.trim());
    localStorage.setItem(PRINTER_NAME_KEY, printerName.trim());
    toast({ title: "Paramètres enregistrés" });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Paramètres</DialogTitle>
          <DialogDescription>Configurez la connexion aux périphériques Wi-Fi de votre réseau.</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <section className="space-y-3">
            <h3 className="text-sm font-semibold flex items-center gap-2"><Wifi className="h-4 w-4" /> Scanner Wi-Fi</h3>
            <p className="text-xs text-muted-foreground">Assurez-vous que le scanner est allumé et connecté au même réseau Wi-Fi.</p>
            <div className="space-y-2">
              <Label htmlFor="scanner-ip">Adresse IP du scanner</Label>
              <Input id="scanner-ip" placeholder="192.168.1.42" value={ip} onChange={(e) => setIp(e.target.value)} />
            </div>
            <Button variant="outline" className="w-full" onClick={testScanner} disabled={status === "searching"}>
              {status === "searching" ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Wifi className="h-4 w-4" />}
              Tester la connexion
            </Button>
            {status === "connected" && (
              <div className="flex items-center gap-2 text-xs text-success"><CheckCircle2 className="h-4 w-4" /> Scanner joignable</div>
            )}
            {status === "error" && <div className="text-xs text-destructive">Impossible d'atteindre le scanner.</div>}
          </section>

          <section className="space-y-3 border-t pt-4">
            <h3 className="text-sm font-semibold flex items-center gap-2"><Printer className="h-4 w-4" /> Imprimante Wi-Fi</h3>
            <p className="text-xs text-muted-foreground">
              Configurez l'imprimante réseau utilisée pour l'impression des documents. L'impression physique passe par la boîte de dialogue de votre système, qui utilisera l'imprimante Wi-Fi sélectionnée.
            </p>
            <div className="space-y-2">
              <Label htmlFor="printer-name">Nom de l'imprimante (optionnel)</Label>
              <Input id="printer-name" placeholder="HP LaserJet Bureau" value={printerName} onChange={(e) => setPrinterName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="printer-ip">Adresse IP</Label>
              <Input id="printer-ip" placeholder="192.168.1.50" value={printerIp} onChange={(e) => setPrinterIp(e.target.value)} />
            </div>
            <Button variant="outline" className="w-full" onClick={testPrinter} disabled={printerStatus === "searching"}>
              {printerStatus === "searching" ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Printer className="h-4 w-4" />}
              Tester la connexion
            </Button>
            {printerStatus === "connected" && (
              <div className="flex items-center gap-2 text-xs text-success"><CheckCircle2 className="h-4 w-4" /> Imprimante joignable</div>
            )}
            {printerStatus === "error" && <div className="text-xs text-destructive">Impossible d'atteindre l'imprimante.</div>}
          </section>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Annuler</Button>
          <Button onClick={save}><Save className="h-4 w-4" /> Enregistrer</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
