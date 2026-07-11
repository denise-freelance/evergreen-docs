import { useMemo, useState } from "react";
import { Archive, ArchiveRestore, FileText, FileSpreadsheet, FileImage, File as FileIcon, Eye, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useDocumentStore, DocFile } from "@/stores/useDocumentStore";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import DocumentPreview from "@/components/DocumentPreview";

const fileIcons: Record<string, any> = { pdf: FileText, xlsx: FileSpreadsheet, image: FileImage, doc: FileIcon };

export default function Archives() {
  const { documents, archiveDocument, unarchiveDocument } = useDocumentStore();
  const { user } = useAuth();
  const { toast } = useToast();
  const [q, setQ] = useState("");
  const [preview, setPreview] = useState<DocFile | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const filter = (list: DocFile[]) => {
    const s = q.toLowerCase().trim();
    if (!s) return list;
    return list.filter(
      (d) => d.name.toLowerCase().includes(s) || d.folder.toLowerCase().includes(s) || d.author.toLowerCase().includes(s)
    );
  };

  const approved = useMemo(
    () => filter(documents.filter((d) => d.status === "approved" && !d.isArchived)).sort((a, b) => b.modifiedAt - a.modifiedAt),
    [documents, q]
  );
  const archived = useMemo(
    () => filter(documents.filter((d) => d.isArchived)).sort((a, b) => (b.archivedAt ?? 0) - (a.archivedAt ?? 0)),
    [documents, q]
  );

  const handleArchive = async (doc: DocFile) => {
    if (!user) return;
    setBusy(doc.id);
    try {
      await archiveDocument(doc.id, user.username, user.user_id);
      toast({ title: "Document archivé", description: `${doc.name} est maintenant en lecture seule.` });
    } catch {
      toast({ title: "Erreur", description: "Impossible d'archiver le document.", variant: "destructive" });
    } finally {
      setBusy(null);
    }
  };

  const handleUnarchive = async (doc: DocFile) => {
    if (!user) return;
    setBusy(doc.id);
    try {
      await unarchiveDocument(doc.id, user.username, user.user_id);
      toast({ title: "Document désarchivé", description: `${doc.name} peut à nouveau être modifié.` });
    } catch {
      toast({ title: "Erreur", description: "Impossible de désarchiver le document.", variant: "destructive" });
    } finally {
      setBusy(null);
    }
  };

  const renderRow = (doc: DocFile, mode: "archive" | "unarchive") => {
    const Icon = fileIcons[doc.type] || FileIcon;
    return (
      <div key={doc.id} className="flex items-center gap-3 px-4 py-3 border-b border-border last:border-0 hover:bg-secondary/40 transition-colors">
        <Icon className="h-5 w-5 text-muted-foreground shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{doc.name}</p>
          <p className="text-[11px] text-muted-foreground truncate">
            {doc.folder} · {doc.author} · {doc.version}
            {mode === "unarchive" && doc.archivedByName && (
              <> · archivé par {doc.archivedByName}{doc.archivedAt ? ` le ${new Date(doc.archivedAt).toLocaleDateString("fr-FR")}` : ""}</>
            )}
          </p>
        </div>
        <Badge variant="outline" className="text-[10px] bg-success/10 text-success border-success/20">Validé</Badge>
        <Button variant="ghost" size="sm" className="h-8 gap-1.5" onClick={() => setPreview(doc)}>
          <Eye className="h-3.5 w-3.5" /> Aperçu
        </Button>
        {mode === "archive" ? (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button size="sm" className="h-8 gap-1.5" disabled={busy === doc.id}>
                <Archive className="h-3.5 w-3.5" /> Archiver
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Archiver ce document ?</AlertDialogTitle>
                <AlertDialogDescription>
                  Une fois archivé, <strong>{doc.name}</strong> ne pourra plus être modifié. Seul un administrateur pourra le désarchiver.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Annuler</AlertDialogCancel>
                <AlertDialogAction onClick={() => handleArchive(doc)}>Archiver</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        ) : (
          <Button variant="outline" size="sm" className="h-8 gap-1.5" disabled={busy === doc.id} onClick={() => handleUnarchive(doc)}>
            <ArchiveRestore className="h-3.5 w-3.5" /> Désarchiver
          </Button>
        )}
      </div>
    );
  };

  return (
    <div className="p-4 lg:p-6 space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Archivage</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Archivez les documents validés pour les protéger de toute modification ultérieure.
        </p>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Rechercher un document..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="pl-9 bg-secondary border-0"
        />
      </div>

      <Tabs defaultValue="to-archive" className="space-y-4">
        <TabsList className="bg-secondary">
          <TabsTrigger value="to-archive" className="gap-1.5 text-xs">
            <Archive className="h-3.5 w-3.5" /> À archiver ({approved.length})
          </TabsTrigger>
          <TabsTrigger value="archived" className="gap-1.5 text-xs">
            <ArchiveRestore className="h-3.5 w-3.5" /> Archivés ({archived.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="to-archive">
          <Card>
            {approved.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-12">Aucun document validé à archiver.</p>
            ) : (
              approved.map((d) => renderRow(d, "archive"))
            )}
          </Card>
        </TabsContent>

        <TabsContent value="archived">
          <Card>
            {archived.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-12">Aucun document archivé.</p>
            ) : (
              archived.map((d) => renderRow(d, "unarchive"))
            )}
          </Card>
        </TabsContent>
      </Tabs>

      <DocumentPreview open={!!preview} onOpenChange={(o) => !o && setPreview(null)} file={preview} />
    </div>
  );
}
