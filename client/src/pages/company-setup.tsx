import { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Building2, CheckCircle, ArrowRight, ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { useAuth, authenticatedApiRequest } from '@/lib/auth';
import { useLocation } from 'wouter';

const setupSchema = z.object({
  // Company details
  companyNumber: z.string().optional(),
  
  // HR Settings
  defaultNoticePeriodWeeks: z.number().int().min(1).max(52).default(4),
  workingHoursPerWeek: z.number().min(1).max(80).default(37.5),
  workingDaysPerWeek: z.number().int().min(1).max(7).default(5),
  leaveEntitlementDays: z.number().int().min(0).max(365).default(25),
  probationPeriodMonths: z.number().int().min(0).max(24).default(6),
  currency: z.string().default("GBP"),
  timezone: z.string().default("Europe/London"),
  publicHolidays: z.array(z.string()).default([]),
  
  // Initial departments
  departments: z.array(z.object({
    name: z.string().min(1, "Department name is required"),
    description: z.string().optional(),
  })).default([]),
});

type SetupFormData = z.infer<typeof setupSchema>;

const currencyOptions = [
  { value: 'GBP', label: 'British Pound (£)' },
  { value: 'USD', label: 'US Dollar ($)' },
  { value: 'EUR', label: 'Euro (€)' },
];

const timezoneOptions = [
  { value: 'Europe/London', label: 'London (GMT/BST)' },
  { value: 'Europe/Dublin', label: 'Dublin (GMT/IST)' },
  { value: 'America/New_York', label: 'New York (EST/EDT)' },
  { value: 'America/Los_Angeles', label: 'Los Angeles (PST/PDT)' },
];

export default function CompanySetup() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

  const form = useForm<SetupFormData>({
    resolver: zodResolver(setupSchema),
    defaultValues: {
      companyNumber: '',
      defaultNoticePeriodWeeks: 4,
      workingHoursPerWeek: 37.5,
      workingDaysPerWeek: 5,
      leaveEntitlementDays: 25,
      probationPeriodMonths: 6,
      currency: 'GBP',
      timezone: 'Europe/London',
      publicHolidays: [],
      departments: [
        { name: 'Human Resources', description: 'People and culture management' },
        { name: 'Finance', description: 'Financial management and accounting' },
        { name: 'Operations', description: 'Day-to-day business operations' },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "departments"
  });

  const onSubmit = async (data: SetupFormData) => {
    setError('');
    setIsLoading(true);

    try {
      await authenticatedApiRequest('POST', '/companies/setup', data);
      setLocation('/dashboard');
    } catch (err) {
      setError('Failed to complete setup. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const nextStep = async () => {
    let fieldsToValidate: (keyof SetupFormData)[] = [];
    
    if (currentStep === 1) {
      fieldsToValidate = ['companyNumber'];
    } else if (currentStep === 2) {
      fieldsToValidate = ['defaultNoticePeriodWeeks', 'workingHoursPerWeek', 'workingDaysPerWeek', 'leaveEntitlementDays', 'probationPeriodMonths', 'currency', 'timezone'];
    }
    
    const isValid = fieldsToValidate.length === 0 || await form.trigger(fieldsToValidate);
    
    if (isValid && currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const addDepartment = () => {
    append({ name: '', description: '' });
  };

  const steps = [
    { number: 1, title: 'Company Details', description: 'Basic company information' },
    { number: 2, title: 'HR Settings', description: 'Configure HR policies' },
    { number: 3, title: 'Departments', description: 'Set up organizational structure' },
  ];

  // Redirect if user is not superuser or setup is already completed
  if (!user || user.role.name !== 'superuser') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Alert className="max-w-md">
          <AlertDescription>
            Access denied. Only superusers can complete company setup.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (user.company.setupCompleted) {
    setLocation('/dashboard');
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="w-full max-w-3xl space-y-6">
        {/* Header */}
        <div className="text-center">
          <div className="flex justify-center">
            <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center mb-4">
              <Building2 className="w-6 h-6 text-white" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">
            Complete Your Setup
          </h1>
          <p className="text-gray-600">
            Welcome {user.firstName}! Let's finish setting up {user.company.name}
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center space-x-4 mb-6">
          {steps.map((step, index) => (
            <div key={step.number} className="flex items-center">
              <div className={`flex items-center ${index > 0 ? 'ml-4' : ''}`}>
                <div className={`
                  w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                  ${currentStep >= step.number 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-400'
                  }
                `}>
                  {currentStep > step.number ? (
                    <CheckCircle className="w-5 h-5" />
                  ) : (
                    step.number
                  )}
                </div>
                <div className="ml-2">
                  <div className={`text-sm font-medium ${
                    currentStep >= step.number ? 'text-gray-900' : 'text-gray-400'
                  }`}>
                    {step.title}
                  </div>
                  <div className="text-xs text-gray-500">{step.description}</div>
                </div>
              </div>
              {index < steps.length - 1 && (
                <ArrowRight className="w-4 h-4 text-gray-300 mx-4" />
              )}
            </div>
          ))}
        </div>

        {/* Setup Form */}
        <Card>
          <CardHeader>
            <CardTitle>
              {steps[currentStep - 1].title}
            </CardTitle>
            <CardDescription>
              {steps[currentStep - 1].description}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                {currentStep === 1 && (
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="companyNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Company Registration Number (Optional)</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., 12345678" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}

                {currentStep === 2 && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="defaultNoticePeriodWeeks"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Default Notice Period (Weeks)</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                min="1" 
                                max="52"
                                {...field}
                                onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="probationPeriodMonths"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Probation Period (Months)</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                min="0" 
                                max="24"
                                {...field}
                                onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <FormField
                        control={form.control}
                        name="workingHoursPerWeek"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Working Hours/Week</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                min="1" 
                                max="80" 
                                step="0.5"
                                {...field}
                                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="workingDaysPerWeek"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Working Days/Week</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                min="1" 
                                max="7"
                                {...field}
                                onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="leaveEntitlementDays"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Annual Leave Days</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                min="0" 
                                max="365"
                                {...field}
                                onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="currency"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Currency</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select currency" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {currencyOptions.map((currency) => (
                                  <SelectItem key={currency.value} value={currency.value}>
                                    {currency.label}
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
                        name="timezone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Timezone</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select timezone" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {timezoneOptions.map((timezone) => (
                                  <SelectItem key={timezone.value} value={timezone.value}>
                                    {timezone.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                )}

                {currentStep === 3 && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-medium">Initial Departments</h3>
                        <p className="text-sm text-gray-600">
                          Set up your organizational structure. You can add more departments later.
                        </p>
                      </div>
                      <Button type="button" variant="outline" size="sm" onClick={addDepartment}>
                        <Plus className="w-4 h-4 mr-2" />
                        Add Department
                      </Button>
                    </div>

                    <div className="space-y-3">
                      {fields.map((field, index) => (
                        <div key={field.id} className="flex items-end gap-3 p-3 border rounded-lg">
                          <div className="flex-1 grid grid-cols-2 gap-3">
                            <FormField
                              control={form.control}
                              name={`departments.${index}.name`}
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
                              name={`departments.${index}.description`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Description (Optional)</FormLabel>
                                  <FormControl>
                                    <Input placeholder="Brief description" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          {fields.length > 1 && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => remove(index)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex justify-between pt-6">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={prevStep}
                    disabled={currentStep === 1}
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Previous
                  </Button>

                  {currentStep < 3 ? (
                    <Button type="button" onClick={nextStep}>
                      Next Step
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  ) : (
                    <Button type="submit" disabled={isLoading}>
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Completing Setup...
                        </>
                      ) : (
                        'Complete Setup'
                      )}
                    </Button>
                  )}
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}