import { useEffect, useState } from "react";
import {
  FileText,
  FileSpreadsheet,
  FileImage,
  File,
  Download,
  Eye,
  Clock,
  User,
  CalendarDays,
  Tag,
  Info,
  X,
  Search,
  Filter,
  Share2,
  Users,
  ArrowUpDown,
  FolderOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface SharedDoc {
  shareId: string;
  documentId: string;
  name: string;
  type: string;
  size: string;
  sharedDate: string;
  sharedBy: string;
  initials: string;
  permission: string;
  folder: string;
  tags: string[];
}

const fileIcons: Record<string, any> = {
  pdf: FileText,
  xlsx: FileSpreadsheet,
  xls: FileSpreadsheet,
  image: FileImage,
  jpg: FileImage,
  jpeg: FileImage,
  png: FileImage,
  doc: File,
  docx: File,
  pptx: File,
};

const permissionLabels: Record<string, string> = {
  read: "Lecture",
  comment: "Commentaire",
  edit: "Édition",
  owner: "Propriétaire",
};

const permissionColors: Record<string, string> = {
  read: "bg-info/10 text-info border-info/20",
  comment: "bg-warning/10 text-warning border-warning/20",
  edit: "bg-success/10 text-success border-success/20",
  owner: "bg-accent/10 text-accent border-accent/20",
};

function formatBytes(bytes: number) {
  if (!bytes) return "—";
  const u = ["o", "Ko", "Mo", "Go"];
  let i = 0;
  let n = bytes;
  while (n >= 1024 && i < u.length - 1) {
    n /= 1024;
    i++;
  }
  return `${n.toFixed(n < 10 && i > 0 ? 1 : 0)} ${u[i]}`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
}

function getInitials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

export default function Shared() {
  const { user } = useAuth();
  const [docs, setDocs] = useState<SharedDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDoc, setSelectedDoc] = useState<SharedDoc | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterPermission, setFilterPermission] = useState("all");
  const [sortBy, setSortBy] = useState("date");
  const [detailOpen, setDetailOpen] = useState(false);

  useEffect(() => {
    if (!user?.user_id) return;
    (async () => {
      setLoading(true);
      const { data: shares } = await supabase
        .from("document_shares")
        .select("*")
        .eq("shared_with_user_id", user.user_id)
        .order("created_at", { ascending: false });

      if (!shares || shares.length === 0) {
        setDocs([]);
        setLoading(false);
        return;
      }

      const docIds = shares.map((s) => s.document_id);
      const { data: documents } = await supabase
        .from("documents")
        .select("*")
        .in("id", docIds);

      const docMap = new Map((documents || []).map((d) => [d.id, d]));
      const merged: SharedDoc[] = shares
        .filter((s) => docMap.has(s.document_id))
        .map((s) => {
          const d = docMap.get(s.document_id)!;
          return {
            shareId: s.id,
            documentId: s.document_id,
            name: d.name,
            type: d.type,
            size: formatBytes(d.size_bytes || 0),
            sharedDate: formatDate(s.created_at),
            sharedBy: s.created_by_name,
            initials: getInitials(s.created_by_name),
            permission: s.permission,
            folder: d.folder || "/",
            tags: d.tags || [],
          };
        });

      setDocs(merged);
      setLoading(false);
    })();
  }, [user?.user_id]);

  const filtered = docs
    .filter((doc) => {
      const matchesSearch =
        doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.sharedBy.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesPermission = filterPermission === "all" || doc.permission === filterPermission;
      return matchesSearch && matchesPermission;
    })
    .sort((a, b) => {
      if (sortBy === "name") return a.name.localeCompare(b.name);
      if (sortBy === "sender") return a.sharedBy.localeCompare(b.sharedBy);
      return 0;
    });

  const groupedBySender = filtered.reduce<Record<string, SharedDoc[]>>((acc, doc) => {
    if (!acc[doc.sharedBy]) acc[doc.sharedBy] = [];
    acc[doc.sharedBy].push(doc);
    return acc;
  }, {});

  const handleSelect = (doc: SharedDoc) => {
    setSelectedDoc(doc);
    setDetailOpen(true);
  };

  const SelectedIcon = selectedDoc ? fileIcons[selectedDoc.type] || File : File;

  return (
    <div className="flex h-[calc(100vh-4rem)] animate-fade-in">
      <div className="flex-1 flex flex-col min-w-0">
        <div className="p-4 lg:p-6 border-b border-border bg-card">
          <div className="flex items-center gap-3 mb-4">
            <div className="rounded-lg bg-accent/10 p-2">
              <Share2 className="h-5 w-5 text-accent" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground">Partagés avec moi</h1>
              <p className="text-xs text-muted-foreground">
                {loading ? "Chargement..." : `${docs.length} document${docs.length > 1 ? "s" : ""} partagé${docs.length > 1 ? "s" : ""}`}
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher par nom, expéditeur ou tag..."
                className="pl-9 bg-secondary border-0"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={filterPermission} onValueChange={setFilterPermission}>
              <SelectTrigger className="w-full sm:w-[160px] bg-secondary border-0">
                <Filter className="h-4 w-4 mr-2 text-muted-foreground" />
                <SelectValue placeholder="Permission" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes</SelectItem>
                <SelectItem value="read">Lecture</SelectItem>
                <SelectItem value="comment">Commentaire</SelectItem>
                <SelectItem value="edit">Édition</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full sm:w-[160px] bg-secondary border-0">
                <ArrowUpDown className="h-4 w-4 mr-2 text-muted-foreground" />
                <SelectValue placeholder="Trier par" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date">Date de partage</SelectItem>
                <SelectItem value="name">Nom</SelectItem>
                <SelectItem value="sender">Expéditeur</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Tabs defaultValue="all" className="flex-1 flex flex-col min-h-0">
          <div className="px-4 lg:px-6 pt-3">
            <TabsList className="bg-secondary">
              <TabsTrigger value="all" className="text-xs gap-1.5">
                <FolderOpen className="h-3.5 w-3.5" /> Tous les documents
              </TabsTrigger>
              <TabsTrigger value="by-person" className="text-xs gap-1.5">
                <Users className="h-3.5 w-3.5" /> Par personne
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="all" className="flex-1 min-h-0 mt-0">
            <ScrollArea className="h-full">
              <div className="px-4 lg:px-6 pb-6">
                <div className="hidden sm:grid grid-cols-[1fr_140px_120px_100px] gap-2 px-3 py-2 mt-2 text-[10px] uppercase tracking-wider font-semibold text-muted-foreground border-b border-border">
                  <span>Document</span>
                  <span>Partagé par</span>
                  <span>Date</span>
                  <span>Permission</span>
                </div>
                {!loading && filtered.length === 0 && (
                  <div className="text-center py-12 text-muted-foreground">
                    <Share2 className="h-10 w-10 mx-auto mb-3 opacity-30" />
                    <p className="text-sm font-medium">Aucun document partagé</p>
                    <p className="text-xs mt-1">Les documents partagés avec vous apparaîtront ici</p>
                  </div>
                )}
                {filtered.map((doc) => {
                  const Icon = fileIcons[doc.type] || File;
                  return (
                    <div
                      key={doc.shareId}
                      onClick={() => handleSelect(doc)}
                      className={`grid grid-cols-1 sm:grid-cols-[1fr_140px_120px_100px] gap-1 sm:gap-2 items-center px-3 py-3 rounded-lg cursor-pointer transition-colors text-sm border ${
                        selectedDoc?.shareId === doc.shareId && detailOpen
                          ? "bg-accent/10 border-accent/20"
                          : "hover:bg-secondary/50 border-transparent"
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
                        <div className="min-w-0">
                          <span className="truncate font-medium block">{doc.name}</span>
                          <span className="text-[10px] text-muted-foreground sm:hidden">
                            {doc.sharedBy} · {doc.sharedDate}
                          </span>
                        </div>
                      </div>
                      <div className="hidden sm:flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarFallback className="bg-primary text-primary-foreground text-[9px] font-semibold">
                            {doc.initials}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-xs text-muted-foreground truncate">{doc.sharedBy}</span>
                      </div>
                      <span className="hidden sm:block text-xs text-muted-foreground">{doc.sharedDate}</span>
                      <Badge variant="outline" className={`text-[10px] w-fit ${permissionColors[doc.permission]}`}>
                        {permissionLabels[doc.permission]}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="by-person" className="flex-1 min-h-0 mt-0">
            <ScrollArea className="h-full">
              <div className="px-4 lg:px-6 pb-6 space-y-6 pt-3">
                {Object.entries(groupedBySender).map(([sender, docs]) => (
                  <div key={sender}>
                    <div className="flex items-center gap-2 mb-2">
                      <Avatar className="h-7 w-7">
                        <AvatarFallback className="bg-primary text-primary-foreground text-[9px] font-semibold">
                          {docs[0].initials}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-semibold text-foreground">{sender}</span>
                      <Badge variant="secondary" className="text-[10px]">{docs.length}</Badge>
                    </div>
                    <div className="space-y-1 ml-9">
                      {docs.map((doc) => {
                        const Icon = fileIcons[doc.type] || File;
                        return (
                          <div
                            key={doc.shareId}
                            onClick={() => handleSelect(doc)}
                            className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-colors text-sm border ${
                              selectedDoc?.shareId === doc.shareId && detailOpen
                                ? "bg-accent/10 border-accent/20"
                                : "hover:bg-secondary/50 border-transparent"
                            }`}
                          >
                            <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
                            <span className="truncate font-medium flex-1">{doc.name}</span>
                            <span className="text-[10px] text-muted-foreground hidden sm:block">{doc.sharedDate}</span>
                            <Badge variant="outline" className={`text-[10px] ${permissionColors[doc.permission]}`}>
                              {permissionLabels[doc.permission]}
                            </Badge>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </div>

      {detailOpen && selectedDoc && (
        <div className="hidden lg:flex w-72 flex-col border-l border-border bg-card animate-slide-right">
          <div className="flex items-center justify-between p-3 border-b border-border">
            <h3 className="text-sm font-semibold">Détails</h3>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setDetailOpen(false)}>
              <X className="h-4 w-4" />
              <span className="sr-only">Fermer</span>
            </Button>
          </div>
          <ScrollArea className="flex-1 p-4">
            <div className="text-center pb-4 border-b border-border">
              <div className="rounded-xl bg-secondary p-6 inline-block mb-3">
                <SelectedIcon className="h-12 w-12 text-muted-foreground" />
              </div>
              <p className="font-semibold text-sm">{selectedDoc.name}</p>
              <Badge variant="outline" className={`mt-2 text-[10px] ${permissionColors[selectedDoc.permission]}`}>
                {permissionLabels[selectedDoc.permission]}
              </Badge>
            </div>

            <div className="space-y-4 pt-4">
              {[
                { icon: User, label: "Partagé par", value: selectedDoc.sharedBy },
                { icon: CalendarDays, label: "Date de partage", value: selectedDoc.sharedDate },
                { icon: Info, label: "Taille", value: selectedDoc.size },
                { icon: FolderOpen, label: "Dossier", value: selectedDoc.folder },
              ].map((prop) => (
                <div key={prop.label} className="flex items-start gap-3">
                  <prop.icon className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">{prop.label}</p>
                    <p className="text-sm">{prop.value}</p>
                  </div>
                </div>
              ))}
              {selectedDoc.tags.length > 0 && (
                <div className="flex items-start gap-3">
                  <Tag className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Tags</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {selectedDoc.tags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-[10px]">{tag}</Badge>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <Separator className="my-4" />

            <div className="space-y-2">
              <Button variant="outline" size="sm" className="w-full text-xs gap-1.5 justify-start">
                <Eye className="h-3.5 w-3.5" /> Aperçu
              </Button>
              <Button variant="outline" size="sm" className="w-full text-xs gap-1.5 justify-start">
                <Download className="h-3.5 w-3.5" /> Télécharger
              </Button>
              <Button variant="outline" size="sm" className="w-full text-xs gap-1.5 justify-start">
                <Clock className="h-3.5 w-3.5" /> Historique des versions
              </Button>
            </div>
          </ScrollArea>
        </div>
      )}
    </div>
  );
}
