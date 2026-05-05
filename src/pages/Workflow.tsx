import { useState, useEffect, useMemo } from "react";
import {
  CheckCircle2,
  XCircle,
  Clock,
  Send,
  MessageSquare,
  User,
  CalendarDays,
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useDocumentStore } from "@/stores/useDocumentStore";
import { supabase } from "@/integrations/supabase/client";

interface ValidationRequest {
  id: string;
  document_id: string;
  document_name: string;
  submitted_by: string;
  submitted_by_name: string;
  validator_id: string;
  validator_name: string;
  deadline: string | null;
  message: string | null;
  status: "pending" | "approved" | "rejected";
  decision_reason: string | null;
  decided_at: string | null;
  created_at: string;
}

interface ProfileLite {
  user_id: string;
  username: string;
}

const statusConfig: Record<string, { label: string; icon: any; className: string }> = {
  pending: { label: "En attente", icon: Clock, className: "bg-warning/10 text-warning border-warning/20" },
  approved: { label: "Approuvé", icon: CheckCircle2, className: "bg-success/10 text-success border-success/20" },
  rejected: { label: "Rejeté", icon: XCircle, className: "bg-destructive/10 text-destructive border-destructive/20" },
};

function formatDate(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
}

function SubmitDialog({ onSubmitted }: { onSubmitted: () => void }) {
  const [open, setOpen] = useState(false);
  const [docIds, setDocIds] = useState<string[]>([]);
  const [validatorId, setValidatorId] = useState("");
  const [deadline, setDeadline] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [validators, setValidators] = useState<ProfileLite[]>([]);
  const { toast } = useToast();
  const { user, profile } = useAuth();
  const { documents } = useDocumentStore();

  useEffect(() => {
    if (!open) return;
    supabase
      .from("profiles")
      .select("user_id, username")
      .eq("is_active", true)
      .then(({ data }) => {
        setValidators((data || []).filter((p) => p.user_id !== user?.user_id) as ProfileLite[]);
      });
  }, [open, user?.user_id]);

  // Documents the user can submit: own documents in draft / rejected state
  const submittableDocs = useMemo(() => {
    if (!user?.user_id) return [];
    return documents.filter(
      (d) => d.authorId === user.user_id && (d.status === "draft" || d.status === "rejected")
    );
  }, [documents, user?.user_id]);

  const reset = () => {
    setDocIds([]);
    setValidatorId("");
    setDeadline("");
    setMessage("");
  };

  const toggleDoc = (id: string) => {
    setDocIds((prev) => (prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id]));
  };

  const handleSubmit = async () => {
    if (!user?.user_id || !profile || docIds.length === 0 || !validatorId) {
      toast({ title: "Champs requis", description: "Sélectionnez au moins un document et un validateur.", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    const validator = validators.find((v) => v.user_id === validatorId);
    if (!validator) {
      setSubmitting(false);
      return;
    }

    const rows = docIds
      .map((id) => documents.find((d) => d.id === id))
      .filter(Boolean)
      .map((d) => ({
        document_id: d!.id,
        document_name: d!.name,
        submitted_by: user.user_id,
        submitted_by_name: profile.username,
        validator_id: validator.user_id,
        validator_name: validator.username,
        deadline: deadline || null,
        message: message.trim() || null,
        status: "pending",
      }));

    const { error } = await supabase.from("validation_requests").insert(rows);
    if (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
      setSubmitting(false);
      return;
    }

    // Create notifications for the validator
    const notifs = rows.map((r) => ({
      user_id: validator.user_id,
      type: "validation_request",
      title: "Nouvelle demande de validation",
      message: `${profile.username} vous a soumis « ${r.document_name} » pour validation.`,
      link: "/workflow",
    }));
    await supabase.from("notifications").insert(notifs);

    toast({ title: "Demande envoyée", description: `${rows.length} document(s) soumis à ${validator.username}.` });
    setSubmitting(false);
    reset();
    setOpen(false);
    onSubmitted();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) reset(); }}>
      <DialogTrigger asChild>
        <Button size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90 gap-1.5 text-xs">
          <Plus className="h-3.5 w-3.5" /> Soumettre un document
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Soumettre pour validation</DialogTitle>
          <DialogDescription>Sélectionnez un ou plusieurs documents et un validateur.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
              Documents ({docIds.length} sélectionné{docIds.length > 1 ? "s" : ""})
            </label>
            <div className="border border-border rounded-md max-h-40 overflow-y-auto">
              {submittableDocs.length === 0 ? (
                <p className="text-xs text-muted-foreground p-3 text-center">
                  Aucun document disponible. Importez-en un d'abord.
                </p>
              ) : (
                submittableDocs.map((d) => (
                  <label
                    key={d.id}
                    className="flex items-center gap-2 px-3 py-2 text-xs hover:bg-secondary/50 cursor-pointer border-b border-border last:border-0"
                  >
                    <input
                      type="checkbox"
                      checked={docIds.includes(d.id)}
                      onChange={() => toggleDoc(d.id)}
                      className="h-3.5 w-3.5 accent-accent"
                    />
                    <span className="flex-1 truncate">{d.name}</span>
                    <span className="text-muted-foreground text-[10px]">{d.folder}</span>
                  </label>
                ))
              )}
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Validateur</label>
            <Select value={validatorId} onValueChange={setValidatorId}>
              <SelectTrigger className="h-9 text-xs">
                <SelectValue placeholder="Choisir un validateur..." />
              </SelectTrigger>
              <SelectContent>
                {validators.map((v) => (
                  <SelectItem key={v.user_id} value={v.user_id} className="text-xs">
                    {v.username}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Date limite</label>
            <Input type="date" className="h-9 text-xs" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Message (optionnel)</label>
            <Textarea
              placeholder="Ajouter un commentaire pour le validateur..."
              className="text-xs min-h-[80px]"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => setOpen(false)} className="text-xs" disabled={submitting}>
            Annuler
          </Button>
          <Button
            size="sm"
            className="bg-accent text-accent-foreground hover:bg-accent/90 gap-1.5 text-xs"
            onClick={handleSubmit}
            disabled={submitting || docIds.length === 0 || !validatorId}
          >
            <Send className="h-3.5 w-3.5" /> Soumettre
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ReviewDialog({ item, onDecided, canDecide }: { item: ValidationRequest; onDecided: () => void; canDecide: boolean }) {
  const [open, setOpen] = useState(false);
  const [rejectComment, setRejectComment] = useState("");
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [busy, setBusy] = useState(false);
  const { toast } = useToast();
  const { profile, user } = useAuth();

  const decide = async (approved: boolean, reason?: string) => {
    setBusy(true);
    const { error } = await supabase
      .from("validation_requests")
      .update({
        status: approved ? "approved" : "rejected",
        decision_reason: approved ? null : (reason || null),
        decided_at: new Date().toISOString(),
      })
      .eq("id", item.id);

    if (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
      setBusy(false);
      return;
    }

    // Notify the submitter
    await supabase.from("notifications").insert({
      user_id: item.submitted_by,
      type: approved ? "validation_approved" : "validation_rejected",
      title: approved ? "Document approuvé" : "Document rejeté",
      message: `${profile?.username || "Le validateur"} a ${approved ? "approuvé" : "rejeté"} « ${item.document_name} »${reason ? ` — ${reason}` : ""}.`,
      link: "/workflow",
    });

    toast({ title: approved ? "Document approuvé" : "Document rejeté" });
    setBusy(false);
    setOpen(false);
    setShowRejectForm(false);
    setRejectComment("");
    onDecided();
  };

  const config = statusConfig[item.status];

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); setShowRejectForm(false); setRejectComment(""); }}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="text-xs gap-1.5">
          <Eye className="h-3.5 w-3.5" /> Examiner
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Validation : {item.document_name}</DialogTitle>
          <DialogDescription>Soumis par {item.submitted_by_name} le {formatDate(item.created_at)}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="flex items-center gap-2">
              <User className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-muted-foreground">Validateur:</span>
              <span className="font-medium">{item.validator_name}</span>
            </div>
            <div className="flex items-center gap-2">
              <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-muted-foreground">Échéance:</span>
              <span className="font-medium">{formatDate(item.deadline)}</span>
            </div>
          </div>

          <Separator />

          <div>
            <p className="text-xs font-semibold mb-2">Statut</p>
            <Badge variant="outline" className={`text-[10px] ${config.className}`}>{config.label}</Badge>
          </div>

          {item.message && (
            <div>
              <p className="text-xs font-semibold mb-1.5">Message du soumetteur</p>
              <p className="text-xs text-muted-foreground italic bg-secondary/50 rounded-md p-2">"{item.message}"</p>
            </div>
          )}

          {item.decision_reason && (
            <div>
              <p className="text-xs font-semibold mb-1.5">Motif de la décision</p>
              <p className="text-xs text-muted-foreground italic bg-secondary/50 rounded-md p-2">"{item.decision_reason}"</p>
            </div>
          )}

          {item.status === "pending" && canDecide && !showRejectForm && (
            <>
              <Separator />
              <div className="flex gap-2">
                <Button size="sm" className="flex-1 bg-success text-success-foreground hover:bg-success/90 gap-1.5 text-xs" disabled={busy} onClick={() => decide(true)}>
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
                  <Button size="sm" variant="destructive" className="gap-1.5 text-xs" disabled={!rejectComment.trim() || busy} onClick={() => decide(false, rejectComment.trim())}>
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
  const [tab, setTab] = useState("incoming");
  const [items, setItems] = useState<ValidationRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const { user, isAdmin } = useAuth();
  const { loadAll } = useDocumentStore();

  const load = async () => {
    if (!user?.user_id) return;
    setLoading(true);
    const { data } = await supabase
      .from("validation_requests")
      .select("*")
      .order("created_at", { ascending: false });
    setItems((data || []) as ValidationRequest[]);
    setLoading(false);
    // Refresh document statuses too
    loadAll();
  };

  useEffect(() => {
    load();

    if (!user?.user_id) return;
    const channel = supabase
      .channel("validation-requests-feed")
      .on("postgres_changes", { event: "*", schema: "public", table: "validation_requests" }, () => load())
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.user_id]);

  // Items the user can see (validator, submitter, or admin sees all)
  const visibleItems = useMemo(
    () =>
      isAdmin
        ? items
        : items.filter((i) => i.validator_id === user?.user_id || i.submitted_by === user?.user_id),
    [items, isAdmin, user?.user_id]
  );

  const incoming = items.filter((i) => i.validator_id === user?.user_id);
  const outgoing = items.filter((i) => i.submitted_by === user?.user_id);

  const filtered = useMemo(() => {
    switch (tab) {
      case "all":
        return visibleItems;
      case "pending":
        return visibleItems.filter((i) => i.status === "pending");
      case "approved":
        return visibleItems.filter((i) => i.status === "approved");
      case "rejected":
        return visibleItems.filter((i) => i.status === "rejected");
      case "incoming":
        return incoming;
      case "outgoing":
        return outgoing;
      default:
        return visibleItems;
    }
  }, [tab, visibleItems, incoming, outgoing]);

  const incomingPending = incoming.filter((i) => i.status === "pending").length;

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] animate-fade-in">
      <div className="px-6 pt-6 pb-4 bg-card border-b border-border">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold text-foreground">Flux de validation</h1>
            <p className="text-xs text-muted-foreground mt-1">Gérez les demandes de validation de documents</p>
          </div>
          <SubmitDialog onSubmitted={load} />
        </div>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="bg-secondary flex-wrap h-auto">
            <TabsTrigger value="all" className="text-xs">
              Tous
              <Badge variant="secondary" className="ml-1.5 text-[10px] h-5 px-1.5">{visibleItems.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="pending" className="text-xs">
              En attente
              <Badge variant="secondary" className="ml-1.5 text-[10px] h-5 px-1.5">
                {visibleItems.filter((i) => i.status === "pending").length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="approved" className="text-xs">
              Approuvé
              <Badge variant="secondary" className="ml-1.5 text-[10px] h-5 px-1.5">
                {visibleItems.filter((i) => i.status === "approved").length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="rejected" className="text-xs">
              Rejeté
              <Badge variant="secondary" className="ml-1.5 text-[10px] h-5 px-1.5">
                {visibleItems.filter((i) => i.status === "rejected").length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="incoming" className="text-xs">
              À examiner
              {incomingPending > 0 && (
                <Badge className="ml-1.5 text-[10px] h-5 px-1.5 bg-warning text-warning-foreground">{incomingPending}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="outgoing" className="text-xs">
              Mes demandes
              <Badge variant="secondary" className="ml-1.5 text-[10px] h-5 px-1.5">{outgoing.length}</Badge>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-3">
          {loading && filtered.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">Chargement…</p>
          )}
          {filtered.map((item) => {
            const config = statusConfig[item.status];
            const StatusIcon = config.icon;
            const isOverdue = item.status === "pending" && item.deadline && new Date(item.deadline) < new Date();
            const canDecide = item.validator_id === user?.user_id || isAdmin;

            return (
              <div
                key={item.id}
                className="flex items-center gap-4 p-4 rounded-xl border border-border bg-card hover:shadow-card-hover transition-all"
              >
                <div className={`rounded-full p-2 shrink-0 ${config.className}`}>
                  <StatusIcon className="h-4 w-4" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold text-foreground truncate">{item.document_name}</p>
                    <Badge variant="outline" className={`text-[10px] shrink-0 ${config.className}`}>
                      {config.label}
                    </Badge>
                    {isOverdue && (
                      <Badge variant="outline" className="text-[10px] shrink-0 bg-destructive/10 text-destructive border-destructive/20">
                        <AlertTriangle className="h-2.5 w-2.5 mr-1" /> En retard
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-4 mt-1.5 text-[11px] text-muted-foreground flex-wrap">
                    <span className="flex items-center gap-1">
                      <User className="h-3 w-3" /> {item.submitted_by_name}
                    </span>
                    <span className="flex items-center gap-1">
                      <ChevronRight className="h-3 w-3" /> {item.validator_name}
                    </span>
                    {item.deadline && (
                      <span className="flex items-center gap-1">
                        <CalendarDays className="h-3 w-3" /> Échéance: {formatDate(item.deadline)}
                      </span>
                    )}
                    {item.message && (
                      <span className="flex items-center gap-1">
                        <MessageSquare className="h-3 w-3" /> message
                      </span>
                    )}
                  </div>
                </div>

                <ReviewDialog item={item} onDecided={load} canDecide={canDecide} />
              </div>
            );
          })}

          {!loading && filtered.length === 0 && (
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
