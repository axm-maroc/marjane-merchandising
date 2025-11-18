import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Share2, Copy, QrCode, Download, TrendingUp, CheckCircle2, Clock, ExternalLink, ArrowLeft } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Link } from "wouter";

export default function Recommendations() {
  const [selectedStoreId, setSelectedStoreId] = useState<number | null>(null);
  const [selectedType, setSelectedType] = useState<"assortment" | "placement" | "pricing" | "promotion">("assortment");
  const [sharedLink, setSharedLink] = useState<string | null>(null);

  const { data: stores } = trpc.stores.list.useQuery();
  const generateMutation = trpc.recommendations.generate.useMutation();
  const shareMutation = trpc.recommendations.share.useMutation();

  const handleGenerate = async () => {
    if (!selectedStoreId) {
      toast.error("Veuillez sélectionner un magasin");
      return;
    }

    try {
      const result = await generateMutation.mutateAsync({
        storeId: selectedStoreId,
        type: selectedType,
      });
      toast.success("Recommandations générées avec succès !");
    } catch (error) {
      toast.error("Erreur lors de la génération des recommandations");
    }
  };

  const handleShare = async () => {
    if (!generateMutation.data) {
      toast.error("Veuillez d'abord générer des recommandations");
      return;
    }

    try {
      const result = await shareMutation.mutateAsync({
        recommendationId: 1, // ID temporaire - sera remplacé par l'ID réel après sauvegarde
        expiresInDays: 30,
      });
      
      const link = `${window.location.origin}/shared/recommendations/${result.shareToken}`;
      setSharedLink(link);
      toast.success("Lien de partage généré !");
    } catch (error) {
      toast.error("Erreur lors de la génération du lien");
    }
  };

  const copyToClipboard = () => {
    if (sharedLink) {
      navigator.clipboard.writeText(sharedLink);
      toast.success("Lien copié dans le presse-papier !");
    }
  };

  const downloadQRCode = () => {
    if (sharedLink) {
      // Générer le QR code avec une API
      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(sharedLink)}`;
      const link = document.createElement('a');
      link.href = qrUrl;
      link.download = 'recommendation-qr-code.png';
      link.click();
      toast.success("QR Code téléchargé !");
    }
  };

  const typeLabels = {
    assortment: "Assortiment",
    placement: "Placement",
    pricing: "Prix",
    promotion: "Promotion",
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
              <div className="p-3 bg-blue-100 rounded-lg">
                <Share2 className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-slate-900">Partage de Recommandations</h1>
                <p className="text-slate-600 mt-1">Partagez vos recommandations merchandising avec votre équipe</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Configuration */}
          <div className="lg:col-span-1">
            <Card className="border-slate-200">
              <CardHeader>
                <CardTitle className="text-slate-900">Configuration</CardTitle>
                <CardDescription className="text-slate-600">
                  Sélectionnez le magasin et le type de recommandation
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Store Selection */}
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-2 block">
                    Magasin
                  </label>
                  <select
                    value={selectedStoreId || ""}
                    onChange={(e) => setSelectedStoreId(parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Sélectionner un magasin</option>
                    {stores?.map((store) => (
                      <option key={store.id} value={store.id}>
                        {store.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Type Selection */}
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-2 block">
                    Type de recommandation
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {(Object.keys(typeLabels) as Array<keyof typeof typeLabels>).map((type) => (
                      <button
                        key={type}
                        onClick={() => setSelectedType(type)}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                          selectedType === type
                            ? "bg-blue-600 text-white"
                            : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                        }`}
                      >
                        {typeLabels[type]}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Generate Button */}
                <Button
                  onClick={handleGenerate}
                  disabled={!selectedStoreId || generateMutation.isPending}
                  className="w-full"
                >
                  {generateMutation.isPending ? (
                    <>
                      <Clock className="w-4 h-4 mr-2 animate-spin" />
                      Génération en cours...
                    </>
                  ) : (
                    <>
                      <TrendingUp className="w-4 h-4 mr-2" />
                      Générer les recommandations
                    </>
                  )}
                </Button>

                {/* Share Button */}
                {generateMutation.data && (
                  <Button
                    onClick={handleShare}
                    disabled={shareMutation.isPending}
                    variant="outline"
                    className="w-full"
                  >
                    {shareMutation.isPending ? (
                      <>
                        <Clock className="w-4 h-4 mr-2 animate-spin" />
                        Génération du lien...
                      </>
                    ) : (
                      <>
                        <Share2 className="w-4 h-4 mr-2" />
                        Générer un lien de partage
                      </>
                    )}
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Shared Link */}
            {sharedLink && (
              <Card className="border-green-200 bg-green-50 mt-6">
                <CardHeader>
                  <CardTitle className="text-green-900 flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5" />
                    Lien de partage généré
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="bg-white p-3 rounded-lg border border-green-200">
                    <p className="text-sm text-slate-600 break-all">{sharedLink}</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      onClick={copyToClipboard}
                      variant="outline"
                      size="sm"
                      className="w-full"
                    >
                      <Copy className="w-4 h-4 mr-2" />
                      Copier
                    </Button>
                    <Button
                      onClick={downloadQRCode}
                      variant="outline"
                      size="sm"
                      className="w-full"
                    >
                      <QrCode className="w-4 h-4 mr-2" />
                      QR Code
                    </Button>
                  </div>

                  <Button
                    onClick={() => window.open(sharedLink, '_blank')}
                    variant="default"
                    size="sm"
                    className="w-full"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Ouvrir le lien
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Recommendations Preview */}
          <div className="lg:col-span-2">
            <Card className="border-slate-200">
              <CardHeader>
                <CardTitle className="text-slate-900">Aperçu des Recommandations</CardTitle>
                <CardDescription className="text-slate-600">
                  Prévisualisation des recommandations générées
                </CardDescription>
              </CardHeader>
              <CardContent>
                {generateMutation.isPending ? (
                  <div className="text-center py-12">
                    <Clock className="w-12 h-12 text-blue-600 mx-auto mb-4 animate-spin" />
                    <p className="text-slate-600">Génération des recommandations en cours...</p>
                    <p className="text-sm text-slate-500 mt-2">Cela peut prendre quelques secondes</p>
                  </div>
                ) : generateMutation.data ? (
                  <div className="space-y-6">
                    {/* Header */}
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-xl font-bold text-slate-900">{generateMutation.data.title}</h3>
                        <p className="text-slate-600 mt-1">{generateMutation.data.description}</p>
                      </div>
                      <Badge variant="default" className="text-sm px-3 py-1">
                        Confiance: {generateMutation.data.confidence}%
                      </Badge>
                    </div>

                    {/* Expected Impact */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <TrendingUp className="w-5 h-5 text-blue-600" />
                        <h4 className="font-semibold text-blue-900">Impact Attendu</h4>
                      </div>
                      <p className="text-blue-700">{generateMutation.data.expectedImpact}</p>
                    </div>

                    {/* Actions */}
                    <div>
                      <h4 className="font-semibold text-slate-900 mb-3">Actions Recommandées</h4>
                      <div className="space-y-3">
                        {generateMutation.data.actions.map((action: any, index: number) => (
                          <Card key={index} className="border-slate-200">
                            <CardContent className="pt-4">
                              <div className="flex items-start gap-3">
                                <Badge
                                  variant={
                                    action.priority === "high"
                                      ? "destructive"
                                      : action.priority === "medium"
                                      ? "default"
                                      : "secondary"
                                  }
                                  className="mt-1"
                                >
                                  {action.priority === "high" ? "Haute" : action.priority === "medium" ? "Moyenne" : "Basse"}
                                </Badge>
                                <div className="flex-1">
                                  <p className="font-medium text-slate-900">{action.action}</p>
                                  <p className="text-sm text-slate-600 mt-1">{action.reason}</p>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>

                    {/* Insights */}
                    {generateMutation.data.insights && generateMutation.data.insights.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-slate-900 mb-3">Insights Clés</h4>
                        <div className="space-y-2">
                          {generateMutation.data.insights.map((insight: string, index: number) => (
                            <div key={index} className="flex items-start gap-2">
                              <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                              <p className="text-slate-700">{insight}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Share2 className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                    <p className="text-slate-600">Aucune recommandation générée</p>
                    <p className="text-sm text-slate-500 mt-2">
                      Sélectionnez un magasin et un type, puis cliquez sur "Générer"
                    </p>
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
