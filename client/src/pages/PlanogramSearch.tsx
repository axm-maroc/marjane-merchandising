import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Search, 
  Filter, 
  Calendar, 
  MapPin, 
  LayoutGrid,
  ArrowLeft,
  Download,
  Archive,
  Copy,
  Trash2,
  ChevronRight,
  AlertCircle
} from "lucide-react";
import { Link } from "wouter";
import { toast } from "sonner";

interface SearchFilters {
  searchQuery: string;
  storeId: number | null;
  status: string;
  startDate: Date | null;
  endDate: Date | null;
}

export default function PlanogramSearch() {
  const [filters, setFilters] = useState<SearchFilters>({
    searchQuery: "",
    storeId: null,
    status: "all",
    startDate: null,
    endDate: null,
  });

  const [currentPage, setCurrentPage] = useState(0);
  const [selectedPlanograms, setSelectedPlanograms] = useState<Set<number>>(new Set());
  const pageSize = 20;

  // Récupérer les données
  const { data: stores } = trpc.stores.list.useQuery();
  const { data: searchResults, isLoading, refetch } = (trpc.planograms as any).search.useQuery({
    searchQuery: filters.searchQuery || undefined,
    storeId: filters.storeId || undefined,
    status: filters.status !== "all" ? filters.status : undefined,
    startDate: filters.startDate || undefined,
    endDate: filters.endDate || undefined,
    limit: pageSize,
    offset: currentPage * pageSize,
  });
  const { data: stats } = (trpc.planograms as any).searchStats.useQuery();
  
  // Mutations
  const archiveMultiple = (trpc.planograms as any).archiveMultiple.useMutation();
  const duplicateMultiple = (trpc.planograms as any).duplicateMultiple.useMutation();
  const deleteMultiple = (trpc.planograms as any).deleteMultiple.useMutation();

  const handleSearch = (query: string) => {
    setFilters({ ...filters, searchQuery: query });
    setCurrentPage(0);
  };

  const handleStoreFilter = (storeId: number | null) => {
    setFilters({ ...filters, storeId });
    setCurrentPage(0);
  };

  const handleStatusFilter = (status: string) => {
    setFilters({ ...filters, status });
    setCurrentPage(0);
  };

  const handleDateRange = (startDate: Date | null, endDate: Date | null) => {
    setFilters({ ...filters, startDate, endDate });
    setCurrentPage(0);
  };

  const handleClearFilters = () => {
    setFilters({
      searchQuery: "",
      storeId: null,
      status: "all",
      startDate: null,
      endDate: null,
    });
    setCurrentPage(0);
  };

  const handleSelectAll = () => {
    if (searchResults?.results) {
      if (selectedPlanograms.size === searchResults.results.length) {
        setSelectedPlanograms(new Set<number>());
      } else {
        const newSelected = new Set<number>(searchResults.results.map((p: any) => p.id));
        setSelectedPlanograms(newSelected);
      }
    }
  };

  const handleSelectPlanogram = (id: number) => {
    const newSelected = new Set(selectedPlanograms);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedPlanograms(newSelected);
  };

  const handleArchiveSelected = async () => {
    if (selectedPlanograms.size === 0) {
      toast.error("Aucun planogramme sélectionné");
      return;
    }

    try {
      await archiveMultiple.mutateAsync({
        planogramIds: Array.from(selectedPlanograms),
      });
      toast.success(`${selectedPlanograms.size} planogramme(s) archivé(s)`);
      setSelectedPlanograms(new Set());
      refetch();
    } catch (error) {
      toast.error("Erreur lors de l'archivage");
    }
  };

  const handleDuplicateSelected = async () => {
    if (selectedPlanograms.size === 0) {
      toast.error("Aucun planogramme sélectionné");
      return;
    }

    try {
      await duplicateMultiple.mutateAsync({
        planogramIds: Array.from(selectedPlanograms),
        nameSuffix: " (copie)",
      });
      toast.success(`${selectedPlanograms.size} planogramme(s) dupliqué(s)`);
      setSelectedPlanograms(new Set());
      refetch();
    } catch (error) {
      toast.error("Erreur lors de la duplication");
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedPlanograms.size === 0) {
      toast.error("Aucun planogramme sélectionné");
      return;
    }

    if (!confirm(`Êtes-vous sûr de vouloir supprimer ${selectedPlanograms.size} planogramme(s) ? Cette action est irréversible.`)) {
      return;
    }

    try {
      await deleteMultiple.mutateAsync({
        planogramIds: Array.from(selectedPlanograms),
      });
      toast.success(`${selectedPlanograms.size} planogramme(s) supprimé(s)`);
      setSelectedPlanograms(new Set());
      refetch();
    } catch (error) {
      toast.error("Erreur lors de la suppression");
    }
  };

  const handleExportResults = () => {
    if (!searchResults?.results || searchResults.results.length === 0) {
      toast.error("Aucun résultat à exporter");
      return;
    }

    const csv = [
      ["ID", "Nom", "Magasin", "Emplacement", "Statut", "Version", "Date de création"].join(","),
      ...searchResults.results.map((p: any) =>
        [
          p.id,
          `"${p.name}"`,
          `"${p.storeName}"`,
          `"${p.locationName}"`,
          p.status,
          p.version,
          new Date(p.createdAt).toLocaleDateString("fr-FR"),
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `planograms-search-${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    toast.success("Résultats exportés en CSV");
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "draft":
        return "bg-yellow-100 text-yellow-800";
      case "archived":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "active":
        return "✅ Actif";
      case "draft":
        return "📝 Brouillon";
      case "archived":
        return "📦 Archivé";
      default:
        return status;
    }
  };

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
                <Search className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-slate-900">Recherche de Planogrammes</h1>
                <p className="text-slate-600 mt-1">Trouvez rapidement vos planogrammes par nom, magasin ou date</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Panneau de filtres */}
          <Card className="lg:col-span-1 h-fit">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="w-5 h-5" />
                Filtres
              </CardTitle>
              <CardDescription>Affinez votre recherche</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Recherche textuelle */}
              <div>
                <label className="text-sm font-medium text-slate-700 mb-2 block">
                  Rechercher
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                  <Input
                    placeholder="Nom, magasin, emplacement..."
                    value={filters.searchQuery}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Filtre par magasin */}
              <div>
                <label className="text-sm font-medium text-slate-700 mb-2 block">
                  Magasin
                </label>
                <select
                  value={filters.storeId || ""}
                  onChange={(e) => handleStoreFilter(e.target.value ? parseInt(e.target.value) : null)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                >
                  <option value="">Tous les magasins</option>
                  {stores?.map((store: any) => (
                    <option key={store.id} value={store.id}>
                      {store.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Filtre par statut */}
              <div>
                <label className="text-sm font-medium text-slate-700 mb-2 block">
                  Statut
                </label>
                <select
                  value={filters.status}
                  onChange={(e) => handleStatusFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                >
                  <option value="all">Tous les statuts</option>
                  <option value="active">✅ Actif</option>
                  <option value="draft">📝 Brouillon</option>
                  <option value="archived">📦 Archivé</option>
                </select>
              </div>

              {/* Filtre par date */}
              <div>
                <label className="text-sm font-medium text-slate-700 mb-2 block">
                  Date de création
                </label>
                <div className="space-y-2">
                  <Input
                    type="date"
                    value={filters.startDate ? filters.startDate.toISOString().split("T")[0] : ""}
                    onChange={(e) =>
                      handleDateRange(
                        e.target.value ? new Date(e.target.value) : null,
                        filters.endDate
                      )
                    }
                    placeholder="Du"
                    className="text-sm"
                  />
                  <Input
                    type="date"
                    value={filters.endDate ? filters.endDate.toISOString().split("T")[0] : ""}
                    onChange={(e) =>
                      handleDateRange(
                        filters.startDate,
                        e.target.value ? new Date(e.target.value) : null
                      )
                    }
                    placeholder="Au"
                    className="text-sm"
                  />
                </div>
              </div>

              {/* Boutons d'action */}
              <div className="space-y-2 pt-4 border-t">
                <Button
                  onClick={handleClearFilters}
                  variant="outline"
                  className="w-full"
                >
                  Réinitialiser
                </Button>
                <Button
                  onClick={handleExportResults}
                  variant="default"
                  className="w-full gap-2"
                >
                  <Download className="w-4 h-4" />
                  Exporter CSV
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Résultats */}
          <div className="lg:col-span-3 space-y-6">
            {/* Statistiques */}
            {stats && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-slate-900">
                        {stats.totalPlanograms}
                      </div>
                      <p className="text-sm text-slate-600 mt-1">Total de planogrammes</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-green-600">
                        {stats.byStatus.active || 0}
                      </div>
                      <p className="text-sm text-slate-600 mt-1">Actifs</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-yellow-600">
                        {stats.byStatus.draft || 0}
                      </div>
                      <p className="text-sm text-slate-600 mt-1">Brouillons</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Barre d'actions en masse */}
            {selectedPlanograms.size > 0 && (
              <Card className="border-blue-200 bg-blue-50">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-5 h-5 text-blue-600" />
                      <span className="text-sm font-medium text-blue-900">
                        {selectedPlanograms.size} planogramme(s) sélectionné(s)
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={handleDuplicateSelected}
                        variant="outline"
                        size="sm"
                        className="gap-2"
                        disabled={duplicateMultiple.isPending}
                      >
                        <Copy className="w-4 h-4" />
                        Dupliquer
                      </Button>
                      <Button
                        onClick={handleArchiveSelected}
                        variant="outline"
                        size="sm"
                        className="gap-2"
                        disabled={archiveMultiple.isPending}
                      >
                        <Archive className="w-4 h-4" />
                        Archiver
                      </Button>
                      <Button
                        onClick={handleDeleteSelected}
                        variant="destructive"
                        size="sm"
                        className="gap-2"
                        disabled={deleteMultiple.isPending}
                      >
                        <Trash2 className="w-4 h-4" />
                        Supprimer
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Résultats de recherche */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Résultats</CardTitle>
                    <CardDescription>
                      {searchResults?.total || 0} planogramme(s) trouvé(s)
                    </CardDescription>
                  </div>
                  {searchResults?.results && searchResults.results.length > 0 && (
                    <div className="flex items-center gap-2">
                      <Checkbox
                        checked={selectedPlanograms.size === searchResults.results.length && searchResults.results.length > 0}
                        onCheckedChange={handleSelectAll}
                        id="select-all"
                      />
                      <label htmlFor="select-all" className="text-sm font-medium cursor-pointer">
                        Sélectionner tout
                      </label>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="text-center py-12">
                    <div className="inline-block animate-spin">
                      <LayoutGrid className="w-8 h-8 text-slate-400" />
                    </div>
                    <p className="text-slate-600 mt-4">Recherche en cours...</p>
                  </div>
                ) : searchResults?.results && searchResults.results.length > 0 ? (
                  <div className="space-y-3">
                    {searchResults.results.map((planogram: any) => (
                      <div
                        key={planogram.id}
                        className="p-4 border border-slate-200 rounded-lg hover:border-purple-400 hover:shadow-md transition-all"
                      >
                        <div className="flex items-start gap-4">
                          <Checkbox
                            checked={selectedPlanograms.has(planogram.id)}
                            onCheckedChange={() => handleSelectPlanogram(planogram.id)}
                            className="mt-1"
                          />
                          <Link href={`/planograms/location/${planogram.locationId}`}>
                            <div className="flex-1 min-w-0 cursor-pointer group">
                              <div className="flex items-center gap-2 mb-2">
                                <h3 className="text-lg font-semibold text-slate-900 truncate group-hover:text-purple-600">
                                  {planogram.name}
                                </h3>
                                <Badge className={getStatusColor(planogram.status)}>
                                  {getStatusLabel(planogram.status)}
                                </Badge>
                              </div>
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-slate-600 mt-3">
                                <div className="flex items-center gap-2">
                                  <MapPin className="w-4 h-4" />
                                  <span>{planogram.storeName}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <LayoutGrid className="w-4 h-4" />
                                  <span>{planogram.locationName}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">v{planogram.version}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Calendar className="w-4 h-4" />
                                  <span>{new Date(planogram.createdAt).toLocaleDateString("fr-FR")}</span>
                                </div>
                              </div>
                            </div>
                          </Link>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="flex-shrink-0 mt-2"
                          >
                            <ChevronRight className="w-5 h-5" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <LayoutGrid className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p className="text-slate-600">Aucun planogramme ne correspond à votre recherche</p>
                    <Button
                      variant="outline"
                      onClick={handleClearFilters}
                      className="mt-4"
                    >
                      Réinitialiser les filtres
                    </Button>
                  </div>
                )}

                {/* Pagination */}
                {searchResults && searchResults.total > pageSize && (
                  <div className="flex items-center justify-between mt-6 pt-6 border-t">
                    <div className="text-sm text-slate-600">
                      Page {currentPage + 1} sur {Math.ceil(searchResults.total / pageSize)}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        disabled={currentPage === 0}
                        onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                      >
                        Précédent
                      </Button>
                      <Button
                        variant="outline"
                        disabled={currentPage >= Math.ceil(searchResults.total / pageSize) - 1}
                        onClick={() => setCurrentPage(currentPage + 1)}
                      >
                        Suivant
                      </Button>
                    </div>
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
