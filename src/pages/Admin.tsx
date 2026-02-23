import { Users, UserPlus, Shield, Lock } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import GroupsTab from "@/components/admin/GroupsTab";
import UsersTab from "@/components/admin/UsersTab";
import PermissionsTab from "@/components/admin/PermissionsTab";
import AuditTab from "@/components/admin/AuditTab";

export default function Admin() {
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

        <TabsContent value="groups"><GroupsTab /></TabsContent>
        <TabsContent value="users"><UsersTab /></TabsContent>
        <TabsContent value="permissions"><PermissionsTab /></TabsContent>
        <TabsContent value="audit"><AuditTab /></TabsContent>
      </Tabs>
    </div>
  );
}
