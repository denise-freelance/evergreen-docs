import { useState } from "react";
import {
  CheckCircle2,
  XCircle,
  Clock,
  Send,
  MessageSquare,
  User,
  CalendarDays,
  FileText,
  AlertTriangle,
  ChevronRight,
  Eye,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface WorkflowItem {
  id: string;
  document: string;
  type: string;
  submittedBy: string;
  submittedDate: string;
  validator: string;
  deadline: string;
  status: "pending" | "approved" | "rejected";
  comment?: string;
  history: { action: string; by: string; date: string; comment?: string }[];
}

const workflowItems: WorkflowItem[] = [
  {
    id: "WF-001",
    document: "Rapport Q4 2025.pdf",
    type: "pdf",
    submittedBy: "Marie Curie",
    submittedDate: "2026-02-13",
    validator: "Jean Dupont",
    deadline: "2026-02-20",
    status: "pending",
    history: [
      { action: "Soumis", by: "Marie Curie", date: "2026-02-13", comment: "Merci de valider ce rapport avant la réunion de vendredi." },
    ],
  },
  {
    id: "WF-002",
    document: "Budget_previsionnel.xlsx",
    type: "xlsx",
    submittedBy: "Pierre Martin",
    submittedDate: "2026-02-12",
    validator: "Jean Dupont",
    deadline: "2026-02-18",
    status: "pending",
    history: [
      { action: "Soumis", by: "Pierre Martin", date: "2026-02-12" },
    ],
  },
  {
    id: "WF-003",
    document: "Contrat_fournisseur.pdf",
    type: "pdf",
    submittedBy: "Luc Bernard",
    submittedDate: "2026-02-08",
    validator: "Jean Dupont",
    deadline: "2026-02-15",
    status: "approved",
    comment: "Conforme, validé.",
    history: [
      { action: "Soumis", by: "Luc Bernard", date: "2026-02-08" },
      { action: "Approuvé", by: "Jean Dupont", date: "2026-02-10", comment: "Conforme, validé." },
    ],
  },
  {
    id: "WF-004",
    document: "Specs_techniques.docx",
    type: "doc",
    submittedBy: "Sophie Lemoine",
    submittedDate: "2026-02-05",
    validator: "Jean Dupont",
    deadline: "2026-02-12",
    status: "rejected",
    comment: "Section 3.2 à compléter avec les schémas d'architecture.",
    history: [
      { action: "Soumis", by: "Sophie Lemoine", date: "2026-02-05" },
      { action: "Rejeté", by: "Jean Dupont", date: "2026-02-07", comment: "Section 3.2 à compléter avec les schémas d'architecture." },
    ],
  },
  {
    id: "WF-005",
    document: "Plan_formation.pptx",
    type: "doc",
    submittedBy: "Pierre Martin",
    submittedDate: "2026-02-07",
    validator: "Marie Curie",
    deadline: "2026-02-14",
    status: "approved",
    history: [
      { action: "Soumis", by: "Pierre Martin", date: "2026-02-07" },
      { action: "Approuvé", by: "Marie Curie", date: "2026-02-09", comment: "Excellent plan, approuvé." },
    ],
  },
];

const statusConfig: Record<string, { label: string; icon: any; className: string }> = {
  pending: { label: "En attente", icon: Clock, className: "bg-warning/10 text-warning border-warning/20" },
  approved: { label: "Approuvé", icon: CheckCircle2, className: "bg-success/10 text-success border-success/20" },
  rejected: { label: "Rejeté", icon: XCircle, className: "bg-destructive/10 text-destructive border-destructive/20" },
};

function SubmitDialog() {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90 gap-1.5 text-xs">
          <Plus className="h-3.5 w-3.5" /> Soumettre un document
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Soumettre pour validation</DialogTitle>
          <DialogDescription>Sélectionnez un document et un validateur pour démarrer le flux.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Document</label>
            <Select>
              <SelectTrigger className="h-9 text-xs">
                <SelectValue placeholder="Choisir un document..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="rapport" className="text-xs">Rapport Q4 2025.pdf</SelectItem>
                <SelectItem value="budget" className="text-xs">Budget_previsionnel.xlsx</SelectItem>
                <SelectItem value="specs" className="text-xs">Specs_techniques.docx</SelectItem>
                <SelectItem value="facture" className="text-xs">Facture_02_2026.pdf</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Validateur</label>
            <Select>
              <SelectTrigger className="h-9 text-xs">
                <SelectValue placeholder="Choisir un validateur..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="jean" className="text-xs">Jean Dupont</SelectItem>
                <SelectItem value="marie" className="text-xs">Marie Curie</SelectItem>
                <SelectItem value="pierre" className="text-xs">Pierre Martin</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Date limite</label>
            <Input type="date" className="h-9 text-xs" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Message (optionnel)</label>
            <Textarea placeholder="Ajouter un commentaire pour le validateur..." className="text-xs min-h-[80px]" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => setOpen(false)} className="text-xs">Annuler</Button>
          <Button size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90 gap-1.5 text-xs" onClick={() => setOpen(false)}>
            <Send className="h-3.5 w-3.5" /> Soumettre
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ReviewDialog({ item }: { item: WorkflowItem }) {
  const [open, setOpen] = useState(false);
  const [rejectComment, setRejectComment] = useState("");
  const [showRejectForm, setShowRejectForm] = useState(false);

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); setShowRejectForm(false); setRejectComment(""); }}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="text-xs gap-1.5">
          <Eye className="h-3.5 w-3.5" /> Examiner
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Validation : {item.document}</DialogTitle>
          <DialogDescription>Soumis par {item.submittedBy} le {item.submittedDate}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="flex items-center gap-2">
              <User className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-muted-foreground">Soumis par:</span>
              <span className="font-medium">{item.submittedBy}</span>
            </div>
            <div className="flex items-center gap-2">
              <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-muted-foreground">Échéance:</span>
              <span className="font-medium">{item.deadline}</span>
            </div>
          </div>

          <Separator />

          {/* History */}
          <div>
            <p className="text-xs font-semibold mb-3">Historique</p>
            <div className="space-y-3">
              {item.history.map((h, i) => {
                const isApproved = h.action === "Approuvé";
                const isRejected = h.action === "Rejeté";
                return (
                  <div key={i} className="flex gap-3 text-xs">
                    <div className={`mt-0.5 rounded-full p-1 shrink-0 ${isApproved ? "bg-success/10 text-success" : isRejected ? "bg-destructive/10 text-destructive" : "bg-accent/10 text-accent"}`}>
                      {isApproved ? <CheckCircle2 className="h-3 w-3" /> : isRejected ? <XCircle className="h-3 w-3" /> : <Send className="h-3 w-3" />}
                    </div>
                    <div>
                      <p><span className="font-medium">{h.by}</span> — {h.action} le {h.date}</p>
                      {h.comment && <p className="text-muted-foreground mt-0.5 italic">"{h.comment}"</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {item.status === "pending" && !showRejectForm && (
            <>
              <Separator />
              <div className="flex gap-2">
                <Button size="sm" className="flex-1 bg-success text-success-foreground hover:bg-success/90 gap-1.5 text-xs" onClick={() => setOpen(false)}>
                  <CheckCircle2 className="h-3.5 w-3.5" /> Approuver
                </Button>
                <Button size="sm" variant="outline" className="flex-1 text-destructive hover:text-destructive gap-1.5 text-xs border-destructive/20" onClick={() => setShowRejectForm(true)}>
                  <XCircle className="h-3.5 w-3.5" /> Rejeter
                </Button>
              </div>
            </>
          )}

          {showRejectForm && (
            <>
              <Separator />
              <div>
                <div className="flex items-center gap-2 text-xs text-destructive font-medium mb-2">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  Motif de rejet (obligatoire)
                </div>
                <Textarea
                  placeholder="Indiquez la raison du rejet..."
                  className="text-xs min-h-[80px]"
                  value={rejectComment}
                  onChange={(e) => setRejectComment(e.target.value)}
                />
                <div className="flex gap-2 mt-3">
                  <Button size="sm" variant="outline" className="text-xs" onClick={() => setShowRejectForm(false)}>Annuler</Button>
                  <Button size="sm" variant="destructive" className="gap-1.5 text-xs" disabled={!rejectComment.trim()} onClick={() => setOpen(false)}>
                    <XCircle className="h-3.5 w-3.5" /> Confirmer le rejet
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function Workflow() {
  const [tab, setTab] = useState("all");

  const filtered = tab === "all"
    ? workflowItems
    : workflowItems.filter((w) => w.status === tab);

  const pendingCount = workflowItems.filter((w) => w.status === "pending").length;

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] animate-fade-in">
      {/* Header */}
      <div className="px-6 pt-6 pb-4 bg-card border-b border-border">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold text-foreground">Flux de validation</h1>
            <p className="text-xs text-muted-foreground mt-1">Gérez les demandes de validation de documents</p>
          </div>
          <SubmitDialog />
        </div>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="bg-secondary">
            <TabsTrigger value="all" className="text-xs">
              Tous
              <Badge variant="secondary" className="ml-1.5 text-[10px] h-5 px-1.5">{workflowItems.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="pending" className="text-xs">
              En attente
              {pendingCount > 0 && (
                <Badge className="ml-1.5 text-[10px] h-5 px-1.5 bg-warning text-warning-foreground">{pendingCount}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="approved" className="text-xs">Approuvés</TabsTrigger>
            <TabsTrigger value="rejected" className="text-xs">Rejetés</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* List */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-3">
          {filtered.map((item) => {
            const config = statusConfig[item.status];
            const StatusIcon = config.icon;
            const isOverdue = item.status === "pending" && new Date(item.deadline) < new Date();

            return (
              <div
                key={item.id}
                className="flex items-center gap-4 p-4 rounded-xl border border-border bg-card hover:shadow-card-hover transition-all"
              >
                <div className={`rounded-full p-2 shrink-0 ${config.className}`}>
                  <StatusIcon className="h-4 w-4" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-foreground truncate">{item.document}</p>
                    <Badge variant="outline" className={`text-[10px] shrink-0 ${config.className}`}>
                      {config.label}
                    </Badge>
                    {isOverdue && (
                      <Badge variant="outline" className="text-[10px] shrink-0 bg-destructive/10 text-destructive border-destructive/20">
                        <AlertTriangle className="h-2.5 w-2.5 mr-1" /> En retard
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-4 mt-1.5 text-[11px] text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <User className="h-3 w-3" /> {item.submittedBy}
                    </span>
                    <span className="flex items-center gap-1">
                      <ChevronRight className="h-3 w-3" /> {item.validator}
                    </span>
                    <span className="flex items-center gap-1">
                      <CalendarDays className="h-3 w-3" /> Échéance: {item.deadline}
                    </span>
                    {item.comment && (
                      <span className="flex items-center gap-1">
                        <MessageSquare className="h-3 w-3" /> 1 commentaire
                      </span>
                    )}
                  </div>
                </div>

                <ReviewDialog item={item} />
              </div>
            );
          })}

          {filtered.length === 0 && (
            <div className="text-center py-16">
              <CheckCircle2 className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
              <p className="text-sm font-medium text-muted-foreground">Aucune demande dans cette catégorie</p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
