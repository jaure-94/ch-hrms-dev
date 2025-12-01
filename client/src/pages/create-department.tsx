import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { z } from "zod";
import { useState, useEffect } from "react";
import Breadcrumb from "@/components/breadcrumb";
import PageHeader from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { authenticatedApiRequest, useAuth } from "@/lib/auth";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ArrowLeft, Plus, Trash2, Briefcase, Sparkles, CheckCircle, Building2, XCircle } from "lucide-react";

const jobRoleFormSchema = z.object({
  title: z.string().min(2, "Title is required"),
  jobId: z
    .string()
    .min(2, "Job ID is required")
    .max(50, "Job ID must be shorter than 50 characters")
    .regex(/^[A-Za-z0-9-_]+$/, "Only letters, numbers, hyphens, underscores allowed"),
  description: z.string().optional(),
  status: z.enum(["vacant", "filled"]).default("vacant"),
});

const departmentFormSchema = z.object({
  name: z.string().min(2, "Department name is required"),
  departmentId: z
    .string()
    .max(50, "Department ID must be shorter than 50 characters")
    .regex(/^[A-Za-z0-9-_]*$/, "Only letters, numbers, hyphens, underscores allowed")
    .optional()
    .transform((val) => {
      if (!val || val.trim().length === 0) return undefined;
      return val.trim();
    }),
  description: z.string().optional().transform((val) => val && val.trim().length > 0 ? val.trim() : undefined),
  isActive: z.boolean(),
  jobRoles: z.array(jobRoleFormSchema),
});

type DepartmentFormValues = z.infer<typeof departmentFormSchema>;

