import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useState } from "react";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import Onboarding from "@/pages/onboarding";
import Employees from "@/pages/employees";
import Sidebar from "@/components/sidebar";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/onboarding" component={Onboarding} />
      <Route path="/employees" component={Employees} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>(""); // In a real app, this would come from auth/storage

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <div className="flex min-h-screen bg-slate-50">
          <Sidebar 
            selectedCompanyId={selectedCompanyId} 
            onCompanySelect={setSelectedCompanyId}
          />
          <div className="flex-1 flex flex-col">
            <Router />
          </div>
        </div>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
