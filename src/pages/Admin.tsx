import { useState, useEffect } from "react";
import {
  Users,
  Plus,
  Search,
  MoreHorizontal,
  Shield,
  UserPlus,
  Trash2,
  Edit2,
  Lock,
  Loader2,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import InviteUserDialog from "@/components/InviteUserDialog";

interface Group {
  id: string;
  name: string;
  icon: string;
  description: string | null;
  created_at: string;
}

interface UserRow {
  user_id: string;
  username: string;
  email: string;
  is_active: boolean;
  group_name: string;
  role: string;
}

const roleLabels: Record<string, string> = {
  admin: "Admin",
  editor: "Éditeur",
  reader: "Lecteur",
};

const roleColors: Record<string, string> = {
  admin: "bg-destructive/10 text-destructive border-destructive/20",
  editor: "bg-accent/10 text-accent border-accent/20",
  reader: "bg-muted text-muted-foreground border-border",
};

const permColors: Record<string, string> = {
  CRUD: "bg-accent text-accent-foreground",
  CRU: "bg-info text-info-foreground",
  CR: "bg-warning text-warning-foreground",
  RU: "bg-chart-4 text-chart-4-foreground",
  R: "bg-muted text-foreground",
  "-": "bg-secondary text-muted-foreground",
};

const auditLogs = [
  { user: "Marie Curie", action: "Consultation", target: "Rapport Q4 2025.pdf", date: "13 Fév 2026, 14:32", ip: "192.168.1.12" },
  { user: "Pierre Martin", action: "Modification", target: "Budget_previsionnel.xlsx", date: "13 Fév 2026, 14:15", ip: "192.168.1.45" },
  { user: "Sophie Lemoine", action: "Partage", target: "Plan_chantier.pdf", date: "13 Fév 2026, 13:50", ip: "192.168.1.78" },
  { user: "Jean Dupont", action: "Suppression", target: "Brouillon_ancien.docx", date: "13 Fév 2026, 12:30", ip: "192.168.1.12" },
];

const actionColors: Record<string, string> = {
  Consultation: "bg-info/10 text-info",
  Modification: "bg-warning/10 text-warning",
  Partage: "bg-accent/10 text-accent",
  Suppression: "bg-destructive/10 text-destructive",
  Téléchargement: "bg-chart-4/10 text-chart-4",
  Création: "bg-success/10 text-success",
};

export default function Admin() {
  const [addGroupOpen, setAddGroupOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [groups, setGroups] = useState<Group[]>([]);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loadingGroups, setLoadingGroups] = useState(true);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupDesc, setNewGroupDesc] = useState("");
  const { toast } = useToast();

  const fetchGroups = async () => {
    setLoadingGroups(true);
    const { data } = await supabase.from("groups").select("*").order("name");
    if (data) setGroups(data);
    setLoadingGroups(false);
  };

  const fetchUsers = async () => {
    setLoadingUsers(true);
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, username, email, is_active, group_id");

    if (profiles) {
      const { data: roles } = await supabase.from("user_roles").select("user_id, role");
      const { data: grps } = await supabase.from("groups").select("id, name");

      const groupMap = Object.fromEntries((grps ?? []).map((g) => [g.id, g.name]));
      const roleMap = Object.fromEntries((roles ?? []).map((r) => [r.user_id, r.role]));

      setUsers(
        profiles.map((p) => ({
          user_id: p.user_id,
          username: p.username,
          email: p.email,
          is_active: p.is_active,
          group_name: p.group_id ? groupMap[p.group_id] ?? "-" : "-",
          role: roleMap[p.user_id] ?? "reader",
        }))
      );
    }
    setLoadingUsers(false);
  };

  useEffect(() => {
    fetchGroups();
    fetchUsers();
  }, []);

  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) return;
    const { error } = await supabase.from("groups").insert({ name: newGroupName.trim(), description: newGroupDesc.trim() || null });
    if (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Groupe créé", description: `Le groupe "${newGroupName}" a été ajouté.` });
      setNewGroupName("");
      setNewGroupDesc("");
      setAddGroupOpen(false);
      fetchGroups();
    }
  };

  const toggleUserStatus = async (userId: string, currentStatus: boolean) => {
    const { error } = await supabase.from("profiles").update({ is_active: !currentStatus }).eq("user_id", userId);
    if (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Statut mis à jour" });
      fetchUsers();
    }
  };

  return (
    <div className="p-4 lg:p-6 space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Administration</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Gestion des utilisateurs, groupes et permissions</p>
      </div>

      <Tabs defaultValue="groups" className="space-y-4">
        <TabsList className="bg-secondary">
          <TabsTrigger value="groups" className="gap-1.5 text-xs"><Users className="h-3.5 w-3.5" /> Groupes</TabsTrigger>
          <TabsTrigger value="users" className="gap-1.5 text-xs"><UserPlus className="h-3.5 w-3.5" /> Utilisateurs</TabsTrigger>
          <TabsTrigger value="permissions" className="gap-1.5 text-xs"><Shield className="h-3.5 w-3.5" /> Permissions</TabsTrigger>
          <TabsTrigger value="audit" className="gap-1.5 text-xs"><Lock className="h-3.5 w-3.5" /> Audit</TabsTrigger>
        </TabsList>

        {/* Groups tab */}
        <TabsContent value="groups" className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Rechercher un groupe..." className="pl-9 bg-secondary border-0" />
            </div>
            <Button className="bg-accent text-accent-foreground hover:bg-accent/90 gap-1.5" onClick={() => setAddGroupOpen(true)}>
              <Plus className="h-4 w-4" /> Nouveau groupe
            </Button>
          </div>

          {loadingGroups ? (
            <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {groups.map((group) => (
                <Card key={group.id} className="shadow-card hover:shadow-card-hover transition-shadow cursor-pointer">
                  <CardContent className="pt-5 pb-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg flex items-center justify-center text-lg bg-accent/10">
                          {group.icon}
                        </div>
                        <div>
                          <p className="font-semibold text-sm">{group.name}</p>
                          <p className="text-xs text-muted-foreground">{group.description ?? "Aucune description"}</p>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem><Edit2 className="mr-2 h-4 w-4" /> Modifier</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive"><Trash2 className="mr-2 h-4 w-4" /> Supprimer</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Users tab */}
        <TabsContent value="users" className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Rechercher un utilisateur..." className="pl-9 bg-secondary border-0" />
            </div>
            <Button className="bg-accent text-accent-foreground hover:bg-accent/90 gap-1.5" onClick={() => setInviteOpen(true)}>
              <UserPlus className="h-4 w-4" /> Inviter
            </Button>
          </div>

          <Card className="shadow-card">
            {loadingUsers ? (
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
                  {users.map((user) => {
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
                              <DropdownMenuItem onClick={() => toggleUserStatus(user.user_id, user.is_active)}>
                                {user.is_active ? <XCircle className="mr-2 h-4 w-4" /> : <CheckCircle className="mr-2 h-4 w-4" />}
                                {user.is_active ? "Désactiver" : "Activer"}
                              </DropdownMenuItem>
                              <DropdownMenuItem><Edit2 className="mr-2 h-4 w-4" /> Modifier</DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-destructive"><Trash2 className="mr-2 h-4 w-4" /> Supprimer</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {users.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-sm text-muted-foreground py-8">
                        Aucun utilisateur enregistré. Cliquez sur "Inviter" pour en ajouter.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </Card>
        </TabsContent>

        {/* Permissions tab */}
        <TabsContent value="permissions" className="space-y-4">
          <Card className="shadow-card overflow-x-auto">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Shield className="h-4 w-4 text-accent" /> Matrice de permissions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Chaque utilisateur dispose de toutes les permissions (CRUD) dans son groupe d'appartenance.
                Des permissions supplémentaires peuvent être attribuées dans les autres groupes : R (lecture seule), RU (lire/modifier), CR (créer/lire), CRU (créer/lire/modifier).
              </p>
              <div className="flex flex-wrap gap-3 mt-4 pt-3 border-t border-border">
                {Object.entries(permColors).filter(([k]) => k !== "-").map(([key, cls]) => (
                  <div key={key} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Badge className={`text-[9px] font-mono ${cls}`}>{key}</Badge>
                    <span>
                      {key === "CRUD" ? "Complet" : key === "CRU" ? "Sans suppression" : key === "CR" ? "Créer/Lire" : key === "RU" ? "Lire/Modifier" : "Lecture seule"}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Audit tab */}
        <TabsContent value="audit" className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Filtrer les événements..." className="pl-9 bg-secondary border-0" />
            </div>
            <Select defaultValue="all">
              <SelectTrigger className="w-40"><SelectValue placeholder="Action" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les actions</SelectItem>
                <SelectItem value="consultation">Consultation</SelectItem>
                <SelectItem value="modification">Modification</SelectItem>
                <SelectItem value="partage">Partage</SelectItem>
                <SelectItem value="suppression">Suppression</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Card className="shadow-card">
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
                {auditLogs.map((log, i) => (
                  <TableRow key={i}>
                    <TableCell className="text-sm font-medium">{log.user}</TableCell>
                    <TableCell>
                      <Badge className={`text-[10px] ${actionColors[log.action]}`} variant="secondary">{log.action}</Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-sm text-muted-foreground">{log.target}</TableCell>
                    <TableCell className="hidden lg:table-cell text-xs text-muted-foreground">{log.date}</TableCell>
                    <TableCell className="hidden lg:table-cell text-xs text-muted-foreground font-mono">{log.ip}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add Group Dialog */}
      <Dialog open={addGroupOpen} onOpenChange={setAddGroupOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Nouveau groupe</DialogTitle>
            <DialogDescription>Créez un groupe pour organiser les permissions de vos utilisateurs.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nom du groupe</Label>
              <Input placeholder="ex: Marketing, Juridique..." value={newGroupName} onChange={(e) => setNewGroupName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Input placeholder="Description optionnelle..." value={newGroupDesc} onChange={(e) => setNewGroupDesc(e.target.value)} />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setAddGroupOpen(false)}>Annuler</Button>
              <Button className="bg-accent text-accent-foreground hover:bg-accent/90" onClick={handleCreateGroup}>Créer le groupe</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Invite User Dialog */}
      <InviteUserDialog open={inviteOpen} onOpenChange={setInviteOpen} onSuccess={fetchUsers} />
    </div>
  );
}
