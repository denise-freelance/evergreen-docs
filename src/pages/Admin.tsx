import { useState } from "react";
import {
  Users,
  Plus,
  Search,
  MoreHorizontal,
  Shield,
  UserPlus,
  Settings,
  Trash2,
  Edit2,
  ChevronRight,
  Check,
  X,
  Building2,
  Lock,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const groups = [
  { name: "Comptabilité", members: 8, icon: "💼", color: "bg-chart-2/10 text-chart-2" },
  { name: "Ressources Humaines", members: 5, icon: "👥", color: "bg-chart-4/10 text-chart-4" },
  { name: "Direction", members: 3, icon: "🏢", color: "bg-accent/10 text-accent" },
  { name: "Bureau d'études", members: 12, icon: "📐", color: "bg-chart-3/10 text-chart-3" },
  { name: "Commercial", members: 7, icon: "📊", color: "bg-chart-5/10 text-chart-5" },
];

const users = [
  { name: "Marie Curie", email: "m.curie@acme.fr", initials: "MC", role: "Admin", group: "Direction", status: "active" },
  { name: "Pierre Martin", email: "p.martin@acme.fr", initials: "PM", role: "Éditeur", group: "Comptabilité", status: "active" },
  { name: "Sophie Lemoine", email: "s.lemoine@acme.fr", initials: "SL", role: "Éditeur", group: "Bureau d'études", status: "active" },
  { name: "Jean Dupont", email: "j.dupont@acme.fr", initials: "JD", role: "Admin", group: "Direction", status: "active" },
  { name: "Luc Bernard", email: "l.bernard@acme.fr", initials: "LB", role: "Lecteur", group: "Commercial", status: "inactive" },
  { name: "Claire Fontaine", email: "c.fontaine@acme.fr", initials: "CF", role: "Éditeur", group: "Ressources Humaines", status: "active" },
];

const permissions = [
  { folder: "Projets", groups: { Comptabilité: "R", "Ressources Humaines": "-", Direction: "CRUD", "Bureau d'études": "CRU", Commercial: "R" } },
  { folder: "Comptabilité", groups: { Comptabilité: "CRUD", "Ressources Humaines": "-", Direction: "CRUD", "Bureau d'études": "-", Commercial: "R" } },
  { folder: "Ressources Humaines", groups: { Comptabilité: "-", "Ressources Humaines": "CRUD", Direction: "CRUD", "Bureau d'études": "-", Commercial: "-" } },
  { folder: "Modèles", groups: { Comptabilité: "CR", "Ressources Humaines": "CR", Direction: "CRUD", "Bureau d'études": "CR", Commercial: "CR" } },
];

const auditLogs = [
  { user: "Marie Curie", action: "Consultation", target: "Rapport Q4 2025.pdf", date: "13 Fév 2026, 14:32", ip: "192.168.1.12" },
  { user: "Pierre Martin", action: "Modification", target: "Budget_previsionnel.xlsx", date: "13 Fév 2026, 14:15", ip: "192.168.1.45" },
  { user: "Sophie Lemoine", action: "Partage", target: "Plan_chantier.pdf", date: "13 Fév 2026, 13:50", ip: "192.168.1.78" },
  { user: "Jean Dupont", action: "Suppression", target: "Brouillon_ancien.docx", date: "13 Fév 2026, 12:30", ip: "192.168.1.12" },
  { user: "Luc Bernard", action: "Téléchargement", target: "Specs_techniques.docx", date: "13 Fév 2026, 11:45", ip: "10.0.0.34" },
  { user: "Claire Fontaine", action: "Création", target: "Contrat_CDI_template.docx", date: "13 Fév 2026, 10:20", ip: "192.168.1.90" },
];

const actionColors: Record<string, string> = {
  Consultation: "bg-info/10 text-info",
  Modification: "bg-warning/10 text-warning",
  Partage: "bg-accent/10 text-accent",
  Suppression: "bg-destructive/10 text-destructive",
  Téléchargement: "bg-chart-4/10 text-chart-4",
  Création: "bg-success/10 text-success",
};

const roleColors: Record<string, string> = {
  Admin: "bg-destructive/10 text-destructive border-destructive/20",
  "Éditeur": "bg-accent/10 text-accent border-accent/20",
  Lecteur: "bg-muted text-muted-foreground border-border",
};

const permColors: Record<string, string> = {
  CRUD: "bg-accent text-accent-foreground",
  CRU: "bg-info text-info-foreground",
  CR: "bg-warning text-warning-foreground",
  R: "bg-muted text-foreground",
  "-": "bg-secondary text-muted-foreground",
};

export default function Admin() {
  const [addGroupOpen, setAddGroupOpen] = useState(false);

  return (
    <div className="p-4 lg:p-6 space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Administration</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Gestion des utilisateurs, groupes et permissions</p>
      </div>

      <Tabs defaultValue="groups" className="space-y-4">
        <TabsList className="bg-secondary">
          <TabsTrigger value="groups" className="gap-1.5 text-xs">
            <Users className="h-3.5 w-3.5" /> Groupes
          </TabsTrigger>
          <TabsTrigger value="users" className="gap-1.5 text-xs">
            <UserPlus className="h-3.5 w-3.5" /> Utilisateurs
          </TabsTrigger>
          <TabsTrigger value="permissions" className="gap-1.5 text-xs">
            <Shield className="h-3.5 w-3.5" /> Permissions
          </TabsTrigger>
          <TabsTrigger value="audit" className="gap-1.5 text-xs">
            <Lock className="h-3.5 w-3.5" /> Audit
          </TabsTrigger>
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

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {groups.map((group) => (
              <Card key={group.name} className="shadow-card hover:shadow-card-hover transition-shadow cursor-pointer">
                <CardContent className="pt-5 pb-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`h-10 w-10 rounded-lg flex items-center justify-center text-lg ${group.color}`}>
                        {group.icon}
                      </div>
                      <div>
                        <p className="font-semibold text-sm">{group.name}</p>
                        <p className="text-xs text-muted-foreground">{group.members} membres</p>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem><Edit2 className="mr-2 h-4 w-4" /> Modifier</DropdownMenuItem>
                        <DropdownMenuItem><UserPlus className="mr-2 h-4 w-4" /> Ajouter un membre</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive"><Trash2 className="mr-2 h-4 w-4" /> Supprimer</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <div className="flex -space-x-2 mt-4">
                    {Array.from({ length: Math.min(group.members, 5) }).map((_, i) => (
                      <Avatar key={i} className="h-7 w-7 border-2 border-card">
                        <AvatarFallback className="bg-primary text-primary-foreground text-[9px]">
                          {String.fromCharCode(65 + i)}{String.fromCharCode(66 + i)}
                        </AvatarFallback>
                      </Avatar>
                    ))}
                    {group.members > 5 && (
                      <div className="h-7 w-7 rounded-full bg-secondary flex items-center justify-center text-[10px] font-medium border-2 border-card">
                        +{group.members - 5}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Users tab */}
        <TabsContent value="users" className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Rechercher un utilisateur..." className="pl-9 bg-secondary border-0" />
            </div>
            <Button className="bg-accent text-accent-foreground hover:bg-accent/90 gap-1.5">
              <UserPlus className="h-4 w-4" /> Inviter
            </Button>
          </div>

          <Card className="shadow-card">
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
                {users.map((user) => (
                  <TableRow key={user.email}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-primary text-primary-foreground text-[10px] font-semibold">
                            {user.initials}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium">{user.name}</p>
                          <p className="text-xs text-muted-foreground">{user.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`text-[10px] ${roleColors[user.role]}`}>
                        {user.role}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-sm text-muted-foreground">{user.group}</TableCell>
                    <TableCell className="hidden md:table-cell">
                      <div className={`flex items-center gap-1.5 text-xs ${user.status === "active" ? "text-success" : "text-muted-foreground"}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${user.status === "active" ? "bg-success" : "bg-muted-foreground"}`} />
                        {user.status === "active" ? "Actif" : "Inactif"}
                      </div>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem><Edit2 className="mr-2 h-4 w-4" /> Modifier</DropdownMenuItem>
                          <DropdownMenuItem><Shield className="mr-2 h-4 w-4" /> Changer le rôle</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive"><Trash2 className="mr-2 h-4 w-4" /> Désactiver</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
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
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs font-semibold">Dossier</TableHead>
                    {groups.map((g) => (
                      <TableHead key={g.name} className="text-xs text-center font-semibold">{g.name}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {permissions.map((perm) => (
                    <TableRow key={perm.folder}>
                      <TableCell className="font-medium text-sm">{perm.folder}</TableCell>
                      {groups.map((g) => {
                        const val = perm.groups[g.name as keyof typeof perm.groups] || "-";
                        return (
                          <TableCell key={g.name} className="text-center">
                            <Badge className={`text-[10px] font-mono ${permColors[val]}`}>
                              {val}
                            </Badge>
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="flex flex-wrap gap-3 mt-4 pt-3 border-t border-border">
                {Object.entries(permColors).filter(([k]) => k !== "-").map(([key, cls]) => (
                  <div key={key} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Badge className={`text-[9px] font-mono ${cls}`}>{key}</Badge>
                    <span>
                      {key === "CRUD" ? "Complet" : key === "CRU" ? "Sans suppression" : key === "CR" ? "Créer/Lire" : "Lecture seule"}
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
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Action" />
              </SelectTrigger>
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
                      <Badge className={`text-[10px] ${actionColors[log.action]}`} variant="secondary">
                        {log.action}
                      </Badge>
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
              <Input placeholder="ex: Marketing, Juridique..." />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Input placeholder="Description optionnelle..." />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setAddGroupOpen(false)}>Annuler</Button>
              <Button className="bg-accent text-accent-foreground hover:bg-accent/90" onClick={() => setAddGroupOpen(false)}>
                Créer le groupe
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
