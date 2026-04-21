import { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Copy, X, Calendar, Lock, Globe, Loader2, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface ShareModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  documentId?: string;
  documentName?: string;
}

interface ProfileSuggestion {
  user_id: string;
  username: string;
  email: string;
}

interface ShareRow {
  id: string;
  shared_with_user_id: string;
  shared_with_name: string;
  permission: string;
}

interface PublicLinkRow {
  id: string;
  token: string;
  password_hash: string | null;
  expires_at: string | null;
}

function getInitials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

export default function ShareModal({ open, onOpenChange, documentId, documentName = "" }: ShareModalProps) {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [suggestions, setSuggestions] = useState<ProfileSuggestion[]>([]);
  const [searching, setSearching] = useState(false);
  const [shares, setShares] = useState<ShareRow[]>([]);
  const [permission, setPermission] = useState<string>("read");
  const [publicLinkEnabled, setPublicLinkEnabled] = useState(false);
  const [publicLink, setPublicLink] = useState<PublicLinkRow | null>(null);
  const [linkPassword, setLinkPassword] = useState("");
  const [linkExpiresAt, setLinkExpiresAt] = useState("");
  const [creatingLink, setCreatingLink] = useState(false);

  // Load existing shares + link when opening
  useEffect(() => {
    if (!open || !documentId) return;
    (async () => {
      const [sharesRes, linkRes] = await Promise.all([
        supabase.from("document_shares").select("*").eq("document_id", documentId),
        supabase.from("document_public_links").select("*").eq("document_id", documentId).maybeSingle(),
      ]);
      setShares((sharesRes.data || []) as ShareRow[]);
      if (linkRes.data) {
        setPublicLink(linkRes.data as PublicLinkRow);
        setPublicLinkEnabled(true);
        setLinkExpiresAt(linkRes.data.expires_at ? linkRes.data.expires_at.slice(0, 10) : "");
      } else {
        setPublicLink(null);
        setPublicLinkEnabled(false);
        setLinkExpiresAt("");
        setLinkPassword("");
      }
    })();
  }, [open, documentId]);

  // Live profile search
  useEffect(() => {
    const q = search.trim();
    if (!q) {
      setSuggestions([]);
      return;
    }
    let cancelled = false;
    setSearching(true);
    const t = setTimeout(async () => {
      const { data } = await supabase
        .from("profiles")
        .select("user_id, username, email")
      .or(`username.ilike.%${q}%,email.ilike.%${q}%`)
      .limit(8);
    if (cancelled) return;
    const filtered = (data || []).filter(
      (p) => p.user_id !== user?.user_id && !shares.some((s) => s.shared_with_user_id === p.user_id)
    );
      setSuggestions(filtered as ProfileSuggestion[]);
      setSearching(false);
    }, 200);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [search, shares, user?.id]);

  const shareUrl = useMemo(() => {
    if (!publicLink) return "";
    return `${window.location.origin}/s/${publicLink.token}`;
  }, [publicLink]);

  const addShare = async (profile: ProfileSuggestion) => {
    if (!documentId || !user) return;
    const { data, error } = await supabase
      .from("document_shares")
      .insert({
        document_id: documentId,
        shared_with_user_id: profile.user_id,
        shared_with_name: profile.username,
        permission,
        created_by: user.user_id,
        created_by_name: user.username,
      })
      .select()
      .single();
    if (error) {
      toast.error("Erreur lors du partage");
      return;
    }
    setShares((prev) => [...prev, data as ShareRow]);
    setSearch("");
    setSuggestions([]);
    toast.success(`Partagé avec ${profile.username}`);
  };

  const removeShare = async (id: string) => {
    const { error } = await supabase.from("document_shares").delete().eq("id", id);
    if (error) {
      toast.error("Suppression impossible");
      return;
    }
    setShares((prev) => prev.filter((s) => s.id !== id));
  };

  const updatePermission = async (id: string, perm: string) => {
    await supabase.from("document_shares").update({ permission: perm }).eq("id", id);
    setShares((prev) => prev.map((s) => (s.id === id ? { ...s, permission: perm } : s)));
  };

  const createOrUpdateLink = async () => {
    if (!documentId || !user) return;
    setCreatingLink(true);
    try {
      // simple hash for password (SHA-256 hex). Note: server-side verification recommended for prod.
      let passwordHash: string | null = publicLink?.password_hash ?? null;
      if (linkPassword) {
        const enc = new TextEncoder().encode(linkPassword);
        const buf = await crypto.subtle.digest("SHA-256", enc);
        passwordHash = Array.from(new Uint8Array(buf))
          .map((b) => b.toString(16).padStart(2, "0"))
          .join("");
      }
      const expires = linkExpiresAt ? new Date(linkExpiresAt).toISOString() : null;

      if (publicLink) {
        const { data, error } = await supabase
          .from("document_public_links")
          .update({ password_hash: passwordHash, expires_at: expires })
          .eq("id", publicLink.id)
          .select()
          .single();
        if (error) throw error;
        setPublicLink(data as PublicLinkRow);
        toast.success("Lien public mis à jour");
      } else {
        const { data, error } = await supabase
          .from("document_public_links")
          .insert({
            document_id: documentId,
            password_hash: passwordHash,
            expires_at: expires,
            created_by: user.id,
            created_by_name: user.username,
          })
          .select()
          .single();
        if (error) throw error;
        setPublicLink(data as PublicLinkRow);
        toast.success("Lien public créé");
      }
      setLinkPassword("");
    } catch (e) {
      console.error(e);
      toast.error("Erreur lors de la création du lien");
    } finally {
      setCreatingLink(false);
    }
  };

  const togglePublicLink = async (enabled: boolean) => {
    setPublicLinkEnabled(enabled);
    if (!enabled && publicLink) {
      await supabase.from("document_public_links").delete().eq("id", publicLink.id);
      setPublicLink(null);
      setLinkExpiresAt("");
      setLinkPassword("");
      toast.success("Lien public désactivé");
    }
  };

  const copyLink = async () => {
    if (!shareUrl) return;
    await navigator.clipboard.writeText(shareUrl);
    toast.success("Lien copié");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg">Partager</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            {documentName}
          </DialogDescription>
        </DialogHeader>

        {/* Add people */}
        <div className="space-y-3">
          <div className="space-y-2">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  placeholder="Rechercher un utilisateur..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="flex-1"
                />
                {searching && (
                  <Loader2 className="h-3.5 w-3.5 animate-spin absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
                )}
              </div>
              <Select value={permission} onValueChange={setPermission}>
                <SelectTrigger className="w-[120px] shrink-0">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="read">Lecture</SelectItem>
                  <SelectItem value="comment">Commentaire</SelectItem>
                  <SelectItem value="edit">Édition</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {suggestions.length > 0 && (
              <div className="border rounded-md divide-y bg-popover shadow-sm">
                {suggestions.map((p) => (
                  <button
                    key={p.user_id}
                    onClick={() => addShare(p)}
                    className="w-full flex items-center gap-3 px-3 py-2 hover:bg-secondary/60 text-left transition-colors"
                  >
                    <Avatar className="h-7 w-7">
                      <AvatarFallback className="bg-primary text-primary-foreground text-[10px] font-semibold">
                        {getInitials(p.username)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{p.username}</p>
                      <p className="text-xs text-muted-foreground truncate">{p.email}</p>
                    </div>
                    <Check className="h-4 w-4 text-muted-foreground" />
                  </button>
                ))}
              </div>
            )}
            {search.trim() && !searching && suggestions.length === 0 && (
              <p className="text-xs text-muted-foreground px-1">Aucun utilisateur trouvé</p>
            )}
          </div>

          {/* Shared users */}
          {shares.length > 0 && (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              <p className="text-xs font-medium text-muted-foreground">Personnes ayant accès</p>
              {shares.map((s) => (
                <div
                  key={s.id}
                  className="flex items-center gap-3 py-1.5 px-1 rounded-lg hover:bg-secondary/50 transition-colors"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary text-primary-foreground text-[10px] font-semibold">
                      {getInitials(s.shared_with_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{s.shared_with_name}</p>
                  </div>
                  <Select value={s.permission} onValueChange={(v) => updatePermission(s.id, v)}>
                    <SelectTrigger className="w-[120px] h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="read">Lecture</SelectItem>
                      <SelectItem value="comment">Commentaire</SelectItem>
                      <SelectItem value="edit">Édition</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 shrink-0"
                    onClick={() => removeShare(s.id)}
                  >
                    <X className="h-3.5 w-3.5" />
                    <span className="sr-only">Retirer</span>
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        <Separator />

        {/* Public link section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-muted-foreground" />
              <Label htmlFor="public-link" className="text-sm font-medium">
                Lien public (consultation seule)
              </Label>
            </div>
            <Switch
              id="public-link"
              checked={publicLinkEnabled}
              onCheckedChange={togglePublicLink}
            />
          </div>

          {publicLinkEnabled && (
            <div className="space-y-3 animate-slide-up">
              {publicLink && (
                <div className="flex gap-2">
                  <Input value={shareUrl} readOnly className="text-xs bg-secondary" />
                  <Button variant="outline" size="icon" className="shrink-0" onClick={copyLink}>
                    <Copy className="h-4 w-4" />
                    <span className="sr-only">Copier le lien</span>
                  </Button>
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-3 w-3" /> Expiration
                  </Label>
                  <Input
                    type="date"
                    className="h-8 text-xs"
                    value={linkExpiresAt}
                    onChange={(e) => setLinkExpiresAt(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground flex items-center gap-1">
                    <Lock className="h-3 w-3" />
                    {publicLink?.password_hash ? "Nouveau mot de passe" : "Mot de passe"}
                  </Label>
                  <Input
                    type="password"
                    placeholder={publicLink?.password_hash ? "Laisser vide pour conserver" : "Optionnel"}
                    className="h-8 text-xs"
                    value={linkPassword}
                    onChange={(e) => setLinkPassword(e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {publicLinkEnabled && (
          <DialogFooter>
            <Button
              onClick={createOrUpdateLink}
              disabled={creatingLink}
              className="bg-accent text-accent-foreground hover:bg-accent/90"
            >
              {creatingLink && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {publicLink ? "Mettre à jour le lien" : "Créer le lien"}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
