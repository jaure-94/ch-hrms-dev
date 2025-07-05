import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Building, Home, Users, UserPlus, FileText, BarChart, User, Settings, ChevronLeft, ChevronRight, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import chLogoMid from "@assets/ch-logo-mid_1751733209224.png";
import chLogoPlain from "@assets/ch-logo-plain_1751733209226.png";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface SidebarProps {
  selectedCompanyId: string;
  onCompanySelect: (companyId: string) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export default function Sidebar({ selectedCompanyId, onCompanySelect, isCollapsed, onToggleCollapse }: SidebarProps) {
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
    { path: "/users", icon: Settings, label: "Users" },
    { path: "/analytics", icon: BarChart, label: "Analytics" },
  ];

  const isActive = (path: string) => {
    if (path === "/dashboard" && location === "/") return true;
    return location === path;
  };

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
                alt="Compliance Hub UK" 
                className="w-8 h-8 object-contain"
              />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900">
                Compliance Hub UK
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
      )}

      {/* Collapsed Company Icon */}
      {isCollapsed && (
        <div className="p-4 border-b border-gray-200 flex justify-center">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-white">
            <img 
              src={chLogoPlain} 
              alt="Compliance Hub UK" 
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
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
              <User className="w-4 h-4 text-gray-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">Leo Kaluza</p>
              <p className="text-xs text-gray-500">Admin</p>
            </div>
            <Button variant="ghost" size="sm">
              <Settings className="w-4 h-4 text-gray-400" />
            </Button>
          </div>
        ) : (
          <div className="flex justify-center">
            <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
              <User className="w-4 h-4 text-gray-600" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
