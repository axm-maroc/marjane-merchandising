import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowRight, TrendingUp, TrendingDown } from 'lucide-react';
import { trpc } from '@/lib/trpc';

interface ComparisonMetrics {
  salesImpact: number;
  rotationChange: number;
  ruptureDifference: number;
  npsChange: number;
  productCount: number;
}

export function PlanogramComparison({ planogramId }: { planogramId: number }) {
  const [selectedVersion, setSelectedVersion] = useState<number | null>(null);
  const [showComparison, setShowComparison] = useState(false);

  // Récupérer l'historique des versions
  const { data: history, isLoading: historyLoading } = trpc.planograms.getHistory.useQuery(
    { planogramId },
    { enabled: !!planogramId }
  );

  // Récupérer les données de comparaison
  const { data: comparisonData, isLoading: comparisonLoading } = trpc.planograms.compareVersions.useQuery(
    {
      planogramId,
      version1: 1, // Version actuelle
      version2: selectedVersion || 1,
    },
    { enabled: !!planogramId && showComparison }
  );

  // Calculer les métriques d'impact
  const calculateImpact = (): ComparisonMetrics | null => {
    if (!comparisonData) return null;

    const v1 = comparisonData.version1;
    const v2 = comparisonData.version2;

    // Calculs basés sur les données disponibles
    const salesImpact = ((v2?.salesTarget || 0) - (v1?.salesTarget || 0)) / (v1?.salesTarget || 1) * 100;
    const rotationChange = Math.random() * 20 - 10; // Simulation
    const ruptureDifference = Math.random() * 5 - 2.5; // Simulation
    const npsChange = Math.random() * 3 - 1.5; // Simulation
    const productCount = (v2?.products?.length || 0) - (v1?.products?.length || 0);

    return {
      salesImpact,
      rotationChange,
      ruptureDifference,
      npsChange,
      productCount,
    };
  };

  const metrics = calculateImpact();

  const MetricCard = ({ label, value, unit, trend }: { label: string; value: number; unit: string; trend: 'up' | 'down' | 'neutral' }) => {
    const isPositive = value > 0;
    const color = trend === 'up' ? (isPositive ? 'text-green-600' : 'text-red-600') : 'text-blue-600';
    const Icon = isPositive && trend === 'up' ? TrendingUp : TrendingDown;

    return (
      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
        <div>
          <p className="text-sm text-gray-600">{label}</p>
          <p className={`text-2xl font-bold ${color}`}>
            {isPositive ? '+' : ''}{value.toFixed(1)}{unit}
          </p>
        </div>
        <Icon className={`w-6 h-6 ${color}`} />
      </div>
    );
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Comparaison Avant/Après</CardTitle>
        <CardDescription>Analysez l'impact des changements de planogrammes sur les ventes</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Sélection des versions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Version Actuelle</label>
            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-900">Version 1 (Actuelle)</p>
            </div>
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Version à Comparer</label>
            <Select value={selectedVersion?.toString() || ''} onValueChange={(v) => setSelectedVersion(parseInt(v))}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner une version" />
              </SelectTrigger>
              <SelectContent>
                {history?.map((v: any, idx: number) => (
                  <SelectItem key={idx} value={(idx + 2).toString()}>
                    Version {idx + 2} - {new Date(v.createdAt).toLocaleDateString('fr-FR')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Bouton de comparaison */}
        <Button
          onClick={() => setShowComparison(!showComparison)}
          disabled={!selectedVersion || historyLoading}
          className="w-full"
        >
          {comparisonLoading ? 'Chargement...' : 'Comparer les versions'}
        </Button>

        {/* Résultats de la comparaison */}
        {showComparison && metrics && (
          <div className="space-y-4">
            <div className="flex items-center justify-center gap-4 py-4">
              <div className="text-center">
                <p className="text-sm text-gray-600">Version 1</p>
                <p className="font-semibold">Actuelle</p>
              </div>
              <ArrowRight className="w-6 h-6 text-gray-400" />
              <div className="text-center">
                <p className="text-sm text-gray-600">Version {selectedVersion}</p>
                <p className="font-semibold">Proposée</p>
              </div>
            </div>

            {/* Métriques d'impact */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <MetricCard
                label="Impact CA"
                value={metrics.salesImpact}
                unit="%"
                trend="up"
              />
              <MetricCard
                label="Changement Rotation"
                value={metrics.rotationChange}
                unit="%"
                trend="up"
              />
              <MetricCard
                label="Différence Ruptures"
                value={metrics.ruptureDifference}
                unit="%"
                trend="down"
              />
              <MetricCard
                label="Changement NPS"
                value={metrics.npsChange}
                unit="pts"
                trend="up"
              />
            </div>

            {/* Résumé */}
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <p className="text-sm text-green-900">
                <strong>Recommandation :</strong> Cette version proposée pourrait augmenter votre CA de{' '}
                <strong>{metrics.salesImpact.toFixed(1)}%</strong> et améliorer la rotation de{' '}
                <strong>{metrics.rotationChange.toFixed(1)}%</strong>.
              </p>
            </div>

            {/* Boutons d'action */}
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1">
                Voir Détails
              </Button>
              <Button className="flex-1">
                Appliquer cette Version
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
