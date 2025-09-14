import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { ArrowLeft, Save, User, Mail, Shield, Building } from "lucide-react";
import PageHeader from "@/components/page-header";
import Breadcrumb from "@/components/breadcrumb";
import { authenticatedApiRequest, useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

const editUserSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Please enter a valid email address"),
  roleId: z.string().min(1, "Role is required"),
  isActive: z.boolean(),
});

type EditUserFormData = z.infer<typeof editUserSchema>;

export default function EditUserPage() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Get company ID from authenticated user
  const companyId = user?.company?.id;

  const form = useForm<EditUserFormData>({
    resolver: zodResolver(editUserSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      roleId: "",
      isActive: true,
    },
  });

  // Fetch user details
  const { data: targetUser, isLoading: isLoadingUser } = useQuery({
    queryKey: ['/api/users', id],
    queryFn: async () => {
      const response = await authenticatedApiRequest('GET', `/api/users/${id}`);
      return response.json();
    },
    enabled: !!id,
  });

  // Fetch available roles
  const { data: roles, isLoading: isLoadingRoles } = useQuery({
    queryKey: ['/api/companies', companyId, 'roles'],
    queryFn: async () => {
      const response = await authenticatedApiRequest('GET', `/api/companies/${companyId}/roles`);
      return response.json();
    },
    enabled: !!companyId,
  });

  // Update user mutation
  const updateUserMutation = useMutation({
    mutationFn: async (data: EditUserFormData) => {
      await apiRequest('PUT', `/api/users/${id}`, data);
    },
    onSuccess: () => {
      toast({
        title: "User updated successfully",
        description: "The user's information has been updated.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/companies', companyId, 'users'] });
      setLocation("/users");
    },
    onError: (error: any) => {
      toast({
        title: "Failed to update user",
        description: error.message || "There was an error updating the user. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Populate form when user data loads
  useEffect(() => {
    if (targetUser) {
      form.reset({
        firstName: targetUser.firstName || "",
        lastName: targetUser.lastName || "",
        email: targetUser.email || "",
        roleId: targetUser.role?.id || "",
        isActive: targetUser.isActive ?? true,
      });
    }
  }, [targetUser, form]);

  const onSubmit = (data: EditUserFormData) => {
    updateUserMutation.mutate(data);
  };

  const handleCancel = () => {
    setLocation("/users");
  };

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

  if (isLoadingUser || isLoadingRoles) {
    return (
      <div className="flex flex-col h-full">
        <Breadcrumb 
          items={[
            { label: "Users", href: "/users", icon: User },
            { label: "Edit User" }
          ]}
        />
        <div className="flex-1 p-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-64 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-96 mb-8"></div>
            <div className="h-96 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!targetUser) {
    return (
      <div className="flex flex-col h-full">
        <Breadcrumb 
          items={[
            { label: "Users", href: "/users", icon: User },
            { label: "Edit User" }
          ]}
        />
        <div className="flex-1 p-6">
          <Card className="bg-white shadow-md border border-gray-200">
            <CardContent className="p-6">
              <div className="text-center">
                <User className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">User not found</h3>
                <p className="text-gray-600 mb-4">The user you're trying to edit could not be found.</p>
                <Button onClick={handleCancel}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Users
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <Breadcrumb 
        items={[
          { label: "Users", href: "/users", icon: User },
          { label: "Edit User" }
        ]}
      />
      <PageHeader 
        title={`Edit User: ${targetUser.firstName} ${targetUser.lastName}`}
        description="Update user account information and permissions"
      >
        <Button variant="outline" onClick={handleCancel}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Users
        </Button>
      </PageHeader>

      {/* Main Content */}
      <main className="flex-1 p-6">
        <div className="max-w-4xl mx-auto">
          <Card className="bg-white shadow-md border border-gray-200">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <User className="w-5 h-5" />
                <span>User Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Personal Information */}
                    <div className="space-y-4">
                      <div className="flex items-center space-x-2 mb-4">
                        <User className="w-4 h-4 text-gray-500" />
                        <h3 className="text-lg font-medium text-gray-900">Personal Information</h3>
                      </div>
                      
                      <FormField
                        control={form.control}
                        name="firstName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>First Name</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Enter first name"
                                {...field}
                                data-testid="input-first-name"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="lastName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Last Name</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Enter last name"
                                {...field}
                                data-testid="input-last-name"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email Address</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Mail className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                                <Input
                                  type="email"
                                  placeholder="Enter email address"
                                  className="pl-10"
                                  {...field}
                                  data-testid="input-email"
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Account Settings */}
                    <div className="space-y-4">
                      <div className="flex items-center space-x-2 mb-4">
                        <Shield className="w-4 h-4 text-gray-500" />
                        <h3 className="text-lg font-medium text-gray-900">Account Settings</h3>
                      </div>

                      <FormField
                        control={form.control}
                        name="roleId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Role</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-role">
                                  <SelectValue placeholder="Select a role" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {roles?.map((role: any) => (
                                  <SelectItem key={role.id} value={role.id}>
                                    <div className="flex items-center space-x-2">
                                      <Shield className="w-4 h-4" />
                                      <span>{formatRoleName(role)}</span>
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="isActive"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Account Status</FormLabel>
                            <Select 
                              onValueChange={(value) => field.onChange(value === "true")} 
                              value={field.value ? "true" : "false"}
                            >
                              <FormControl>
                                <SelectTrigger data-testid="select-status">
                                  <SelectValue placeholder="Select account status" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="true">
                                  <div className="flex items-center space-x-2">
                                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                    <span>Active</span>
                                  </div>
                                </SelectItem>
                                <SelectItem value="false">
                                  <div className="flex items-center space-x-2">
                                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                                    <span>Inactive</span>
                                  </div>
                                </SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Current Company Display */}
                      <div>
                        <FormLabel>Company</FormLabel>
                        <div className="mt-1 p-3 bg-gray-50 border border-gray-200 rounded-md">
                          <div className="flex items-center space-x-2 text-sm text-gray-600">
                            <Building className="w-4 h-4" />
                            <span>{user?.company?.name || 'TechCorp Inc.'}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-end space-x-4 pt-6 border-t">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={handleCancel}
                      data-testid="button-cancel"
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={updateUserMutation.isPending}
                      data-testid="button-save"
                    >
                      {updateUserMutation.isPending ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      ) : (
                        <Save className="w-4 h-4 mr-2" />
                      )}
                      Save Changes
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}