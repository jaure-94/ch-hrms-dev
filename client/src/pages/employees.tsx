import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Search, Download, Plus, Eye, Edit, FileText } from "lucide-react";
import EmployeeTable from "@/components/employee-table";
import { Link } from "wouter";
import PageHeader from "@/components/page-header";

export default function Employees() {
  const [searchQuery, setSearchQuery] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // For demo purposes, using a hardcoded company ID
  const companyId = "68f11a7e-27ab-40eb-826e-3ce6d84874de";
  
  const { data: employees, isLoading } = useQuery({
    queryKey: ['/api/companies', companyId, 'employees', searchQuery],
    enabled: !!companyId,
  });

  const filteredEmployees = employees?.filter((employee: any) => {
    const matchesDepartment = !departmentFilter || departmentFilter === 'all' || employee.employment?.department === departmentFilter;
    const matchesStatus = !statusFilter || statusFilter === 'all' || employee.employment?.status === statusFilter;
    return matchesDepartment && matchesStatus;
  }) || [];

  const handleDownloadContract = async (employeeId: string) => {
    try {
      const response = await fetch(`/api/employees/${employeeId}/contract`, {
        method: 'POST',
        credentials: 'include',
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `employment_contract_${employeeId}.docx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Failed to download contract:', error);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <PageHeader 
        title="Employee Directory"
        description="Manage your organization's employees"
      >
        <Button variant="outline">
          <Download className="w-4 h-4 mr-2" />
          Export Data
        </Button>
        <Link href="/onboarding">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Add Employee
          </Button>
        </Link>
      </PageHeader>

      {/* Main Content */}
      <main className="flex-1 p-6">
        <Card className="bg-white shadow-md border border-gray-200">
          <CardHeader>
            <CardTitle>All Employees</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Search and Filters */}
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search employees..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="All Departments" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  <SelectItem value="Engineering">Engineering</SelectItem>
                  <SelectItem value="Marketing">Marketing</SelectItem>
                  <SelectItem value="Sales">Sales</SelectItem>
                  <SelectItem value="Human Resources">Human Resources</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Employee Table */}
            <EmployeeTable 
              employees={filteredEmployees}
              isLoading={isLoading}
              onDownloadContract={handleDownloadContract}
            />
          </CardContent>
        </Card>
      </main>

      {/* Employee Details Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Employee Details</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Employee details would go here */}
            <p className="text-gray-600">Employee details and edit form would be displayed here.</p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
