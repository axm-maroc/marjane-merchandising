import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, TrendingUp, TrendingDown, Activity } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend);

export default function ImpactSimulator() {
  const [selectedPlanogramId, setSelectedPlanogramId] = useState<number | null>(null);
  const [selectedNewPlanogramId, setSelectedNewPlanogramId] = useState<number | null>(null);
  const [simulationMode, setSimulationMode] = useState<'compare' | 'custom'>('compare');

  // Récupérer la liste des planogrammes par magasin
  const planogramsQuery = trpc.planograms.byStore.useQuery(
    { storeId: 150001 }, // TODO: Permettre la sélection du magasin
  );

  // Simuler l'impact
  const simulateQuery = trpc.impactSimulator.compareVersions.useQuery(
    {
      currentPlanogramId: selectedPlanogramId || 0,
      newPlanogramId: selectedNewPlanogramId || 0,
    },
    {
      enabled: simulationMode === 'compare' && selectedPlanogramId !== null && selectedNewPlanogramId !== null,
    }
  );

  const simulation = simulateQuery.data;

  const getImpactColor = (percent: number) => {
    if (percent > 10) return 'text-green-600';
    if (percent > 0) return 'text-green-500';
    if (percent > -10) return 'text-orange-500';
    return 'text-red-600';
  };

  const getImpactBadgeVariant = (percent: number): 'default' | 'secondary' | 'destructive' => {
    return percent > 0 ? 'default' : percent > -10 ? 'secondary' : 'destructive';
  }

  const chartDataCA = simulation ? {
    labels: ['Actuel', 'Projeté'],
    datasets: [
      {
        label: 'CA (€)',
        data: [
          simulation.currentMetrics.totalCA / 100,
          simulation.projectedMetrics.totalCA / 100,
        ],
        backgroundColor: ['#3b82f6', '#10b981'],
        borderColor: ['#1e40af', '#059669'],
        borderWidth: 2,
      },
    ],
  } : null;

  const chartDataMargin = simulation ? {
    labels: ['Actuel', 'Projeté'],
    datasets: [
      {
        label: 'Marge (€)',
        data: [
          simulation.currentMetrics.totalMargin / 100,
          simulation.projectedMetrics.totalMargin / 100,
        ],
        backgroundColor: ['#8b5cf6', '#f59e0b'],
        borderColor: ['#6d28d9', '#d97706'],
        borderWidth: 2,
      },
    ],
  } : null;

  const chartDataRotation = simulation ? {
    labels: ['Actuel', 'Projeté'],
    datasets: [
      {
        label: 'Rotation (jours)',
        data: [
          simulation.currentMetrics.avgRotation,
          simulation.projectedMetrics.avgRotation,
        ],
        backgroundColor: ['#ec4899', '#06b6d4'],
        borderColor: ['#be185d', '#0891b2'],
        borderWidth: 2,
      },
    ],
  } : null;

  const chartDataProducts = simulation ? {
    labels: simulation.productImpacts.slice(0, 5).map((p: any) => p.name),
    datasets: [
      {
        label: 'Impact CA (€)',
        data: simulation.productImpacts.slice(0, 5).map((p: any) => p.estimatedCAChange / 100),
        backgroundColor: simulation.productImpacts.slice(0, 5).map((p: any) => 
          p.estimatedCAChange > 0 ? '#10b981' : '#ef4444'
        ),
        borderColor: simulation.productImpacts.slice(0, 5).map((p: any) => 
          p.estimatedCAChange > 0 ? '#059669' : '#dc2626'
        ),
        borderWidth: 2,
      },
    ],
  } : null;

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">Simulateur d'Impact</h1>
          <p className="text-muted-foreground">Visualisez l'impact potentiel des changements de planogrammes sur vos indicateurs clés</p>
        </div>

        {/* Mode de simulation */}
        <Card className="p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Planogramme Actuel</label>
              <Select value={selectedPlanogramId?.toString() || ''} onValueChange={(v) => setSelectedPlanogramId(parseInt(v))}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionnez un planogramme" />
                </SelectTrigger>
                <SelectContent>
                  {planogramsQuery.data?.map((p: any) => (
                    <SelectItem key={p.id} value={p.id.toString()}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Nouveau Planogramme</label>
              <Select value={selectedNewPlanogramId?.toString() || ''} onValueChange={(v) => setSelectedNewPlanogramId(parseInt(v))}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionnez un planogramme" />
                </SelectTrigger>
                <SelectContent>
                  {planogramsQuery.data?.map((p: any) => (
                    <SelectItem key={p.id} value={p.id.toString()}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="mt-6">
            <Button 
              onClick={() => simulateQuery.refetch()}
              disabled={!selectedPlanogramId || !selectedNewPlanogramId || simulateQuery.isLoading}
            >
              {simulateQuery.isLoading ? 'Simulation en cours...' : 'Simuler l\'Impact'}
            </Button>
          </div>
        </Card>

        {/* Résultats de la simulation */}
        {simulation && (
          <>
            {/* Recommandation */}
            <Card className="p-6 mb-8 border-l-4 border-l-blue-500">
              <div className="flex items-start gap-4">
                <AlertCircle className="w-6 h-6 text-blue-500 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-foreground mb-2">Recommandation</h3>
                  <p className="text-muted-foreground">{simulation.recommendation}</p>
                  <div className="mt-4">
                    <Badge variant="secondary">Confiance: {simulation.confidence}%</Badge>
                  </div>
                </div>
              </div>
            </Card>

            {/* KPIs de comparaison */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {/* CA */}
              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-foreground">Chiffre d'Affaires</h3>
                  {simulation.impact.caImpact > 0 ? (
                    <TrendingUp className="w-5 h-5 text-green-600" />
                  ) : (
                    <TrendingDown className="w-5 h-5 text-red-600" />
                  )}
                </div>
                <div className="space-y-2">
                  <div>
                    <p className="text-xs text-muted-foreground">Actuel</p>
                    <p className="text-lg font-bold text-foreground">
                      {(simulation.currentMetrics.totalCA / 100).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Projeté</p>
                    <p className="text-lg font-bold text-foreground">
                      {(simulation.projectedMetrics.totalCA / 100).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                    </p>
                  </div>
                  <div className={`text-sm font-semibold ${getImpactColor(simulation.impact.caImpactPercent)}`}>
                    {simulation.impact.caImpactPercent > 0 ? '+' : ''}{simulation.impact.caImpactPercent.toFixed(1)}%
                  </div>
                </div>
              </Card>

              {/* Marge */}
              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-foreground">Marge</h3>
                  {simulation.impact.marginImpact > 0 ? (
                    <TrendingUp className="w-5 h-5 text-green-600" />
                  ) : (
                    <TrendingDown className="w-5 h-5 text-red-600" />
                  )}
                </div>
                <div className="space-y-2">
                  <div>
                    <p className="text-xs text-muted-foreground">Actuelle</p>
                    <p className="text-lg font-bold text-foreground">
                      {(simulation.currentMetrics.totalMargin / 100).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Projetée</p>
                    <p className="text-lg font-bold text-foreground">
                      {(simulation.projectedMetrics.totalMargin / 100).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                    </p>
                  </div>
                  <div className={`text-sm font-semibold ${getImpactColor(simulation.impact.marginImpactPercent)}`}>
                    {simulation.impact.marginImpactPercent > 0 ? '+' : ''}{simulation.impact.marginImpactPercent.toFixed(1)}%
                  </div>
                </div>
              </Card>

              {/* Rotation */}
              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-foreground">Rotation</h3>
                  <Activity className="w-5 h-5 text-blue-600" />
                </div>
                <div className="space-y-2">
                  <div>
                    <p className="text-xs text-muted-foreground">Actuelle</p>
                    <p className="text-lg font-bold text-foreground">
                      {simulation.currentMetrics.avgRotation.toFixed(1)} jours
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Projetée</p>
                    <p className="text-lg font-bold text-foreground">
                      {simulation.projectedMetrics.avgRotation.toFixed(1)} jours
                    </p>
                  </div>
                  <div className={`text-sm font-semibold ${getImpactColor(-simulation.impact.rotationImpactPercent)}`}>
                    {simulation.impact.rotationImpactPercent > 0 ? '+' : ''}{simulation.impact.rotationImpactPercent.toFixed(1)}%
                  </div>
                </div>
              </Card>

              {/* Ruptures */}
              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-foreground">Ruptures</h3>
                  <AlertCircle className="w-5 h-5 text-orange-600" />
                </div>
                <div className="space-y-2">
                  <div>
                    <p className="text-xs text-muted-foreground">Actuelles</p>
                    <p className="text-lg font-bold text-foreground">
                      {simulation.currentMetrics.ruptures} produits
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Projetées</p>
                    <p className="text-lg font-bold text-foreground">
                      {simulation.projectedMetrics.ruptures} produits
                    </p>
                  </div>
                  <div className={`text-sm font-semibold ${getImpactColor(-simulation.impact.rupturesImpactPercent)}`}>
                    {simulation.impact.rupturesImpactPercent > 0 ? '+' : ''}{simulation.impact.rupturesImpactPercent.toFixed(1)}%
                  </div>
                </div>
              </Card>
            </div>

            {/* Graphiques */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              {chartDataCA && (
                <Card className="p-6">
                  <h3 className="font-semibold text-foreground mb-4">Chiffre d'Affaires</h3>
                  <Bar data={chartDataCA} options={{ responsive: true, plugins: { legend: { display: false } } }} />
                </Card>
              )}

              {chartDataMargin && (
                <Card className="p-6">
                  <h3 className="font-semibold text-foreground mb-4">Marge</h3>
                  <Bar data={chartDataMargin} options={{ responsive: true, plugins: { legend: { display: false } } }} />
                </Card>
              )}

              {chartDataRotation && (
                <Card className="p-6">
                  <h3 className="font-semibold text-foreground mb-4">Rotation du Stock</h3>
                  <Bar data={chartDataRotation} options={{ responsive: true, plugins: { legend: { display: false } } }} />
                </Card>
              )}

              {chartDataProducts && (
                <Card className="p-6">
                  <h3 className="font-semibold text-foreground mb-4">Impact par Produit (Top 5)</h3>
                  <Bar data={chartDataProducts} options={{ responsive: true, plugins: { legend: { display: false } } }} />
                </Card>
              )}
            </div>

            {/* Détail des impacts par produit */}
            <Card className="p-6">
              <h3 className="font-semibold text-foreground mb-4">Détail des Impacts par Produit</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-2 px-4 font-semibold text-foreground">Produit</th>
                      <th className="text-center py-2 px-4 font-semibold text-foreground">Facings</th>
                      <th className="text-center py-2 px-4 font-semibold text-foreground">Niveau</th>
                      <th className="text-right py-2 px-4 font-semibold text-foreground">Impact Ventes</th>
                      <th className="text-right py-2 px-4 font-semibold text-foreground">Impact CA</th>
                      <th className="text-center py-2 px-4 font-semibold text-foreground">Risque</th>
                    </tr>
                  </thead>
                  <tbody>
                    {simulation.productImpacts.map((impact) => (
                      <tr key={impact.productId} className="border-b border-border hover:bg-muted/50">
                        <td className="py-3 px-4 text-foreground">{impact.name}</td>
                        <td className="text-center py-3 px-4">
                          {impact.facingsChange > 0 ? '+' : ''}{impact.facingsChange}
                        </td>
                        <td className="text-center py-3 px-4">
                          {impact.shelfLevelChange > 0 ? '+' : ''}{impact.shelfLevelChange}
                        </td>
                        <td className={`text-right py-3 px-4 font-semibold ${getImpactColor(impact.estimatedSalesChangePercent)}`}>
                          {impact.estimatedSalesChangePercent > 0 ? '+' : ''}{impact.estimatedSalesChangePercent.toFixed(1)}%
                        </td>
                        <td className={`text-right py-3 px-4 font-semibold ${getImpactColor(impact.estimatedCAChange)}`}>
                          {(impact.estimatedCAChange / 100).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                        </td>
                        <td className="text-center py-3 px-4">
                          <Badge variant={impact.riskLevel === 'low' ? 'default' : impact.riskLevel === 'medium' ? 'secondary' : 'destructive'}>
                            {impact.riskLevel === 'low' ? 'Faible' : impact.riskLevel === 'medium' ? 'Moyen' : 'Élevé'}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </>
        )}

        {simulateQuery.isLoading && (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">Simulation en cours...</p>
          </Card>
        )}
      </div>
    </div>
  );
}
