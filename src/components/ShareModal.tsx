import { useState } from "react";
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
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Copy, Link2, X, Calendar, Lock, Globe } from "lucide-react";

interface ShareModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  documentName?: string;
}

const sharedUsers = [
  { name: "Marie Curie", initials: "MC", email: "m.curie@acme.fr", role: "edit" },
  { name: "Pierre Martin", initials: "PM", email: "p.martin@acme.fr", role: "read" },
  { name: "Sophie Lemoine", initials: "SL", email: "s.lemoine@acme.fr", role: "comment" },
];

export default function ShareModal({ open, onOpenChange, documentName = "Rapport Q4 2025.pdf" }: ShareModalProps) {
  const [publicLink, setPublicLink] = useState(false);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-lg">Partager</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            {documentName}
          </DialogDescription>
        </DialogHeader>

        {/* Add people */}
        <div className="space-y-3">
          <div className="flex gap-2">
            <Input placeholder="Ajouter des personnes ou générer un lien public..." className="flex-1" />
            <Button className="bg-accent text-accent-foreground hover:bg-accent/90 shrink-0">
              Inviter
            </Button>
          </div>

          {/* Shared users */}
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {sharedUsers.map((user) => (
              <div key={user.email} className="flex items-center gap-3 py-1.5 px-1 rounded-lg hover:bg-secondary/50 transition-colors">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-primary text-primary-foreground text-[10px] font-semibold">
                    {user.initials}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{user.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                </div>
                <Select defaultValue={user.role}>
                  <SelectTrigger className="w-[120px] h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="read">Lecture</SelectItem>
                    <SelectItem value="comment">Commentaire</SelectItem>
                    <SelectItem value="edit">Édition</SelectItem>
                    <SelectItem value="owner">Propriétaire</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0">
                  <X className="h-3.5 w-3.5" />
                  <span className="sr-only">Retirer</span>
                </Button>
              </div>
            ))}
          </div>
        </div>

        <Separator />

        {/* Public link section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-muted-foreground" />
              <Label htmlFor="public-link" className="text-sm font-medium">Lien public</Label>
            </div>
            <Switch id="public-link" checked={publicLink} onCheckedChange={setPublicLink} />
          </div>

          {publicLink && (
            <div className="space-y-3 animate-slide-up">
              <div className="flex gap-2">
                <Input
                  value="https://docuflow.app/s/abc123xyz"
                  readOnly
                  className="text-xs bg-secondary"
                />
                <Button variant="outline" size="icon" className="shrink-0">
                  <Copy className="h-4 w-4" />
                  <span className="sr-only">Copier le lien</span>
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-3 w-3" /> Expiration
                  </Label>
                  <Input type="date" className="h-8 text-xs" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground flex items-center gap-1">
                    <Lock className="h-3 w-3" /> Mot de passe
                  </Label>
                  <Input type="password" placeholder="Optionnel" className="h-8 text-xs" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Restreindre par domaine</Label>
                <Input placeholder="ex: @acme.fr, @partenaire.com" className="h-8 text-xs" />
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
