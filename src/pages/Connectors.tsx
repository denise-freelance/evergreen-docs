import { useState } from "react";
import {
  Link2,
  Plus,
  Search,
  Check,
  ExternalLink,
  Settings,
  RefreshCw,
  Upload,
  X,
  Cloud,
  MessageSquare,
  Zap,
  HardDrive,
  Bell,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

const connectors = [
  { name: "Google Drive", icon: "🔵", status: "connected", docs: 234, lastSync: "il y a 5 min" },
  { name: "OneDrive", icon: "🔷", status: "connected", docs: 89, lastSync: "il y a 1h" },
  { name: "Slack", icon: "💬", status: "connected", docs: 0, lastSync: "Temps réel" },
  { name: "Microsoft Teams", icon: "🟣", status: "disconnected", docs: 0, lastSync: "-" },
  { name: "Zapier", icon: "⚡", status: "disconnected", docs: 0, lastSync: "-" },
  { name: "Dropbox", icon: "📦", status: "disconnected", docs: 0, lastSync: "-" },
];

export default function Connectors() {
  const [importOpen, setImportOpen] = useState(false);

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
                <Switch checked={conn.status === "connected"} />
              </div>
              {conn.status === "connected" && (
                <div className="mt-4 pt-3 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
                  <span>{conn.docs > 0 ? `${conn.docs} documents synchronisés` : "Notifications actives"}</span>
                  <span>{conn.lastSync}</span>
                </div>
              )}
              {conn.status === "disconnected" && (
                <Button variant="outline" size="sm" className="w-full mt-4 text-xs gap-1.5">
                  <Link2 className="h-3.5 w-3.5" /> Connecter
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Import modal */}
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
            <div className="rounded-lg border-2 border-dashed border-accent/30 bg-accent/5 p-6 text-center">
              <Upload className="h-6 w-6 mx-auto text-accent/50 mb-2" />
              <p className="text-sm font-medium">Depuis votre ordinateur</p>
              <p className="text-xs text-muted-foreground mt-1">Glissez-déposez ou cliquez pour parcourir</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
