import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from "recharts";
import { DollarSign, TrendingUp, Zap } from "lucide-react";
import { toast } from "sonner";

/**
 * Simulateur d'impact pour les scénarios de réimplantation
 * Calcule l'impact sur CA, marge et ruptures avec prévisions de +10% CA
 */
export default function ImpactSimulator() {
  const [planogramId, setPlanogramId] = useState<string>("");
  const [scenarioName, setScenarioName] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [baselineCA, setBaselineCA] = useState<string>("");
  const [baselineMargin, setBaselineMargin] = useState<string>("");
  const [baselineStockouts, setBaselineStockouts] = useState<string>("");
  const [simulations, setSimulations] = useState<any[]>([]);
  const [selectedSimulation, setSelectedSimulation] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSimulate = async () => {
    if (!planogramId || !scenarioName || !baselineCA || !baselineMargin || !baselineStockouts) {
      toast.error("Veuillez remplir tous les champs obligatoires");
      return;
    }

    setIsLoading(true);
    try {
      // @ts-ignore
      const result = await trpc.impactSimulator.create.mutate({
        planogramId: parseInt(planogramId),
        scenarioName,
        description,
        baselineCA: parseFloat(baselineCA),
        baselineMargin: parseFloat(baselineMargin),
        baselineStockouts: parseInt(baselineStockouts),
      });

      setSimulations([result, ...simulations]);
      setSelectedSimulation(result);
      toast.success("Simulation créée avec succès!");
      
      setScenarioName("");
      setDescription("");
      setBaselineCA("");
      setBaselineMargin("");
      setBaselineStockouts("");
    } catch (error) {
      console.error("Erreur lors de la simulation:", error);
      toast.error("Erreur lors de la création de la simulation");
    } finally {
      setIsLoading(false);
    }
  };

  const comparisonData = selectedSimulation ? [
    {
      name: "Baseline",
      CA: selectedSimulation.baselineCA,
      Marge: selectedSimulation.baselineMargin,
      Ruptures: selectedSimulation.baselineStockouts,
    },
    {
      name: "Scénario Optimisé",
      CA: selectedSimulation.projectedCA,
      Marge: selectedSimulation.projectedMargin,
      Ruptures: selectedSimulation.projectedStockouts,
    },
  ] : [];

  const impactData = selectedSimulation ? [
    {
      metric: "CA",
      impact: selectedSimulation.caImpactPercent,
      target: 10,
    },
    {
      metric: "Marge",
      impact: selectedSimulation.marginImpactPercent,
      target: 8,
    },
    {
      metric: "Réduction Ruptures",
      impact: selectedSimulation.stockoutReductionPercent,
      target: 15,
    },
  ] : [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Simulateur d'Impact</h1>
          <p className="text-lg text-slate-600">Simulez l'impact des scénarios de réimplantation sur CA, marge et ruptures</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>Nouveau Scénario</CardTitle>
              <CardDescription>Créez une simulation d'impact</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="planogramId">ID Planogramme *</Label>
                <Input
                  id="planogramId"
                  type="number"
                  value={planogramId}
                  onChange={(e) => setPlanogramId(e.target.value)}
                  placeholder="1"
                />
              </div>

              <div>
                <Label htmlFor="scenarioName">Nom du Scénario *</Label>
                <Input
                  id="scenarioName"
                  value={scenarioName}
                  onChange={(e) => setScenarioName(e.target.value)}
                  placeholder="Ex: Optimisation Premium"
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Décrivez le scénario..."
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="baselineCA">CA Baseline (€) *</Label>
                <Input
                  id="baselineCA"
                  type="number"
                  value={baselineCA}
                  onChange={(e) => setBaselineCA(e.target.value)}
                  placeholder="10000"
                  step="0.01"
                />
              </div>

              <div>
                <Label htmlFor="baselineMargin">Marge Baseline (€) *</Label>
                <Input
                  id="baselineMargin"
                  type="number"
                  value={baselineMargin}
                  onChange={(e) => setBaselineMargin(e.target.value)}
                  placeholder="3000"
                  step="0.01"
                />
              </div>

              <div>
                <Label htmlFor="baselineStockouts">Ruptures Baseline *</Label>
                <Input
                  id="baselineStockouts"
                  type="number"
                  value={baselineStockouts}
                  onChange={(e) => setBaselineStockouts(e.target.value)}
                  placeholder="5"
                />
              </div>

              <Button
                onClick={handleSimulate}
                disabled={isLoading}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                {isLoading ? "Simulation en cours..." : "Simuler"}
              </Button>
            </CardContent>
          </Card>

          {selectedSimulation && (
            <div className="lg:col-span-2 space-y-6">
              <div className="grid grid-cols-3 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-slate-600">Impact CA</p>
                        <p className="text-2xl font-bold text-green-600">
                          +{selectedSimulation.caImpactPercent.toFixed(1)}%
                        </p>
                      </div>
                      <DollarSign className="w-8 h-8 text-green-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-slate-600">Impact Marge</p>
                        <p className="text-2xl font-bold text-blue-600">
                          +{selectedSimulation.marginImpactPercent.toFixed(1)}%
                        </p>
                      </div>
                      <TrendingUp className="w-8 h-8 text-blue-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-slate-600">Réduction Ruptures</p>
                        <p className="text-2xl font-bold text-purple-600">
                          -{selectedSimulation.stockoutReductionPercent.toFixed(1)}%
                        </p>
                      </div>
                      <Zap className="w-8 h-8 text-purple-600" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Score de Confiance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <div className="w-full bg-slate-200 rounded-full h-3">
                        <div
                          className="bg-blue-600 h-3 rounded-full"
                          style={{ width: `${selectedSimulation.confidenceScore * 100}%` }}
                        />
                      </div>
                    </div>
                    <span className="text-lg font-bold">{(selectedSimulation.confidenceScore * 100).toFixed(0)}%</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        {selectedSimulation && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Comparaison Baseline vs Scénario</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={comparisonData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="CA" fill="#3b82f6" />
                    <Bar dataKey="Marge" fill="#10b981" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Impact vs Objectifs</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={impactData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="metric" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="impact" stroke="#3b82f6" name="Impact Réel" />
                    <Line type="monotone" dataKey="target" stroke="#10b981" name="Objectif" strokeDasharray="5 5" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        )}

        {simulations.length > 0 && (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>Historique des Simulations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {simulations.map((sim, idx) => (
                  <div
                    key={idx}
                    onClick={() => setSelectedSimulation(sim)}
                    className="p-4 border rounded-lg cursor-pointer hover:bg-slate-50 transition"
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-semibold">{sim.scenarioName}</p>
                        <p className="text-sm text-slate-600">{sim.description}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-green-600">+{sim.caImpactPercent.toFixed(1)}% CA</p>
                        <p className="text-sm text-slate-600">Confiance: {(sim.confidenceScore * 100).toFixed(0)}%</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
