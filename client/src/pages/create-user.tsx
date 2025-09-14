import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { ArrowLeft, UserPlus, Save, Building, Eye, EyeOff } from "lucide-react";
import PageHeader from "@/components/page-header";
import Breadcrumb from "@/components/breadcrumb";
import { useAuth, authenticatedApiRequest } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

// Form validation schema
const createUserSchema = z.object({
  firstName: z.string().min(1, "First name is required").max(50, "First name must be less than 50 characters"),
  lastName: z.string().min(1, "Last name is required").max(50, "Last name must be less than 50 characters"),
  email: z.string().email("Please enter a valid email address"),
  password: z.preprocess(
    (val) => val === "" ? undefined : val,
    z.string().min(8, "Password must be at least 8 characters").optional()
  ),
  confirmPassword: z.preprocess(
    (val) => val === "" ? undefined : val,
    z.string().min(8, "Password must be at least 8 characters").optional()
  ),
  roleId: z.string().uuid("Please select a valid role"),
  departmentId: z.preprocess(
    (val) => val === "none" ? undefined : val,
    z.string().uuid("Please select a valid department").optional()
  ),
  isActive: z.boolean(),
}).refine((data) => {
  // Only validate password match if both passwords are provided
  if (data.password && data.confirmPassword) {
    return data.password === data.confirmPassword;
  }
  return true;
}, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type CreateUserForm = z.infer<typeof createUserSchema>;

export default function CreateUserPage() {
  const [, setLocation] = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  // Get company ID from authenticated user
  const companyId = user?.company?.id;

  const form = useForm<CreateUserForm>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      confirmPassword: "",
      roleId: "",
      departmentId: "none",
      isActive: true,
    },
  });

  // Fetch available roles
  const { data: roles, isLoading: rolesLoading } = useQuery({
    queryKey: ['/api/companies', companyId, 'roles'],
    queryFn: async () => {
      const response = await authenticatedApiRequest('GET', `/api/companies/${companyId}/roles`);
      return response.json();
    },
    enabled: !!companyId,
  });

  // Fetch available departments
  const { data: departments, isLoading: departmentsLoading } = useQuery({
    queryKey: ['/api/companies', companyId, 'departments'],
    queryFn: async () => {
      const response = await authenticatedApiRequest('GET', `/api/companies/${companyId}/departments`);
      return response.json();
    },
    enabled: !!companyId,
  });

  // Create user mutation
  const createUserMutation = useMutation({
    mutationFn: async (data: CreateUserForm) => {
      const response = await authenticatedApiRequest('POST', `/api/companies/${companyId}/users`, {
        ...data,
        companyId,
      });
      return response.json();
    },
    onSuccess: (newUser) => {
      toast({
        title: "User created successfully",
        description: `${newUser.firstName} ${newUser.lastName} has been added to the system.`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/companies', companyId, 'users'] });
      setLocation('/users');
    },
    onError: (error: any) => {
      toast({
        title: "Failed to create user",
        description: error.message || "There was an error creating the user. Please try again.",
        variant: "destructive",
      });
    }
  });

  const onSubmit = (data: CreateUserForm) => {
    createUserMutation.mutate(data);
  };

  const handleCancel = () => {
    setLocation('/users');
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

  // Filter roles based on current user's level
  const availableRoles = roles?.filter((role: any) => {
    if (!user?.role) return false;
    // Users can only assign roles at their level or lower
    return role.level >= user.role.level;
  }) || [];

  return (
    <div className="min-h-screen bg-gray-50">
      <Breadcrumb 
        items={[
          { label: "Users", href: "/users" },
          { label: "Create User", icon: UserPlus }
        ]}
      />
      <PageHeader
        title="Create New User"
        description="Add a new user to your organization"
      />
      
      <main className="max-w-7xl mx-auto p-6">
        {/* Back Navigation */}
        <div className="mb-6">
          <Button 
            variant="outline" 
            onClick={handleCancel}
            data-testid="button-back"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Users
          </Button>
        </div>

        <div className="max-w-2xl mx-auto">
          <Card className="bg-white shadow-md border border-gray-200">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <UserPlus className="w-5 h-5" />
                <span>New User Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  {/* Personal Information */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium text-gray-900">Personal Information</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="firstName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>First Name</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Enter first name"
                                data-testid="input-firstName"
                                {...field}
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
                                data-testid="input-lastName"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email Address</FormLabel>
                          <FormControl>
                            <Input 
                              type="email"
                              placeholder="Enter email address"
                              data-testid="input-email"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input 
                                type={showPassword ? "text" : "password"}
                                placeholder="Enter password (optional - will generate random if empty)"
                                data-testid="input-password"
                                {...field}
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                onClick={() => setShowPassword(!showPassword)}
                                data-testid="toggle-password-visibility"
                              >
                                {showPassword ? (
                                  <EyeOff className="h-4 w-4 text-gray-400" />
                                ) : (
                                  <Eye className="h-4 w-4 text-gray-400" />
                                )}
                              </Button>
                            </div>
                          </FormControl>
                          <FormMessage />
                          <div className="text-xs text-gray-500">
                            Leave empty to auto-generate a secure random password
                          </div>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Confirm Password</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input 
                                type={showConfirmPassword ? "text" : "password"}
                                placeholder="Confirm password (optional if password is empty)"
                                data-testid="input-confirm-password"
                                {...field}
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                data-testid="toggle-confirm-password-visibility"
                              >
                                {showConfirmPassword ? (
                                  <EyeOff className="h-4 w-4 text-gray-400" />
                                ) : (
                                  <Eye className="h-4 w-4 text-gray-400" />
                                )}
                              </Button>
                            </div>
                          </FormControl>
                          <FormMessage />
                          <div className="text-xs text-gray-500">
                            Must match password if provided
                          </div>
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Role and Access Information */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium text-gray-900">Role & Access</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="roleId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Role</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                              disabled={rolesLoading}
                            >
                              <FormControl>
                                <SelectTrigger data-testid="select-role">
                                  <SelectValue placeholder="Select a role" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {availableRoles.map((role: any) => (
                                  <SelectItem key={role.id} value={role.id}>
                                    {formatRoleName(role)}
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
                              defaultValue={field.value ? "true" : "false"}
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
                    </div>
                  </div>

                  {/* Department Assignment */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium text-gray-900">Department Assignment</h3>
                    
                    <FormField
                      control={form.control}
                      name="departmentId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Department</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            disabled={departmentsLoading}
                          >
                            <FormControl>
                              <SelectTrigger data-testid="select-department">
                                <SelectValue placeholder="Select a department (optional)" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="none">
                                <div className="flex items-center space-x-2">
                                  <span className="text-gray-500">No department</span>
                                </div>
                              </SelectItem>
                              {departments?.filter((dept: any) => dept.isActive).map((department: any) => (
                                <SelectItem key={department.id} value={department.id}>
                                  <div className="flex items-center space-x-2">
                                    <span>{department.name}</span>
                                    {department.description && (
                                      <span className="text-xs text-gray-500">- {department.description}</span>
                                    )}
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                          <div className="text-xs text-gray-500">
                            Department assignment is optional and can be changed later
                          </div>
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Company Information (Read-only) */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium text-gray-900">Company Assignment</h3>
                    <div>
                      <FormLabel>Company</FormLabel>
                      <div className="mt-1 p-3 bg-gray-50 border border-gray-200 rounded-md">
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <Building className="w-4 h-4" />
                          <span>{user?.company?.name || 'TechCorp Inc.'}</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          New users will be automatically assigned to your company
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Default Password Notice */}
                  <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                    <h4 className="text-sm font-medium text-blue-900">Default Password</h4>
                    <p className="text-sm text-blue-800 mt-1">
                      The user will be created with a temporary password. They will be required to change it upon first login.
                    </p>
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
                      disabled={createUserMutation.isPending}
                      data-testid="button-create"
                    >
                      {createUserMutation.isPending ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      ) : (
                        <Save className="w-4 h-4 mr-2" />
                      )}
                      Create User
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