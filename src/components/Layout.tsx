import { useState, useMemo, useEffect } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  FolderOpen,
  Settings,
  Shield,
  Link2,
  Bell,
  Search,
  Menu,
  FileText,
  FileSpreadsheet,
  FileImage,
  ChevronDown,
  LogOut,
  HelpCircle,
  GitPullRequest,
  Share2,
  File as FileIcon,
  X,
  Eye,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/useAuth";
import { useDocumentStore } from "@/stores/useDocumentStore";

const baseNavItems = [
  { to: "/", icon: LayoutDashboard, label: "Tableau de bord" },
  { to: "/documents", icon: FolderOpen, label: "Documents" },
  { to: "/shared", icon: Share2, label: "Partagés avec moi" },
  { to: "/search", icon: Search, label: "Recherche" },
  { to: "/workflow", icon: GitPullRequest, label: "Validation" },
  { to: "/connectors", icon: Link2, label: "Connecteurs" },
];

const adminNavItem = { to: "/admin", icon: Shield, label: "Administration" };

const fileIconMap: Record<string, any> = { pdf: FileText, xlsx: FileSpreadsheet, image: FileImage, doc: FileIcon };
const statusColors: Record<string, string> = { pending: "bg-warning/10 text-warning border-warning/20", approved: "bg-success/10 text-success border-success/20", draft: "bg-muted text-muted-foreground border-border", rejected: "bg-destructive/10 text-destructive border-destructive/20" };
const statusLabels: Record<string, string> = { pending: "En attente", approved: "Validé", draft: "Brouillon", rejected: "Rejeté" };

export default function Layout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [headerSearch, setHeaderSearch] = useState("");
  const location = useLocation();
  const navigate = useNavigate();
  const { profile, isAdmin, signOut, user } = useAuth();
  const { searchDocuments, documents, loadAll, loaded } = useDocumentStore();
  const headerResults = useMemo(() => searchDocuments(headerSearch), [headerSearch, documents]);

  useEffect(() => {
    if (user && !loaded) {
      loadAll();
    }
  }, [user, loaded, loadAll]);

  const navItems = isAdmin ? [...baseNavItems, adminNavItem] : baseNavItems;

  const initials = profile?.username
    ? profile.username.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "??";

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-foreground/20 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-50 flex flex-col
          bg-sidebar text-sidebar-foreground
          transition-all duration-300 ease-in-out
          ${sidebarOpen ? "w-64" : "w-[68px]"}
          ${mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
      >
        <div className="flex h-16 items-center gap-3 px-4 border-b border-sidebar-border">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg gradient-accent">
            <FileText className="h-5 w-5 text-accent-foreground" />
          </div>
          {sidebarOpen && (
            <div className="animate-fade-in">
              <h1 className="text-sm font-bold text-sidebar-accent-foreground tracking-tight">DocuFlow</h1>
              <p className="text-[10px] text-sidebar-foreground/60 uppercase tracking-widest">GED Pro</p>
            </div>
          )}
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location.pathname === item.to ||
              (item.to !== "/" && location.pathname.startsWith(item.to));
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setMobileOpen(false)}
                className={`
                  flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium
                  transition-all duration-150
                  ${isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
                  }
                `}
              >
                <item.icon className="h-[18px] w-[18px] shrink-0" />
                {sidebarOpen && <span className="animate-fade-in">{item.label}</span>}
              </NavLink>
            );
          })}
        </nav>

        <div className="border-t border-sidebar-border p-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm hover:bg-sidebar-accent/50 transition-colors">
                <Avatar className="h-8 w-8 shrink-0">
                  <AvatarFallback className="bg-sidebar-primary text-sidebar-primary-foreground text-xs font-semibold">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                {sidebarOpen && (
                  <div className="flex-1 text-left animate-fade-in">
                    <p className="text-xs font-semibold text-sidebar-accent-foreground">{profile?.username ?? "..."}</p>
                    <p className="text-[10px] text-sidebar-foreground/60">{isAdmin ? "Administrateur" : "Utilisateur"}</p>
                  </div>
                )}
                {sidebarOpen && <ChevronDown className="h-3.5 w-3.5 text-sidebar-foreground/50" />}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem><Settings className="mr-2 h-4 w-4" /> Paramètres</DropdownMenuItem>
              <DropdownMenuItem><HelpCircle className="mr-2 h-4 w-4" /> Aide</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive" onClick={signOut}>
                <LogOut className="mr-2 h-4 w-4" /> Déconnexion
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>

      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-16 items-center gap-4 border-b border-border bg-card px-4 lg:px-6">
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setMobileOpen(true)}>
            <Menu className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" className="hidden lg:flex" onClick={() => setSidebarOpen(!sidebarOpen)}>
            <Menu className="h-5 w-5" />
          </Button>

          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher des documents, dossiers, utilisateurs..."
              className="pl-9 bg-secondary border-0 focus-visible:ring-1 focus-visible:ring-accent"
              value={headerSearch}
              onChange={(e) => setHeaderSearch(e.target.value)}
            />
            {headerSearch && (
              <Button variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7" onClick={() => setHeaderSearch("")}>
                <X className="h-3.5 w-3.5" />
              </Button>
            )}
            {headerSearch.trim() && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-lg shadow-lg z-50 max-h-72 overflow-y-auto">
                {headerResults.length === 0 ? (
                  <p className="text-sm text-muted-foreground p-4 text-center">Aucun résultat</p>
                ) : (
                  headerResults.slice(0, 8).map((doc) => {
                    const Icon = fileIconMap[doc.type] || FileIcon;
                    return (
                      <div
                        key={doc.id}
                        className="flex items-center gap-3 px-3 py-2 hover:bg-secondary/50 cursor-pointer transition-colors"
                        onClick={() => { setHeaderSearch(""); navigate("/documents"); }}
                      >
                        <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{doc.name}</p>
                          <p className="text-xs text-muted-foreground">{doc.folder}</p>
                        </div>
                        <Badge variant="outline" className={`text-[10px] ${statusColors[doc.status]}`}>
                          {statusLabels[doc.status]}
                        </Badge>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-accent" />
            </Button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
