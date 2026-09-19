import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import ServiceDetail from "./pages/ServiceDetail";
import Booking from "./pages/Booking";
import AdminPlaceholder from "./pages/AdminPlaceholder";

function Router() {
  return <Switch>
    <Route path="/" component={Home} />
    <Route path="/agendar" component={Booking} />
    <Route path="/admin" component={AdminPlaceholder} />
    <Route path="/leituras/:slug" component={ServiceDetail} />
    <Route path="/404" component={NotFound} />
    <Route component={NotFound} />
  </Switch>;
}

function App() {
  return <ErrorBoundary><ThemeProvider defaultTheme="dark"><TooltipProvider><Toaster /><Router /></TooltipProvider></ThemeProvider></ErrorBoundary>;
}

export default App;
