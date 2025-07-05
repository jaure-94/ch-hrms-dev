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
  phone: z.string().optional(),
  address: z.string().optional(),
  dateOfBirth: z.string().optional(),
  emergencyContact: z.object({
    name: z.string().optional(),
    phone: z.string().optional(),
    relationship: z.string().optional(),
  }).optional(),
  
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
        phone: validatedData.phone,
        address: validatedData.address,
        dateOfBirth: validatedData.dateOfBirth ? new Date(validatedData.dateOfBirth) : undefined,
        emergencyContact: validatedData.emergencyContact,
      };

      const employmentData = {
        companyId: validatedData.companyId,
        employeeId: "", // Will be set by the storage method
        jobTitle: validatedData.jobTitle,
        department: validatedData.department,
        manager: validatedData.manager,
        employmentType: validatedData.employmentType,
        baseSalary: validatedData.baseSalary,
        payFrequency: validatedData.payFrequency,
        startDate: new Date(validatedData.startDate),
        location: validatedData.location,
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

  // Contract generation route
  app.post("/api/employees/:id/contract", async (req, res) => {
    try {
      const employee = await storage.getEmployeeWithEmployment(req.params.id);
      if (!employee) {
        return res.status(404).json({ message: "Employee not found" });
      }

      const doc = new Document({
        sections: [
          {
            properties: {},
            children: [
              new Paragraph({
                text: "EMPLOYMENT CONTRACT",
                heading: HeadingLevel.HEADING_1,
                alignment: AlignmentType.CENTER,
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: `\n\nThis Employment Contract is entered into between ${employee.company.name} (the "Company") and ${employee.firstName} ${employee.lastName} (the "Employee").`,
                    break: 2,
                  }),
                ],
              }),
              new Paragraph({
                text: "1. POSITION AND DUTIES",
                heading: HeadingLevel.HEADING_2,
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: `The Employee will serve as ${employee.employment.jobTitle} in the ${employee.employment.department} department, reporting to ${employee.employment.manager || "Management"}.`,
                  }),
                ],
              }),
              new Paragraph({
                text: "2. COMPENSATION",
                heading: HeadingLevel.HEADING_2,
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: `The Employee will receive a base salary of $${employee.employment.baseSalary} paid ${employee.employment.payFrequency}.`,
                  }),
                ],
              }),
              new Paragraph({
                text: "3. START DATE",
                heading: HeadingLevel.HEADING_2,
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: `Employment will commence on ${employee.employment.startDate?.toLocaleDateString()}.`,
                  }),
                ],
              }),
              new Paragraph({
                text: "4. LOCATION",
                heading: HeadingLevel.HEADING_2,
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: `The Employee will work at ${employee.employment.location}.`,
                  }),
                ],
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: "\n\nCompany: _________________________     Date: _____________",
                    break: 2,
                  }),
                ],
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: "\n\nEmployee: _________________________    Date: _____________",
                    break: 2,
                  }),
                ],
              }),
            ],
          },
        ],
      });

      const buffer = await Packer.toBuffer(doc);
      
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
      res.setHeader('Content-Disposition', `attachment; filename="${employee.firstName}_${employee.lastName}_Contract.docx"`);
      res.send(buffer);
    } catch (error) {
      res.status(500).json({ message: "Failed to generate contract" });
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
