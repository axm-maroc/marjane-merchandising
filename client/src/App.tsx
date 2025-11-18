import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Stores from "./pages/Stores";
import StoreDetail from "./pages/StoreDetail";
import PlanogramView from "./pages/PlanogramView";
import StockTracking from "./pages/StockTracking";
import AIRecommendations from "./pages/AIRecommendations";
import AnomalyDetection from "./pages/AnomalyDetection";
import Planograms from "./pages/Planograms";
import Recommendations from "./pages/Recommendations";
import CreatePlanogram from "./pages/CreatePlanogram";

function Router() {
  // make sure to consider if you need authentication for certain routes
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path="/stores" component={Stores} />
      <Route path="/stores/:id" component={StoreDetail} />      <Route path={"/planograms"} component={Planograms} />
      <Route path={"/planogram/create"} component={CreatePlanogram} />
      <Route path={" /planogram/:id"} component={PlanogramView} />
      <Route path="/stock" component={StockTracking} />
      <Route path="/forecasts" component={AIRecommendations} />
      <Route path="/anomalies" component={AnomalyDetection} />
      <Route path="/recommendations" component={Recommendations} />
      <Route path={"/404"} component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="light"
        // switchable
      >
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
