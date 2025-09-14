import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Search, Download, Plus, Eye, Edit, Users, Shield, Mail, Phone, Calendar, Settings, MoreHorizontal, UserX, UserCheck, Trash2 } from "lucide-react";
import PageHeader from "@/components/page-header";
import { authenticatedApiRequest } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function UsersPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // For demo purposes, using a hardcoded company ID
  const companyId = "68f11a7e-27ab-40eb-826e-3ce6d84874de";
  
  const { data: users, isLoading } = useQuery({
    queryKey: ['/api/companies', companyId, 'users', searchQuery],
    queryFn: async () => {
      const searchParam = searchQuery ? `?search=${encodeURIComponent(searchQuery)}` : '';
      const response = await authenticatedApiRequest('GET', `/api/companies/${companyId}/users${searchParam}`);
      return response.json();
    },
    enabled: !!companyId,
  });

  // Toggle user active status mutation
  const toggleUserStatusMutation = useMutation({
    mutationFn: async (data: { userId: string; isActive: boolean }) => {
      await apiRequest('PATCH', `/api/users/${data.userId}/status`, { isActive: data.isActive });
    },
    onSuccess: (_, variables) => {
      toast({
        title: `User ${variables.isActive ? 'activated' : 'deactivated'} successfully`,
        description: `The user has been ${variables.isActive ? 'activated' : 'deactivated'}.`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/companies', companyId, 'users'] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to update user status",
        description: error.message || "There was an error updating the user status. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Delete user mutation
  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      await apiRequest('DELETE', `/api/users/${userId}`);
    },
    onSuccess: () => {
      toast({
        title: "User deleted successfully",
        description: "The user has been removed from the system.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/companies', companyId, 'users'] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to delete user",
        description: error.message || "There was an error deleting the user. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Filter users based on search and filters
  const filteredUsers = users?.filter((user: any) => {
    const matchesRole = !roleFilter || roleFilter === 'all' || user.role.name === roleFilter;
    const matchesStatus = !statusFilter || statusFilter === 'all' || 
      (statusFilter === 'active' && user.isActive) || 
      (statusFilter === 'inactive' && !user.isActive);
    const matchesSearch = !searchQuery || 
      user.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.role.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesRole && matchesStatus && matchesSearch;
  }) || [];

  // Helper function to format role names for display
  function formatRoleName(role: { name: string; level: number }) {
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
  }

  // Helper function to get access level based on role
  function getAccessLevel(role: { name: string; level: number }) {
    switch (role.level) {
      case 1:
        return "Full Access";
      case 2:
        return "Full Access";
      case 3:
        return "Manager Access";
      case 4:
        return "Standard Access";
      default:
        return "Standard Access";
    }
  }

  // Helper function to format last login
  function formatLastLogin(lastLoginAt: string | null) {
    if (!lastLoginAt) return 'Never';
    return new Date(lastLoginAt).toLocaleDateString();
  }

  // Handler functions
  const handleToggleUserStatus = (userId: string, currentStatus: boolean) => {
    toggleUserStatusMutation.mutate({ userId, isActive: !currentStatus });
  };

  const handleDeleteUser = (userId: string) => {
    deleteUserMutation.mutate(userId);
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'Superuser':
        return 'bg-red-100 text-red-800';
      case 'Admin':
        return 'bg-purple-100 text-purple-800';
      case 'Manager':
        return 'bg-blue-100 text-blue-800';
      case 'Employee':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
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
    <div className="flex flex-col h-full">
      <PageHeader 
        title="User Management"
        description="Manage user accounts, roles, and permissions"
      >
        <Button variant="outline">
          <Download className="w-4 h-4 mr-2" />
          Export User List
        </Button>
        <Button variant="outline">
          <Settings className="w-4 h-4 mr-2" />
          Bulk Actions
        </Button>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Add New User
        </Button>
      </PageHeader>

      {/* Main Content */}
      <main className="flex-1 p-6">
        <Card className="bg-white shadow-md border border-gray-200">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="w-5 h-5" />
              <span>System Users ({users.length})</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Search and Filters */}
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search users by name, email, or role..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="All Roles" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="superuser">Superuser</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="employee">Employee</SelectItem>
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

            {/* Users Table */}
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Access Level</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Last Login</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user: any) => (
                    <TableRow key={user.id} className="hover:bg-gray-50">
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                            <Users className="w-5 h-5 text-gray-600" />
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">
                              {user.firstName} {user.lastName}
                            </div>
                            <div className="text-sm text-gray-500 flex items-center">
                              <Mail className="w-3 h-3 mr-1" />
                              {user.email}
                            </div>
                            {user.employee?.phone && (
                              <div className="text-sm text-gray-500 flex items-center">
                                <Phone className="w-3 h-3 mr-1" />
                                {user.employee.phone}
                              </div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getRoleColor(formatRoleName(user.role))}>
                          <Shield className="w-3 h-3 mr-1" />
                          {formatRoleName(user.role)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-gray-900">
                        {getAccessLevel(user.role)}
                      </TableCell>
                      <TableCell className="text-gray-900">
                        {user.employment?.department || 'N/A'}
                      </TableCell>
                      <TableCell className="text-gray-900 flex items-center">
                        <Calendar className="w-3 h-3 mr-1 text-gray-400" />
                        {formatLastLogin(user.lastLoginAt)}
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(user.isActive ? 'active' : 'inactive')}>
                          {user.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" data-testid={`button-actions-${user.id}`}>
                              <span className="sr-only">Open menu</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem data-testid={`button-view-${user.id}`}>
                              <Eye className="mr-2 h-4 w-4" />
                              View Profile
                            </DropdownMenuItem>
                            <DropdownMenuItem data-testid={`button-edit-${user.id}`}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit User
                            </DropdownMenuItem>
                            <DropdownMenuItem data-testid={`button-settings-${user.id}`}>
                              <Settings className="mr-2 h-4 w-4" />
                              User Settings
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={() => handleToggleUserStatus(user.id, user.isActive)}
                              data-testid={`button-${user.isActive ? 'deactivate' : 'activate'}-${user.id}`}
                            >
                              {user.isActive ? (
                                <>
                                  <UserX className="mr-2 h-4 w-4" />
                                  Deactivate User
                                </>
                              ) : (
                                <>
                                  <UserCheck className="mr-2 h-4 w-4" />
                                  Activate User
                                </>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <DropdownMenuItem 
                                  className="text-red-600 focus:text-red-600"
                                  onSelect={(e) => e.preventDefault()}
                                  data-testid={`button-delete-${user.id}`}
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete User
                                </DropdownMenuItem>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete User</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete {user.firstName} {user.lastName}? 
                                    This action cannot be undone and will remove the user account and all associated data from the system.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDeleteUser(user.id)}
                                    className="bg-red-600 hover:bg-red-700"
                                    disabled={deleteUserMutation.isPending}
                                    data-testid={`button-confirm-delete-${user.id}`}
                                  >
                                    {deleteUserMutation.isPending ? (
                                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                                    ) : null}
                                    Delete User
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              
              {!filteredUsers.length && (
                <div className="text-center py-8">
                  <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No users found</h3>
                  <p className="text-gray-600">No users match your current search criteria.</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-6">
          <Card className="bg-white shadow-md border border-gray-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Users</p>
                  <p className="text-2xl font-semibold text-gray-900">{users?.length || 0}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-blue-600" />
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
                    {users?.filter((u: any) => u.isActive).length || 0}
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <Shield className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white shadow-md border border-gray-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Admins</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {users?.filter((u: any) => u.role.level <= 2).length || 0}
                  </p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Settings className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white shadow-md border border-gray-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Managers</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {users?.filter((u: any) => u.role.level === 3).length || 0}
                  </p>
                </div>
                <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}