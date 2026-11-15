import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Home from "@/pages/Home";
import Login from "@/pages/Login";
import NotFound from "@/pages/not-found";
import { LawnSizeProvider } from "@/lib/LawnSizeContext";

function Router() {
  return (
    <Switch>
      {/* Home page - features unlock when authenticated */}
      <Route path="/" component={Home} />
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
