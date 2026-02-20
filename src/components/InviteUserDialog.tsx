import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { UserPlus, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

interface InviteUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export default function InviteUserDialog({ open, onOpenChange, onSuccess }: InviteUserDialogProps) {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("");
  const [groupId, setGroupId] = useState("");
  const [groups, setGroups] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      supabase.from("groups").select("id, name").order("name").then(({ data }) => {
        if (data) setGroups(data);
      });
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !email || !password || !role || !groupId) {
      toast({ title: "Erreur", description: "Tous les champs sont requis.", variant: "destructive" });
      return;
    }
    if (password.length < 6) {
      toast({ title: "Erreur", description: "Le mot de passe doit contenir au moins 6 caractères.", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const response = await supabase.functions.invoke("admin-register-user", {
        body: { email, password, username, role, group_id: groupId },
      });

      if (response.error) throw new Error(response.error.message);
      if (response.data?.error) throw new Error(response.data.error);

      toast({
        title: "Utilisateur créé",
        description: `${username} recevra un email de confirmation à ${email}.`,
      });

      setUsername("");
      setEmail("");
      setPassword("");
      setRole("");
      setGroupId("");
      onOpenChange(false);
      onSuccess?.();
    } catch (error: any) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const roleLabels: Record<string, string> = {
    admin: "Administrateur",
    editor: "Éditeur",
    reader: "Lecteur",
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-accent" /> Inviter un utilisateur
          </DialogTitle>
          <DialogDescription>
            L'utilisateur recevra un email de confirmation. Son compte sera inactif jusqu'à activation manuelle.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Nom d'utilisateur</Label>
            <Input placeholder="Jean Dupont" value={username} onChange={(e) => setUsername(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input type="email" placeholder="jean@acme.fr" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label>Mot de passe</Label>
            <Input type="password" placeholder="Min. 6 caractères" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Rôle</Label>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger><SelectValue placeholder="Choisir..." /></SelectTrigger>
                <SelectContent>
                  {Object.entries(roleLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Groupe</Label>
              <Select value={groupId} onValueChange={setGroupId}>
                <SelectTrigger><SelectValue placeholder="Choisir..." /></SelectTrigger>
                <SelectContent>
                  {groups.map((g) => (
                    <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex gap-2 justify-end pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Annuler</Button>
            <Button type="submit" className="bg-accent text-accent-foreground hover:bg-accent/90" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Créer l'utilisateur
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
