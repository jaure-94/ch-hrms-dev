import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  FileText, 
  User, 
  Calendar, 
  DollarSign, 
  MapPin, 
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  Clock,
  Building,
  Plus
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Link, useLocation } from "wouter";
import Breadcrumb from "@/components/breadcrumb";
import PageHeader from "@/components/page-header";
import { DatePicker } from "@/components/ui/date-picker";

const contractFormSchema = z.object({
  employeeId: z.string().min(1, "Please select an employee"),
  jobTitle: z.string().min(1, "Job title is required"),
  department: z.string().min(1, "Department is required"),
  manager: z.string().optional(),
  baseSalary: z.string().min(1, "Base salary is required"),
  payFrequency: z.enum(["weekly", "bi-weekly", "monthly", "annually"]),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().optional(),
  contractType: z.enum(["permanent", "temporary", "contract", "probationary"]),
  location: z.string().min(1, "Work location is required"),
  hoursPerWeek: z.string().min(1, "Hours per week is required"),
  benefits: z.string().optional(),
  specialTerms: z.string().optional(),
  probationPeriod: z.string().optional(),
});

type ContractFormData = z.infer<typeof contractFormSchema>;

export default function ContractGeneratePage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // For demo purposes, using a hardcoded company ID
  const companyId = "68f11a7e-27ab-40eb-826e-3ce6d84874de";
  
  const { data: employees, isLoading: employeesLoading } = useQuery({
    queryKey: ['/api/companies', companyId, 'employees'],
    enabled: !!companyId,
  });

  const form = useForm<ContractFormData>({
    resolver: zodResolver(contractFormSchema),
    defaultValues: {
      employeeId: "",
      jobTitle: "",
      department: "",
      manager: "",
      baseSalary: "",
      payFrequency: "monthly",
      startDate: "",
      endDate: "",
      contractType: "permanent",
      location: "",
      hoursPerWeek: "40",
      benefits: "",
      specialTerms: "",
      probationPeriod: "",
    },
  });

  const selectedEmployee = employees?.find((emp: any) => emp.id === form.watch("employeeId"));

  // Pre-fill form when employee is selected
  const handleEmployeeChange = (employeeId: string) => {
    const employee = employees?.find((emp: any) => emp.id === employeeId);
    if (employee) {
      form.setValue("employeeId", employeeId);
      form.setValue("jobTitle", employee.employment?.jobTitle || "");
      form.setValue("department", employee.employment?.department || "");
      form.setValue("baseSalary", employee.employment?.baseSalary || "");
      form.setValue("location", employee.employment?.location || "");
    }
  };

  const generateContractMutation = useMutation({
    mutationFn: async (data: ContractFormData) => {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 3000));
      return { success: true, contractId: Date.now().toString() };
    },
    onSuccess: (result) => {
      toast({
        title: "Contract generated successfully",
        description: "The employment contract has been generated and is ready for download.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/companies', companyId, 'contracts'] });
      setLocation("/contracts");
    },
    onError: () => {
      toast({
        title: "Failed to generate contract",
        description: "There was an error generating the contract. Please try again.",
        variant: "destructive",
      });
    }
  });

  const onSubmit = (data: ContractFormData) => {
    generateContractMutation.mutate(data);
  };

  if (employeesLoading) {
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
      {/* Breadcrumb */}
      <Breadcrumb 
        items={[
          { label: "Contracts", href: "/contracts", icon: FileText },
          { label: "Generate New Contract", icon: Plus }
        ]} 
      />

      {/* Header */}
      <PageHeader 
        title="Generate New Contract"
        description="Create an employment contract for an existing employee"
      />

      {/* Main Content */}
      <main className="flex-1 p-6">
        <div className="max-w-4xl mx-auto">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Employee Selection */}
              <Card className="bg-white shadow-md border border-gray-200">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <User className="w-5 h-5" />
                    <span>Employee Selection</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <FormField
                    control={form.control}
                    name="employeeId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Select Employee</FormLabel>
                        <Select onValueChange={handleEmployeeChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Choose an employee..." />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {employees?.map((employee: any) => (
                              <SelectItem key={employee.id} value={employee.id}>
                                {employee.firstName} {employee.lastName} - {employee.employment?.jobTitle || 'No Title'}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Select the employee for whom you want to generate a contract
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {selectedEmployee && (
                    <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="flex items-center space-x-3">
                        <User className="w-8 h-8 text-blue-600" />
                        <div>
                          <h3 className="font-medium text-gray-900">
                            {selectedEmployee.firstName} {selectedEmployee.lastName}
                          </h3>
                          <p className="text-sm text-gray-600">{selectedEmployee.email}</p>
                          <p className="text-sm text-gray-600">
                            {selectedEmployee.employment?.department} • {selectedEmployee.employment?.jobTitle}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Job Details */}
              <Card className="bg-white shadow-md border border-gray-200">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Building className="w-5 h-5" />
                    <span>Job Details</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="jobTitle"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Job Title</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="e.g., Software Engineer" />
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
                            <Input {...field} placeholder="e.g., Engineering" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="manager"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Direct Manager (Optional)</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="e.g., John Smith" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="contractType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Contract Type</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select contract type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="permanent">Permanent</SelectItem>
                              <SelectItem value="temporary">Temporary</SelectItem>
                              <SelectItem value="contract">Contract</SelectItem>
                              <SelectItem value="probationary">Probationary</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Compensation & Schedule */}
              <Card className="bg-white shadow-md border border-gray-200">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <DollarSign className="w-5 h-5" />
                    <span>Compensation & Schedule</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="baseSalary"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Base Salary</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="e.g., 75000" />
                          </FormControl>
                          <FormDescription>Enter amount in USD</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="payFrequency"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Pay Frequency</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select pay frequency" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="weekly">Weekly</SelectItem>
                              <SelectItem value="bi-weekly">Bi-weekly</SelectItem>
                              <SelectItem value="monthly">Monthly</SelectItem>
                              <SelectItem value="annually">Annually</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="hoursPerWeek"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Hours per Week</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="e.g., 40" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="location"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Work Location</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="e.g., New York, NY" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Contract Terms */}
              <Card className="bg-white shadow-md border border-gray-200">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Calendar className="w-5 h-5" />
                    <span>Contract Terms</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="startDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Start Date</FormLabel>
                          <FormControl>
                            <DatePicker
                              date={field.value ? new Date(field.value) : undefined}
                              onDateChange={(date) => {
                                field.onChange(date ? date.toISOString().split('T')[0] : "");
                              }}
                              placeholder="Select start date"
                              error={!!form.formState.errors.startDate}
                              errorMessage={form.formState.errors.startDate?.message}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="endDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>End Date (Optional)</FormLabel>
                          <FormControl>
                            <DatePicker
                              date={field.value ? new Date(field.value) : undefined}
                              onDateChange={(date) => {
                                field.onChange(date ? date.toISOString().split('T')[0] : "");
                              }}
                              placeholder="Select end date"
                              error={!!form.formState.errors.endDate}
                              errorMessage={form.formState.errors.endDate?.message}
                            />
                          </FormControl>
                          <FormDescription>Leave blank for permanent positions</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="probationPeriod"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Probation Period (Optional)</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="e.g., 3 months" />
                        </FormControl>
                        <FormDescription>Specify the probation period if applicable</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="benefits"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Benefits (Optional)</FormLabel>
                        <FormControl>
                          <Textarea 
                            {...field} 
                            placeholder="e.g., Health insurance, 401k, Paid time off..."
                            rows={3}
                          />
                        </FormControl>
                        <FormDescription>List all benefits included with this position</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="specialTerms"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Special Terms (Optional)</FormLabel>
                        <FormControl>
                          <Textarea 
                            {...field} 
                            placeholder="Any special terms or conditions..."
                            rows={3}
                          />
                        </FormControl>
                        <FormDescription>Include any additional terms or conditions</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* Contract Generation Alert */}
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  By generating this contract, you confirm that all information is accurate and complete. 
                  The contract will be generated using the currently active template and can be downloaded once created.
                </AlertDescription>
              </Alert>

              {/* Form Actions */}
              <div className="flex items-center justify-between pt-6">
                <Link href="/contracts">
                  <Button variant="outline">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Cancel
                  </Button>
                </Link>
                <Button 
                  type="submit" 
                  disabled={generateContractMutation.isPending}
                  className="min-w-32"
                >
                  {generateContractMutation.isPending ? (
                    <>
                      <Clock className="w-4 h-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <FileText className="w-4 h-4 mr-2" />
                      Generate Contract
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </main>
    </div>
  );
}