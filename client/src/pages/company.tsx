import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Building, MapPin, Phone, Mail, Globe, Users, Briefcase, Calendar, Edit } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { authenticatedApiRequest } from "@/lib/auth";
import { useAuth } from "@/lib/auth";
import { Link } from "wouter";
import Breadcrumb from "@/components/breadcrumb";
import PageHeader from "@/components/page-header";

export default function Company() {
  const { user } = useAuth();
  const companyId = user?.company?.id;

  // Fetch company details
  const { data: company, isLoading: isLoadingCompany } = useQuery({
    queryKey: ['/api/companies', companyId, 'details'],
    queryFn: async () => {
      const response = await authenticatedApiRequest('GET', `/api/companies/${companyId}/details`);
      return response.json();
    },
    enabled: !!companyId,
  });

  // Fetch company departments
  const { data: departments, isLoading: isLoadingDepartments } = useQuery({
    queryKey: ['/api/companies', companyId, 'departments'],
    queryFn: async () => {
      const response = await authenticatedApiRequest('GET', `/api/companies/${companyId}/departments`);
      return response.json();
    },
    enabled: !!companyId,
  });

  // Fetch company statistics
  const { data: stats } = useQuery({
    queryKey: ['/api/companies', companyId, 'stats'],
    enabled: !!companyId,
  });

  const breadcrumbItems = [
    { label: "Company", icon: Building }
  ];

  if (isLoadingCompany) {
    return (
      <div className="space-y-6 px-6">
        <Breadcrumb items={breadcrumbItems} />
        <PageHeader
          title="Company"
          description="Manage your company information and departments"
          showLogo={false}
        />
        <div className="animate-pulse space-y-4">
          <div className="h-48 bg-gray-200 rounded-lg"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="h-32 bg-gray-200 rounded-lg"></div>
            <div className="h-32 bg-gray-200 rounded-lg"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="space-y-6 px-6">
        <Breadcrumb items={breadcrumbItems} />
        <PageHeader
          title="Company"
          description="Manage your company information and departments"
          showLogo={false}
        />
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Building className="w-12 h-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Company Not Found</h3>
            <p className="text-gray-600">Unable to load company details.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 px-6" data-testid="company-page">
      <Breadcrumb items={breadcrumbItems} />
      
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <PageHeader
          title="Company Information"
          description="Manage your company details and departments"
          showLogo={false}
        />
        
        <Button 
          asChild
          className="flex items-center gap-2"
          data-testid="button-edit-company"
        >
          <Link href="/company/edit">
            <Edit className="w-4 h-4" />
            Edit Company
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Company Overview */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="w-5 h-5" />
                Company Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-1">Company Name</h4>
                    <p className="text-lg font-semibold text-gray-900" data-testid="text-company-name">
                      {company.name}
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-1">Industry</h4>
                    <p className="text-gray-900" data-testid="text-company-industry">
                      {company.industry || "Not specified"}
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-1">Company Size</h4>
                    <Badge variant="secondary" data-testid="badge-company-size">
                      {company.size || "Not specified"}
                    </Badge>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-1">Company Number</h4>
                    <p className="text-gray-900" data-testid="text-company-number">
                      {company.companyNumber || "Not specified"}
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-1">Established</h4>
                    <p className="text-gray-900 flex items-center gap-1" data-testid="text-company-established">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      {company.createdAt ? new Date(company.createdAt).toLocaleDateString() : "Not available"}
                    </p>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Contact Information */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3">Contact Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-start gap-3">
                    <MapPin className="w-4 h-4 text-gray-400 mt-1 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-gray-700">Address</p>
                      <p className="text-gray-900" data-testid="text-company-address">
                        {company.address || "Not specified"}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <Phone className="w-4 h-4 text-gray-400 mt-1 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-gray-700">Phone</p>
                      <p className="text-gray-900" data-testid="text-company-phone">
                        {company.phone || "Not specified"}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <Mail className="w-4 h-4 text-gray-400 mt-1 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-gray-700">Email</p>
                      <p className="text-gray-900" data-testid="text-company-email">
                        {company.email || "Not specified"}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <Globe className="w-4 h-4 text-gray-400 mt-1 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-gray-700">Website</p>
                      {company.website ? (
                        <a 
                          href={company.website.startsWith('http') ? company.website : `https://${company.website}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 underline"
                          data-testid="link-company-website"
                        >
                          {company.website}
                        </a>
                      ) : (
                        <p className="text-gray-900" data-testid="text-company-website">Not specified</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Statistics and Quick Info */}
        <div className="space-y-6">
          {/* Company Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Company Stats
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600" data-testid="text-employee-count">
                    {(stats as any)?.totalEmployees || 0}
                  </div>
                  <div className="text-sm text-gray-600">Total Employees</div>
                </div>
                
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600" data-testid="text-department-count">
                    {departments?.length || 0}
                  </div>
                  <div className="text-sm text-gray-600">Departments</div>
                </div>
                
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600" data-testid="text-active-users">
                    {(stats as any)?.activeUsers || 0}
                  </div>
                  <div className="text-sm text-gray-600">Active Users</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Setup Status */}
          <Card>
            <CardHeader>
              <CardTitle>Setup Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Company Setup</span>
                <Badge variant={company.setupCompleted ? "default" : "destructive"} data-testid="badge-setup-status">
                  {company.setupCompleted ? "Complete" : "Incomplete"}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Departments Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Briefcase className="w-5 h-5" />
            Departments
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingDepartments ? (
            <div className="animate-pulse space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
          ) : departments && departments.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {departments.map((department: any) => (
                <Card key={department.id} className="hover:shadow-md transition-shadow" data-testid={`card-department-${department.id}`}>
                  <CardContent className="p-4">
                    <h4 className="font-semibold text-gray-900 mb-1" data-testid={`text-department-name-${department.id}`}>
                      {department.name}
                    </h4>
                    <p className="text-sm text-gray-600 mb-2" data-testid={`text-department-description-${department.id}`}>
                      {department.description || "No description provided"}
                    </p>
                    <div className="flex items-center justify-between">
                      <Badge variant={department.isActive ? "default" : "secondary"} data-testid={`badge-department-status-${department.id}`}>
                        {department.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Briefcase className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Departments</h3>
              <p className="text-gray-600 mb-4">Get started by adding departments to organize your company structure.</p>
              <Button 
                variant="outline"
                data-testid="button-add-first-department"
              >
                Add First Department
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

    </div>
  );
}