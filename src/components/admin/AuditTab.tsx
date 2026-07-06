import { useState, useEffect } from "react";
import { Search, Loader2, FileDown } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface AuditLog {
  id: string;
  user_name: string;
  action: string;
  target: string | null;
  ip_address: string | null;
  created_at: string;
}

const actionColors: Record<string, string> = {
  Consultation: "bg-info/10 text-info",
  Modification: "bg-warning/10 text-warning",
  Partage: "bg-accent/10 text-accent",
  Suppression: "bg-destructive/10 text-destructive",
  Téléchargement: "bg-chart-4/10 text-chart-4",
  Création: "bg-success/10 text-success",
  Connexion: "bg-primary/10 text-primary",
};

function actionKey(action: string): string {
  const a = action.toLowerCase();
  if (a.includes("consult")) return "Consultation";
  if (a.includes("modif") || a.includes("édit")) return "Modification";
  if (a.includes("partag")) return "Partage";
  if (a.includes("supprim")) return "Suppression";
  if (a.includes("téléchar") || a.includes("telechar") || a.includes("export")) return "Téléchargement";
  if (a.includes("créé") || a.includes("cree") || a.includes("import") || a.includes("ajout")) return "Création";
  if (a.includes("connect") || a.includes("connex")) return "Connexion";
  if (a.includes("valid") || a.includes("rejet")) return "Modification";
  return action;
}

const monthOptions = () => {
  const opts: { value: string; label: string }[] = [];
  const now = new Date();
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    opts.push({
      value: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
      label: d.toLocaleDateString("fr-FR", { month: "long", year: "numeric" }),
    });
  }
  return opts;
};

