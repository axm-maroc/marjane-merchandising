import { useLocation } from "wouter";
import { useCallback, useEffect, useState } from "react";

/**
 * Hook personnalisé pour gérer la navigation entre modules
 * Permet de revenir au module précédent tout en restant dans le même module
 */
export function useModuleNavigation() {
  const [location, navigate] = useLocation();
  const [previousModule, setPreviousModule] = useState<string | null>(null);
  const [currentModule, setCurrentModule] = useState<string | null>(null);

  // Déterminer le module actuel basé sur l'URL
  const getModuleFromPath = (path: string): string => {
    const segments = path.split("/").filter(Boolean);
    if (!segments.length) return "home";
    
    // Mapper les chemins aux modules
    const moduleMap: Record<string, string> = {
      "dashboard": "dashboard",
      "kpis": "dashboard", // KPIs fait partie du dashboard
      "stores": "stores",
      "planograms": "planograms",
      "stock": "stock",
      "forecasts": "forecasts",
      "anomalies": "anomalies",
      "recommendations": "recommendations",
      "feedback": "feedback",
      "impact-simulator": "impact-simulator",
      "mobile": "mobile",
    };

    return moduleMap[segments[0]] || segments[0];
  };

  // Mettre à jour le module actuel et le module précédent
  useEffect(() => {
    const newModule = getModuleFromPath(location);
    
    if (newModule !== currentModule) {
      setPreviousModule(currentModule);
      setCurrentModule(newModule);
    }
  }, [location, currentModule]);

  // Fonction pour naviguer vers une page tout en restant dans le module
  const navigateWithinModule = useCallback((path: string) => {
    navigate(path);
  }, [navigate]);

  // Fonction pour revenir au module précédent
  const goBackToModule = useCallback(() => {
    if (previousModule === "dashboard") {
      navigate("/dashboard");
    } else if (previousModule === "stores") {
      navigate("/stores");
    } else if (previousModule === "planograms") {
      navigate("/planograms");
    } else if (previousModule === "stock") {
      navigate("/stock");
    } else if (previousModule === "forecasts") {
      navigate("/forecasts");
    } else if (previousModule === "anomalies") {
      navigate("/anomalies");
    } else if (previousModule === "recommendations") {
      navigate("/recommendations");
    } else if (previousModule === "feedback") {
      navigate("/feedback-admin");
    } else if (previousModule === "impact-simulator") {
      navigate("/impact-simulator");
    } else if (previousModule === "mobile") {
      navigate("/mobile");
    } else {
      navigate("/");
    }
  }, [navigate, previousModule]);

  // Fonction pour revenir à la page précédente (navigateur)
  const goBack = useCallback(() => {
    window.history.back();
  }, []);

  return {
    currentModule,
    previousModule,
    navigateWithinModule,
    goBackToModule,
    goBack,
  };
}
