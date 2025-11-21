import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, TrendingUp, TrendingDown, Package, AlertCircle, BarChart3 } from "lucide-react";
import { Link } from "wouter";
import { useState, useMemo } from "react";
import { Line, Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function StockTracking() {
  const { data: stores } = trpc.stores.list.useQuery();
  const { data: products } = trpc.products.list.useQuery();
  
  const [selectedStoreId, setSelectedStoreId] = useState<number | null>(null);
  const [selectedZoneId, setSelectedZoneId] = useState<number | null>(null);
  const [selectedPlanogramId, setSelectedPlanogramId] = useState<number | null>(null);
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  
  // Charger les zones du magasin sélectionné
  const { data: zones } = trpc.zones.byStore.useQuery(
    { storeId: selectedStoreId || 0 },
    { enabled: !!selectedStoreId }
  );
  
  // Charger les planogrammes du magasin sélectionné
  const { data: allPlanograms } = trpc.planograms.byStore.useQuery(
    { storeId: selectedStoreId || 0 },
    { enabled: !!selectedStoreId }
  );
  
  // Charger les emplacements pour obtenir les zoneId
  const { data: planogramLocations } = trpc.planogramLocations.byStore.useQuery(
    { storeId: selectedStoreId || 0 },
    { enabled: !!selectedStoreId }
  );
  
  // Filtrer les planogrammes par zone si une zone est sélectionnée
  const planograms = useMemo(() => {
    if (!allPlanograms || !planogramLocations) return [];
    
    // Si aucune zone sélectionnée ou "Toutes les zones", retourner tous les planogrammes
    if (!selectedZoneId || selectedZoneId === 0) return allPlanograms;
    
    // Filtrer les planogrammes dont le locationId correspond à une location avec le bon zoneId
    const locationsInZone = planogramLocations
      .filter(loc => loc.zoneId === selectedZoneId)
      .map(loc => loc.id);
    
    return allPlanograms.filter(p => locationsInZone.includes(p.locationId));
  }, [allPlanograms, planogramLocations, selectedZoneId]);

  // Charger les produits du planogramme sélectionné
  const { data: planogramProductsData } = trpc.planograms.getProducts.useQuery(
    { planogramId: selectedPlanogramId || 0 },
    { enabled: !!selectedPlanogramId }
  );
  
  // Filtrer les produits par planogramme si un planogramme est sélectionné
  const filteredProducts = useMemo(() => {
    if (!products) return [];
    
    // Si un planogramme est sélectionné, filtrer les produits du planogramme
    if (selectedPlanogramId && planogramProductsData && planogramProductsData.length > 0) {
      const productIdsInPlanogram = planogramProductsData.map((pp: any) => pp.productId);
      return products.filter(p => productIdsInPlanogram.includes(p.id));
    }
    
    // Si aucun planogramme sélectionné, retourner tous les produits
    return products;
  }, [products, planogramProductsData, selectedPlanogramId]);
  
  // Auto-select first store, zone, planogram and product
  useMemo(() => {
    if (!selectedStoreId && stores && stores.length > 0) {
      setSelectedStoreId(stores[0].id);
    }
    if (!selectedZoneId && zones && zones.length > 0) {
      setSelectedZoneId(zones[0].id);
    }
    if (!selectedPlanogramId && planograms && planograms.length > 0) {
      setSelectedPlanogramId(planograms[0].id);
    }
    if (!selectedProductId && filteredProducts && filteredProducts.length > 0) {
      setSelectedProductId(filteredProducts[0].id);
    }
  }, [stores, zones, planograms, filteredProducts, selectedStoreId, selectedZoneId, selectedPlanogramId, selectedProductId]);

  const { data: stockHistory } = trpc.stock.history.useQuery(
    {
      storeId: selectedStoreId || 0,
      productId: selectedProductId || 0,
    },
    { enabled: !!selectedStoreId && !!selectedProductId }
  );

  const { data: stockSummary } = trpc.stock.summary.useQuery(
    {
      storeId: selectedStoreId || 0,
      productId: selectedProductId || 0,
    },
    { enabled: !!selectedStoreId && !!selectedProductId }
  );

  const { data: forecasts } = trpc.forecasts.list.useQuery(
    {
      storeId: selectedStoreId || 0,
    },
    { enabled: !!selectedStoreId }
  );

  const selectedProduct = useMemo(() => {
    return products?.find(p => p.id === selectedProductId);
  }, [products, selectedProductId]);

  const selectedStore = useMemo(() => {
    return stores?.find(s => s.id === selectedStoreId);
  }, [stores, selectedStoreId]);

  // Process stock history for charts
  const chartData = useMemo(() => {
    if (!stockHistory || stockHistory.length === 0) {
      return null;
    }

    // Group by date and calculate daily stock
    const dailyData = new Map<string, { in: number; out: number; balance: number }>();
    let runningBalance = 0;

    stockHistory.forEach(record => {
      const date = new Date(record.recordedAt).toLocaleDateString('fr-FR');
      const existing = dailyData.get(date) || { in: 0, out: 0, balance: 0 };
      
      if (record.movementType === 'in') {
        existing.in += record.quantity;
        runningBalance += record.quantity;
      } else {
        existing.out += record.quantity;
        runningBalance -= record.quantity;
      }
      
      existing.balance = runningBalance;
      dailyData.set(date, existing);
    });

    const sortedDates = Array.from(dailyData.keys()).sort((a, b) => {
      const dateA = new Date(a.split('/').reverse().join('-'));
      const dateB = new Date(b.split('/').reverse().join('-'));
      return dateA.getTime() - dateB.getTime();
    });

    // Take last 30 days
    const last30Days = sortedDates.slice(-30);

    return {
      labels: last30Days,
      datasets: [
        {
          label: 'Stock disponible',
          data: last30Days.map(date => dailyData.get(date)?.balance || 0),
          borderColor: 'rgb(59, 130, 246)',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          fill: true,
          tension: 0.4,
        },
      ],
    };
  }, [stockHistory]);

  const movementChartData = useMemo(() => {
    if (!stockHistory || stockHistory.length === 0) {
      return null;
    }

    // Group by date
    const dailyData = new Map<string, { in: number; out: number }>();

    stockHistory.forEach(record => {
      const date = new Date(record.recordedAt).toLocaleDateString('fr-FR');
      const existing = dailyData.get(date) || { in: 0, out: 0 };
      
      if (record.movementType === 'in') {
        existing.in += record.quantity;
      } else {
        existing.out += record.quantity;
      }
      
      dailyData.set(date, existing);
    });

    const sortedDates = Array.from(dailyData.keys()).sort((a, b) => {
      const dateA = new Date(a.split('/').reverse().join('-'));
      const dateB = new Date(b.split('/').reverse().join('-'));
      return dateA.getTime() - dateB.getTime();
    });

    const last30Days = sortedDates.slice(-30);

    return {
      labels: last30Days,
      datasets: [
        {
          label: 'Entrées',
          data: last30Days.map(date => dailyData.get(date)?.in || 0),
          backgroundColor: 'rgba(34, 197, 94, 0.8)',
        },
        {
          label: 'Sorties',
          data: last30Days.map(date => dailyData.get(date)?.out || 0),
          backgroundColor: 'rgba(239, 68, 68, 0.8)',
        },
      ],
    };
  }, [stockHistory]);

  const currentStock = stockSummary?.currentStock || 0;
  const totalIn = stockSummary?.totalIn || 0;
  const totalOut = stockSummary?.totalOut || 0;
  const rotationRate = totalIn > 0 ? ((totalOut / totalIn) * 100).toFixed(1) : '0';

  const productForecast = useMemo(() => {
    if (!forecasts || !selectedProductId) return null;
    return forecasts.find(f => f.productId === selectedProductId);
  }, [forecasts, selectedProductId]);

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
              <h1 className="text-3xl font-bold text-slate-900">Suivi des Stocks</h1>
              <p className="text-slate-600 mt-1">Historique et prévisions de stock par produit</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container py-8">
        {/* Filters */}
        <Card className="border-slate-200 mb-6">
          <CardHeader>
            <CardTitle className="text-slate-900">Sélection</CardTitle>
            <CardDescription className="text-slate-600">Choisissez un magasin, une zone et un produit</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="text-sm font-medium text-slate-700 mb-2 block">Magasin</label>
                <Select
                  value={selectedStoreId?.toString() || ""}
                  onValueChange={(value) => {
                    setSelectedStoreId(parseInt(value));
                    setSelectedZoneId(null); // Reset zone when store changes
                    setSelectedPlanogramId(null); // Reset planogram when store changes
                  }}
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
                <label className="text-sm font-medium text-slate-700 mb-2 block">Zone</label>
                <Select
                  value={selectedZoneId?.toString() || ""}
                  onValueChange={(value) => {
                    setSelectedZoneId(parseInt(value));
                    setSelectedPlanogramId(null); // Reset planogram when zone changes
                  }}
                  disabled={!selectedStoreId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Toutes les zones" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">Toutes les zones</SelectItem>
                    {zones?.map((zone: any) => (
                      <SelectItem key={zone.id} value={zone.id.toString()}>
                        {zone.name} ({zone.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 mb-2 block">Planogramme</label>
                <Select
                  value={selectedPlanogramId?.toString() || ""}
                  onValueChange={(value) => setSelectedPlanogramId(parseInt(value))}
                  disabled={!selectedStoreId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionnez un planogramme" />
                  </SelectTrigger>
                  <SelectContent>
                    {planograms?.map((planogram: any) => (
                      <SelectItem key={planogram.id} value={planogram.id.toString()}>
                        {planogram.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 mb-2 block">Produit</label>
                <Select
                  value={selectedProductId?.toString() || ""}
                  onValueChange={(value) => setSelectedProductId(parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionnez un produit" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredProducts?.map((product) => (
                      <SelectItem key={product.id} value={product.id.toString()}>
                        {product.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {selectedStoreId && selectedProductId && (
          <>
            {/* KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <Card className="border-slate-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
                    <Package className="w-4 h-4" />
                    Stock Actuel
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-slate-900">{currentStock}</div>
                  <p className="text-sm text-slate-600 mt-1">unités disponibles</p>
                </CardContent>
              </Card>

              <Card className="border-slate-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-green-600" />
                    Entrées Totales
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green-600">{totalIn}</div>
                  <p className="text-sm text-slate-600 mt-1">unités reçues</p>
                </CardContent>
              </Card>

              <Card className="border-slate-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
                    <TrendingDown className="w-4 h-4 text-red-600" />
                    Sorties Totales
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-red-600">{totalOut}</div>
                  <p className="text-sm text-slate-600 mt-1">unités vendues</p>
                </CardContent>
              </Card>

              <Card className="border-slate-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-blue-600" />
                    Taux de Rotation
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-blue-600">{rotationRate}%</div>
                  <p className="text-sm text-slate-600 mt-1">efficacité stock</p>
                </CardContent>
              </Card>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* Stock Evolution Chart */}
              <Card className="border-slate-200">
                <CardHeader>
                  <CardTitle className="text-slate-900">Évolution du Stock (30 derniers jours)</CardTitle>
                  <CardDescription className="text-slate-600">
                    Tendance du stock disponible
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {chartData ? (
                    <Line
                      data={chartData}
                      options={{
                        responsive: true,
                        maintainAspectRatio: true,
                        plugins: {
                          legend: {
                            display: false,
                          },
                        },
                        scales: {
                          y: {
                            beginAtZero: true,
                          },
                        },
                      }}
                    />
                  ) : (
                    <div className="text-center py-8 text-slate-600">
                      Aucune donnée disponible
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Movement Chart */}
              <Card className="border-slate-200">
                <CardHeader>
                  <CardTitle className="text-slate-900">Mouvements de Stock (30 derniers jours)</CardTitle>
                  <CardDescription className="text-slate-600">
                    Entrées vs Sorties quotidiennes
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {movementChartData ? (
                    <Bar
                      data={movementChartData}
                      options={{
                        responsive: true,
                        maintainAspectRatio: true,
                        scales: {
                          y: {
                            beginAtZero: true,
                          },
                        },
                      }}
                    />
                  ) : (
                    <div className="text-center py-8 text-slate-600">
                      Aucune donnée disponible
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Forecast */}
            {productForecast && (
              <Card className="border-slate-200">
                <CardHeader>
                  <CardTitle className="text-slate-900 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-purple-600" />
                    Prévisions de Vente
                  </CardTitle>
                  <CardDescription className="text-slate-600">
                    Prévisions basées sur l'historique et les tendances
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <div className="text-sm text-slate-600 mb-1">Quantité Prévue</div>
                      <div className="text-2xl font-bold text-slate-900">
                        {productForecast.predictedQuantity} unités
                      </div>
                      <div className="text-sm text-slate-600 mt-1">
                        pour {new Date(productForecast.forecastDate).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-slate-600 mb-1">Revenu Prévu</div>
                      <div className="text-2xl font-bold text-green-600">
                        {(productForecast.predictedRevenue / 100).toLocaleString()} DH
                      </div>
                      <div className="text-sm text-slate-600 mt-1">
                        estimation de chiffre d'affaires
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-slate-600 mb-1">Confiance</div>
                      <div className="flex items-center gap-2">
                        <div className="text-2xl font-bold text-blue-600">
                          {productForecast.confidence}%
                        </div>
                        <Badge variant={productForecast.confidence >= 80 ? "default" : "secondary"}>
                          {productForecast.confidence >= 80 ? "Élevée" : "Moyenne"}
                        </Badge>
                      </div>
                      <div className="text-sm text-slate-600 mt-1">
                        algorithme: {productForecast.algorithm}
                      </div>
                    </div>
                  </div>

                  {/* Alert if stock is low */}
                  {currentStock < productForecast.predictedQuantity * 0.5 && (
                    <div className="mt-4 p-4 bg-orange-50 border border-orange-200 rounded-lg flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <div className="font-semibold text-orange-900">Alerte Stock Faible</div>
                        <div className="text-sm text-orange-800 mt-1">
                          Le stock actuel ({currentStock} unités) est inférieur à 50% de la demande prévue.
                          Recommandation : Réapprovisionner {Math.ceil(productForecast.predictedQuantity * 0.7 - currentStock)} unités.
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </>
        )}
      </main>
    </div>
  );
}
