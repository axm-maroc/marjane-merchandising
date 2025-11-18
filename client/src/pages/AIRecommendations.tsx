import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Sparkles, TrendingUp, AlertCircle, CheckCircle2, Lightbulb, Target } from "lucide-react";
import { Link } from "wouter";
import { useState, useMemo } from "react";
import { toast } from "sonner";

type RecommendationType = "assortment" | "placement" | "pricing" | "promotion";

export default function AIRecommendations() {
  const { data: stores } = trpc.stores.list.useQuery();
  const [selectedStoreId, setSelectedStoreId] = useState<number | null>(null);
  const [selectedType, setSelectedType] = useState<RecommendationType>("assortment");
  const [generatedRecommendation, setGeneratedRecommendation] = useState<any>(null);

  // Auto-select first store
  useMemo(() => {
    if (!selectedStoreId && stores && stores.length > 0) {
      setSelectedStoreId(stores[0].id);
    }
  }, [stores, selectedStoreId]);

  const generateMutation = trpc.recommendations.generate.useMutation({
    onSuccess: (data) => {
      setGeneratedRecommendation(data);
      toast.success("Recommandations générées avec succès !");
    },
    onError: (error) => {
      toast.error("Erreur lors de la génération des recommandations");
      console.error(error);
    },
  });

  const handleGenerate = () => {
    if (!selectedStoreId) {
      toast.error("Veuillez sélectionner un magasin");
      return;
    }

    generateMutation.mutate({
      storeId: selectedStoreId,
      type: selectedType,
    });
  };

  const typeLabels: Record<RecommendationType, { label: string; description: string; icon: any }> = {
    assortment: {
      label: "Assortiment Produits",
      description: "Optimiser la sélection de produits",
      icon: Target,
    },
    placement: {
      label: "Placement Rayonnage",
      description: "Optimiser la disposition des produits",
      icon: TrendingUp,
    },
    pricing: {
      label: "Stratégie Prix",
      description: "Ajuster les prix pour maximiser la marge",
      icon: Sparkles,
    },
    promotion: {
      label: "Promotions",
      description: "Identifier les opportunités promotionnelles",
      icon: AlertCircle,
    },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 shadow-sm">
        <div className="container py-6">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
                <Sparkles className="w-8 h-8 text-purple-600" />
                Recommandations IA
              </h1>
              <p className="text-slate-600 mt-1">Optimisation merchandising par intelligence artificielle</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Configuration Panel */}
          <div className="lg:col-span-1">
            <Card className="border-slate-200">
              <CardHeader>
                <CardTitle className="text-slate-900">Configuration</CardTitle>
                <CardDescription className="text-slate-600">
                  Sélectionnez les paramètres pour générer des recommandations
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
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

                <div>
                  <label className="text-sm font-medium text-slate-700 mb-2 block">Type de Recommandation</label>
                  <Tabs value={selectedType} onValueChange={(v) => setSelectedType(v as RecommendationType)}>
                    <TabsList className="grid w-full grid-cols-2 h-auto">
                      {(Object.keys(typeLabels) as RecommendationType[]).map((type) => {
                        const Icon = typeLabels[type].icon;
                        return (
                          <TabsTrigger key={type} value={type} className="flex flex-col items-center gap-1 py-2">
                            <Icon className="w-4 h-4" />
                            <span className="text-xs">{typeLabels[type].label}</span>
                          </TabsTrigger>
                        );
                      })}
                    </TabsList>
                  </Tabs>
                  <p className="text-sm text-slate-600 mt-2">
                    {typeLabels[selectedType].description}
                  </p>
                </div>

                <Button
                  onClick={handleGenerate}
                  disabled={!selectedStoreId || generateMutation.isPending}
                  className="w-full"
                >
                  {generateMutation.isPending ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Génération en cours...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Générer Recommandations
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Info Card */}
            <Card className="border-slate-200 mt-4">
              <CardHeader>
                <CardTitle className="text-sm text-slate-900 flex items-center gap-2">
                  <Lightbulb className="w-4 h-4 text-yellow-600" />
                  Comment ça marche ?
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-slate-600 space-y-2">
                <p>
                  Notre moteur IA analyse l'historique de vente, les stocks, et les tendances pour générer des recommandations personnalisées.
                </p>
                <p>
                  Les recommandations sont basées sur des algorithmes d'apprentissage automatique et des modèles de langage avancés.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Results Panel */}
          <div className="lg:col-span-2">
            {generatedRecommendation ? (
              <div className="space-y-6">
                {/* Header Card */}
                <Card className="border-slate-200 bg-gradient-to-br from-purple-50 to-blue-50">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-2xl text-slate-900">
                          {generatedRecommendation.title}
                        </CardTitle>
                        <CardDescription className="text-slate-700 mt-2">
                          {generatedRecommendation.description}
                        </CardDescription>
                      </div>
                      <Badge
                        variant={generatedRecommendation.confidence >= 80 ? "default" : "secondary"}
                        className="text-sm px-3 py-1"
                      >
                        {generatedRecommendation.confidence}% confiance
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2 text-green-700 bg-green-50 px-4 py-3 rounded-lg">
                      <TrendingUp className="w-5 h-5" />
                      <span className="font-semibold">Impact attendu: {generatedRecommendation.expectedImpact}</span>
                    </div>
                  </CardContent>
                </Card>

                {/* Actions */}
                <Card className="border-slate-200">
                  <CardHeader>
                    <CardTitle className="text-slate-900">Actions Recommandées</CardTitle>
                    <CardDescription className="text-slate-600">
                      {generatedRecommendation.actions.length} actions à mettre en œuvre
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {generatedRecommendation.actions.map((action: any, index: number) => (
                        <div
                          key={index}
                          className={`p-4 rounded-lg border-l-4 ${
                            action.priority === "high"
                              ? "border-red-500 bg-red-50"
                              : action.priority === "medium"
                              ? "border-yellow-500 bg-yellow-50"
                              : "border-blue-500 bg-blue-50"
                          }`}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="font-semibold text-slate-900">{action.action}</div>
                            <Badge
                              variant={action.priority === "high" ? "destructive" : "secondary"}
                              className="text-xs"
                            >
                              {action.priority === "high" ? "Haute" : action.priority === "medium" ? "Moyenne" : "Basse"}
                            </Badge>
                          </div>
                          <p className="text-sm text-slate-700">{action.reason}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Insights */}
                <Card className="border-slate-200">
                  <CardHeader>
                    <CardTitle className="text-slate-900 flex items-center gap-2">
                      <Lightbulb className="w-5 h-5 text-yellow-600" />
                      Insights Clés
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {generatedRecommendation.insights.map((insight: string, index: number) => (
                        <div key={index} className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                          <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                          <span className="text-sm text-slate-700">{insight}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <Card className="border-slate-200">
                <CardContent className="py-16 text-center">
                  <Sparkles className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">
                    Prêt à générer des recommandations
                  </h3>
                  <p className="text-slate-600 max-w-md mx-auto">
                    Sélectionnez un magasin et un type de recommandation, puis cliquez sur "Générer Recommandations" pour commencer.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
