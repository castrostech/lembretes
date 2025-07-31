import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";
import NotFound from "./pages/not-found";
import AuthPage from "./pages/auth";
import Dashboard from "./pages/dashboard";
import Employees from "./pages/employees";
import Trainings from "./pages/trainings";
import Alerts from "./pages/alerts";
import Subscription from "./pages/subscription";
import Billing from "./pages/billing";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  // Handle OAuth callback
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    const userParam = urlParams.get('user');
    
    if (token && userParam) {
      try {
        const user = JSON.parse(decodeURIComponent(userParam));
        localStorage.setItem('token', token);
        queryClient.setQueryData(["/api/auth/user"], user);
        window.history.replaceState({}, document.title, "/");
      } catch (error) {
        console.error("Error parsing OAuth callback:", error);
      }
    }
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <Switch>
      {!isAuthenticated ? (
        <Route path="/" component={AuthPage} />
      ) : (
        <>
          <Route path="/" component={Dashboard} />
          <Route path="/employees" component={Employees} />
          <Route path="/trainings" component={Trainings} />
          <Route path="/alerts" component={Alerts} />
          <Route path="/subscription" component={Subscription} />
          <Route path="/billing" component={Billing} />
        </>
      )}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
