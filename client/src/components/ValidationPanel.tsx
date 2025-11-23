import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { CheckCircle, Archive } from "lucide-react";
import { trpc } from "@/lib/trpc";

interface ValidationPanelProps {
  planogramId: number;
  status: "draft" | "active" | "archived";
  onStatusChange?: () => void;
}

export default function ValidationPanel({
  planogramId,
  status,
  onStatusChange,
}: ValidationPanelProps) {
  // @ts-ignore
  const updateStatusMutation = trpc.planograms.updateStatus.useMutation();

  const handleValidateAndDeploy = async () => {
    try {
      await updateStatusMutation.mutateAsync({
        planogramId,
        status: "active",
      });
      toast.success("Planogramme validé et déployé !");
      onStatusChange?.();
    } catch (error) {
      toast.error("Erreur lors de la validation");
      console.error(error);
    }
  };

  const handleArchive = async () => {
    try {
      await updateStatusMutation.mutateAsync({
        planogramId,
        status: "archived",
      });
      toast.success("Planogramme archivé");
      onStatusChange?.();
    } catch (error) {
      toast.error("Erreur lors de l'archivage");
      console.error(error);
    }
  };

  const statusLabel = {
    draft: "Brouillon",
    active: "Actif",
    archived: "Archivé",
  };

  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-200">
      <div className="container py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-slate-900 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-blue-600" />
              Validation du Planogramme
            </h2>
            <p className="text-sm text-slate-600 mt-1">
              Statut actuel:{" "}
              <span className="font-semibold">{statusLabel[status]}</span>
            </p>
          </div>
          <div className="flex gap-2">
            {status === "draft" && (
              <Button
                onClick={handleValidateAndDeploy}
                disabled={updateStatusMutation.isPending}
                className="gap-2 bg-green-600 hover:bg-green-700"
              >
                <CheckCircle className="w-4 h-4" />
                {updateStatusMutation.isPending
                  ? "Validation..."
                  : "Valider & Déployer"}
              </Button>
            )}
            {status === "active" && (
              <Button
                onClick={handleArchive}
                disabled={updateStatusMutation.isPending}
                variant="destructive"
                className="gap-2"
              >
                <Archive className="w-4 h-4" />
                {updateStatusMutation.isPending ? "Archivage..." : "Archiver"}
              </Button>
            )}
            {status === "archived" && (
              <div className="px-4 py-2 bg-orange-100 text-orange-800 rounded-lg text-sm font-medium">
                Archivé
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
