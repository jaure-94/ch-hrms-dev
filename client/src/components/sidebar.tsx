import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Building, Home, Users, UserPlus, FileText, BarChart, User, Settings, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface SidebarProps {
  selectedCompanyId: string;
  onCompanySelect: (companyId: string) => void;
}

export default function Sidebar({ selectedCompanyId, onCompanySelect }: SidebarProps) {
  const [location] = useLocation();
  
  const { data: companies } = useQuery({
    queryKey: ['/api/companies'],
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const { data: selectedCompany } = useQuery({
    queryKey: ['/api/companies', selectedCompanyId],
    enabled: !!selectedCompanyId,
  });

  const { data: stats } = useQuery({
    queryKey: ['/api/companies', selectedCompanyId, 'stats'],
    enabled: !!selectedCompanyId,
  });

  const navigationItems = [
    { path: "/dashboard", icon: Home, label: "Dashboard" },
    { path: "/employees", icon: Users, label: "Employees" },
    { path: "/onboarding", icon: UserPlus, label: "Onboarding" },
    { path: "/contracts", icon: FileText, label: "Contracts" },
    { path: "/analytics", icon: BarChart, label: "Analytics" },
  ];

  const isActive = (path: string) => {
    if (path === "/dashboard" && location === "/") return true;
    return location === path;
  };

  return (
    <div className="w-64 bg-white shadow-lg border-r border-gray-200 flex flex-col">
      {/* Company Selector */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
            <Building className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="font-semibold text-gray-900">
              {selectedCompany?.name || "Select Company"}
            </h2>
            <p className="text-sm text-gray-500">
              {stats?.totalEmployees || 0} employees
            </p>
          </div>
        </div>
        
        <Select value={selectedCompanyId} onValueChange={onCompanySelect}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Switch Company" />
          </SelectTrigger>
          <SelectContent>
            {companies?.map((company: any) => (
              <SelectItem key={company.id} value={company.id}>
                {company.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 px-4 py-6 space-y-2">
        {navigationItems.map((item) => (
          <Link key={item.path} href={item.path}>
            <Button
              variant={isActive(item.path) ? "default" : "ghost"}
              className={`w-full justify-start space-x-3 ${
                isActive(item.path) 
                  ? "bg-blue-50 text-blue-600 hover:bg-blue-100" 
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              <item.icon className="w-4 h-4" />
              <span>{item.label}</span>
            </Button>
          </Link>
        ))}
      </nav>

      {/* User Profile */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
            <User className="w-4 h-4 text-gray-600" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-900">HR Manager</p>
            <p className="text-xs text-gray-500">Admin</p>
          </div>
          <Button variant="ghost" size="sm">
            <Settings className="w-4 h-4 text-gray-400" />
          </Button>
        </div>
      </div>
    </div>
  );
}