export default function AuditTab() {
  const { toast } = useToast();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [exportMonth, setExportMonth] = useState(monthOptions()[0].value);
  const [exporting, setExporting] = useState(false);

  const fetchLogs = async () => {
    setLoading(true);
    let query = supabase.from("audit_logs").select("*").order("created_at", { ascending: false }).limit(500);
    if (actionFilter !== "all") query = query.eq("action", actionFilter);
    if (dateFrom) query = query.gte("created_at", `${dateFrom}T00:00:00`);
    if (dateTo) query = query.lte("created_at", `${dateTo}T23:59:59`);
    const { data, error } = await query;
    if (error) console.error("audit fetch", error);
    setLogs((data || []) as AuditLog[]);
    setLoading(false);
  };

  useEffect(() => { fetchLogs(); }, [actionFilter, dateFrom, dateTo]);

  // Realtime: listen to new audit_logs and prepend them live
  useEffect(() => {
    const channel = supabase
      .channel("audit_logs_stream")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "audit_logs" }, (payload) => {
        const row = payload.new as AuditLog;
        if (actionFilter !== "all" && row.action !== actionFilter) return;
        if (dateFrom && row.created_at < `${dateFrom}T00:00:00`) return;
        if (dateTo && row.created_at > `${dateTo}T23:59:59`) return;
        setLogs((prev) => [row, ...prev].slice(0, 500));
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [actionFilter, dateFrom, dateTo]);

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

  const exportMonthlyPdf = async () => {
    setExporting(true);
    try {
      const [y, m] = exportMonth.split("-").map(Number);
      const start = new Date(y, m - 1, 1).toISOString();
      const end = new Date(y, m, 1).toISOString();
      const { data, error } = await supabase
        .from("audit_logs")
        .select("*")
        .gte("created_at", start)
        .lt("created_at", end)
        .order("created_at", { ascending: true });
      if (error) throw error;
      const rows = (data || []) as AuditLog[];

      const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
      const label = new Date(y, m - 1, 1).toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
      doc.setFontSize(16);
      doc.text("Rapport d'audit mensuel", 40, 40);
      doc.setFontSize(11);
      doc.setTextColor(90);
      doc.text(`DocuFlow · ${label}`, 40, 58);
      doc.text(`Total d'événements : ${rows.length}`, 40, 74);

      // Summary by action
      const counts: Record<string, number> = {};
      rows.forEach((r) => { counts[r.action] = (counts[r.action] || 0) + 1; });
      const summary = Object.entries(counts).sort((a, b) => b[1] - a[1]);
      autoTable(doc, {
        startY: 90,
        head: [["Action", "Occurrences"]],
        body: summary.map(([a, c]) => [a, String(c)]),
        headStyles: { fillColor: [15, 23, 42] },
        styles: { fontSize: 9 },
        margin: { left: 40, right: 40 },
      });

      autoTable(doc, {
        // @ts-expect-error jspdf-autotable adds lastAutoTable at runtime
        startY: (doc as any).lastAutoTable.finalY + 20,
        head: [["Date", "Utilisateur", "Action", "Cible", "IP"]],
        body: rows.map((r) => [
          new Date(r.created_at).toLocaleString("fr-FR"),
          r.user_name,
          r.action,
          r.target || "-",
          r.ip_address || "-",
        ]),
        headStyles: { fillColor: [15, 23, 42] },
        styles: { fontSize: 8, cellPadding: 3 },
        margin: { left: 40, right: 40 },
      });

      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(120);
        doc.text(`Page ${i} / ${pageCount} · Généré le ${new Date().toLocaleString("fr-FR")}`, 40, doc.internal.pageSize.getHeight() - 20);
      }
      doc.save(`audit-${exportMonth}.pdf`);
      toast({ title: "Rapport généré", description: `audit-${exportMonth}.pdf` });
    } catch (e: any) {
      console.error(e);
      toast({ title: "Échec de l'export", description: e?.message ?? "", variant: "destructive" });
    } finally {
      setExporting(false);
    }
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
            <SelectItem value="a consulté">Consultation</SelectItem>
            <SelectItem value="a modifié">Modification</SelectItem>
            <SelectItem value="a importé">Import</SelectItem>
            <SelectItem value="a validé">Validation</SelectItem>
            <SelectItem value="a rejeté">Rejet</SelectItem>
            <SelectItem value="a créé le dossier">Création dossier</SelectItem>
          </SelectContent>
        </Select>
        <Input type="date" className="w-40 bg-secondary border-0" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
        <Input type="date" className="w-40 bg-secondary border-0" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />

        <div className="ml-auto flex items-center gap-2">
          <Select value={exportMonth} onValueChange={setExportMonth}>
            <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
            <SelectContent>
              {monthOptions().map((o) => (
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button size="sm" onClick={exportMonthlyPdf} disabled={exporting} className="gap-1.5">
            {exporting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileDown className="h-3.5 w-3.5" />}
            Rapport PDF
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span className="inline-flex h-2 w-2 rounded-full bg-success animate-pulse" />
        Mise à jour en temps réel · {filtered.length} événement{filtered.length > 1 ? "s" : ""}
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
                <TableHead className="text-xs hidden md:table-cell">Cible</TableHead>
                <TableHead className="text-xs hidden lg:table-cell">Date</TableHead>
                <TableHead className="text-xs hidden lg:table-cell">IP</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((log) => {
                const key = actionKey(log.action);
                return (
                  <TableRow key={log.id}>
                    <TableCell className="text-sm font-medium">{log.user_name}</TableCell>
                    <TableCell>
                      <Badge className={`text-[10px] ${actionColors[key] ?? "bg-muted text-muted-foreground"}`} variant="secondary">{log.action}</Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-sm text-muted-foreground">{log.target ?? "-"}</TableCell>
                    <TableCell className="hidden lg:table-cell text-xs text-muted-foreground">{formatDate(log.created_at)}</TableCell>
                    <TableCell className="hidden lg:table-cell text-xs text-muted-foreground font-mono">{log.ip_address ?? "-"}</TableCell>
                  </TableRow>
                );
              })}
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
