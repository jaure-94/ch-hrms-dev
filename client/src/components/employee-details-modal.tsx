import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { CalendarDays, Mail, Phone, MapPin, User, Building, CreditCard, FileText, Shield } from "lucide-react";
import { format } from "date-fns";

interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  address?: string;
  dateOfBirth?: string;
  nationalInsuranceNumber?: string;
  gender?: string;
  maritalStatus?: string;
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
  };
  passportNumber?: string;
  passportIssueDate?: string;
  passportExpiryDate?: string;
  visaIssueDate?: string;
  visaExpiryDate?: string;
  visaCategory?: string;
  dbsCertificateNumber?: string;
  employment: {
    jobTitle: string;
    department: string;
    manager?: string;
    employmentStatus: string;
    baseSalary: string;
    payFrequency: string;
    startDate: string;
    location: string;
    weeklyHours?: string;
    paymentMethod?: string;
    taxCode?: string;
    benefits?: string[];
    status: string;
  };
  company: {
    name: string;
    address?: string;
  };
}

interface EmployeeDetailsModalProps {
  employee: Employee | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function EmployeeDetailsModal({ employee, isOpen, onClose }: EmployeeDetailsModalProps) {
  if (!employee) return null;

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Not provided";
    try {
      return format(new Date(dateString), "dd/MM/yyyy");
    } catch {
      return "Invalid date";
    }
  };

  const formatCurrency = (amount: string) => {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount)) return amount;
    return `£${numAmount.toLocaleString()}`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            {employee.firstName} {employee.lastName}
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Personal Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <User className="w-4 h-4" />
                Personal Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-700">Full Name</p>
                  <p className="text-sm text-gray-900">{employee.firstName} {employee.lastName}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Gender</p>
                  <p className="text-sm text-gray-900">{employee.gender || "Not specified"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Date of Birth</p>
                  <p className="text-sm text-gray-900">{formatDate(employee.dateOfBirth)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Marital Status</p>
                  <p className="text-sm text-gray-900">{employee.maritalStatus || "Not specified"}</p>
                </div>
              </div>

              <Separator />

              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Contact Information</p>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-gray-500" />
                    <span className="text-sm">{employee.email}</span>
                  </div>
                  {employee.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-gray-500" />
                      <span className="text-sm">{employee.phone}</span>
                    </div>
                  )}
                  {employee.address && (
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-gray-500" />
                      <span className="text-sm">{employee.address}</span>
                    </div>
                  )}
                </div>
              </div>

              <Separator />

              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">National Insurance</p>
                <p className="text-sm text-gray-900">{employee.nationalInsuranceNumber || "Not provided"}</p>
              </div>

              {employee.emergencyContact && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">Emergency Contact</p>
                    <div className="space-y-1">
                      <p className="text-sm text-gray-900">{employee.emergencyContact.name}</p>
                      <p className="text-sm text-gray-600">{employee.emergencyContact.phone}</p>
                      <p className="text-sm text-gray-600">{employee.emergencyContact.relationship}</p>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Employment Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Building className="w-4 h-4" />
                Employment Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-700">Job Title</p>
                  <p className="text-sm text-gray-900">{employee.employment.jobTitle}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Department</p>
                  <p className="text-sm text-gray-900">{employee.employment.department}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Manager</p>
                  <p className="text-sm text-gray-900">{employee.employment.manager || "Not assigned"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Employment Status</p>
                  <Badge variant={employee.employment.status === 'active' ? 'default' : 'secondary'}>
                    {employee.employment.employmentStatus}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Start Date</p>
                  <p className="text-sm text-gray-900">{formatDate(employee.employment.startDate)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Location</p>
                  <p className="text-sm text-gray-900">{employee.employment.location}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Weekly Hours</p>
                  <p className="text-sm text-gray-900">{employee.employment.weeklyHours || "Not specified"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Company</p>
                  <p className="text-sm text-gray-900">{employee.company.name}</p>
                </div>
              </div>

              <Separator />

              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Compensation</p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Base Salary</p>
                    <p className="text-sm font-medium text-gray-900">{formatCurrency(employee.employment.baseSalary)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Pay Frequency</p>
                    <p className="text-sm font-medium text-gray-900">{employee.employment.payFrequency}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Payment Method</p>
                    <p className="text-sm font-medium text-gray-900">{employee.employment.paymentMethod || "Not specified"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Tax Code</p>
                    <p className="text-sm font-medium text-gray-900">{employee.employment.taxCode || "Not specified"}</p>
                  </div>
                </div>
              </div>

              {employee.employment.benefits && employee.employment.benefits.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">Benefits</p>
                    <div className="flex flex-wrap gap-2">
                      {employee.employment.benefits.map((benefit, index) => (
                        <Badge key={index} variant="outline">{benefit}</Badge>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* VISA/Immigration Information */}
          {(employee.passportNumber || employee.visaCategory || employee.dbsCertificateNumber) && (
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Shield className="w-4 h-4" />
                  VISA & Immigration Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {employee.passportNumber && (
                    <div>
                      <p className="text-sm font-medium text-gray-700">Passport Number</p>
                      <p className="text-sm text-gray-900">{employee.passportNumber}</p>
                    </div>
                  )}
                  {employee.passportIssueDate && (
                    <div>
                      <p className="text-sm font-medium text-gray-700">Passport Issue Date</p>
                      <p className="text-sm text-gray-900">{formatDate(employee.passportIssueDate)}</p>
                    </div>
                  )}
                  {employee.passportExpiryDate && (
                    <div>
                      <p className="text-sm font-medium text-gray-700">Passport Expiry Date</p>
                      <p className="text-sm text-gray-900">{formatDate(employee.passportExpiryDate)}</p>
                    </div>
                  )}
                  {employee.visaCategory && (
                    <div>
                      <p className="text-sm font-medium text-gray-700">VISA Category</p>
                      <p className="text-sm text-gray-900">{employee.visaCategory}</p>
                    </div>
                  )}
                  {employee.visaIssueDate && (
                    <div>
                      <p className="text-sm font-medium text-gray-700">VISA Issue Date</p>
                      <p className="text-sm text-gray-900">{formatDate(employee.visaIssueDate)}</p>
                    </div>
                  )}
                  {employee.visaExpiryDate && (
                    <div>
                      <p className="text-sm font-medium text-gray-700">VISA Expiry Date</p>
                      <p className="text-sm text-gray-900">{formatDate(employee.visaExpiryDate)}</p>
                    </div>
                  )}
                  {employee.dbsCertificateNumber && (
                    <div>
                      <p className="text-sm font-medium text-gray-700">DBS Certificate Number</p>
                      <p className="text-sm text-gray-900">{employee.dbsCertificateNumber}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}