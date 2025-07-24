import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocation, useRoute } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Save, User, Briefcase, FileText, AlertTriangle, Users } from "lucide-react";
import PageHeader from "@/components/page-header";
import Breadcrumb from "@/components/breadcrumb";

// Form schema - reusing the same schema from onboarding
const employeeFormSchema = z.object({
  // Personal Information
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  phoneNumber: z.string().min(1, "Phone number is required"),
  address: z.string().optional(),
  dateOfBirth: z.string().optional(),
  nationalInsuranceNumber: z.string().min(1, "National Insurance Number is required"),
  gender: z.string().min(1, "Gender is required"),
  maritalStatus: z.string().min(1, "Marital status is required"),
  emergencyContactName: z.string().min(1, "Emergency contact name is required"),
  emergencyContactPhone: z.string().min(1, "Emergency contact phone is required"),
  emergencyContactRelationship: z.string().min(1, "Emergency contact relationship is required"),
  
  // VISA/Immigration Information
  passportNumber: z.string().optional(),
  passportIssueDate: z.string().optional(),
  passportExpiryDate: z.string().optional(),
  visaIssueDate: z.string().optional(),
  visaExpiryDate: z.string().optional(),
  visaCategory: z.string().optional(),
  dbsCertificateNumber: z.string().optional(),
  
  // Employment Information
  jobTitle: z.string().min(1, "Job title is required"),
  department: z.string().min(1, "Department is required"),
  manager: z.string().optional(),
  employmentStatus: z.string().min(1, "Employment status is required"),
  baseSalary: z.string().min(1, "Base salary is required"),
  payFrequency: z.string().min(1, "Pay frequency is required"),
  startDate: z.string().min(1, "Start date is required"),
  location: z.string().min(1, "Location is required"),
  weeklyHours: z.string().min(1, "Weekly hours is required"),
  paymentMethod: z.string().min(1, "Payment method is required"),
  taxCode: z.string().min(1, "Tax code is required"),
  benefits: z.array(z.string()).optional(),
});

// Employment status schema
const employmentStatusSchema = z.object({
  status: z.enum(["active", "suspended", "terminated"]),
  statusDate: z.string().min(1, "Status date is required"),
  statusManager: z.string().min(1, "Manager responsible is required"),
  statusReason: z.string().min(1, "Reason is required"),
  statusNotes: z.string().optional(),
});

