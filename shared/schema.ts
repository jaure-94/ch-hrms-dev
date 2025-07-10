import { pgTable, text, serial, uuid, timestamp, decimal, boolean, jsonb } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const companies = pgTable("companies", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  address: text("address"),
  phone: text("phone"),
  email: text("email"),
  website: text("website"),
  industry: text("industry"),
  size: text("size"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const employees = pgTable("employees", {
  id: uuid("id").primaryKey().defaultRandom(),
  companyId: uuid("company_id").references(() => companies.id).notNull(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  address: text("address"),
  dateOfBirth: timestamp("date_of_birth"),
  nationalInsuranceNumber: text("national_insurance_number"),
  gender: text("gender"),
  maritalStatus: text("marital_status"),
  emergencyContact: jsonb("emergency_contact"),
  // VISA/Immigration fields
  passportNumber: text("passport_number"),
  passportIssueDate: timestamp("passport_issue_date"),
  passportExpiryDate: timestamp("passport_expiry_date"),
  visaIssueDate: timestamp("visa_issue_date"),
  visaExpiryDate: timestamp("visa_expiry_date"),
  visaCategory: text("visa_category"),
  dbsCertificateNumber: text("dbs_certificate_number"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const employments = pgTable("employments", {
  id: uuid("id").primaryKey().defaultRandom(),
  employeeId: uuid("employee_id").references(() => employees.id).notNull(),
  companyId: uuid("company_id").references(() => companies.id).notNull(),
  jobTitle: text("job_title").notNull(),
  department: text("department").notNull(),
  manager: text("manager"),
  employmentStatus: text("employment_status").notNull(),
  baseSalary: decimal("base_salary", { precision: 10, scale: 2 }),
  payFrequency: text("pay_frequency"),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date"),
  location: text("location"),
  weeklyHours: text("weekly_hours"),
  paymentMethod: text("payment_method"),
  taxCode: text("tax_code"),
  benefits: jsonb("benefits"),
  status: text("status").default("active"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const contracts = pgTable("contracts", {
  id: uuid("id").primaryKey().defaultRandom(),
  employeeId: uuid("employee_id").references(() => employees.id).notNull(),
  companyId: uuid("company_id").references(() => companies.id).notNull(),
  templateId: text("template_id").notNull(),
  templateName: text("template_name").notNull(),
  fileName: text("file_name").notNull(),
  fileContent: text("file_content").notNull(), // Base64 encoded file content
  status: text("status").default("active"), // active, archived, expired
  generatedAt: timestamp("generated_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const companyRelations = relations(companies, ({ many }) => ({
  employees: many(employees),
  employments: many(employments),
  contracts: many(contracts),
}));

export const employeeRelations = relations(employees, ({ one, many }) => ({
  company: one(companies, {
    fields: [employees.companyId],
    references: [companies.id],
  }),
  employments: many(employments),
  contracts: many(contracts),
}));

export const employmentRelations = relations(employments, ({ one }) => ({
  employee: one(employees, {
    fields: [employments.employeeId],
    references: [employees.id],
  }),
  company: one(companies, {
    fields: [employments.companyId],
    references: [companies.id],
  }),
}));

export const contractRelations = relations(contracts, ({ one }) => ({
  employee: one(employees, {
    fields: [contracts.employeeId],
    references: [employees.id],
  }),
  company: one(companies, {
    fields: [contracts.companyId],
    references: [companies.id],
  }),
}));

export const insertCompanySchema = createInsertSchema(companies).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertEmployeeSchema = createInsertSchema(employees).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertEmploymentSchema = createInsertSchema(employments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertContractSchema = createInsertSchema(contracts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type Company = typeof companies.$inferSelect;
export type Employee = typeof employees.$inferSelect;
export type Employment = typeof employments.$inferSelect;
export type Contract = typeof contracts.$inferSelect;
export type InsertCompany = z.infer<typeof insertCompanySchema>;
export type InsertEmployee = z.infer<typeof insertEmployeeSchema>;
export type InsertEmployment = z.infer<typeof insertEmploymentSchema>;
export type InsertContract = z.infer<typeof insertContractSchema>;

export type EmployeeWithEmployment = Employee & {
  employment: Employment;
  company: Company;
};

export type ContractWithDetails = Contract & {
  employee: Employee;
  company: Company;
};
