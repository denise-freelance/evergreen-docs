import { useState } from "react";
import { CreditCard, Check, Shield, Sparkles, Zap, Building2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";

interface Plan {
  id: string;
  name: string;
  price: { monthly: number; yearly: number };
  description: string;
  features: string[];
  icon: any;
  highlight?: boolean;
}

const plans: Plan[] = [
  {
    id: "starter",
    name: "Starter",
    price: { monthly: 9, yearly: 90 },
    description: "Pour découvrir DocuFlow.",
    features: ["5 Go de stockage", "3 utilisateurs", "Recherche full-text", "Support par email"],
    icon: Zap,
  },
  {
    id: "pro",
    name: "Professionnel",
    price: { monthly: 29, yearly: 290 },
    description: "Pour les équipes en croissance.",
    features: ["100 Go de stockage", "Utilisateurs illimités", "Workflows de validation", "Numérisation Wi-Fi", "Partages externes sécurisés", "Support prioritaire"],
    icon: Sparkles,
    highlight: true,
  },
  {
    id: "enterprise",
    name: "Entreprise",
    price: { monthly: 79, yearly: 790 },
    description: "Sécurité et conformité renforcées.",
    features: ["Stockage illimité", "SSO / SAML", "Audit avancé", "Rétention & archivage", "Support dédié 24/7"],
    icon: Building2,
  },
];

export default function PaymentPage() {
  const { toast } = useToast();
  const [cycle, setCycle] = useState<"monthly" | "yearly">("monthly");
  const [selected, setSelected] = useState<string>("pro");

  const chosen = plans.find((p) => p.id === selected)!;

  const handleCheckout = () => {
    toast({
      title: "Paiement en préparation",
      description: `Vous avez sélectionné le plan ${chosen.name} (${cycle === "monthly" ? "mensuel" : "annuel"}). La passerelle de paiement sera activée prochainement.`,
    });
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <CreditCard className="h-6 w-6 text-accent" /> Paiement & Abonnement
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Choisissez la formule adaptée à votre organisation.
          </p>
        </div>
        <Badge variant="outline" className="border-accent/30 text-accent">
          <Shield className="h-3 w-3 mr-1" /> Paiement sécurisé
        </Badge>
      </div>

      <Tabs value={cycle} onValueChange={(v) => setCycle(v as "monthly" | "yearly")}>
        <TabsList>
          <TabsTrigger value="monthly">Mensuel</TabsTrigger>
          <TabsTrigger value="yearly">Annuel · -17%</TabsTrigger>
        </TabsList>
        <TabsContent value={cycle} className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {plans.map((p) => {
              const Icon = p.icon;
              const isSel = selected === p.id;
              return (
                <Card
                  key={p.id}
                  className={`p-6 cursor-pointer transition-all ${isSel ? "border-accent ring-2 ring-accent/30" : "hover:border-accent/50"} ${p.highlight ? "relative" : ""}`}
                  onClick={() => setSelected(p.id)}
                >
                  {p.highlight && (
                    <Badge className="absolute -top-2 right-4 bg-accent text-accent-foreground">Populaire</Badge>
                  )}
                  <div className="flex items-center gap-2 mb-2">
                    <Icon className="h-5 w-5 text-accent" />
                    <h3 className="font-semibold">{p.name}</h3>
                  </div>
                  <p className="text-xs text-muted-foreground mb-4">{p.description}</p>
                  <div className="mb-4">
                    <span className="text-3xl font-bold">{p.price[cycle]}€</span>
                    <span className="text-sm text-muted-foreground">/{cycle === "monthly" ? "mois" : "an"}</span>
                  </div>
                  <ul className="space-y-2">
                    {p.features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-sm">
                        <Check className="h-4 w-4 text-success shrink-0 mt-0.5" /> <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </Card>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>

      <Card className="p-6 flex items-center justify-between gap-4 flex-wrap">
        <div>
          <p className="text-sm text-muted-foreground">Formule sélectionnée</p>
          <p className="text-lg font-semibold">{chosen.name} · {chosen.price[cycle]}€/{cycle === "monthly" ? "mois" : "an"}</p>
        </div>
        <Button size="lg" onClick={handleCheckout}>
          <CreditCard className="h-4 w-4" /> Procéder au paiement
        </Button>
      </Card>

      <p className="text-xs text-muted-foreground text-center">
        Les paiements sont traités via une passerelle sécurisée. Aucune donnée bancaire n'est stockée sur nos serveurs.
      </p>
    </div>
  );
}
