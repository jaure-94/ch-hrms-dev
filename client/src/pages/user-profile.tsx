import { useQuery } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, User, Mail, Phone, Calendar, Building, Shield, Clock, UserCheck, UserX } from "lucide-react";
import PageHeader from "@/components/page-header";
import { authenticatedApiRequest } from "@/lib/auth";

export default function UserProfilePage() {
  const [match, params] = useRoute("/users/:id/profile");
  const userId = params?.id;

  const { data: user, isLoading, error } = useQuery({
    queryKey: ['/api/users', userId],
    queryFn: async () => {
      const response = await authenticatedApiRequest('GET', `/api/users/${userId}`);
      return response.json();
    },
    enabled: !!userId,
  });

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

  // Helper function to format dates
  function formatDate(dateString: string | null) {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString('en-GB', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <PageHeader
          title="User Profile"
          description="Loading user details..."
        />
        <main className="max-w-7xl mx-auto p-6">
          <div className="animate-pulse">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/3"></div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <PageHeader
          title="User Profile"
          description="User not found"
        />
        <main className="max-w-7xl mx-auto p-6">
          <Card className="bg-white shadow-md border border-gray-200">
            <CardContent className="p-6 text-center">
              <User className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">User Not Found</h3>
              <p className="text-gray-600">The user you're looking for doesn't exist or you don't have permission to view it.</p>
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => window.history.back()}
                data-testid="button-back"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Go Back
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader
        title="User Profile"
        description="View detailed information about the user account"
      />
      
      <main className="max-w-7xl mx-auto p-6">
        {/* Back Navigation */}
        <div className="mb-6">
          <Button 
            variant="outline" 
            onClick={() => window.history.back()}
            data-testid="button-back"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Users
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Profile Information */}
          <div className="lg:col-span-2 space-y-6">
            {/* Personal Information Card */}
            <Card className="bg-white shadow-md border border-gray-200">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <User className="w-5 h-5" />
                  <span>Personal Information</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Profile Header */}
                <div className="flex items-start space-x-4">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                    <User className="w-8 h-8 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold text-gray-900">
                      {user.firstName} {user.lastName}
                    </h2>
                    <p className="text-gray-600">{user.email}</p>
                    <div className="flex items-center space-x-3 mt-2">
                      <Badge 
                        variant={user.isActive ? "default" : "secondary"}
                        className={user.isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}
                      >
                        {user.isActive ? (
                          <>
                            <UserCheck className="w-3 h-3 mr-1" />
                            Active
                          </>
                        ) : (
                          <>
                            <UserX className="w-3 h-3 mr-1" />
                            Inactive
                          </>
                        )}
                      </Badge>
                      <Badge variant="outline">
                        <Shield className="w-3 h-3 mr-1" />
                        {formatRoleName(user.role)}
                      </Badge>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Contact Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="font-semibold text-gray-900">Contact Details</h3>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-3">
                        <Mail className="w-4 h-4 text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-600">Email Address</p>
                          <p className="font-medium">{user.email}</p>
                        </div>
                      </div>
                      {user.phone && (
                        <div className="flex items-center space-x-3">
                          <Phone className="w-4 h-4 text-gray-400" />
                          <div>
                            <p className="text-sm text-gray-600">Phone Number</p>
                            <p className="font-medium">{user.phone}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-semibold text-gray-900">Company Information</h3>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-3">
                        <Building className="w-4 h-4 text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-600">Company</p>
                          <p className="font-medium">{user.company?.name || 'Not specified'}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Role & Permissions Card */}
            <Card className="bg-white shadow-md border border-gray-200">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Shield className="w-5 h-5" />
                  <span>Role & Permissions</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Role Information</h4>
                    <div className="space-y-2">
                      <div>
                        <p className="text-sm text-gray-600">Role</p>
                        <p className="font-medium">{formatRoleName(user.role)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Level</p>
                        <p className="font-medium">Level {user.role.level}</p>
                      </div>
                      {user.role.description && (
                        <div>
                          <p className="text-sm text-gray-600">Description</p>
                          <p className="font-medium">{user.role.description}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Access Level</h4>
                    <div className="text-sm text-gray-600">
                      {user.role.level === 1 && (
                        <p>Full system access with all administrative privileges</p>
                      )}
                      {user.role.level === 2 && (
                        <p>Company administration with user and employee management</p>
                      )}
                      {user.role.level === 3 && (
                        <p>Department management and employee oversight</p>
                      )}
                      {user.role.level === 4 && (
                        <p>Standard employee access to personal information</p>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar Information */}
          <div className="space-y-6">
            {/* Account Activity Card */}
            <Card className="bg-white shadow-md border border-gray-200">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Clock className="w-5 h-5" />
                  <span>Account Activity</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600">Last Login</p>
                  <p className="font-medium">{formatDate(user.lastLoginAt)}</p>
                </div>
                <Separator />
                <div>
                  <p className="text-sm text-gray-600">Account Created</p>
                  <p className="font-medium">{formatDate(user.createdAt)}</p>
                </div>
                <Separator />
                <div>
                  <p className="text-sm text-gray-600">Last Updated</p>
                  <p className="font-medium">{formatDate(user.updatedAt)}</p>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions Card */}
            <Card className="bg-white shadow-md border border-gray-200">
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => window.location.href = `/users/${user.id}/edit`}
                  data-testid="button-edit-user"
                >
                  <User className="w-4 h-4 mr-2" />
                  Edit Profile
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => window.location.href = '/users'}
                  data-testid="button-view-all-users"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Users
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}