export default function CreateDepartmentPage() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const companyId = user?.company?.id;
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [createdDepartmentId, setCreatedDepartmentId] = useState<string | null>(null);

  // Get return URL from query params
  const searchParams = new URLSearchParams(window.location.search);
  const returnTo = searchParams.get("returnTo") || "/company";

  const form = useForm<DepartmentFormValues>({
    resolver: zodResolver(departmentFormSchema),
    defaultValues: {
      name: "",
      departmentId: "",
      description: "",
      isActive: true,
      jobRoles: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "jobRoles",
  });

  const createMutation = useMutation({
    mutationFn: async (values: DepartmentFormValues) => {
      if (!companyId) throw new Error("Company ID is required");

      try {
        // First create the department
        // Normalize empty string to undefined for optional departmentId
        const payload = {
          name: values.name,
          departmentId: values.departmentId && values.departmentId.trim().length > 0 
            ? values.departmentId.trim() 
            : undefined,
          description: values.description || undefined,
          isActive: values.isActive,
        };

        console.log("Creating department with payload:", payload);
        
        const deptResponse = await authenticatedApiRequest("POST", `/api/companies/${companyId}/departments`, payload);

        if (!deptResponse.ok) {
          let errorData: any = {};
          try {
            const text = await deptResponse.text();
            errorData = text ? JSON.parse(text) : {};
          } catch (e) {
            errorData = { error: `HTTP ${deptResponse.status}: ${deptResponse.statusText}` };
          }
          
          console.error("Department creation failed:", {
            status: deptResponse.status,
            statusText: deptResponse.statusText,
            error: errorData,
            fullResponse: errorData
          });
          
          // Build a detailed error message
          let errorMessage = errorData.error || `Failed to create department: ${deptResponse.statusText}`;
          
          // If there are validation details, include them
          if (errorData.details && Array.isArray(errorData.details)) {
            const validationErrors = errorData.details.map((d: any) => `${d.path?.join('.') || 'field'}: ${d.message}`).join(', ');
            errorMessage = `${errorMessage}. Validation errors: ${validationErrors}`;
          } else if (errorData.details && typeof errorData.details === 'string') {
            errorMessage = `${errorMessage}. ${errorData.details}`;
          }
          
          throw new Error(errorMessage);
        }
        
        const newDepartment = await deptResponse.json();

        // Then create job roles if any
        if (values.jobRoles.length > 0) {
          try {
            await Promise.all(
              values.jobRoles.map(async (role) => {
                const res = await authenticatedApiRequest("POST", `/api/departments/${newDepartment.id}/job-roles`, {
                  title: role.title,
                  jobId: role.jobId,
                  description: role.description,
                  status: role.status || "vacant",
                });
                
                if (!res.ok) {
                  const errorData = await res.json().catch(() => ({}));
                  throw new Error(errorData.error || `Failed to create job role "${role.title}"`);
                }
                
                return res.json();
              })
            );
          } catch (jobRoleError) {
            // If job role creation fails, we still have the department created
            // But we should inform the user about the partial failure
            throw new Error(
              `Department created successfully, but failed to create some job roles: ${jobRoleError instanceof Error ? jobRoleError.message : String(jobRoleError)}`
            );
          }
        }

        return newDepartment;
      } catch (error) {
        // Re-throw with better error message
        if (error instanceof Error) {
          throw error;
        }
        throw new Error("An unexpected error occurred while creating the department");
      }
    },
    onSuccess: (data) => {
      setCreatedDepartmentId(data.id);
      // Invalidate all related queries to ensure fresh data
      queryClient.invalidateQueries({ queryKey: ["/api/companies", companyId, "departments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/companies"] });
      queryClient.invalidateQueries({ queryKey: ["/api/companies", companyId] });
      setShowSuccessModal(true);
    },
    onError: (err: Error) => {
      const errorMsg = err.message || "Something went wrong. Please try again.";
      setErrorMessage(errorMsg);
      setShowErrorModal(true);
      // Also show toast for immediate feedback
      toast({
        title: "Creation failed",
        description: errorMsg,
        variant: "destructive",
      });
    },
  });

  const breadcrumbItems = [
    { label: "Company", href: "/company" },
    { label: "Create Department" },
  ];

  const onSubmit = (values: DepartmentFormValues) => {
    createMutation.mutate(values);
  };

  const handleSuccessContinue = () => {
    setShowSuccessModal(false);
    setLocation("/company");
  };

  const handleErrorClose = () => {
    setShowErrorModal(false);
    setErrorMessage("");
  };

  if (!companyId) {
    return (
      <div className="space-y-6 px-6 py-8">
        <Button variant="ghost" size="sm" className="gap-2" onClick={() => setLocation("/company")}>
          <ArrowLeft className="w-4 h-4" />
          Back to company
        </Button>
        <Alert variant="destructive">
          <AlertDescription>Company ID is missing. Please refresh the page.</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6 px-6 pb-12" data-testid="create-department-page">
      <Breadcrumb items={breadcrumbItems} />
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <PageHeader
          title="Create Department"
          description="Add a new department and define its job roles"
          showLogo={false}
        />
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" className="gap-2" onClick={() => setLocation(returnTo)}>
            <ArrowLeft className="w-4 h-4" />
            Cancel
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Department Details</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form className="space-y-10" onSubmit={form.handleSubmit(onSubmit)}>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Department Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Human Resources" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="departmentId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Department ID</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., HR-DEPT-001" {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex flex-col space-y-3 rounded-lg border border-slate-200 p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <FormLabel>Department Status</FormLabel>
                          <p className="text-sm text-gray-600">Activate this department immediately.</p>
                        </div>
                        <FormControl>
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                      </div>
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe the goals, responsibilities, or scope of this department."
                        className="min-h-[120px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Separator />

              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Job Roles</h3>
                  <p className="text-sm text-gray-600">
                    Maintain predefined roles so onboarding can assign employees quickly.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  className="gap-2"
                  onClick={() =>
                    append({
                      title: "",
                      jobId: "",
                      description: "",
                      status: "vacant",
                    })
                  }
                  data-testid="button-add-job-role"
                >
                  <Plus className="w-4 h-4" />
                  Add role
                </Button>
              </div>

              <div className="space-y-4">
                {fields.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
                    <Sparkles className="mx-auto mb-3 h-8 w-8 text-slate-400" />
                    <p className="text-sm text-gray-600">
                      No roles yet. Add roles to define available positions for this department.
                    </p>
                  </div>
                ) : (
                  fields.map((field, index) => (
                    <Card key={field.id}>
                      <CardContent className="space-y-4 p-6">
                        <div className="flex items-center justify-between">
                          <Badge variant="secondary" className="text-xs uppercase tracking-wide text-gray-500">
                            Role {index + 1}
                          </Badge>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="text-gray-500"
                            onClick={() => remove(index)}
                            disabled={form.formState.isSubmitting}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>

                        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                          <FormField
                            control={form.control}
                            name={`jobRoles.${index}.title`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Role Title</FormLabel>
                                <FormControl>
                                  <Input placeholder="e.g., HR Manager" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name={`jobRoles.${index}.jobId`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Job ID</FormLabel>
                                <FormControl>
                                  <Input placeholder="e.g., HR-MGR-001" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name={`jobRoles.${index}.status`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Status</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value || "vacant"}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select status" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="vacant">Vacant</SelectItem>
                                    <SelectItem value="filled">Filled</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <FormField
                          control={form.control}
                          name={`jobRoles.${index}.description`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Description</FormLabel>
                              <FormControl>
                                <Textarea
                                  placeholder="Optional: share responsibilities or requirements."
                                  className="min-h-[80px]"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <Button
                  type="button"
                  variant="outline"
                  className="gap-2"
                  onClick={() => setLocation(returnTo)}
                  disabled={form.formState.isSubmitting || createMutation.isLoading}
                >
                  <ArrowLeft className="w-4 h-4" />
                  Cancel
                </Button>
                <Button type="submit" className="gap-2" disabled={form.formState.isSubmitting || createMutation.isLoading}>
                  {createMutation.isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Create Department
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Success Modal */}
      <Dialog open={showSuccessModal} onOpenChange={(open) => !open && handleSuccessContinue()}>
        <DialogContent className="sm:max-w-md" onInteractOutside={(e) => e.preventDefault()}>
          <DialogHeader className="text-center">
            <div className="mx-auto mb-4 w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <div className="relative">
                <CheckCircle className="w-8 h-8 text-green-600" />
                <Sparkles className="w-4 h-4 text-green-400 absolute -top-1 -right-1 animate-pulse" />
              </div>
            </div>
            <DialogTitle className="text-2xl font-bold text-gray-900">
              Department Created Successfully!
            </DialogTitle>
            <DialogDescription className="text-gray-600 mt-2">
              Your new department has been created and is ready to use. You can now manage job roles and assign employees.
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-xl bg-slate-50 border border-slate-200 px-4 py-3 text-left text-sm text-slate-600 mt-4">
            <p className="font-semibold text-slate-900 mb-2">What's next?</p>
            <ul className="list-disc list-inside space-y-1">
              <li>View your new department on the company page</li>
              <li>Add more job roles or edit existing ones</li>
              <li>Start assigning employees to job roles</li>
            </ul>
          </div>
          <div className="flex flex-col gap-3 mt-6">
            <Button
              onClick={handleSuccessContinue}
              className="w-full bg-green-600 hover:bg-green-700 text-white"
              data-testid="button-continue"
            >
              <Building2 className="w-4 h-4 mr-2" />
              Return to Company Page
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Error Modal */}
      <Dialog open={showErrorModal} onOpenChange={(open) => !open && handleErrorClose()}>
        <DialogContent className="sm:max-w-md" onInteractOutside={(e) => e.preventDefault()}>
          <DialogHeader className="text-center">
            <div className="mx-auto mb-4 w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
              <XCircle className="w-8 h-8 text-red-600" />
            </div>
            <DialogTitle className="text-2xl font-bold text-gray-900">
              Creation Failed
            </DialogTitle>
            <DialogDescription className="text-gray-600 mt-2">
              {errorMessage || "We couldn't create the department. Please check your input and try again."}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3 mt-6">
            <Button
              onClick={handleErrorClose}
              className="w-full bg-red-600 hover:bg-red-700 text-white"
              data-testid="button-error-close"
            >
              Close
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                handleErrorClose();
                setLocation("/company");
              }}
              className="w-full"
            >
              Return to Company Page
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

