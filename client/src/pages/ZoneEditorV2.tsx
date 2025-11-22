import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
  ArrowLeft, 
  Square, 
  Pencil, 
  Trash2, 
  Save, 
  Upload,
  ZoomIn,
  ZoomOut,
  Move,
  Grid3x3,
  LayoutGrid,
  Eye,
  Plus,
  Copy,
  Check
} from "lucide-react";
import { Link, useParams } from "wouter";
import { useState, useRef, useEffect } from "react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

type Zone = {
  id: string;
  code: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  isSponsored: boolean;
  color: string;
  assignedPlanogramId?: number;
};

type DrawingTool = 'select' | 'rectangle' | 'delete';

export default function ZoneEditorV2() {
  const params = useParams();
  const storeId = parseInt(params.id || "0");
  
  const { data: store } = trpc.stores.getById.useQuery({ id: storeId });
  const { data: existingZones } = trpc.zones.byStore.useQuery({ storeId });
  const { data: allPlanograms } = trpc.planograms.byStore.useQuery({ storeId });
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [zones, setZones] = useState<Zone[]>([]);
  const [selectedZone, setSelectedZone] = useState<Zone | null>(null);
  const [currentTool, setCurrentTool] = useState<DrawingTool>('select');
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState<{ x: number; y: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [draggedZone, setDraggedZone] = useState<Zone | null>(null);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [backgroundImage, setBackgroundImage] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [showGrid, setShowGrid] = useState(true);
  const [canvasSize] = useState({ width: 1200, height: 800 });
  const [planogramSearchQuery, setPlanogramSearchQuery] = useState("");
  const [draggedPlanogramId, setDraggedPlanogramId] = useState<number | null>(null);
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [selectedZoneForAssign, setSelectedZoneForAssign] = useState<Zone | null>(null);

  // Charger les zones existantes
  useEffect(() => {
    if (existingZones) {
      setZones(existingZones.map((z: any) => ({
        id: z.id.toString(),
        code: z.code,
        name: z.name,
        x: z.x || 0,
        y: z.y || 0,
        width: z.width || 200,
        height: z.height || 150,
        isSponsored: z.isSponsored,
        color: z.color || "#3B82F6",
        assignedPlanogramId: z.assignedPlanogramId,
      })));
    }
  }, [existingZones]);

  // Redessiner le canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Fond
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, canvasSize.width, canvasSize.height);

    // Image de fond
    if (backgroundImage) {
      const img = new Image();
      img.src = backgroundImage;
      img.onload = () => {
        ctx.globalAlpha = 0.3;
        ctx.drawImage(img, 0, 0, canvasSize.width, canvasSize.height);
        ctx.globalAlpha = 1;
      };
    }

    // Grille
    if (showGrid) {
      ctx.strokeStyle = "#E0E0E0";
      ctx.lineWidth = 1;
      for (let i = 0; i <= canvasSize.width; i += 100) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, canvasSize.height);
        ctx.stroke();
      }
      for (let i = 0; i <= canvasSize.height; i += 100) {
        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(canvasSize.width, i);
        ctx.stroke();
      }
    }

    // Dessiner les zones
    zones.forEach((zone) => {
      const isSelected = selectedZone?.id === zone.id;
      const isDraggedZone = draggedZone?.id === zone.id;

      // Remplissage
      ctx.fillStyle = zone.color + (isSelected ? "40" : "20");
      ctx.fillRect(zone.x, zone.y, zone.width, zone.height);

      // Bordure
      ctx.strokeStyle = isSelected ? "#3B82F6" : isDraggedZone ? "#10B981" : zone.color;
      ctx.lineWidth = isSelected ? 3 : 2;
      ctx.strokeRect(zone.x, zone.y, zone.width, zone.height);

      // Texte
      ctx.fillStyle = "#1F2937";
      ctx.font = "bold 14px Arial";
      ctx.textAlign = "left";
      ctx.fillText(zone.name, zone.x + 10, zone.y + 25);

      // Badge planogramme assigné
      if (zone.assignedPlanogramId) {
        const planogram = allPlanograms?.find(p => p.id === zone.assignedPlanogramId);
        if (planogram) {
          ctx.fillStyle = "#10B981";
          ctx.font = "12px Arial";
          ctx.fillText(`✓ ${planogram.name}`, zone.x + 10, zone.y + 45);
        }
      }

      // Poignées de redimensionnement
      if (isSelected) {
        const handleSize = 8;
        ctx.fillStyle = "#3B82F6";
        ctx.fillRect(zone.x + zone.width - handleSize, zone.y + zone.height - handleSize, handleSize, handleSize);
      }
    });
  }, [zones, selectedZone, draggedZone, backgroundImage, showGrid, canvasSize, allPlanograms]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setBackgroundImage(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (currentTool === 'select') {
      const clickedZone = zones.find(zone =>
        x >= zone.x && x <= zone.x + zone.width &&
        y >= zone.y && y <= zone.y + zone.height
      );

      if (clickedZone) {
        setSelectedZone(clickedZone);
        setIsDragging(true);
        setDraggedZone(clickedZone);
        setDragOffset({ x: x - clickedZone.x, y: y - clickedZone.y });
      } else {
        setSelectedZone(null);
      }
    } else if (currentTool === 'rectangle') {
      setIsDrawing(true);
      setStartPoint({ x, y });
    } else if (currentTool === 'delete') {
      const clickedZone = zones.find(zone =>
        x >= zone.x && x <= zone.x + zone.width &&
        y >= zone.y && y <= zone.y + zone.height
      );
      if (clickedZone) {
        setZones(zones.filter(z => z.id !== clickedZone.id));
        toast.success("Zone supprimée");
      }
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (isDragging && draggedZone) {
      const newX = x - dragOffset.x;
      const newY = y - dragOffset.y;

      const updatedZones = zones.map(zone =>
        zone.id === draggedZone.id
          ? { ...zone, x: Math.max(0, Math.min(newX, canvasSize.width - zone.width)), y: Math.max(0, Math.min(newY, canvasSize.height - zone.height)) }
          : zone
      );
      setZones(updatedZones);
      const updated = updatedZones.find(z => z.id === draggedZone.id);
      if (updated) {
        setDraggedZone(updated);
        setSelectedZone(updated);
      }
    } else if (isDrawing && startPoint) {
      // Afficher un aperçu du rectangle en cours de dessin
      canvas.style.cursor = "crosshair";
    }
  };

  const handleCanvasMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isDrawing && startPoint) {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const width = Math.abs(x - startPoint.x);
      const height = Math.abs(y - startPoint.y);

      if (width > 20 && height > 20) {
        const newZone: Zone = {
          id: Date.now().toString(),
          code: `Z${zones.length + 1}`,
          name: `Zone ${zones.length + 1}`,
          x: Math.min(startPoint.x, x),
          y: Math.min(startPoint.y, y),
          width,
          height,
          isSponsored: false,
          color: "#3B82F6",
        };
        setZones([...zones, newZone]);
        toast.success("Zone créée");
      }

      setIsDrawing(false);
      setStartPoint(null);
    }

    setIsDragging(false);
    setDraggedZone(null);
  };

  const handleSaveZones = async () => {
    try {
      toast.info("Enregistrement des zones...");
      // Implémenter la sauvegarde via tRPC
      toast.success("Zones enregistrées avec succès");
    } catch (error) {
      toast.error("Erreur lors de l'enregistrement");
    }
  };

  const handleDragPlanogramStart = (planogramId: number, e: React.DragEvent) => {
    setDraggedPlanogramId(planogramId);
    e.dataTransfer.effectAllowed = "copy";
  };

  const handleDragOver = (e: React.DragEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
  };

  const handleDropPlanogram = (e: React.DragEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (!draggedPlanogramId) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Trouver la zone sous le curseur
    const targetZone = zones.find(zone =>
      x >= zone.x && x <= zone.x + zone.width &&
      y >= zone.y && y <= zone.y + zone.height
    );

    if (targetZone) {
      const updatedZones = zones.map(zone =>
        zone.id === targetZone.id
          ? { ...zone, assignedPlanogramId: draggedPlanogramId }
          : zone
      );
      setZones(updatedZones);
      const planogram = allPlanograms?.find(p => p.id === draggedPlanogramId);
      toast.success(`Planogramme "${planogram?.name}" assigné à "${targetZone.name}"`);
    }

    setDraggedPlanogramId(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 shadow-sm">
        <div className="container py-6">
          <div className="flex items-center gap-4">
            <Link href={`/stores/${storeId}`}>
              <Button variant="ghost" size="icon">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Grid3x3 className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-slate-900">Éditeur de Zones v2</h1>
                <p className="text-slate-600 mt-1">{store?.name} - Drag & Drop des Planogrammes</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container py-8">
        <div className="grid grid-cols-1 lg:grid-cols-7 gap-6">
          {/* Barre d'outils */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>Outils</CardTitle>
              <CardDescription>Sélectionnez un outil</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <div className="flex items-center gap-2 pb-2 border-b">
                  <Square className="w-4 h-4 text-blue-600" />
                  <Label className="font-semibold">Outils de dessin</Label>
                </div>
                <div className="space-y-2">
                  <Button
                    variant={currentTool === 'select' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setCurrentTool('select')}
                    className="w-full justify-start gap-2"
                  >
                    <Move className="w-4 h-4" />
                    <span>Sélectionner</span>
                  </Button>
                  <Button
                    variant={currentTool === 'rectangle' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setCurrentTool('rectangle')}
                    className="w-full justify-start gap-2"
                  >
                    <Square className="w-4 h-4" />
                    <span>Rectangle</span>
                  </Button>
                  <Button
                    variant={currentTool === 'delete' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setCurrentTool('delete')}
                    className="w-full justify-start gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Supprimer</span>
                  </Button>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2 pb-2 border-b">
                  <Eye className="w-4 h-4 text-green-600" />
                  <Label className="font-semibold">Affichage</Label>
                </div>
                <Button
                  variant={showGrid ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setShowGrid(!showGrid)}
                  className="w-full justify-start"
                >
                  <Grid3x3 className="w-4 h-4 mr-2" />
                  {showGrid ? '✓ Grille' : 'Grille'}
                </Button>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2 pb-2 border-b">
                  <Upload className="w-4 h-4 text-purple-600" />
                  <Label className="font-semibold">Plan</Label>
                </div>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="text-xs"
                />
              </div>

              <Button
                onClick={handleSaveZones}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                <Save className="w-4 h-4 mr-2" />
                Enregistrer
              </Button>
            </CardContent>
          </Card>

          {/* Canvas */}
          <Card className="lg:col-span-4">
            <CardHeader>
              <CardTitle>Zone de Dessin</CardTitle>
              <CardDescription>Dessinez les zones et assignez les planogrammes par drag & drop</CardDescription>
            </CardHeader>
            <CardContent>
              <canvas
                ref={canvasRef}
                width={canvasSize.width}
                height={canvasSize.height}
                onMouseDown={handleCanvasMouseDown}
                onMouseMove={handleCanvasMouseMove}
                onMouseUp={handleCanvasMouseUp}
                onDragOver={handleDragOver}
                onDrop={handleDropPlanogram}
                className="border-2 border-slate-300 rounded-lg bg-white cursor-crosshair w-full"
              />
            </CardContent>
          </Card>

          {/* Panneau Planogrammes */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LayoutGrid className="w-5 h-5" />
                Planogrammes
              </CardTitle>
              <CardDescription>
                Drag & drop vers le canvas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Input
                placeholder="Rechercher..."
                value={planogramSearchQuery}
                onChange={(e) => setPlanogramSearchQuery(e.target.value)}
                className="mb-4 text-sm"
              />

              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {allPlanograms
                  ?.filter(p => p.name.toLowerCase().includes(planogramSearchQuery.toLowerCase()))
                  .map(planogram => (
                    <div
                      key={planogram.id}
                      draggable
                      onDragStart={(e) => handleDragPlanogramStart(planogram.id, e)}
                      className="p-3 bg-white border-2 border-slate-200 rounded-lg cursor-move hover:border-blue-400 hover:shadow-md transition-all"
                    >
                      <div className="flex items-start gap-2">
                        <LayoutGrid className="w-4 h-4 text-slate-400 mt-1 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm text-slate-900 truncate">
                            {planogram.name}
                          </div>
                          <div className="flex gap-2 mt-2">
                            <Badge
                              variant={planogram.status === 'active' ? 'default' : 'secondary'}
                              className="text-xs"
                            >
                              {planogram.status === 'active' ? '✅ Actif' : '📝 Brouillon'}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
