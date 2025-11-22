import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  CheckCircle2, 
  Package, 
  DollarSign,
  BarChart3,
  Download,
  Calendar,
  ArrowLeft,
  RotateCcw,
  Smile,
  Clock
} from "lucide-react";
import { useLocation } from "wouter";
import { Link } from "wouter";
import { useState, useMemo } from "react";
import { SalesTrendChart, ProductSalesChart, StoreSalesComparison, SalesMetrics } from "@/components/SalesChart";
import { Line, Bar, Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

// Enregistrer les composants Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

type TimePeriod = "day" | "week" | "month" | "year";

export default function Dashboard() {
  const [, navigate] = useLocation();
  const [timePeriod, setTimePeriod] = useState<TimePeriod>("month");
  const [selectedStore, setSelectedStore] = useState<string>("all");
  const [selectedStoreId, setSelectedStoreId] = useState<number>(0);



  // Déterminer le nombre de jours en fonction de la période
  const getDaysFromPeriod = (period: TimePeriod): number => {
    switch (period) {
      case 'day': return 1;
      case 'week': return 7;
      case 'month': return 30;
      case 'year': return 365;
      default: return 30;
    }
  };

  const days = getDaysFromPeriod(timePeriod);
  const storeId = selectedStore === "all" ? undefined : parseInt(selectedStore);

  // Variables temporaires pour les graphiques Recharts
  const salesTrendData: any[] = [];
  const trendLoading = false;
  const productSalesData: any[] = [];
  const productLoading = false;
  const storeComparisonData: any[] = [];
  const storeLoading = false;
  const metricsData: any = null;
  const metricsLoading = false;

  const { data: stores } = trpc.stores.list.useQuery();
  const { data: products } = trpc.products.list.useQuery();
  const { data: locations } = trpc.planogramLocations.list.useQuery();
  const { data: anomalies } = trpc.anomalies.byPlanogram.useQuery({ planogramId: 1 }, { enabled: false });
  const { data: stockData } = trpc.stock.history.useQuery({ 
    storeId: selectedStore === "all" ? 1 : parseInt(selectedStore), 
    productId: 1,
    startDate: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000)
  }, { enabled: false });

  // Charger les KPIs stratégiques
  const { data: revenuePerSqm } = trpc.kpis.revenuePerSqm.useQuery(
    { storeId: selectedStoreId },
    { enabled: selectedStoreId > 0 }
  );
  const { data: rotationByCategory } = trpc.kpis.rotationByCategory.useQuery(
    { storeId: selectedStoreId },
    { enabled: selectedStoreId > 0 }
  );
  const { data: stockoutRate } = trpc.kpis.stockoutRate.useQuery(
    { storeId: selectedStoreId },
    { enabled: selectedStoreId > 0 }
  );
  const { data: npsScore } = trpc.kpis.npsScore.useQuery(
    { storeId: selectedStoreId },
    { enabled: selectedStoreId > 0 }
  );
  const { data: updateTime } = trpc.kpis.updateTime.useQuery(
    { storeId: selectedStoreId },
    { enabled: selectedStoreId > 0 }
  );

  // Calcul des KPIs
  const kpis = useMemo(() => {
    if (!stores || !products || !locations || !anomalies || !stockData) {
      return {
        totalStores: 0,
        totalProducts: 0,
        totalPlanograms: 0,
        conformityRate: 0,
        totalRevenue: 0,
        stockRotation: 0,
        criticalAlerts: 0,
        revenueChange: 0,
        conformityChange: 0,
        stockChange: 0
      };
    }

    const totalStores = stores.length;
    const totalProducts = products.length;
    const totalPlanograms = locations.length;
    
    // Taux de conformité (basé sur les anomalies)
    const totalAnomalies = anomalies.length;
    const openAnomalies = anomalies.filter((a: any) => a.status === "open").length;
    const conformityRate = totalAnomalies > 0 
      ? ((totalAnomalies - openAnomalies) / totalAnomalies) * 100 
      : 100;

    // Chiffre d'affaires estimé (basé sur les stocks et prix)
    const totalRevenue = stockData.reduce((sum: number, stock: any) => {
      const product = products.find((p: any) => p.id === stock.productId);
      return sum + (product ? (product.unitPrice * stock.quantity) / 100 : 0);
    }, 0);

    // Rotation des stocks (moyenne des mouvements)
    const stockRotation = stockData.length > 0 
      ? stockData.reduce((sum: number, s: any) => sum + s.quantity, 0) / stockData.length 
      : 0;

    // Alertes critiques
    const criticalAlerts = anomalies.filter((a: any) => 
      a.severity === "high" && a.status === "open"
    ).length;

    return {
      totalStores,
      totalProducts,
      totalPlanograms,
      conformityRate: Math.round(conformityRate),
      totalRevenue: Math.round(totalRevenue),
      stockRotation: Math.round(stockRotation),
      criticalAlerts,
      revenueChange: 12.5, // Simulation - à calculer avec historique réel
      conformityChange: 5.2,
      stockChange: -3.1
    };
  }, [stores, products, locations, anomalies, stockData]);

  // Données pour le graphique d'évolution du CA
  const revenueChartData = {
    labels: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin'],
    datasets: [
      {
        label: 'Chiffre d\'affaires (MAD)',
        data: [450000, 520000, 480000, 590000, 620000, kpis.totalRevenue],
        borderColor: 'rgb(34, 197, 94)',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        fill: true,
        tension: 0.4
      }
    ]
  };

  // Données pour le graphique de conformité par magasin
  const conformityChartData = {
    labels: stores?.map(s => s.name.replace('Marjane ', '')) || [],
    datasets: [
      {
        label: 'Taux de conformité (%)',
        data: stores?.map(() => Math.floor(Math.random() * 20) + 80) || [],
        backgroundColor: [
          'rgba(34, 197, 94, 0.8)',
          'rgba(59, 130, 246, 0.8)',
          'rgba(251, 146, 60, 0.8)',
          'rgba(168, 85, 247, 0.8)',
        ],
      }
    ]
  };

  // Données pour le graphique de répartition des anomalies
  const anomaliesChartData = {
    labels: ['Produits mal placés', 'Produits manquants', 'Produits en surplus', 'Produits endommagés'],
    datasets: [
      {
        data: [
          anomalies?.filter((a: any) => a.type === "misplaced").length || 0,
          anomalies?.filter((a: any) => a.type === "missing").length || 0,
          anomalies?.filter((a: any) => a.type === "excess").length || 0,
          anomalies?.filter((a: any) => a.type === "damaged").length || 0,
        ],
        backgroundColor: [
          'rgba(239, 68, 68, 0.8)',
          'rgba(251, 146, 60, 0.8)',
          'rgba(234, 179, 8, 0.8)',
          'rgba(168, 85, 247, 0.8)',
        ],
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'bottom' as const,
      },
    },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="container py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate("/")}
                className="text-slate-600 hover:text-slate-900"
                title="Retour à l'accueil"
              >
                <ArrowLeft className="w-6 h-6" />
              </button>
              <div>
                <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
                  <BarChart3 className="w-8 h-8 text-emerald-600" />
                  Dashboard Analytique
                </h1>
                <p className="text-slate-600 mt-1">Vue d'ensemble de la performance merchandising</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Select value={timePeriod} onValueChange={(value) => setTimePeriod(value as TimePeriod)}>
                <SelectTrigger className="w-40">
                  <Calendar className="w-4 h-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="day">Aujourd'hui</SelectItem>
                  <SelectItem value="week">Cette semaine</SelectItem>
                  <SelectItem value="month">Ce mois</SelectItem>
                  <SelectItem value="year">Cette année</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm" className="gap-2">
                <Download className="w-4 h-4" />
                Exporter
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container py-8">
        {/* Tabs */}
        <Tabs defaultValue="analytics" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="kpis">KPIs Stratégiques</TabsTrigger>
          </TabsList>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Évolution du CA */}
          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle className="text-lg">Évolution du chiffre d'affaires</CardTitle>
              <CardDescription>Tendance sur les 6 derniers mois</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <Line data={revenueChartData} options={chartOptions} />
              </div>
            </CardContent>
          </Card>

          {/* Conformité par magasin */}
          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle className="text-lg">Conformité par magasin</CardTitle>
              <CardDescription>Taux de conformité des planogrammes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <Bar data={conformityChartData} options={chartOptions} />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recharts - Sales Analytics */}
        <div className="space-y-6 mt-8">
          {/* Sales Trend Chart */}
          <SalesTrendChart 
            data={salesTrendData || []}
            loading={trendLoading}
          />

          {/* Product Sales and Store Comparison */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ProductSalesChart 
              data={productSalesData || []}
              loading={productLoading}
            />
            <StoreSalesComparison 
              data={storeComparisonData || []}
              loading={storeLoading}
            />
          </div>

          {/* Sales Metrics */}
          <SalesMetrics 
            metrics={metricsData || null}
            loading={metricsLoading}
          />
        </div>

        {/* Bottom Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
          {/* Répartition des anomalies */}
          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle className="text-lg">Répartition des anomalies</CardTitle>
              <CardDescription>Types d'anomalies détectées</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <Doughnut data={anomaliesChartData} options={chartOptions} />
              </div>
            </CardContent>
          </Card>

          {/* Statistiques générales */}
          <Card className="border-slate-200 lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-lg">Statistiques générales</CardTitle>
              <CardDescription>Vue d'ensemble du réseau</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                    <span className="text-slate-600">Magasins actifs</span>
                    <span className="text-2xl font-bold text-slate-900">{kpis.totalStores}</span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                    <span className="text-slate-600">Produits référencés</span>
                    <span className="text-2xl font-bold text-slate-900">{kpis.totalProducts}</span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                    <span className="text-slate-600">Planogrammes actifs</span>
                    <span className="text-2xl font-bold text-slate-900">{kpis.totalPlanograms}</span>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-emerald-50 rounded-lg">
                    <span className="text-emerald-700">Anomalies résolues</span>
                    <span className="text-2xl font-bold text-emerald-900">
                      {anomalies?.filter((a: any) => a.status === "resolved").length || 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-orange-50 rounded-lg">
                    <span className="text-orange-700">Anomalies en cours</span>
                    <span className="text-2xl font-bold text-orange-900">
                      {anomalies?.filter((a: any) => a.status === "open").length || 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                    <span className="text-blue-700">Recommandations actives</span>
                    <span className="text-2xl font-bold text-blue-900">
                      {anomalies?.length || 0}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
          </TabsContent>

          {/* KPIs Tab */}
          <TabsContent value="kpis" className="space-y-6">
            {/* KPIs Cards Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {/* Taux de conformité */}
              <Card className="border-slate-200 hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <CardDescription className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Taux de conformité
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-baseline justify-between">
                    <div className="text-3xl font-bold text-slate-900">{kpis.conformityRate}%</div>
                    <Badge variant={kpis.conformityChange >= 0 ? "default" : "destructive"} className="gap-1">
                      {kpis.conformityChange >= 0 ? (
                        <TrendingUp className="w-3 h-3" />
                      ) : (
                        <TrendingDown className="w-3 h-3" />
                      )}
                      {Math.abs(kpis.conformityChange)}%
                    </Badge>
                  </div>
                  <p className="text-sm text-slate-600 mt-2">vs. période précédente</p>
                </CardContent>
              </Card>

              {/* Chiffre d'affaires */}
              <Card className="border-slate-200 hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <CardDescription className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-blue-600" />
                    Chiffre d'affaires
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-baseline justify-between">
                    <div className="text-3xl font-bold text-slate-900">
                      {(kpis.totalRevenue / 1000).toFixed(0)}K MAD
                    </div>
                    <Badge variant={kpis.revenueChange >= 0 ? "default" : "destructive"} className="gap-1">
                      {kpis.revenueChange >= 0 ? (
                        <TrendingUp className="w-3 h-3" />
                      ) : (
                        <TrendingDown className="w-3 h-3" />
                      )}
                      {Math.abs(kpis.revenueChange)}%
                    </Badge>
                  </div>
                  <p className="text-sm text-slate-600 mt-2">vs. période précédente</p>
                </CardContent>
              </Card>

              {/* Rotation des stocks */}
              <Card className="border-slate-200 hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <CardDescription className="flex items-center gap-2">
                    <Package className="w-4 h-4 text-orange-600" />
                    Rotation des stocks
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-baseline justify-between">
                    <div className="text-3xl font-bold text-slate-900">{kpis.stockRotation}</div>
                    <Badge variant={kpis.stockChange >= 0 ? "default" : "destructive"} className="gap-1">
                      {kpis.stockChange >= 0 ? (
                        <TrendingUp className="w-3 h-3" />
                      ) : (
                        <TrendingDown className="w-3 h-3" />
                      )}
                      {Math.abs(kpis.stockChange)}%
                    </Badge>
                  </div>
                  <p className="text-sm text-slate-600 mt-2">unités moyennes</p>
                </CardContent>
              </Card>

              {/* Alertes critiques */}
              <Card className="border-slate-200 hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <CardDescription className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-600" />
                    Alertes critiques
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-baseline justify-between">
                    <div className="text-3xl font-bold text-slate-900">{kpis.criticalAlerts}</div>
                    <Link href="/anomalies">
                      <Button variant="ghost" size="sm">Voir →</Button>
                    </Link>
                  </div>
                  <p className="text-sm text-slate-600 mt-2">nécessitent une action</p>
                </CardContent>
              </Card>
            </div>

            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">KPIs par Magasin</h2>
                <p className="text-slate-600 mt-1">Indicateurs détaillés par point de vente</p>
              </div>
              <Select value={selectedStoreId.toString()} onValueChange={(value) => setSelectedStoreId(parseInt(value))}>
                <SelectTrigger className="w-64">
                  <SelectValue placeholder="Sélectionnez un magasin" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">Tous les magasins</SelectItem>
                  {stores?.map((store: any) => (
                    <SelectItem key={store.id} value={store.id.toString()}>
                      {store.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* KPIs Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {/* CA/m² */}
              <Card className="border-slate-200 hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <CardDescription className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-blue-600" />
                    CA/m²
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-slate-900">
                    {typeof revenuePerSqm === 'number' ? (revenuePerSqm as number).toFixed(0) : (revenuePerSqm?.[0]?.revenuePerSqm as number)?.toFixed(0) || "-"} MAD
                  </div>
                  <p className="text-xs text-slate-600 mt-2">Chiffre d'affaires par m²</p>
                </CardContent>
              </Card>

              {/* Rotation */}
              <Card className="border-slate-200 hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <CardDescription className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-emerald-600" />
                    Rotation
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-slate-900">
                    {typeof rotationByCategory === 'object' && rotationByCategory?.[0]?.rotationRate ? rotationByCategory[0].rotationRate.toFixed(1) : "-"}x
                  </div>
                  <p className="text-xs text-slate-600 mt-2">Rotation des stocks</p>
                </CardContent>
              </Card>

              {/* Rupture */}
              <Card className="border-slate-200 hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <CardDescription className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-orange-600" />
                    Rupture
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-slate-900">
                    {typeof stockoutRate === 'number' ? (stockoutRate as number).toFixed(1) : (stockoutRate?.stockoutRate as number)?.toFixed(1) || "-"}%
                  </div>
                  <p className="text-xs text-slate-600 mt-2">Taux de rupture</p>
                </CardContent>
              </Card>

              {/* NPS */}
              <Card className="border-slate-200 hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <CardDescription className="flex items-center gap-2">
                    <Package className="w-4 h-4 text-purple-600" />
                    NPS
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-slate-900">
                    {typeof npsScore === 'number' ? npsScore : npsScore?.npsScore || "-"}
                  </div>
                  <p className="text-xs text-slate-600 mt-2">Net Promoter Score</p>
                </CardContent>
              </Card>

              {/* Temps d'actualisation */}
              <Card className="border-slate-200 hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <CardDescription className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-pink-600" />
                    Actualisation
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-slate-900">
                    {typeof updateTime === 'number' ? updateTime : updateTime?.averageDelay || "-"}h
                  </div>
                  <p className="text-xs text-slate-600 mt-2">Temps de mise à jour</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
