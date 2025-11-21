import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import PlanogramTemplates from "./pages/PlanogramTemplates";
import FeedbackDashboard from "./pages/FeedbackDashboard";
import Stores from "./pages/Stores";
import StoreDetail from "./pages/StoreDetail";
import PlanogramView from "./pages/PlanogramView";
import StockTracking from "./pages/StockTracking";
import AIRecommendations from "./pages/AIRecommendations";
import AnomalyDetection from "./pages/AnomalyDetection";
import Planograms from "./pages/Planograms";
import Recommendations from "./pages/Recommendations";
import CreatePlanogram from "./pages/CreatePlanogram";
import PlanogramHistory from "./pages/PlanogramHistory";
import Dashboard from "./pages/Dashboard";
import StoreZones from "./pages/StoreZones";
import ZoneEditor from "./pages/ZoneEditor";
import MobileLayout from "./pages/mobile/MobileLayout";
import MobileHome from "./pages/mobile/Home";
import MobileTasks from "./pages/mobile/Tasks";
import MobileCamera from "./pages/mobile/Camera";
import MobileAnomalies from "./pages/mobile/Anomalies";
import MobileProfile from "./pages/mobile/Profile";
import StrategicKPIs from "./pages/StrategicKPIs";
import CustomerFeedback from "./pages/CustomerFeedback";
import FeedbackAdmin from "./pages/FeedbackAdmin";

function Router() {
  // make sure to consider if you need authentication for certain routes
  return (
    <Switch>
      <Route path={"/"} component={Home} />
       <Route path={"/feedback/:storeId"} component={CustomerFeedback} />
      <Route path={"/templates"} component={PlanogramTemplates} />
      <Route path={"/404"} component={NotFound} />
      <Route path="/stores" component={Stores} />
      <Route path="/stores/:id/zones" component={StoreZones} />
      <Route path="/stores/:id/zones/editor" component={ZoneEditor} />
      <Route path="/stores/:id" component={StoreDetail} />
      <Route path={"/planograms"} component={Planograms} />
      <Route path={"/planograms/location/:id"} component={PlanogramView} />
      <Route path="/planograms/create" component={CreatePlanogram} />
      <Route path="/planograms/:id/history" component={PlanogramHistory} />
      <Route path={"/planogram/:id"} component={PlanogramView} />
      <Route path="/stock" component={StockTracking} />
      <Route path="/forecasts" component={AIRecommendations} />
      <Route path="/anomalies" component={AnomalyDetection} />
      <Route path="/recommendations" component={Recommendations} />
      <Route path="/kpis" component={StrategicKPIs} />
      <Route path="/feedback/:storeId" component={CustomerFeedback} />
      <Route path="/feedback-admin" component={FeedbackAdmin} />
      
      {/* Routes mobiles */}
      <Route path="/mobile">
        {() => (
          <MobileLayout>
            <MobileHome />
          </MobileLayout>
        )}
      </Route>
      <Route path="/mobile/tasks">
        {() => (
          <MobileLayout>
            <MobileTasks />
          </MobileLayout>
        )}
      </Route>
      <Route path="/mobile/camera">
        {() => (
          <MobileLayout>
            <MobileCamera />
          </MobileLayout>
        )}
      </Route>
      <Route path="/mobile/anomalies">
        {() => (
          <MobileLayout>
            <MobileAnomalies />
          </MobileLayout>
        )}
      </Route>
      <Route path="/mobile/profile">
        {() => (
          <MobileLayout>
            <MobileProfile />
          </MobileLayout>
        )}
      </Route>
      
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
