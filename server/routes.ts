import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertCompanySchema, insertEmployeeSchema, insertEmploymentSchema } from "@shared/schema";
import { z } from "zod";
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from "docx";

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
  
  // Company
  companyId: z.string().uuid("Invalid company ID"),
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Company routes
  app.get("/api/companies", async (req, res) => {
    try {
      const companies = await storage.getCompanies();
      res.json(companies);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch companies" });
    }
  });

  app.get("/api/companies/:id", async (req, res) => {
    try {
      const company = await storage.getCompany(req.params.id);
      if (!company) {
        return res.status(404).json({ message: "Company not found" });
      }
      res.json(company);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch company" });
    }
  });

  app.post("/api/companies", async (req, res) => {
    try {
      const validatedData = insertCompanySchema.parse(req.body);
      const company = await storage.createCompany(validatedData);
      res.status(201).json(company);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid company data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create company" });
    }
  });

  // Employee routes
  app.get("/api/companies/:companyId/employees", async (req, res) => {
    try {
      const { companyId } = req.params;
      const { search } = req.query;
      
      let employees;
      if (search && typeof search === 'string') {
        employees = await storage.searchEmployees(companyId, search);
      } else {
        employees = await storage.getEmployeesByCompany(companyId);
      }
      
      res.json(employees);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch employees" });
    }
  });

  app.get("/api/employees/:id", async (req, res) => {
    try {
      const employee = await storage.getEmployeeWithEmployment(req.params.id);
      if (!employee) {
        return res.status(404).json({ message: "Employee not found" });
      }
      res.json(employee);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch employee" });
    }
  });

  app.post("/api/employees", async (req, res) => {
    try {
      const validatedData = employeeFormSchema.parse(req.body);
      
      const employeeData = {
        companyId: validatedData.companyId,
        firstName: validatedData.firstName,
        lastName: validatedData.lastName,
        email: validatedData.email,
        phone: validatedData.phoneNumber,
        address: validatedData.address,
        dateOfBirth: validatedData.dateOfBirth ? new Date(validatedData.dateOfBirth) : undefined,
        nationalInsuranceNumber: validatedData.nationalInsuranceNumber,
        gender: validatedData.gender,
        maritalStatus: validatedData.maritalStatus,
        emergencyContact: {
          name: validatedData.emergencyContactName,
          phone: validatedData.emergencyContactPhone,
          relationship: validatedData.emergencyContactRelationship,
        },
        // VISA/Immigration fields
        passportNumber: validatedData.passportNumber,
        passportIssueDate: validatedData.passportIssueDate ? new Date(validatedData.passportIssueDate) : undefined,
        passportExpiryDate: validatedData.passportExpiryDate ? new Date(validatedData.passportExpiryDate) : undefined,
        visaIssueDate: validatedData.visaIssueDate ? new Date(validatedData.visaIssueDate) : undefined,
        visaExpiryDate: validatedData.visaExpiryDate ? new Date(validatedData.visaExpiryDate) : undefined,
        visaCategory: validatedData.visaCategory,
        dbsCertificateNumber: validatedData.dbsCertificateNumber,
      };

      const employmentData = {
        companyId: validatedData.companyId,
        employeeId: "", // Will be set by the storage method
        jobTitle: validatedData.jobTitle,
        department: validatedData.department,
        manager: validatedData.manager,
        employmentStatus: validatedData.employmentStatus,
        baseSalary: validatedData.baseSalary,
        payFrequency: validatedData.payFrequency,
        startDate: new Date(validatedData.startDate),
        location: validatedData.location,
        weeklyHours: validatedData.weeklyHours,
        paymentMethod: validatedData.paymentMethod,
        taxCode: validatedData.taxCode,
        benefits: validatedData.benefits,
      };

      const employee = await storage.createEmployeeWithEmployment(employeeData, employmentData);
      res.status(201).json(employee);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid employee data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create employee" });
    }
  });

  app.put("/api/employees/:id", async (req, res) => {
    try {
      const validatedData = employeeFormSchema.partial().parse(req.body);
      
      const employeeData = {
        firstName: validatedData.firstName,
        lastName: validatedData.lastName,
        email: validatedData.email,
        phone: validatedData.phone,
        address: validatedData.address,
        dateOfBirth: validatedData.dateOfBirth ? new Date(validatedData.dateOfBirth) : undefined,
        emergencyContact: validatedData.emergencyContact,
      };

      const employee = await storage.updateEmployee(req.params.id, employeeData);
      
      if (validatedData.jobTitle || validatedData.department || validatedData.baseSalary) {
        const employment = await storage.getEmploymentByEmployee(req.params.id);
        if (employment) {
          const employmentData = {
            jobTitle: validatedData.jobTitle,
            department: validatedData.department,
            manager: validatedData.manager,
            employmentType: validatedData.employmentType,
            baseSalary: validatedData.baseSalary,
            payFrequency: validatedData.payFrequency,
            startDate: validatedData.startDate ? new Date(validatedData.startDate) : undefined,
            location: validatedData.location,
            benefits: validatedData.benefits,
          };
          await storage.updateEmployment(employment.id, employmentData);
        }
      }
      
      const updatedEmployee = await storage.getEmployeeWithEmployment(req.params.id);
      res.json(updatedEmployee);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid employee data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update employee" });
    }
  });

  app.delete("/api/employees/:id", async (req, res) => {
    try {
      const employment = await storage.getEmploymentByEmployee(req.params.id);
      if (employment) {
        await storage.deleteEmployment(employment.id);
      }
      await storage.deleteEmployee(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete employee" });
    }
  });

  // Contract generation route with template support
  app.post("/api/employees/:id/contract", async (req, res) => {
    try {
      const employee = await storage.getEmployeeWithEmployment(req.params.id);
      if (!employee) {
        return res.status(404).json({ message: "Employee not found" });
      }

      // Get the active template from request body or use localStorage approach
      const { templateId, templateContent, templateName } = req.body;
      
      if (!templateContent) {
        return res.status(400).json({ message: "No active contract template found. Please upload a template first." });
      }

      // Convert base64 template content back to binary
      const templateBuffer = Buffer.from(templateContent, 'base64');
      
      // Try to determine if this is a DOCX file or plain text
      let htmlContent = '';
      
      // Check if the buffer starts with DOCX file signature (PK)
      const isDocxFile = templateBuffer.length > 2 && templateBuffer[0] === 0x50 && templateBuffer[1] === 0x4B;
      
      if (isDocxFile) {
        try {
          const mammoth = await import('mammoth');
          const result = await mammoth.convertToHtml({ buffer: templateBuffer });
          htmlContent = result.value;
        } catch (error) {
          htmlContent = templateBuffer.toString('utf-8');
        }
      } else {
        htmlContent = templateBuffer.toString('utf-8');
      }

      // Create variable mapping from employee data
      const variables = {
        // Employee variables
        firstName: employee.firstName || '',
        lastName: employee.lastName || '',
        fullName: `${employee.firstName || ''} ${employee.lastName || ''}`.trim(),
        email: employee.email || '',
        phone: employee.phone || '',
        address: employee.address || '',
        dateOfBirth: employee.dateOfBirth ? new Date(employee.dateOfBirth).toLocaleDateString() : '',
        nationalInsuranceNumber: employee.nationalInsuranceNumber || '',
        gender: employee.gender || '',
        maritalStatus: employee.maritalStatus || '',
        emergencyContactName: employee.emergencyContactName || '',
        emergencyContactPhone: employee.emergencyContactPhone || '',
        emergencyContactRelationship: employee.emergencyContactRelationship || '',
        passportNumber: employee.passportNumber || '',
        passportIssueDate: employee.passportIssueDate ? new Date(employee.passportIssueDate).toLocaleDateString() : '',
        passportExpiryDate: employee.passportExpiryDate ? new Date(employee.passportExpiryDate).toLocaleDateString() : '',
        visaIssueDate: employee.visaIssueDate ? new Date(employee.visaIssueDate).toLocaleDateString() : '',
        visaExpiryDate: employee.visaExpiryDate ? new Date(employee.visaExpiryDate).toLocaleDateString() : '',
        visaCategory: employee.visaCategory || '',
        dbsCertificateNumber: employee.dbsCertificateNumber || '',
        
        // Employment variables
        jobTitle: employee.employment?.jobTitle || '',
        department: employee.employment?.department || '',
        manager: employee.employment?.manager || 'Management',
        employmentStatus: employee.employment?.employmentStatus || '',
        baseSalary: employee.employment?.baseSalary || '0',
        payFrequency: employee.employment?.payFrequency || '',
        startDate: employee.employment?.startDate ? new Date(employee.employment.startDate).toLocaleDateString() : '',
        endDate: employee.employment?.endDate ? new Date(employee.employment.endDate).toLocaleDateString() : '',
        location: employee.employment?.location || '',
        weeklyHours: employee.employment?.weeklyHours || '',
        paymentMethod: employee.employment?.paymentMethod || '',
        taxCode: employee.employment?.taxCode || '',
        benefits: employee.employment?.benefits ? employee.employment.benefits.join(', ') : '',
        status: employee.employment?.status || 'active',
        
        // Company variables
        companyName: employee.company?.name || '',
        companyAddress: employee.company?.address || '',
        companyPhone: employee.company?.phone || '',
        companyEmail: employee.company?.email || '',
        companyWebsite: employee.company?.website || '',
        companyIndustry: employee.company?.industry || '',
        companySize: employee.company?.size || '',
        
        // Additional formatted variables
        currentDate: new Date().toLocaleDateString(),
        currentYear: new Date().getFullYear().toString(),
      };

      // Replace variables in HTML content using {{variableName}} pattern
      Object.entries(variables).forEach(([key, value]) => {
        if (typeof key !== 'string') return;
        
        try {
          const patterns = [
            new RegExp(`{{${key}}}`, 'gi'),           // {{firstName}}
            new RegExp(`{{${key.toLowerCase()}}}`, 'gi'), // {{firstname}}
            new RegExp(`{{${key.replace(/([A-Z])/g, '_$1').toLowerCase().replace(/^_/, '')}}}`, 'gi'), // {{first_name}}
          ];
          
          patterns.forEach(pattern => {
            if (value !== undefined && value !== null) {
              htmlContent = htmlContent.replace(pattern, value.toString());
            } else {
              htmlContent = htmlContent.replace(pattern, '');
            }
          });
        } catch (error) {
          // Skip problematic keys silently
        }
      });

      // Convert HTML back to DOCX
      const Document = (await import('docx')).Document;
      const Packer = (await import('docx')).Packer;
      const Paragraph = (await import('docx')).Paragraph;
      const TextRun = (await import('docx')).TextRun;

      // Simple HTML to text conversion for now (for basic templates)
      const textContent = htmlContent
        .replace(/<[^>]*>/g, '') // Remove HTML tags
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .trim();

      // Create new document with processed content
      const doc = new Document({
        sections: [
          {
            properties: {},
            children: textContent.split('\n').filter(line => line.trim()).map(line => 
              new Paragraph({
                children: [
                  new TextRun({
                    text: line,
                  }),
                ],
              })
            ),
          },
        ],
      });

      const buffer = await Packer.toBuffer(doc);

      // Save contract to database
      const contractData = {
        employeeId: employee.id,
        companyId: employee.companyId,
        templateId: templateId || 'template-1',
        templateName: templateName || 'Employment Contract Template',
        fileName: `${employee.firstName}_${employee.lastName}_Contract.docx`,
        fileContent: buffer.toString('base64'),
      };

      await storage.createContract(contractData);
      
      // Send the generated contract file
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
      res.setHeader('Content-Disposition', `attachment; filename="${employee.firstName}_${employee.lastName}_Contract.docx"`);
      res.send(buffer);
    } catch (error) {
      console.error('Contract generation error:', error);
      res.status(500).json({ message: "Failed to generate contract", error: error.message });
    }
  });

  // Contract routes
  app.get("/api/companies/:companyId/contracts", async (req, res) => {
    try {
      const contracts = await storage.getContractsByCompany(req.params.companyId);
      res.json(contracts);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch contracts" });
    }
  });

  app.get("/api/contracts/:id", async (req, res) => {
    try {
      const contract = await storage.getContract(req.params.id);
      if (!contract) {
        return res.status(404).json({ message: "Contract not found" });
      }
      res.json(contract);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch contract" });
    }
  });

  app.get("/api/contracts/:id/download", async (req, res) => {
    try {
      const contract = await storage.getContract(req.params.id);
      if (!contract) {
        return res.status(404).json({ message: "Contract not found" });
      }

      const buffer = Buffer.from(contract.fileContent, 'base64');
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
      res.setHeader('Content-Disposition', `attachment; filename="${contract.fileName}"`);
      res.send(buffer);
    } catch (error) {
      res.status(500).json({ message: "Failed to download contract" });
    }
  });

  // Dashboard stats route
  app.get("/api/companies/:companyId/stats", async (req, res) => {
    try {
      const employees = await storage.getEmployeesByCompany(req.params.companyId);
      const stats = {
        totalEmployees: employees.length,
        activeContracts: employees.filter(e => e.employment.status === 'active').length,
        pendingOnboarding: employees.filter(e => e.employment.status === 'pending').length,
        contractRenewals: 0, // This would need additional logic based on contract end dates
      };
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
