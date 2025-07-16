import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Download, FileText, Calendar, User, Building, MapPin } from "lucide-react";
import { format } from "date-fns";

interface ContractViewModalProps {
  contract: any;
  isOpen: boolean;
  onClose: () => void;
  onDownload: (contractId: string) => void;
}

export default function ContractViewModal({ contract, isOpen, onClose, onDownload }: ContractViewModalProps) {
  const [isDownloading, setIsDownloading] = useState(false);

  if (!contract) return null;

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      await onDownload(contract.id);
    } finally {
      setIsDownloading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'expired':
        return 'bg-red-100 text-red-800';
      case 'terminated':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <DialogTitle className="flex items-center space-x-2">
            <FileText className="w-5 h-5" />
            <span>Employment Contract Details</span>
          </DialogTitle>
          <div className="flex items-center space-x-2">
            <Badge className={getStatusColor(contract.status || 'active')}>
              {contract.status || 'Active'}
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownload}
              disabled={isDownloading}
            >
              <Download className="w-4 h-4 mr-2" />
              {isDownloading ? 'Downloading...' : 'Download'}
            </Button>
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-6">
            {/* Contract Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <FileText className="w-4 h-4" />
                  <span>Contract Overview</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Template Name</p>
                    <p className="font-medium">{contract.templateName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">File Name</p>
                    <p className="font-medium">{contract.fileName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Generated Date</p>
                    <p className="font-medium">
                      {contract.generatedAt 
                        ? format(new Date(contract.generatedAt), 'PPP')
                        : 'N/A'
                      }
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Status</p>
                    <Badge className={getStatusColor(contract.status || 'active')}>
                      {contract.status || 'Active'}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Employee Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <User className="w-4 h-4" />
                  <span>Employee Information</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Full Name</p>
                    <p className="font-medium">
                      {contract.employee?.firstName} {contract.employee?.lastName}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Email</p>
                    <p className="font-medium">{contract.employee?.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Job Title</p>
                    <p className="font-medium">{contract.employee?.employment?.jobTitle}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Department</p>
                    <p className="font-medium">{contract.employee?.employment?.department}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Start Date</p>
                    <p className="font-medium">
                      {contract.employee?.employment?.startDate 
                        ? format(new Date(contract.employee.employment.startDate), 'PPP')
                        : 'N/A'
                      }
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Base Salary</p>
                    <p className="font-medium">
                      £{contract.employee?.employment?.baseSalary 
                        ? Number(contract.employee.employment.baseSalary).toLocaleString()
                        : 'N/A'
                      }
                      <span className="text-sm text-gray-500 ml-1">
                        /{contract.employee?.employment?.payFrequency?.toLowerCase() || 'year'}
                      </span>
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Company Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Building className="w-4 h-4" />
                  <span>Company Information</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Company Name</p>
                    <p className="font-medium">{contract.company?.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Industry</p>
                    <p className="font-medium">{contract.company?.industry || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Address</p>
                    <p className="font-medium">{contract.company?.address || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Work Location</p>
                    <p className="font-medium">{contract.employee?.employment?.location || 'N/A'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Contract Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4" />
                  <span>Contract Details</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Employment Status</p>
                    <p className="font-medium">{contract.employee?.employment?.employmentStatus || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Weekly Hours</p>
                    <p className="font-medium">{contract.employee?.employment?.weeklyHours || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Payment Method</p>
                    <p className="font-medium">{contract.employee?.employment?.paymentMethod || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Manager</p>
                    <p className="font-medium">{contract.employee?.employment?.manager || 'N/A'}</p>
                  </div>
                  {contract.employee?.employment?.benefits && (
                    <div className="md:col-span-2">
                      <p className="text-sm text-gray-600">Benefits</p>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {contract.employee.employment.benefits.map((benefit: string, index: number) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {benefit}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Document Note */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <FileText className="w-4 h-4" />
                  <span>
                    This contract was generated automatically using the employment template. 
                    Download the document for the complete contract with all terms and conditions.
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}