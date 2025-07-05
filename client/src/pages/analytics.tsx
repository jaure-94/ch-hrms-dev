import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Download, BarChart, Activity, User, Clock, Shield, FileText, Filter } from "lucide-react";

interface ActionLog {
  id: string;
  timestamp: Date;
  userId: string;
  userName: string;
  userRole: string;
  action: string;
  resource: string;
  details: string;
  ipAddress: string;
  userAgent: string;
  accessLevel: string;
}

export default function Analytics() {
  const [searchQuery, setSearchQuery] = useState("");
  const [actionFilter, setActionFilter] = useState("all");
  const [userFilter, setUserFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  
  // For demo purposes, using a hardcoded company ID
  const companyId = "68f11a7e-27ab-40eb-826e-3ce6d84874de";
  
  const { data: employees } = useQuery({
    queryKey: ['/api/companies', companyId, 'employees'],
    enabled: !!companyId,
  });

  // Generate sample action logs
  const generateActionLogs = (): ActionLog[] => {
    const actions = [
      'CREATE_EMPLOYEE', 'UPDATE_EMPLOYEE', 'DELETE_EMPLOYEE', 'VIEW_EMPLOYEE',
      'GENERATE_CONTRACT', 'DOWNLOAD_CONTRACT', 'UPDATE_CONTRACT',
      'LOGIN', 'LOGOUT', 'CHANGE_PASSWORD', 'UPDATE_PROFILE',
      'CREATE_USER', 'UPDATE_USER_PERMISSIONS', 'DELETE_USER',
      'EXPORT_DATA', 'IMPORT_DATA', 'VIEW_ANALYTICS',
      'SEARCH_EMPLOYEES', 'FILTER_CONTRACTS', 'BULK_UPDATE'
    ];

    const resources = [
      'Employee Database', 'Contract System', 'User Management', 'Analytics Dashboard',
      'Authentication System', 'Export System', 'Search Engine', 'File System'
    ];

    const logs: ActionLog[] = [];
    const now = new Date();
    
    // Generate 50 sample log entries
    for (let i = 0; i < 50; i++) {
      const randomEmployee = employees?.[Math.floor(Math.random() * (employees?.length || 1))] || {
        id: 'user-1',
        firstName: 'Leo',
        lastName: 'Kaluza',
        employment: { department: 'Human Resources', jobTitle: 'HR Admin' }
      };
      
      const action = actions[Math.floor(Math.random() * actions.length)];
      const resource = resources[Math.floor(Math.random() * resources.length)];
      const timestamp = new Date(now.getTime() - (i * 60 * 60 * 1000 * Math.random() * 24)); // Random time in last 24 days
      
      logs.push({
        id: `log-${i + 1}`,
        timestamp,
        userId: randomEmployee.id,
        userName: `${randomEmployee.firstName} ${randomEmployee.lastName}`,
        userRole: getUserRole(randomEmployee.employment?.department, randomEmployee.employment?.jobTitle),
        action,
        resource,
        details: getActionDetails(action, resource),
        ipAddress: `192.168.1.${Math.floor(Math.random() * 255)}`,
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        accessLevel: getAccessLevel(randomEmployee.employment?.department, randomEmployee.employment?.jobTitle)
      });
    }
    
    return logs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  };

  function getUserRole(department: string, jobTitle: string) {
    if (!department || !jobTitle) return 'User';
    
    if (department === 'Human Resources') return 'HR Admin';
    if (jobTitle.toLowerCase().includes('manager') || jobTitle.toLowerCase().includes('director')) return 'Manager';
    if (jobTitle.toLowerCase().includes('senior')) return 'Senior User';
    return 'User';
  }

  function getAccessLevel(department: string, jobTitle: string) {
    if (!department || !jobTitle) return 'Read';
    
    if (department === 'Human Resources') return 'Full Access';
    if (jobTitle.toLowerCase().includes('manager') || jobTitle.toLowerCase().includes('director')) return 'Manager Access';
    return 'Standard Access';
  }

  function getActionDetails(action: string, resource: string): string {
    const details = {
      'CREATE_EMPLOYEE': `Created new employee record in ${resource}`,
      'UPDATE_EMPLOYEE': `Modified employee information in ${resource}`,
      'DELETE_EMPLOYEE': `Removed employee record from ${resource}`,
      'VIEW_EMPLOYEE': `Accessed employee details in ${resource}`,
      'GENERATE_CONTRACT': `Generated employment contract using ${resource}`,
      'DOWNLOAD_CONTRACT': `Downloaded contract document from ${resource}`,
      'LOGIN': `User authenticated via ${resource}`,
      'LOGOUT': `User session ended in ${resource}`,
      'EXPORT_DATA': `Exported data from ${resource}`,
      'SEARCH_EMPLOYEES': `Performed search query in ${resource}`,
    };
    
    return details[action as keyof typeof details] || `Performed ${action} on ${resource}`;
  }

  const actionLogs = generateActionLogs();

  // Filter logs based on search and filter criteria
  const filteredLogs = actionLogs.filter(log => {
    const matchesSearch = !searchQuery || 
      log.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.resource.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.details.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesAction = !actionFilter || actionFilter === 'all' || log.action === actionFilter;
    const matchesUser = !userFilter || userFilter === 'all' || log.userRole === userFilter;
    
    let matchesDate = true;
    if (dateFilter !== 'all') {
      const now = new Date();
      const daysDiff = Math.floor((now.getTime() - log.timestamp.getTime()) / (1000 * 60 * 60 * 24));
      
      switch (dateFilter) {
        case 'today':
          matchesDate = daysDiff === 0;
          break;
        case 'week':
          matchesDate = daysDiff <= 7;
          break;
        case 'month':
          matchesDate = daysDiff <= 30;
          break;
      }
    }
    
    return matchesSearch && matchesAction && matchesUser && matchesDate;
  });

  const getActionColor = (action: string) => {
    if (action.includes('CREATE')) return 'bg-green-100 text-green-800';
    if (action.includes('UPDATE')) return 'bg-blue-100 text-blue-800';
    if (action.includes('DELETE')) return 'bg-red-100 text-red-800';
    if (action.includes('VIEW') || action.includes('SEARCH')) return 'bg-gray-100 text-gray-800';
    if (action.includes('DOWNLOAD') || action.includes('EXPORT')) return 'bg-purple-100 text-purple-800';
    if (action.includes('LOGIN') || action.includes('LOGOUT')) return 'bg-yellow-100 text-yellow-800';
    return 'bg-gray-100 text-gray-800';
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'HR Admin':
        return 'bg-purple-100 text-purple-800';
      case 'Manager':
        return 'bg-blue-100 text-blue-800';
      case 'Senior User':
        return 'bg-green-100 text-green-800';
      case 'User':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleExportLogs = () => {
    const csvContent = [
      'Timestamp,User,Role,Action,Resource,Details,IP Address,Access Level',
      ...filteredLogs.map(log => 
        `"${log.timestamp.toISOString()}","${log.userName}","${log.userRole}","${log.action}","${log.resource}","${log.details}","${log.ipAddress}","${log.accessLevel}"`
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `system_logs_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex-1 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Analytics & Audit Logs</h1>
            <p className="text-sm text-gray-600">Monitor system activity and user actions</p>
          </div>
          <div className="flex items-center space-x-4">
            <Button variant="outline">
              <Filter className="w-4 h-4 mr-2" />
              Advanced Filters
            </Button>
            <Button variant="outline" onClick={handleExportLogs}>
              <Download className="w-4 h-4 mr-2" />
              Export Excel File
            </Button>
            <Button>
              <BarChart className="w-4 h-4 mr-2" />
              Generate Report
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <Card className="bg-white shadow-md border border-gray-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Actions</p>
                  <p className="text-2xl font-semibold text-gray-900">{actionLogs.length}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Activity className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white shadow-md border border-gray-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Today's Actions</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {actionLogs.filter(log => {
                      const today = new Date();
                      const logDate = new Date(log.timestamp);
                      return logDate.toDateString() === today.toDateString();
                    }).length}
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <Clock className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white shadow-md border border-gray-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Active Users</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {new Set(actionLogs.map(log => log.userId)).size}
                  </p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <User className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white shadow-md border border-gray-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Security Events</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {actionLogs.filter(log => 
                      log.action.includes('LOGIN') || 
                      log.action.includes('LOGOUT') || 
                      log.action.includes('PERMISSION')
                    ).length}
                  </p>
                </div>
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                  <Shield className="w-6 h-6 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Action Logs Table */}
        <Card className="bg-white shadow-md border border-gray-200">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Activity className="w-5 h-5" />
              <span>System Activity Log ({filteredLogs.length} entries)</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Search and Filters */}
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search by user, action, or resource..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={actionFilter} onValueChange={setActionFilter}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="All Actions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Actions</SelectItem>
                  <SelectItem value="CREATE_EMPLOYEE">Create Employee</SelectItem>
                  <SelectItem value="UPDATE_EMPLOYEE">Update Employee</SelectItem>
                  <SelectItem value="DELETE_EMPLOYEE">Delete Employee</SelectItem>
                  <SelectItem value="GENERATE_CONTRACT">Generate Contract</SelectItem>
                  <SelectItem value="LOGIN">Login</SelectItem>
                  <SelectItem value="EXPORT_DATA">Export Data</SelectItem>
                </SelectContent>
              </Select>
              <Select value={userFilter} onValueChange={setUserFilter}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="All Users" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Users</SelectItem>
                  <SelectItem value="HR Admin">HR Admin</SelectItem>
                  <SelectItem value="Manager">Manager</SelectItem>
                  <SelectItem value="Senior User">Senior User</SelectItem>
                  <SelectItem value="User">User</SelectItem>
                </SelectContent>
              </Select>
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="All Time" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="week">Last Week</SelectItem>
                  <SelectItem value="month">Last Month</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Logs Table */}
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Resource</TableHead>
                    <TableHead>Details</TableHead>
                    <TableHead>Access Level</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLogs.slice(0, 20).map((log) => (
                    <TableRow key={log.id} className="hover:bg-gray-50">
                      <TableCell className="text-sm text-gray-900">
                        <div className="flex items-center">
                          <Clock className="w-3 h-3 mr-1 text-gray-400" />
                          {log.timestamp.toLocaleString()}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <User className="w-4 h-4 text-gray-400" />
                          <span className="font-medium text-gray-900">{log.userName}</span>
                        </div>
                        <div className="text-xs text-gray-500">{log.ipAddress}</div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getRoleColor(log.userRole)}>
                          <Shield className="w-3 h-3 mr-1" />
                          {log.userRole}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getActionColor(log.action)}>
                          {log.action}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-gray-900">{log.resource}</TableCell>
                      <TableCell className="text-sm text-gray-600 max-w-xs truncate">
                        {log.details}
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-gray-900">{log.accessLevel}</span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              
              {filteredLogs.length > 20 && (
                <div className="mt-4 text-center text-sm text-gray-500">
                  Showing 20 of {filteredLogs.length} entries. Use filters to narrow results.
                </div>
              )}
              
              {!filteredLogs.length && (
                <div className="text-center py-8">
                  <Activity className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No activity logs found</h3>
                  <p className="text-gray-600">No activity matches your current search criteria.</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Export Section */}
        <Card className="bg-white shadow-md border border-gray-200 mt-6">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileText className="w-5 h-5" />
              <span>Export All Logs</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <h3 className="font-medium text-gray-900">Complete System Log Export</h3>
                <p className="text-sm text-gray-600">Download a comprehensive Excel file with all system activity logs, user information, and access levels.</p>
              </div>
              <Button onClick={handleExportLogs} className="ml-4">
                <Download className="w-4 h-4 mr-2" />
                Download Excel File
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}