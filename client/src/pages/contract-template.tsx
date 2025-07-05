import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Upload, 
  Download, 
  FileText, 
  Eye, 
  CheckCircle, 
  AlertCircle, 
  Calendar,
  Trash2,
  Settings
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Breadcrumb from "@/components/breadcrumb";
import PageHeader from "@/components/page-header";

interface ContractTemplate {
  id: string;
  name: string;
  fileName: string;
  uploadedDate: string;
  uploadedBy: string;
  version: number;
  isActive: boolean;
  fileSize: string;
  description?: string;
}

export default function ContractTemplatePage() {
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [templateName, setTemplateName] = useState("");
  const [templateDescription, setTemplateDescription] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Mock data for demonstration
  const mockTemplates: ContractTemplate[] = [
    {
      id: "1",
      name: "Standard Employment Contract",
      fileName: "standard_contract_v3.docx",
      uploadedDate: "2024-01-15",
      uploadedBy: "Leo Kaluza",
      version: 3,
      isActive: true,
      fileSize: "45 KB",
      description: "Standard employment contract template with all required clauses"
    },
    {
      id: "2",
      name: "Senior Position Contract",
      fileName: "senior_contract_v2.docx",
      uploadedDate: "2024-01-10",
      uploadedBy: "Leo Kaluza",
      version: 2,
      isActive: false,
      fileSize: "52 KB",
      description: "Contract template for senior positions with additional benefits"
    },
    {
      id: "3",
      name: "Temporary Contract",
      fileName: "temp_contract_v1.docx",
      uploadedDate: "2024-01-05",
      uploadedBy: "Leo Kaluza",
      version: 1,
      isActive: false,
      fileSize: "38 KB",
      description: "Template for temporary employment contracts"
    }
  ];

  const templates = mockTemplates;
  const activeTemplate = templates.find(t => t.isActive);

  const uploadMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      return { success: true, id: Date.now().toString() };
    },
    onSuccess: () => {
      toast({
        title: "Template uploaded successfully",
        description: "The contract template has been uploaded and is now active.",
      });
      setUploadFile(null);
      setTemplateName("");
      setTemplateDescription("");
    },
    onError: () => {
      toast({
        title: "Upload failed",
        description: "Failed to upload the contract template. Please try again.",
        variant: "destructive",
      });
    }
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
        setUploadFile(file);
        if (!templateName) {
          setTemplateName(file.name.replace(/\.[^/.]+$/, ""));
        }
      } else {
        toast({
          title: "Invalid file type",
          description: "Please upload a .docx file only.",
          variant: "destructive",
        });
      }
    }
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (event: React.DragEvent) => {
    event.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    setDragOver(false);
    
    const file = event.dataTransfer.files[0];
    if (file && file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
      setUploadFile(file);
      if (!templateName) {
        setTemplateName(file.name.replace(/\.[^/.]+$/, ""));
      }
    } else {
      toast({
        title: "Invalid file type",
        description: "Please upload a .docx file only.",
        variant: "destructive",
      });
    }
  };

  const handleUpload = () => {
    if (!uploadFile || !templateName) {
      toast({
        title: "Missing information",
        description: "Please select a file and provide a template name.",
        variant: "destructive",
      });
      return;
    }

    const formData = new FormData();
    formData.append("file", uploadFile);
    formData.append("name", templateName);
    formData.append("description", templateDescription);

    uploadMutation.mutate(formData);
  };

  const handleDownload = (template: ContractTemplate) => {
    // Simulate download
    const link = document.createElement('a');
    link.href = '#';
    link.download = template.fileName;
    link.click();
    
    toast({
      title: "Download started",
      description: `Downloading ${template.fileName}...`,
    });
  };

  const handleSetActive = (templateId: string) => {
    toast({
      title: "Template activated",
      description: "The selected template is now active and will be used for new contracts.",
    });
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Breadcrumb */}
      <Breadcrumb 
        items={[
          { label: "Contracts", href: "/contracts", icon: FileText },
          { label: "Contract Template", icon: Settings }
        ]} 
      />

      {/* Header */}
      <PageHeader 
        title="Contract Template Management"
        description="Upload and manage contract templates for generating employment contracts"
      />

      {/* Main Content */}
      <main className="flex-1 p-6 space-y-6">
        {/* Current Active Template */}
        {activeTemplate && (
          <Card className="bg-white shadow-md border border-gray-200">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span>Current Active Template</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center space-x-4">
                  <FileText className="w-12 h-12 text-green-600" />
                  <div>
                    <h3 className="font-medium text-gray-900">{activeTemplate.name}</h3>
                    <p className="text-sm text-gray-600">{activeTemplate.description}</p>
                    <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                      <span>Version {activeTemplate.version}</span>
                      <span>{activeTemplate.fileSize}</span>
                      <span>Uploaded {activeTemplate.uploadedDate}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="sm" onClick={() => handleDownload(activeTemplate)}>
                    <Eye className="w-4 h-4 mr-2" />
                    View
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleDownload(activeTemplate)}>
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Upload New Template */}
        <Card className="bg-white shadow-md border border-gray-200">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Upload className="w-5 h-5" />
              <span>Upload New Template</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Upload a .docx file that will be used as the template for generating employment contracts. 
                The new template will become active immediately upon upload.
              </AlertDescription>
            </Alert>

            <div className="space-y-4">
              <div>
                <Label htmlFor="template-name">Template Name</Label>
                <Input
                  id="template-name"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  placeholder="Enter template name..."
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="template-description">Description (Optional)</Label>
                <Input
                  id="template-description"
                  value={templateDescription}
                  onChange={(e) => setTemplateDescription(e.target.value)}
                  placeholder="Brief description of the template..."
                  className="mt-1"
                />
              </div>

              <div>
                <Label>Template File</Label>
                <div
                  className={`mt-1 border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                    dragOver
                      ? "border-blue-400 bg-blue-50"
                      : uploadFile
                      ? "border-green-400 bg-green-50"
                      : "border-gray-300 hover:border-gray-400"
                  }`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  {uploadFile ? (
                    <div className="space-y-2">
                      <FileText className="w-12 h-12 text-green-600 mx-auto" />
                      <p className="text-sm font-medium text-gray-900">{uploadFile.name}</p>
                      <p className="text-xs text-gray-500">
                        {(uploadFile.size / 1024).toFixed(1)} KB
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setUploadFile(null)}
                      >
                        Remove
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Upload className="w-12 h-12 text-gray-400 mx-auto" />
                      <p className="text-sm text-gray-600">
                        Drop your .docx file here or{" "}
                        <label className="text-blue-600 hover:text-blue-700 cursor-pointer">
                          browse
                          <input
                            type="file"
                            accept=".docx"
                            onChange={handleFileSelect}
                            className="hidden"
                          />
                        </label>
                      </p>
                      <p className="text-xs text-gray-500">Only .docx files are supported</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end space-x-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setUploadFile(null);
                    setTemplateName("");
                    setTemplateDescription("");
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleUpload}
                  disabled={!uploadFile || !templateName || uploadMutation.isPending}
                >
                  {uploadMutation.isPending ? "Uploading..." : "Upload Template"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Template Version History */}
        <Card className="bg-white shadow-md border border-gray-200">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Calendar className="w-5 h-5" />
              <span>Template Version History</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Template Name</TableHead>
                    <TableHead>Version</TableHead>
                    <TableHead>File Size</TableHead>
                    <TableHead>Upload Date</TableHead>
                    <TableHead>Uploaded By</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {templates.map((template) => (
                    <TableRow key={template.id} className="hover:bg-gray-50">
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <FileText className="w-5 h-5 text-gray-500" />
                          <div>
                            <div className="font-medium text-gray-900">{template.name}</div>
                            {template.description && (
                              <div className="text-sm text-gray-500">{template.description}</div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">v{template.version}</Badge>
                      </TableCell>
                      <TableCell className="text-gray-900">{template.fileSize}</TableCell>
                      <TableCell className="text-gray-900">{template.uploadedDate}</TableCell>
                      <TableCell className="text-gray-900">{template.uploadedBy}</TableCell>
                      <TableCell>
                        {template.isActive ? (
                          <Badge className="bg-green-100 text-green-800">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Active
                          </Badge>
                        ) : (
                          <Badge variant="outline">Inactive</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDownload(template)}
                            title="Download"
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                          {!template.isActive && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleSetActive(template.id)}
                              title="Set as Active"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            title="Delete"
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}