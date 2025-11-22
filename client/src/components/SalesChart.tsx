import React from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, Package, Store } from 'lucide-react';

// Couleurs pour les graphiques
const COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];

interface SalesTrendChartProps {
  data: Array<{
    date: string;
    totalQuantity: number;
    totalRevenue: number;
  }>;
  loading?: boolean;
}

export function SalesTrendChart({ data, loading }: SalesTrendChartProps) {
  if (loading) {
    return (
      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="text-slate-900">Tendances des Ventes</CardTitle>
          <CardDescription className="text-slate-600">Chargement...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80 bg-slate-100 rounded animate-pulse" />
        </CardContent>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="text-slate-900">Tendances des Ventes</CardTitle>
          <CardDescription className="text-slate-600">Aucune donnée disponible</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80 flex items-center justify-center text-slate-400">
            <TrendingUp className="w-12 h-12 opacity-50" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-slate-200">
      <CardHeader>
        <CardTitle className="text-slate-900">Tendances des Ventes (30 jours)</CardTitle>
        <CardDescription className="text-slate-600">
          Évolution des quantités vendues et du chiffre d'affaires
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={data} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis 
              dataKey="date" 
              stroke="#64748b"
              style={{ fontSize: '12px' }}
            />
            <YAxis stroke="#64748b" style={{ fontSize: '12px' }} />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#1e293b', 
                border: '1px solid #475569',
                borderRadius: '8px',
                color: '#f1f5f9'
              }}
              formatter={(value) => {
                if (typeof value === 'number') {
                  return value.toLocaleString('fr-FR');
                }
                return value;
              }}
            />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="totalQuantity" 
              stroke="#3b82f6" 
              strokeWidth={2}
              dot={{ fill: '#3b82f6', r: 4 }}
              activeDot={{ r: 6 }}
              name="Quantité (unités)"
            />
            <Line 
              type="monotone" 
              dataKey="totalRevenue" 
              stroke="#10b981" 
              strokeWidth={2}
              dot={{ fill: '#10b981', r: 4 }}
              activeDot={{ r: 6 }}
              name="Chiffre d'affaires (DH)"
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

interface ProductSalesChartProps {
  data: Array<{
    productId?: number;
    productName?: string;
    totalQuantity?: number;
    totalRevenue?: number;
    avgConfidence?: number;
  }>;
  loading?: boolean;
}

export function ProductSalesChart({ data, loading }: ProductSalesChartProps) {
  if (loading) {
    return (
      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="text-slate-900">Top Produits par Ventes</CardTitle>
          <CardDescription className="text-slate-600">Chargement...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80 bg-slate-100 rounded animate-pulse" />
        </CardContent>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="text-slate-900">Top Produits par Ventes</CardTitle>
          <CardDescription className="text-slate-600">Aucune donnée disponible</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80 flex items-center justify-center text-slate-400">
            <Package className="w-12 h-12 opacity-50" />
          </div>
        </CardContent>
      </Card>
    );
  }

  // Préparer les données pour le graphique
  const chartData = data.map(item => ({
    name: item.productName || `Produit ${item.productId}`,
    quantity: item.totalQuantity || 0,
    revenue: item.totalRevenue || 0,
  }));

  return (
    <Card className="border-slate-200">
      <CardHeader>
        <CardTitle className="text-slate-900">Top 10 Produits par Chiffre d'Affaires</CardTitle>
        <CardDescription className="text-slate-600">
          Produits générant le plus de revenus
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={chartData} margin={{ top: 5, right: 30, left: 0, bottom: 60 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis 
              dataKey="name" 
              stroke="#64748b"
              angle={-45}
              textAnchor="end"
              height={120}
              style={{ fontSize: '12px' }}
            />
            <YAxis stroke="#64748b" style={{ fontSize: '12px' }} />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#1e293b', 
                border: '1px solid #475569',
                borderRadius: '8px',
                color: '#f1f5f9'
              }}
              formatter={(value) => {
                if (typeof value === 'number') {
                  return value.toLocaleString('fr-FR');
                }
                return value;
              }}
            />
            <Legend />
            <Bar dataKey="revenue" fill="#3b82f6" name="Chiffre d'affaires (DH)" />
            <Bar dataKey="quantity" fill="#10b981" name="Quantité (unités)" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

interface StoreSalesComparisonProps {
  data: Array<{
    storeId?: number;
    storeName?: string;
    totalQuantity?: number;
    totalRevenue?: number;
    avgConfidence?: number;
  }>;
  loading?: boolean;
}

export function StoreSalesComparison({ data, loading }: StoreSalesComparisonProps) {
  if (loading) {
    return (
      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="text-slate-900">Comparaison par Magasin</CardTitle>
          <CardDescription className="text-slate-600">Chargement...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80 bg-slate-100 rounded animate-pulse" />
        </CardContent>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="text-slate-900">Comparaison par Magasin</CardTitle>
          <CardDescription className="text-slate-600">Aucune donnée disponible</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80 flex items-center justify-center text-slate-400">
            <Store className="w-12 h-12 opacity-50" />
          </div>
        </CardContent>
      </Card>
    );
  }

  // Préparer les données pour le graphique
  const chartData = data.map((item, index) => ({
    name: item.storeName || `Magasin ${item.storeId}`,
    revenue: item.totalRevenue || 0,
    fill: COLORS[index % COLORS.length],
  }));

  return (
    <Card className="border-slate-200">
      <CardHeader>
        <CardTitle className="text-slate-900">Chiffre d'Affaires par Magasin</CardTitle>
        <CardDescription className="text-slate-600">
          Comparaison des performances entre magasins
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              outerRadius={120}
              fill="#8884d8"
              dataKey="revenue"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Pie>
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#1e293b', 
                border: '1px solid #475569',
                borderRadius: '8px',
                color: '#f1f5f9'
              }}
              formatter={(value) => {
                if (typeof value === 'number') {
                  return value.toLocaleString('fr-FR') + ' DH';
                }
                return value;
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

interface SalesMetricsProps {
  metrics: {
    totalQuantity?: number;
    totalRevenue?: number;
    avgConfidence?: number;
    countRecords?: number;
  } | null;
  loading?: boolean;
}

export function SalesMetrics({ metrics, loading }: SalesMetricsProps) {
  if (loading || !metrics) {
    return (
      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="text-slate-900">Métriques de Ventes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-24 bg-slate-100 rounded animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-slate-200">
      <CardHeader>
        <CardTitle className="text-slate-900">Métriques de Ventes</CardTitle>
        <CardDescription className="text-slate-600">Résumé des performances</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <p className="text-sm text-slate-600 mb-1">Total Quantité</p>
            <p className="text-2xl font-bold text-blue-600">
              {(metrics.totalQuantity || 0).toLocaleString('fr-FR')}
            </p>
            <p className="text-xs text-slate-500 mt-1">unités</p>
          </div>
          
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <p className="text-sm text-slate-600 mb-1">Total CA</p>
            <p className="text-2xl font-bold text-green-600">
              {(metrics.totalRevenue || 0).toLocaleString('fr-FR')}
            </p>
            <p className="text-xs text-slate-500 mt-1">DH</p>
          </div>
          
          <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
            <p className="text-sm text-slate-600 mb-1">Confiance Moyenne</p>
            <p className="text-2xl font-bold text-purple-600">
              {((metrics.avgConfidence || 0) / 100).toFixed(1)}%
            </p>
            <p className="text-xs text-slate-500 mt-1">prévisions</p>
          </div>
          
          <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
            <p className="text-sm text-slate-600 mb-1">Enregistrements</p>
            <p className="text-2xl font-bold text-orange-600">
              {(metrics.countRecords || 0).toLocaleString('fr-FR')}
            </p>
            <p className="text-xs text-slate-500 mt-1">données</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
