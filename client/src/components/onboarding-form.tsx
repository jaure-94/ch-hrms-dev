import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, ArrowRight, CheckCircle } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const formSchema = z.object({
  // Personal Information
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
  address: z.string().optional(),
  dateOfBirth: z.string().optional(),
  emergencyContactName: z.string().optional(),
  emergencyContactPhone: z.string().optional(),
  emergencyContactRelationship: z.string().optional(),
  
  // Employment Information
  jobTitle: z.string().min(1, "Job title is required"),
  department: z.string().min(1, "Department is required"),
  manager: z.string().optional(),
  employmentType: z.string().min(1, "Employment type is required"),
  baseSalary: z.string().min(1, "Base salary is required"),
  payFrequency: z.string().min(1, "Pay frequency is required"),
  startDate: z.string().min(1, "Start date is required"),
  location: z.string().min(1, "Location is required"),
  benefits: z.array(z.string()).optional(),
  
  // Company
  companyId: z.string().min(1, "Company is required"),
});

type FormData = z.infer<typeof formSchema>;

interface OnboardingFormProps {
  currentStep: number;
  onStepChange: (step: number) => void;
  totalSteps: number;
}

export default function OnboardingForm({ currentStep, onStepChange, totalSteps }: OnboardingFormProps) {
  const [selectedBenefits, setSelectedBenefits] = useState<string[]>([]);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      address: "",
      dateOfBirth: "",
      emergencyContactName: "",
      emergencyContactPhone: "",
      emergencyContactRelationship: "",
      jobTitle: "",
      department: "",
      manager: "",
      employmentType: "",
      baseSalary: "",
      payFrequency: "",
      startDate: "",
      location: "",
      benefits: [],
      companyId: "68f11a7e-27ab-40eb-826e-3ce6d84874de", // In a real app, this would be selected
    },
  });

  const createEmployeeMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const response = await apiRequest('POST', '/api/employees', {
        ...data,
        emergencyContact: {
          name: data.emergencyContactName,
          phone: data.emergencyContactPhone,
          relationship: data.emergencyContactRelationship,
        },
        benefits: selectedBenefits,
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Employee Created Successfully",
        description: "The new employee has been added to your organization.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/companies'] });
      onStepChange(totalSteps + 1); // Move to success step
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create employee",
        variant: "destructive",
      });
    },
  });

  const handleNext = () => {
    const currentStepFields = getCurrentStepFields();
    form.trigger(currentStepFields).then((isValid) => {
      if (isValid) {
        onStepChange(currentStep + 1);
      }
    });
  };

  const handlePrevious = () => {
    onStepChange(currentStep - 1);
  };

  const handleSubmit = (data: FormData) => {
    createEmployeeMutation.mutate(data);
  };

  const getCurrentStepFields = (): (keyof FormData)[] => {
    switch (currentStep) {
      case 1:
        return ['firstName', 'lastName', 'email', 'phone', 'address', 'dateOfBirth'];
      case 2:
        return ['jobTitle', 'department', 'employmentType', 'baseSalary', 'payFrequency', 'startDate', 'location'];
      case 3:
        return ['manager', 'emergencyContactName', 'emergencyContactPhone'];
      default:
        return [];
    }
  };

  const availableBenefits = [
    "Health Insurance",
    "Dental Insurance", 
    "Vision Insurance",
    "401(k) Match",
    "Stock Options",
    "Flexible PTO",
    "Remote Work",
    "Professional Development",
  ];

  if (currentStep > totalSteps) {
    return (
      <div className="text-center py-8">
        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">Employee Created Successfully!</h2>
        <p className="text-gray-600 mb-6">The new employee has been added to your organization.</p>
        <Button onClick={() => onStepChange(1)}>Add Another Employee</Button>
      </div>
    );
  }

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
      {/* Step 1: Personal Information */}
      {currentStep === 1 && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="firstName">First Name *</Label>
              <Input
                id="firstName"
                {...form.register("firstName")}
                placeholder="John"
              />
              {form.formState.errors.firstName && (
                <p className="text-sm text-red-600 mt-1">
                  {form.formState.errors.firstName.message}
                </p>
              )}
            </div>
            
            <div>
              <Label htmlFor="lastName">Last Name *</Label>
              <Input
                id="lastName"
                {...form.register("lastName")}
                placeholder="Doe"
              />
              {form.formState.errors.lastName && (
                <p className="text-sm text-red-600 mt-1">
                  {form.formState.errors.lastName.message}
                </p>
              )}
            </div>
            
            <div>
              <Label htmlFor="email">Email Address *</Label>
              <Input
                id="email"
                type="email"
                {...form.register("email")}
                placeholder="john.doe@company.com"
              />
              {form.formState.errors.email && (
                <p className="text-sm text-red-600 mt-1">
                  {form.formState.errors.email.message}
                </p>
              )}
            </div>
            
            <div>
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                {...form.register("phone")}
                placeholder="(555) 123-4567"
              />
            </div>
            
            <div>
              <Label htmlFor="dateOfBirth">Date of Birth</Label>
              <Input
                id="dateOfBirth"
                type="date"
                {...form.register("dateOfBirth")}
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="address">Address</Label>
            <Textarea
              id="address"
              {...form.register("address")}
              placeholder="123 Main Street, City, State 12345"
            />
          </div>
        </div>
      )}

      {/* Step 2: Employment Details */}
      {currentStep === 2 && (
        <div className="space-y-6">
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4 pb-2 border-b border-gray-200">
              Position Information
            </h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="jobTitle">Job Title *</Label>
              <Input
                id="jobTitle"
                {...form.register("jobTitle")}
                placeholder="Senior Software Engineer"
              />
              {form.formState.errors.jobTitle && (
                <p className="text-sm text-red-600 mt-1">
                  {form.formState.errors.jobTitle.message}
                </p>
              )}
            </div>
            
            <div>
              <Label htmlFor="department">Department *</Label>
              <Select
                value={form.watch("department")}
                onValueChange={(value) => form.setValue("department", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Engineering">Engineering</SelectItem>
                  <SelectItem value="Marketing">Marketing</SelectItem>
                  <SelectItem value="Sales">Sales</SelectItem>
                  <SelectItem value="Human Resources">Human Resources</SelectItem>
                  <SelectItem value="Finance">Finance</SelectItem>
                </SelectContent>
              </Select>
              {form.formState.errors.department && (
                <p className="text-sm text-red-600 mt-1">
                  {form.formState.errors.department.message}
                </p>
              )}
            </div>
            
            <div>
              <Label htmlFor="employmentType">Employment Type *</Label>
              <Select
                value={form.watch("employmentType")}
                onValueChange={(value) => form.setValue("employmentType", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Employment Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Full-time">Full-time</SelectItem>
                  <SelectItem value="Part-time">Part-time</SelectItem>
                  <SelectItem value="Contract">Contract</SelectItem>
                  <SelectItem value="Internship">Internship</SelectItem>
                </SelectContent>
              </Select>
              {form.formState.errors.employmentType && (
                <p className="text-sm text-red-600 mt-1">
                  {form.formState.errors.employmentType.message}
                </p>
              )}
            </div>
            
            <div>
              <Label htmlFor="baseSalary">Base Salary *</Label>
              <div className="relative">
                <span className="absolute left-3 top-3 text-gray-500">$</span>
                <Input
                  id="baseSalary"
                  {...form.register("baseSalary")}
                  className="pl-8"
                  placeholder="85000"
                />
              </div>
              {form.formState.errors.baseSalary && (
                <p className="text-sm text-red-600 mt-1">
                  {form.formState.errors.baseSalary.message}
                </p>
              )}
            </div>
            
            <div>
              <Label htmlFor="payFrequency">Pay Frequency *</Label>
              <Select
                value={form.watch("payFrequency")}
                onValueChange={(value) => form.setValue("payFrequency", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Pay Frequency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Annual">Annual</SelectItem>
                  <SelectItem value="Monthly">Monthly</SelectItem>
                  <SelectItem value="Bi-weekly">Bi-weekly</SelectItem>
                  <SelectItem value="Weekly">Weekly</SelectItem>
                  <SelectItem value="Hourly">Hourly</SelectItem>
                </SelectContent>
              </Select>
              {form.formState.errors.payFrequency && (
                <p className="text-sm text-red-600 mt-1">
                  {form.formState.errors.payFrequency.message}
                </p>
              )}
            </div>
            
            <div>
              <Label htmlFor="startDate">Start Date *</Label>
              <Input
                id="startDate"
                type="date"
                {...form.register("startDate")}
              />
              {form.formState.errors.startDate && (
                <p className="text-sm text-red-600 mt-1">
                  {form.formState.errors.startDate.message}
                </p>
              )}
            </div>
            
            <div>
              <Label htmlFor="location">Location *</Label>
              <Select
                value={form.watch("location")}
                onValueChange={(value) => form.setValue("location", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Location" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="San Francisco, CA - HQ">San Francisco, CA - HQ</SelectItem>
                  <SelectItem value="New York, NY">New York, NY</SelectItem>
                  <SelectItem value="Austin, TX">Austin, TX</SelectItem>
                  <SelectItem value="Remote">Remote</SelectItem>
                </SelectContent>
              </Select>
              {form.formState.errors.location && (
                <p className="text-sm text-red-600 mt-1">
                  {form.formState.errors.location.message}
                </p>
              )}
            </div>
          </div>

          <div className="mt-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4 pb-2 border-b border-gray-200">
              Benefits & Perks
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {availableBenefits.map((benefit) => (
                <div key={benefit} className="flex items-center space-x-2">
                  <Checkbox
                    id={benefit}
                    checked={selectedBenefits.includes(benefit)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedBenefits([...selectedBenefits, benefit]);
                      } else {
                        setSelectedBenefits(selectedBenefits.filter(b => b !== benefit));
                      }
                    }}
                  />
                  <Label htmlFor={benefit} className="text-sm text-gray-700">
                    {benefit}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Step 3: Contract Info */}
      {currentStep === 3 && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="manager">Manager</Label>
              <Input
                id="manager"
                {...form.register("manager")}
                placeholder="John Smith - Engineering Director"
              />
            </div>
          </div>
          
          <div className="mt-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4 pb-2 border-b border-gray-200">
              Emergency Contact
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="emergencyContactName">Contact Name</Label>
                <Input
                  id="emergencyContactName"
                  {...form.register("emergencyContactName")}
                  placeholder="Jane Doe"
                />
              </div>
              
              <div>
                <Label htmlFor="emergencyContactPhone">Contact Phone</Label>
                <Input
                  id="emergencyContactPhone"
                  {...form.register("emergencyContactPhone")}
                  placeholder="(555) 123-4567"
                />
              </div>
              
              <div>
                <Label htmlFor="emergencyContactRelationship">Relationship</Label>
                <Input
                  id="emergencyContactRelationship"
                  {...form.register("emergencyContactRelationship")}
                  placeholder="Spouse"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Step 4: Review & Submit */}
      {currentStep === 4 && (
        <div className="space-y-6">
          <div className="bg-gray-50 p-6 rounded-lg">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Review Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="font-medium">Name:</p>
                <p className="text-gray-600">{form.watch("firstName")} {form.watch("lastName")}</p>
              </div>
              <div>
                <p className="font-medium">Email:</p>
                <p className="text-gray-600">{form.watch("email")}</p>
              </div>
              <div>
                <p className="font-medium">Job Title:</p>
                <p className="text-gray-600">{form.watch("jobTitle")}</p>
              </div>
              <div>
                <p className="font-medium">Department:</p>
                <p className="text-gray-600">{form.watch("department")}</p>
              </div>
              <div>
                <p className="font-medium">Base Salary:</p>
                <p className="text-gray-600">${form.watch("baseSalary")}</p>
              </div>
              <div>
                <p className="font-medium">Start Date:</p>
                <p className="text-gray-600">{form.watch("startDate")}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Form Actions */}
      <div className="flex justify-between pt-8 mt-8 border-t border-gray-200">
        <Button
          type="button"
          variant="outline"
          onClick={handlePrevious}
          disabled={currentStep === 1}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Previous
        </Button>
        
        {currentStep < totalSteps ? (
          <Button type="button" onClick={handleNext}>
            Next Step
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        ) : (
          <Button 
            type="submit" 
            disabled={createEmployeeMutation.isPending}
          >
            {createEmployeeMutation.isPending ? "Creating..." : "Create Employee"}
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        )}
      </div>
    </form>
  );
}
