import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Copy, Trash2, FileText } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Link } from "wouter";

export default function PlanogramTemplates() {
  // @ts-ignore - Types will be available after server restart
  const { data: templates, refetch } = trpc.templates.getAll.useQuery();
  // @ts-ignore
  const { data: stores } = trpc.stores.getAll.useQuery();
  // @ts-ignore
  const { data: planograms } = trpc.planograms.byStore.useQuery({ storeId: stores?.[0]?.id || 0 }, { enabled: !!stores?.[0] });

  // @ts-ignore
  const createTemplate = trpc.templates.create.useMutation();
  // @ts-ignore
  const applyTemplate = trpc.templates.applyToStores.useMutation();
  // @ts-ignore
  const deleteTemplate = trpc.templates.delete.useMutation();

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [applyDialogOpen, setApplyDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<number | null>(null);

  const [newTemplate, setNewTemplate] = useState({
    name: "",
    description: "",
    category: "",
    sourcePlanogramId: 0,
  });

  const [applyConfig, setApplyConfig] = useState({
    storeIds: [] as number[],
    locationName: "",
  });

  const handleCreateTemplate = async () => {
    if (!newTemplate.name || !newTemplate.sourcePlanogramId) {
      toast.error("Veuillez remplir tous les champs obligatoires");
      return;
    }

    try {
      await createTemplate.mutateAsync(newTemplate);
      toast.success("Template créé avec succès !");
      setCreateDialogOpen(false);
      setNewTemplate({ name: "", description: "", category: "", sourcePlanogramId: 0 });
      refetch();
    } catch (error) {
      toast.error("Erreur lors de la création du template");
      console.error(error);
    }
  };

  const handleApplyTemplate = async () => {
    if (!selectedTemplate || applyConfig.storeIds.length === 0 || !applyConfig.locationName) {
      toast.error("Veuillez sélectionner des magasins et un nom d'emplacement");
      return;
    }

    try {
      const result = await applyTemplate.mutateAsync({
        templateId: selectedTemplate,
        storeIds: applyConfig.storeIds,
        locationName: applyConfig.locationName,
      });
      toast.success(`${result.created} planogrammes créés avec succès !`);
      setApplyDialogOpen(false);
      setApplyConfig({ storeIds: [], locationName: "" });
    } catch (error) {
      toast.error("Erreur lors de l'application du template");
      console.error(error);
    }
  };

  const handleDeleteTemplate = async (templateId: number) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce template ?")) return;

    try {
      await deleteTemplate.mutateAsync({ templateId });
      toast.success("Template supprimé avec succès !");
      refetch();
    } catch (error) {
      toast.error("Erreur lors de la suppression du template");
      console.error(error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 shadow-sm">
        <div className="container py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
                <FileText className="w-8 h-8 text-blue-600" />
                Templates de Planogrammes
              </h1>
              <p className="text-slate-600 mt-2">
                Créez et réutilisez des planogrammes types pour harmoniser vos implantations
              </p>
            </div>
            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="w-4 h-4" />
                  Créer un Template
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Créer un Template</DialogTitle>
                  <DialogDescription>
                    Créez un template réutilisable à partir d'un planogramme existant
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div>
                    <Label htmlFor="name">Nom du Template *</Label>
                    <Input
                      id="name"
                      value={newTemplate.name}
                      onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
                      placeholder="Ex: Rayon Fruits & Légumes Standard"
                    />
                  </div>
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={newTemplate.description}
                      onChange={(e) => setNewTemplate({ ...newTemplate, description: e.target.value })}
                      placeholder="Description du template..."
                      rows={3}
                    />
                  </div>
                  <div>
                    <Label htmlFor="category">Catégorie</Label>
                    <Input
                      id="category"
                      value={newTemplate.category}
                      onChange={(e) => setNewTemplate({ ...newTemplate, category: e.target.value })}
                      placeholder="Ex: Frais, Épicerie, Textile..."
                    />
                  </div>
                  <div>
                    <Label htmlFor="planogram">Planogramme Source *</Label>
                    <Select
                      value={newTemplate.sourcePlanogramId.toString()}
                      onValueChange={(value) => setNewTemplate({ ...newTemplate, sourcePlanogramId: parseInt(value) })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionnez un planogramme" />
                      </SelectTrigger>
                      <SelectContent>
                        {planograms?.map((p) => (
                          <SelectItem key={p.id} value={p.id.toString()}>
                            {p.name} - v{p.version}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                    Annuler
                  </Button>
                  <Button onClick={handleCreateTemplate} disabled={createTemplate.isPending}>
                    {createTemplate.isPending ? "Création..." : "Créer"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates?.map((template: any) => (
            <Card key={template.id} className="border-slate-200 hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-slate-900">{template.name}</CardTitle>
                    {template.category && (
                      <Badge variant="secondary" className="mt-2">
                        {template.category}
                      </Badge>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteTemplate(template.id)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
                {template.description && (
                  <CardDescription className="text-slate-600 mt-2">
                    {template.description}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-600">Utilisations</span>
                    <span className="font-semibold text-slate-900">{template.usageCount}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-600">Créé le</span>
                    <span className="text-slate-900">
                      {new Date(template.createdAt).toLocaleDateString('fr-FR')}
                    </span>
                  </div>
                  <Button
                    className="w-full gap-2 mt-4"
                    onClick={() => {
                      setSelectedTemplate(template.id);
                      setApplyDialogOpen(true);
                    }}
                  >
                    <Copy className="w-4 h-4" />
                    Appliquer aux Magasins
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}

          {templates?.length === 0 && (
            <div className="col-span-full text-center py-12">
              <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Aucun template</h3>
              <p className="text-slate-600 mb-6">
                Créez votre premier template pour réutiliser vos planogrammes
              </p>
              <Button onClick={() => setCreateDialogOpen(true)} className="gap-2">
                <Plus className="w-4 h-4" />
                Créer un Template
              </Button>
            </div>
          )}
        </div>
      </main>

      {/* Apply Template Dialog */}
      <Dialog open={applyDialogOpen} onOpenChange={setApplyDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Appliquer le Template</DialogTitle>
            <DialogDescription>
              Sélectionnez les magasins où appliquer ce template
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="locationName">Nom de l'Emplacement *</Label>
              <Input
                id="locationName"
                value={applyConfig.locationName}
                onChange={(e) => setApplyConfig({ ...applyConfig, locationName: e.target.value })}
                placeholder="Ex: Rayon Fruits & Légumes"
              />
            </div>
            <div>
              <Label>Magasins *</Label>
              <div className="space-y-2 mt-2 max-h-60 overflow-y-auto border border-slate-200 rounded-lg p-3">
                {stores?.map((store: any) => (
                  <label key={store.id} className="flex items-center gap-2 cursor-pointer hover:bg-slate-50 p-2 rounded">
                    <input
                      type="checkbox"
                      checked={applyConfig.storeIds.includes(store.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setApplyConfig({
                            ...applyConfig,
                            storeIds: [...applyConfig.storeIds, store.id],
                          });
                        } else {
                          setApplyConfig({
                            ...applyConfig,
                            storeIds: applyConfig.storeIds.filter((id) => id !== store.id),
                          });
                        }
                      }}
                      className="rounded"
                    />
                    <span className="text-sm text-slate-900">{store.name} - {store.city}</span>
                  </label>
                ))}
              </div>
              <p className="text-sm text-slate-600 mt-2">
                {applyConfig.storeIds.length} magasin(s) sélectionné(s)
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setApplyDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleApplyTemplate} disabled={applyTemplate.isPending}>
              {applyTemplate.isPending ? "Application..." : "Appliquer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
