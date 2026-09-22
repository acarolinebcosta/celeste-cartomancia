import { Route, Switch } from "wouter";
import AnalyticsConsent from "@/components/AnalyticsConsent";
import ErrorBoundary from "@/components/ErrorBoundary";
import RouteEffects from "@/components/RouteEffects";
import AdminPlaceholder from "@/pages/AdminPlaceholder";
import Booking from "@/pages/Booking";
import BookingConfirmation from "@/pages/BookingConfirmation";
import Home from "@/pages/Home";
import LegalPage from "@/pages/LegalPage";
import NotFound from "@/pages/NotFound";
import ServiceDetail from "@/pages/ServiceDetail";
import { ServiceCatalogProvider } from "@/contexts/ServiceCatalogContext";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/agendar" component={Booking} />
      <Route path="/agendamento/:publicCode" component={BookingConfirmation} />
      <Route path="/leituras/:slug" component={ServiceDetail} />
      <Route path="/termos">{() => <LegalPage kind="terms" />}</Route>
      <Route path="/privacidade">{() => <LegalPage kind="privacy" />}</Route>
      <Route path="/admin" component={AdminPlaceholder} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <ServiceCatalogProvider>
        <RouteEffects />
        <Router />
        <AnalyticsConsent />
      </ServiceCatalogProvider>
    </ErrorBoundary>
  );
}
