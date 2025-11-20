import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Store, MapPin, Phone, User, ArrowLeft, LayoutGrid, Calendar, Grid3x3, DollarSign } from "lucide-react";
import { Link, useParams } from "wouter";
import { useMemo } from "react";

export default function StoreDetail() {
  const params = useParams();
  const storeId = useMemo(() => parseInt(params.id || "0"), [params.id]);
  
  const { data: store, isLoading: storeLoading } = trpc.stores.getById.useQuery({ id: storeId });
  const { data: zones, isLoading: zonesLoading } = trpc.zones.byStore.useQuery({ storeId });
  const { data: locations, isLoading: locationsLoading } = trpc.planogramLocations.byStore.useQuery({ storeId });

  if (storeLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-slate-600 mt-4">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!store) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="py-12 text-center">
            <Store className="w-16 h-16 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Magasin introuvable</h3>
            <p className="text-slate-600 mb-4">Le magasin demandé n'existe pas</p>
            <Link href="/stores">
              <Button>Retour aux magasins</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 shadow-sm">
        <div className="container py-6">
          <div className="flex items-center gap-4">
            <Link href="/stores">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-slate-900">{store.name}</h1>
              <p className="text-slate-600 mt-1 flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                {store.address}, {store.city}
              </p>
            </div>
            <Link href={`/stores/${storeId}/zones`}>
              <Button variant="outline">
                <LayoutGrid className="w-4 h-4 mr-2" />
                Gérer les Zones
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Store Info */}
          <div className="lg:col-span-1">
            <Card className="border-slate-200">
              <CardHeader>
                <CardTitle className="text-slate-900">Informations du Magasin</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {store.surface && (
                  <div>
                    <div className="text-sm text-slate-600 mb-1">Surface</div>
                    <div className="font-semibold text-slate-900">{store.surface.toLocaleString()} m²</div>
                  </div>
                )}
                {store.phone && (
                  <div>
                    <div className="text-sm text-slate-600 mb-1 flex items-center gap-1">
                      <Phone className="w-4 h-4" />
                      Téléphone
                    </div>
                    <div className="font-semibold text-slate-900">{store.phone}</div>
                  </div>
                )}
                {store.managerName && (
                  <div>
                    <div className="text-sm text-slate-600 mb-1 flex items-center gap-1">
                      <User className="w-4 h-4" />
                      Responsable
                    </div>
                    <div className="font-semibold text-slate-900">{store.managerName}</div>
                  </div>
                )}
                {store.latitude && store.longitude && (
                  <div>
                    <div className="text-sm text-slate-600 mb-1">Coordonnées GPS</div>
                    <div className="text-sm font-mono text-slate-700">
                      {store.latitude}, {store.longitude}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Zones du Magasin */}
          <div className="lg:col-span-2">
            <Card className="border-slate-200">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-slate-900 flex items-center gap-2">
                      <Grid3x3 className="w-5 h-5" />
                      Zones du Magasin
                    </CardTitle>
                    <CardDescription className="text-slate-600">
                      Organisez votre magasin en zones et gérez les contrats de sponsoring
                    </CardDescription>
                  </div>
                  <Link href={`/stores/${storeId}/zones/editor`}>
                    <Button>
                      <Grid3x3 className="w-4 h-4 mr-2" />
                      Éditeur Visuel
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                {zonesLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="text-slate-600 mt-2 text-sm">Chargement des zones...</p>
                  </div>
                ) : zones && zones.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {zones.map((zone) => (
                      <Link key={zone.id} href={`/stores/${storeId}/zones/editor`}>
                        <Card className="hover:shadow-md transition-shadow cursor-pointer border-slate-200">
                          <CardHeader className="pb-3">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <CardTitle className="text-base text-slate-900">{zone.code} - {zone.name}</CardTitle>
                                {zone.location && (
                                  <CardDescription className="text-slate-600 mt-1 text-sm">
                                    {zone.location}
                                  </CardDescription>
                                )}
                              </div>
                              {zone.isSponsored && (
                                <Badge variant="default" className="bg-green-600">
                                  <DollarSign className="w-3 h-3 mr-1" />
                                  Sponsorisée
                                </Badge>
                              )}
                            </div>
                          </CardHeader>
                          <CardContent className="pt-0">
                            <div className="flex items-center justify-between text-sm">
                              {zone.surface && (
                                <div>
                                  <span className="text-slate-600">Surface: </span>
                                  <span className="font-semibold text-slate-900">{zone.surface} m²</span>
                                </div>
                              )}
                              <Badge variant="outline" className={
                                zone.status === 'active' ? 'bg-green-50 text-green-700 border-green-200' :
                                zone.status === 'inactive' ? 'bg-slate-50 text-slate-700 border-slate-200' :
                                'bg-orange-50 text-orange-700 border-orange-200'
                              }>
                                {zone.status === 'active' ? 'Active' : zone.status === 'inactive' ? 'Inactive' : 'Maintenance'}
                              </Badge>
                            </div>
                          </CardContent>
                        </Card>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Grid3x3 className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                    <p className="text-slate-600">Aucune zone définie</p>
                    <p className="text-sm text-slate-500 mt-1">Utilisez l'éditeur visuel pour créer des zones</p>
                    <Link href={`/stores/${storeId}/zones/editor`}>
                      <Button className="mt-4">
                        <Grid3x3 className="w-4 h-4 mr-2" />
                        Créer des Zones
                      </Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Planogram Locations */}
          <div className="lg:col-span-2">
            <Card className="border-slate-200">
              <CardHeader>
                <CardTitle className="text-slate-900 flex items-center gap-2">
                  <LayoutGrid className="w-5 h-5" />
                  Emplacements de Planogrammes
                </CardTitle>
                <CardDescription className="text-slate-600">
                  Gérez les rayonnages et planogrammes de ce magasin
                </CardDescription>
              </CardHeader>
              <CardContent>
                {locationsLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="text-slate-600 mt-2 text-sm">Chargement des emplacements...</p>
                  </div>
                ) : locations && locations.length > 0 ? (
                  <div className="space-y-4">
                    {locations.map((location) => (
                      <Link key={location.id} href={`/planograms/location/${location.id}`}>
                        <Card className="hover:shadow-md transition-shadow cursor-pointer border-slate-200">
                          <CardHeader className="pb-3">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <CardTitle className="text-lg text-slate-900">{location.name}</CardTitle>
                                {location.zone && (
                                  <CardDescription className="text-slate-600 mt-1">
                                    Zone: {location.zone}
                                  </CardDescription>
                                )}
                              </div>
                              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                {location.shelfCount} étagères
                              </Badge>
                            </div>
                          </CardHeader>
                          <CardContent className="pt-0">
                            <div className="grid grid-cols-3 gap-4 text-sm">
                              <div>
                                <div className="text-slate-600">Largeur</div>
                                <div className="font-semibold text-slate-900">{(location.shelfWidth / 10).toFixed(0)} cm</div>
                              </div>
                              <div>
                                <div className="text-slate-600">Hauteur/étag.</div>
                                <div className="font-semibold text-slate-900">{(location.shelfHeight / 10).toFixed(0)} cm</div>
                              </div>
                              <div>
                                <div className="text-slate-600">Profondeur</div>
                                <div className="font-semibold text-slate-900">{(location.shelfDepth / 10).toFixed(0)} cm</div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <LayoutGrid className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                    <p className="text-slate-600">Aucun emplacement de planogramme</p>
                    <p className="text-sm text-slate-500 mt-1">Créez votre premier emplacement pour commencer</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
