import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Grid3x3, Package, BarChart3, Zap } from "lucide-react";
import { Link } from "wouter";
import { useState, useRef, useEffect } from "react";
import { toast } from "sonner";

// Données de démonstration avec images réelles
const DEMO_PRODUCTS = [
  { id: 1, name: 'Coca-Cola 1.5L', price: 15, category: 'Boissons', color: '#DC2626', image: '/products/coca-cola-1-5l.png' },
  { id: 2, name: 'Sprite 1.5L', price: 14, category: 'Boissons', color: '#10B981', image: '/products/sprite-1-5l.png' },
  { id: 3, name: 'Fanta Orange 1.5L', price: 13, category: 'Boissons', color: '#F59E0B', image: '/products/fanta-orange-1-5l.png' },
  { id: 4, name: 'Eau Sidi Ali 1.5L', price: 4, category: 'Boissons', color: '#3B82F6', image: '/products/eau-sidi-ali-1-5l.png' },
  { id: 5, name: 'Riz Taureau 1kg', price: 25, category: 'Épicerie', color: '#8B4513', image: '/products/riz-taureau-1kg.png' },
  { id: 6, name: 'Huile Lesieur 1L', price: 45, category: 'Épicerie', color: '#FCD34D', image: '/products/huile-lesieur-1l.png' },
  { id: 7, name: 'Sucre Cristal 1kg', price: 12, category: 'Épicerie', color: '#FFFFFF', image: '/products/sucre-cristal-1kg.png' },
  { id: 8, name: 'Shampoing Dove 400ml', price: 35, category: 'Hygiène', color: '#EC4899', image: '/products/shampoing-dove-400ml.png' },
  { id: 9, name: 'Déodorant Rexona 150ml', price: 22, category: 'Hygiène', color: '#6366F1', image: '/products/deodorant-rexona-150ml.png' },
  { id: 10, name: 'Dentifrice Signal 100ml', price: 12, category: 'Hygiène', color: '#0891B2', image: '/products/dentifrice-signal-100ml.png' },
];

const DEMO_PLANOGRAMS = [
  { id: 1, name: 'BAZ-5 (Boissons)', location: 'Emplacement BAZ-5', products: [1, 2, 3, 4] },
  { id: 2, name: 'BAZ-6 (Épicerie)', location: 'Emplacement BAZ-6', products: [5, 6, 7] },
  { id: 3, name: 'BAZ-7 (Hygiène)', location: 'Emplacement BAZ-7', products: [8, 9, 10] },
];

type Zone = {
  id: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  assignedPlanogramId?: number;
};

