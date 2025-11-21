import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  RotateCcw, 
  AlertTriangle,
  Smile,
  Clock,
  Target,
  ArrowLeft
} from "lucide-react";
import { Link } from "wouter";
import { Bar, Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

export default function StrategicKPIs() {
  const [selectedStoreId, setSelectedStoreId] = useState<number>(0);

  // Charger les magasins
  const { data: stores } = trpc.stores.list.useQuery();

  // Charger les KPIs
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

  // Charger les catégories pour les noms
  const { data: categories } = trpc.categories.list.useQuery();

  // Graphique CA/m²
  const revenueChartData = useMemo(() => {
    if (!revenuePerSqm || !categories) return null;

    return {
      labels: revenuePerSqm.map(r => {
        const cat = categories.find(c => c.id === r.categoryId);
        return cat?.name || `Catégorie ${r.categoryId}`;
      }),
      datasets: [
        {
          label: "CA/m² (MAD)",
          data: revenuePerSqm.map(r => r.revenuePerSqm / 100), // Convertir centimes en MAD
          backgroundColor: "rgba(34, 197, 94, 0.6)",
          borderColor: "rgb(34, 197, 94)",
          borderWidth: 1,
        },
      ],
    };
  }, [revenuePerSqm, categories]);

  // Graphique Taux de rotation
  const rotationChartData = useMemo(() => {
    if (!rotationByCategory || !categories) return null;

    return {
      labels: rotationByCategory.map(r => {
        const cat = categories.find(c => c.id === r.categoryId);
        return cat?.name || `Catégorie ${r.categoryId}`;
      }),
      datasets: [
        {
          label: "Taux de rotation (%)",
          data: rotationByCategory.map(r => r.rotationRate),
          backgroundColor: "rgba(59, 130, 246, 0.6)",
          borderColor: "rgb(59, 130, 246)",
          borderWidth: 1,
        },
      ],
    };
  }, [rotationByCategory, categories]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
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
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 shadow-sm">
        <div className="container py-6">
          <div className="flex items-center gap-4 mb-2">
            <Link href="/">
              <Button variant="ghost" size="sm" className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                Retour
              </Button>
            </Link>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
                <Target className="w-8 h-8 text-indigo-600" />
                KPIs Stratégiques
              </h1>
              <p className="text-slate-600 mt-1">
                Indicateurs de performance clés pour le pilotage stratégique
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container py-8">
        {/* Filtre Magasin */}
        <Card className="mb-6 border-slate-200">
          <CardHeader>
            <CardTitle className="text-lg">Sélectionner un magasin</CardTitle>
          </CardHeader>
          <CardContent>
            <Select
              value={selectedStoreId.toString()}
              onValueChange={(value) => setSelectedStoreId(parseInt(value))}
            >
              <SelectTrigger className="w-full md:w-96">
                <SelectValue placeholder="Choisir un magasin" />
              </SelectTrigger>
              <SelectContent>
                {stores?.map((store) => (
                  <SelectItem key={store.id} value={store.id.toString()}>
                    {store.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {selectedStoreId === 0 ? (
          <Card className="border-slate-200">
            <CardContent className="py-12 text-center text-slate-500">
              Veuillez sélectionner un magasin pour afficher les KPIs
            </CardContent>
          </Card>
        ) : (
          <>
            {/* KPIs Cards Row 1 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {/* KPI 1: CA/m² */}
              <Card className="border-slate-200 hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <CardDescription className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-emerald-600" />
                    CA/m² (catégories stratégiques)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-baseline justify-between">
                    <div className="text-3xl font-bold text-slate-900">
                      {revenuePerSqm && revenuePerSqm.length > 0
                        ? (revenuePerSqm.reduce((sum, r) => sum + r.revenuePerSqm, 0) / revenuePerSqm.length / 100).toFixed(0)
                        : "0"}
                      <span className="text-lg text-slate-600 ml-1">MAD/m²</span>
                    </div>
                    <Badge variant="default" className="gap-1">
                      <Target className="w-3 h-3" />
                      +10%
                    </Badge>
                  </div>
                  <p className="text-sm text-slate-600 mt-2">Objectif: +10% sur 12 mois</p>
                </CardContent>
              </Card>

              {/* KPI 2: Taux de rotation */}
              <Card className="border-slate-200 hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <CardDescription className="flex items-center gap-2">
                    <RotateCcw className="w-4 h-4 text-blue-600" />
                    Taux de rotation
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-baseline justify-between">
                    <div className="text-3xl font-bold text-slate-900">
                      {rotationByCategory && rotationByCategory.length > 0
                        ? (rotationByCategory.reduce((sum, r) => sum + r.rotationRate, 0) / rotationByCategory.length).toFixed(1)
                        : "0"}
                      <span className="text-lg text-slate-600 ml-1">%</span>
                    </div>
                    <Badge variant="default" className="gap-1">
                      <Target className="w-3 h-3" />
                      +15%
                    </Badge>
                  </div>
                  <p className="text-sm text-slate-600 mt-2">Objectif: +15% sur 12 mois</p>
                </CardContent>
              </Card>

              {/* KPI 3: Taux de rupture */}
              <Card className="border-slate-200 hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <CardDescription className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-600" />
                    Taux de rupture
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-baseline justify-between">
                    <div className="text-3xl font-bold text-slate-900">
                      {stockoutRate?.stockoutRate.toFixed(1) || "0"}
                      <span className="text-lg text-slate-600 ml-1">%</span>
                    </div>
                    <Badge 
                      variant={stockoutRate && stockoutRate.stockoutRate < 5 ? "default" : "destructive"} 
                      className="gap-1"
                    >
                      {stockoutRate && stockoutRate.stockoutRate < 5 ? (
                        <TrendingDown className="w-3 h-3" />
                      ) : (
                        <TrendingUp className="w-3 h-3" />
                      )}
                      -30%
                    </Badge>
                  </div>
                  <p className="text-sm text-slate-600 mt-2">
                    Objectif: -30% sur 6 mois · {stockoutRate?.totalStockouts || 0} ruptures
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* KPIs Cards Row 2 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {/* KPI 4: NPS */}
              <Card className="border-slate-200 hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <CardDescription className="flex items-center gap-2">
                    <Smile className="w-4 h-4 text-purple-600" />
                    Satisfaction client (NPS)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-baseline justify-between mb-4">
                    <div className="text-3xl font-bold text-slate-900">
                      {npsScore?.npsScore || 0}
                      <span className="text-lg text-slate-600 ml-1">pts</span>
                    </div>
                    <Badge variant="default" className="gap-1">
                      <Target className="w-3 h-3" />
                      +15 pts
                    </Badge>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <div className="text-center p-2 bg-emerald-50 rounded">
                      <div className="font-bold text-emerald-700">{npsScore?.promoters || 0}</div>
                      <div className="text-slate-600">Promoteurs</div>
                    </div>
                    <div className="text-center p-2 bg-slate-50 rounded">
                      <div className="font-bold text-slate-700">{npsScore?.passives || 0}</div>
                      <div className="text-slate-600">Passifs</div>
                    </div>
                    <div className="text-center p-2 bg-red-50 rounded">
                      <div className="font-bold text-red-700">{npsScore?.detractors || 0}</div>
                      <div className="text-slate-600">Détracteurs</div>
                    </div>
                  </div>
                  <p className="text-sm text-slate-600 mt-3">
                    Objectif: +15 points sur 12 mois · {npsScore?.totalResponses || 0} réponses
                  </p>
                </CardContent>
              </Card>

              {/* KPI 5: Temps d'actualisation */}
              <Card className="border-slate-200 hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <CardDescription className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-orange-600" />
                    Temps d'actualisation planogrammes
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-baseline justify-between mb-4">
                    <div className="text-3xl font-bold text-slate-900">
                      {updateTime?.averageDelay.toFixed(1) || "0"}
                      <span className="text-lg text-slate-600 ml-1">jours</span>
                    </div>
                    <Badge variant="default" className="gap-1">
                      <Target className="w-3 h-3" />
                      -30%
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="p-2 bg-slate-50 rounded">
                      <div className="font-bold text-slate-700">{updateTime?.minDelay.toFixed(1) || "0"}j</div>
                      <div className="text-slate-600">Min</div>
                    </div>
                    <div className="p-2 bg-slate-50 rounded">
                      <div className="font-bold text-slate-700">{updateTime?.maxDelay.toFixed(1) || "0"}j</div>
                      <div className="text-slate-600">Max</div>
                    </div>
                  </div>
                  <p className="text-sm text-slate-600 mt-3">
                    Objectif: -30% sur 6 mois · {updateTime?.pendingCount || 0} en attente
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Graphique CA/m² */}
              <Card className="border-slate-200">
                <CardHeader>
                  <CardTitle className="text-lg">CA/m² par catégorie</CardTitle>
                  <CardDescription>Chiffre d'affaires par m² de surface</CardDescription>
                </CardHeader>
                <CardContent>
                  {revenueChartData ? (
                    <div className="h-64">
                      <Bar data={revenueChartData} options={chartOptions} />
                    </div>
                  ) : (
                    <div className="h-64 flex items-center justify-center text-slate-500">
                      Aucune donnée disponible
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Graphique Taux de rotation */}
              <Card className="border-slate-200">
                <CardHeader>
                  <CardTitle className="text-lg">Taux de rotation par catégorie</CardTitle>
                  <CardDescription>Efficacité de rotation des stocks</CardDescription>
                </CardHeader>
                <CardContent>
                  {rotationChartData ? (
                    <div className="h-64">
                      <Bar data={rotationChartData} options={chartOptions} />
                    </div>
                  ) : (
                    <div className="h-64 flex items-center justify-center text-slate-500">
                      Aucune donnée disponible
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
