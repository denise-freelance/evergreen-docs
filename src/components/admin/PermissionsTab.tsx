import { useState, useEffect } from "react";
import { Shield, Loader2, Save } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { groupsService, Group } from "@/services/groups.service";
import { usersService } from "@/services/users.service";
import { permissionsService, Permission } from "@/services/permissions.service";
import { useToast } from "@/hooks/use-toast";

interface UserRow { user_id: string; username: string; group_id: string | null; }

const permOptions = ["-", "R", "RU", "CR", "CRU", "CRUD"];
const permColors: Record<string, string> = {
  CRUD: "bg-accent text-accent-foreground",
  CRU: "bg-info text-info-foreground",
  CR: "bg-warning text-warning-foreground",
  RU: "bg-chart-4 text-chart-4-foreground",
  R: "bg-muted text-foreground",
  "-": "bg-secondary text-muted-foreground",
};

const permLabels: Record<string, string> = {
  CRUD: "Complet",
  CRU: "Sans suppression",
  CR: "Créer/Lire",
  RU: "Lire/Modifier",
  R: "Lecture seule",
  "-": "Aucun",
};

export default function PermissionsTab() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [perms, setPerms] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [changes, setChanges] = useState<Record<string, Record<string, string>>>({});
  const { toast } = useToast();

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [groupsData, profilesData, permsData] = await Promise.all([
        groupsService.getAll(),
        usersService.getAll(),
        permissionsService.getAll(),
      ]);
      setGroups(groupsData);
      setUsers(profilesData.map((p) => ({ user_id: p.user_id, username: p.username, group_id: p.group_id })));
      setPerms(permsData);
    } catch (err: any) {
      toast({ title: "Erreur", description: err.message, variant: "destructive" });
    }
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, []);

  const getPerm = (userId: string, groupId: string, userGroupId: string | null): string => {
    if (changes[userId]?.[groupId]) return changes[userId][groupId];
    if (userGroupId === groupId) return "CRUD";
    const saved = perms.find((p) => p.user_id === userId && p.group_id === groupId);
    return saved?.permission ?? "-";
  };

  const handleChange = (userId: string, groupId: string, userGroupId: string | null, value: string) => {
    if (userGroupId === groupId) return;
    setChanges((prev) => ({
      ...prev,
      [userId]: { ...prev[userId], [groupId]: value },
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await permissionsService.saveAll(changes);
      toast({ title: "Permissions enregistrées" });
      setChanges({});
      fetchAll();
    } catch (err: any) {
      toast({ title: "Erreur", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const hasChanges = Object.keys(changes).length > 0;

  if (loading) {
    return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="space-y-4">
      <Card className="shadow-card">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Shield className="h-4 w-4 text-accent" /> Matrice de permissions
            </CardTitle>
            {hasChanges && (
              <Button size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90 gap-1.5" onClick={handleSave} disabled={saving}>
                {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                Enregistrer
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <div className="flex flex-wrap gap-3 mb-4 pb-3 border-b border-border">
            {permOptions.filter((k) => k !== "-").map((key) => (
              <div key={key} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Badge className={`text-[9px] font-mono ${permColors[key]}`}>{key}</Badge>
                <span>{permLabels[key]}</span>
              </div>
            ))}
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs sticky left-0 bg-card z-10">Utilisateur</TableHead>
                {groups.map((g) => (
                  <TableHead key={g.id} className="text-xs text-center min-w-[100px]">{g.name}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.user_id}>
                  <TableCell className="text-sm font-medium sticky left-0 bg-card z-10">{user.username}</TableCell>
                  {groups.map((group) => {
                    const perm = getPerm(user.user_id, group.id, user.group_id);
                    const isPrimary = user.group_id === group.id;
                    return (
                      <TableCell key={group.id} className="text-center p-1">
                        {isPrimary ? (
                          <Badge className={`text-[9px] font-mono ${permColors.CRUD}`} title="Groupe principal">CRUD</Badge>
                        ) : (
                          <Select value={perm} onValueChange={(v) => handleChange(user.user_id, group.id, user.group_id, v)}>
                            <SelectTrigger className="h-7 w-20 mx-auto text-[10px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {permOptions.map((opt) => (
                                <SelectItem key={opt} value={opt} className="text-xs">{opt === "-" ? "Aucun" : opt}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
