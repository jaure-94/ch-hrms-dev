import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Building, Home, Users, UserPlus, FileText, ScrollText, User, Settings, ChevronLeft, ChevronRight, Menu, LogOut, UserCog } from "lucide-react";
import { Button } from "@/components/ui/button";
import chLogoMid from "@assets/ch-logo-mid_1751733209224.png";
import chLogoPlain from "@assets/ch-logo-plain_1751733209226.png";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useAuth, authenticatedApiRequest } from "@/lib/auth";

interface SidebarProps {
  selectedCompanyId: string;
  onCompanySelect: (companyId: string) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export default function Sidebar({ selectedCompanyId, onCompanySelect, isCollapsed, onToggleCollapse }: SidebarProps) {
  const [location, setLocation] = useLocation();
  const { user, logout } = useAuth();
  
  // Use user's company ID directly (same as employees page)
  const companyId = user?.company?.id;
  
  const { data: companies } = useQuery({
    queryKey: ['/api/companies'],
    staleTime: 1000 * 60 * 5, // 5 minutes
    queryFn: async () => {
      const res = await authenticatedApiRequest('GET', '/api/companies');
      return res.json();
    },
  });

  const { data: selectedCompany } = useQuery({
    queryKey: [`/api/companies/${companyId}`],
    enabled: !!companyId,
    staleTime: 1000 * 60, // refresh company details at least every minute
    refetchOnWindowFocus: true,
    queryFn: async () => {
      const res = await authenticatedApiRequest('GET', `/api/companies/${companyId}`);
      return res.json();
    },
  });

  // Fetch employees directly (same endpoint and pattern as employees page) to get accurate count
  const { data: employees, isLoading: isLoadingEmployees, error: employeesError } = useQuery({
    queryKey: [`/api/companies/${companyId}/employees`],
    enabled: !!companyId,
    staleTime: 1000 * 30, // 30 seconds
    refetchOnWindowFocus: true,
    queryFn: async () => {
      if (!companyId) throw new Error("Company ID is required");
      const res = await authenticatedApiRequest('GET', `/api/companies/${companyId}/employees`);
      const data = await res.json();
      console.log('[Sidebar] Employees fetched:', data?.length || 0, 'employees');
      return data;
    },
  });

  const navigationItems = [
    { path: "/dashboard", icon: Home, label: "Dashboard" },
    { path: "/company", icon: Building, label: "Company" },
    { path: "/employees", icon: Users, label: "Employees" },
    { path: "/onboarding", icon: UserPlus, label: "Onboarding" },
    { path: "/contracts", icon: FileText, label: "Contracts" },
    { path: "/users", icon: Settings, label: "Users" },
    { path: "/logs", icon: ScrollText, label: "Logs" },
  ];

  const isActive = (path: string) => {
    if (path === "/dashboard" && location === "/") return true;
    return location === path;
  };

  const formatUserRole = (role: { name: string; level: number }) => {
    // Convert role level to user-friendly names
    switch (role.level) {
      case 1:
        return "Superuser";
      case 2:
        return "Admin";
      case 3:
        return "Manager";
      case 4:
        return "Employee";
      default:
        return role.name;
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      // The auth context will handle redirecting to login
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const handleAccountDetails = () => {
    if (user?.id) {
      setLocation(`/users/${user.id}/profile`);
    }
  };

  const companyName =
    (selectedCompany as any)?.name || user?.company?.name || "Company";
  
  // Get employee count from the employees array (same data source as employees page)
  const employeeCount = Array.isArray(employees) ? employees.length : 0;
  
  // Debug logging
  if (import.meta.env.DEV) {
    console.log('[Sidebar] Company ID:', companyId);
    console.log('[Sidebar] Employees data:', employees);
    console.log('[Sidebar] Employee count:', employeeCount);
    console.log('[Sidebar] Is loading:', isLoadingEmployees);
    console.log('[Sidebar] Error:', employeesError);
  }
  
  const formattedEmployeeCount = isLoadingEmployees 
    ? "Loading..." 
    : `${employeeCount} employee${employeeCount === 1 ? "" : "s"}`;

  return (
    <div className={`${isCollapsed ? 'w-16' : 'w-64'} bg-white shadow-lg border-r border-gray-200 flex flex-col transition-all duration-300 ease-in-out fixed left-0 top-0 h-screen z-50`}>
      {/* Toggle Button */}
      <div className="absolute -right-3 top-6 z-10">
        <Button
          variant="outline"
          size="sm"
          onClick={onToggleCollapse}
          className="w-6 h-6 rounded-full p-0 bg-white border-2 border-gray-200 hover:bg-gray-50"
        >
          {isCollapsed ? (
            <ChevronRight className="w-3 h-3" />
          ) : (
            <ChevronLeft className="w-3 h-3" />
          )}
        </Button>
      </div>

      {/* Company Selector */}
      {!isCollapsed && (
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-white">
              <img
                src={chLogoPlain}
                alt={`${companyName} logo`}
                className="w-8 h-8 object-contain"
              />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900">
                {companyName}
              </h2>
              <p className="text-sm text-gray-500">
                {formattedEmployeeCount}
              </p>
            </div>
          </div>
          
          <Select value={selectedCompanyId} onValueChange={onCompanySelect}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Switch Company" />
            </SelectTrigger>
            <SelectContent>
              {(companies as any[])?.map((company: any) => (
                <SelectItem key={company.id} value={company.id}>
                  {company.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Collapsed Company Icon */}
      {isCollapsed && (
        <div className="p-4 border-b border-gray-200 flex justify-center">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-white">
            <img
              src={chLogoPlain}
              alt={`${companyName} logo`}
              className="w-6 h-6 object-contain"
            />
          </div>
        </div>
      )}

      {/* Navigation Menu */}
      <nav className={`flex-1 ${isCollapsed ? 'px-2' : 'px-4'} py-6 space-y-2`}>
        {navigationItems.map((item) => (
          <Link key={item.path} href={item.path}>
            <Button
              variant={isActive(item.path) ? "default" : "ghost"}
              className={`w-full ${isCollapsed ? 'justify-center px-2' : 'justify-start space-x-3'} ${
                isActive(item.path) 
                  ? "bg-blue-50 text-blue-600 hover:bg-blue-100" 
                  : "text-gray-600 hover:bg-gray-50"
              }`}
              title={isCollapsed ? item.label : undefined}
            >
              <item.icon className="w-4 h-4" />
              {!isCollapsed && <span>{item.label}</span>}
            </Button>
          </Link>
        ))}
      </nav>

      {/* User Profile */}
      <div className={`${isCollapsed ? 'p-2' : 'p-4'} border-t border-gray-200`}>
        {!isCollapsed ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="w-full h-auto p-0 hover:bg-gray-50">
                <div className="flex items-center space-x-3 w-full p-2 rounded">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-sm font-medium text-gray-900" data-testid="text-username">
                      {user ? `${user.firstName} ${user.lastName}` : 'Loading...'}
                    </p>
                    <p className="text-xs text-gray-500" data-testid="text-userrole">
                      {user ? formatUserRole(user.role) : 'Loading...'}
                    </p>
                  </div>
                  <Settings className="w-4 h-4 text-gray-400" />
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {user ? `${user.firstName} ${user.lastName}` : 'Loading...'}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {user?.email}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleAccountDetails} data-testid="button-account-details">
                <UserCog className="mr-2 h-4 w-4" />
                <span>Account Details</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} data-testid="button-logout">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="w-full h-auto p-2 hover:bg-gray-50">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-blue-600" />
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {user ? `${user.firstName} ${user.lastName}` : 'Loading...'}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {user?.email}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleAccountDetails} data-testid="button-account-details">
                <UserCog className="mr-2 h-4 w-4" />
                <span>Account Details</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} data-testid="button-logout">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </div>
  );
}
