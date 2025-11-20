import { useState } from "react";
import { useRoute } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Plus, Building2, DollarSign, Calendar, AlertCircle, Edit, Trash2 } from "lucide-react";
import { Link } from "wouter";
import { toast } from "sonner";

export default function StoreZones() {
  const [, params] = useRoute("/stores/:id/zones");
  const storeId = parseInt(params?.id || "0");
  
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isSponsorDialogOpen, setIsSponsorDialogOpen] = useState(false);
  const [selectedZoneId, setSelectedZoneId] = useState<number | null>(null);
  
  const { data: store } = trpc.stores.getById.useQuery({ id: storeId });
  const { data: zones = [], refetch: refetchZones } = trpc.zones.byStore.useQuery({ storeId });
  
  const createZone = trpc.zones.create.useMutation({
    onSuccess: () => {
      toast.success("Zone créée avec succès");
      setIsCreateDialogOpen(false);
      refetchZones();
    },
    onError: (error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });
  
  const deleteZone = trpc.zones.delete.useMutation({
    onSuccess: () => {
      toast.success("Zone supprimée");
      refetchZones();
    },
    onError: (error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });
  
  const createSponsor = trpc.sponsors.create.useMutation({
    onSuccess: () => {
      toast.success("Contrat de sponsoring créé");
      setIsSponsorDialogOpen(false);
      setSelectedZoneId(null);
      refetchZones();
    },
    onError: (error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });
  
  const handleCreateZone = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    createZone.mutate({
      storeId,
      name: formData.get("name") as string,
      code: formData.get("code") as string,
      surface: parseInt(formData.get("surface") as string) || undefined,
      location: formData.get("location") as string || undefined,
      status: (formData.get("status") as "active" | "inactive" | "maintenance") || "active",
    });
  };
  
  const handleCreateSponsor = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedZoneId) return;
    
    const formData = new FormData(e.currentTarget);
    
    createSponsor.mutate({
      zoneId: selectedZoneId,
      supplierName: formData.get("supplierName") as string,
      contractAmount: parseInt(formData.get("contractAmount") as string) * 100, // Convertir en centimes
      startDate: new Date(formData.get("startDate") as string),
      endDate: new Date(formData.get("endDate") as string),
      contactName: formData.get("contactName") as string || undefined,
      contactEmail: formData.get("contactEmail") as string || undefined,
      contactPhone: formData.get("contactPhone") as string || undefined,
      notes: formData.get("notes") as string || undefined,
    });
  };
  
  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive"> = {
      active: "default",
      inactive: "secondary",
      maintenance: "destructive",
    };
    return <Badge variant={variants[status] || "default"}>{status}</Badge>;
  };
  
  return (
    <div className="container py-8">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={`/stores/${storeId}`}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Zones du Magasin</h1>
            <p className="text-muted-foreground">{store?.name}</p>
          </div>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nouvelle Zone
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Créer une nouvelle zone</DialogTitle>
              <DialogDescription>
                Définissez une zone dans le magasin pour organiser les rayonnages
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateZone} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nom de la zone *</Label>
                <Input id="name" name="name" placeholder="Ex: Zone Entrée" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="code">Code *</Label>
                <Input id="code" name="code" placeholder="Ex: Z01" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="surface">Surface (m²)</Label>
                <Input id="surface" name="surface" type="number" placeholder="Ex: 150" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">Emplacement</Label>
                <Textarea id="location" name="location" placeholder="Description de l'emplacement..." />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Statut</Label>
                <Select name="status" defaultValue="active">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Annuler
                </Button>
                <Button type="submit" disabled={createZone.isPending}>
                  {createZone.isPending ? "Création..." : "Créer"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      
      {zones.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Aucune zone définie</h3>
            <p className="text-muted-foreground text-center mb-4">
              Commencez par créer des zones pour organiser votre magasin
            </p>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Créer la première zone
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {zones.map((zone) => (
            <Card key={zone.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {zone.name}
                      {zone.isSponsored && (
                        <Badge variant="default" className="bg-green-600">
                          <DollarSign className="h-3 w-3 mr-1" />
                          Sponsorisée
                        </Badge>
                      )}
                    </CardTitle>
                    <CardDescription>Code: {zone.code}</CardDescription>
                  </div>
                  {getStatusBadge(zone.status)}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {zone.surface && (
                  <div className="text-sm">
                    <span className="text-muted-foreground">Surface:</span> {zone.surface} m²
                  </div>
                )}
                {zone.location && (
                  <div className="text-sm">
                    <span className="text-muted-foreground">Emplacement:</span> {zone.location}
                  </div>
                )}
                
                <div className="flex gap-2">
                  {!zone.isSponsored && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      onClick={() => {
                        setSelectedZoneId(zone.id);
                        setIsSponsorDialogOpen(true);
                      }}
                    >
                      <DollarSign className="h-4 w-4 mr-1" />
                      Sponsoriser
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      if (confirm("Êtes-vous sûr de vouloir supprimer cette zone ?")) {
                        deleteZone.mutate({ zoneId: zone.id });
                      }
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      
      {/* Dialog de création de sponsoring */}
      <Dialog open={isSponsorDialogOpen} onOpenChange={setIsSponsorDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Créer un contrat de sponsoring</DialogTitle>
            <DialogDescription>
              Définissez les termes du contrat avec le fournisseur
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateSponsor} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2 col-span-2">
                <Label htmlFor="supplierName">Nom du fournisseur *</Label>
                <Input 
                  id="supplierName" 
                  name="supplierName" 
                  placeholder="Ex: Procter & Gamble" 
                  required 
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="contractAmount">Montant du contrat (DH) *</Label>
                <Input 
                  id="contractAmount" 
                  name="contractAmount" 
                  type="number" 
                  placeholder="Ex: 50000" 
                  required 
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="startDate">Date de début *</Label>
                <Input 
                  id="startDate" 
                  name="startDate" 
                  type="date" 
                  required 
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="endDate">Date de fin *</Label>
                <Input 
                  id="endDate" 
                  name="endDate" 
                  type="date" 
                  required 
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="contactName">Nom du contact</Label>
                <Input 
                  id="contactName" 
                  name="contactName" 
                  placeholder="Ex: Jean Dupont" 
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="contactEmail">Email du contact</Label>
                <Input 
                  id="contactEmail" 
                  name="contactEmail" 
                  type="email" 
                  placeholder="contact@exemple.com" 
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="contactPhone">Téléphone du contact</Label>
                <Input 
                  id="contactPhone" 
                  name="contactPhone" 
                  placeholder="+212 6XX XXX XXX" 
                />
              </div>
              
              <div className="space-y-2 col-span-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea 
                  id="notes" 
                  name="notes" 
                  placeholder="Informations complémentaires..." 
                />
              </div>
            </div>
            
            <div className="flex justify-end gap-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                  setIsSponsorDialogOpen(false);
                  setSelectedZoneId(null);
                }}
              >
                Annuler
              </Button>
              <Button type="submit" disabled={createSponsor.isPending}>
                {createSponsor.isPending ? "Création..." : "Créer le contrat"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
