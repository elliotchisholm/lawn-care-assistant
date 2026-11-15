import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Home from "@/pages/Home";
import Login from "@/pages/Login";
import Schedule from "@/pages/Schedule";
import Stock from "@/pages/Stock";
import Buy from "@/pages/Buy";
import AppShell from "@/components/AppShell";
import NotFound from "@/pages/not-found";
import { LawnSizeProvider } from "@/lib/LawnSizeContext";

function Router() {
  return (
    <Switch>
      {/* Home page - features unlock when authenticated */}
      <Route path="/">
        <AppShell><Home /></AppShell>
      </Route>
      <Route path="/schedule">
        <AppShell><Schedule /></AppShell>
      </Route>
      <Route path="/stock">
        <AppShell><Stock /></AppShell>
      </Route>
      <Route path="/buy">
        <AppShell><Buy /></AppShell>
      </Route>
      <Route path="/login" component={Login} />
      
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <LawnSizeProvider>
          <Router />
        </LawnSizeProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
