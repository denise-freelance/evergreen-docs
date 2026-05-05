import { useState } from "react";
import {
  Link2,
  ExternalLink,
  Upload,
  Bell,
  X,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import ImportDocumentsDialog from "@/components/ImportDocumentsDialog";
import { toast } from "@/hooks/use-toast";

interface Connector {
  name: string;
  icon: string;
  status: "connected" | "disconnected";
  docs: number;
  lastSync: string;
}

const initialConnectors: Connector[] = [
  { name: "Google Drive", icon: "🔵", status: "connected", docs: 234, lastSync: "il y a 5 min" },
  { name: "OneDrive", icon: "🔷", status: "connected", docs: 89, lastSync: "il y a 1h" },
  { name: "Gmail", icon: "📧", status: "connected", docs: 42, lastSync: "il y a 10 min" },
  { name: "Outlook", icon: "📨", status: "disconnected", docs: 0, lastSync: "-" },
  { name: "WhatsApp Desktop", icon: "🟢", status: "disconnected", docs: 0, lastSync: "-" },
  { name: "Slack", icon: "💬", status: "connected", docs: 0, lastSync: "Temps réel" },
  { name: "Microsoft Teams", icon: "🟣", status: "disconnected", docs: 0, lastSync: "-" },
  { name: "Dropbox", icon: "📦", status: "disconnected", docs: 0, lastSync: "-" },
  { name: "Zapier", icon: "⚡", status: "disconnected", docs: 0, lastSync: "-" },
];

export default function Connectors() {
  const [importOpen, setImportOpen] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [connectors, setConnectors] = useState<Connector[]>(initialConnectors);

  const toggleConnector = (name: string) => {
    setConnectors((prev) =>
      prev.map((c) => {
        if (c.name !== name) return c;
        const newStatus = c.status === "connected" ? "disconnected" : "connected";
        toast({
          title: newStatus === "connected" ? "Application connectée" : "Application déconnectée",
          description: `${c.name} ${newStatus === "connected" ? "est maintenant connectée à votre système." : "a été déconnectée."}`,
        });
        return {
          ...c,
          status: newStatus,
          lastSync: newStatus === "connected" ? "à l'instant" : "-",
        };
      })
    );
  };

  const handleSourceImport = (conn: Connector) => {
    toast({
      title: `Import depuis ${conn.name}`,
      description: "Ouverture de la source pour sélectionner les documents...",
    });
    setImportOpen(false);
  };

  const handleLocalImport = () => {
    setImportOpen(false);
    setUploadOpen(true);
  };

  const handleFilesImported = (files: File[], folder: string) => {
    toast({
      title: "Documents importés",
      description: `${files.length} fichier(s) importé(s) dans ${folder}.`,
    });
  };

  return (
    <div className="p-4 lg:p-6 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Connecteurs</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Intégrations avec vos applications tierces</p>
        </div>
        <Button className="bg-accent text-accent-foreground hover:bg-accent/90 gap-1.5" onClick={() => setImportOpen(true)}>
          <Upload className="h-4 w-4" /> Importer depuis...
        </Button>
      </div>

      {/* Slack notification example */}
      <Card className="shadow-card border-l-4 border-l-accent">
        <CardContent className="py-3 px-4 flex items-start gap-3">
          <div className="rounded-lg bg-accent/10 p-2 mt-0.5">
            <Bell className="h-4 w-4 text-accent" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium">Notification Slack</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              <span className="font-medium text-foreground">Marie Curie</span> a partagé "Rapport Q4 2025.pdf" dans <span className="font-medium text-foreground">#projet-lyon</span> · il y a 5 min
            </p>
          </div>
          <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0">
            <X className="h-3.5 w-3.5" />
          </Button>
        </CardContent>
      </Card>

      {/* Connectors grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {connectors.map((conn) => (
          <Card key={conn.name} className="shadow-card hover:shadow-card-hover transition-shadow">
            <CardContent className="pt-5 pb-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="text-2xl">{conn.icon}</div>
                  <div>
                    <p className="font-semibold text-sm">{conn.name}</p>
                    <Badge
                      variant="outline"
                      className={`text-[10px] mt-1 ${
                        conn.status === "connected"
                          ? "bg-success/10 text-success border-success/20"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {conn.status === "connected" ? "Connecté" : "Non connecté"}
                    </Badge>
                  </div>
                </div>
                <Switch
                  checked={conn.status === "connected"}
                  onCheckedChange={() => toggleConnector(conn.name)}
                  aria-label={`Connecter ou déconnecter ${conn.name}`}
                />
              </div>
              {conn.status === "connected" && (
                <div className="mt-4 pt-3 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
                  <span>{conn.docs > 0 ? `${conn.docs} documents synchronisés` : "Notifications actives"}</span>
                  <span>{conn.lastSync}</span>
                </div>
              )}
              {conn.status === "disconnected" && (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full mt-4 text-xs gap-1.5"
                  onClick={() => toggleConnector(conn.name)}
                >
                  <Link2 className="h-3.5 w-3.5" /> Connecter
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Import source modal */}
      <Dialog open={importOpen} onOpenChange={setImportOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Ajouter depuis...</DialogTitle>
            <DialogDescription>Sélectionnez une source pour importer des documents</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            {connectors.filter((c) => c.status === "connected").map((conn) => (
              <button
                key={conn.name}
                onClick={() => handleSourceImport(conn)}
                className="flex items-center gap-3 w-full rounded-lg border border-border p-3 hover:bg-secondary/50 transition-colors text-left"
              >
                <span className="text-xl">{conn.icon}</span>
                <div className="flex-1">
                  <p className="text-sm font-medium">{conn.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {conn.docs > 0 ? `${conn.docs} documents` : "Parcourir les fichiers"}
                  </p>
                </div>
                <ExternalLink className="h-4 w-4 text-muted-foreground" />
              </button>
            ))}
            <Separator />
            <button
              onClick={handleLocalImport}
              className="w-full rounded-lg border-2 border-dashed border-accent/30 bg-accent/5 p-6 text-center hover:bg-accent/10 transition-colors"
            >
              <Upload className="h-6 w-6 mx-auto text-accent/70 mb-2" />
              <p className="text-sm font-medium">Depuis votre ordinateur</p>
              <p className="text-xs text-muted-foreground mt-1">Glissez-déposez ou cliquez pour parcourir</p>
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Local upload dialog */}
      <ImportDocumentsDialog
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        onImport={handleFilesImported}
      />
    </div>
  );
}
