import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Download, Plus, Eye, Edit, FileText, RefreshCw } from "lucide-react";

export default function Contracts() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  
  // For demo purposes, using a hardcoded company ID
  const companyId = "68f11a7e-27ab-40eb-826e-3ce6d84874de";
  
  const { data: employees, isLoading } = useQuery({
    queryKey: ['/api/companies', companyId, 'employees', searchQuery],
    enabled: !!companyId,
  });

  // Filter active employees to show their contracts
  const contracts = employees?.filter((employee: any) => {
    const matchesDepartment = !departmentFilter || departmentFilter === 'all' || employee.employment?.department === departmentFilter;
    const matchesStatus = !statusFilter || statusFilter === 'all' || employee.employment?.status === statusFilter;
    const matchesSearch = !searchQuery || 
      employee.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      employee.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      employee.employment?.jobTitle.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesDepartment && matchesStatus && matchesSearch;
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

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'expired':
        return 'bg-red-100 text-red-800';
      case 'terminated':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getContractEndDate = (startDate: string) => {
    // For demo purposes, assume 1-year contracts
    const start = new Date(startDate);
    const end = new Date(start);
    end.setFullYear(start.getFullYear() + 1);
    return end.toLocaleDateString();
  };

  if (isLoading) {
    return (
      <div className="flex-1 p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-64 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-96 mb-8"></div>
          <div className="h-96 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Contract Management</h1>
            <p className="text-sm text-gray-600">View and manage all active employment contracts</p>
          </div>
          <div className="flex items-center space-x-4">
            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Export All Contracts
            </Button>
            <Button variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh Status
            </Button>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Generate New Contract
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-6">
        <Card className="bg-white shadow-md border border-gray-200">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileText className="w-5 h-5" />
              <span>Active Contracts ({contracts.length})</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Search and Filters */}
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search contracts by employee or position..."
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
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                  <SelectItem value="terminated">Terminated</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Contracts Table */}
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Position</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Contract Start</TableHead>
                    <TableHead>Contract End</TableHead>
                    <TableHead>Salary</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contracts.map((contract: any) => (
                    <TableRow key={contract.id} className="hover:bg-gray-50">
                      <TableCell>
                        <div className="font-medium text-gray-900">
                          {contract.firstName} {contract.lastName}
                        </div>
                        <div className="text-sm text-gray-500">
                          {contract.email}
                        </div>
                      </TableCell>
                      <TableCell className="text-gray-900">
                        {contract.employment?.jobTitle || 'N/A'}
                      </TableCell>
                      <TableCell className="text-gray-900">
                        {contract.employment?.department || 'N/A'}
                      </TableCell>
                      <TableCell className="text-gray-900">
                        {contract.employment?.startDate 
                          ? new Date(contract.employment.startDate).toLocaleDateString()
                          : 'N/A'
                        }
                      </TableCell>
                      <TableCell className="text-gray-900">
                        {contract.employment?.startDate 
                          ? getContractEndDate(contract.employment.startDate)
                          : 'N/A'
                        }
                      </TableCell>
                      <TableCell className="text-gray-900">
                        ${contract.employment?.baseSalary ? 
                          Number(contract.employment.baseSalary).toLocaleString() : 'N/A'}
                        <span className="text-sm text-gray-500 ml-1">
                          /{contract.employment?.payFrequency?.toLowerCase() || 'year'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(contract.employment?.status || 'inactive')}>
                          {contract.employment?.status || 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <Button variant="ghost" size="sm" title="View Details">
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm" title="Edit Contract">
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDownloadContract(contract.id)}
                            title="Download Contract"
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              
              {!contracts.length && (
                <div className="text-center py-8">
                  <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No contracts found</h3>
                  <p className="text-gray-600">No contracts match your current search criteria.</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}