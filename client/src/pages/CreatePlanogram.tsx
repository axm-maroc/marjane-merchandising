import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  ArrowLeft, 
  Plus, 
  Grid3x3, 
  Package, 
  CheckCircle2, 
  Search,
  Wine,
  Cookie,
  Milk,
  Apple,
  IceCream
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Link, useLocation } from "wouter";
import ProductCard from "@/components/ProductCard";
import { useModuleNavigation } from "@/hooks/useModuleNavigation";

const THEMES = [
  { id: "boissons", label: "Boissons", icon: Wine, color: "blue", categories: ["Boissons"] },
  { id: "snacks", label: "Snacks & Biscuits", icon: Cookie, color: "orange", categories: ["Snacks", "Biscuits"] },
  { id: "produits-laitiers", label: "Produits Laitiers", icon: Milk, color: "yellow", categories: ["Produits Laitiers"] },
  { id: "fruits-legumes", label: "Fruits & Légumes", icon: Apple, color: "green", categories: ["Fruits", "Légumes"] },
  { id: "surgeles", label: "Surgelés", icon: IceCream, color: "cyan", categories: ["Surgelés"] },
];

export default function CreatePlanogram() {
  const { goBackToModule } = useModuleNavigation();
  const [, setLocation] = useLocation();
  const [step, setStep] = useState(1);
  
  // Step 1: Basic Info
  const [storeId, setStoreId] = useState<number | null>(null);
  const [zoneId, setZoneId] = useState<number | null>(null);
  const [name, setName] = useState("");
  const [location, setLocationValue] = useState("");
  
  // Step 2: Theme Selection
  const [selectedTheme, setSelectedTheme] = useState<string | null>(null);
  
  // Step 3: Dimensions
  const [width, setWidth] = useState(3);
  const [height, setHeight] = useState(5);
  const [depth, setDepth] = useState(3);
  
  // Step 4: Product Selection
  const [selectedProducts, setSelectedProducts] = useState<Set<number>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");

  const { data: stores } = trpc.stores.list.useQuery();
  const { data: zones } = trpc.zones.byStore.useQuery(
    { storeId: storeId || 0 },
    { enabled: !!storeId }
  );
  const { data: products } = trpc.products.list.useQuery();
  // @ts-ignore - Type will be available after server restart
  const createMutation = trpc.planogramLocations.create.useMutation({
    onSuccess: (result: any) => {
      toast.success("Planogramme créé avec succès !");
      const planogramId = result.planogramId || result.id;
      setLocation(`/planograms/${planogramId}`);
    },
    onError: (error: any) => {
      toast.error(`Erreur: ${error.message}`);
      console.error("Erreur création planogramme:", error);
    },
  });

  // Filter products by selected theme
  const filteredProducts = products?.filter(product => {
    const theme = THEMES.find(t => t.id === selectedTheme);
    if (!theme) return false;
    
    // Pour l'instant, on affiche tous les produits du thème sélectionné
    // TODO: Améliorer le filtrage par catégorie avec une jointure
    const matchesSearch = searchQuery === "" || 
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.brand?.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesSearch;
  });

  const toggleProduct = (productId: number) => {
    const newSelected = new Set(selectedProducts);
    if (newSelected.has(productId)) {
      newSelected.delete(productId);
    } else {
      newSelected.add(productId);
    }
    setSelectedProducts(newSelected);
  };

  const handleCreate = async () => {
    if (!storeId || !name || !location || !selectedTheme) {
      toast.error("Veuillez remplir tous les champs obligatoires");
      return;
    }

    if (selectedProducts.size === 0) {
      toast.error("Veuillez sélectionner au moins un produit");
      return;
    }

    createMutation.mutate({
      storeId,
      name,
      location,
      zoneId: zoneId || undefined,
      theme: selectedTheme,
      width,
      height,
      depth,
      productIds: Array.from(selectedProducts),
    });
  };

  const canProceedStep1 = storeId && name && location;
  const canProceedStep2 = selectedTheme;
  const canProceedStep3 = width > 0 && height > 0 && depth > 0;
  const canCreate = selectedProducts.size > 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 shadow-sm">
        <div className="container py-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={goBackToModule}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-100 rounded-lg">
                <Plus className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-slate-900">Créer un Planogramme</h1>
                <p className="text-slate-600 mt-1">Configurez votre nouveau planogramme étape par étape</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Progress Steps */}
      <div className="bg-white border-b border-slate-200">
        <div className="container py-4">
          <div className="flex items-center justify-between max-w-3xl mx-auto">
            {[
              { num: 1, label: "Informations" },
              { num: 2, label: "Thème" },
              { num: 3, label: "Dimensions" },
              { num: 4, label: "Produits" },
            ].map((s, idx) => (
              <div key={s.num} className="flex items-center flex-1">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                      step >= s.num
                        ? "bg-green-600 text-white"
                        : "bg-slate-200 text-slate-500"
                    }`}
                  >
                    {step > s.num ? <CheckCircle2 className="w-5 h-5" /> : s.num}
                  </div>
                  <span className={`font-medium ${step >= s.num ? "text-slate-900" : "text-slate-500"}`}>
                    {s.label}
                  </span>
                </div>
                {idx < 3 && (
                  <div
                    className={`flex-1 h-1 mx-4 ${
                      step > s.num ? "bg-green-600" : "bg-slate-200"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="container py-8">
        <div className="max-w-4xl mx-auto">
          {/* Step 1: Basic Info */}
          {step === 1 && (
            <Card className="border-slate-200">
              <CardHeader>
                <CardTitle className="text-slate-900">Informations de Base</CardTitle>
                <CardDescription className="text-slate-600">
                  Définissez les informations principales du planogramme
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label htmlFor="store" className="text-slate-700">Magasin *</Label>
                  <select
                    id="store"
                    value={storeId || ""}
                    onChange={(e) => setStoreId(parseInt(e.target.value))}
                    className="w-full mt-2 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="">Sélectionner un magasin</option>
                    {stores?.map((store) => (
                      <option key={store.id} value={store.id}>
                        {store.name}
                      </option>
                    ))}
                  </select>
                </div>

                {storeId && (
                  <div>
                    <Label htmlFor="zone" className="text-slate-700">Zone (optionnel)</Label>
                    <select
                      id="zone"
                      value={zoneId || ""}
                      onChange={(e) => setZoneId(e.target.value ? parseInt(e.target.value) : null)}
                      className="w-full mt-2 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      <option value="">Aucune zone spécifique</option>
                      {zones?.map((zone) => (
                        <option key={zone.id} value={zone.id}>
                          {zone.code} - {zone.name} {zone.isSponsored ? '(Sponsorisée)' : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <Label htmlFor="name" className="text-slate-700">Nom du Planogramme *</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex: Rayon Boissons - Allée 3"
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label htmlFor="location" className="text-slate-700">Emplacement dans le magasin *</Label>
                  <Input
                    id="location"
                    value={location}
                    onChange={(e) => setLocationValue(e.target.value)}
                    placeholder="Ex: Allée 3, Section A"
                    className="mt-2"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <Button
                    onClick={() => setStep(2)}
                    disabled={!canProceedStep1}
                  >
                    Suivant
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 2: Theme Selection */}
          {step === 2 && (
            <Card className="border-slate-200">
              <CardHeader>
                <CardTitle className="text-slate-900">Sélection du Thème</CardTitle>
                <CardDescription className="text-slate-600">
                  Choisissez le thème d'étalage pour filtrer les produits appropriés
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {THEMES.map((theme) => {
                    const Icon = theme.icon;
                    return (
                      <button
                        key={theme.id}
                        onClick={() => setSelectedTheme(theme.id)}
                        className={`p-6 rounded-lg border-2 transition-all ${
                          selectedTheme === theme.id
                            ? `border-${theme.color}-600 bg-${theme.color}-50`
                            : "border-slate-200 hover:border-slate-300"
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <div className={`p-3 bg-${theme.color}-100 rounded-lg`}>
                            <Icon className={`w-8 h-8 text-${theme.color}-600`} />
                          </div>
                          <div className="text-left">
                            <div className="font-semibold text-slate-900">{theme.label}</div>
                            <div className="text-sm text-slate-600">
                              {theme.categories.join(", ")}
                            </div>
                          </div>
                          {selectedTheme === theme.id && (
                            <CheckCircle2 className={`w-6 h-6 text-${theme.color}-600 ml-auto`} />
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div className="flex justify-between gap-3 pt-4">
                  <Button
                    onClick={() => setStep(1)}
                    variant="outline"
                  >
                    Précédent
                  </Button>
                  <Button
                    onClick={() => setStep(3)}
                    disabled={!canProceedStep2}
                  >
                    Suivant
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 3: Dimensions */}
          {step === 3 && (
            <Card className="border-slate-200">
              <CardHeader>
                <CardTitle className="text-slate-900 flex items-center gap-2">
                  <Grid3x3 className="w-5 h-5" />
                  Dimensions du Rayonnage
                </CardTitle>
                <CardDescription className="text-slate-600">
                  Définissez la taille du rayonnage (nombre de positions)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-3 gap-6">
                  <div>
                    <Label htmlFor="width" className="text-slate-700">Largeur (colonnes)</Label>
                    <Input
                      id="width"
                      type="number"
                      min="1"
                      max="10"
                      value={width}
                      onChange={(e) => setWidth(parseInt(e.target.value) || 1)}
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label htmlFor="height" className="text-slate-700">Hauteur (étagères)</Label>
                    <Input
                      id="height"
                      type="number"
                      min="1"
                      max="10"
                      value={height}
                      onChange={(e) => setHeight(parseInt(e.target.value) || 1)}
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label htmlFor="depth" className="text-slate-700">Profondeur (produits)</Label>
                    <Input
                      id="depth"
                      type="number"
                      min="1"
                      max="10"
                      value={depth}
                      onChange={(e) => setDepth(parseInt(e.target.value) || 1)}
                      className="mt-2"
                    />
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Package className="w-5 h-5 text-blue-600" />
                    <span className="font-semibold text-blue-900">Capacité Totale</span>
                  </div>
                  <p className="text-blue-700">
                    Ce rayonnage pourra contenir jusqu'à <strong>{width * height * depth} produits</strong>
                    {` `}({width} colonnes × {height} étagères × {depth} profondeur)
                  </p>
                </div>

                <div className="flex justify-between gap-3 pt-4">
                  <Button
                    onClick={() => setStep(2)}
                    variant="outline"
                  >
                    Précédent
                  </Button>
                  <Button
                    onClick={() => setStep(4)}
                    disabled={!canProceedStep3}
                  >
                    Suivant
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 4: Product Selection */}
          {step === 4 && (
            <Card className="border-slate-200">
              <CardHeader>
                <CardTitle className="text-slate-900 flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  Sélection des Produits
                </CardTitle>
                <CardDescription className="text-slate-600">
                  Choisissez les produits à placer dans ce planogramme (sélection multiple)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Rechercher un produit..."
                    className="pl-10"
                  />
                </div>

                {/* Selected Count */}
                <div className="flex items-center justify-between">
                  <Badge variant="default" className="text-sm px-3 py-1">
                    {selectedProducts.size} produit(s) sélectionné(s)
                  </Badge>
                  {selectedProducts.size > 0 && (
                    <Button
                      onClick={() => setSelectedProducts(new Set())}
                      variant="ghost"
                      size="sm"
                    >
                      Tout désélectionner
                    </Button>
                  )}
                </div>

                {/* Products Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[500px] overflow-y-auto">
                  {filteredProducts?.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      isSelected={selectedProducts.has(product.id)}
                      onSelect={toggleProduct}
                      variant="grid"
                      showDescription={true}
                    />
                  ))}
                </div>

                <div className="flex justify-between gap-3 pt-4">
                  <Button
                    onClick={() => setStep(3)}
                    variant="outline"
                  >
                    Précédent
                  </Button>
                  <Button
                    onClick={handleCreate}
                    disabled={!canCreate}
                  >
                    Créer le Planogramme
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
