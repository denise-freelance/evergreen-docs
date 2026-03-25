import { useState, useEffect } from "react";
import { Search, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { auditService, AuditLog } from "@/services/audit.service";

const actionColors: Record<string, string> = {
  Consultation: "bg-info/10 text-info",
  Modification: "bg-warning/10 text-warning",
  Partage: "bg-accent/10 text-accent",
  Suppression: "bg-destructive/10 text-destructive",
  Téléchargement: "bg-chart-4/10 text-chart-4",
  Création: "bg-success/10 text-success",
  Connexion: "bg-primary/10 text-primary",
};

export default function AuditTab() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const data = await auditService.getLogs({
        action: actionFilter,
        date_from: dateFrom,
        date_to: dateTo,
        limit: "200",
      });
      setLogs(data);
    } catch {
      setLogs([]);
    }
    setLoading(false);
  };

  useEffect(() => { fetchLogs(); }, [actionFilter, dateFrom, dateTo]);

  const filtered = logs.filter((log) =>
    search === "" ||
    log.user_name.toLowerCase().includes(search.toLowerCase()) ||
    log.target?.toLowerCase().includes(search.toLowerCase()) ||
    log.action.toLowerCase().includes(search.toLowerCase())
  );

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Filtrer par utilisateur, document..." className="pl-9 bg-secondary border-0" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={actionFilter} onValueChange={setActionFilter}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Action" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes les actions</SelectItem>
            <SelectItem value="Consultation">Consultation</SelectItem>
            <SelectItem value="Modification">Modification</SelectItem>
            <SelectItem value="Partage">Partage</SelectItem>
            <SelectItem value="Suppression">Suppression</SelectItem>
            <SelectItem value="Création">Création</SelectItem>
            <SelectItem value="Connexion">Connexion</SelectItem>
            <SelectItem value="Téléchargement">Téléchargement</SelectItem>
          </SelectContent>
        </Select>
        <Input type="date" className="w-40 bg-secondary border-0" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} placeholder="Du" />
        <Input type="date" className="w-40 bg-secondary border-0" value={dateTo} onChange={(e) => setDateTo(e.target.value)} placeholder="Au" />
      </div>

      <Card className="shadow-card">
        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">Utilisateur</TableHead>
                <TableHead className="text-xs">Action</TableHead>
                <TableHead className="text-xs hidden md:table-cell">Document</TableHead>
                <TableHead className="text-xs hidden lg:table-cell">Date</TableHead>
                <TableHead className="text-xs hidden lg:table-cell">IP</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="text-sm font-medium">{log.user_name}</TableCell>
                  <TableCell>
                    <Badge className={`text-[10px] ${actionColors[log.action] ?? "bg-muted text-muted-foreground"}`} variant="secondary">{log.action}</Badge>
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-sm text-muted-foreground">{log.target ?? "-"}</TableCell>
                  <TableCell className="hidden lg:table-cell text-xs text-muted-foreground">{formatDate(log.created_at)}</TableCell>
                  <TableCell className="hidden lg:table-cell text-xs text-muted-foreground font-mono">{log.ip_address ?? "-"}</TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-sm text-muted-foreground py-8">
                    Aucun événement trouvé.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  );
}
