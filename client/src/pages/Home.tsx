import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Store, Package, LayoutGrid, TrendingUp, AlertTriangle, Share2, BarChart3, Smartphone, Zap } from "lucide-react";
import { Link } from "wouter";
import { APP_TITLE } from "@/const";

export default function Home() {
  const { data: stores, isLoading: storesLoading } = trpc.stores.list.useQuery();
  const { data: products, isLoading: productsLoading } = trpc.products.list.useQuery();

  const features = [
    {
      icon: BarChart3,
      title: "Dashboard Analytique",
      description: "KPIs et vue d'ensemble de la performance",
      href: "/dashboard",
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
    {
      icon: Store,
      title: "Gestion des Magasins",
      description: "Gérez vos magasins Marjane avec photos et géolocalisation",
      href: "/stores",
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      icon: LayoutGrid,
      title: "Planogrammes 2D/3D",
      description: "Créez et visualisez vos planogrammes de rayonnage",
      href: "/planograms",
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      title: "Suivi des Stocks",
      description: "Historique et prévisions de stock par produit",
      icon: Package,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
      href: "/stock",
    },
    {
      title: "Prévisions IA",
      description: "Recommandations et prévisions de vente intelligentes",
      icon: TrendingUp,
      color: "text-orange-600",
      bgColor: "bg-orange-100",
      href: "/forecasts",
    },
    {
      title: "Détection d'Anomalies",
      description: "Identifiez les écarts entre planogramme prévu et réel",
      icon: AlertTriangle,
      color: "text-red-600",
      bgColor: "bg-red-100",
      href: "/anomalies",
    },
    {
      icon: Share2,
      title: "Partage de Recommandations",
      description: "Partagez vos recommandations merchandising",
      href: "/recommendations",
      color: "text-indigo-600",
      bgColor: "bg-indigo-50",
    },
    {
      icon: Smartphone,
      title: "Application Mobile Terrain",
      description: "Interface mobile pour merchandisers sur le terrain",
      href: "/mobile",
      color: "text-emerald-600",
      bgColor: "bg-emerald-50",
    },
    {
      icon: Zap,
      title: "Simulateur d'Impact",
      description: "Visualisez l'impact des changements de planogrammes sur les KPIs",
      href: "/impact-simulator",
      color: "text-yellow-600",
      bgColor: "bg-yellow-50",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 shadow-sm">
        <div className="container py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">{APP_TITLE}</h1>
              <p className="text-slate-600 mt-1">Solution d'optimisation merchandising omnicanal</p>
            </div>
            <div className="flex gap-4">
              {!storesLoading && stores && (
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{stores.length}</div>
                  <div className="text-sm text-slate-600">Magasins</div>
                </div>
              )}
              {!productsLoading && products && (
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{products.length}</div>
                  <div className="text-sm text-slate-600">Produits</div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container py-12">
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-slate-900 mb-2">Modules Disponibles</h2>
          <p className="text-slate-600">Sélectionnez un module pour commencer</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <Link key={feature.href} href={feature.href}>
                <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full border-slate-200">
                  <CardHeader>
                    <div className={`w-12 h-12 rounded-lg ${feature.bgColor} flex items-center justify-center mb-3`}>
                      <Icon className={`w-6 h-6 ${feature.color}`} />
                    </div>
                    <CardTitle className="text-slate-900">{feature.title}</CardTitle>
                    <CardDescription className="text-slate-600">{feature.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button variant="outline" className="w-full">
                      Accéder →
                    </Button>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>

        {/* Quick Stats */}
        <div className="mt-12">
          <h2 className="text-2xl font-semibold text-slate-900 mb-6">Magasins Marjane</h2>
          {storesLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-slate-600 mt-4">Chargement des magasins...</p>
            </div>
          ) : stores && stores.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {stores.map((store) => (
                <Link key={store.id} href={`/stores/${store.id}`}>
                  <Card className="hover:shadow-md transition-shadow cursor-pointer border-slate-200">
                    <CardHeader>
                      <CardTitle className="text-lg text-slate-900">{store.name}</CardTitle>
                      <CardDescription className="text-slate-600">
                        <div className="flex items-start gap-1">
                          <Store className="w-4 h-4 mt-0.5 flex-shrink-0" />
                          <span className="text-sm">{store.city}</span>
                        </div>
                        {store.surface && (
                          <div className="text-sm mt-1">{store.surface} m²</div>
                        )}
                      </CardDescription>
                    </CardHeader>
                  </Card>
                </Link>
              ))}
            </div>
          ) : (
            <Card className="border-slate-200">
              <CardContent className="py-12 text-center">
                <Store className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                <p className="text-slate-600">Aucun magasin disponible</p>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
