import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Filter, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export type SortBy = "name" | "createdAt" | "modifiedAt" | "author";
export type SortDir = "asc" | "desc";

export interface DocumentFilters {
  name: string;
  author: string;
  createdFrom: string;
  createdTo: string;
  modifiedFrom: string;
  modifiedTo: string;
  sortBy: SortBy;
  sortDir: SortDir;
}

export const defaultFilters: DocumentFilters = {
  name: "",
  author: "",
  createdFrom: "",
  createdTo: "",
  modifiedFrom: "",
  modifiedTo: "",
  sortBy: "modifiedAt",
  sortDir: "desc",
};

export function countActiveFilters(f: DocumentFilters): number {
  let n = 0;
  if (f.name) n++;
  if (f.author) n++;
  if (f.createdFrom || f.createdTo) n++;
  if (f.modifiedFrom || f.modifiedTo) n++;
  return n;
}

interface Props {
  filters: DocumentFilters;
  onChange: (f: DocumentFilters) => void;
  authors: string[];
}

export default function DocumentFilterPopover({ filters, onChange, authors }: Props) {
  const active = countActiveFilters(filters);
  const reset = () => onChange(defaultFilters);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8 relative">
          <Filter className="h-4 w-4" />
          {active > 0 && (
            <Badge className="absolute -top-1 -right-1 h-4 min-w-4 px-1 text-[9px] bg-accent text-accent-foreground">
              {active}
            </Badge>
          )}
          <span className="sr-only">Filtres</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold">Filtrer les documents</h4>
            {active > 0 && (
              <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={reset}>
                <X className="h-3 w-3 mr-1" /> Réinitialiser
              </Button>
            )}
          </div>

          <div>
            <Label className="text-xs">Nom du document</Label>
            <Input
              value={filters.name}
              onChange={(e) => onChange({ ...filters, name: e.target.value })}
              placeholder="Rechercher par nom..."
              className="h-8 mt-1 text-xs"
            />
          </div>

          <div>
            <Label className="text-xs">Auteur</Label>
            <Select value={filters.author || "all"} onValueChange={(v) => onChange({ ...filters, author: v === "all" ? "" : v })}>
              <SelectTrigger className="h-8 mt-1 text-xs">
                <SelectValue placeholder="Tous les auteurs" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les auteurs</SelectItem>
                {authors.map((a) => (
                  <SelectItem key={a} value={a}>{a}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs">Créé après</Label>
              <Input type="date" value={filters.createdFrom} onChange={(e) => onChange({ ...filters, createdFrom: e.target.value })} className="h-8 mt-1 text-xs" />
            </div>
            <div>
              <Label className="text-xs">Créé avant</Label>
              <Input type="date" value={filters.createdTo} onChange={(e) => onChange({ ...filters, createdTo: e.target.value })} className="h-8 mt-1 text-xs" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs">Modifié après</Label>
              <Input type="date" value={filters.modifiedFrom} onChange={(e) => onChange({ ...filters, modifiedFrom: e.target.value })} className="h-8 mt-1 text-xs" />
            </div>
            <div>
              <Label className="text-xs">Modifié avant</Label>
              <Input type="date" value={filters.modifiedTo} onChange={(e) => onChange({ ...filters, modifiedTo: e.target.value })} className="h-8 mt-1 text-xs" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1 border-t border-border">
            <div>
              <Label className="text-xs">Trier par</Label>
              <Select value={filters.sortBy} onValueChange={(v) => onChange({ ...filters, sortBy: v as SortBy })}>
                <SelectTrigger className="h-8 mt-1 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">Nom</SelectItem>
                  <SelectItem value="createdAt">Date de création</SelectItem>
                  <SelectItem value="modifiedAt">Date de modification</SelectItem>
                  <SelectItem value="author">Auteur</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Ordre</Label>
              <Select value={filters.sortDir} onValueChange={(v) => onChange({ ...filters, sortDir: v as SortDir })}>
                <SelectTrigger className="h-8 mt-1 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="asc">Croissant</SelectItem>
                  <SelectItem value="desc">Décroissant</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
