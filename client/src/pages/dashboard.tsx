import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building, Users, FileText, UserPlus, RefreshCw, TrendingUp, TrendingDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import PageHeader from "@/components/page-header";
import { Link } from "wouter";

export default function Dashboard() {
  // For demo purposes, using a hardcoded company ID
  // In a real app, this would come from auth context
  const companyId = "68f11a7e-27ab-40eb-826e-3ce6d84874de";
  
  const { data: stats, isLoading } = useQuery({
    queryKey: ['/api/companies', companyId, 'stats'],
    enabled: !!companyId,
  });

  const { data: employees } = useQuery({
    queryKey: ['/api/companies', companyId, 'employees'],
    enabled: !!companyId,
  });

  if (isLoading) {
    return (
      <div className="flex-1 p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-64 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-96 mb-8"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const statsData = [
    {
      title: "Total Employees",
      value: stats?.totalEmployees || 0,
      change: "+12%",
      trend: "up",
      icon: Users,
      color: "bg-blue-100 text-blue-600",
    },
    {
      title: "Active Contracts",
      value: stats?.activeContracts || 0,
      change: "+8%",
      trend: "up",
      icon: FileText,
      color: "bg-green-100 text-green-600",
    },
    {
      title: "Pending Onboarding",
      value: stats?.pendingOnboarding || 0,
      change: "-4%",
      trend: "down",
      icon: UserPlus,
      color: "bg-yellow-100 text-yellow-600",
    },
    {
      title: "Contract Renewals",
      value: stats?.contractRenewals || 0,
      change: "Due in 30 days",
      trend: "neutral",
      icon: RefreshCw,
      color: "bg-purple-100 text-purple-600",
    },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <PageHeader 
        title="Dashboard"
        description="Overview of your HR management system"
        showLogo={true}
      >
        <Button variant="outline">
          <Building className="w-4 h-4 mr-2" />
          Export Data
        </Button>
        <Link href="/onboarding">
          <Button>
            <UserPlus className="w-4 h-4 mr-2" />
            Quick Add Employee
          </Button>
        </Link>
      </PageHeader>

      {/* Main Content */}
      <main className="flex-1 p-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statsData.map((stat) => (
            <Card key={stat.title} className="bg-white shadow-md border border-gray-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">{stat.title}</p>
                    <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
                  </div>
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${stat.color}`}>
                    <stat.icon className="w-6 h-6" />
                  </div>
                </div>
                <p className={`text-sm mt-2 flex items-center ${
                  stat.trend === "up" ? "text-green-600" : 
                  stat.trend === "down" ? "text-red-600" : 
                  "text-gray-600"
                }`}>
                  {stat.trend === "up" && <TrendingUp className="w-3 h-3 mr-1" />}
                  {stat.trend === "down" && <TrendingDown className="w-3 h-3 mr-1" />}
                  {stat.change}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Recent Activities */}
        <Card className="bg-white shadow-md border border-gray-200">
          <CardHeader>
            <CardTitle>Recent Activities</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {employees?.slice(0, 5).map((employee: any) => (
                <div key={employee.id} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                  <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                    <Users className="w-5 h-5 text-gray-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      {employee.firstName} {employee.lastName}
                    </p>
                    <p className="text-sm text-gray-500">
                      {employee.employment?.jobTitle} - {employee.employment?.department}
                    </p>
                  </div>
                  <div className="text-sm text-gray-500">
                    {new Date(employee.createdAt).toLocaleDateString()}
                  </div>
                </div>
              ))}
              {!employees?.length && (
                <div className="text-center py-8 text-gray-500">
                  No recent activities
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
