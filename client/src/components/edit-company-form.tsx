import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { Edit, Plus, Trash2, Building } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

// Schemas
const companyDetailsSchema = z.object({
  name: z.string().min(1, "Company name is required").max(100, "Company name too long"),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email("Invalid email").optional(),
  website: z.string().optional(),
  industry: z.string().optional(),
  size: z.string().optional(),
  companyNumber: z.string().optional(),
});

const departmentSchema = z.object({
  name: z.string().min(1, "Department name is required").max(100, "Department name too long"),
  description: z.string().optional(),
  managerId: z.string().uuid().optional(),
  isActive: z.boolean().default(true),
});

type CompanyDetailsFormData = z.infer<typeof companyDetailsSchema>;
type DepartmentFormData = z.infer<typeof departmentSchema>;

interface EditCompanyFormProps {
  companyId: string | undefined;
  trigger?: React.ReactNode;
  onSuccess?: () => void;
}

interface CompanyDetails {
  id: string;
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  industry?: string;
  size?: string;
  companyNumber?: string;
  settings?: any;
}

interface Department {
  id: string;
  companyId: string;
  name: string;
  description?: string;
  managerId?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export function EditCompanyForm({ companyId, trigger, onSuccess }: EditCompanyFormProps) {
  const [open, setOpen] = useState(false);
  const [showDepartmentForm, setShowDepartmentForm] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch company details
  const { data: companyDetails, isLoading: loadingCompany } = useQuery<CompanyDetails>({
    queryKey: ["/api/companies", companyId, "details"],
    queryFn: async () => {
      if (!companyId) throw new Error("Company ID is required");
      const response = await apiRequest("GET", `/api/companies/${companyId}/details`);
      return response.json();
    },
    enabled: open && !!companyId,
  });

  // Fetch departments
  const { data: departments = [], isLoading: loadingDepartments } = useQuery<Department[]>({
    queryKey: ["/api/companies", companyId, "departments"],
    queryFn: async () => {
      if (!companyId) throw new Error("Company ID is required");
      const response = await apiRequest("GET", `/api/companies/${companyId}/departments`);
      return response.json();
    },
    enabled: open && !!companyId,
  });

  // Company form
  const companyForm = useForm<CompanyDetailsFormData>({
    resolver: zodResolver(companyDetailsSchema),
    defaultValues: {
      name: "",
      address: "",
      phone: "",
      email: "",
      website: "",
      industry: "",
      size: "",
      companyNumber: "",
    },
  });

  // Department form
  const departmentForm = useForm<DepartmentFormData>({
    resolver: zodResolver(departmentSchema),
    defaultValues: {
      name: "",
      description: "",
      managerId: undefined,
      isActive: true,
    },
  });

  // Update form when data loads
  React.useEffect(() => {
    if (companyDetails) {
      companyForm.reset({
        name: companyDetails.name || "",
        address: companyDetails.address || "",
        phone: companyDetails.phone || "",
        email: companyDetails.email || "",
        website: companyDetails.website || "",
        industry: companyDetails.industry || "",
        size: companyDetails.size || "",
        companyNumber: companyDetails.companyNumber || "",
      });
    }
  }, [companyDetails, companyForm]);

  // Update company mutation
  const updateCompanyMutation = useMutation({
    mutationFn: (data: CompanyDetailsFormData) =>
      apiRequest("PUT", `/api/companies/${companyId}/details`, data),
    onSuccess: () => {
      toast({
        title: "Company Updated",
        description: "Company details have been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/companies", companyId, "details"] });
      if (onSuccess) onSuccess();
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update company details.",
        variant: "destructive",
      });
    },
  });

  // Create department mutation
  const createDepartmentMutation = useMutation({
    mutationFn: (data: DepartmentFormData) =>
      apiRequest("POST", `/api/companies/${companyId}/departments`, data),
    onSuccess: () => {
      toast({
        title: "Department Created",
        description: "Department has been created successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/companies", companyId, "departments"] });
      setShowDepartmentForm(false);
      departmentForm.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Creation Failed",
        description: error.message || "Failed to create department.",
        variant: "destructive",
      });
    },
  });

  // Update department mutation
  const updateDepartmentMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: DepartmentFormData }) =>
      apiRequest("PUT", `/api/departments/${id}`, data),
    onSuccess: () => {
      toast({
        title: "Department Updated",
        description: "Department has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/companies", companyId, "departments"] });
      setEditingDepartment(null);
      setShowDepartmentForm(false);
      departmentForm.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update department.",
        variant: "destructive",
      });
    },
  });

  // Delete department mutation
  const deleteDepartmentMutation = useMutation({
    mutationFn: (id: string) =>
      apiRequest("DELETE", `/api/departments/${id}`),
    onSuccess: () => {
      toast({
        title: "Department Deleted",
        description: "Department has been deleted successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/companies", companyId, "departments"] });
    },
    onError: (error: any) => {
      toast({
        title: "Delete Failed",
        description: error.message || "Failed to delete department.",
        variant: "destructive",
      });
    },
  });

  const handleCompanySubmit = (data: CompanyDetailsFormData) => {
    updateCompanyMutation.mutate(data);
  };

  const handleDepartmentSubmit = (data: DepartmentFormData) => {
    if (!companyId) {
      toast({
        title: "Error",
        description: "Company ID is missing. Please refresh the page.",
        variant: "destructive",
      });
      return;
    }
    
    // Normalize empty managerId to undefined
    const normalizedData = {
      ...data,
      managerId: data.managerId || undefined,
    };
    
    if (editingDepartment) {
      updateDepartmentMutation.mutate({ id: editingDepartment.id, data: normalizedData });
    } else {
      createDepartmentMutation.mutate(normalizedData);
    }
  };

  const handleEditDepartment = (department: Department) => {
    setEditingDepartment(department);
    departmentForm.reset({
      name: department.name,
      description: department.description || "",
      managerId: department.managerId || undefined,
      isActive: department.isActive,
    });
    setShowDepartmentForm(true);
  };

  const handleDeleteDepartment = (departmentId: string) => {
    deleteDepartmentMutation.mutate(departmentId);
  };

  const handleAddDepartment = () => {
    setEditingDepartment(null);
    departmentForm.reset({
      name: "",
      description: "",
      managerId: undefined,
      isActive: true,
    });
    setShowDepartmentForm(true);
  };

  // Don't render if companyId is not available
  if (!companyId) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild data-testid="trigger-edit-company">
        {trigger || (
          <Button variant="outline" size="sm">
            <Edit className="h-4 w-4 mr-2" />
            Edit Company
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" data-testid="modal-edit-company">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building className="h-5 w-5" />
            Edit Company Details
          </DialogTitle>
          <DialogDescription>
            Update company information and manage departments
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Company Details Section */}
          <Card>
            <CardHeader>
              <CardTitle>Company Information</CardTitle>
              <CardDescription>
                Update basic company details and settings
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingCompany ? (
                <div className="flex items-center justify-center p-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" />
                </div>
              ) : (
                <Form {...companyForm}>
                  <form onSubmit={companyForm.handleSubmit(handleCompanySubmit)} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={companyForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Company Name *</FormLabel>
                            <FormControl>
                              <Input {...field} data-testid="input-company-name" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={companyForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input type="email" {...field} data-testid="input-company-email" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={companyForm.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Phone</FormLabel>
                            <FormControl>
                              <Input {...field} data-testid="input-company-phone" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={companyForm.control}
                        name="website"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Website</FormLabel>
                            <FormControl>
                              <Input {...field} data-testid="input-company-website" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={companyForm.control}
                        name="industry"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Industry</FormLabel>
                            <FormControl>
                              <Select onValueChange={field.onChange} value={field.value} data-testid="select-company-industry">
                                <SelectTrigger>
                                  <SelectValue placeholder="Select industry" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="technology">Technology</SelectItem>
                                  <SelectItem value="healthcare">Healthcare</SelectItem>
                                  <SelectItem value="finance">Finance</SelectItem>
                                  <SelectItem value="education">Education</SelectItem>
                                  <SelectItem value="retail">Retail</SelectItem>
                                  <SelectItem value="manufacturing">Manufacturing</SelectItem>
                                  <SelectItem value="consulting">Consulting</SelectItem>
                                  <SelectItem value="other">Other</SelectItem>
                                </SelectContent>
                              </Select>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={companyForm.control}
                        name="size"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Company Size</FormLabel>
                            <FormControl>
                              <Select onValueChange={field.onChange} value={field.value} data-testid="select-company-size">
                                <SelectTrigger>
                                  <SelectValue placeholder="Select size" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="startup">Startup (1-10)</SelectItem>
                                  <SelectItem value="small">Small (11-50)</SelectItem>
                                  <SelectItem value="medium">Medium (51-200)</SelectItem>
                                  <SelectItem value="large">Large (201-1000)</SelectItem>
                                  <SelectItem value="enterprise">Enterprise (1000+)</SelectItem>
                                </SelectContent>
                              </Select>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={companyForm.control}
                        name="companyNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Company Number</FormLabel>
                            <FormControl>
                              <Input {...field} data-testid="input-company-number" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={companyForm.control}
                      name="address"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Address</FormLabel>
                          <FormControl>
                            <Textarea {...field} data-testid="textarea-company-address" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex justify-end">
                      <Button 
                        type="submit" 
                        disabled={updateCompanyMutation.isPending}
                        data-testid="button-update-company"
                      >
                        {updateCompanyMutation.isPending ? "Updating..." : "Update Company"}
                      </Button>
                    </div>
                  </form>
                </Form>
              )}
            </CardContent>
          </Card>

          <Separator />

          {/* Departments Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Departments
                <Button 
                  onClick={handleAddDepartment} 
                  size="sm"
                  data-testid="button-add-department"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Department
                </Button>
              </CardTitle>
              <CardDescription>
                Manage company departments and their settings
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingDepartments ? (
                <div className="flex items-center justify-center p-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" />
                </div>
              ) : departments.length > 0 ? (
                <div className="space-y-3">
                  {departments.map((department) => (
                    <div
                      key={department.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                      data-testid={`department-item-${department.id}`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{department.name}</span>
                          <Badge variant={department.isActive ? "default" : "secondary"}>
                            {department.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                        {department.description && (
                          <p className="text-sm text-gray-600">{department.description}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditDepartment(department)}
                          data-testid={`button-edit-department-${department.id}`}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-red-600 hover:text-red-700"
                              data-testid={`button-delete-department-${department.id}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Department</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete the "{department.name}" department?
                                This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteDepartment(department.id)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-gray-500">
                  <p>No departments created yet.</p>
                  <p className="text-sm">Click "Add Department" to create the first one.</p>
                </div>
              )}

              {/* Department Form Modal */}
              {showDepartmentForm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                  <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
                    <h3 className="text-lg font-semibold mb-4">
                      {editingDepartment ? "Edit Department" : "Add Department"}
                    </h3>
                    <Form {...departmentForm}>
                      <form onSubmit={departmentForm.handleSubmit(handleDepartmentSubmit)} className="space-y-4">
                        <FormField
                          control={departmentForm.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Department Name *</FormLabel>
                              <FormControl>
                                <Input {...field} data-testid="input-department-name" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={departmentForm.control}
                          name="description"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Description</FormLabel>
                              <FormControl>
                                <Textarea {...field} data-testid="textarea-department-description" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className="flex justify-end gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                              setShowDepartmentForm(false);
                              setEditingDepartment(null);
                              departmentForm.reset();
                            }}
                            data-testid="button-cancel-department"
                          >
                            Cancel
                          </Button>
                          <Button
                            type="submit"
                            disabled={createDepartmentMutation.isPending || updateDepartmentMutation.isPending}
                            data-testid="button-save-department"
                          >
                            {createDepartmentMutation.isPending || updateDepartmentMutation.isPending
                              ? "Saving..."
                              : editingDepartment
                              ? "Update"
                              : "Create"}
                          </Button>
                        </div>
                      </form>
                    </Form>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}