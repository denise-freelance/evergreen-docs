import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import Layout from "@/components/Layout";
import Index from "./pages/Index";
import Documents from "./pages/Documents";
import Admin from "./pages/Admin";
import Connectors from "./pages/Connectors";
import SearchPage from "./pages/Search";
import Workflow from "./pages/Workflow";
import Shared from "./pages/Shared";
import Scan from "./pages/Scan";
import Payment from "./pages/Payment";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function ProtectedRoute({ children, adminOnly = false }: { children: React.ReactNode; adminOnly?: boolean }) {
  const { user, loading, profile, isAdmin } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-accent border-t-transparent" />
      </div>
    );
  }

  if (!user || !profile?.is_active) return <Navigate to="/auth" replace />;
  if (adminOnly && !isAdmin) return <Navigate to="/" replace />;

  return <>{children}</>;
}

const AppRoutes = () => (
  <Routes>
    <Route path="/auth" element={<AuthPage />} />
    <Route path="/" element={<ProtectedRoute><Layout><Index /></Layout></ProtectedRoute>} />
    <Route path="/documents" element={<ProtectedRoute><Layout><Documents /></Layout></ProtectedRoute>} />
    <Route path="/shared" element={<ProtectedRoute><Layout><Shared /></Layout></ProtectedRoute>} />
    <Route path="/admin" element={<ProtectedRoute adminOnly><Layout><Admin /></Layout></ProtectedRoute>} />
    <Route path="/connectors" element={<ProtectedRoute><Layout><Connectors /></Layout></ProtectedRoute>} />
    <Route path="/search" element={<ProtectedRoute><Layout><SearchPage /></Layout></ProtectedRoute>} />
    <Route path="/workflow" element={<ProtectedRoute><Layout><Workflow /></Layout></ProtectedRoute>} />
    <Route path="*" element={<NotFound />} />
  </Routes>
);

function AuthPage() {
  const { user, loading, profile } = useAuth();
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-accent border-t-transparent" />
      </div>
    );
  }
  if (user && profile?.is_active) return <Navigate to="/" replace />;
  return <Auth />;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
