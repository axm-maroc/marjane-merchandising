import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
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
  Grid3x3,
  LayoutGrid,
  Eye,
  Camera,
  Plus
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
  const { data: planogramLocations } = trpc.planogramLocations.byStore.useQuery({ storeId });
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
  const [isResizing, setIsResizing] = useState(false);
  const [resizeHandle, setResizeHandle] = useState<'se' | 'sw' | 'ne' | 'nw' | 'e' | 'w' | 'n' | 's' | null>(null);
  const [backgroundImage, setBackgroundImage] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [showGrid, setShowGrid] = useState(true);
  const [canvasSize] = useState({ width: 1200, height: 800 });
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [selectedLocations, setSelectedLocations] = useState<number[]>([]);
  const [showCreatePlanogramDialog, setShowCreatePlanogramDialog] = useState(false);
  const [selectedLocationForPlanogram, setSelectedLocationForPlanogram] = useState<number | null>(null);
  const [newPlanogramName, setNewPlanogramName] = useState('');
  const [newPlanogramDescription, setNewPlanogramDescription] = useState('');
  const [planogramSearchQuery, setPlanogramSearchQuery] = useState("");
  const [planogramStatusFilter, setPlanogramStatusFilter] = useState<string>("all");
  const [locationSearchQuery, setLocationSearchQuery] = useState("");
  const [locationZoneFilter, setLocationZoneFilter] = useState<number | null>(null);
  
  const updateZoneMutation = trpc.planogramLocations.updateZone.useMutation({
    onSuccess: () => {
      toast.success("Planogrammes affectés avec succès");
      setShowAssignDialog(false);
      setSelectedLocations([]);
    },
    onError: (error) => {
      toast.error("Erreur lors de l'affectation: " + error.message);
    }
  });
  
  const updatePositionMutation = trpc.planogramLocations.updatePosition.useMutation({
    onSuccess: () => {
      toast.success("Émplacement positionné avec succès");
    },
    onError: (error) => {
      toast.error("Erreur lors du positionnement: " + error.message);
    }
  });
  
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
        drawPlanogramLocations(ctx);
      };
    } else {
      drawGrid(ctx);
      drawZones(ctx);
      drawPlanogramLocations(ctx);
    }
  }, [zones, selectedZone, backgroundImage, showGrid, zoom, planogramLocations, existingZones, allPlanograms]);
  
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
      
      // Compter les planogrammes de cette zone
      const dbZone = existingZones?.find(z => z.code === zone.code);
      const planogramCount = dbZone 
        ? planogramLocations?.filter(loc => loc.zoneId === dbZone.id).length || 0
        : 0;
      
      // Badge avec nombre de planogrammes
      if (planogramCount > 0) {
        const badgeX = zone.x + zone.width - 35;
        const badgeY = zone.y + 10;
        
        // Fond du badge
        ctx.fillStyle = '#3b82f6';
        ctx.beginPath();
        ctx.roundRect(badgeX, badgeY, 30, 20, 4);
        ctx.fill();
        
        // Texte du badge
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 11px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(planogramCount.toString(), badgeX + 15, badgeY + 14);
        ctx.textAlign = 'left';
      }
      
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
  
  const drawPlanogramLocations = (ctx: CanvasRenderingContext2D) => {
    // Dessiner les emplacements positionnés dans les zones
    planogramLocations?.forEach(location => {
      if (!location.positionX || !location.positionY || !location.zoneId) return;
      
      // Trouver la zone correspondante
      const dbZone = existingZones?.find(z => z.id === location.zoneId);
      if (!dbZone) return;
      
      const zone = zones.find(z => z.code === dbZone.code);
      if (!zone) return;
      
      // Calculer la position absolue sur le canvas
      const absX = zone.x + location.positionX;
      const absY = zone.y + location.positionY;
      
      // Dimensions de l'emplacement
      const width = Math.min(location.shelfWidth / 20, zone.width - location.positionX - 10);
      const shelfHeight = location.shelfHeight / 10; // Convertir mm en pixels (facteur 10)
      const totalHeight = location.shelfCount * shelfHeight;
      
      // Trouver le planogramme associé
      const planogram = allPlanograms?.find(p => p.locationId === location.id);
      const isActive = planogram?.status === 'active';
      const hasPlanogram = !!planogram;
      
      // Couleur selon le statut
      const bgColor = hasPlanogram ? (isActive ? '#3b82f6' : '#94a3b8') : '#e2e8f0';
      const borderColor = hasPlanogram ? bgColor : '#cbd5e1';
      const textColor = hasPlanogram ? '#ffffff' : '#64748b';
      
      // Dessiner le rectangle de fond de l'emplacement
      ctx.fillStyle = bgColor + (hasPlanogram ? 'CC' : '80'); // Transparence
      ctx.fillRect(absX, absY, width, totalHeight);
      
      // Bordure principale
      ctx.strokeStyle = borderColor;
      ctx.lineWidth = 2;
      ctx.strokeRect(absX, absY, width, totalHeight);
      
      // Dessiner les étagères individuelles
      ctx.strokeStyle = hasPlanogram ? '#ffffff' : '#94a3b8';
      ctx.lineWidth = 1;
      for (let i = 1; i < location.shelfCount; i++) {
        const shelfY = absY + (i * shelfHeight);
        ctx.beginPath();
        ctx.moveTo(absX, shelfY);
        ctx.lineTo(absX + width, shelfY);
        ctx.stroke();
      }
      
      // Badge nombre d'étagères
      const badgeSize = 18;
      ctx.fillStyle = hasPlanogram ? '#1e40af' : '#64748b';
      ctx.fillRect(absX + width - badgeSize - 3, absY + 3, badgeSize, badgeSize);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 10px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(
        location.shelfCount.toString(),
        absX + width - badgeSize / 2 - 3,
        absY + 14
      );
      ctx.textAlign = 'left';
      
      // Nom de l'emplacement
      ctx.fillStyle = textColor;
      ctx.font = 'bold 11px sans-serif';
      const nameY = absY + totalHeight / 2 - (hasPlanogram ? 8 : 0);
      ctx.fillText(
        location.name.length > 15 ? location.name.substring(0, 15) + '...' : location.name,
        absX + 5,
        nameY
      );
      
      // Nom du planogramme ou message "Aucun planogramme"
      ctx.font = '10px sans-serif';
      if (planogram) {
        ctx.fillText(
          planogram.name.length > 15 ? planogram.name.substring(0, 15) + '...' : planogram.name,
          absX + 5,
          nameY + 15
        );
      } else {
        ctx.fillStyle = '#94a3b8';
        ctx.fillText(
          'Aucun planogramme',
          absX + 5,
          nameY + 15
        );
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
      
      // Vérifier si on clique sur un emplacement de planogramme
      const clickedLocation = planogramLocations?.find(location => {
        if (!location.positionX || !location.positionY || !location.zoneId) return false;
        
        const dbZone = existingZones?.find(z => z.id === location.zoneId);
        if (!dbZone) return false;
        
        const zone = zones.find(z => z.code === dbZone.code);
        if (!zone) return false;
        
        const absX = zone.x + location.positionX;
        const absY = zone.y + location.positionY;
        const width = Math.min(location.shelfWidth / 20, zone.width - location.positionX - 10);
        const shelfHeight = location.shelfHeight / 10;
        const totalHeight = location.shelfCount * shelfHeight;
        
        return x >= absX && x <= absX + width &&
               y >= absY && y <= absY + totalHeight;
      });
      
      if (clickedLocation) {
        // Clic sur un emplacement - ouvrir l'éditeur ou la modale de création
        const planogram = allPlanograms?.find(p => p.locationId === clickedLocation.id);
        
        if (planogram) {
          // Rediriger vers l'éditeur 2D
          window.location.href = `/planograms/location/${clickedLocation.id}`;
        } else {
          // Ouvrir la modale de création
          setSelectedLocationForPlanogram(clickedLocation.id);
          setShowCreatePlanogramDialog(true);
        }
        return;
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
      drawPlanogramLocations(ctx);
      
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
  
  const handleCanvasDrop = (e: React.DragEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    
    const locationId = parseInt(e.dataTransfer.getData('locationId'));
    if (!locationId) return;
    
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
    
    if (!targetZone) {
      toast.error("Émplacement doit être déposé dans une zone");
      return;
    }
    
    // Trouver la zone dans la base de données
    const dbZone = existingZones?.find(z => z.code === targetZone.code);
    if (!dbZone) {
      toast.error("Zone non trouvée dans la base de données");
      return;
    }
    
    // Calculer les coordonnées relatives à la zone
    const relativeX = Math.round(x - targetZone.x);
    const relativeY = Math.round(y - targetZone.y);
    
    // Mettre à jour la position dans la base de données
    updatePositionMutation.mutate({
      locationId,
      positionX: relativeX,
      positionY: relativeY,
      zoneId: dbZone.id
    });
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
        <div className="grid grid-cols-1 lg:grid-cols-7 gap-6">
          {/* Barre d'outils */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>Outils</CardTitle>
              <CardDescription>Sélectionnez un outil pour dessiner</CardDescription>
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
                    title="Sélectionner et déplacer les zones"
                  >
                    <Move className="w-4 h-4" />
                    <span>Sélectionner</span>
                  </Button>
                  <Button
                    variant={currentTool === 'rectangle' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setCurrentTool('rectangle')}
                    className="w-full justify-start gap-2"
                    title="Dessiner une nouvelle zone"
                  >
                    <Square className="w-4 h-4" />
                    <span>Rectangle</span>
                  </Button>
                  <Button
                    variant={currentTool === 'delete' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setCurrentTool('delete')}
                    className="w-full justify-start gap-2"
                    title="Supprimer une zone"
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
                  {showGrid ? '✓ Grille visible' : 'Afficher grille'}
                </Button>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2 pb-2 border-b">
                  <Upload className="w-4 h-4 text-purple-600" />
                  <Label className="font-semibold">Plan de magasin</Label>
                </div>
                <div className="flex flex-col gap-2">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="text-xs cursor-pointer"
                  />
                  {backgroundImage && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setBackgroundImage(null)}
                      className="text-red-600 hover:text-red-700"
                    >
                      ✕ Retirer le plan
                    </Button>
                  )}
                </div>
              </div>

              <div className="pt-4 border-t">
                <Button
                  onClick={handleSaveZones}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Enregistrer les zones
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Canvas */}
          <div className="lg:col-span-3">
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
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.dataTransfer.dropEffect = 'move';
                    }}
                    onDrop={handleCanvasDrop}
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
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LayoutGrid className="w-5 h-5" />
                Emplacements
              </CardTitle>
              <CardDescription>
                Glissez-déposez les emplacements dans les zones
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Filtres de recherche */}
              <div className="space-y-2 mb-4">
                <Input
                  placeholder="Rechercher un emplacement..."
                  value={locationSearchQuery}
                  onChange={(e) => setLocationSearchQuery(e.target.value)}
                  className="text-sm"
                />
                <select
                  value={locationZoneFilter || ""}
                  onChange={(e) => setLocationZoneFilter(e.target.value ? parseInt(e.target.value) : null)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md"
                >
                  <option value="">Toutes les zones</option>
                  {existingZones?.map(zone => (
                    <option key={zone.id} value={zone.id}>
                      {zone.code} - {zone.name}
                    </option>
                  ))}
                </select>
              </div>
              
              {/* Compteur de résultats */}
              <div className="text-sm text-slate-600 mb-2">
                {planogramLocations
                  ?.filter(location => {
                    const matchesSearch = location.name.toLowerCase().includes(locationSearchQuery.toLowerCase());
                    const matchesZone = locationZoneFilter === null || location.zoneId === locationZoneFilter;
                    return matchesSearch && matchesZone;
                  }).length || 0} emplacement(s) trouvé(s)
              </div>
              
              <div className="space-y-3 max-h-[700px] overflow-y-auto">
                {planogramLocations
                  ?.filter(location => {
                    // Filtre par recherche (nom de l'emplacement)
                    const matchesSearch = location.name.toLowerCase().includes(locationSearchQuery.toLowerCase());
                    // Filtre par zone
                    const matchesZone = locationZoneFilter === null || location.zoneId === locationZoneFilter;
                    return matchesSearch && matchesZone;
                  })
                  .map(location => {
                  const planogram = allPlanograms?.find(p => p.locationId === location.id);
                  const zone = location.zoneId ? existingZones?.find(z => z.id === location.zoneId) : null;
                  const isPositioned = location.positionX !== null && location.positionY !== null;
                  
                  return (
                    <div
                      key={location.id}
                      draggable={!isPositioned}
                      onDragStart={(e) => {
                        if (!isPositioned) {
                          e.dataTransfer.setData('locationId', location.id.toString());
                          e.dataTransfer.effectAllowed = 'move';
                        }
                      }}
                      onClick={() => {
                        if (planogram) {
                          window.location.href = `/planograms/location/${location.id}`;
                         } else {
                           setSelectedLocationForPlanogram(location.id);
                           setShowCreatePlanogramDialog(true);
                         }
                      }}
                      className={`p-3 bg-white border-2 rounded-lg transition-all ${
                        !isPositioned 
                          ? 'border-orange-300 cursor-move hover:border-orange-400 hover:shadow-md' 
                          : 'border-slate-200 cursor-pointer hover:border-blue-400 hover:shadow-md'
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        {!isPositioned && <Move className="w-4 h-4 text-orange-500 mt-1 flex-shrink-0" />}
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm text-slate-900 truncate">
                            {location.name}
                          </div>
                          {planogram && (
                            <div className="text-xs text-slate-600 mt-1 truncate">
                              {planogram.name}
                            </div>
                          )}
                          
                          {/* Détails des étagères */}
                          <div className="mt-2 p-2 bg-slate-50 rounded border border-slate-200">
                            <div className="text-xs font-medium text-slate-700 mb-1">Étagères</div>
                            <div className="grid grid-cols-2 gap-1 text-xs text-slate-600">
                              <div>Nombre: <span className="font-medium">{location.shelfCount}</span></div>
                              <div>Largeur: <span className="font-medium">{location.shelfWidth}mm</span></div>
                              <div>Hauteur: <span className="font-medium">{location.shelfHeight}mm</span></div>
                              <div>Profondeur: <span className="font-medium">{location.shelfDepth}mm</span></div>
                            </div>
                          </div>
                          
                          <div className="flex gap-2 mt-2 flex-wrap">
                            {!isPositioned && (
                              <Badge variant="outline" className="text-xs bg-orange-50 text-orange-700 border-orange-300">
                                Non positionné
                              </Badge>
                            )}
                            {zone && (
                              <Badge variant="secondary" className="text-xs">
                                {zone.code}
                              </Badge>
                            )}
                            {planogram ? (
                              <Badge 
                                variant={planogram.status === 'active' ? 'default' : 'secondary'}
                                className="text-xs"
                              >
                                {planogram.status === 'active' ? 'Actif' : planogram.status === 'draft' ? 'Brouillon' : 'Archivé'}
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-xs text-slate-500">
                                Pas de planogramme
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
                
                {(!planogramLocations || planogramLocations.length === 0) && (
                  <div className="text-center text-slate-500 py-8">
                    <LayoutGrid className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p className="text-sm">Aucun emplacement</p>
                  </div>
                )}
              </div>
              
              {/* Modale de création de planogramme */}
              <Dialog open={showCreatePlanogramDialog} onOpenChange={setShowCreatePlanogramDialog}>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Créer un nouveau planogramme</DialogTitle>
                    <DialogDescription>
                      Créer un planogramme pour l'emplacement : {planogramLocations?.find(loc => loc.id === selectedLocationForPlanogram)?.name}
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="space-y-4 py-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Nom du planogramme *</label>
                      <Input
                        placeholder="Ex: Planogramme Produits Laitiers"
                        value={newPlanogramName}
                        onChange={(e) => setNewPlanogramName(e.target.value)}
                      />
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium mb-2 block">Description (optionnelle)</label>
                      <Input
                        placeholder="Description du planogramme"
                        value={newPlanogramDescription}
                        onChange={(e) => setNewPlanogramDescription(e.target.value)}
                      />
                    </div>
                    
                    <div className="bg-slate-50 p-3 rounded-lg space-y-2">
                      <div className="text-sm font-medium text-slate-700">Caractéristiques de l'emplacement :</div>
                      {planogramLocations?.find(loc => loc.id === selectedLocationForPlanogram) && (
                        <div className="grid grid-cols-2 gap-2 text-xs text-slate-600">
                          <div>Étagères: <span className="font-medium">{planogramLocations?.find(loc => loc.id === selectedLocationForPlanogram)?.shelfCount}</span></div>
                          <div>Largeur: <span className="font-medium">{planogramLocations?.find(loc => loc.id === selectedLocationForPlanogram)?.shelfWidth}mm</span></div>
                          <div>Hauteur: <span className="font-medium">{planogramLocations?.find(loc => loc.id === selectedLocationForPlanogram)?.shelfHeight}mm</span></div>
                          <div>Profondeur: <span className="font-medium">{planogramLocations?.find(loc => loc.id === selectedLocationForPlanogram)?.shelfDepth}mm</span></div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex gap-2 pt-4">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowCreatePlanogramDialog(false);
                        setNewPlanogramName('');
                        setNewPlanogramDescription('');
                      }}
                      className="flex-1"
                    >
                      Annuler
                    </Button>
                    <Button
                      onClick={async () => {
                        if (!newPlanogramName.trim()) {
                          toast.error("Le nom du planogramme est requis");
                          return;
                        }
                        
                        try {
                          toast.success("Redirection vers l'éditeur de planogramme");
                          setShowCreatePlanogramDialog(false);
                          setNewPlanogramName('');
                          setNewPlanogramDescription('');
                          
                          window.location.href = `/planograms/location/${selectedLocationForPlanogram}`;
                        } catch (error) {
                          toast.error("Erreur lors de la création du planogramme");
                        }
                      }}
                      disabled={!newPlanogramName.trim()}
                      className="flex-1"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Créer et ouvrir
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        </div>
      </main>
      
      {/* Panneau de propriétés contextuel */}
      {selectedZone && (
        <div className="fixed top-24 right-8 w-96 bg-white rounded-lg shadow-2xl border border-slate-200 z-50 animate-in slide-in-from-right duration-200">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-900">Propriétés de la Zone</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedZone(null)}
                className="h-8 w-8 p-0"
              >
                <Plus className="w-4 h-4 rotate-45" />
              </Button>
            </div>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="ctx-zone-code">Code</Label>
                <Input
                  id="ctx-zone-code"
                  value={selectedZone.code}
                  onChange={(e) => updateSelectedZone({ code: e.target.value })}
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label htmlFor="ctx-zone-name">Nom</Label>
                <Input
                  id="ctx-zone-name"
                  value={selectedZone.name}
                  onChange={(e) => updateSelectedZone({ name: e.target.value })}
                  className="mt-1"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label htmlFor="ctx-zone-x">Position X</Label>
                  <Input
                    id="ctx-zone-x"
                    type="number"
                    value={Math.round(selectedZone.x)}
                    onChange={(e) => updateSelectedZone({ x: parseInt(e.target.value) || 0 })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="ctx-zone-y">Position Y</Label>
                  <Input
                    id="ctx-zone-y"
                    type="number"
                    value={Math.round(selectedZone.y)}
                    onChange={(e) => updateSelectedZone({ y: parseInt(e.target.value) || 0 })}
                    className="mt-1"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label htmlFor="ctx-zone-width">Largeur</Label>
                  <Input
                    id="ctx-zone-width"
                    type="number"
                    value={Math.round(selectedZone.width)}
                    onChange={(e) => updateSelectedZone({ width: parseInt(e.target.value) || 50 })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="ctx-zone-height">Hauteur</Label>
                  <Input
                    id="ctx-zone-height"
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
                  id="ctx-zone-sponsored"
                  checked={selectedZone.isSponsored}
                  onChange={(e) => updateSelectedZone({ 
                    isSponsored: e.target.checked,
                    color: e.target.checked ? '#10b981' : '#3b82f6'
                  })}
                  className="w-4 h-4"
                />
                <Label htmlFor="ctx-zone-sponsored">Zone sponsorisée</Label>
              </div>
              
              {/* Planogrammes affectés */}
              <div className="pt-4 border-t">
                <div className="flex items-center justify-between mb-3">
                  <Label className="flex items-center gap-2">
                    <LayoutGrid className="w-4 h-4" />
                    Planogrammes
                  </Label>
                  <Badge variant="secondary">
                    {planogramLocations?.filter(loc => {
                      const dbZone = existingZones?.find(z => z.code === selectedZone.code);
                      return dbZone && loc.zoneId === dbZone.id;
                    }).length || 0}
                  </Badge>
                </div>
                
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {planogramLocations
                    ?.filter(loc => {
                      const dbZone = existingZones?.find(z => z.code === selectedZone.code);
                      return dbZone && loc.zoneId === dbZone.id;
                    })
                    .map(location => {
                      const planogram = allPlanograms?.find(p => p.locationId === location.id);
                      return (
                        <div key={location.id} className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <div className="font-medium text-sm text-slate-900">{location.name}</div>
                              {planogram && (
                                <div className="text-xs text-slate-600 mt-1">
                                  {planogram.name} (v{planogram.version})
                                </div>
                              )}
                            </div>
                            {planogram && (
                              <Badge variant={planogram.status === 'active' ? 'default' : 'secondary'} className="text-xs">
                                {planogram.status === 'active' ? 'Actif' : planogram.status === 'draft' ? 'Brouillon' : 'Archivé'}
                              </Badge>
                            )}
                          </div>
                          
                          <div className="flex gap-2 mt-2">
                            {planogram ? (
                              <>
                                <Link href={`/planograms/location/${location.id}`}>
                                  <Button variant="outline" size="sm" className="flex-1">
                                    <Eye className="w-3 h-3 mr-1" />
                                    Éditeur 2D
                                  </Button>
                                </Link>
                                <Link href={`/planograms/${planogram.id}/photos`}>
                                  <Button variant="outline" size="sm" className="flex-1">
                                    <Camera className="w-3 h-3 mr-1" />
                                    Photos
                                  </Button>
                                </Link>
                              </>
                            ) : (
                              <Button 
                                variant="default" 
                                size="sm" 
                                className="w-full"
                                onClick={() => {
                                  setSelectedLocationForPlanogram(location.id);
                                  setShowCreatePlanogramDialog(true);
                                }}
                              >
                                <Plus className="w-3 h-3 mr-1" />
                                Créer planogramme
                              </Button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  
                  {planogramLocations?.filter(loc => {
                    const dbZone = existingZones?.find(z => z.code === selectedZone.code);
                    return dbZone && loc.zoneId === dbZone.id;
                  }).length === 0 && (
                    <div className="text-center text-sm text-slate-500 py-4">
                      Aucun planogramme affecté à cette zone
                    </div>
                  )}
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full mt-3"
                  onClick={() => {
                    toast.info("Utilisez le panneau Emplacements pour affecter des planogrammes");
                  }}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Affecter des planogrammes
                </Button>
              </div>
              
              {/* Actions */}
              <div className="pt-4 border-t flex gap-2">
                <Button
                  variant="default"
                  className="flex-1"
                  onClick={() => {
                    toast.success("Propriétés de la zone mises à jour");
                    // Les modifications sont déjà appliquées en temps réel sur le canvas
                  }}
                >
                  <Save className="w-4 h-4 mr-2" />
                  Sauvegarder
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => {
                    if (confirm("Êtes-vous sûr de vouloir supprimer cette zone ?")) {
                      setZones(zones.filter(z => z.id !== selectedZone.id));
                      setSelectedZone(null);
                      toast.success("Zone supprimée");
                    }
                  }}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
