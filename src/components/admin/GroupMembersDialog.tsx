import { useState, useEffect } from "react";
import { Loader2, UserPlus, Trash2, Users } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { usersService, UserProfile } from "@/services/users.service";
import { useToast } from "@/hooks/use-toast";
import type { Group } from "@/services/groups.service";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  group: Group | null;
}

export default function GroupMembersDialog({ open, onOpenChange, group }: Props) {
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [addUserId, setAddUserId] = useState<string>("");
  const { toast } = useToast();

  const fetchUsers = async () => {
    setLoading(true);
    try {
      setAllUsers(await usersService.getAll());
    } catch (err: any) {
      toast({ title: "Erreur", description: err.message, variant: "destructive" });
    }
    setLoading(false);
  };

  useEffect(() => { if (open) fetchUsers(); }, [open]);

  if (!group) return null;
  const members = allUsers.filter((u) => u.group_id === group.id);
  const nonMembers = allUsers.filter((u) => u.group_id !== group.id);

  const handleAdd = async () => {
    if (!addUserId) return;
    try {
      await usersService.update(addUserId, { group_id: group.id });
      toast({ title: "Utilisateur ajouté au groupe" });
      setAddUserId("");
      fetchUsers();
    } catch (err: any) {
      toast({ title: "Erreur", description: err.message, variant: "destructive" });
    }
  };

  const handleRemove = async (userId: string) => {
    try {
      await usersService.update(userId, { group_id: null as any });
      toast({ title: "Utilisateur retiré du groupe" });
      fetchUsers();
    } catch (err: any) {
      toast({ title: "Erreur", description: err.message, variant: "destructive" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-accent" /> Membres du groupe « {group.name} »
          </DialogTitle>
          <DialogDescription>
            Consultez et modifiez la liste des utilisateurs appartenant à ce groupe.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-end gap-2">
          <div className="flex-1 space-y-1.5">
            <label className="text-xs font-medium">Ajouter un utilisateur</label>
            <Select value={addUserId} onValueChange={setAddUserId}>
              <SelectTrigger><SelectValue placeholder="Sélectionner un utilisateur..." /></SelectTrigger>
              <SelectContent>
                {nonMembers.length === 0 ? (
                  <div className="px-2 py-1.5 text-xs text-muted-foreground">Aucun utilisateur disponible</div>
                ) : nonMembers.map((u) => (
                  <SelectItem key={u.user_id} value={u.user_id}>{u.username} — {u.email}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={handleAdd} disabled={!addUserId} className="bg-accent text-accent-foreground hover:bg-accent/90 gap-1.5">
            <UserPlus className="h-4 w-4" /> Ajouter
          </Button>
        </div>

        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">{members.length} membre(s)</p>
          <ScrollArea className="h-64 rounded-md border border-border">
            {loading ? (
              <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
            ) : members.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">Aucun membre dans ce groupe.</p>
            ) : (
              <div className="divide-y divide-border">
                {members.map((u) => {
                  const initials = u.username.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
                  return (
                    <div key={u.user_id} className="flex items-center gap-3 px-3 py-2.5">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-primary text-primary-foreground text-[10px] font-semibold">{initials}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{u.username}</p>
                        <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                      </div>
                      <Badge variant="outline" className="text-[10px]">{u.role}</Badge>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => handleRemove(u.user_id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}
