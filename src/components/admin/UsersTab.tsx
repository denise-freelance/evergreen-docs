import { useState, useEffect } from "react";
import { Search, UserPlus, MoreHorizontal, Edit2, Trash2, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { usersService } from "@/services/users.service";
import { groupsService } from "@/services/groups.service";
import { useToast } from "@/hooks/use-toast";
import InviteUserDialog from "@/components/InviteUserDialog";
import EditUserDialog from "@/components/admin/EditUserDialog";

interface UserRow {
  user_id: string;
  username: string;
  email: string;
  is_active: boolean;
  group_name: string;
  group_id?: string;
  role: string;
}

const roleLabels: Record<string, string> = { admin: "Admin", editor: "Éditeur", reader: "Lecteur" };
const roleColors: Record<string, string> = {
  admin: "bg-destructive/10 text-destructive border-destructive/20",
  editor: "bg-accent/10 text-accent border-accent/20",
  reader: "bg-muted text-muted-foreground border-border",
};

export default function UsersTab() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [inviteOpen, setInviteOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editUser, setEditUser] = useState<UserRow | null>(null);
  const { toast } = useToast();

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const [profiles, groups] = await Promise.all([
        usersService.getAll(),
        groupsService.getAll(),
      ]);
      const groupMap = Object.fromEntries(groups.map((g) => [g.id, g.name]));
      setUsers(
        profiles.map((p) => ({
          user_id: p.user_id,
          username: p.username,
          email: p.email,
          is_active: p.is_active,
          group_id: p.group_id ?? undefined,
          group_name: p.group_id ? groupMap[p.group_id] ?? "-" : "-",
          role: p.role ?? "reader",
        }))
      );
    } catch (err: any) {
      toast({ title: "Erreur", description: err.message, variant: "destructive" });
    }
    setLoading(false);
  };

  useEffect(() => { fetchUsers(); }, []);

  const toggleStatus = async (userId: string) => {
    try {
      await usersService.toggleStatus(userId);
      toast({ title: "Statut mis à jour" });
      fetchUsers();
    } catch (err: any) {
      toast({ title: "Erreur", description: err.message, variant: "destructive" });
    }
  };

  const filtered = users.filter((u) =>
    u.username.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Rechercher un utilisateur..." className="pl-9 bg-secondary border-0" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Button className="bg-accent text-accent-foreground hover:bg-accent/90 gap-1.5" onClick={() => setInviteOpen(true)}>
          <UserPlus className="h-4 w-4" /> Inviter
        </Button>
      </div>

      <Card className="shadow-card">
        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">Utilisateur</TableHead>
                <TableHead className="text-xs">Rôle</TableHead>
                <TableHead className="text-xs hidden md:table-cell">Groupe</TableHead>
                <TableHead className="text-xs hidden md:table-cell">Statut</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((user) => {
                const initials = user.username.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
                return (
                  <TableRow key={user.user_id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-primary text-primary-foreground text-[10px] font-semibold">{initials}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium">{user.username}</p>
                          <p className="text-xs text-muted-foreground">{user.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`text-[10px] ${roleColors[user.role] ?? ""}`}>
                        {roleLabels[user.role] ?? user.role}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-sm text-muted-foreground">{user.group_name}</TableCell>
                    <TableCell className="hidden md:table-cell">
                      <div className={`flex items-center gap-1.5 text-xs ${user.is_active ? "text-success" : "text-muted-foreground"}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${user.is_active ? "bg-success" : "bg-muted-foreground"}`} />
                        {user.is_active ? "Actif" : "Inactif"}
                      </div>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => toggleStatus(user.user_id)}>
                            {user.is_active ? <XCircle className="mr-2 h-4 w-4" /> : <CheckCircle className="mr-2 h-4 w-4" />}
                            {user.is_active ? "Désactiver" : "Activer"}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => { setEditUser(user); setEditOpen(true); }}>
                            <Edit2 className="mr-2 h-4 w-4" /> Modifier
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive"><Trash2 className="mr-2 h-4 w-4" /> Supprimer</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-sm text-muted-foreground py-8">
                    Aucun utilisateur trouvé.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </Card>

      <InviteUserDialog open={inviteOpen} onOpenChange={setInviteOpen} onSuccess={fetchUsers} />
      <EditUserDialog open={editOpen} onOpenChange={setEditOpen} user={editUser} onSuccess={fetchUsers} />
    </div>
  );
}
