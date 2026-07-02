import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import Home from "@/pages/home";
import Admin from "@/pages/admin";
import Preview from "@/pages/preview";
import CityDetail from "@/pages/city-detail";
import LibraryPage from "@/pages/library";
import AuthPage from "@/pages/auth";
import { useAuth } from "@/hooks/useAuth";
import { ActiveThemeProvider } from "@/components/ActiveThemeProvider";

function Router() {
  return (
    <Switch>
      {/* Public routes - always available */}
      <Route path="/" component={Landing} />
      <Route path="/home" component={Home} />
      <Route path="/preview" component={Preview} />
      <Route path="/city/:id" component={CityDetail} />
      <Route path="/library" component={LibraryPage} />
      <Route path="/auth" component={AuthPage} />

      {/* Protected routes that handle their own auth */}
      <Route path="/admin" component={Admin} />
      <Route path="/admin/felixdgreat" component={Admin} />

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <ActiveThemeProvider>
          <Toaster />
          <Router />
        </ActiveThemeProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
