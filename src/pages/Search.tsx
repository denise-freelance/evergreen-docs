import { useState, useMemo } from "react";
import {
  Search as SearchIcon,
  FileText,
  FileSpreadsheet,
  FileImage,
  File,
  Filter,
  CalendarDays,
  Tag,
  User,
  ChevronDown,
  ChevronUp,
  X,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

const allDocuments = [
  { name: "Contrat Partenariat Alpha 2025.pdf", type: "pdf", excerpt: "...selon les termes du contrat de partenariat établi en...", date: "2025-01-15", author: "Marie Curie", tags: ["contrat", "partenariat"] },
  { name: "Budget Prévisionnel.xlsx", type: "xlsx", excerpt: "...prévisions financières pour le Q1 et Q2 de l'année...", date: "2025-02-01", author: "Pierre Martin", tags: ["budget", "finance"] },
  { name: "Note de service - Télétravail.docx", type: "doc", excerpt: "...nouvelle politique de télétravail applicable à partir du...", date: "2024-12-10", author: "Sophie Lemoine", tags: ["RH", "politique"] },
  { name: "Projet Alpha - Spécifications.pdf", type: "pdf", excerpt: "...détails techniques concernant l'architecture du projet...", date: "2025-01-20", author: "Luc Bernard", tags: ["technique", "projet"] },
  { name: "Compte rendu réunion 12/01.txt", type: "doc", excerpt: "...points abordés lors de la réunion hebdomadaire...", date: "2025-01-12", author: "Jean Dupont", tags: ["réunion", "CR"] },
  { name: "Rapport Q4 2025.pdf", type: "pdf", excerpt: "...résultats financiers du quatrième trimestre montrent une croissance...", date: "2026-02-13", author: "Marie Curie", tags: ["rapport", "Q4"] },
  { name: "Facture_02_2026.pdf", type: "pdf", excerpt: "...montant total dû pour les prestations réalisées en...", date: "2026-02-08", author: "Marie Curie", tags: ["facture"] },
  { name: "Photo_chantier_03.jpg", type: "image", excerpt: "...photo du chantier de rénovation, vue extérieure...", date: "2026-02-11", author: "Sophie Lemoine", tags: ["chantier", "photo"] },
  { name: "Plan_formation.pptx", type: "doc", excerpt: "...plan de développement des compétences pour 2026...", date: "2026-02-07", author: "Pierre Martin", tags: ["formation", "RH"] },
  { name: "Organigramme.png", type: "image", excerpt: "...organigramme mis à jour de la direction générale...", date: "2026-02-06", author: "Sophie Lemoine", tags: ["organisation"] },
];

const fileTypeLabels: Record<string, string> = {
  pdf: "PDF",
  doc: "Word",
  xlsx: "Excel",
  image: "Images",
};

const fileIcons: Record<string, any> = {
  pdf: FileText,
  xlsx: FileSpreadsheet,
  image: FileImage,
  doc: File,
};

const dateOptions = [
  { value: "all", label: "Toutes les dates" },
  { value: "7d", label: "7 derniers jours" },
  { value: "30d", label: "30 derniers jours" },
  { value: "90d", label: "3 derniers mois" },
  { value: "1y", label: "Cette année" },
];

const owners = ["Marie Curie", "Pierre Martin", "Sophie Lemoine", "Luc Bernard", "Jean Dupont"];

function FilterSection({ title, icon: Icon, defaultOpen = true, children }: { title: string; icon: any; defaultOpen?: boolean; children: React.ReactNode }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger className="flex items-center justify-between w-full py-2 text-sm font-semibold text-foreground hover:text-foreground/80 transition-colors">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-muted-foreground" />
          {title}
        </div>
        {open ? <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />}
      </CollapsibleTrigger>
      <CollapsibleContent className="pb-3">
        {children}
      </CollapsibleContent>
    </Collapsible>
  );
}

