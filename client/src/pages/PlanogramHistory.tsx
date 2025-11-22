import { useState } from "react";
import { useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { ArrowLeft, Clock, GitCompare, RotateCcw, MessageSquare } from "lucide-react";
import { Link } from "wouter";
import { useModuleNavigation } from "@/hooks/useModuleNavigation";

export default function PlanogramHistory() {
  const { goBackToModule } = useModuleNavigation();
  const params = useParams();
  const planogramId = parseInt(params.id || "0");
  
  const { data: planogram } = trpc.planograms.getById.useQuery({ id: planogramId });
  const { data: history } = trpc.planograms.getHistory.useQuery({ planogramId });
  
  const [selectedVersions, setSelectedVersions] = useState<number[]>([]);
  const [showRestoreDialog, setShowRestoreDialog] = useState(false);
  const [restoreComment, setRestoreComment] = useState("");
  const [versionToRestore, setVersionToRestore] = useState<number | null>(null);
  
  const restoreMutation = trpc.planograms.restoreVersion.useMutation({
    onSuccess: () => {
      toast.success("Version restaurée avec succès !");
      setShowRestoreDialog(false);
      setRestoreComment("");
      setVersionToRestore(null);
    },
    onError: (error) => {
      toast.error(`Erreur lors de la restauration : ${error.message}`);
    },
  });

  const handleVersionSelect = (version: number) => {
    if (selectedVersions.includes(version)) {
      setSelectedVersions(selectedVersions.filter(v => v !== version));
    } else if (selectedVersions.length < 2) {
      setSelectedVersions([...selectedVersions, version]);
    } else {
      setSelectedVersions([selectedVersions[1], version]);
    }
  };

  const handleRestore = () => {
    if (versionToRestore === null) return;
    
    restoreMutation.mutate({
      planogramId,
      version: versionToRestore,
      comment: restoreComment,
    });
  };

  const getChangeTypeColor = (changeType: string) => {
    switch (changeType) {
      case "created": return "bg-blue-100 text-blue-800";
      case "updated": return "bg-yellow-100 text-yellow-800";
      case "activated": return "bg-green-100 text-green-800";
      case "archived": return "bg-gray-100 text-gray-800";
      case "restored": return "bg-purple-100 text-purple-800";
      default: return "bg-slate-100 text-slate-800";
    }
  };

  const getChangeTypeLabel = (changeType: string) => {
    switch (changeType) {
      case "created": return "Créé";
      case "updated": return "Modifié";
      case "activated": return "Activé";
      case "archived": return "Archivé";
      case "restored": return "Restauré";
      default: return changeType;
    }
  };

  if (!planogram) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-slate-600">Chargement...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200">
        <div className="container py-6">
          <div className="flex items-center gap-4 mb-4">
            <Button variant="ghost" size="sm" className="gap-2" onClick={goBackToModule}>
              <ArrowLeft className="w-4 h-4" />
              Retour
            </Button>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Historique des Versions</h1>
              <p className="text-slate-600 mt-1">{planogram.name} - Version actuelle: {planogram.version}</p>
            </div>
            {selectedVersions.length === 2 && (
              <Link href={`/planograms/${planogramId}/compare?v1=${selectedVersions[0]}&v2=${selectedVersions[1]}`}>
                <Button className="gap-2">
                  <GitCompare className="w-4 h-4" />
                  Comparer les versions
                </Button>
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="container py-8">
        {selectedVersions.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-blue-800">
              {selectedVersions.length === 1 
                ? `Version ${selectedVersions[0]} sélectionnée. Sélectionnez une autre version pour comparer.`
                : `Versions ${selectedVersions[0]} et ${selectedVersions[1]} sélectionnées. Cliquez sur "Comparer les versions" pour voir les différences.`
              }
            </p>
          </div>
        )}

        <div className="space-y-4">
          {history && history.length > 0 ? (
            history.map((entry: any) => (
              <Card 
                key={entry.id} 
                className={`border-slate-200 cursor-pointer transition-all ${
                  selectedVersions.includes(entry.version) 
                    ? 'ring-2 ring-blue-500 bg-blue-50' 
                    : 'hover:border-slate-300'
                }`}
                onClick={() => handleVersionSelect(entry.version)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <CardTitle className="text-lg">Version {entry.version}</CardTitle>
                        <Badge className={getChangeTypeColor(entry.changeType)}>
                          {getChangeTypeLabel(entry.changeType)}
                        </Badge>
                      </div>
                      <CardDescription className="flex items-center gap-4">
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {new Date(entry.createdAt).toLocaleString('fr-FR')}
                        </span>
                        {entry.changedBy && (
                          <span>Par: {entry.changedBy}</span>
                        )}
                      </CardDescription>
                    </div>
                    {entry.version !== planogram.version && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-2"
                        onClick={(e) => {
                          e.stopPropagation();
                          setVersionToRestore(entry.version);
                          setShowRestoreDialog(true);
                        }}
                      >
                        <RotateCcw className="w-4 h-4" />
                        Restaurer
                      </Button>
                    )}
                  </div>
                </CardHeader>
                {entry.comment && (
                  <CardContent>
                    <div className="flex gap-2 text-sm text-slate-600">
                      <MessageSquare className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      <p>{entry.comment}</p>
                    </div>
                  </CardContent>
                )}
              </Card>
            ))
          ) : (
            <Card className="border-slate-200">
              <CardContent className="py-12 text-center">
                <Clock className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                <p className="text-slate-600">Aucun historique disponible pour ce planogramme</p>
              </CardContent>
            </Card>
          )}
        </div>
      </main>

      {/* Restore Dialog */}
      <Dialog open={showRestoreDialog} onOpenChange={setShowRestoreDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Restaurer la version {versionToRestore}</DialogTitle>
            <DialogDescription>
              Cette action créera une nouvelle version du planogramme basée sur la version {versionToRestore}.
              La version actuelle sera préservée dans l'historique.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium text-slate-700 mb-2 block">
                Commentaire (optionnel)
              </label>
              <Textarea
                placeholder="Expliquez pourquoi vous restaurez cette version..."
                value={restoreComment}
                onChange={(e) => setRestoreComment(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRestoreDialog(false)}>
              Annuler
            </Button>
            <Button onClick={handleRestore} disabled={restoreMutation.isPending}>
              {restoreMutation.isPending ? "Restauration..." : "Restaurer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