export default function EditEmployee() {
  const [, setLocation] = useLocation();
  const [, params] = useRoute("/employees/edit/:id");
  const { toast } = useToast();
  const employeeId = params?.id;

  // For demo purposes, using a hardcoded company ID
  const companyId = "68f11a7e-27ab-40eb-826e-3ce6d84874de";

  // Fetch employee data
  const { data: employee, isLoading, error } = useQuery({
    queryKey: ['/api/employees', employeeId],
    queryFn: async () => {
      const response = await fetch(`/api/employees/${employeeId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch employee');
      }
      return response.json();
    },
    enabled: !!employeeId,
  });

  // Main form
  const form = useForm<z.infer<typeof employeeFormSchema>>({
    resolver: zodResolver(employeeFormSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phoneNumber: "",
      address: "",
      dateOfBirth: "",
      nationalInsuranceNumber: "",
      gender: "",
      maritalStatus: "",
      emergencyContactName: "",
      emergencyContactPhone: "",
      emergencyContactRelationship: "",
      passportNumber: "",
      passportIssueDate: "",
      passportExpiryDate: "",
      visaIssueDate: "",
      visaExpiryDate: "",
      visaCategory: "",
      dbsCertificateNumber: "",
      jobTitle: "",
      department: "",
      manager: "",
      employmentStatus: "",
      baseSalary: "",
      payFrequency: "",
      startDate: "",
      location: "",
      weeklyHours: "",
      paymentMethod: "",
      taxCode: "",
      benefits: [],
    },
  });

  // Employment status form
  const statusForm = useForm<z.infer<typeof employmentStatusSchema>>({
    resolver: zodResolver(employmentStatusSchema),
    defaultValues: {
      status: "active",
      statusDate: "",
      statusManager: "",
      statusReason: "",
      statusNotes: "",
    },
  });

  // Populate form when employee data is loaded
  useEffect(() => {
    if (employee) {
      form.reset({
        firstName: employee.firstName || "",
        lastName: employee.lastName || "",
        email: employee.email || "",
        phoneNumber: employee.phone || "",
        address: employee.address || "",
        dateOfBirth: employee.dateOfBirth ? employee.dateOfBirth.split('T')[0] : "",
        nationalInsuranceNumber: employee.nationalInsuranceNumber || "",
        gender: employee.gender || "",
        maritalStatus: employee.maritalStatus || "",
        emergencyContactName: employee.emergencyContact?.name || "",
        emergencyContactPhone: employee.emergencyContact?.phone || "",
        emergencyContactRelationship: employee.emergencyContact?.relationship || "",
        passportNumber: employee.passportNumber || "",
        passportIssueDate: employee.passportIssueDate ? employee.passportIssueDate.split('T')[0] : "",
        passportExpiryDate: employee.passportExpiryDate ? employee.passportExpiryDate.split('T')[0] : "",
        visaIssueDate: employee.visaIssueDate ? employee.visaIssueDate.split('T')[0] : "",
        visaExpiryDate: employee.visaExpiryDate ? employee.visaExpiryDate.split('T')[0] : "",
        visaCategory: employee.visaCategory || "",
        dbsCertificateNumber: employee.dbsCertificateNumber || "",
        jobTitle: employee.employment?.jobTitle || "",
        department: employee.employment?.department || "",
        manager: employee.employment?.manager || "",
        employmentStatus: employee.employment?.employmentStatus || "",
        baseSalary: employee.employment?.baseSalary || "",
        payFrequency: employee.employment?.payFrequency || "",
        startDate: employee.employment?.startDate ? employee.employment.startDate.split('T')[0] : "",
        location: employee.employment?.location || "",
        weeklyHours: employee.employment?.weeklyHours || "",
        paymentMethod: employee.employment?.paymentMethod || "",
        taxCode: employee.employment?.taxCode || "",
        benefits: employee.employment?.benefits || [],
      });

      statusForm.reset({
        status: employee.employment?.status || "active",
        statusDate: new Date().toISOString().split('T')[0],
        statusManager: "",
        statusReason: "",
        statusNotes: "",
      });
    }
  }, [employee, form, statusForm]);

  // Update employee mutation
  const updateEmployeeMutation = useMutation({
    mutationFn: async (data: z.infer<typeof employeeFormSchema>) => {
      const response = await fetch(`/api/employees/${employeeId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          companyId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update employee');
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Employee updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/employees', employeeId] });
      queryClient.invalidateQueries({ queryKey: ['/api/companies', companyId, 'employees'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update employee",
        variant: "destructive",
      });
    },
  });

  // Update employment status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async (data: z.infer<typeof employmentStatusSchema>) => {
      // This would need a new API endpoint for updating employment status
      const response = await fetch(`/api/employees/${employeeId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to update employment status');
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Employment status updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/employees', employeeId] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update employment status",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: z.infer<typeof employeeFormSchema>) => {
    updateEmployeeMutation.mutate(data);
  };

  const onStatusSubmit = (data: z.infer<typeof employmentStatusSchema>) => {
    updateStatusMutation.mutate(data);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading employee details...</p>
        </div>
      </div>
    );
  }

  if (error || !employee) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Employee Not Found</h2>
          <p className="text-gray-600 mb-4">The employee you're looking for doesn't exist or you don't have access to view it.</p>
          <Button onClick={() => setLocation("/employees")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Employees
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <Breadcrumb 
        items={[
          { label: "Employees", href: "/employees", icon: Users },
          { label: `Edit ${employee.firstName} ${employee.lastName}`, icon: User }
        ]}
      />
      <PageHeader 
        title={`Edit Employee: ${employee.firstName} ${employee.lastName}`}
        description="Update employee personal, visa, and employment information"
      >
        <Button variant="outline" onClick={() => setLocation("/employees")}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Employees
        </Button>
      </PageHeader>

      <main className="flex-1 p-6 space-y-6">
        {/* Main Employee Information Form */}
        <Card className="bg-white shadow-md border border-gray-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Employee Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Personal Information Section */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Personal Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>First Name</FormLabel>
                          <FormControl>
                            <Input {...field} />
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
                            <Input {...field} />
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
                            <Input type="email" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="phoneNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone Number</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="address"
                      render={({ field }) => (
                        <FormItem className="md:col-span-2">
                          <FormLabel>Address</FormLabel>
                          <FormControl>
                            <Textarea {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="dateOfBirth"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Date of Birth</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="gender"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Gender</FormLabel>
                          <FormControl>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select gender" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="male">Male</SelectItem>
                                <SelectItem value="female">Female</SelectItem>
                                <SelectItem value="other">Other</SelectItem>
                                <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
                              </SelectContent>
                            </Select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="maritalStatus"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Marital Status</FormLabel>
                          <FormControl>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select status" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="single">Single</SelectItem>
                                <SelectItem value="married">Married</SelectItem>
                                <SelectItem value="divorced">Divorced</SelectItem>
                                <SelectItem value="widowed">Widowed</SelectItem>
                                <SelectItem value="civil-partnership">Civil Partnership</SelectItem>
                              </SelectContent>
                            </Select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="nationalInsuranceNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>National Insurance Number</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <Separator />

                {/* Emergency Contact Section */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Emergency Contact</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="emergencyContactName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Contact Name</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="emergencyContactPhone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Contact Phone</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="emergencyContactRelationship"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Relationship</FormLabel>
                          <FormControl>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select relationship" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="spouse">Spouse</SelectItem>
                                <SelectItem value="parent">Parent</SelectItem>
                                <SelectItem value="sibling">Sibling</SelectItem>
                                <SelectItem value="child">Child</SelectItem>
                                <SelectItem value="friend">Friend</SelectItem>
                                <SelectItem value="other">Other</SelectItem>
                              </SelectContent>
                            </Select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <Separator />

                {/* Employment Information Section */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Employment Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="jobTitle"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Job Title</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="department"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Department</FormLabel>
                          <FormControl>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select department" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Engineering">Engineering</SelectItem>
                                <SelectItem value="Marketing">Marketing</SelectItem>
                                <SelectItem value="Sales">Sales</SelectItem>
                                <SelectItem value="Human Resources">Human Resources</SelectItem>
                                <SelectItem value="Finance">Finance</SelectItem>
                                <SelectItem value="Operations">Operations</SelectItem>
                              </SelectContent>
                            </Select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="baseSalary"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Base Salary (£)</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="startDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Start Date</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button
                    type="submit"
                    disabled={updateEmployeeMutation.isPending}
                    className="min-w-32"
                  >
                    {updateEmployeeMutation.isPending ? (
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

        {/* Employment Status Management Section */}
        <Card className="bg-white shadow-md border border-gray-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="w-5 h-5" />
              Employment Status Management
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <Label className="text-sm font-medium text-gray-700">Current Status</Label>
              <div className="mt-1">
                <Badge 
                  className={
                    employee.employment?.status === 'active' 
                      ? 'bg-green-100 text-green-800'
                      : employee.employment?.status === 'suspended'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-red-100 text-red-800'
                  }
                >
                  {employee.employment?.status || 'Unknown'}
                </Badge>
              </div>
            </div>

            <Separator className="my-4" />

            <Form {...statusForm}>
              <form onSubmit={statusForm.handleSubmit(onStatusSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={statusForm.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>New Status</FormLabel>
                        <FormControl>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="active">Active</SelectItem>
                              <SelectItem value="suspended">Suspended</SelectItem>
                              <SelectItem value="terminated">Terminated</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={statusForm.control}
                    name="statusDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Effective Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={statusForm.control}
                    name="statusManager"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Manager Responsible</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Manager name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={statusForm.control}
                    name="statusReason"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Reason</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Reason for status change" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={statusForm.control}
                    name="statusNotes"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel>Additional Notes (Optional)</FormLabel>
                        <FormControl>
                          <Textarea {...field} placeholder="Additional details or comments" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex justify-end">
                  <Button
                    type="submit"
                    disabled={updateStatusMutation.isPending}
                    variant="outline"
                    className="min-w-32"
                  >
                    {updateStatusMutation.isPending ? (
                      <div className="w-4 h-4 border-2 border-gray-600 border-t-transparent rounded-full animate-spin mr-2" />
                    ) : (
                      <FileText className="w-4 h-4 mr-2" />
                    )}
                    Update Status
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}