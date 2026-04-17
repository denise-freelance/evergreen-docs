import { useState, useMemo } from "react";
import {
  FileText, Clock, CheckCircle2, Users, Upload, ArrowUpRight,
  FileSpreadsheet, FileImage, File, Search, X, Eye,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import StorageChart from "@/components/StorageChart";
import ImportDocumentsDialog from "@/components/ImportDocumentsDialog";
import DocumentPreview from "@/components/DocumentPreview";
import RejectReasonDialog from "@/components/RejectReasonDialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useDocumentStore, type DocFile } from "@/stores/useDocumentStore";
import { useNavigate } from "react-router-dom";

const fileIcons: Record<string, any> = {
  pdf: FileText,
  xlsx: FileSpreadsheet,
  image: FileImage,
  doc: File,
};

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

export default function Dashboard() {
  const [importOpen, setImportOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [previewDoc, setPreviewDoc] = useState<DocFile | null>(null);
  const [rejectDoc, setRejectDoc] = useState<DocFile | null>(null);
  const { toast } = useToast();
  const { profile, user } = useAuth();
  const navigate = useNavigate();

  const {
    addDocuments,
    searchDocuments,
    getRecentDocuments,
    getPendingValidations,
    getRecentActivities,
    validateDocument,
    viewDocument,
    documents,
    activities,
  } = useDocumentStore();

  const authorName = profile?.username || "Utilisateur";
  const authorId = user?.user_id || "";

  const recentDocs = getRecentDocuments(5);
  const pendingValidations = getPendingValidations();
  const activityFeed = getRecentActivities(6);
  const searchResults = useMemo(() => searchDocuments(searchQuery), [searchQuery, documents]);

  const totalDocs = documents.length;
  const pendingCount = pendingValidations.length;
  const approvedToday = documents.filter(
    (d) => d.status === "approved" && Date.now() - d.modifiedAt < 86400000
  ).length;

  const stats = [
    { label: "Documents totaux", value: String(totalDocs), icon: FileText, change: `${documents.filter((d) => Date.now() - d.modifiedAt < 2592000000).length} ce mois` },
    { label: "En attente", value: String(pendingCount), icon: Clock, change: `${pendingValidations.filter((d) => d.tags.includes("urgent")).length || pendingCount} à traiter` },
    { label: "Validés aujourd'hui", value: String(approvedToday), icon: CheckCircle2, change: "aujourd'hui" },
    { label: "Collaborateurs actifs", value: "42", icon: Users, change: "en ligne" },
  ];

  const handleImport = async (files: File[], folderPath: string) => {
    await addDocuments(files, folderPath, authorName, authorId);
    toast({
      title: "Import réussi",
      description: `${files.length} fichier(s) importé(s) dans ${folderPath}`,
    });
  };

  const handleValidate = async (id: string, approved: boolean) => {
    await validateDocument(id, approved, authorName, authorId);
    toast({
      title: "Document validé",
      description: "Le document a été validé avec succès.",
    });
  };

  const handleRejectConfirm = async (reason: string) => {
    if (!rejectDoc) return;
    await validateDocument(rejectDoc.id, false, authorName, authorId, reason);
    toast({
      title: "Document rejeté",
      description: `Motif : ${reason}`,
    });
    setRejectDoc(null);
  };

  const handlePreview = (doc: DocFile) => {
    viewDocument(doc.id, authorName, authorId);
    setPreviewDoc(doc);
  };

  return (
    <div className="p-4 lg:p-6 space-y-6 animate-fade-in">
      {/* Header */}
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

      {/* Search bar */}
      <div className="relative max-w-xl">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Recherche instantanée dans tous les dossiers et fichiers..."
          className="pl-10 h-11 text-sm bg-secondary border-0 focus-visible:ring-1 focus-visible:ring-accent"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        {searchQuery && (
          <Button variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8" onClick={() => setSearchQuery("")}>
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Search results overlay */}
      {searchQuery.trim() && (
        <Card className="shadow-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">
              {searchResults.length} résultat{searchResults.length !== 1 ? "s" : ""} pour « {searchQuery} »
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 max-h-64 overflow-y-auto">
            {searchResults.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">Aucun résultat trouvé</p>
            ) : (
              searchResults.map((doc) => {
                const Icon = fileIcons[doc.type] || File;
                return (
                  <div
                    key={doc.id}
                    className="flex items-center gap-3 py-2 px-2 rounded-lg hover:bg-secondary/50 transition-colors cursor-pointer"
                    onClick={() => handlePreview(doc)}
                  >
                    <div className="rounded-lg bg-secondary p-2">
                      <Icon className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{doc.name}</p>
                      <p className="text-xs text-muted-foreground">{doc.folder} · {doc.author}</p>
                    </div>
                    <Badge variant="outline" className={`text-[10px] ${statusColors[doc.status]}`}>
                      {statusLabels[doc.status]}
                    </Badge>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      )}

      {/* Stats */}
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
            <Button variant="ghost" size="sm" className="text-xs text-accent hover:text-accent gap-1" onClick={() => navigate("/documents")}>
              Voir tout <ArrowUpRight className="h-3 w-3" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-1">
            {recentDocs.map((doc) => {
              const Icon = fileIcons[doc.type] || File;
              return (
                <div
                  key={doc.id}
                  className="flex items-center gap-3 py-2.5 px-2 rounded-lg hover:bg-secondary/50 transition-colors cursor-pointer"
                  onClick={() => handlePreview(doc)}
                >
                  <div className="rounded-lg bg-secondary p-2">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{doc.name}</p>
                    <p className="text-xs text-muted-foreground">{doc.author} · {doc.folder}</p>
                  </div>
                  <Badge variant="outline" className={`text-[10px] ${statusColors[doc.status]}`}>
                    {statusLabels[doc.status]}
                  </Badge>
                  <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={(e) => { e.stopPropagation(); handlePreview(doc); }}>
                    <Eye className="h-3.5 w-3.5" />
                  </Button>
                </div>
              );
            })}
          </CardContent>
        </Card>

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
            {pendingValidations.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">Aucune validation en attente</p>
            ) : (
              pendingValidations.map((item) => (
                <div key={item.id} className="flex items-center gap-3 py-2.5 px-2 rounded-lg hover:bg-secondary/50 transition-colors">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.name}</p>
                    <p className="text-xs text-muted-foreground">par {item.author} · {item.folder}</p>
                  </div>
                  <div className="flex gap-1.5">
                    <Button size="sm" className="h-7 text-xs bg-accent text-accent-foreground hover:bg-accent/90" onClick={() => handleValidate(item.id, true)}>
                      Valider
                    </Button>
                    <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setRejectDoc(item)}>
                      Rejeter
                    </Button>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Activity feed */}
        <Card className="shadow-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Fil d'activité</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {activityFeed.map((item) => (
              <div key={item.id} className="flex items-start gap-3">
                <Avatar className="h-7 w-7 mt-0.5">
                  <AvatarFallback className="bg-primary text-primary-foreground text-[9px] font-semibold">
                    {item.userInitials}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm">
                    <span className="font-medium">{item.userName}</span>{" "}
                    <span className="text-muted-foreground">{item.action}</span>{" "}
                    <span className="font-medium">{item.target}</span>
                  </p>
                  <p className="text-xs text-muted-foreground">{item.time}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <ImportDocumentsDialog open={importOpen} onOpenChange={setImportOpen} onImport={handleImport} />
      <DocumentPreview open={!!previewDoc} onOpenChange={(open) => !open && setPreviewDoc(null)} file={previewDoc} />
      <RejectReasonDialog
        open={!!rejectDoc}
        onOpenChange={(open) => !open && setRejectDoc(null)}
        documentName={rejectDoc?.name || ""}
        onConfirm={handleRejectConfirm}
      />
    </div>
  );
}
