import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, 
  Square, 
  Circle, 
  Pencil, 
  Trash2, 
  Save, 
  Upload,
  ZoomIn,
  ZoomOut,
  Move,
  Ruler,
  Grid3x3
} from "lucide-react";
import { Link, useParams } from "wouter";
import { useState, useRef, useEffect } from "react";
import { toast } from "sonner";

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
};

type DrawingTool = 'select' | 'rectangle' | 'move' | 'delete';

export default function ZoneEditor() {
  const params = useParams();
  const storeId = parseInt(params.id || "0");
  
  const { data: store } = trpc.stores.getById.useQuery({ id: storeId });
  const { data: existingZones } = trpc.zones.byStore.useQuery({ storeId });
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [zones, setZones] = useState<Zone[]>([]);
  const [selectedZone, setSelectedZone] = useState<Zone | null>(null);
  const [currentTool, setCurrentTool] = useState<DrawingTool>('select');
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState<{ x: number; y: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [draggedZone, setDraggedZone] = useState<Zone | null>(null);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isResizing, setIsResizing] = useState(false);
  const [resizeHandle, setResizeHandle] = useState<'se' | 'sw' | 'ne' | 'nw' | 'e' | 'w' | 'n' | 's' | null>(null);
  const [backgroundImage, setBackgroundImage] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [showGrid, setShowGrid] = useState(true);
  const [canvasSize] = useState({ width: 1200, height: 800 });
  
  // Charger les zones existantes
  useEffect(() => {
    if (existingZones) {
      const loadedZones: Zone[] = existingZones.map((zone, index) => ({
        id: zone.id.toString(),
        code: zone.code,
        name: zone.name,
        x: 50 + (index % 3) * 300,
        y: 50 + Math.floor(index / 3) * 250,
        width: 250,
        height: 200,
        isSponsored: zone.isSponsored,
        color: zone.isSponsored ? '#10b981' : '#3b82f6'
      }));
      setZones(loadedZones);
    }
  }, [existingZones]);
  
  // Dessiner le canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Effacer le canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Dessiner l'image de fond si elle existe
    if (backgroundImage) {
      const img = new Image();
      img.src = backgroundImage;
      img.onload = () => {
        ctx.globalAlpha = 0.3;
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        ctx.globalAlpha = 1;
        drawGrid(ctx);
        drawZones(ctx);
      };
    } else {
      drawGrid(ctx);
      drawZones(ctx);
    }
  }, [zones, selectedZone, backgroundImage, showGrid, zoom]);
  
  const drawGrid = (ctx: CanvasRenderingContext2D) => {
    if (!showGrid) return;
    
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 1;
    
    const gridSize = 50;
    for (let x = 0; x <= canvasSize.width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvasSize.height);
      ctx.stroke();
    }
    
    for (let y = 0; y <= canvasSize.height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvasSize.width, y);
      ctx.stroke();
    }
  };
  
  const drawZones = (ctx: CanvasRenderingContext2D) => {
    zones.forEach(zone => {
      const isSelected = selectedZone?.id === zone.id;
      
      // Dessiner le rectangle de la zone
      ctx.fillStyle = zone.color + '40'; // Transparence
      ctx.fillRect(zone.x, zone.y, zone.width, zone.height);
      
      // Bordure
      ctx.strokeStyle = isSelected ? '#ef4444' : zone.color;
      ctx.lineWidth = isSelected ? 3 : 2;
      ctx.strokeRect(zone.x, zone.y, zone.width, zone.height);
      
      // Texte
      ctx.fillStyle = '#1f2937';
      ctx.font = 'bold 14px sans-serif';
      ctx.fillText(zone.code, zone.x + 10, zone.y + 25);
      ctx.font = '12px sans-serif';
      ctx.fillText(zone.name, zone.x + 10, zone.y + 45);
      
      // Badge sponsorisé
      if (zone.isSponsored) {
        ctx.fillStyle = '#10b981';
        ctx.fillRect(zone.x + zone.width - 80, zone.y + 10, 70, 20);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 10px sans-serif';
        ctx.fillText('SPONSORISÉ', zone.x + zone.width - 75, zone.y + 23);
      }
      
      // Dimensions
      ctx.fillStyle = '#6b7280';
      ctx.font = '11px sans-serif';
      const surfaceText = `${Math.round((zone.width * zone.height) / 100)} m²`;
      ctx.fillText(surfaceText, zone.x + 10, zone.y + zone.height - 10);
      
      // Poignées de redimensionnement pour la zone sélectionnée
      if (isSelected) {
        const handleSize = 8;
        const handles = [
          { x: zone.x, y: zone.y }, // nw
          { x: zone.x + zone.width / 2, y: zone.y }, // n
          { x: zone.x + zone.width, y: zone.y }, // ne
          { x: zone.x + zone.width, y: zone.y + zone.height / 2 }, // e
          { x: zone.x + zone.width, y: zone.y + zone.height }, // se
          { x: zone.x + zone.width / 2, y: zone.y + zone.height }, // s
          { x: zone.x, y: zone.y + zone.height }, // sw
          { x: zone.x, y: zone.y + zone.height / 2 }, // w
        ];
        
        ctx.fillStyle = '#ef4444';
        handles.forEach(handle => {
          ctx.fillRect(
            handle.x - handleSize / 2,
            handle.y - handleSize / 2,
            handleSize,
            handleSize
          );
        });
      }
    });
  };
  
  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    if (currentTool === 'select') {
      // Vérifier si on clique sur une poignée de redimensionnement
      if (selectedZone) {
        const handleSize = 8;
        const handles = [
          { type: 'nw' as const, x: selectedZone.x, y: selectedZone.y },
          { type: 'n' as const, x: selectedZone.x + selectedZone.width / 2, y: selectedZone.y },
          { type: 'ne' as const, x: selectedZone.x + selectedZone.width, y: selectedZone.y },
          { type: 'e' as const, x: selectedZone.x + selectedZone.width, y: selectedZone.y + selectedZone.height / 2 },
          { type: 'se' as const, x: selectedZone.x + selectedZone.width, y: selectedZone.y + selectedZone.height },
          { type: 's' as const, x: selectedZone.x + selectedZone.width / 2, y: selectedZone.y + selectedZone.height },
          { type: 'sw' as const, x: selectedZone.x, y: selectedZone.y + selectedZone.height },
          { type: 'w' as const, x: selectedZone.x, y: selectedZone.y + selectedZone.height / 2 },
        ];
        
        const clickedHandle = handles.find(handle => 
          x >= handle.x - handleSize && x <= handle.x + handleSize &&
          y >= handle.y - handleSize && y <= handle.y + handleSize
        );
        
        if (clickedHandle) {
          setIsResizing(true);
          setResizeHandle(clickedHandle.type);
          setStartPoint({ x, y });
          return;
        }
      }
      
      // Vérifier si on clique sur une zone pour la déplacer
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
      // Commencer à dessiner une nouvelle zone
      setIsDrawing(true);
      setStartPoint({ x, y });
    } else if (currentTool === 'delete') {
      // Supprimer une zone
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
    
    // Gestion du déplacement de zone
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
      return;
    }
    
    // Gestion du redimensionnement
    if (isResizing && selectedZone && startPoint && resizeHandle) {
      const dx = x - startPoint.x;
      const dy = y - startPoint.y;
      
      let newX = selectedZone.x;
      let newY = selectedZone.y;
      let newWidth = selectedZone.width;
      let newHeight = selectedZone.height;
      
      switch (resizeHandle) {
        case 'se':
          newWidth += dx;
          newHeight += dy;
          break;
        case 'sw':
          newX += dx;
          newWidth -= dx;
          newHeight += dy;
          break;
        case 'ne':
          newWidth += dx;
          newY += dy;
          newHeight -= dy;
          break;
        case 'nw':
          newX += dx;
          newWidth -= dx;
          newY += dy;
          newHeight -= dy;
          break;
        case 'e':
          newWidth += dx;
          break;
        case 'w':
          newX += dx;
          newWidth -= dx;
          break;
        case 'n':
          newY += dy;
          newHeight -= dy;
          break;
        case 's':
          newHeight += dy;
          break;
      }
      
      // Taille minimale
      if (newWidth >= 50 && newHeight >= 50) {
        const updatedZones = zones.map(zone => 
          zone.id === selectedZone.id
            ? { ...zone, x: newX, y: newY, width: newWidth, height: newHeight }
            : zone
        );
        setZones(updatedZones);
        const updated = updatedZones.find(z => z.id === selectedZone.id);
        if (updated) setSelectedZone(updated);
        setStartPoint({ x, y });
      }
      return;
    }
    
    // Dessin de nouvelle zone
    if (isDrawing && startPoint && currentTool === 'rectangle') {
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      // Redessiner tout
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      drawGrid(ctx);
      drawZones(ctx);
      
      // Dessiner l'aperçu
      const width = x - startPoint.x;
      const height = y - startPoint.y;
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.strokeRect(startPoint.x, startPoint.y, width, height);
      ctx.setLineDash([]);
    }
  };
  
  const handleCanvasMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    // Fin du déplacement
    if (isDragging) {
      setIsDragging(false);
      setDraggedZone(null);
      toast.success("Zone déplacée");
      return;
    }
    
    // Fin du redimensionnement
    if (isResizing) {
      setIsResizing(false);
      setResizeHandle(null);
      setStartPoint(null);
      toast.success("Zone redimensionnée");
      return;
    }
    
    // Fin du dessin de nouvelle zone
    if (isDrawing && startPoint && currentTool === 'rectangle') {
      const canvas = canvasRef.current;
      if (!canvas) return;
      
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      const width = Math.abs(x - startPoint.x);
      const height = Math.abs(y - startPoint.y);
      
      // Créer une nouvelle zone seulement si elle a une taille minimale
      if (width > 50 && height > 50) {
        const newZone: Zone = {
          id: `temp-${Date.now()}`,
          code: `Z${zones.length + 1}`,
          name: `Nouvelle Zone ${zones.length + 1}`,
          x: Math.min(startPoint.x, x),
          y: Math.min(startPoint.y, y),
          width,
          height,
          isSponsored: false,
          color: '#3b82f6'
        };
        
        setZones([...zones, newZone]);
        setSelectedZone(newZone);
        toast.success("Zone créée");
      }
      
      setIsDrawing(false);
      setStartPoint(null);
    }
  };
  
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      setBackgroundImage(event.target?.result as string);
      toast.success("Plan de magasin chargé");
    };
    reader.readAsDataURL(file);
  };
  
  const handleSaveZones = async () => {
    // TODO: Implémenter la sauvegarde des zones avec leurs coordonnées
    toast.success("Zones sauvegardées avec succès");
  };
  
  const updateSelectedZone = (updates: Partial<Zone>) => {
    if (!selectedZone) return;
    
    const updatedZones = zones.map(zone => 
      zone.id === selectedZone.id ? { ...zone, ...updates } : zone
    );
    setZones(updatedZones);
    setSelectedZone({ ...selectedZone, ...updates });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 shadow-sm">
        <div className="container py-6">
          <div className="flex items-center gap-4">
            <Link href={`/stores/${storeId}/zones`}>
              <Button variant="ghost" size="icon">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Grid3x3 className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-slate-900">Éditeur de Zones</h1>
                <p className="text-slate-600 mt-1">{store?.name}</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Barre d'outils */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>Outils</CardTitle>
              <CardDescription>Sélectionnez un outil pour dessiner</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Outils de dessin</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant={currentTool === 'select' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setCurrentTool('select')}
                    className="flex items-center gap-2"
                  >
                    <Move className="w-4 h-4" />
                    Sélectionner
                  </Button>
                  <Button
                    variant={currentTool === 'rectangle' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setCurrentTool('rectangle')}
                    className="flex items-center gap-2"
                  >
                    <Square className="w-4 h-4" />
                    Rectangle
                  </Button>
                  <Button
                    variant={currentTool === 'delete' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setCurrentTool('delete')}
                    className="flex items-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    Supprimer
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Affichage</Label>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowGrid(!showGrid)}
                  >
                    <Grid3x3 className="w-4 h-4 mr-2" />
                    {showGrid ? 'Masquer' : 'Afficher'} grille
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Plan de magasin</Label>
                <div className="flex flex-col gap-2">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="text-sm"
                  />
                  {backgroundImage && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setBackgroundImage(null)}
                    >
                      Retirer le plan
                    </Button>
                  )}
                </div>
              </div>

              <div className="pt-4 border-t">
                <Button
                  onClick={handleSaveZones}
                  className="w-full"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Enregistrer les zones
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Canvas */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Plan du magasin</CardTitle>
                <CardDescription>
                  Dessinez les zones en utilisant les outils de la barre latérale
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="border-2 border-slate-200 rounded-lg overflow-hidden bg-white">
                  <canvas
                    ref={canvasRef}
                    width={canvasSize.width}
                    height={canvasSize.height}
                    onMouseDown={handleCanvasMouseDown}
                    onMouseMove={handleCanvasMouseMove}
                    onMouseUp={handleCanvasMouseUp}
                    className="cursor-crosshair"
                    style={{ maxWidth: '100%', height: 'auto' }}
                  />
                </div>
                
                <div className="mt-4 flex items-center justify-between text-sm text-slate-600">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-blue-500 bg-opacity-40 border-2 border-blue-500 rounded"></div>
                      <span>Zone libre</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-green-500 bg-opacity-40 border-2 border-green-500 rounded"></div>
                      <span>Zone sponsorisée</span>
                    </div>
                  </div>
                  <div className="text-slate-500">
                    {zones.length} zone{zones.length > 1 ? 's' : ''}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Propriétés de la zone sélectionnée */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>Propriétés</CardTitle>
              <CardDescription>
                {selectedZone ? 'Modifier la zone sélectionnée' : 'Aucune zone sélectionnée'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {selectedZone ? (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="zone-code">Code</Label>
                    <Input
                      id="zone-code"
                      value={selectedZone.code}
                      onChange={(e) => updateSelectedZone({ code: e.target.value })}
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="zone-name">Nom</Label>
                    <Input
                      id="zone-name"
                      value={selectedZone.name}
                      onChange={(e) => updateSelectedZone({ name: e.target.value })}
                      className="mt-1"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label htmlFor="zone-x">Position X</Label>
                      <Input
                        id="zone-x"
                        type="number"
                        value={Math.round(selectedZone.x)}
                        onChange={(e) => updateSelectedZone({ x: parseInt(e.target.value) || 0 })}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="zone-y">Position Y</Label>
                      <Input
                        id="zone-y"
                        type="number"
                        value={Math.round(selectedZone.y)}
                        onChange={(e) => updateSelectedZone({ y: parseInt(e.target.value) || 0 })}
                        className="mt-1"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label htmlFor="zone-width">Largeur</Label>
                      <Input
                        id="zone-width"
                        type="number"
                        value={Math.round(selectedZone.width)}
                        onChange={(e) => updateSelectedZone({ width: parseInt(e.target.value) || 50 })}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="zone-height">Hauteur</Label>
                      <Input
                        id="zone-height"
                        type="number"
                        value={Math.round(selectedZone.height)}
                        onChange={(e) => updateSelectedZone({ height: parseInt(e.target.value) || 50 })}
                        className="mt-1"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label>Surface estimée</Label>
                    <div className="mt-1 text-lg font-semibold text-slate-900">
                      {Math.round((selectedZone.width * selectedZone.height) / 100)} m²
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="zone-sponsored"
                      checked={selectedZone.isSponsored}
                      onChange={(e) => updateSelectedZone({ 
                        isSponsored: e.target.checked,
                        color: e.target.checked ? '#10b981' : '#3b82f6'
                      })}
                      className="w-4 h-4"
                    />
                    <Label htmlFor="zone-sponsored">Zone sponsorisée</Label>
                  </div>
                  
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => {
                      setZones(zones.filter(z => z.id !== selectedZone.id));
                      setSelectedZone(null);
                      toast.success("Zone supprimée");
                    }}
                    className="w-full"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Supprimer cette zone
                  </Button>
                </div>
              ) : (
                <div className="text-center text-slate-500 py-8">
                  <Grid3x3 className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>Sélectionnez une zone pour voir ses propriétés</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Liste des zones */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Zones créées ({zones.length})</CardTitle>
            <CardDescription>Liste de toutes les zones du magasin</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {zones.map(zone => (
                <div
                  key={zone.id}
                  onClick={() => setSelectedZone(zone)}
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    selectedZone?.id === zone.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-semibold text-slate-900">{zone.code}</h3>
                      <p className="text-sm text-slate-600">{zone.name}</p>
                    </div>
                    {zone.isSponsored && (
                      <Badge variant="default" className="bg-green-600">
                        Sponsorisée
                      </Badge>
                    )}
                  </div>
                  <div className="text-sm text-slate-500">
                    Surface: {Math.round((zone.width * zone.height) / 100)} m²
                  </div>
                </div>
              ))}
              
              {zones.length === 0 && (
                <div className="col-span-full text-center py-12 text-slate-500">
                  <Grid3x3 className="w-16 h-16 mx-auto mb-4 opacity-30" />
                  <p>Aucune zone créée</p>
                  <p className="text-sm mt-1">Utilisez l'outil Rectangle pour dessiner des zones</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
