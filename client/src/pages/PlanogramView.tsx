import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, LayoutGrid, Box, Calendar, Target, Image as ImageIcon } from "lucide-react";
import { Link, useParams } from "wouter";
import { useMemo, useState } from "react";

export default function PlanogramView() {
  const params = useParams();
  const locationId = useMemo(() => parseInt(params.locationId || "0"), [params.locationId]);
  
  const { data: location } = trpc.planogramLocations.getById.useQuery({ id: locationId });
  const { data: planograms } = trpc.planograms.byLocation.useQuery({ locationId });
  
  const [selectedPlanogramId, setSelectedPlanogramId] = useState<number | null>(null);
  
  const activePlanogram = useMemo(() => {
    if (!planograms || planograms.length === 0) return null;
    if (selectedPlanogramId) {
      return planograms.find(p => p.id === selectedPlanogramId) || planograms[0];
    }
    return planograms.find(p => p.status === "active") || planograms[0];
  }, [planograms, selectedPlanogramId]);
  
  const { data: planogramProducts } = trpc.planograms.getProducts.useQuery(
    { planogramId: activePlanogram?.id || 0 },
    { enabled: !!activePlanogram }
  );
  
  const { data: planogramPhotos } = trpc.planograms.getPhotos.useQuery(
    { planogramId: activePlanogram?.id || 0 },
    { enabled: !!activePlanogram }
  );

  if (!location) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="py-12 text-center">
            <LayoutGrid className="w-16 h-16 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Emplacement introuvable</h3>
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
            <Link href={`/stores/${location.storeId}`}>
              <Button variant="ghost" size="icon">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-slate-900">{location.name}</h1>
              <p className="text-slate-600 mt-1">Zone: {location.zone}</p>
            </div>
            {activePlanogram && (
              <Badge variant={activePlanogram.status === "active" ? "default" : "secondary"} className="text-sm px-3 py-1">
                {activePlanogram.status === "active" ? "Actif" : activePlanogram.status === "draft" ? "Brouillon" : "Archivé"}
              </Badge>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar - Planogram List */}
          <div className="lg:col-span-1">
            <Card className="border-slate-200">
              <CardHeader>
                <CardTitle className="text-slate-900">Versions</CardTitle>
                <CardDescription className="text-slate-600">Sélectionnez un planogramme</CardDescription>
              </CardHeader>
              <CardContent>
                {planograms && planograms.length > 0 ? (
                  <div className="space-y-2">
                    {planograms.map((planogram) => (
                      <button
                        key={planogram.id}
                        onClick={() => setSelectedPlanogramId(planogram.id)}
                        className={`w-full text-left p-3 rounded-lg border transition-all ${
                          activePlanogram?.id === planogram.id
                            ? "border-blue-500 bg-blue-50"
                            : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                        }`}
                      >
                        <div className="font-semibold text-sm text-slate-900">{planogram.name}</div>
                        <div className="text-xs text-slate-600 mt-1">Version {planogram.version}</div>
                        <Badge
                          variant={planogram.status === "active" ? "default" : "secondary"}
                          className="mt-2 text-xs"
                        >
                          {planogram.status}
                        </Badge>
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-600">Aucun planogramme</p>
                )}
              </CardContent>
            </Card>

            {/* Location Info */}
            <Card className="border-slate-200 mt-4">
              <CardHeader>
                <CardTitle className="text-sm text-slate-900">Dimensions du Rayonnage</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div>
                  <div className="text-slate-600">Étagères</div>
                  <div className="font-semibold text-slate-900">{location.shelfCount}</div>
                </div>
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
              </CardContent>
            </Card>
          </div>

          {/* Main Content - Planogram Visualization */}
          <div className="lg:col-span-3">
            {activePlanogram ? (
              <Tabs defaultValue="2d" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="2d">Vue 2D</TabsTrigger>
                  <TabsTrigger value="3d">Vue 3D</TabsTrigger>
                  <TabsTrigger value="photos">Photos Réelles</TabsTrigger>
                </TabsList>

                {/* 2D View */}
                <TabsContent value="2d">
                  <Card className="border-slate-200">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-slate-900">{activePlanogram.name}</CardTitle>
                          <CardDescription className="text-slate-600 mt-1">
                            Vue 2D du planogramme - {planogramProducts?.length || 0} produits placés
                          </CardDescription>
                        </div>
                        {activePlanogram.salesTarget && (
                          <div className="text-right">
                            <div className="text-sm text-slate-600 flex items-center gap-1">
                              <Target className="w-4 h-4" />
                              Objectif
                            </div>
                            <div className="font-bold text-lg text-green-600">
                              {(activePlanogram.salesTarget / 100).toLocaleString()} DH
                            </div>
                          </div>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <Planogram2DView
                        location={location}
                        products={planogramProducts || []}
                      />
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* 3D View */}
                <TabsContent value="3d">
                  <Card className="border-slate-200">
                    <CardHeader>
                      <CardTitle className="text-slate-900 flex items-center gap-2">
                        <Box className="w-5 h-5" />
                        Vue 3D du Planogramme
                      </CardTitle>
                      <CardDescription className="text-slate-600">
                        Visualisation en perspective 3D
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Planogram3DView
                        location={location}
                        products={planogramProducts || []}
                      />
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Photos */}
                <TabsContent value="photos">
                  <Card className="border-slate-200">
                    <CardHeader>
                      <CardTitle className="text-slate-900 flex items-center gap-2">
                        <ImageIcon className="w-5 h-5" />
                        Photos Réelles du Planogramme
                      </CardTitle>
                      <CardDescription className="text-slate-600">
                        Comparez le planogramme prévu avec les photos prises en magasin
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {planogramPhotos && planogramPhotos.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {planogramPhotos.map((photo) => (
                            <div key={photo.id} className="border border-slate-200 rounded-lg overflow-hidden">
                              <img
                                src={photo.url}
                                alt="Photo du planogramme"
                                className="w-full h-64 object-cover"
                              />
                              <div className="p-3 bg-slate-50">
                                <div className="text-sm text-slate-600 flex items-center gap-1">
                                  <Calendar className="w-4 h-4" />
                                  {new Date(photo.takenAt).toLocaleDateString("fr-FR")}
                                </div>
                                {photo.notes && (
                                  <p className="text-sm text-slate-700 mt-1">{photo.notes}</p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-12">
                          <ImageIcon className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                          <p className="text-slate-600">Aucune photo disponible</p>
                          <p className="text-sm text-slate-500 mt-1">Ajoutez des photos du planogramme réel pour comparaison</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            ) : (
              <Card className="border-slate-200">
                <CardContent className="py-12 text-center">
                  <LayoutGrid className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">Aucun planogramme</h3>
                  <p className="text-slate-600">Créez votre premier planogramme pour cet emplacement</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

// Component for 2D Planogram View
function Planogram2DView({ location, products }: { location: any; products: any[] }) {
  const shelfWidth = location.shelfWidth;
  const shelfHeight = location.shelfHeight;
  const shelfCount = location.shelfCount;
  
  // Scale factor for display (1mm = 0.2px for reasonable display)
  const scale = 0.15;
  const displayWidth = shelfWidth * scale;
  const displayHeight = shelfHeight * scale;

  return (
    <div className="bg-slate-50 p-6 rounded-lg border border-slate-200 overflow-x-auto">
      <div
        style={{
          width: `${displayWidth}px`,
          minWidth: "800px",
          margin: "0 auto",
        }}
      >
        {/* Render shelves from top to bottom */}
        {Array.from({ length: shelfCount }).map((_, shelfIndex) => {
          const shelfLevel = shelfCount - 1 - shelfIndex; // Reverse order (top shelf = highest level)
          const shelfProducts = products.filter(p => p.shelfLevel === shelfLevel);

          return (
            <div
              key={shelfLevel}
              className="relative mb-2"
              style={{ height: `${displayHeight}px` }}
            >
              {/* Shelf background */}
              <div className="absolute inset-0 bg-amber-100 border-2 border-amber-600 rounded">
                <div className="absolute top-0 left-0 right-0 h-1 bg-amber-700"></div>
              </div>

              {/* Shelf label */}
              <div className="absolute -left-16 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-700">
                Niveau {shelfLevel + 1}
              </div>

              {/* Products on this shelf */}
              {shelfProducts.map((item) => {
                const product = item.product;
                if (!product) return null;

                const productWidth = (product.width || 80) * item.facings;
                const displayProductWidth = productWidth * scale;
                const displayLeft = item.positionX * scale;

                return (
                  <div
                    key={item.id}
                    className="absolute bottom-1"
                    style={{
                      left: `${displayLeft}px`,
                      width: `${displayProductWidth}px`,
                      height: `${(product.height || 200) * scale}px`,
                    }}
                  >
                    <div className="relative h-full group">
                      {/* Product image or placeholder */}
                      {product.photoUrl ? (
                        <img
                          src={product.photoUrl}
                          alt={product.name}
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <div className="w-full h-full bg-slate-300 rounded flex items-center justify-center">
                          <Box className="w-6 h-6 text-slate-500" />
                        </div>
                      )}

                      {/* Tooltip on hover */}
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-10">
                        <div className="bg-slate-900 text-white text-xs rounded px-2 py-1 whitespace-nowrap">
                          {product.name}
                          <br />
                          {item.facings} facing(s) × {item.quantity}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })}

        {/* Scale indicator */}
        <div className="mt-4 text-center text-sm text-slate-600">
          Largeur totale: {(shelfWidth / 10).toFixed(0)} cm
        </div>
      </div>
    </div>
  );
}

// Component for 3D Planogram View (simplified perspective)
function Planogram3DView({ location, products }: { location: any; products: any[] }) {
  return (
    <div className="bg-gradient-to-b from-slate-100 to-slate-200 p-8 rounded-lg border border-slate-300 min-h-[500px] flex items-center justify-center">
      <div className="text-center">
        <Box className="w-16 h-16 text-slate-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-slate-900 mb-2">Vue 3D</h3>
        <p className="text-slate-600 max-w-md">
          La visualisation 3D interactive sera disponible prochainement.
          <br />
          Elle permettra de voir le rayonnage en perspective avec rotation et zoom.
        </p>
      </div>
    </div>
  );
}
