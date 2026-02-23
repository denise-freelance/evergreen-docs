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
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Group { id: string; name: string; }
interface UserRow { user_id: string; username: string; group_id: string | null; }
interface PermRow { user_id: string; group_id: string; permission: string; }

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
  const [perms, setPerms] = useState<PermRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [changes, setChanges] = useState<Record<string, Record<string, string>>>({});
  const { toast } = useToast();

  const fetchAll = async () => {
    setLoading(true);
    const [groupsRes, profilesRes, permsRes] = await Promise.all([
      supabase.from("groups").select("id, name").order("name"),
      supabase.from("profiles").select("user_id, username, group_id"),
      supabase.from("user_group_permissions").select("user_id, group_id, permission"),
    ]);
    if (groupsRes.data) setGroups(groupsRes.data);
    if (profilesRes.data) setUsers(profilesRes.data);
    if (permsRes.data) setPerms(permsRes.data);
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, []);

  const getPerm = (userId: string, groupId: string, userGroupId: string | null): string => {
    // Check local changes first
    if (changes[userId]?.[groupId]) return changes[userId][groupId];
    // Primary group = CRUD by default
    if (userGroupId === groupId) return "CRUD";
    // Check saved permissions
    const saved = perms.find((p) => p.user_id === userId && p.group_id === groupId);
    return saved?.permission ?? "-";
  };

  const handleChange = (userId: string, groupId: string, userGroupId: string | null, value: string) => {
    // Can't change primary group perm
    if (userGroupId === groupId) return;
    setChanges((prev) => ({
      ...prev,
      [userId]: { ...prev[userId], [groupId]: value },
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      for (const [userId, groupPerms] of Object.entries(changes)) {
        for (const [groupId, perm] of Object.entries(groupPerms)) {
          if (perm === "-") {
            await supabase.from("user_group_permissions").delete().match({ user_id: userId, group_id: groupId });
          } else {
            const { error } = await supabase.from("user_group_permissions").upsert(
              { user_id: userId, group_id: groupId, permission: perm },
              { onConflict: "user_id,group_id" }
            );
            if (error) throw error;
          }
        }
      }
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
