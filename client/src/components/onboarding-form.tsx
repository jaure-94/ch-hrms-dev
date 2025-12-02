import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
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
import { authenticatedApiRequest, useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { DatePicker } from "@/components/ui/date-picker";
import { 
  employmentStatuses, 
  payFrequency, 
  paymentMethods, 
  maritalStatuses, 
  taxCodes, 
  visaCategories, 
  ukLocations,
  genders 
} from "@/lib/constants";

const formSchema = z.object({
  // Personal Information
  employeeId: z.preprocess(
    (val) => (val === "" || val === null ? undefined : val),
    z.string()
      .max(50, "Employee ID too long")
      .regex(/^[A-Za-z0-9-_]*$/, "Only letters, numbers, hyphens, underscores allowed")
      .optional()
  ),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  phoneNumber: z.string().min(1, "Phone number is required"),
  address: z.string().optional(),
  dateOfBirth: z.string().optional(),
  nationalInsuranceNumber: z.string().min(1, "National Insurance Number is required"),
  gender: z.string().min(1, "Gender is required"),
  emergencyContactName: z.string().min(1, "Emergency contact name is required"),
  emergencyContactPhone: z.string().min(1, "Emergency contact phone is required"),
  emergencyContactRelationship: z.string().min(1, "Emergency contact relationship is required"),
  
  // VISA/Immigration Information
  passportNumber: z.string().optional(),
  passportIssueDate: z.string().optional(),
  passportExpiryDate: z.string().optional(),
  visaIssueDate: z.string().optional(),
  visaExpiryDate: z.string().optional(),
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
  benefits: z.array(z.string()).optional(),
  
  // Contract Information
  paymentMethod: z.string().min(1, "Payment method is required"),
  maritalStatus: z.string().min(1, "Marital status is required"),
  taxCode: z.string().min(1, "Tax code is required"),
  visaCategory: z.string().optional(),
  
  // Company
  companyId: z.string().min(1, "Company is required"),
  jobRoleId: z.string().uuid("Invalid job role ID").optional(),
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
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const companyId = user?.company?.id;

  // Fetch departments for the company
  const { data: departmentsData, isLoading: departmentsLoading } = useQuery({
    queryKey: [`/api/companies/${companyId}/departments`],
    queryFn: async () => {
      if (!companyId) throw new Error("Company ID is required");
      const response = await authenticatedApiRequest('GET', `/api/companies/${companyId}/departments`);
      return response.json();
    },
    enabled: currentStep >= 3 && !!companyId && isAuthenticated && !authLoading, // Wait for auth to complete
  });

  // Fetch vacant job roles for the company
  const { data: jobRolesData, isLoading: jobRolesLoading, error: jobRolesError } = useQuery({
    queryKey: [`/api/companies/${companyId}/job-roles`, { status: 'vacant' }],
    queryFn: async () => {
      if (!companyId) throw new Error("Company ID is required");
      if (!isAuthenticated) throw new Error("Not authenticated");
      
      console.log(`[OnboardingForm] Fetching job roles for company: ${companyId}`);
      console.log(`[OnboardingForm] Auth state - isAuthenticated: ${isAuthenticated}, authLoading: ${authLoading}`);
      
      try {
        // Add a small delay to ensure token is set after auth completes
        await new Promise(resolve => setTimeout(resolve, 100));
        
        const response = await authenticatedApiRequest('GET', `/api/companies/${companyId}/job-roles?status=vacant`);
        
        // Check if response is HTML (error page) instead of JSON
        const contentType = response.headers.get('content-type');
        if (contentType && !contentType.includes('application/json')) {
          const text = await response.text();
          console.error(`[OnboardingForm] Received non-JSON response (${contentType}):`, text.substring(0, 200));
          throw new Error(`Server returned ${contentType} instead of JSON. Status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log(`[OnboardingForm] Received ${data?.length || 0} job roles:`, data);
        return data;
      } catch (error) {
        console.error(`[OnboardingForm] Error fetching job roles:`, error);
        // If it's a JSON parse error, it means we got HTML
        if (error instanceof SyntaxError && error.message.includes('JSON')) {
          throw new Error('Server returned an error page. Please check your authentication and try again.');
        }
        throw error;
      }
    },
    enabled: currentStep >= 3 && !!companyId && isAuthenticated && !authLoading, // Wait for auth to complete
    retry: (failureCount, error) => {
      // Don't retry on 401 errors - it means auth failed
      if (error instanceof Error && error.message.includes('401')) {
        return false;
      }
      return failureCount < 1; // Retry once for other errors
    },
  });

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    mode: "onChange", // This makes validation errors disappear immediately when valid input is entered
    defaultValues: {
      employeeId: "",
      firstName: "",
      lastName: "",
      email: "",
      phoneNumber: "",
      address: "",
      dateOfBirth: "",
      nationalInsuranceNumber: "",
      gender: "",
      emergencyContactName: "",
      emergencyContactPhone: "",
      emergencyContactRelationship: "",
      passportNumber: "",
      passportIssueDate: "",
      passportExpiryDate: "",
      visaIssueDate: "",
      visaExpiryDate: "",
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
      benefits: [],
      paymentMethod: "",
      maritalStatus: "",
      taxCode: "",
      visaCategory: "",
      companyId: companyId || "",
      jobRoleId: undefined,
    },
  });

  // Auto-fill department and job title when job role is selected
  const selectedJobRoleId = form.watch("jobRoleId");
  useEffect(() => {
    if (selectedJobRoleId && jobRolesData && Array.isArray(jobRolesData)) {
      const selectedJobRole = jobRolesData.find((jr: any) => jr.id === selectedJobRoleId);
      if (selectedJobRole) {
        form.setValue("department", selectedJobRole.departmentName);
        form.setValue("jobTitle", selectedJobRole.title);
      }
    } else if (!selectedJobRoleId) {
      // Clear department and job title if no job role is selected
      form.setValue("department", "");
      form.setValue("jobTitle", "");
    }
  }, [selectedJobRoleId, jobRolesData, form]);

  const createEmployeeMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const response = await authenticatedApiRequest('POST', '/api/employees', {
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
    onSuccess: async (employeeData) => {
      toast({
        title: "Employee Created Successfully",
        description: "The new employee has been added to your organization. You can generate their contract from the Contracts page.",
      });
      
      // Invalidate all employee-related queries for this company
      // This will refresh the employees list page regardless of search query
      await queryClient.invalidateQueries({ 
        queryKey: ['/api/companies', employeeData.companyId, 'employees'],
        exact: false, // Match all queries that start with this key (including search queries)
      });
      
      // Also invalidate company stats and details
      await queryClient.invalidateQueries({ 
        queryKey: ['/api/companies', employeeData.companyId],
        exact: false,
      });
      
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
        return ['employeeId', 'firstName', 'lastName', 'email', 'phoneNumber', 'nationalInsuranceNumber', 'gender', 'maritalStatus', 'emergencyContactName', 'emergencyContactPhone', 'emergencyContactRelationship', 'address', 'dateOfBirth'];
      case 2:
        return ['passportNumber', 'visaCategory']; // VISA Information - optional fields
      case 3:
        return ['jobRoleId', 'jobTitle', 'department', 'employmentStatus', 'baseSalary', 'payFrequency', 'startDate', 'location', 'weeklyHours', 'manager', 'paymentMethod', 'taxCode'];
      case 4:
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
              <Label htmlFor="employeeId">Employee ID</Label>
              <Input
                id="employeeId"
                {...form.register("employeeId")}
                placeholder="EMP001"
              />
              {form.formState.errors.employeeId && (
                <p className="text-sm text-red-600 mt-1">
                  {form.formState.errors.employeeId.message}
                </p>
              )}
              <p className="text-xs text-gray-500 mt-1">
                Optional: Unique identifier to match with job roles
              </p>
            </div>
            
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
              <Label htmlFor="phoneNumber">Phone Number *</Label>
              <Input
                id="phoneNumber"
                {...form.register("phoneNumber")}
                placeholder="07123 456789"
              />
              {form.formState.errors.phoneNumber && (
                <p className="text-sm text-red-600 mt-1">
                  {form.formState.errors.phoneNumber.message}
                </p>
              )}
            </div>
            
            <div>
              <Label htmlFor="nationalInsuranceNumber">National Insurance Number *</Label>
              <Input
                id="nationalInsuranceNumber"
                {...form.register("nationalInsuranceNumber")}
                placeholder="QQ123456C"
              />
              {form.formState.errors.nationalInsuranceNumber && (
                <p className="text-sm text-red-600 mt-1">
                  {form.formState.errors.nationalInsuranceNumber.message}
                </p>
              )}
            </div>
            
            <div>
              <Label htmlFor="gender">Gender *</Label>
              <Select
                value={form.watch("gender")}
                onValueChange={(value) => form.setValue("gender", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Gender" />
                </SelectTrigger>
                <SelectContent>
                  {genders.map((gender) => (
                    <SelectItem key={gender} value={gender}>{gender}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.gender && (
                <p className="text-sm text-red-600 mt-1">
                  {form.formState.errors.gender.message}
                </p>
              )}
            </div>
            
            <div>
              <Label htmlFor="dateOfBirth">Date of Birth</Label>
              <Input
                id="dateOfBirth"
                type="date"
                {...form.register("dateOfBirth")}
              />
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
          </div>
          
          <div>
            <Label htmlFor="address">Address</Label>
            <Textarea
              id="address"
              {...form.register("address")}
              placeholder="123 Main Street, City, State 12345"
            />
          </div>
          
          <div className="space-y-4">
            <h4 className="text-lg font-medium text-gray-900">Emergency Contact Information</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="emergencyContactName">Emergency Contact Name *</Label>
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
                <Label htmlFor="emergencyContactPhone">Emergency Contact Phone *</Label>
                <Input
                  id="emergencyContactPhone"
                  {...form.register("emergencyContactPhone")}
                  placeholder="07123 456789"
                />
                {form.formState.errors.emergencyContactPhone && (
                  <p className="text-sm text-red-600 mt-1">
                    {form.formState.errors.emergencyContactPhone.message}
                  </p>
                )}
              </div>
              
              <div>
                <Label htmlFor="emergencyContactRelationship">Emergency Contact Relationship *</Label>
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

      {/* Step 2: VISA/Immigration Information */}
      {currentStep === 2 && (
        <div className="space-y-6">
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4 pb-2 border-b border-gray-200">
              VISA & Immigration Information
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Complete this section only if applicable to your situation
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="passportNumber">Passport Number</Label>
              <Input
                id="passportNumber"
                {...form.register("passportNumber")}
                placeholder="123456789"
              />
            </div>
            
            <div>
              <Label htmlFor="visaCategory">VISA Category</Label>
              <Select
                value={form.watch("visaCategory")}
                onValueChange={(value) => form.setValue("visaCategory", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select VISA Category" />
                </SelectTrigger>
                <SelectContent>
                  {visaCategories.map((category) => (
                    <SelectItem key={category} value={category}>{category}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="passportIssueDate">Passport Issue Date</Label>
              <Input
                id="passportIssueDate"
                type="date"
                {...form.register("passportIssueDate")}
              />
            </div>
            
            <div>
              <Label htmlFor="passportExpiryDate">Passport Expiry Date</Label>
              <Input
                id="passportExpiryDate"
                type="date"
                {...form.register("passportExpiryDate")}
              />
            </div>
            
            <div>
              <Label htmlFor="visaIssueDate">VISA Issue Date</Label>
              <Input
                id="visaIssueDate"
                type="date"
                {...form.register("visaIssueDate")}
              />
            </div>
            
            <div>
              <Label htmlFor="visaExpiryDate">VISA Expiry Date</Label>
              <Input
                id="visaExpiryDate"
                type="date"
                {...form.register("visaExpiryDate")}
              />
            </div>
            
            <div>
              <Label htmlFor="dbsCertificateNumber">DBS Certificate Number</Label>
              <Input
                id="dbsCertificateNumber"
                {...form.register("dbsCertificateNumber")}
                placeholder="001234567890"
              />
            </div>
          </div>
        </div>
      )}

      {/* Step 3: Employment Details */}
      {currentStep === 3 && (
        <div className="space-y-6">
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4 pb-2 border-b border-gray-200">
              Position Information
            </h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="jobRoleId">Job Role *</Label>
              <Select
                value={form.watch("jobRoleId") || ""}
                onValueChange={(value) => {
                  if (value === "no-roles" || value === "loading" || value === "error") return; // Prevent selecting disabled options
                  if (value === "") {
                    // Clear job role selection
                    form.setValue("jobRoleId", undefined);
                    form.setValue("department", "");
                    form.setValue("jobTitle", "");
                  } else {
                    form.setValue("jobRoleId", value);
                    // Department and job title will be auto-filled via useEffect
                  }
                }}
                disabled={jobRolesLoading}
              >
                <SelectTrigger className={jobRolesLoading ? "opacity-50" : ""}>
                  <SelectValue placeholder={jobRolesLoading ? "Loading job roles..." : "Select Job Role"} />
                </SelectTrigger>
                <SelectContent>
                  {jobRolesLoading ? (
                    <SelectItem value="loading" disabled>
                      Loading job roles...
                    </SelectItem>
                  ) : jobRolesError ? (
                    <SelectItem value="error" disabled>
                      Error loading job roles
                    </SelectItem>
                  ) : !isAuthenticated || authLoading ? (
                    <SelectItem value="auth-loading" disabled>
                      Authenticating...
                    </SelectItem>
                  ) : jobRolesData && Array.isArray(jobRolesData) && jobRolesData.length > 0 ? (
                    jobRolesData.map((jobRole: any) => (
                      <SelectItem key={jobRole.id} value={jobRole.id}>
                        {jobRole.title} - {jobRole.departmentName} ({jobRole.jobId})
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="no-roles" disabled>
                      No vacant job roles available
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
              {form.formState.errors.jobRoleId && (
                <p className="text-sm text-red-600 mt-1">
                  {form.formState.errors.jobRoleId.message}
                </p>
              )}
              {jobRolesError && (
                <p className="text-sm text-red-600 mt-1">
                  Failed to load job roles: {jobRolesError instanceof Error ? jobRolesError.message : "Unknown error"}. Please refresh the page.
                </p>
              )}
              {!isAuthenticated && !authLoading && (
                <p className="text-sm text-yellow-600 mt-1">
                  Please log in to view job roles.
                </p>
              )}
              <p className="text-xs text-gray-500 mt-1">
                Selecting a job role will automatically fill the department and job title
              </p>
            </div>
            
            <div>
              <Label htmlFor="department">Department *</Label>
              <Select
                value={form.watch("department")}
                onValueChange={(value) => form.setValue("department", value)}
                disabled={!!form.watch("jobRoleId")} // Disable when job role is selected
              >
                <SelectTrigger className={form.watch("jobRoleId") ? "bg-gray-100" : ""}>
                  <SelectValue placeholder="Select Department" />
                </SelectTrigger>
                <SelectContent>
                  {departmentsData && departmentsData.length > 0 ? (
                    departmentsData.map((dept: any) => (
                      <SelectItem key={dept.id} value={dept.name}>{dept.name}</SelectItem>
                    ))
                  ) : (
                    <SelectItem value="no-departments" disabled>
                      No departments available
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
              {form.formState.errors.department && (
                <p className="text-sm text-red-600 mt-1">
                  {form.formState.errors.department.message}
                </p>
              )}
              {form.watch("jobRoleId") && (
                <p className="text-xs text-gray-500 mt-1">
                  Department is auto-filled from selected job role
                </p>
              )}
            </div>
            
            <div>
              <Label htmlFor="jobTitle">Job Title *</Label>
              <Input
                id="jobTitle"
                {...form.register("jobTitle")}
                placeholder="Software Engineer"
                disabled={!!form.watch("jobRoleId")} // Disable when job role is selected
                className={form.watch("jobRoleId") ? "bg-gray-100" : ""}
              />
              {form.formState.errors.jobTitle && (
                <p className="text-sm text-red-600 mt-1">
                  {form.formState.errors.jobTitle.message}
                </p>
              )}
              {form.watch("jobRoleId") && (
                <p className="text-xs text-gray-500 mt-1">
                  Job title is auto-filled from selected job role
                </p>
              )}
            </div>
            
            <div>
              <Label htmlFor="employmentStatus">Employment Status *</Label>
              <Select
                value={form.watch("employmentStatus")}
                onValueChange={(value) => form.setValue("employmentStatus", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Employment Status" />
                </SelectTrigger>
                <SelectContent>
                  {employmentStatuses.map((status) => (
                    <SelectItem key={status} value={status}>{status}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.employmentStatus && (
                <p className="text-sm text-red-600 mt-1">
                  {form.formState.errors.employmentStatus.message}
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
            
            <div>
              <Label htmlFor="weeklyHours">Weekly Hours *</Label>
              <Input
                id="weeklyHours"
                type="number"
                {...form.register("weeklyHours")}
                placeholder="40"
                min="1"
                max="168"
              />
              {form.formState.errors.weeklyHours && (
                <p className="text-sm text-red-600 mt-1">
                  {form.formState.errors.weeklyHours.message}
                </p>
              )}
            </div>
            
            <div>
              <Label htmlFor="manager">Manager</Label>
              <Input
                id="manager"
                {...form.register("manager")}
                placeholder="John Smith - Engineering Director"
              />
            </div>
            
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

      {/* Step 4: Review & Submit */}
      {currentStep === 4 && (
        <div className="space-y-6">
          <div className="bg-gray-50 p-6 rounded-lg">
            <h3 className="text-lg font-medium text-gray-900 mb-6">Review Employee Information</h3>
            
            {/* Personal Information */}
            <div className="mb-6">
              <h4 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">Personal Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                {form.watch("employeeId") && (
                  <div>
                    <p className="font-medium text-gray-900">Employee ID</p>
                    <p className="text-gray-600">{form.watch("employeeId")}</p>
                  </div>
                )}
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
                <div>
                  <p className="font-medium text-gray-900">Gender</p>
                  <p className="text-gray-600">{form.watch("gender")}</p>
                </div>
                <div>
                  <p className="font-medium text-gray-900">Marital Status</p>
                  <p className="text-gray-600">{form.watch("maritalStatus")}</p>
                </div>
              </div>
            </div>
            
            {/* Emergency Contact Information */}
            <div className="mb-6">
              <h4 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">Emergency Contact Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
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

            {/* VISA Information */}
            {(form.watch("passportNumber") || form.watch("visaCategory")) && (
              <div className="mb-6">
                <h4 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">VISA & Immigration Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  {form.watch("passportNumber") && (
                    <div>
                      <p className="font-medium text-gray-900">Passport Number</p>
                      <p className="text-gray-600">{form.watch("passportNumber")}</p>
                    </div>
                  )}
                  {form.watch("visaCategory") && (
                    <div>
                      <p className="font-medium text-gray-900">VISA Category</p>
                      <p className="text-gray-600">{form.watch("visaCategory")}</p>
                    </div>
                  )}
                  {form.watch("dbsCertificateNumber") && (
                    <div>
                      <p className="font-medium text-gray-900">DBS Certificate Number</p>
                      <p className="text-gray-600">{form.watch("dbsCertificateNumber")}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

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
                <div>
                  <p className="font-medium text-gray-900">Weekly Hours</p>
                  <p className="text-gray-600">{form.watch("weeklyHours")}</p>
                </div>
                <div>
                  <p className="font-medium text-gray-900">Manager</p>
                  <p className="text-gray-600">{form.watch("manager")}</p>
                </div>
                <div>
                  <p className="font-medium text-gray-900">Payment Method</p>
                  <p className="text-gray-600">{form.watch("paymentMethod")}</p>
                </div>
                <div>
                  <p className="font-medium text-gray-900">Tax Code</p>
                  <p className="text-gray-600">{form.watch("taxCode")}</p>
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
