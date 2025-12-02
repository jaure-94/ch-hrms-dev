import { pgTable, text, uuid, timestamp, decimal, boolean, jsonb, integer, index, pgEnum } from "drizzle-orm/pg-core";
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
  companyNumber: text("company_number"),
  setupCompleted: boolean("setup_completed").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const departments = pgTable("departments", {
  id: uuid("id").primaryKey().defaultRandom(),
  companyId: uuid("company_id").references(() => companies.id).notNull(),
  name: text("name").notNull(),
  departmentId: text("department_id").unique(), // Human-readable department identifier
  description: text("description"),
  managerId: uuid("manager_id"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const companySettings = pgTable("company_settings", {
  id: uuid("id").primaryKey().defaultRandom(),
  companyId: uuid("company_id").references(() => companies.id).notNull(),
  defaultNoticePeriodWeeks: integer("default_notice_period_weeks").default(4),
  workingHoursPerWeek: decimal("working_hours_per_week", { precision: 4, scale: 2 }).default("37.5"),
  workingDaysPerWeek: integer("working_days_per_week").default(5),
  publicHolidays: jsonb("public_holidays"), // Array of holiday dates
  leaveEntitlementDays: integer("leave_entitlement_days").default(25),
  probationPeriodMonths: integer("probation_period_months").default(6),
  currency: text("currency").default("GBP"),
  timezone: text("timezone").default("Europe/London"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const roles = pgTable("roles", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull().unique(), // superuser, admin, manager, employee
  description: text("description"),
  level: integer("level").notNull(), // 1=superuser, 2=admin, 3=manager, 4=employee
  permissions: jsonb("permissions").notNull(), // Array of permission strings
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  companyId: uuid("company_id").references(() => companies.id).notNull(),
  roleId: uuid("role_id").references(() => roles.id).notNull(),
  departmentId: uuid("department_id").references(() => departments.id), // Optional: department assignment
  employeeId: uuid("employee_id").references(() => employees.id), // Optional: links to employee record
  isActive: boolean("is_active").default(true),
  emailVerified: boolean("email_verified").default(false),
  emailVerificationToken: text("email_verification_token"),
  passwordResetToken: text("password_reset_token"),
  passwordResetTokenExpiry: timestamp("password_reset_token_expiry"),
  lastLoginAt: timestamp("last_login_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const refreshTokens = pgTable("refresh_tokens", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id).notNull(),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const employees = pgTable("employees", {
  id: uuid("id").primaryKey().defaultRandom(),
  companyId: uuid("company_id").references(() => companies.id).notNull(),
  employeeId: text("employee_id").unique(), // Human-readable employee identifier for matching with job roles
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

export const jobRoleStatusEnum = pgEnum("job_role_status", ["vacant", "filled"]);

export const jobRoles = pgTable("job_roles", {
  id: uuid("id").primaryKey().defaultRandom(),
  departmentId: uuid("department_id").references(() => departments.id).notNull(),
  title: text("title").notNull(),
  jobId: text("job_id").notNull().unique(),
  description: text("description"),
  status: jobRoleStatusEnum("status").notNull().default("vacant"),
  assignedEmployeeId: uuid("assigned_employee_id").references(() => employees.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (jobRoles) => ({
  departmentIdx: index("job_roles_department_id_idx").on(jobRoles.departmentId),
  statusIdx: index("job_roles_status_idx").on(jobRoles.status),
}));

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
  statusChangeDate: timestamp("status_change_date"),
  statusChangeManager: text("status_change_manager"),
  statusChangeReason: text("status_change_reason"),
  statusChangeNotes: text("status_change_notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const contractTemplates = pgTable("contract_templates", {
  id: uuid("id").primaryKey().defaultRandom(),
  companyId: uuid("company_id").references(() => companies.id).notNull(),
  name: text("name").notNull(),
  fileName: text("file_name").notNull(),
  fileContent: text("file_content").notNull(), // Base64 encoded DOCX content
  fileSize: integer("file_size").notNull(),
  description: text("description"),
  version: integer("version").notNull().default(1),
  isActive: boolean("is_active").notNull().default(false),
  uploadedBy: text("uploaded_by").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const contracts = pgTable("contracts", {
  id: uuid("id").primaryKey().defaultRandom(),
  employeeId: uuid("employee_id").references(() => employees.id).notNull(),
  companyId: uuid("company_id").references(() => companies.id).notNull(),
  templateId: uuid("template_id").references(() => contractTemplates.id).notNull(),
  templateName: text("template_name").notNull(),
  fileName: text("file_name").notNull(),
  fileContent: text("file_content").notNull(), // Base64 encoded file content
  noticeWeeks: integer("notice_weeks"),
  contractDate: timestamp("contract_date"),
  probationPeriod: text("probation_period"),
  status: text("status").default("active"), // active, archived, expired
  generatedAt: timestamp("generated_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const companyRelations = relations(companies, ({ one, many }) => ({
  employees: many(employees),
  employments: many(employments),
  contracts: many(contracts),
  contractTemplates: many(contractTemplates),
  users: many(users),
  departments: many(departments),
  settings: one(companySettings),
}));

export const departmentRelations = relations(departments, ({ one, many }) => ({
  company: one(companies, {
    fields: [departments.companyId],
    references: [companies.id],
  }),
  manager: one(users, {
    fields: [departments.managerId],
    references: [users.id],
  }),
  employees: many(employees),
  jobRoles: many(jobRoles),
}));

export const companySettingsRelations = relations(companySettings, ({ one }) => ({
  company: one(companies, {
    fields: [companySettings.companyId],
    references: [companies.id],
  }),
}));

export const roleRelations = relations(roles, ({ many }) => ({
  users: many(users),
}));

export const userRelations = relations(users, ({ one, many }) => ({
  company: one(companies, {
    fields: [users.companyId],
    references: [companies.id],
  }),
  role: one(roles, {
    fields: [users.roleId],
    references: [roles.id],
  }),
  employee: one(employees, {
    fields: [users.employeeId],
    references: [employees.id],
  }),
  refreshTokens: many(refreshTokens),
}));

export const refreshTokenRelations = relations(refreshTokens, ({ one }) => ({
  user: one(users, {
    fields: [refreshTokens.userId],
    references: [users.id],
  }),
}));

export const employeeRelations = relations(employees, ({ one, many }) => ({
  company: one(companies, {
    fields: [employees.companyId],
    references: [companies.id],
  }),
  employments: many(employments),
  contracts: many(contracts),
  jobRoles: many(jobRoles),
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

export const contractTemplateRelations = relations(contractTemplates, ({ one, many }) => ({
  company: one(companies, {
    fields: [contractTemplates.companyId],
    references: [companies.id],
  }),
  contracts: many(contracts),
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
  template: one(contractTemplates, {
    fields: [contracts.templateId],
    references: [contractTemplates.id],
  }),
}));

export const jobRoleRelations = relations(jobRoles, ({ one }) => ({
  department: one(departments, {
    fields: [jobRoles.departmentId],
    references: [departments.id],
  }),
  assignedEmployee: one(employees, {
    fields: [jobRoles.assignedEmployeeId],
    references: [employees.id],
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

export const insertContractTemplateSchema = createInsertSchema(contractTemplates).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertContractSchema = createInsertSchema(contracts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertJobRoleSchema = createInsertSchema(jobRoles).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  status: z.enum(["vacant", "filled"]).default("vacant"),
});

export const insertDepartmentSchema = createInsertSchema(departments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCompanySettingsSchema = createInsertSchema(companySettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertRoleSchema = createInsertSchema(roles).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  passwordHash: true, // Don't expose password hash in input
  emailVerificationToken: true,
  passwordResetToken: true,
  passwordResetTokenExpiry: true,
  lastLoginAt: true,
}).extend({
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const insertRefreshTokenSchema = createInsertSchema(refreshTokens).omit({
  id: true,
  createdAt: true,
});

// Auth-specific schemas
export const loginSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(1, "Password is required"),
});

// Fix signup schema by omitting fields that are created during signup
export const signupSchema = insertUserSchema.omit({
  companyId: true,
  roleId: true,
  employeeId: true,
}).extend({
  company: insertCompanySchema.extend({
    departments: z.array(z.object({
      name: z.string().min(1, "Department name is required"),
      description: z.string().optional(),
    })).optional().default([]),
  }),
});

export type Company = typeof companies.$inferSelect;
export type Department = typeof departments.$inferSelect;
export type CompanySettings = typeof companySettings.$inferSelect;
export type Role = typeof roles.$inferSelect;
export type User = typeof users.$inferSelect;
export type RefreshToken = typeof refreshTokens.$inferSelect;
export type Employee = typeof employees.$inferSelect;
export type Employment = typeof employments.$inferSelect;
export type ContractTemplate = typeof contractTemplates.$inferSelect;
export type Contract = typeof contracts.$inferSelect;
export type JobRole = typeof jobRoles.$inferSelect;

export type InsertCompany = z.infer<typeof insertCompanySchema>;
export type InsertDepartment = z.infer<typeof insertDepartmentSchema>;
export type InsertCompanySettings = z.infer<typeof insertCompanySettingsSchema>;
export type InsertRole = z.infer<typeof insertRoleSchema>;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertRefreshToken = z.infer<typeof insertRefreshTokenSchema>;
export type InsertEmployee = z.infer<typeof insertEmployeeSchema>;
export type InsertEmployment = z.infer<typeof insertEmploymentSchema>;
export type InsertContractTemplate = z.infer<typeof insertContractTemplateSchema>;
export type InsertContract = z.infer<typeof insertContractSchema>;
export type InsertJobRole = z.infer<typeof insertJobRoleSchema>;

export type LoginData = z.infer<typeof loginSchema>;
export type SignupData = z.infer<typeof signupSchema>;

export type EmployeeWithEmployment = Employee & {
  employment: Employment;
  company: Company;
};

export type ContractWithDetails = Contract & {
  employee: Employee;
  company: Company;
};