export default function DemoComplete() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [zones, setZones] = useState<Zone[]>([
    { id: '1', name: 'Zone A', x: 50, y: 50, width: 250, height: 200, color: '#3B82F6' },
    { id: '2', name: 'Zone B', x: 350, y: 50, width: 250, height: 200, color: '#10B981' },
    { id: '3', name: 'Zone C', x: 650, y: 50, width: 250, height: 200, color: '#F59E0B' },
  ]);
  const [draggedPlanogramId, setDraggedPlanogramId] = useState<number | null>(null);
  const [selectedZone, setSelectedZone] = useState<Zone | null>(null);

  // Redessiner le canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Fond
    ctx.fillStyle = "#F8FAFC";
    ctx.fillRect(0, 0, 1000, 500);

    // Grille
    ctx.strokeStyle = "#E2E8F0";
    ctx.lineWidth = 1;
    for (let i = 0; i <= 1000; i += 100) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, 500);
      ctx.stroke();
    }
    for (let i = 0; i <= 500; i += 100) {
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(1000, i);
      ctx.stroke();
    }

    // Dessiner les zones
    zones.forEach((zone) => {
      const isSelected = selectedZone?.id === zone.id;

      // Remplissage
      ctx.fillStyle = zone.color + (isSelected ? "40" : "20");
      ctx.fillRect(zone.x, zone.y, zone.width, zone.height);

      // Bordure
      ctx.strokeStyle = isSelected ? zone.color : zone.color + "80";
      ctx.lineWidth = isSelected ? 3 : 2;
      ctx.strokeRect(zone.x, zone.y, zone.width, zone.height);

      // Texte
      ctx.fillStyle = "#1F2937";
      ctx.font = "bold 14px Arial";
      ctx.textAlign = "left";
      ctx.fillText(zone.name, zone.x + 10, zone.y + 25);

      // Planogramme assigné
      if (zone.assignedPlanogramId) {
        const planogram = DEMO_PLANOGRAMS.find(p => p.id === zone.assignedPlanogramId);
        if (planogram) {
          ctx.fillStyle = "#10B981";
          ctx.font = "12px Arial";
          ctx.fillText(`✓ ${planogram.name}`, zone.x + 10, zone.y + 50);
        }
      }
    });
  }, [zones, selectedZone]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const clickedZone = zones.find(zone =>
      x >= zone.x && x <= zone.x + zone.width &&
      y >= zone.y && y <= zone.y + zone.height
    );

    setSelectedZone(clickedZone || null);
  };

  const handleDragPlanogramStart = (planogramId: number) => {
    setDraggedPlanogramId(planogramId);
  };

  const handleDragOver = (e: React.DragEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
  };

  const handleDropPlanogram = (e: React.DragEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (!draggedPlanogramId || !selectedZone) {
      toast.error("Sélectionnez une zone d'abord");
      return;
    }

    const updatedZones = zones.map(zone =>
      zone.id === selectedZone.id
        ? { ...zone, assignedPlanogramId: draggedPlanogramId }
        : zone
    );
    setZones(updatedZones);
    const planogram = DEMO_PLANOGRAMS.find(p => p.id === draggedPlanogramId);
    toast.success(`✅ "${planogram?.name}" assigné à "${selectedZone.name}"`);
    setDraggedPlanogramId(null);
  };

  // Grouper les produits par famille
  const productsByFamily = DEMO_PRODUCTS.reduce((acc, product) => {
    if (!acc[product.category]) {
      acc[product.category] = [];
    }
    acc[product.category].push(product);
    return acc;
  }, {} as Record<string, typeof DEMO_PRODUCTS>);

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
            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-100 rounded-lg">
                <Zap className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-slate-900">Démonstration Complète</h1>
                <p className="text-slate-600 mt-1">Planogrammes avec images réelles + Drag & Drop</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container py-8">
        <Tabs defaultValue="demo" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="demo" className="flex items-center gap-2">
              <Grid3x3 className="w-4 h-4" />
              Drag & Drop
            </TabsTrigger>
            <TabsTrigger value="planograms" className="flex items-center gap-2">
              <Package className="w-4 h-4" />
              Planogrammes
            </TabsTrigger>
            <TabsTrigger value="produits" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Produits
            </TabsTrigger>
            <TabsTrigger value="stats" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Statistiques
            </TabsTrigger>
          </TabsList>

          {/* Onglet Drag & Drop */}
          <TabsContent value="demo" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Canvas */}
              <Card className="lg:col-span-3">
                <CardHeader>
                  <CardTitle>Zone de Dessin - Drag & Drop Fonctionnel</CardTitle>
                  <CardDescription>Glissez un planogramme vers une zone pour l'assigner</CardDescription>
                </CardHeader>
                <CardContent>
                  <canvas
                    ref={canvasRef}
                    width={1000}
                    height={500}
                    onClick={handleCanvasClick}
                    onDragOver={handleDragOver}
                    onDrop={handleDropPlanogram}
                    className="border-2 border-slate-300 rounded-lg bg-white w-full cursor-pointer"
                  />
                  {selectedZone && (
                    <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-sm text-blue-900">
                        <strong>Zone sélectionnée:</strong> {selectedZone.name}
                        {selectedZone.assignedPlanogramId && (
                          <span className="ml-2 text-green-600">
                            ✓ {DEMO_PLANOGRAMS.find(p => p.id === selectedZone.assignedPlanogramId)?.name}
                          </span>
                        )}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Panneau Planogrammes */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Planogrammes</CardTitle>
                  <CardDescription>Glissez vers le canvas</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {DEMO_PLANOGRAMS.map(planogram => (
                    <div
                      key={planogram.id}
                      draggable
                      onDragStart={() => handleDragPlanogramStart(planogram.id)}
                      className="p-3 bg-white border-2 border-slate-200 rounded-lg cursor-move hover:border-blue-400 hover:shadow-md transition-all"
                    >
                      <div className="font-medium text-sm text-slate-900">{planogram.name}</div>
                      <div className="text-xs text-slate-600 mt-1">{planogram.location}</div>
                      <Badge variant="secondary" className="mt-2 text-xs">
                        {planogram.products.length} produits
                      </Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Onglet Planogrammes */}
          <TabsContent value="planograms" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {DEMO_PLANOGRAMS.map(planogram => (
                <Card key={planogram.id}>
                  <CardHeader>
                    <CardTitle className="text-lg">{planogram.name}</CardTitle>
                    <CardDescription>{planogram.location}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="text-sm font-semibold text-slate-700">Produits assignés:</div>
                      <div className="space-y-3">
                        {planogram.products.map(productId => {
                          const product = DEMO_PRODUCTS.find(p => p.id === productId);
                          return (
                            <div
                              key={productId}
                              className="flex items-center gap-3 p-2 bg-slate-50 rounded hover:bg-slate-100 transition-colors"
                            >
                              {product?.image && (
                                <img
                                  src={product.image}
                                  alt={product.name}
                                  className="w-10 h-10 object-cover rounded"
                                />
                              )}
                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium text-slate-900 truncate">
                                  {product?.name}
                                </div>
                                <div className="text-xs text-slate-600">
                                  {product?.price} MAD
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Onglet Produits par Famille */}
          <TabsContent value="produits" className="space-y-6">
            {Object.entries(productsByFamily).map(([family, products]) => (
              <Card key={family}>
                <CardHeader>
                  <CardTitle className="text-lg">{family}</CardTitle>
                  <CardDescription>{products.length} produits</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                    {products.map(product => (
                      <div
                        key={product.id}
                        className="flex flex-col items-center gap-2 p-3 bg-slate-50 rounded-lg hover:shadow-md transition-shadow"
                      >
                        {product.image && (
                          <img
                            src={product.image}
                            alt={product.name}
                            className="w-20 h-20 object-cover rounded"
                          />
                        )}
                        <div className="text-center">
                          <div className="text-xs font-medium text-slate-900 line-clamp-2">
                            {product.name}
                          </div>
                          <div className="text-xs text-slate-600 mt-1">
                            {product.price} MAD
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          {/* Onglet Statistiques */}
          <TabsContent value="stats" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-slate-600">Total Produits</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-slate-900">{DEMO_PRODUCTS.length}</div>
                  <p className="text-xs text-slate-500 mt-1">Produits disponibles</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-slate-600">Familles</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-slate-900">{Object.keys(productsByFamily).length}</div>
                  <p className="text-xs text-slate-500 mt-1">Catégories de produits</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-slate-600">Planogrammes</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-slate-900">{DEMO_PLANOGRAMS.length}</div>
                  <p className="text-xs text-slate-500 mt-1">Planogrammes créés</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-slate-600">Zones</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-slate-900">{zones.length}</div>
                  <p className="text-xs text-slate-500 mt-1">Zones du magasin</p>
                </CardContent>
              </Card>
            </div>

            {/* Tableau des assignations */}
            <Card>
              <CardHeader>
                <CardTitle>Assignations Actuelles</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {zones.map(zone => (
                    <div key={zone.id} className="flex items-center justify-between p-3 bg-slate-50 rounded">
                      <div>
                        <div className="font-medium text-slate-900">{zone.name}</div>
                        {zone.assignedPlanogramId && (
                          <div className="text-sm text-green-600">
                            ✓ {DEMO_PLANOGRAMS.find(p => p.id === zone.assignedPlanogramId)?.name}
                          </div>
                        )}
                      </div>
                      <Badge variant={zone.assignedPlanogramId ? "default" : "secondary"}>
                        {zone.assignedPlanogramId ? "Assignée" : "Vide"}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
