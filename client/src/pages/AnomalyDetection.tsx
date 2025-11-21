import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft, AlertTriangle, Upload, Camera, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { Link } from "wouter";
import { useState } from "react";
import { toast } from "sonner";

export default function AnomalyDetection() {
  const [photoUrl, setPhotoUrl] = useState("");
  const [planogramId, setPlanogramId] = useState<number>(180002); // Default to first available planogram
  const [detectionResult, setDetectionResult] = useState<any>(null);

  // const { data: planograms } = trpc.planograms.list.useQuery();

  const detectMutation = trpc.anomalies.detect.useMutation({
    onSuccess: (data) => {
      setDetectionResult(data);
      toast.success("Analyse terminée !");
    },
    onError: (error) => {
      const errorMessage = error.message || "Erreur lors de l'analyse";
      toast.error(errorMessage);
      console.error('[AnomalyDetection] Error:', error);
    },
  });

  const handleDetect = () => {
    if (!photoUrl) {
      toast.error("Veuillez entrer une URL de photo");
      return;
    }

    detectMutation.mutate({
      planogramId,
      photoUrl,
      photoType: "real",
    });
  };

  const handleExamplePhoto = () => {
    // Utiliser une URL d'exemple de rayonnage Marjane
    const exampleUrl = "https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=800";
    setPhotoUrl(exampleUrl);
    toast.info("Photo d'exemple chargée");
  };

  const severityConfig = {
    high: {
      label: "Haute",
      color: "text-red-600",
      bgColor: "bg-red-50",
      borderColor: "border-red-200",
      icon: XCircle,
    },
    medium: {
      label: "Moyenne",
      color: "text-yellow-600",
      bgColor: "bg-yellow-50",
      borderColor: "border-yellow-200",
      icon: AlertCircle,
    },
    low: {
      label: "Basse",
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200",
      icon: AlertCircle,
    },
  };

  const typeLabels: Record<string, string> = {
    missing_product: "Produit manquant",
    wrong_position: "Mauvaise position",
    wrong_product: "Mauvais produit",
    quantity_mismatch: "Quantité incorrecte",
    damaged_product: "Produit endommagé",
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
            <div>
              <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
                <AlertTriangle className="w-8 h-8 text-orange-600" />
                Détection d'Anomalies
              </h1>
              <p className="text-slate-600 mt-1">Analyse automatique par vision IA</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Input Panel */}
          <div className="lg:col-span-1">
            <Card className="border-slate-200">
              <CardHeader>
                <CardTitle className="text-slate-900">Photo du Rayonnage</CardTitle>
                <CardDescription className="text-slate-600">
                  Téléchargez une photo pour détecter les anomalies
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-2 block">URL de la photo</label>
                  <Input
                    type="url"
                    placeholder="https://exemple.com/photo.jpg"
                    value={photoUrl}
                    onChange={(e) => setPhotoUrl(e.target.value)}
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    Entrez l'URL d'une photo de rayonnage
                  </p>
                </div>

                <Button
                  onClick={handleExamplePhoto}
                  variant="outline"
                  className="w-full"
                >
                  <Camera className="w-4 h-4 mr-2" />
                  Utiliser une photo d'exemple
                </Button>

                <div className="pt-4 border-t">
                  <Button
                    onClick={handleDetect}
                    disabled={!photoUrl || detectMutation.isPending}
                    className="w-full"
                  >
                    {detectMutation.isPending ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Analyse en cours...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4 mr-2" />
                        Analyser la Photo
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Preview */}
            {photoUrl && (
              <Card className="border-slate-200 mt-4">
                <CardHeader>
                  <CardTitle className="text-sm text-slate-900">Aperçu</CardTitle>
                </CardHeader>
                <CardContent>
                  <img
                    src={photoUrl}
                    alt="Preview"
                    className="w-full rounded-lg border border-slate-200"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "https://via.placeholder.com/400x300?text=Image+non+disponible";
                    }}
                  />
                </CardContent>
              </Card>
            )}
          </div>

          {/* Results Panel */}
          <div className="lg:col-span-2">
            {detectionResult ? (
              <div className="space-y-6">
                {/* Score Card */}
                <Card className={`border-slate-200 ${
                  detectionResult.overallScore >= 80
                    ? "bg-gradient-to-br from-green-50 to-emerald-50"
                    : detectionResult.overallScore >= 60
                    ? "bg-gradient-to-br from-yellow-50 to-orange-50"
                    : "bg-gradient-to-br from-red-50 to-pink-50"
                }`}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-2xl text-slate-900">
                          Score de Conformité
                        </CardTitle>
                        <CardDescription className="text-slate-700 mt-2">
                          {detectionResult.summary}
                        </CardDescription>
                      </div>
                      <div className="text-center">
                        <div className={`text-5xl font-bold ${
                          detectionResult.overallScore >= 80
                            ? "text-green-600"
                            : detectionResult.overallScore >= 60
                            ? "text-yellow-600"
                            : "text-red-600"
                        }`}>
                          {detectionResult.overallScore}
                        </div>
                        <div className="text-sm text-slate-600 mt-1">/ 100</div>
                      </div>
                    </div>
                  </CardHeader>
                </Card>

                {/* Anomalies */}
                {detectionResult.anomalies.length > 0 ? (
                  <Card className="border-slate-200">
                    <CardHeader>
                      <CardTitle className="text-slate-900">
                        Anomalies Détectées ({detectionResult.anomalies.length})
                      </CardTitle>
                      <CardDescription className="text-slate-600">
                        Actions recommandées pour corriger les écarts
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {detectionResult.anomalies.map((anomaly: any, index: number) => {
                          const config = severityConfig[anomaly.severity as keyof typeof severityConfig];
                          const Icon = config.icon;

                          return (
                            <div
                              key={index}
                              className={`p-4 rounded-lg border-l-4 ${config.bgColor} ${config.borderColor}`}
                            >
                              <div className="flex items-start justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <Icon className={`w-5 h-5 ${config.color}`} />
                                  <div>
                                    <div className="font-semibold text-slate-900">
                                      {typeLabels[anomaly.type] || anomaly.type}
                                    </div>
                                    {anomaly.productName && (
                                      <div className="text-sm text-slate-600">{anomaly.productName}</div>
                                    )}
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Badge variant="secondary" className="text-xs">
                                    {config.label}
                                  </Badge>
                                  <Badge variant="outline" className="text-xs">
                                    {anomaly.confidence}%
                                  </Badge>
                                </div>
                              </div>

                              <div className="mt-3 space-y-2">
                                <div className="text-sm text-slate-700">
                                  <span className="font-medium">Description:</span> {anomaly.description}
                                </div>
                                <div className="text-sm text-slate-700">
                                  <span className="font-medium">Action:</span> {anomaly.suggestion}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <Alert className="border-green-200 bg-green-50">
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                    <AlertDescription className="text-green-800">
                      Aucune anomalie détectée ! Le rayonnage est conforme au planogramme prévu.
                    </AlertDescription>
                  </Alert>
                )}

                {/* Summary by Severity */}
                {detectionResult.anomalies.length > 0 && (
                  <Card className="border-slate-200">
                    <CardHeader>
                      <CardTitle className="text-slate-900">Résumé par Priorité</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-3 gap-4">
                        {["high", "medium", "low"].map((severity) => {
                          const count = detectionResult.anomalies.filter(
                            (a: any) => a.severity === severity
                          ).length;
                          const config = severityConfig[severity as keyof typeof severityConfig];
                          const Icon = config.icon;

                          return (
                            <div key={severity} className={`p-4 rounded-lg ${config.bgColor} border ${config.borderColor}`}>
                              <div className="flex items-center gap-2 mb-2">
                                <Icon className={`w-5 h-5 ${config.color}`} />
                                <span className={`font-semibold ${config.color}`}>{config.label}</span>
                              </div>
                              <div className="text-3xl font-bold text-slate-900">{count}</div>
                              <div className="text-sm text-slate-600 mt-1">
                                {count === 0 ? "anomalie" : count === 1 ? "anomalie" : "anomalies"}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            ) : (
              <Card className="border-slate-200">
                <CardContent className="py-16 text-center">
                  <AlertTriangle className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">
                    Prêt à détecter les anomalies
                  </h3>
                  <p className="text-slate-600 max-w-md mx-auto">
                    Entrez l'URL d'une photo de rayonnage ou utilisez une photo d'exemple, puis cliquez sur "Analyser la Photo".
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
