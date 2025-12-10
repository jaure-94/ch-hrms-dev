import { useState, useEffect } from "react";
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
  Settings,
  FileDown
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Breadcrumb from "@/components/breadcrumb";
import PageHeader from "@/components/page-header";
import { authenticatedApiRequest, useAuth } from "@/lib/auth";

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
  fileContent?: string; // Store base64 encoded file content
}

export default function ContractTemplatePage() {
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [templateName, setTemplateName] = useState("");
  const [templateDescription, setTemplateDescription] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  // Get company ID from authenticated user, fallback to hardcoded for demo
  const companyId = user?.company?.id || "68f11a7e-27ab-40eb-826e-3ce6d84874de";
  const uploadedBy = user ? `${user.firstName} ${user.lastName}`.trim() : 'Unknown User';

  // Load templates from database
  const { data: templates, isLoading: templatesLoading } = useQuery({
    queryKey: [`/api/companies/${companyId}/contract-templates`],
    queryFn: async () => {
      const response = await authenticatedApiRequest('GET', `/api/companies/${companyId}/contract-templates`);
      return response.json();
    },
    enabled: !!companyId,
  });

  // Migrate existing localStorage data to database on component mount
  useEffect(() => {
    const migrateLocalStorageData = async () => {
      const savedTemplates = localStorage.getItem('contractTemplates');
      if (savedTemplates && companyId) {
        try {
          const parsedTemplates = JSON.parse(savedTemplates);
          
          // Only migrate if we have templates in localStorage and none in database
          if (parsedTemplates.length > 0 && (!templates || templates.length === 0)) {
            for (const template of parsedTemplates) {
              if (template.fileContent) {
                try {
                  await authenticatedApiRequest('POST', `/api/companies/${companyId}/contract-templates`, {
                    name: template.name,
                    fileName: template.fileName,
                    fileContent: template.fileContent,
                    fileSize: template.fileSize ? parseInt(template.fileSize) : 0,
                    description: template.description || '',
                    uploadedBy: template.uploadedBy || 'System Migration',
                  });
                } catch (error) {
                  console.error('Failed to migrate template:', template.name, error);
                }
              }
            }
            
            // Clear localStorage after successful migration
            localStorage.removeItem('contractTemplates');
            
            // Refetch templates
            queryClient.invalidateQueries({ queryKey: [`/api/companies/${companyId}/contract-templates`] });
            
            toast({
              title: "Templates migrated",
              description: "Your contract templates have been moved to the database.",
            });
          }
        } catch (error) {
          console.error('Error migrating templates:', error);
          // Clear corrupted data
          localStorage.removeItem('contractTemplates');
        }
      }
    };

    migrateLocalStorageData();
  }, [companyId, templates, queryClient, toast]);

  const activeTemplate = templates?.find(t => t.isActive);

  const uploadMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const file = formData.get('file') as File;
      const name = formData.get('name') as string;
      const description = formData.get('description') as string;
      
      if (!file || !name) {
        throw new Error('File and name are required');
      }

      // Convert file to base64 for storage using FileReader
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          resolve(result.split(',')[1]); // Remove data:application/...;base64, prefix
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      
      const response = await authenticatedApiRequest('POST', `/api/companies/${companyId}/contract-templates`, {
        name,
        fileName: file.name,
        fileContent: base64,
        fileSize: file.size,
        description: description || null,
        uploadedBy: uploadedBy,
      });

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Template uploaded successfully",
        description: "The contract template has been uploaded and is now active.",
      });
      setUploadFile(null);
      setTemplateName("");
      setTemplateDescription("");
      
      // Refetch templates
      queryClient.invalidateQueries({ queryKey: [`/api/companies/${companyId}/contract-templates`] });
    },
    onError: (error: any) => {
      console.error("Upload error:", error);
      const errorMessage = error?.message || "Failed to upload the contract template. Please try again.";
      toast({
        title: "Upload failed",
        description: errorMessage,
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
    try {
      if (!template.fileContent) {
        toast({
          title: "Download failed",
          description: "Template file content not available.",
          variant: "destructive",
        });
        return;
      }

      // Convert base64 back to binary and create download
      const byteCharacters = atob(template.fileContent);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { 
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' 
      });
      
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = template.fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast({
        title: "Download started",
        description: `Downloading ${template.fileName}...`,
      });
    } catch (error) {
      toast({
        title: "Download failed",
        description: "Failed to download the template file.",
        variant: "destructive",
      });
    }
  };

  const handleDownloadPDF = async (template: ContractTemplate) => {
    try {
      if (!template.fileContent) {
        toast({
          title: "PDF Generation Failed",
          description: "Template file content not available.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Generating PDF",
        description: "Converting Word document to PDF format...",
      });

      // Convert base64 back to binary
      const byteCharacters = atob(template.fileContent);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);

      // Import mammoth and pdf-lib
      const mammoth = await import('mammoth');
      const PDFLib = await import('pdf-lib');

      // Convert DOCX to HTML using mammoth
      const result = await mammoth.convertToHtml({ arrayBuffer: byteArray.buffer });
      const html = result.value;

      // Create PDF using pdf-lib
      const pdfDoc = await PDFLib.PDFDocument.create();
      const page = pdfDoc.addPage([612, 792]); // Standard letter size
      const fontSize = 12;
      
      // Simple HTML to text conversion (for basic content)
      const textContent = html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
      
      // Split text into lines that fit the page
      const maxWidth = 500;
      const lines = [];
      const words = textContent.split(' ');
      let currentLine = '';
      
      for (const word of words) {
        const testLine = currentLine + (currentLine ? ' ' : '') + word;
        const testWidth = testLine.length * (fontSize * 0.6); // Approximate width
        
        if (testWidth > maxWidth && currentLine) {
          lines.push(currentLine);
          currentLine = word;
        } else {
          currentLine = testLine;
        }
      }
      if (currentLine) lines.push(currentLine);

      // Add text to PDF
      const maxLinesPerPage = 60;
      const displayLines = lines.slice(0, maxLinesPerPage);
      
      for (let i = 0; i < displayLines.length; i++) {
        page.drawText(displayLines[i], {
          x: 50,
          y: 742 - (i * 14),
          size: fontSize,
        });
      }

      // If there's more content, add a note
      if (lines.length > maxLinesPerPage) {
        page.drawText('... (content truncated)', {
          x: 50,
          y: 742 - (maxLinesPerPage * 14),
          size: fontSize,
        });
      }

      // Generate PDF
      const pdfBytes = await pdfDoc.save();
      const pdfBlob = new Blob([pdfBytes], { type: 'application/pdf' });
      
      // Create download
      const pdfFileName = template.fileName.replace('.docx', '.pdf');
      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = pdfFileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: "PDF Download Started",
        description: `Downloading ${pdfFileName}...`,
      });
    } catch (error) {
      console.error('PDF generation error:', error);
      toast({
        title: "PDF Generation Failed",
        description: "Failed to convert the document to PDF. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleSetActive = async (templateId: string) => {
    try {
      await authenticatedApiRequest('PUT', `/api/contract-templates/${templateId}/activate`);

      toast({
        title: "Template activated",
        description: "The selected template is now active and will be used for new contracts.",
      });
      
      // Refetch templates
      queryClient.invalidateQueries({ queryKey: [`/api/companies/${companyId}/contract-templates`] });
    } catch (error) {
      toast({
        title: "Activation failed",
        description: "Failed to activate the contract template. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex flex-col h-full">
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
        {activeTemplate ? (
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
                  <Button variant="outline" size="sm">
                    <Eye className="w-4 h-4 mr-2" />
                    View
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleDownload(activeTemplate)}>
                    <Download className="w-4 h-4 mr-2" />
                    Download Word
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleDownloadPDF(activeTemplate)} className="text-red-600 hover:text-red-700 border-red-200 hover:border-red-300 hover:bg-red-50">
                    <FileDown className="w-4 h-4 mr-2" />
                    Download PDF
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="bg-white shadow-md border border-gray-200">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <AlertCircle className="w-5 h-5 text-amber-600" />
                <span>No Active Template</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center p-8 bg-amber-50 rounded-lg border border-amber-200">
                <div className="text-center">
                  <FileText className="w-16 h-16 text-amber-600 mx-auto mb-4" />
                  <h3 className="font-medium text-gray-900 mb-2">Upload your first contract template</h3>
                  <p className="text-sm text-gray-600">Upload a .docx file below to get started with contract generation.</p>
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
                  {templatesLoading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        <div className="flex items-center justify-center">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                          <span className="ml-2">Loading templates...</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : templates && templates.length > 0 ? (
                    templates.map((template) => (
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
                      <TableCell className="text-gray-900">{Math.round(template.fileSize / 1024)} KB</TableCell>
                      <TableCell className="text-gray-900">{new Date(template.createdAt).toLocaleDateString()}</TableCell>
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
                            title="Download Word Document"
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDownloadPDF(template)}
                            title="Download PDF"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <FileDown className="w-4 h-4" />
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
                  ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        <div className="flex flex-col items-center">
                          <FileText className="w-12 h-12 text-gray-300 mb-4" />
                          <span className="text-gray-500">No contract templates found. Upload your first template to get started.</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}