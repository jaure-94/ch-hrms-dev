import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertCompanySchema, insertEmployeeSchema, insertEmploymentSchema, contractTemplates } from "@shared/schema";
import { z } from "zod";
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from "docx";
import { db } from "./db";
import { eq } from "drizzle-orm";

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
      const { templateId, templateContent, templateName, noticeWeeks, contractDate, probationPeriod } = req.body;
      
      if (!templateContent) {
        return res.status(400).json({ message: "No active contract template found. Please upload a template first." });
      }

      // Convert base64 template content back to binary
      const templateBuffer = Buffer.from(templateContent, 'base64');

      // Create variable mapping from employee data
      const variables = {
        // Employee variables
        firstName: employee.firstName || '',
        lastName: employee.lastName || '',
        // Specific mappings as requested
        employeeFirstName: employee.firstName || '',
        employeeLastName: employee.lastName || '',
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
        
        // Company variables - Parse address properly for UK format
        companyName: employee.company?.name || '',
        companyAddress: employee.company?.address || '',
        companyAddressStreet1: (() => {
          const addressLines = employee.company?.address?.split('\n') || [];
          return addressLines[0] || '';
        })(),
        companyAddressStreet2: (() => {
          const addressLines = employee.company?.address?.split('\n') || [];
          return addressLines[1] || '';
        })(),
        companyPhone: employee.company?.phone || '',
        companyEmail: employee.company?.email || '',
        companyWebsite: employee.company?.website || '',
        companyIndustry: employee.company?.industry || '',
        companySize: employee.company?.size || '',
        
        // Additional company address variables (parsed from single address field)
        companyAddressCity: (() => {
          const address = employee.company?.address || '';
          // Try to extract city from address patterns like "City, County" or "City, PostCode"
          const cityMatch = address.match(/([^,\n]+),\s*([A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}|\w+\s*\d)/);
          return cityMatch ? cityMatch[1].trim() : 'London';
        })(),
        comanyAddressCity: (() => {
          // Handle typo in template - same logic as above
          const address = employee.company?.address || '';
          const cityMatch = address.match(/([^,\n]+),\s*([A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}|\w+\s*\d)/);
          return cityMatch ? cityMatch[1].trim() : 'London';
        })(),
        companyAddressPostcode: (() => {
          const address = employee.company?.address || '';
          // Extract UK postcode pattern
          const postcodeMatch = address.match(/([A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2})/);
          return postcodeMatch ? postcodeMatch[1].trim() : 'SW1A 1AA';
        })(),
        companyAddressCountry: 'United Kingdom',
        companyAddressCounty: (() => {
          const address = employee.company?.address || '';
          // Try to extract county or state from address
          const countyMatch = address.match(/,\s*([^,\n]+),\s*([A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2})/);
          return countyMatch ? countyMatch[1].trim() : 'Greater London';
        })(),
        
        // Additional formatted variables
        currentDate: new Date().toLocaleDateString(),
        currentYear: new Date().getFullYear().toString(),
        
        // Contract-specific variables
        noticeWeeks: noticeWeeks || '4',
        contractDate: contractDate || new Date().toLocaleDateString(),
        probationPeriod: probationPeriod || '',
        employeeAddress: employee.address || '',
        
        // Common template variables with variations
        employee_first_name: employee.firstName || '',
        employee_last_name: employee.lastName || '',
        employee_full_name: `${employee.firstName || ''} ${employee.lastName || ''}`.trim(),
        employee_email: employee.email || '',
        employee_phone: employee.phone || '',
        employee_address: employee.address || '',
        
        // Job-related variables
        job_title: employee.employment?.jobTitle || '',
        employment_start_date: employee.employment?.startDate ? new Date(employee.employment.startDate).toLocaleDateString() : '',
        employment_end_date: employee.employment?.endDate ? new Date(employee.employment.endDate).toLocaleDateString() : '',
        salary: employee.employment?.baseSalary || '0',
        annual_salary: employee.employment?.baseSalary || '0',
        base_salary: employee.employment?.baseSalary || '0',
        
        // Company info variations
        company_name: employee.company?.name || '',
        company_address: employee.company?.address || '',
        company_city: employee.company?.city || 'London',
        company_postcode: employee.company?.postcode || '',
        company_country: employee.company?.country || 'United Kingdom',
        
        // Additional common template variables
        vacationWeeks: '4', // Standard UK vacation weeks
        vacationDays: '20', // Standard UK vacation days (4 weeks x 5 days)
        workingDays: '5', // Standard working days per week
        workingWeeks: '52', // Standard working weeks per year
        pensionContribution: '3%', // UK minimum pension contribution
        sickLeave: '28 weeks', // UK statutory sick leave
        maternityLeave: '52 weeks', // UK maternity leave
        paternityLeave: '2 weeks', // UK paternity leave
        
        // Legal and compliance variables
        minimumWage: '10.42', // UK minimum wage per hour
        livingWage: '12.00', // UK living wage per hour
        employerReference: employee.company?.name || '',
        hrContact: employee.company?.email || '',
        tribunalJurisdiction: 'England and Wales',
        
        // Benefits and perks
        healthInsurance: 'Included',
        lifeInsurance: 'Included',
        dentalCare: 'Optional',
        gymMembership: 'Optional',
        companyPhone: 'Optional',
        companyLaptop: 'Provided',
        parkingSpace: 'Available',
        workFromHome: 'Hybrid',
      };

      // Use docx-templates for proper DOCX variable replacement with formatting preservation
      console.log('Processing contract template:');
      console.log('- Template buffer size:', templateBuffer.length);
      console.log('- Available variables:', Object.keys(variables));
      console.log('- Sample variable values:', {
        firstName: variables.firstName,
        lastName: variables.lastName,
        companyName: variables.companyName,
        jobTitle: variables.jobTitle,
        baseSalary: variables.baseSalary
      });
      
      let buffer;
      try {
        console.log('Using docx-templates for variable replacement...');
        const { createReport } = await import('docx-templates');
        
        // Convert template buffer to Uint8Array as required by docx-templates
        const templateArray = new Uint8Array(templateBuffer);
        
        // Create report with proper configuration
        buffer = await createReport({
          template: templateArray,
          data: {
            ...variables,
            currentDate: new Date().toLocaleDateString('en-GB'),
            currentYear: new Date().getFullYear().toString()
          },
          // Use {{ }} delimiters as shown in the reference implementation
          cmdDelimiter: ['{{', '}}'],
          processLineBreaks: true,
        });
        
        console.log('docx-templates processing completed successfully');
        console.log('Output buffer size:', buffer.length);
        
      } catch (error) {
        console.error('Error using docx-templates:', error);
        console.error('Error details:', error.message);
        console.error('Error stack:', error.stack);
        
        // Return error instead of fallback
        throw new Error(`Failed to process contract template: ${error.message}`);
      }



      // Save contract to database
      const contractData = {
        employeeId: employee.id,
        companyId: employee.companyId,
        templateId: templateId || 'template-1',
        templateName: templateName || 'Employment Contract Template',
        fileName: `${employee.firstName}_${employee.lastName}_Contract.docx`,
        fileContent: buffer.toString('base64'),
        noticeWeeks: noticeWeeks ? parseInt(noticeWeeks) : null,
        contractDate: contractDate ? new Date(contractDate) : null,
        probationPeriod: probationPeriod || null,
      };

      const contract = await storage.createContract(contractData);
      
      // Return success response instead of downloading file
      res.json({ 
        success: true, 
        message: "Contract generated successfully",
        contractId: contract.id,
        fileName: `${employee.firstName}_${employee.lastName}_Contract.docx`
      });
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

  app.delete("/api/contracts/:id", async (req, res) => {
    try {
      const contract = await storage.getContract(req.params.id);
      if (!contract) {
        return res.status(404).json({ message: "Contract not found" });
      }

      await storage.deleteContract(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error('Delete contract error:', error);
      res.status(500).json({ message: "Failed to delete contract" });
    }
  });

  // Contract Template routes
  app.get("/api/companies/:companyId/contract-templates", async (req, res) => {
    try {
      const templates = await storage.getContractTemplatesByCompany(req.params.companyId);
      res.json(templates);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch contract templates" });
    }
  });

  app.get("/api/companies/:companyId/contract-templates/active", async (req, res) => {
    try {
      const template = await storage.getActiveContractTemplate(req.params.companyId);
      if (!template) {
        return res.status(404).json({ message: "No active contract template found" });
      }
      res.json(template);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch active contract template" });
    }
  });

  app.post("/api/companies/:companyId/contract-templates", async (req, res) => {
    try {
      const { name, fileName, fileContent, fileSize, description, uploadedBy } = req.body;
      
      if (!name || !fileName || !fileContent || !fileSize || !uploadedBy) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      // First, deactivate all existing templates for this company
      await db.update(contractTemplates).set({ isActive: false }).where(eq(contractTemplates.companyId, req.params.companyId));

      const template = await storage.createContractTemplate({
        companyId: req.params.companyId,
        name,
        fileName,
        fileContent,
        fileSize,
        description,
        uploadedBy,
        isActive: true, // New template becomes active by default
      });

      res.status(201).json(template);
    } catch (error) {
      console.error("Error creating contract template:", error);
      res.status(500).json({ message: "Failed to create contract template", error: error.message });
    }
  });

  app.put("/api/contract-templates/:id/activate", async (req, res) => {
    try {
      const template = await storage.getContractTemplate(req.params.id);
      if (!template) {
        return res.status(404).json({ message: "Contract template not found" });
      }

      await storage.setActiveContractTemplate(template.companyId, req.params.id);
      res.json({ message: "Contract template activated successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to activate contract template" });
    }
  });

  app.delete("/api/contract-templates/:id", async (req, res) => {
    try {
      const template = await storage.getContractTemplate(req.params.id);
      if (!template) {
        return res.status(404).json({ message: "Contract template not found" });
      }

      await storage.deleteContractTemplate(req.params.id);
      res.json({ message: "Contract template deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete contract template" });
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
