import {
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Users,
  Upload,
  ArrowUpRight,
  FileSpreadsheet,
  FileImage,
  File,
  MessageSquare,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import StorageChart from "@/components/StorageChart";
import ImportDocumentsDialog from "@/components/ImportDocumentsDialog";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

const stats = [
  { label: "Documents totaux", value: "12,847", icon: FileText, change: "+127 ce mois" },
  { label: "En attente", value: "23", icon: Clock, change: "5 urgents" },
  { label: "Validés aujourd'hui", value: "8", icon: CheckCircle2, change: "+3 vs hier" },
  { label: "Collaborateurs actifs", value: "42", icon: Users, change: "en ligne" },
];

const recentDocs = [
  { name: "Rapport Q4 2025.pdf", author: "Marie C.", time: "il y a 5 min", icon: FileText, status: "pending" },
  { name: "Budget_previsionnel.xlsx", author: "Pierre M.", time: "il y a 23 min", icon: FileSpreadsheet, status: "approved" },
  { name: "Photo_chantier_03.jpg", author: "Sophie L.", time: "il y a 1h", icon: FileImage, status: "draft" },
  { name: "Contrat_fournisseur_v3.pdf", author: "Jean D.", time: "il y a 2h", icon: FileText, status: "rejected" },
  { name: "Specs_techniques.docx", author: "Luc B.", time: "il y a 3h", icon: File, status: "approved" },
];

const pendingValidations = [
  { name: "Devis_renovation.pdf", requester: "Sophie L.", deadline: "Aujourd'hui", priority: "high" },
  { name: "Plan_formation_2026.docx", requester: "Pierre M.", deadline: "Demain", priority: "medium" },
  { name: "Audit_sécurité.pdf", requester: "Luc B.", deadline: "23 Fév", priority: "low" },
];

const activityFeed = [
  { user: "MC", name: "Marie Curie", action: "a modifié", target: "Rapport Q4 2025.pdf", time: "5 min" },
  { user: "PM", name: "Pierre Martin", action: "a partagé", target: "Budget_previsionnel.xlsx", time: "23 min" },
  { user: "SL", name: "Sophie Lemoine", action: "a commenté", target: "Plan_chantier.pdf", time: "1h" },
  { user: "JD", name: "Jean Dupont", action: "a validé", target: "Contrat_fournisseur_v2.pdf", time: "2h" },
  { user: "LB", name: "Luc Bernard", action: "a importé", target: "3 documents", time: "3h" },
];

const statusColors: Record<string, string> = {
  pending: "bg-warning/10 text-warning border-warning/20",
  approved: "bg-success/10 text-success border-success/20",
  draft: "bg-muted text-muted-foreground border-border",
  rejected: "bg-destructive/10 text-destructive border-destructive/20",
};

const statusLabels: Record<string, string> = {
  pending: "En attente",
  approved: "Validé",
  draft: "Brouillon",
  rejected: "Rejeté",
};

const priorityColors: Record<string, string> = {
  high: "bg-destructive/10 text-destructive",
  medium: "bg-warning/10 text-warning",
  low: "bg-info/10 text-info",
};

export default function Dashboard() {
  const [importOpen, setImportOpen] = useState(false);
  const { toast } = useToast();

  const handleImport = (files: File[], folderPath: string) => {
    toast({
      title: "Import réussi",
      description: `${files.length} fichier(s) importé(s) dans ${folderPath}`,
    });
  };

  return (
    <div className="p-4 lg:p-6 space-y-6 animate-fade-in">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Tableau de bord</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Vue d'ensemble de votre espace documentaire</p>
        </div>
        <Button className="bg-accent text-accent-foreground hover:bg-accent/90 gap-2" onClick={() => setImportOpen(true)}>
          <Upload className="h-4 w-4" />
          <span className="hidden sm:inline">Importer</span>
        </Button>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="shadow-card hover:shadow-card-hover transition-shadow">
            <CardContent className="pt-5 pb-4 px-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{stat.label}</p>
                  <p className="text-2xl font-bold mt-1">{stat.value}</p>
                  <p className="text-xs text-muted-foreground mt-1">{stat.change}</p>
                </div>
                <div className="rounded-lg bg-accent/10 p-2">
                  <stat.icon className="h-5 w-5 text-accent" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent documents */}
        <Card className="lg:col-span-2 shadow-card">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-sm font-semibold">Documents récents</CardTitle>
            <Button variant="ghost" size="sm" className="text-xs text-accent hover:text-accent gap-1">
              Voir tout <ArrowUpRight className="h-3 w-3" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-1">
            {recentDocs.map((doc) => (
              <div key={doc.name} className="flex items-center gap-3 py-2.5 px-2 rounded-lg hover:bg-secondary/50 transition-colors cursor-pointer">
                <div className="rounded-lg bg-secondary p-2">
                  <doc.icon className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{doc.name}</p>
                  <p className="text-xs text-muted-foreground">{doc.author} · {doc.time}</p>
                </div>
                <Badge variant="outline" className={`text-[10px] ${statusColors[doc.status]}`}>
                  {statusLabels[doc.status]}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Storage */}
        <StorageChart />
      </div>

      {/* Second row */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Pending validations */}
        <Card className="shadow-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              Validations en attente
              <Badge className="bg-warning/10 text-warning text-[10px] border-warning/20" variant="outline">
                {pendingValidations.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {pendingValidations.map((item) => (
              <div key={item.name} className="flex items-center gap-3 py-2.5 px-2 rounded-lg hover:bg-secondary/50 transition-colors">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{item.name}</p>
                  <p className="text-xs text-muted-foreground">par {item.requester} · Échéance : {item.deadline}</p>
                </div>
                <div className="flex gap-1.5">
                  <Button size="sm" className="h-7 text-xs bg-accent text-accent-foreground hover:bg-accent/90">
                    Valider
                  </Button>
                  <Button size="sm" variant="outline" className="h-7 text-xs">
                    Rejeter
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Activity feed */}
        <Card className="shadow-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Fil d'activité</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {activityFeed.map((item, i) => (
              <div key={i} className="flex items-start gap-3">
                <Avatar className="h-7 w-7 mt-0.5">
                  <AvatarFallback className="bg-primary text-primary-foreground text-[9px] font-semibold">
                    {item.user}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm">
                    <span className="font-medium">{item.name}</span>{" "}
                    <span className="text-muted-foreground">{item.action}</span>{" "}
                    <span className="font-medium">{item.target}</span>
                  </p>
                  <p className="text-xs text-muted-foreground">il y a {item.time}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
      <ImportDocumentsDialog open={importOpen} onOpenChange={setImportOpen} onImport={handleImport} />
    </div>
  );
}
