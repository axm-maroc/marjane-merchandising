import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Share2, Link as LinkIcon, QrCode } from "lucide-react";
import { Link } from "wouter";

export default function Recommendations() {
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
                <Share2 className="w-8 h-8 text-indigo-600" />
                Partage de Recommandations
              </h1>
              <p className="text-slate-600 mt-1">Partagez vos recommandations merchandising avec les équipes</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container py-8">
        <div className="max-w-4xl mx-auto">
          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle className="text-2xl text-slate-900">Fonctionnalité en développement</CardTitle>
              <CardDescription className="text-slate-600">
                Le module de partage de recommandations sera bientôt disponible
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Fonctionnalités à venir :</h3>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <LinkIcon className="w-5 h-5 text-indigo-600 mt-0.5" />
                    <div>
                      <div className="font-medium text-slate-900">Liens publics partageables</div>
                      <div className="text-sm text-slate-600">Générez des liens uniques pour partager vos recommandations</div>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <QrCode className="w-5 h-5 text-indigo-600 mt-0.5" />
                    <div>
                      <div className="font-medium text-slate-900">QR Codes</div>
                      <div className="text-sm text-slate-600">Créez des QR codes pour un accès rapide depuis mobile</div>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <Share2 className="w-5 h-5 text-indigo-600 mt-0.5" />
                    <div>
                      <div className="font-medium text-slate-900">Partage par email</div>
                      <div className="text-sm text-slate-600">Envoyez directement les recommandations aux équipes terrain</div>
                    </div>
                  </li>
                </ul>
              </div>

              <div className="flex gap-4">
                <Link href="/forecasts">
                  <Button>
                    Générer des recommandations
                  </Button>
                </Link>
                <Link href="/">
                  <Button variant="outline">
                    Retour à l'accueil
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
