import { useEffect } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation, useRoute } from "wouter";
import { z } from "zod";
import Breadcrumb from "@/components/breadcrumb";
import PageHeader from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { authenticatedApiRequest } from "@/lib/auth";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ArrowLeft, Plus, Trash2, Briefcase, Sparkles } from "lucide-react";

const jobRoleFormSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(2, "Title is required"),
  jobId: z
    .string()
    .min(2, "Job ID is required")
    .max(50, "Job ID must be shorter than 50 characters")
    .regex(/^[A-Za-z0-9-_]+$/, "Only letters, numbers, hyphens, underscores allowed"),
  description: z.string().optional(),
});

const departmentFormSchema = z.object({
  name: z.string().min(2, "Department name is required"),
  description: z.string().optional(),
  isActive: z.boolean(),
  jobRoles: z.array(jobRoleFormSchema),
});

type DepartmentFormValues = z.infer<typeof departmentFormSchema>;

type DepartmentDetailResponse = {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  jobRoles: Array<{
    id: string;
    title: string;
    jobId: string;
    description: string | null;
    status: "vacant" | "filled";
    assignedEmployeeId: string | null;
  }>;
};

export default function EditDepartmentPage() {
  const [, params] = useRoute("/departments/:id/edit");
  const [, setLocation] = useLocation();
  const departmentId = params?.id;
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data, isLoading, error } = useQuery({
    queryKey: ["/api/departments", departmentId, "details"],
    enabled: Boolean(departmentId),
    queryFn: async (): Promise<DepartmentDetailResponse> => {
      const response = await authenticatedApiRequest("GET", `/api/departments/${departmentId}/details`);
      if (!response.ok) throw new Error("Failed to fetch department");
      return response.json();
    },
  });

  const form = useForm<DepartmentFormValues>({
    resolver: zodResolver(departmentFormSchema),
    defaultValues: {
      name: "",
      description: "",
      isActive: true,
      jobRoles: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "jobRoles",
  });

  useEffect(() => {
    if (data) {
      form.reset({
        name: data.name,
        description: data.description || "",
        isActive: data.isActive,
        jobRoles: data.jobRoles.map((role) => ({
          id: role.id,
          title: role.title,
          jobId: role.jobId,
          description: role.description || "",
        })),
      });
    }
  }, [data, form]);

  const updateMutation = useMutation({
    mutationFn: async (values: DepartmentFormValues) => {
      const payload = {
        name: values.name,
        description: values.description,
        isActive: values.isActive,
        jobRoles: values.jobRoles,
      };

      const response = await authenticatedApiRequest("PUT", `/api/departments/${departmentId}`, payload);
      if (!response.ok) throw new Error("Failed to update department");

      const jobRoleUpdates = await Promise.all(
        values.jobRoles.map(async (role) => {
          if (role.id) {
            const res = await authenticatedApiRequest("PATCH", `/api/job-roles/${role.id}`, {
              title: role.title,
              jobId: role.jobId,
              description: role.description,
            });
            if (!res.ok) throw new Error(`Failed to update job role ${role.title}`);
            return res.json();
          } else {
            const res = await authenticatedApiRequest("POST", `/api/departments/${departmentId}/job-roles`, {
              title: role.title,
              jobId: role.jobId,
              description: role.description,
            });
            if (!res.ok) throw new Error(`Failed to create job role ${role.title}`);
            return res.json();
          }
        })
      );

      // Determine removed roles
      const removedRoles = data?.jobRoles.filter(
        (existing) => !values.jobRoles.some((role) => role.id === existing.id)
      );

      if (removedRoles && removedRoles.length > 0) {
        for (const role of removedRoles) {
          await authenticatedApiRequest("DELETE", `/api/job-roles/${role.id}`);
        }
      }

      return jobRoleUpdates;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/departments", departmentId, "details"] });
      queryClient.invalidateQueries({ queryKey: ["/api/companies"] });
      toast({
        title: "Department updated",
        description: "Your changes have been saved.",
      });
      setLocation(`/departments/${departmentId}`);
    },
    onError: (err: Error) => {
      toast({
        title: "Update failed",
        description: err.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    },
  });

  const breadcrumbItems = [
    { label: "Company", href: "/company" },
    { label: "Departments", href: "/company#departments" },
    { label: data?.name ?? "Department", href: `/departments/${departmentId}` },
    { label: "Edit" },
  ];

  const onSubmit = (values: DepartmentFormValues) => {
    updateMutation.mutate(values);
  };

  if (isLoading) {
    return (
      <div className="space-y-6 px-6 py-8">
        <div className="h-4 w-48 bg-slate-200 rounded animate-pulse" />
        <div className="h-8 w-64 bg-slate-200 rounded animate-pulse" />
        <div className="h-96 bg-slate-200 rounded animate-pulse" />
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
          <AlertDescription>We couldn’t load the department. Please try again later.</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6 px-6 pb-12" data-testid="edit-department-page">
      <Breadcrumb items={breadcrumbItems} />
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <PageHeader
          title={`Edit ${data.name}`}
          description="Update department details and manage job roles"
          showLogo={false}
        />
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" className="gap-2" onClick={() => setLocation(`/departments/${departmentId}`)}>
            <ArrowLeft className="w-4 h-4" />
            Back to department
          </Button>
          <Button variant="secondary" className="gap-2" onClick={() => setLocation("/company")}>
            <Briefcase className="w-4 h-4" />
            View all departments
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
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex flex-col space-y-3 rounded-lg border border-slate-200 p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <FormLabel>Department Status</FormLabel>
                          <p className="text-sm text-gray-600">Deactivate this department without losing data.</p>
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
                    })
                  }
                  disabled={form.formState.isSubmitting || updateMutation.isPending}
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
                  <>
                    {(form.formState.isSubmitting || updateMutation.isPending) && (
                      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                        <div className="flex items-center gap-3">
                          <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                          <div>
                            <p className="text-sm font-medium text-blue-900">
                              {updateMutation.isPending ? "Saving job roles..." : "Processing changes..."}
                            </p>
                            <p className="text-xs text-blue-700 mt-1">
                              Please wait while we save your changes. This may take a few moments.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                    {fields.map((field, index) => (
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
                            disabled={form.formState.isSubmitting || updateMutation.isPending}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>

                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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
                    ))}
                  </>
                )}
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <Button
                  type="button"
                  variant="outline"
                  className="gap-2"
                  onClick={() => setLocation(`/departments/${departmentId}`)}
                  disabled={form.formState.isSubmitting || updateMutation.isPending}
                >
                  <ArrowLeft className="w-4 h-4" />
                  Cancel
                </Button>
                <Button type="submit" className="gap-2" disabled={form.formState.isSubmitting || updateMutation.isPending}>
                  {form.formState.isSubmitting || updateMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      {updateMutation.isPending ? "Saving changes..." : "Processing..."}
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Save changes
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}

