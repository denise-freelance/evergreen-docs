import { useState, useEffect } from "react";
import { Search, Plus, MoreHorizontal, Edit2, Trash2, Loader2, ChevronRight, ChevronDown, FolderPlus, Users } from "lucide-react";
import GroupMembersDialog from "@/components/admin/GroupMembersDialog";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { groupsService, Group } from "@/services/groups.service";
import { useToast } from "@/hooks/use-toast";

export default function GroupsTab() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [membersOpen, setMembersOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [formName, setFormName] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formIcon, setFormIcon] = useState("📁");
  const [formParentId, setFormParentId] = useState<string>("none");
  const { toast } = useToast();

  const fetchGroups = async () => {
    setLoading(true);
    try {
      const data = await groupsService.getAll();
      setGroups(data);
    } catch (err: any) {
      toast({ title: "Erreur", description: err.message, variant: "destructive" });
    }
    setLoading(false);
  };

  useEffect(() => { fetchGroups(); }, []);

  const filtered = groups.filter((g) =>
    g.name.toLowerCase().includes(search.toLowerCase()) ||
    g.description?.toLowerCase().includes(search.toLowerCase())
  );

  const rootGroups = filtered.filter((g) => !g.parent_id);
  const getChildren = (parentId: string) => groups.filter((g) => g.parent_id === parentId);

  const handleCreate = async () => {
    if (!formName.trim()) return;
    try {
      await groupsService.create({
        name: formName.trim(),
        description: formDesc.trim() || null,
        icon: formIcon,
        parent_id: formParentId === "none" ? null : formParentId,
      });
      toast({ title: "Groupe créé" });
      resetForm();
      setAddOpen(false);
      fetchGroups();
    } catch (err: any) {
      toast({ title: "Erreur", description: err.message, variant: "destructive" });
    }
  };

  const handleEdit = async () => {
    if (!selectedGroup || !formName.trim()) return;
    try {
      await groupsService.update(selectedGroup.id, {
        name: formName.trim(),
        description: formDesc.trim() || null,
        icon: formIcon,
        parent_id: formParentId === "none" ? null : formParentId,
      });
      toast({ title: "Groupe modifié" });
      resetForm();
      setEditOpen(false);
      fetchGroups();
    } catch (err: any) {
      toast({ title: "Erreur", description: err.message, variant: "destructive" });
    }
  };

  const handleDelete = async () => {
    if (!selectedGroup) return;
    try {
      await groupsService.delete(selectedGroup.id);
      toast({ title: "Groupe supprimé" });
      setDeleteOpen(false);
      setSelectedGroup(null);
      fetchGroups();
    } catch (err: any) {
      toast({ title: "Erreur", description: err.message, variant: "destructive" });
    }
  };

  const resetForm = () => {
    setFormName("");
    setFormDesc("");
    setFormIcon("📁");
    setFormParentId("none");
  };

  const openEdit = (group: Group) => {
    setSelectedGroup(group);
    setFormName(group.name);
    setFormDesc(group.description ?? "");
    setFormIcon(group.icon ?? "📁");
    setFormParentId(group.parent_id ?? "none");
    setEditOpen(true);
  };

  const openDelete = (group: Group) => {
    setSelectedGroup(group);
    setDeleteOpen(true);
  };

  const openAddSubgroup = (parent: Group) => {
    resetForm();
    setFormParentId(parent.id);
    setAddOpen(true);
  };

  const GroupCard = ({ group, depth = 0 }: { group: Group; depth?: number }) => {
    const children = getChildren(group.id);
    return (
      <>
        <Card className="shadow-card hover:shadow-card-hover transition-shadow" style={{ marginLeft: depth * 24 }}>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg flex items-center justify-center text-lg bg-accent/10">
                  {group.icon}
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    {depth > 0 && <ChevronRight className="h-3 w-3 text-muted-foreground" />}
                    <p className="font-semibold text-sm">{group.name}</p>
                  </div>
                  <p className="text-xs text-muted-foreground">{group.description ?? "Aucune description"}</p>
                </div>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => { setSelectedGroup(group); setMembersOpen(true); }}>
                    <Users className="mr-2 h-4 w-4" /> Membres
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => openEdit(group)}>
                    <Edit2 className="mr-2 h-4 w-4" /> Modifier
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => openAddSubgroup(group)}>
                    <FolderPlus className="mr-2 h-4 w-4" /> Ajouter un sous-groupe
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-destructive" onClick={() => openDelete(group)}>
                    <Trash2 className="mr-2 h-4 w-4" /> Supprimer
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardContent>
        </Card>
        {children.map((child) => (
          <GroupCard key={child.id} group={child} depth={depth + 1} />
        ))}
      </>
    );
  };

  const GroupFormFields = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Nom du groupe</Label>
        <Input placeholder="ex: Marketing, Juridique..." value={formName} onChange={(e) => setFormName(e.target.value)} />
      </div>
      <div className="space-y-2">
        <Label>Description</Label>
        <Input placeholder="Description optionnelle..." value={formDesc} onChange={(e) => setFormDesc(e.target.value)} />
      </div>
      <div className="space-y-2">
        <Label>Icône</Label>
        <Input placeholder="📁" value={formIcon} onChange={(e) => setFormIcon(e.target.value)} className="w-20" />
      </div>
      <div className="space-y-2">
        <Label>Groupe parent</Label>
        <Select value={formParentId} onValueChange={setFormParentId}>
          <SelectTrigger><SelectValue placeholder="Aucun (racine)" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Aucun (racine)</SelectItem>
            {groups.filter((g) => g.id !== selectedGroup?.id).map((g) => (
              <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Rechercher un groupe..." className="pl-9 bg-secondary border-0" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Button className="bg-accent text-accent-foreground hover:bg-accent/90 gap-1.5" onClick={() => { resetForm(); setAddOpen(true); }}>
          <Plus className="h-4 w-4" /> Nouveau groupe
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {rootGroups.map((group) => (
            <GroupCard key={group.id} group={group} />
          ))}
          {rootGroups.length === 0 && (
            <p className="text-sm text-muted-foreground col-span-full text-center py-8">Aucun groupe trouvé.</p>
          )}
        </div>
      )}

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Nouveau groupe</DialogTitle>
            <DialogDescription>Créez un groupe pour organiser les permissions de vos utilisateurs.</DialogDescription>
          </DialogHeader>
          <GroupFormFields />
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setAddOpen(false)}>Annuler</Button>
            <Button className="bg-accent text-accent-foreground hover:bg-accent/90" onClick={handleCreate}>Créer le groupe</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Modifier le groupe</DialogTitle>
            <DialogDescription>Modifiez les informations du groupe.</DialogDescription>
          </DialogHeader>
          <GroupFormFields />
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setEditOpen(false)}>Annuler</Button>
            <Button className="bg-accent text-accent-foreground hover:bg-accent/90" onClick={handleEdit}>Enregistrer</Button>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer le groupe</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer le groupe "{selectedGroup?.name}" ? Cette action est irréversible et supprimera également tous les sous-groupes associés.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <GroupMembersDialog open={membersOpen} onOpenChange={setMembersOpen} group={selectedGroup} />
    </div>
  );
}
