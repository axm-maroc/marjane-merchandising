import { useState } from 'react';
import { useLocation } from 'wouter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Zap, BarChart3, FileText } from 'lucide-react';
import { PlanogramComparison } from '@/components/PlanogramComparison';
import { CategoryAnalysisReport } from '@/components/CategoryAnalysisReport';
import { trpc } from '@/lib/trpc';

export default function PlanogramAnalysis() {
  const [, setLocation] = useLocation();
  const [planogramId, setPlanogramId] = useState<number>(1); // À remplacer par le paramètre d'URL
  const [isOptimizing, setIsOptimizing] = useState(false);

  // Récupérer les données du planogramme
  const { data: planogram, isLoading } = trpc.planograms.getById.useQuery(
    { id: planogramId },
    { enabled: !!planogramId }
  );

  // Procédure d'optimisation
  const optimizeMutation = trpc.planograms.optimize.useMutation({
    onSuccess: (result) => {
      setIsOptimizing(false);
      alert(`✅ ${result.message}`);
    },
    onError: (error) => {
      setIsOptimizing(false);
      alert(`❌ Erreur: ${error.message}`);
    },
  });

  const handleOptimize = async () => {
    setIsOptimizing(true);
    await optimizeMutation.mutateAsync({ planogramId });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="text-lg font-semibold">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* En-tête */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocation('/planograms')}
              className="gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Retour
            </Button>
            <Button
              onClick={handleOptimize}
              disabled={isOptimizing}
              className="gap-2 bg-blue-600 hover:bg-blue-700"
            >
              <Zap className="w-4 h-4" />
              {isOptimizing ? 'Optimisation...' : 'Optimiser les Positions'}
            </Button>
          </div>

          <div>
            <h1 className="text-3xl font-bold mb-2">{planogram?.name || 'Planogramme'}</h1>
            <div className="flex items-center gap-4">
              <Badge variant="outline">
                Statut: <span className="ml-1 font-semibold">{planogram?.status || 'draft'}</span>
              </Badge>
              <p className="text-gray-600">
                Planogramme #{planogramId}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Contenu */}
      <div className="container mx-auto px-4 py-8">
        <Tabs defaultValue="optimization" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger value="optimization" className="gap-2">
              <Zap className="w-4 h-4" />
              Optimisation
            </TabsTrigger>
            <TabsTrigger value="comparison" className="gap-2">
              <BarChart3 className="w-4 h-4" />
              Comparaison
            </TabsTrigger>
            <TabsTrigger value="analysis" className="gap-2">
              <FileText className="w-4 h-4" />
              Analyse
            </TabsTrigger>
          </TabsList>

          {/* Onglet Optimisation */}
          <TabsContent value="optimization" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Optimisation des Positions</CardTitle>
                <CardDescription>
                  Appliquez les règles de merchandising pour optimiser automatiquement les positions des produits
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-sm text-gray-600 mb-1">Produits à Forte Rotation</p>
                    <p className="text-2xl font-bold text-blue-600">Hauteur des Yeux</p>
                    <p className="text-xs text-gray-500 mt-2">Niveaux 2-3 (40-60%)</p>
                  </div>
                  <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                    <p className="text-sm text-gray-600 mb-1">Produits Complémentaires</p>
                    <p className="text-2xl font-bold text-green-600">Côte à Côte</p>
                    <p className="text-xs text-gray-500 mt-2">Regroupés par catégorie</p>
                  </div>
                  <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                    <p className="text-sm text-gray-600 mb-1">Produits à Faible Rotation</p>
                    <p className="text-2xl font-bold text-purple-600">Extrémités</p>
                    <p className="text-xs text-gray-500 mt-2">Niveaux 0 et 5</p>
                  </div>
                </div>

                <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-sm text-amber-900">
                    <strong>Comment ça marche :</strong> L'algorithme analyse les données de ventes et place automatiquement les produits selon les règles de merchandising éprouvées. Les produits à forte rotation sont placés à hauteur des yeux pour maximiser les ventes.
                  </p>
                </div>

                <Button
                  onClick={handleOptimize}
                  disabled={isOptimizing}
                  size="lg"
                  className="w-full gap-2 bg-blue-600 hover:bg-blue-700"
                >
                  <Zap className="w-5 h-5" />
                  {isOptimizing ? 'Optimisation en cours...' : 'Lancer l\'Optimisation'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Onglet Comparaison */}
          <TabsContent value="comparison">
            <PlanogramComparison planogramId={planogramId} />
          </TabsContent>

          {/* Onglet Analyse */}
          <TabsContent value="analysis">
            <CategoryAnalysisReport planogramId={planogramId} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
