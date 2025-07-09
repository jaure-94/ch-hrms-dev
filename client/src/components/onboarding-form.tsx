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
import { DatePicker } from "@/components/ui/date-picker";
import { 
  jobTitles, 
  departments, 
  employmentStatuses, 
  payFrequency, 
  paymentMethods, 
  maritalStatuses, 
  taxCodes, 
  visaCategories, 
  ukLocations 
} from "@/lib/constants";

const formSchema = z.object({
  // Personal Information
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
  address: z.string().optional(),
  dateOfBirth: z.string().optional(),
  emergencyContactName: z.string().min(1, "Emergency contact name is required"),
  emergencyContactPhone: z.string().min(1, "Emergency contact phone is required"),
  emergencyContactRelationship: z.string().min(1, "Emergency contact relationship is required"),
  
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
  
  // Contract Information
  paymentMethod: z.string().min(1, "Payment method is required"),
  maritalStatus: z.string().min(1, "Marital status is required"),
  taxCode: z.string().min(1, "Tax code is required"),
  visaCategory: z.string().optional(),
  
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
      paymentMethod: "",
      maritalStatus: "",
      taxCode: "",
      visaCategory: "",
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
        return ['paymentMethod', 'maritalStatus', 'taxCode', 'visaCategory'];
      case 4:
        return ['manager', 'emergencyContactName', 'emergencyContactPhone', 'emergencyContactRelationship'];
      case 5:
        return []; // Review step, no specific fields to validate
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
    <div className="space-y-6">
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
              <Select
                value={form.watch("jobTitle")}
                onValueChange={(value) => form.setValue("jobTitle", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Job Title" />
                </SelectTrigger>
                <SelectContent>
                  {jobTitles.map((title) => (
                    <SelectItem key={title} value={title}>{title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
                  {departments.map((dept) => (
                    <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                  ))}
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
                  {employmentStatuses.map((status) => (
                    <SelectItem key={status} value={status}>{status}</SelectItem>
                  ))}
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
                <span className="absolute left-3 top-3 text-gray-500">£</span>
                <Input
                  id="baseSalary"
                  {...form.register("baseSalary")}
                  className="pl-8"
                  placeholder="45000"
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
                  {payFrequency.map((freq) => (
                    <SelectItem key={freq} value={freq}>{freq}</SelectItem>
                  ))}
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
              <DatePicker
                date={form.watch("startDate") ? new Date(form.watch("startDate")) : undefined}
                onDateChange={(date) => {
                  if (date) {
                    form.setValue("startDate", date.toISOString().split('T')[0]);
                  } else {
                    form.setValue("startDate", "");
                  }
                }}
                placeholder="Select start date"
                error={!!form.formState.errors.startDate}
                errorMessage={form.formState.errors.startDate?.message}
              />
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
                  {ukLocations.map((location) => (
                    <SelectItem key={location} value={location}>{location}</SelectItem>
                  ))}
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

      {/* Step 3: Contract Information */}
      {currentStep === 3 && (
        <div className="space-y-6">
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4 pb-2 border-b border-gray-200">
              Contract Information
            </h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="paymentMethod">Payment Method *</Label>
              <Select
                value={form.watch("paymentMethod")}
                onValueChange={(value) => form.setValue("paymentMethod", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Payment Method" />
                </SelectTrigger>
                <SelectContent>
                  {paymentMethods.map((method) => (
                    <SelectItem key={method} value={method}>{method}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.paymentMethod && (
                <p className="text-sm text-red-600 mt-1">
                  {form.formState.errors.paymentMethod.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="maritalStatus">Marital Status *</Label>
              <Select
                value={form.watch("maritalStatus")}
                onValueChange={(value) => form.setValue("maritalStatus", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Marital Status" />
                </SelectTrigger>
                <SelectContent>
                  {maritalStatuses.map((status) => (
                    <SelectItem key={status} value={status}>{status}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.maritalStatus && (
                <p className="text-sm text-red-600 mt-1">
                  {form.formState.errors.maritalStatus.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="taxCode">Tax Code *</Label>
              <Select
                value={form.watch("taxCode")}
                onValueChange={(value) => form.setValue("taxCode", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Tax Code" />
                </SelectTrigger>
                <SelectContent>
                  {taxCodes.map((code) => (
                    <SelectItem key={code} value={code}>{code}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.taxCode && (
                <p className="text-sm text-red-600 mt-1">
                  {form.formState.errors.taxCode.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="visaCategory">Visa Category (if applicable)</Label>
              <Select
                value={form.watch("visaCategory")}
                onValueChange={(value) => form.setValue("visaCategory", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Visa Category" />
                </SelectTrigger>
                <SelectContent>
                  {visaCategories.map((category) => (
                    <SelectItem key={category} value={category}>{category}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      )}

      {/* Step 4: Manager & Emergency Contact */}
      {currentStep === 4 && (
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
                <Label htmlFor="emergencyContactName">Contact Name *</Label>
                <Input
                  id="emergencyContactName"
                  {...form.register("emergencyContactName")}
                  placeholder="Jane Doe"
                />
                {form.formState.errors.emergencyContactName && (
                  <p className="text-sm text-red-600 mt-1">
                    {form.formState.errors.emergencyContactName.message}
                  </p>
                )}
              </div>
              
              <div>
                <Label htmlFor="emergencyContactPhone">Contact Phone *</Label>
                <Input
                  id="emergencyContactPhone"
                  {...form.register("emergencyContactPhone")}
                  placeholder="(555) 123-4567"
                />
                {form.formState.errors.emergencyContactPhone && (
                  <p className="text-sm text-red-600 mt-1">
                    {form.formState.errors.emergencyContactPhone.message}
                  </p>
                )}
              </div>
              
              <div>
                <Label htmlFor="emergencyContactRelationship">Relationship *</Label>
                <Input
                  id="emergencyContactRelationship"
                  {...form.register("emergencyContactRelationship")}
                  placeholder="Spouse"
                />
                {form.formState.errors.emergencyContactRelationship && (
                  <p className="text-sm text-red-600 mt-1">
                    {form.formState.errors.emergencyContactRelationship.message}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Step 5: Review & Submit */}
      {currentStep === 5 && (
        <div className="space-y-6">
          <div className="bg-gray-50 p-6 rounded-lg">
            <h3 className="text-lg font-medium text-gray-900 mb-6">Review Employee Information</h3>
            
            {/* Personal Information */}
            <div className="mb-6">
              <h4 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">Personal Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="font-medium text-gray-900">Full Name</p>
                  <p className="text-gray-600">{form.watch("firstName")} {form.watch("lastName")}</p>
                </div>
                <div>
                  <p className="font-medium text-gray-900">Email Address</p>
                  <p className="text-gray-600">{form.watch("email")}</p>
                </div>
                <div>
                  <p className="font-medium text-gray-900">Phone Number</p>
                  <p className="text-gray-600">{form.watch("phoneNumber")}</p>
                </div>
                <div>
                  <p className="font-medium text-gray-900">Date of Birth</p>
                  <p className="text-gray-600">{form.watch("dateOfBirth")}</p>
                </div>
                <div>
                  <p className="font-medium text-gray-900">Address</p>
                  <p className="text-gray-600">{form.watch("address")}</p>
                </div>
                <div>
                  <p className="font-medium text-gray-900">National Insurance Number</p>
                  <p className="text-gray-600">{form.watch("nationalInsuranceNumber")}</p>
                </div>
              </div>
            </div>

            {/* Employment Information */}
            <div className="mb-6">
              <h4 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">Employment Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="font-medium text-gray-900">Job Title</p>
                  <p className="text-gray-600">{form.watch("jobTitle")}</p>
                </div>
                <div>
                  <p className="font-medium text-gray-900">Department</p>
                  <p className="text-gray-600">{form.watch("department")}</p>
                </div>
                <div>
                  <p className="font-medium text-gray-900">Employment Status</p>
                  <p className="text-gray-600">{form.watch("employmentStatus")}</p>
                </div>
                <div>
                  <p className="font-medium text-gray-900">Start Date</p>
                  <p className="text-gray-600">{form.watch("startDate")}</p>
                </div>
                <div>
                  <p className="font-medium text-gray-900">Location</p>
                  <p className="text-gray-600">{form.watch("location")}</p>
                </div>
                <div>
                  <p className="font-medium text-gray-900">Base Salary</p>
                  <p className="text-gray-600">£{form.watch("baseSalary")}</p>
                </div>
                <div>
                  <p className="font-medium text-gray-900">Pay Frequency</p>
                  <p className="text-gray-600">{form.watch("payFrequency")}</p>
                </div>
              </div>
            </div>

            {/* Contract Information */}
            <div className="mb-6">
              <h4 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">Contract Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="font-medium text-gray-900">Payment Method</p>
                  <p className="text-gray-600">{form.watch("paymentMethod")}</p>
                </div>
                <div>
                  <p className="font-medium text-gray-900">Marital Status</p>
                  <p className="text-gray-600">{form.watch("maritalStatus")}</p>
                </div>
                <div>
                  <p className="font-medium text-gray-900">Tax Code</p>
                  <p className="text-gray-600">{form.watch("taxCode")}</p>
                </div>
                <div>
                  <p className="font-medium text-gray-900">Visa Category</p>
                  <p className="text-gray-600">{form.watch("visaCategory")}</p>
                </div>
              </div>
            </div>

            {/* Manager & Emergency Contact */}
            <div className="mb-6">
              <h4 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">Manager & Emergency Contact</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="font-medium text-gray-900">Manager</p>
                  <p className="text-gray-600">{form.watch("manager")}</p>
                </div>
                <div>
                  <p className="font-medium text-gray-900">Emergency Contact Name</p>
                  <p className="text-gray-600">{form.watch("emergencyContactName")}</p>
                </div>
                <div>
                  <p className="font-medium text-gray-900">Emergency Contact Phone</p>
                  <p className="text-gray-600">{form.watch("emergencyContactPhone")}</p>
                </div>
                <div>
                  <p className="font-medium text-gray-900">Emergency Contact Relationship</p>
                  <p className="text-gray-600">{form.watch("emergencyContactRelationship")}</p>
                </div>
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
            type="button" 
            onClick={() => {
              form.handleSubmit(handleSubmit)();
            }}
            disabled={createEmployeeMutation.isPending}
          >
            {createEmployeeMutation.isPending ? "Creating..." : "Create Employee"}
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        )}
      </div>
    </div>
  );
}
