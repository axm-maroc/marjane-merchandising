import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, LayoutGrid, Box, Calendar, Target, Image as ImageIcon, FileDown, History, Package } from "lucide-react";
import { Link, useParams } from "wouter";
import { useMemo, useState } from "react";
import PlanogramCanvas from "@/components/PlanogramCanvas";
import { exportPlanogramToPDF } from "@/utils/pdfExport";
import { toast } from "sonner";
import PlanogramEditor from "@/components/PlanogramEditor";
import ProductCard from "@/components/ProductCard";

export default function PlanogramView() {
  const params = useParams();
  const locationId = useMemo(() => parseInt(params.id || "0"), [params.id]);
  
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

  // @ts-ignore - Types will be available after server restart
  const exportCSVMutation = trpc.planograms.exportCSV.useQuery(
    { planogramId: activePlanogram?.id || 0 },
    { enabled: false }
  );

  // @ts-ignore - Types will be available after server restart
  const exportXLSXMutation = trpc.planograms.exportXLSX.useMutation();
  // @ts-ignore - Types will be available after server restart
  const importCSVMutation = trpc.planograms.importCSV.useMutation();
  // @ts-ignore - Types will be available after server restart
  const importXLSXMutation = trpc.planograms.importXLSX.useMutation();

  const handleExportCSV = async () => {
    if (!activePlanogram) return;

    try {
      toast.info("Export CSV en cours...");
      const result = await exportCSVMutation.refetch();
      
      if (result.data) {
        const blob = new Blob([result.data.content], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `planogramme-${activePlanogram.name}-${activePlanogram.version}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success("CSV exporté avec succès !");
      }
    } catch (error) {
      console.error('Error exporting CSV:', error);
      toast.error("Erreur lors de l'export CSV");
    }
  };

  const handleExportXLSX = async () => {
    if (!activePlanogram) return;

    try {
      toast.info("Export XLSX en cours...");
      const result = await exportXLSXMutation.mutateAsync({ planogramId: activePlanogram.id });
      
      if (result.buffer) {
        const buffer = Uint8Array.from(atob(result.buffer), c => c.charCodeAt(0));
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `planogramme-${activePlanogram.name}-${activePlanogram.version}.xlsx`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success("XLSX exporté avec succès !");
      }
    } catch (error) {
      console.error('Error exporting XLSX:', error);
      toast.error("Erreur lors de l'export XLSX");
    }
  };

  const handleImportFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!activePlanogram) return;
    
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      toast.info(`Import de ${file.name} en cours...`);

      const reader = new FileReader();
      reader.onload = async (e) => {
        const content = e.target?.result;
        if (!content) return;

        try {
          let result;
          if (file.name.endsWith('.csv')) {
            result = await importCSVMutation.mutateAsync({
              planogramId: activePlanogram.id,
              csvContent: content as string,
            });
          } else if (file.name.endsWith('.xlsx')) {
            const base64 = btoa(
              new Uint8Array(content as ArrayBuffer)
                .reduce((data, byte) => data + String.fromCharCode(byte), '')
            );
            result = await importXLSXMutation.mutateAsync({
              planogramId: activePlanogram.id,
              fileBase64: base64,
            });
          }

          if (result) {
            if (result.success) {
              toast.success(`${result.imported} produits importés avec succès !`);
              if (result.errors.length > 0) {
                toast.warning(`${result.errors.length} erreurs d'import`);
                console.warn('Import errors:', result.errors);
              }
            } else {
              toast.error(`Erreur d'import: ${result.errors.join(', ')}`);
            }
          }
        } catch (error) {
          console.error('Error importing file:', error);
          toast.error("Erreur lors de l'import");
        }
      };

      if (file.name.endsWith('.csv')) {
        reader.readAsText(file);
      } else {
        reader.readAsArrayBuffer(file);
      }
    } catch (error) {
      console.error('Error reading file:', error);
      toast.error("Erreur lors de la lecture du fichier");
    }

    // Reset input
    event.target.value = '';
  };

  const handleExportPDF = async () => {
    if (!activePlanogram || !location) return;

    try {
      toast.info("Génération du PDF en cours...");

      const view2DElement = document.getElementById('planogram-2d-view');
      const view3DElement = document.getElementById('planogram-3d-view');

      const planogramData = {
        name: activePlanogram.name,
        storeName: 'Magasin',
        location: location.name,
        version: activePlanogram.version,
        salesTarget: activePlanogram.salesTarget || undefined,
        products: (planogramProducts || []).map(pp => ({
          productName: pp.product?.name || 'Produit inconnu',
          quantity: pp.quantity,
          facings: pp.facings,
          shelfLevel: pp.shelfLevel,
        })),
      };

      await exportPlanogramToPDF(planogramData, view2DElement, view3DElement);
      toast.success("PDF exporté avec succès !");
    } catch (error) {
      console.error('Error exporting PDF:', error);
      toast.error("Erreur lors de l'export PDF");
    }
  };
  
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
            <div className="flex items-center gap-3">
              {activePlanogram && (
                <>
                  <Link href={`/planograms/${activePlanogram.id}/history`}>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2"
                    >
                      <History className="w-4 h-4" />
                      Historique
                    </Button>
                  </Link>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleExportPDF}
                    className="gap-2"
                  >
                    <FileDown className="w-4 h-4" />
                    Export PDF
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleExportCSV()}
                    className="gap-2"
                  >
                    <FileDown className="w-4 h-4" />
                    Export CSV
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleExportXLSX()}
                    className="gap-2"
                  >
                    <FileDown className="w-4 h-4" />
                    Export XLSX
                  </Button>
                  <label htmlFor="import-file">
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2"
                      asChild
                    >
                      <span>
                        <FileDown className="w-4 h-4 rotate-180" />
                        Importer
                      </span>
                    </Button>
                  </label>
                  <input
                    id="import-file"
                    type="file"
                    accept=".csv,.xlsx"
                    className="hidden"
                    onChange={handleImportFile}
                  />
                  <Badge variant={activePlanogram.status === "active" ? "default" : "secondary"} className="text-sm px-3 py-1">
                    {activePlanogram.status === "active" ? "Actif" : activePlanogram.status === "draft" ? "Brouillon" : "Archivé"}
                  </Badge>
                </>
              )}
            </div>
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
              <Tabs defaultValue="editor" className="w-full">
                <TabsList className="grid w-full grid-cols-5">
                  <TabsTrigger value="editor">Éditeur</TabsTrigger>
                  <TabsTrigger value="2d">Vue 2D</TabsTrigger>
                  <TabsTrigger value="3d">Vue 3D</TabsTrigger>
                  <TabsTrigger value="products">Produits</TabsTrigger>
                  <TabsTrigger value="photos">Photos</TabsTrigger>
                </TabsList>

                {/* Interactive Editor */}
                <TabsContent value="editor">
                  <PlanogramEditor
                    products={(planogramProducts || []).map(pp => ({
                      id: pp.id,
                      productId: pp.productId,
                      productName: pp.product?.name || 'Produit inconnu',
                      quantity: pp.quantity,
                      facings: pp.facings,
                      shelfLevel: pp.shelfLevel,
                      positionX: pp.positionX,
                    }))}
                    onSave={async (products) => {
                      // @ts-ignore - Type will be available after server restart
                      await trpc.planograms.updateProductsPositions.mutateAsync({
                        planogramId: activePlanogram.id,
                        updates: products.map(p => ({
                          id: p.id,
                          quantity: p.quantity,
                          facings: p.facings,
                          shelfLevel: p.shelfLevel,
                          positionX: p.positionX,
                        })),
                      });
                    }}
                  />
                </TabsContent>

                {/* 2D View */}
                <TabsContent value="2d">
                  <Card className="border-slate-200" id="planogram-2d-view">
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
                  <Card className="border-slate-200" id="planogram-3d-view">
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

                {/* Products List */}
                <TabsContent value="products">
                  <ProductsTabContent products={planogramProducts || []} />
                </TabsContent>

                {/* Photos */}
                <TabsContent value="photos">
                  <Card className="border-slate-200">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-slate-900 flex items-center gap-2">
                            <ImageIcon className="w-5 h-5" />
                            Photos Réelles du Planogramme
                          </CardTitle>
                          <CardDescription className="text-slate-600">
                            Comparez le planogramme prévu avec les photos prises en magasin
                          </CardDescription>
                        </div>
                        <Button
                          onClick={() => {
                            const input = document.createElement('input');
                            input.type = 'file';
                            input.accept = 'image/*';
                            input.multiple = true;
                            input.onchange = async (e: any) => {
                              const files = e.target.files;
                              if (files && files.length > 0 && activePlanogram) {
                                // TODO: Implémenter l'upload vers S3
                                alert(`Upload de ${files.length} photo(s) - Fonctionnalité disponible prochainement`);
                              }
                            };
                            input.click();
                          }}
                          variant="outline"
                          size="sm"
                        >
                          <ImageIcon className="w-4 h-4 mr-2" />
                          Ajouter des photos
                        </Button>
                      </div>
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
                                  {new Date(photo.timestamp).toLocaleDateString("fr-FR")}
                                </div>
                                {photo.description && (
                                  <p className="text-sm text-slate-700 mt-1">{photo.description}</p>
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

// Component for 3D Planogram View (CSS 3D perspective)
function Planogram3DView({ location, products }: { location: any; products: any[] }) {
  const shelfCount = location.shelfCount || 5;
  const shelfWidth = location.shelfWidth || 200;
  const shelfHeight = location.shelfHeight || 40;
  const shelfDepth = location.shelfDepth || 50;

  // Group products by shelf level
  const productsByShelf = products.reduce((acc: Record<number, any[]>, product) => {
    const level = product.shelfLevel || 1;
    if (!acc[level]) acc[level] = [];
    acc[level].push(product);
    return acc;
  }, {});

  return (
    <div className="bg-gradient-to-b from-slate-800 to-slate-900 p-8 rounded-lg border border-slate-700 min-h-[600px] overflow-hidden">
      <div 
        className="relative w-full h-[550px]"
        style={{
          perspective: '1200px',
          perspectiveOrigin: '50% 30%',
        }}
      >
        <div 
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
          style={{
            transform: 'rotateX(15deg) rotateY(-25deg)',
            transformStyle: 'preserve-3d',
          }}
        >
          {/* Shelves */}
          {Array.from({ length: shelfCount }, (_, i) => {
            const shelfLevel = shelfCount - i;
            const yPos = i * (shelfHeight + 10);
            const shelfProducts = productsByShelf[shelfLevel] || [];
            
            return (
              <div
                key={i}
                className="absolute"
                style={{
                  transform: `translate3d(0, ${yPos}px, 0)`,
                  transformStyle: 'preserve-3d',
                }}
              >
                {/* Shelf surface */}
                <div
                  className="bg-gradient-to-br from-amber-700 to-amber-900 border-2 border-amber-600"
                  style={{
                    width: `${shelfWidth * 2}px`,
                    height: `${shelfDepth}px`,
                    transform: 'rotateX(90deg)',
                    transformOrigin: 'top',
                  }}
                />
                
                {/* Products on shelf */}
                {shelfProducts.map((product, idx) => {
                  const xPos = (product.positionX || idx * 60) * 2;
                  return (
                    <div
                      key={product.id}
                      className="absolute bg-gradient-to-br from-blue-500 to-blue-700 border border-blue-400 rounded shadow-lg flex items-center justify-center"
                      style={{
                        width: `${(product.width || 30) * 2}px`,
                        height: `${(product.height || 20) * 2}px`,
                        transform: `translate3d(${xPos}px, -${(product.height || 20) * 2}px, ${shelfDepth / 2}px)`,
                        transformStyle: 'preserve-3d',
                      }}
                      title={product.productName}
                    >
                      <span className="text-white text-xs font-bold truncate px-1">
                        {product.productName?.substring(0, 8)}
                      </span>
                    </div>
                  );
                })}
              </div>
            );
          })}
          
          {/* Back panel */}
          <div
            className="absolute bg-gradient-to-b from-slate-700 to-slate-800 border-2 border-slate-600"
            style={{
              width: `${shelfWidth * 2}px`,
              height: `${(shelfHeight + 10) * shelfCount}px`,
              transform: 'translateZ(-10px)',
            }}
          />
        </div>
      </div>
      
      <div className="text-center mt-4 text-slate-400 text-sm">
        Vue 3D en perspective • {products.length} produits affichés
      </div>
    </div>
  );
}

// Interactive Planogram Editor Component
function InteractivePlanogramEditor({ 
  location, 
  activePlanogram, 
  planogramProducts 
}: { 
  location: any; 
  activePlanogram: any; 
  planogramProducts: any[];
}) {
  const utils = trpc.useUtils();
  const { data: allProducts } = trpc.products.list.useQuery();
  
  const [placedProducts, setPlacedProducts] = useState<any[]>(
    planogramProducts.map(pp => ({
      productId: pp.productId,
      product: pp.product,
      x: pp.positionX || 0,
      y: 10,
      width: (pp.product?.width || 80) * (pp.facings || 1),
      height: pp.product?.height || 200,
      shelfLevel: pp.shelfLevel || 0,
    }))
  );

  const handleProductPlaced = (placement: any) => {
    setPlacedProducts(prev => [...prev, placement]);
    // TODO: Save to database
  };

  const handleProductRemoved = (productId: number) => {
    setPlacedProducts(prev => prev.filter(p => p.productId !== productId));
    // TODO: Remove from database
  };

  const handleProductMoved = (productId: number, x: number, y: number, shelfLevel: number) => {
    setPlacedProducts(prev => 
      prev.map(p => 
        p.productId === productId 
          ? { ...p, x, y, shelfLevel }
          : p
      )
    );
    // TODO: Update in database
  };

  const availableProducts = (allProducts || []).map(p => ({
    id: p.id,
    name: p.name,
    imageUrl: p.photoUrl || '',
    category: 'Produit',
  }));

  return (
    <Card className="border-slate-200">
      <CardHeader>
        <CardTitle className="text-slate-900">Éditeur Interactif de Planogramme</CardTitle>
        <CardDescription className="text-slate-600">
          Glissez-déposez les produits pour créer votre planogramme
        </CardDescription>
      </CardHeader>
      <CardContent>
        <PlanogramCanvas
          products={availableProducts}
          placedProducts={placedProducts}
          shelfWidth={location.shelfWidth * 0.15}
          shelfHeight={location.shelfHeight * 0.15 * location.shelfCount}
          shelfLevels={location.shelfCount}
          onProductPlaced={handleProductPlaced}
          onProductRemoved={handleProductRemoved}
          onProductMoved={handleProductMoved}
        />
      </CardContent>
    </Card>
  );
}

// Composant pour l'onglet Produits avec filtres et recherche
function ProductsTabContent({ products }: { products: any[] }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'name' | 'price' | 'category'>('name');

  // Extraire les catégories uniques
  const categories = Array.from(
    new Set(products.map(p => p.product?.category || 'Sans catégorie'))
  ).sort();

  // Filtrer et trier les produits
  const filteredProducts = products
    .filter(item => {
      const product = item.product;
      if (!product) return false;
      
      const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           (product.brand || '').toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = !selectedCategory || product.category === selectedCategory;
      
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      const prodA = a.product;
      const prodB = b.product;
      
      switch (sortBy) {
        case 'price':
          return (prodB.unitPrice || 0) - (prodA.unitPrice || 0);
        case 'category':
          return (prodA.category || '').localeCompare(prodB.category || '');
        case 'name':
        default:
          return (prodA.name || '').localeCompare(prodB.name || '');
      }
    });

  return (
    <Card className="border-slate-200">
      <CardHeader>
        <CardTitle className="text-slate-900">Produits du Planogramme</CardTitle>
        <CardDescription className="text-slate-600">
          Liste détaillée des {filteredProducts.length} produits avec photos et descriptions
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Barre de recherche */}
          <div className="flex gap-3">
            <Input
              placeholder="Rechercher par nom ou marque..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1"
            />
          </div>

          {/* Filtres et tri */}
          <div className="flex gap-2 flex-wrap">
            {/* Filtre par catégorie */}
            <select
              value={selectedCategory || ''}
              onChange={(e) => setSelectedCategory(e.target.value || null)}
              className="px-3 py-2 border border-slate-200 rounded-md text-sm bg-white"
            >
              <option value="">Toutes les catégories</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>

            {/* Tri */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 border border-slate-200 rounded-md text-sm bg-white"
            >
              <option value="name">Trier par nom</option>
              <option value="price">Trier par prix</option>
              <option value="category">Trier par catégorie</option>
            </select>
          </div>

          {/* Liste des produits */}
          {filteredProducts.length > 0 ? (
            <div className="space-y-3 max-h-[600px] overflow-y-auto">
              {filteredProducts.map((item) => (
                <ProductCard
                  key={item.id}
                  product={item.product || {
                    id: item.productId,
                    name: 'Produit inconnu',
                  }}
                  variant="list"
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Package className="w-12 h-12 text-slate-400 mx-auto mb-3" />
              <p className="text-slate-600">Aucun produit ne correspond à votre recherche</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
