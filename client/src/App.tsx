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
import Contracts from "@/pages/contracts";
import Users from "@/pages/users";
import Analytics from "@/pages/analytics";
import Sidebar from "@/components/sidebar";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/onboarding" component={Onboarding} />
      <Route path="/employees" component={Employees} />
      <Route path="/contracts" component={Contracts} />
      <Route path="/users" component={Users} />
      <Route path="/analytics" component={Analytics} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>("68f11a7e-27ab-40eb-826e-3ce6d84874de"); // In a real app, this would come from auth/storage
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <div className="flex min-h-screen bg-slate-50">
          <Sidebar 
            selectedCompanyId={selectedCompanyId} 
            onCompanySelect={setSelectedCompanyId}
            isCollapsed={isSidebarCollapsed}
            onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          />
          <div className="flex-1 flex flex-col transition-all duration-300 ease-in-out">
            <Router />
          </div>
        </div>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
