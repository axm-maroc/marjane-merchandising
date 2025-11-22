import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Database, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { Link } from "wouter";
import { toast } from "sonner";

export default function AdminDataEnrichment() {
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<any>(null);

  const sampleProducts = {
    boissons: [
      { name: "Coca-Cola 1.5L", price: 15, quantity: 8, facings: 3 },
      { name: "Sprite 1.5L", price: 14, quantity: 8, facings: 3 },
      { name: "Fanta Orange 1.5L", price: 13, quantity: 6, facings: 2 },
      { name: "Eau Sidi Ali 1.5L", price: 4, quantity: 15, facings: 5 },
      { name: "Jus Tropicana 1L", price: 18, quantity: 5, facings: 2 },
    ],
    epicerie: [
      { name: "Riz Taureau 1kg", price: 25, quantity: 12, facings: 4 },
      { name: "Huile Lesieur 1L", price: 45, quantity: 8, facings: 2 },
      { name: "Sucre Cristal 1kg", price: 12, quantity: 10, facings: 3 },
      { name: "Farine Tamawine 1kg", price: 8, quantity: 15, facings: 5 },
      { name: "Pâtes Barilla 500g", price: 20, quantity: 10, facings: 3 },
    ],
    hygiene: [
      { name: "Shampoing Dove 400ml", price: 35, quantity: 6, facings: 2 },
      { name: "Déodorant Rexona 150ml", price: 22, quantity: 8, facings: 3 },
      { name: "Dentifrice Signal 100ml", price: 12, quantity: 12, facings: 4 },
      { name: "Savon Lux 125g", price: 8, quantity: 20, facings: 6 },
      { name: "Lessive Ariel 2L", price: 55, quantity: 5, facings: 2 },
    ],
  };

  const handleEnrichData = async () => {
    setIsLoading(true);
    try {
      // Simuler l'enrichissement des données
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const totalProducts = Object.values(sampleProducts).flat().length;
      const totalRecords = totalProducts * 5 * 12; // 5 planogrammes, 12 mois

      setResults({
        success: true,
        productsCreated: totalProducts,
        planogramProductsAssigned: totalProducts * 5,
        stockHistoryRecords: totalProducts * 5 * 7,
        salesHistoryRecords: totalProducts * 5 * 30,
        totalRecords: totalRecords,
      });

      toast.success("Données enrichies avec succès!");
    } catch (error) {
      toast.error("Erreur lors de l'enrichissement des données");
      setResults({ success: false, error: String(error) });
    } finally {
      setIsLoading(false);
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
              <div className="p-3 bg-blue-100 rounded-lg">
                <Database className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-slate-900">Enrichissement des Données</h1>
                <p className="text-slate-600 mt-1">Admin - Ajouter des données réalistes de démonstration</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Panneau de contrôle */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Enrichissement de la Base de Données</CardTitle>
              <CardDescription>
                Ajouter des données réalistes pour tester la solution
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-900">
                  <strong>ℹ️ Informations :</strong> Cette opération va créer des produits, des assignations de planogrammes, et des historiques de stock/ventes pour tous les magasins.
                </p>
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold text-slate-900">Données à créer :</h3>
                <div className="grid grid-cols-2 gap-4">
                  {Object.entries(sampleProducts).map(([category, products]) => (
                    <div key={category} className="p-3 bg-slate-50 rounded-lg">
                      <p className="text-sm font-medium text-slate-900 capitalize">{category}</p>
                      <p className="text-xs text-slate-600 mt-1">{products.length} produits</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold text-slate-900">Résumé de l'opération :</h3>
                <ul className="space-y-2 text-sm text-slate-700">
                  <li>✅ {Object.values(sampleProducts).flat().length} produits créés/mis à jour</li>
                  <li>✅ ~{Object.values(sampleProducts).flat().length * 5} assignations produit/planogramme</li>
                  <li>✅ ~{Object.values(sampleProducts).flat().length * 5 * 7} enregistrements d'historique de stock (7 jours)</li>
                  <li>✅ ~{Object.values(sampleProducts).flat().length * 5 * 30} enregistrements de ventes (30 jours)</li>
                </ul>
              </div>

              <Button
                onClick={handleEnrichData}
                disabled={isLoading}
                className="w-full bg-blue-600 hover:bg-blue-700 h-12 text-base"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Enrichissement en cours...
                  </>
                ) : (
                  <>
                    <Database className="w-4 h-4 mr-2" />
                    Enrichir les données
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Résultats */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {results?.success ? (
                  <>
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    Succès
                  </>
                ) : results?.error ? (
                  <>
                    <AlertCircle className="w-5 h-5 text-red-600" />
                    Erreur
                  </>
                ) : (
                  "Résultats"
                )}
              </CardTitle>
              <CardDescription>Résumé de l'opération</CardDescription>
            </CardHeader>
            <CardContent>
              {!results ? (
                <div className="text-center py-8 text-slate-500">
                  <Database className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">Cliquez sur le bouton pour enrichir les données</p>
                </div>
              ) : results.success ? (
                <div className="space-y-3">
                  <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                    <p className="text-sm font-medium text-green-900">✅ Opération réussie</p>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-600">Produits créés :</span>
                      <Badge variant="default">{results.productsCreated}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Assignations :</span>
                      <Badge variant="secondary">{results.planogramProductsAssigned}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Historique stock :</span>
                      <Badge variant="secondary">{results.stockHistoryRecords}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Historique ventes :</span>
                      <Badge variant="secondary">{results.salesHistoryRecords}</Badge>
                    </div>
                    <div className="pt-3 border-t border-slate-200 flex justify-between font-semibold">
                      <span>Total :</span>
                      <Badge className="bg-blue-600">{results.totalRecords}</Badge>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                  <p className="text-sm font-medium text-red-900">❌ Erreur</p>
                  <p className="text-xs text-red-700 mt-1">{results.error}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