export default function Search() {
  const [query, setQuery] = useState("");
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [dateFilter, setDateFilter] = useState("all");
  const [selectedOwners, setSelectedOwners] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState("pertinence");

  const toggleType = (type: string) => {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const toggleOwner = (owner: string) => {
    setSelectedOwners((prev) =>
      prev.includes(owner) ? prev.filter((o) => o !== owner) : [...prev, owner]
    );
  };

  const resetFilters = () => {
    setSelectedTypes([]);
    setDateFilter("all");
    setSelectedOwners([]);
  };

  const hasFilters = selectedTypes.length > 0 || dateFilter !== "all" || selectedOwners.length > 0;

  const results = useMemo(() => {
    let filtered = allDocuments;

    if (query.trim()) {
      const q = query.toLowerCase();
      filtered = filtered.filter(
        (d) =>
          d.name.toLowerCase().includes(q) ||
          d.excerpt.toLowerCase().includes(q) ||
          d.tags.some((t) => t.toLowerCase().includes(q))
      );
    }

    if (selectedTypes.length > 0) {
      filtered = filtered.filter((d) => selectedTypes.includes(d.type));
    }

    if (dateFilter !== "all") {
      const now = new Date();
      const days = dateFilter === "7d" ? 7 : dateFilter === "30d" ? 30 : dateFilter === "90d" ? 90 : 365;
      const cutoff = new Date(now.getTime() - days * 86400000);
      filtered = filtered.filter((d) => new Date(d.date) >= cutoff);
    }

    if (selectedOwners.length > 0) {
      filtered = filtered.filter((d) => selectedOwners.includes(d.author));
    }

    if (sortBy === "date") {
      filtered = [...filtered].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    } else if (sortBy === "nom") {
      filtered = [...filtered].sort((a, b) => a.name.localeCompare(b.name));
    }

    return filtered;
  }, [query, selectedTypes, dateFilter, selectedOwners, sortBy]);

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] animate-fade-in">
      {/* Header */}
      <div className="px-6 pt-6 pb-4 bg-card border-b border-border">
        <h1 className="text-xl font-bold text-foreground mb-4">Recherche avancée</h1>
        <div className="relative max-w-2xl">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher des documents, du contenu, des tags..."
            className="pl-10 h-11 text-sm bg-secondary border-0 focus-visible:ring-1 focus-visible:ring-accent"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {query && (
            <Button variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8" onClick={() => setQuery("")}>
              <X className="h-4 w-4" />
              <span className="sr-only">Effacer</span>
            </Button>
          )}
        </div>
      </div>

      <div className="flex flex-1 min-h-0">
        {/* Filters sidebar */}
        <div className="hidden md:flex w-60 lg:w-64 flex-col border-r border-border bg-card">
          <div className="flex items-center justify-between px-4 pt-4 pb-2">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Filter className="h-4 w-4" />
              Filtres
            </div>
            {hasFilters && (
              <button onClick={resetFilters} className="text-xs text-accent font-medium hover:underline">
                Réinitialiser
              </button>
            )}
          </div>

          <ScrollArea className="flex-1 px-4">
            <FilterSection title="Type de document" icon={FileText}>
              <div className="space-y-2 pl-1">
                {Object.entries(fileTypeLabels).map(([key, label]) => {
                  const Icon = fileIcons[key];
                  return (
                    <label key={key} className="flex items-center gap-2.5 text-sm cursor-pointer hover:text-foreground text-foreground/80">
                      <Checkbox
                        checked={selectedTypes.includes(key)}
                        onCheckedChange={() => toggleType(key)}
                      />
                      <Icon className="h-4 w-4 text-muted-foreground" />
                      {label}
                    </label>
                  );
                })}
              </div>
            </FilterSection>

            <Separator className="my-1" />

            <FilterSection title="Date de modification" icon={CalendarDays}>
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {dateOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value} className="text-xs">
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FilterSection>

            <Separator className="my-1" />

            <FilterSection title="Propriétaire" icon={User} defaultOpen={false}>
              <div className="space-y-2 pl-1">
                {owners.map((owner) => (
                  <label key={owner} className="flex items-center gap-2.5 text-sm cursor-pointer hover:text-foreground text-foreground/80">
                    <Checkbox
                      checked={selectedOwners.includes(owner)}
                      onCheckedChange={() => toggleOwner(owner)}
                    />
                    {owner}
                  </label>
                ))}
              </div>
            </FilterSection>

            <Separator className="my-1" />

            <FilterSection title="Tags" icon={Tag} defaultOpen={false}>
              <div className="flex flex-wrap gap-1.5">
                {["contrat", "budget", "RH", "technique", "rapport", "facture", "formation"].map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-[10px] cursor-pointer hover:bg-accent/20">
                    {tag}
                  </Badge>
                ))}
              </div>
            </FilterSection>
          </ScrollArea>
        </div>

        {/* Results */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Results toolbar */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card/50">
            <span className="text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">{results.length}</span> résultat{results.length !== 1 ? "s" : ""} trouvé{results.length !== 1 ? "s" : ""}
            </span>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Trier par:</span>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="h-8 w-[130px] text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pertinence" className="text-xs">Pertinence</SelectItem>
                  <SelectItem value="date" className="text-xs">Date</SelectItem>
                  <SelectItem value="nom" className="text-xs">Nom</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Results list */}
          <ScrollArea className="flex-1">
            <div className="p-4 space-y-3">
              {results.length === 0 ? (
                <div className="text-center py-16">
                  <SearchIcon className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
                  <p className="text-sm font-medium text-muted-foreground">Aucun résultat trouvé</p>
                  <p className="text-xs text-muted-foreground/70 mt-1">Essayez d'ajuster vos filtres ou votre recherche</p>
                </div>
              ) : (
                results.map((doc) => {
                  const Icon = fileIcons[doc.type] || File;
                  return (
                    <div
                      key={doc.name}
                      className="flex items-start gap-4 p-4 rounded-xl border border-border bg-card hover:shadow-card-hover hover:border-border/80 transition-all cursor-pointer"
                    >
                      <div className="rounded-lg bg-secondary p-2.5 shrink-0">
                        <Icon className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate">{doc.name}</p>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{doc.excerpt}</p>
                        <div className="flex items-center gap-3 mt-2">
                          <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                            <CalendarDays className="h-3 w-3" />
                            {doc.date}
                          </span>
                          <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                            <Tag className="h-3 w-3" />
                            {fileTypeLabels[doc.type] || "Fichier"}
                          </span>
                          <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                            <User className="h-3 w-3" />
                            {doc.author}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  );
}
