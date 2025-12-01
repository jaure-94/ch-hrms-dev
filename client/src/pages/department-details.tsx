import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation, useRoute } from "wouter";
import { authenticatedApiRequest } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import Breadcrumb from "@/components/breadcrumb";
import PageHeader from "@/components/page-header";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  ArrowLeft,
  ArrowRight,
  Building,
  Briefcase,
  ListFilter,
  PencilLine,
  Search,
  Users,
} from "lucide-react";
import { Link } from "wouter";

type DepartmentDetailResponse = {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  company: {
    id: string;
    name: string;
  };
  jobRoles: Array<{
    id: string;
    title: string;
    jobId: string;
    description: string | null;
    status: "vacant" | "filled";
    assignedEmployeeId: string | null;
    createdAt: string;
    updatedAt: string;
  }>;
};

const statusColors: Record<"vacant" | "filled", string> = {
  vacant: "text-amber-700 bg-amber-50 border-amber-200",
  filled: "text-emerald-700 bg-emerald-50 border-emerald-200",
};

export default function DepartmentDetails() {
  const [, params] = useRoute("/departments/:id");
  const [, setLocation] = useLocation();
  const departmentId = params?.id;
  const [statusFilter, setStatusFilter] = useState<"all" | "vacant" | "filled">("all");

  const { data, isLoading, error } = useQuery({
    queryKey: ["/api/departments", departmentId, "details"],
    enabled: Boolean(departmentId),
    queryFn: async (): Promise<DepartmentDetailResponse> => {
      const response = await authenticatedApiRequest("GET", `/api/departments/${departmentId}/details`);
      if (!response.ok) throw new Error("Failed to load department");
      return response.json();
    },
  });

  const jobRoleStats = useMemo(() => {
    const total = data?.jobRoles.length ?? 0;
    const filled = data?.jobRoles.filter((role) => role.status === "filled").length ?? 0;
    const vacant = total - filled;
    const coverage = total > 0 ? Math.round((filled / total) * 100) : 0;
    return { total, filled, vacant, coverage };
  }, [data]);

  const filteredRoles = useMemo(() => {
    if (!data) return [];
    if (statusFilter === "all") return data.jobRoles;
    return data.jobRoles.filter((role) => role.status === statusFilter);
  }, [data, statusFilter]);

  const breadcrumbItems = [
    { label: "Company", icon: Building, href: "/company" },
    { label: "Departments", icon: Briefcase, href: "/company#departments" },
    { label: data?.name ?? "Department", icon: Users },
  ];

  if (isLoading) {
    return (
      <div className="space-y-6 px-6 py-6">
        <div className="h-4 w-48 bg-slate-200 rounded animate-pulse" />
        <div className="h-10 w-72 bg-slate-200 rounded animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((item) => (
            <div key={item} className="h-32 bg-slate-200 rounded-lg animate-pulse" />
          ))}
        </div>
        <div className="h-96 bg-slate-200 rounded-lg animate-pulse" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="space-y-6 px-6 py-8">
        <Button variant="ghost" size="sm" className="gap-2" onClick={() => setLocation("/company")}>
          <ArrowLeft className="w-4 h-4" />
          Back to company
        </Button>
        <Alert variant="destructive">
          <AlertDescription>We couldn’t load that department. Please try again or return later.</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6 px-6 pb-10" data-testid="department-details-page">
      <Breadcrumb items={breadcrumbItems} />

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <PageHeader
          title={data.name}
          description={data.description || "No description provided yet"}
          showLogo={false}
        />
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            className="gap-2"
            data-testid="button-back-to-company"
            onClick={() => setLocation("/company")}
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Company
          </Button>
          <Button
            className="gap-2"
            asChild
            data-testid="button-edit-department"
          >
            <Link href={`/departments/${data.id}/edit`}>
              <PencilLine className="w-4 h-4" />
              Edit Department
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-gray-500">Total Roles</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold text-gray-900">{jobRoleStats.total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-gray-500">Filled Roles</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold text-emerald-600">{jobRoleStats.filled}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-gray-500">Vacant Roles</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold text-amber-600">{jobRoleStats.vacant}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-gray-500">Coverage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-between">
              <p className="text-3xl font-semibold text-blue-600">{jobRoleStats.coverage}%</p>
              <span className="text-xs text-gray-500">Filled / Total</span>
            </div>
            <div className="mt-3 h-2 rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-blue-600 transition-all"
                style={{ width: `${jobRoleStats.coverage}%` }}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <Briefcase className="w-5 h-5" />
              Job Roles
            </div>
            <div className="flex flex-wrap gap-2">
              {["all", "vacant", "filled"].map((filter) => (
                <Button
                  key={filter}
                  type="button"
                  variant={statusFilter === filter ? "default" : "outline"}
                  size="sm"
                  className="capitalize"
                  onClick={() => setStatusFilter(filter as typeof statusFilter)}
                  data-testid={`button-filter-${filter}`}
                >
                  {filter}
                </Button>
              ))}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between text-sm text-gray-500">
            <div className="flex items-center gap-2">
              <ListFilter className="w-4 h-4" />
              Showing {filteredRoles.length} {statusFilter} roles
            </div>
            <div className="flex items-center gap-2 text-gray-400 text-sm">
              <Search className="w-4 h-4" />
              Smart search coming soon
            </div>
          </div>
          <Separator />
          {filteredRoles.length === 0 ? (
            <div className="text-center py-12">
              <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center">
                <Briefcase className="w-5 h-5 text-slate-400" />
              </div>
              <p className="text-lg font-semibold text-gray-900">No roles to show</p>
              <p className="text-gray-600">
                {statusFilter === "all"
                  ? "Create your first job role to start tracking capacity."
                  : `There are currently no ${statusFilter} roles.`}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredRoles.map((role) => (
                <div
                  key={role.id}
                  className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <h4 className="text-base font-semibold text-gray-900">{role.title}</h4>
                        <Badge variant="secondary">{role.jobId}</Badge>
                      </div>
                      <p className="text-sm text-gray-600">
                        {role.description || "No description provided yet."}
                      </p>
                      <div className="text-xs text-gray-500">
                        Updated {new Date(role.updatedAt).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span
                        className={`rounded-full border px-3 py-1 text-xs font-medium ${statusColors[role.status]}`}
                      >
                        {role.status === "vacant" ? "Vacant" : "Filled"}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="gap-1 text-gray-700"
                        asChild
                        data-testid={`button-role-manage-${role.id}`}
                      >
                        <Link href={`/job-roles/${role.id}/edit`}>
                          Manage
                          <ArrowRight className="w-4 h-4" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}








