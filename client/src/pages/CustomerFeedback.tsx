import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Smile, Frown, Meh, CheckCircle2, Store } from "lucide-react";
import { APP_LOGO } from "@/const";

export default function CustomerFeedback() {
  const params = useParams<{ storeId: string }>();
  const storeId = parseInt(params.storeId || "0");
  const [, setLocation] = useLocation();

  const [selectedScore, setSelectedScore] = useState<number | null>(null);
  const [comment, setComment] = useState("");
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  // Charger les informations du magasin
  const { data: store } = trpc.stores.getById.useQuery(
    { id: storeId },
    { enabled: storeId > 0 }
  );

  // Mutation pour soumettre le feedback
  const submitNPS = trpc.kpis.submitNPS.useMutation({
    onSuccess: () => {
      setSubmitted(true);
    },
  });

  const handleScoreClick = (score: number) => {
    setSelectedScore(score);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedScore === null) return;

    submitNPS.mutate({
      storeId,
      score: selectedScore,
      comment: comment.trim() || undefined,
      customerEmail: email.trim() || undefined,
    });
  };

  const getScoreColor = (score: number) => {
    if (score >= 9) return "bg-emerald-500 hover:bg-emerald-600";
    if (score >= 7) return "bg-blue-500 hover:bg-blue-600";
    return "bg-red-500 hover:bg-red-600";
  };

  const getScoreIcon = () => {
    if (selectedScore === null) return <Meh className="w-16 h-16 text-slate-400" />;
    if (selectedScore >= 9) return <Smile className="w-16 h-16 text-emerald-500" />;
    if (selectedScore >= 7) return <Meh className="w-16 h-16 text-blue-500" />;
    return <Frown className="w-16 h-16 text-red-500" />;
  };

  if (storeId === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="py-12 text-center">
            <p className="text-slate-600">Lien de feedback invalide</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-blue-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full border-emerald-200 shadow-xl">
          <CardContent className="py-12 text-center">
            <CheckCircle2 className="w-20 h-20 text-emerald-500 mx-auto mb-6" />
            <h2 className="text-2xl font-bold text-slate-900 mb-3">
              Merci pour votre avis !
            </h2>
            <p className="text-slate-600 mb-6">
              Votre feedback nous aide à améliorer nos services.
            </p>
            <div className="bg-emerald-50 rounded-lg p-4 mb-6">
              <p className="text-sm text-emerald-800">
                <strong>{store?.name}</strong>
              </p>
              <p className="text-xs text-emerald-600 mt-1">
                {store?.city}
              </p>
            </div>
            <Button
              onClick={() => setLocation("/")}
              variant="outline"
              className="mt-4"
            >
              Retour à l'accueil
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full shadow-2xl border-slate-200">
        <CardHeader className="text-center pb-6 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-t-lg">
          <div className="flex items-center justify-center gap-3 mb-3">
            {APP_LOGO && (
              <img src={APP_LOGO} alt="Logo" className="w-12 h-12 rounded-lg bg-white p-1" />
            )}
            <Store className="w-10 h-10" />
          </div>
          <CardTitle className="text-3xl font-bold mb-2">
            Votre avis compte !
          </CardTitle>
          <CardDescription className="text-indigo-100 text-lg">
            {store?.name || "Chargement..."}
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-8 pb-8">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Question NPS */}
            <div className="text-center">
              <Label className="text-lg font-semibold text-slate-900 mb-4 block">
                Recommanderiez-vous notre magasin à vos proches ?
              </Label>
              <p className="text-sm text-slate-600 mb-6">
                0 = Pas du tout · 10 = Absolument
              </p>

              {/* Échelle de notation */}
              <div className="grid grid-cols-11 gap-2 mb-6">
                {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((score) => (
                  <button
                    key={score}
                    type="button"
                    onClick={() => handleScoreClick(score)}
                    className={`
                      aspect-square rounded-lg font-bold text-white transition-all transform
                      ${selectedScore === score 
                        ? `${getScoreColor(score)} scale-110 shadow-lg ring-4 ring-offset-2 ${
                            score >= 9 ? "ring-emerald-300" : score >= 7 ? "ring-blue-300" : "ring-red-300"
                          }`
                        : "bg-slate-300 hover:bg-slate-400"
                      }
                    `}
                  >
                    {score}
                  </button>
                ))}
              </div>

              {/* Icône de feedback */}
              <div className="flex justify-center mb-4">
                {getScoreIcon()}
              </div>

              {/* Labels */}
              <div className="flex justify-between text-xs text-slate-500 mb-8">
                <span>Pas du tout probable</span>
                <span>Extrêmement probable</span>
              </div>
            </div>

            {/* Commentaire optionnel */}
            {selectedScore !== null && (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div>
                  <Label htmlFor="comment" className="text-base font-semibold text-slate-900">
                    Dites-nous en plus (optionnel)
                  </Label>
                  <p className="text-sm text-slate-600 mb-2">
                    Qu'est-ce qui vous a plu ou déplu ?
                  </p>
                  <Textarea
                    id="comment"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Votre commentaire..."
                    className="min-h-32 resize-none"
                    maxLength={500}
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    {comment.length}/500 caractères
                  </p>
                </div>

                {/* Email optionnel */}
                <div>
                  <Label htmlFor="email" className="text-base font-semibold text-slate-900">
                    Email (optionnel)
                  </Label>
                  <p className="text-sm text-slate-600 mb-2">
                    Pour être contacté si nécessaire
                  </p>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="votre.email@exemple.com"
                  />
                </div>

                {/* Bouton de soumission */}
                <Button
                  type="submit"
                  size="lg"
                  className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-lg py-6"
                  disabled={submitNPS.isPending}
                >
                  {submitNPS.isPending ? "Envoi en cours..." : "Envoyer mon avis"}
                </Button>
              </div>
            )}

            {selectedScore === null && (
              <div className="text-center text-slate-500 text-sm">
                Veuillez sélectionner une note pour continuer
              </div>
            )}
          </form>

          {/* Message d'erreur */}
          {submitNPS.isError && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              Une erreur est survenue. Veuillez réessayer.
            </div>
          )}
        </CardContent>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 rounded-b-lg text-center text-xs text-slate-500">
          <p>Vos données sont collectées de manière anonyme et utilisées uniquement pour améliorer nos services.</p>
        </div>
      </Card>
    </div>
  );
}
