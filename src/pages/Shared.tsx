import { useState } from "react";
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

const sharedDocuments = [
  { name: "Rapport Q4 2025.pdf", type: "pdf", size: "2.4 Mo", sharedDate: "14 Fév 2026", sharedBy: "Marie Curie", initials: "MC", permission: "edit", folder: "Comptabilité", tags: ["rapport", "Q4"] },
  { name: "Budget_previsionnel.xlsx", type: "xlsx", size: "890 Ko", sharedDate: "13 Fév 2026", sharedBy: "Pierre Martin", initials: "PM", permission: "read", folder: "Comptabilité", tags: ["budget"] },
  { name: "Plan_formation.pptx", type: "doc", size: "12.3 Mo", sharedDate: "12 Fév 2026", sharedBy: "Sophie Lemoine", initials: "SL", permission: "comment", folder: "Ressources Humaines", tags: ["formation", "RH"] },
  { name: "Contrat_fournisseur.pdf", type: "pdf", size: "1.2 Mo", sharedDate: "11 Fév 2026", sharedBy: "Luc Bernard", initials: "LB", permission: "read", folder: "Projets", tags: ["contrat", "juridique"] },
  { name: "Specs_techniques.docx", type: "doc", size: "3.7 Mo", sharedDate: "10 Fév 2026", sharedBy: "Marie Curie", initials: "MC", permission: "edit", folder: "Projets", tags: ["technique"] },
  { name: "Photo_chantier_03.jpg", type: "image", size: "5.1 Mo", sharedDate: "9 Fév 2026", sharedBy: "Pierre Martin", initials: "PM", permission: "read", folder: "Projets", tags: ["chantier", "photo"] },
  { name: "Facture_02_2026.pdf", type: "pdf", size: "145 Ko", sharedDate: "8 Fév 2026", sharedBy: "Sophie Lemoine", initials: "SL", permission: "comment", folder: "Comptabilité", tags: ["facture"] },
  { name: "Organigramme.png", type: "image", size: "780 Ko", sharedDate: "7 Fév 2026", sharedBy: "Luc Bernard", initials: "LB", permission: "read", folder: "Ressources Humaines", tags: ["organisation"] },
  { name: "Cahier_des_charges_v2.pdf", type: "pdf", size: "4.5 Mo", sharedDate: "6 Fév 2026", sharedBy: "Marie Curie", initials: "MC", permission: "edit", folder: "Projets", tags: ["CDC", "technique"] },
  { name: "Présentation_client.pptx", type: "doc", size: "8.9 Mo", sharedDate: "5 Fév 2026", sharedBy: "Pierre Martin", initials: "PM", permission: "comment", folder: "Projets", tags: ["présentation"] },
];

const fileIcons: Record<string, any> = {
  pdf: FileText,
  xlsx: FileSpreadsheet,
  image: FileImage,
  doc: File,
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

export default function Shared() {
  const [selectedDoc, setSelectedDoc] = useState<typeof sharedDocuments[0] | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterPermission, setFilterPermission] = useState("all");
  const [sortBy, setSortBy] = useState("date");
  const [detailOpen, setDetailOpen] = useState(false);

  const filtered = sharedDocuments
    .filter((doc) => {
      const matchesSearch = doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.sharedBy.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesPermission = filterPermission === "all" || doc.permission === filterPermission;
      return matchesSearch && matchesPermission;
    })
    .sort((a, b) => {
      if (sortBy === "name") return a.name.localeCompare(b.name);
      if (sortBy === "sender") return a.sharedBy.localeCompare(b.sharedBy);
      return 0; // date – already sorted
    });

  // Group by sender for the "Par personne" tab
  const groupedBySender = filtered.reduce<Record<string, typeof sharedDocuments>>((acc, doc) => {
    if (!acc[doc.sharedBy]) acc[doc.sharedBy] = [];
    acc[doc.sharedBy].push(doc);
    return acc;
  }, {});

  const handleSelect = (doc: typeof sharedDocuments[0]) => {
    setSelectedDoc(doc);
    setDetailOpen(true);
  };

  const SelectedIcon = selectedDoc ? fileIcons[selectedDoc.type] || File : File;

  return (
    <div className="flex h-[calc(100vh-4rem)] animate-fade-in">
      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="p-4 lg:p-6 border-b border-border bg-card">
          <div className="flex items-center gap-3 mb-4">
            <div className="rounded-lg bg-accent/10 p-2">
              <Share2 className="h-5 w-5 text-accent" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground">Partagés avec moi</h1>
              <p className="text-xs text-muted-foreground">{sharedDocuments.length} documents partagés</p>
            </div>
          </div>

          {/* Search + filters */}
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

        {/* Tabs: Tous / Par personne */}
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

          {/* All documents */}
          <TabsContent value="all" className="flex-1 min-h-0 mt-0">
            <ScrollArea className="h-full">
              <div className="px-4 lg:px-6 pb-6">
                {/* List header */}
                <div className="hidden sm:grid grid-cols-[1fr_140px_120px_100px] gap-2 px-3 py-2 mt-2 text-[10px] uppercase tracking-wider font-semibold text-muted-foreground border-b border-border">
                  <span>Document</span>
                  <span>Partagé par</span>
                  <span>Date</span>
                  <span>Permission</span>
                </div>
                {filtered.length === 0 && (
                  <div className="text-center py-12 text-muted-foreground">
                    <Share2 className="h-10 w-10 mx-auto mb-3 opacity-30" />
                    <p className="text-sm font-medium">Aucun document trouvé</p>
                    <p className="text-xs mt-1">Essayez de modifier vos filtres</p>
                  </div>
                )}
                {filtered.map((doc) => {
                  const Icon = fileIcons[doc.type] || File;
                  return (
                    <div
                      key={doc.name}
                      onClick={() => handleSelect(doc)}
                      className={`grid grid-cols-1 sm:grid-cols-[1fr_140px_120px_100px] gap-1 sm:gap-2 items-center px-3 py-3 rounded-lg cursor-pointer transition-colors text-sm border ${
                        selectedDoc?.name === doc.name && detailOpen
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

          {/* By person */}
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
                            key={doc.name}
                            onClick={() => handleSelect(doc)}
                            className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-colors text-sm border ${
                              selectedDoc?.name === doc.name && detailOpen
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

      {/* Detail panel */}
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
