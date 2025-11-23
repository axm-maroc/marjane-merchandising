import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Download, TrendingUp, AlertCircle, CheckCircle } from 'lucide-react';
import { trpc } from '@/lib/trpc';

interface CategoryMetrics {
  category: string;
  sales: number;
  rotation: number;
  ruptures: number;
  nps: number;
  productCount: number;
  recommendation: string;
  priority: 'high' | 'medium' | 'low';
}

const CATEGORY_COLORS = {
  'Boissons': '#3B82F6',
  'Produits Laitiers': '#EC4899',
  'Épicerie Sèche': '#F59E0B',
  'Hygiène & Beauté': '#8B5CF6',
  'Bazar & Décoration': '#10B981',
  'Textile & Mode': '#6366F1',
};

export function CategoryAnalysisReport({ planogramId }: { planogramId: number }) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');

  // Données simulées pour la démonstration
  const categoryMetrics: CategoryMetrics[] = [
    {
      category: 'Boissons',
      sales: 45000,
      rotation: 8.5,
      ruptures: 2.3,
      nps: 8.2,
      productCount: 12,
      recommendation: 'Augmenter les facings des produits premium',
      priority: 'high',
    },
    {
      category: 'Produits Laitiers',
      sales: 38000,
      rotation: 7.2,
      ruptures: 3.1,
      nps: 7.8,
      productCount: 10,
      recommendation: 'Optimiser la température de conservation',
      priority: 'medium',
    },
    {
      category: 'Épicerie Sèche',
      sales: 32000,
      rotation: 6.1,
      ruptures: 1.8,
      nps: 7.5,
      productCount: 15,
      recommendation: 'Réduire les ruptures de stock',
      priority: 'low',
    },
    {
      category: 'Hygiène & Beauté',
      sales: 28000,
      rotation: 5.9,
      ruptures: 4.2,
      nps: 7.2,
      productCount: 8,
      recommendation: 'Augmenter la visibilité des produits',
      priority: 'high',
    },
  ];

  // Données de tendance
  const trendData = [
    { date: '1 Sem', Boissons: 40, 'Produits Laitiers': 35, 'Épicerie Sèche': 30, 'Hygiène & Beauté': 25 },
    { date: '2 Sem', Boissons: 42, 'Produits Laitiers': 36, 'Épicerie Sèche': 31, 'Hygiène & Beauté': 26 },
    { date: '3 Sem', Boissons: 44, 'Produits Laitiers': 37, 'Épicerie Sèche': 32, 'Hygiène & Beauté': 27 },
    { date: '4 Sem', Boissons: 45, 'Produits Laitiers': 38, 'Épicerie Sèche': 32, 'Hygiène & Beauté': 28 },
  ];

  // Données de distribution des ventes
  const distributionData = categoryMetrics.map(m => ({
    name: m.category,
    value: m.sales,
  }));

  const selectedMetrics = categoryMetrics.find(m => m.category === selectedCategory);

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Rapports d'Analyse par Catégorie</CardTitle>
              <CardDescription>Performance et recommandations d'optimisation</CardDescription>
            </div>
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Exporter PDF
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Sélection de catégorie */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {categoryMetrics.map(m => (
          <Button
            key={m.category}
            variant={selectedCategory === m.category ? 'default' : 'outline'}
            onClick={() => setSelectedCategory(m.category)}
            className="text-left"
          >
            <div className="flex flex-col items-start">
              <span className="font-medium text-sm">{m.category}</span>
              <span className="text-xs text-gray-500">{m.productCount} produits</span>
            </div>
          </Button>
        ))}
      </div>

      {/* Graphique de tendance */}
      <Card>
        <CardHeader>
          <CardTitle>Tendance des Ventes (CA en k€)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              {Object.keys(CATEGORY_COLORS).map(category => (
                <Line
                  key={category}
                  type="monotone"
                  dataKey={category}
                  stroke={CATEGORY_COLORS[category as keyof typeof CATEGORY_COLORS]}
                  strokeWidth={2}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Distribution des ventes */}
      <Card>
        <CardHeader>
          <CardTitle>Distribution des Ventes par Catégorie</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={distributionData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${(value / 1000).toFixed(0)}k€`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {distributionData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[entry.name as keyof typeof CATEGORY_COLORS]} />
                ))}
              </Pie>
              <Tooltip formatter={(value: any) => `${(Number(value) / 1000).toFixed(0)}k€`} />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Détails de la catégorie sélectionnée */}
      {selectedMetrics && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>{selectedMetrics.category}</CardTitle>
              <Badge variant={selectedMetrics.priority === 'high' ? 'destructive' : selectedMetrics.priority === 'medium' ? 'secondary' : 'outline'}>
                Priorité {selectedMetrics.priority === 'high' ? 'Haute' : selectedMetrics.priority === 'medium' ? 'Moyenne' : 'Basse'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Métriques clés */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-gray-600">CA</p>
                <p className="text-2xl font-bold text-blue-600">{(selectedMetrics.sales / 1000).toFixed(0)}k€</p>
              </div>
              <div className="p-4 bg-green-50 rounded-lg">
                <p className="text-sm text-gray-600">Rotation</p>
                <p className="text-2xl font-bold text-green-600">{selectedMetrics.rotation.toFixed(1)}x</p>
              </div>
              <div className="p-4 bg-red-50 rounded-lg">
                <p className="text-sm text-gray-600">Ruptures</p>
                <p className="text-2xl font-bold text-red-600">{selectedMetrics.ruptures.toFixed(1)}%</p>
              </div>
              <div className="p-4 bg-purple-50 rounded-lg">
                <p className="text-sm text-gray-600">NPS</p>
                <p className="text-2xl font-bold text-purple-600">{selectedMetrics.nps.toFixed(1)}</p>
              </div>
            </div>

            {/* Recommandation */}
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg flex gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-amber-900">Recommandation</p>
                <p className="text-sm text-amber-800 mt-1">{selectedMetrics.recommendation}</p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <Button className="flex-1">
                <CheckCircle className="w-4 h-4 mr-2" />
                Appliquer Recommandation
              </Button>
              <Button variant="outline" className="flex-1">
                Voir Détails Complets
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tableau récapitulatif */}
      <Card>
        <CardHeader>
          <CardTitle>Résumé de Toutes les Catégories</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-2">Catégorie</th>
                  <th className="text-right py-2 px-2">CA</th>
                  <th className="text-right py-2 px-2">Rotation</th>
                  <th className="text-right py-2 px-2">Ruptures</th>
                  <th className="text-right py-2 px-2">NPS</th>
                  <th className="text-right py-2 px-2">Produits</th>
                </tr>
              </thead>
              <tbody>
                {categoryMetrics.map(m => (
                  <tr key={m.category} className="border-b hover:bg-gray-50">
                    <td className="py-2 px-2 font-medium">{m.category}</td>
                    <td className="text-right py-2 px-2">{(m.sales / 1000).toFixed(0)}k€</td>
                    <td className="text-right py-2 px-2">{m.rotation.toFixed(1)}x</td>
                    <td className="text-right py-2 px-2 text-red-600">{m.ruptures.toFixed(1)}%</td>
                    <td className="text-right py-2 px-2">{m.nps.toFixed(1)}</td>
                    <td className="text-right py-2 px-2">{m.productCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
