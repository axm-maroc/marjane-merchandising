import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Sparkles, TrendingUp, AlertCircle, CheckCircle2, XCircle, RefreshCw, Lightbulb, DollarSign, BarChart3 } from "lucide-react";
import { Link } from "wouter";
import { useState, useMemo } from "react";
import { toast } from "sonner";

export default function AIRecommendations() {
  const { data: stores } = trpc.stores.list.useQuery();
  const [selectedStoreId, setSelectedStoreId] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState<"pending" | "applied" | "dismissed" | "all">("pending");

  // Auto-select first store
  useMemo(() => {
    if (!selectedStoreId && stores && stores.length > 0) {
      setSelectedStoreId(stores[0].id);
    }
  }, [stores, selectedStoreId]);

  const { data: recommendations = [], refetch } = trpc.aiRecommendations.byStore.useQuery(
    {
      storeId: selectedStoreId || 0,
      status: statusFilter === "all" ? undefined : statusFilter,
    },
    { enabled: !!selectedStoreId }
  );

  const generateMutation = trpc.aiRecommendations.generate.useMutation({
    onSuccess: (data) => {
      toast.success(`${data.count} recommandations générées !`);
      refetch();
    },
    onError: (error) => {
      toast.error("Erreur lors de la génération des recommandations");
      console.error(error);
    },
  });

  const markAsAppliedMutation = trpc.aiRecommendations.markAsApplied.useMutation({
    onSuccess: () => {
      toast.success("Recommandation marquée comme appliquée");
      refetch();
    },
  });

  const dismissMutation = trpc.aiRecommendations.dismiss.useMutation({
    onSuccess: () => {
      toast.success("Recommandation rejetée");
      refetch();
    },
  });

  const handleGenerate = () => {
    if (!selectedStoreId) {
      toast.error("Veuillez sélectionner un magasin");
      return;
    }

    generateMutation.mutate({ storeId: selectedStoreId });
  };

  const getTypeIcon = (type: string) => {
    const icons: Record<string, any> = {
      reposition: TrendingUp,
      facing: BarChart3,
      cross_merchandising: Sparkles,
      dereference: XCircle,
      new_product: Lightbulb,
    };
    return icons[type] || Lightbulb;
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      reposition: "Repositionnement",
      facing: "Ajustement Facing",
      cross_merchandising: "Cross-Merchandising",
      dereference: "Déréférencement",
      new_product: "Nouveau Produit",
    };
    return labels[type] || type;
  };

  const getPriorityBadge = (priority: string) => {
    const variants: Record<string, { variant: "default" | "secondary" | "destructive"; label: string }> = {
      critical: { variant: "destructive", label: "Critique" },
      high: { variant: "destructive", label: "Haute" },
      medium: { variant: "default", label: "Moyenne" },
      low: { variant: "secondary", label: "Basse" },
    };
    const config = variants[priority] || variants.medium;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: "default" | "secondary" | "destructive"; label: string; icon: any }> = {
      pending: { variant: "default", label: "En attente", icon: AlertCircle },
      applied: { variant: "default", label: "Appliquée", icon: CheckCircle2 },
      dismissed: { variant: "secondary", label: "Rejetée", icon: XCircle },
      expired: { variant: "destructive", label: "Expirée", icon: AlertCircle },
    };
    const config = variants[status] || variants.pending;
    const Icon = config.icon;
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const filteredRecommendations = useMemo(() => {
    return recommendations;
  }, [recommendations]);

  const stats = useMemo(() => {
    const pending = recommendations.filter(r => r.status === "pending").length;
    const applied = recommendations.filter(r => r.status === "applied").length;
    const totalImpact = recommendations
      .filter(r => r.status === "pending")
      .reduce((sum, r) => sum + (r.estimatedImpact || 0), 0);
    
    return { pending, applied, totalImpact };
  }, [recommendations]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 shadow-sm">
        <div className="container py-6">
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="ghost" size="icon" title="Retour au Dashboard">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
                <Sparkles className="w-8 h-8 text-blue-600" />
                Recommandations IA
              </h1>
              <p className="text-slate-600 mt-1">Optimisations intelligentes pour maximiser vos ventes</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container py-8">
        {/* Filters & Actions */}
        <Card className="border-slate-200 mb-6">
          <CardHeader>
            <CardTitle className="text-slate-900">Configuration</CardTitle>
            <CardDescription className="text-slate-600">Sélectionnez un magasin et générez des recommandations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <label className="text-sm font-medium text-slate-700 mb-2 block">Magasin</label>
                <Select
                  value={selectedStoreId?.toString() || ""}
                  onValueChange={(value) => setSelectedStoreId(parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionnez un magasin" />
                  </SelectTrigger>
                  <SelectContent>
                    {stores?.map((store) => (
                      <SelectItem key={store.id} value={store.id.toString()}>
                        {store.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1">
                <label className="text-sm font-medium text-slate-700 mb-2 block">Statut</label>
                <Select
                  value={statusFilter}
                  onValueChange={(value: any) => setStatusFilter(value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes</SelectItem>
                    <SelectItem value="pending">En attente</SelectItem>
                    <SelectItem value="applied">Appliquées</SelectItem>
                    <SelectItem value="dismissed">Rejetées</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Button
                  onClick={handleGenerate}
                  disabled={!selectedStoreId || generateMutation.isPending}
                  className="w-full md:w-auto"
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${generateMutation.isPending ? 'animate-spin' : ''}`} />
                  {generateMutation.isPending ? "Génération..." : "Générer"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        {selectedStoreId && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card className="border-slate-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  En Attente
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-slate-900">{stats.pending}</div>
                <p className="text-sm text-slate-600 mt-1">Recommandations à traiter</p>
              </CardContent>
            </Card>

            <Card className="border-slate-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  Appliquées
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">{stats.applied}</div>
                <p className="text-sm text-slate-600 mt-1">Optimisations réalisées</p>
              </CardContent>
            </Card>

            <Card className="border-slate-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  Impact Potentiel
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-600">
                  {(stats.totalImpact / 100).toLocaleString('fr-MA', { style: 'currency', currency: 'MAD' })}
                </div>
                <p className="text-sm text-slate-600 mt-1">Gain estimé mensuel</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Recommendations List */}
        {selectedStoreId && (
          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle className="text-slate-900">Recommandations</CardTitle>
              <CardDescription className="text-slate-600">
                {filteredRecommendations.length} recommandation(s) trouvée(s)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {filteredRecommendations.length === 0 ? (
                <div className="text-center py-12">
                  <Lightbulb className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">Aucune recommandation</h3>
                  <p className="text-slate-600 mb-4">
                    Cliquez sur "Générer" pour créer des recommandations intelligentes
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredRecommendations.map((rec: any) => {
                    const TypeIcon = getTypeIcon(rec.type);
                    return (
                      <Card key={rec.id} className="border-slate-200">
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <TypeIcon className="w-5 h-5 text-blue-600" />
                                <Badge variant="outline">{getTypeLabel(rec.type)}</Badge>
                                {getPriorityBadge(rec.priority)}
                                {getStatusBadge(rec.status)}
                              </div>
                              <CardTitle className="text-lg text-slate-900">{rec.title}</CardTitle>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <p className="text-slate-700">{rec.description}</p>
                          
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-slate-50 rounded-lg">
                            <div>
                              <div className="text-sm text-slate-600 mb-1">Impact Estimé</div>
                              <div className="text-lg font-semibold text-green-600">
                                +{(rec.estimatedImpact / 100).toLocaleString('fr-MA', { style: 'currency', currency: 'MAD' })}
                              </div>
                              <div className="text-xs text-slate-500">+{rec.estimatedImpactPercent}%</div>
                            </div>
                            <div>
                              <div className="text-sm text-slate-600 mb-1">Confiance</div>
                              <div className="text-lg font-semibold text-blue-600">{rec.confidence}%</div>
                            </div>
                            <div>
                              <div className="text-sm text-slate-600 mb-1">Expire le</div>
                              <div className="text-sm text-slate-900">
                                {rec.expiresAt ? new Date(rec.expiresAt).toLocaleDateString('fr-FR') : 'N/A'}
                              </div>
                            </div>
                          </div>

                          {rec.status === "pending" && (
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={() => markAsAppliedMutation.mutate({ recommendationId: rec.id })}
                                disabled={markAsAppliedMutation.isPending}
                              >
                                <CheckCircle2 className="w-4 h-4 mr-1" />
                                Marquer comme appliquée
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => dismissMutation.mutate({ recommendationId: rec.id })}
                                disabled={dismissMutation.isPending}
                              >
                                <XCircle className="w-4 h-4 mr-1" />
                                Rejeter
                              </Button>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
