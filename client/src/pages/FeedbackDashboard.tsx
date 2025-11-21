import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { AlertCircle, CheckCircle, Clock, Filter, MessageSquare } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function FeedbackDashboard() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [selectedStore, setSelectedStore] = useState<number | undefined>();
  const [selectedStatus, setSelectedStatus] = useState<"pending" | "in_progress" | "resolved" | undefined>();

  // Récupérer les magasins
  const { data: stores } = trpc.stores.list.useQuery();

  // Récupérer les feedbacks négatifs
  // @ts-ignore - Type will be available after server restart
  const { data: feedbacks, refetch } = trpc.feedback.getNegative.useQuery({
    storeId: selectedStore,
    status: selectedStatus,
  });

  // Récupérer les statistiques
  // @ts-ignore - Type will be available after server restart
  const { data: stats } = trpc.feedback.getStats.useQuery({
    storeId: selectedStore,
  });

  // Mutation pour changer le statut
  // @ts-ignore - Type will be available after server restart
  const updateStatus = trpc.feedback.updateStatus.useMutation({
    onSuccess: () => {
      toast.success("Statut mis à jour avec succès");
      refetch();
    },
    onError: (error: any) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  const handleStatusChange = (feedbackId: number, newStatus: "pending" | "in_progress" | "resolved") => {
    if (!isAuthenticated) {
      toast.error("Vous devez être connecté pour modifier le statut");
      return;
    }
    updateStatus.mutate({ feedbackId, status: newStatus });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="destructive" className="flex items-center gap-1"><AlertCircle className="w-3 h-3" /> En attente</Badge>;
      case "in_progress":
        return <Badge variant="default" className="flex items-center gap-1 bg-blue-500"><Clock className="w-3 h-3" /> En cours</Badge>;
      case "resolved":
        return <Badge variant="default" className="flex items-center gap-1 bg-green-500"><CheckCircle className="w-3 h-3" /> Résolu</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getScoreColor = (score: number) => {
    if (score <= 3) return "text-red-600 font-bold";
    if (score <= 6) return "text-orange-600 font-semibold";
    return "text-gray-600";
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        {/* En-tête */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Tableau de Bord des Feedbacks Négatifs</h1>
          <p className="text-gray-600">Gérez et suivez les feedbacks clients nécessitant une attention particulière</p>
        </div>

        {/* Statistiques */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600">Total</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats.total}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-red-600">En attente</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-red-600">{stats.pending}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-blue-600">En cours</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-600">{stats.inProgress}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-green-600">Résolus</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">{stats.resolved}</div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filtres */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Filtres
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Magasin</label>
                <Select
                  value={selectedStore?.toString() || "all"}
                  onValueChange={(value) => setSelectedStore(value === "all" ? undefined : Number(value))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Tous les magasins" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les magasins</SelectItem>
                    {stores?.map((store: any) => (
                      <SelectItem key={store.id} value={store.id.toString()}>
                        {store.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Statut</label>
                <Select
                  value={selectedStatus || "all"}
                  onValueChange={(value) => setSelectedStatus(value === "all" ? undefined : value as any)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Tous les statuts" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les statuts</SelectItem>
                    <SelectItem value="pending">En attente</SelectItem>
                    <SelectItem value="in_progress">En cours</SelectItem>
                    <SelectItem value="resolved">Résolu</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Liste des feedbacks */}
        <div className="space-y-4">
          {feedbacks && feedbacks.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center">
                <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Aucun feedback négatif trouvé avec ces filtres</p>
              </CardContent>
            </Card>
          )}

          {feedbacks?.map((feedback: any) => (
            <Card key={feedback.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg mb-1">
                      {feedback.storeName} - {feedback.storeCity}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-2">
                      <span>
                        {new Date(feedback.createdAt).toLocaleDateString("fr-FR", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                      {feedback.customerEmail && (
                        <>
                          <span>•</span>
                          <span className="text-blue-600">{feedback.customerEmail}</span>
                        </>
                      )}
                    </CardDescription>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <div className={`text-2xl font-bold ${getScoreColor(feedback.score)}`}>
                      {feedback.score}/10
                    </div>
                    {getStatusBadge(feedback.status)}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {feedback.comment && (
                  <div className="bg-gray-50 p-4 rounded-lg mb-4">
                    <p className="text-gray-700 italic">"{feedback.comment}"</p>
                  </div>
                )}

                {feedback.resolvedAt && feedback.resolverName && (
                  <div className="text-sm text-gray-600 mb-4">
                    Résolu par <span className="font-medium">{feedback.resolverName}</span> le{" "}
                    {new Date(feedback.resolvedAt).toLocaleDateString("fr-FR")}
                  </div>
                )}

                {isAuthenticated && (
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleStatusChange(feedback.id, "pending")}
                      disabled={feedback.status === "pending" || updateStatus.isPending}
                    >
                      Marquer en attente
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleStatusChange(feedback.id, "in_progress")}
                      disabled={feedback.status === "in_progress" || updateStatus.isPending}
                      className="border-blue-500 text-blue-600 hover:bg-blue-50"
                    >
                      Marquer en cours
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleStatusChange(feedback.id, "resolved")}
                      disabled={feedback.status === "resolved" || updateStatus.isPending}
                      className="border-green-500 text-green-600 hover:bg-green-50"
                    >
                      Marquer résolu
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
