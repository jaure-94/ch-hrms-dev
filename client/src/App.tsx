import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useState } from "react";
import { AuthProvider, useAuth, ProtectedRoute } from "@/lib/auth";
import NotFound from "@/pages/not-found";
import Login from "@/pages/login";
import Signup from "@/pages/signup";
import CompanySetup from "@/pages/company-setup";
import Dashboard from "@/pages/dashboard";
import Onboarding from "@/pages/onboarding";
import Employees from "@/pages/employees";
import Contracts from "@/pages/contracts";
import ContractTemplate from "@/pages/contract-template";
import ContractGenerate from "@/pages/contract-generate";
import Users from "@/pages/users";
import Analytics from "@/pages/analytics";
import EditEmployee from "@/pages/edit-employee";
import EditUser from "@/pages/edit-user";
import Sidebar from "@/components/sidebar";

// Public routes (no authentication required)
function PublicRouter() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/signup" component={Signup} />
      <Route path="/" component={Login} />
      <Route component={Login} />
    </Switch>
  );
}

// Protected routes (authentication required)
function ProtectedRouter() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);
  const { user } = useAuth();

  // If company setup is not completed, redirect to setup
  if (user && !user.company.setupCompleted && user.role.name === 'superuser') {
    return (
      <Switch>
        <Route path="/company-setup" component={CompanySetup} />
        <Route component={CompanySetup} />
      </Switch>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar 
        selectedCompanyId={user?.company.id || ""} 
        onCompanySelect={() => {}} // Company is now fixed to user's company
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />
      <div className={`${isSidebarCollapsed ? 'ml-16' : 'ml-64'} transition-all duration-300 ease-in-out min-h-screen`}>
        <Switch>
          <Route path="/" component={Dashboard} />
          <Route path="/dashboard" component={Dashboard} />
          
          {/* Employee Management - Manager+ required */}
          <Route path="/onboarding">
            <ProtectedRoute requiredRoleLevel={3}>
              <Onboarding />
            </ProtectedRoute>
          </Route>
          <Route path="/employees">
            <ProtectedRoute requiredRoleLevel={4}>
              <Employees />
            </ProtectedRoute>
          </Route>
          <Route path="/employees/edit/:id">
            <ProtectedRoute requiredRoleLevel={3}>
              <EditEmployee />
            </ProtectedRoute>
          </Route>

          {/* Contract Management - Manager+ required */}
          <Route path="/contracts">
            <ProtectedRoute requiredRoleLevel={3}>
              <Contracts />
            </ProtectedRoute>
          </Route>
          <Route path="/contracts/template">
            <ProtectedRoute requiredRoleLevel={2}>
              <ContractTemplate />
            </ProtectedRoute>
          </Route>
          <Route path="/contracts/generate">
            <ProtectedRoute requiredRoleLevel={3}>
              <ContractGenerate />
            </ProtectedRoute>
          </Route>

          {/* User Management - Admin+ required */}
          <Route path="/users">
            <ProtectedRoute requiredRoleLevel={2}>
              <Users />
            </ProtectedRoute>
          </Route>
          <Route path="/users/edit/:id">
            <ProtectedRoute requiredRoleLevel={2}>
              <EditUser />
            </ProtectedRoute>
          </Route>

          {/* Analytics - Manager+ required */}
          <Route path="/analytics">
            <ProtectedRoute requiredRoleLevel={3}>
              <Analytics />
            </ProtectedRoute>
          </Route>

          <Route component={NotFound} />
        </Switch>
      </div>
    </div>
  );
}

// Main router that switches between public and protected routes
function MainRouter() {
  const { isAuthenticated, isLoading } = useAuth();

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Switch between authenticated and public views
  return isAuthenticated ? <ProtectedRouter /> : <PublicRouter />;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <MainRouter />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
