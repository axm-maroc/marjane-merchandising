import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, LayoutGrid, MapPin, TrendingUp, Plus } from "lucide-react";
import { Link } from "wouter";

export default function Planograms() {
  const { data: stores, isLoading: storesLoading } = trpc.stores.list.useQuery();
  const { data: locations, isLoading: locationsLoading } = trpc.planogramLocations.list.useQuery();

  const isLoading = storesLoading || locationsLoading;

  // Grouper les emplacements par magasin
  const locationsByStore = locations?.reduce((acc: Record<number, any[]>, location: any) => {
    if (!acc[location.storeId]) {
      acc[location.storeId] = [];
    }
    acc[location.storeId].push(location);
    return acc;
  }, {} as Record<number, typeof locations>);

  const statusConfig = {
    draft: { label: "Brouillon", color: "bg-gray-100 text-gray-800" },
    active: { label: "Actif", color: "bg-green-100 text-green-800" },
    archived: { label: "Archivé", color: "bg-orange-100 text-orange-800" },
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
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
                <LayoutGrid className="w-8 h-8 text-green-600" />
                Planogrammes 2D/3D
              </h1>
              <p className="text-slate-600 mt-1">Gérez vos planogrammes de rayonnage par magasin</p>
            </div>
            <Link href="/planogram/create">
              <Button size="lg">
                <Plus className="w-5 h-5 mr-2" />
                Créer un Planogramme
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container py-8">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
          </div>
        ) : stores && stores.length > 0 ? (
          <div className="space-y-8">
            {stores.map((store) => {
              const storeLocations = locationsByStore?.[store.id] || [];
              
              return (
                <Card key={store.id} className="border-slate-200">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-2xl text-slate-900 flex items-center gap-2">
                          {store.name}
                        </CardTitle>
                        <CardDescription className="text-slate-600 flex items-center gap-2 mt-2">
                          <MapPin className="w-4 h-4" />
                          {store.city} • {store.surface} m²
                        </CardDescription>
                      </div>
                      <Link href={`/stores/${store.id}`}>
                        <Button variant="outline">
                          Voir le magasin
                        </Button>
                      </Link>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {storeLocations.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {storeLocations.map((location: any) => (
                          <Link key={location.id} href={`/planograms/location/${location.id}`}>
                            <Card className="hover:shadow-lg transition-shadow cursor-pointer border-slate-200 h-full">
                              <CardHeader>
                                <CardTitle className="text-lg text-slate-900">{location.name}</CardTitle>
                                <CardDescription className="text-slate-600">
                                  {location.section} - {location.aisle}
                                </CardDescription>
                              </CardHeader>
                              <CardContent>
                                <div className="space-y-3">
                                  <div className="flex items-center justify-between text-sm">
                                    <span className="text-slate-600">Dimensions</span>
                                    <span className="font-medium text-slate-900">
                                      {location.width}cm × {location.height}cm
                                    </span>
                                  </div>
                                  <div className="flex items-center justify-between text-sm">
                                    <span className="text-slate-600">Étagères</span>
                                    <span className="font-medium text-slate-900">{location.shelfCount}</span>
                                  </div>
                                  <div className="pt-2">
                                    <Button variant="outline" className="w-full">
                                      Voir le planogramme →
                                    </Button>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          </Link>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-slate-500">
                        <LayoutGrid className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p>Aucun emplacement de planogramme défini pour ce magasin</p>
                        <Link href={`/stores/${store.id}`}>
                          <Button variant="outline" className="mt-4">
                            Créer un emplacement
                          </Button>
                        </Link>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card className="border-slate-200">
            <CardContent className="py-12 text-center">
              <LayoutGrid className="w-16 h-16 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Aucun magasin trouvé</h3>
              <p className="text-slate-600 mb-4">Créez d'abord un magasin pour gérer vos planogrammes</p>
              <Link href="/stores">
                <Button>Aller aux magasins</Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
