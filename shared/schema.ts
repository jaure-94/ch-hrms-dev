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
  emergencyContact: jsonb("emergency_contact"),
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
  employmentType: text("employment_type").notNull(),
  baseSalary: decimal("base_salary", { precision: 10, scale: 2 }),
  payFrequency: text("pay_frequency"),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date"),
  location: text("location"),
  benefits: jsonb("benefits"),
  status: text("status").default("active"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const companyRelations = relations(companies, ({ many }) => ({
  employees: many(employees),
  employments: many(employments),
}));

export const employeeRelations = relations(employees, ({ one, many }) => ({
  company: one(companies, {
    fields: [employees.companyId],
    references: [companies.id],
  }),
  employments: many(employments),
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

export type Company = typeof companies.$inferSelect;
export type Employee = typeof employees.$inferSelect;
export type Employment = typeof employments.$inferSelect;
export type InsertCompany = z.infer<typeof insertCompanySchema>;
export type InsertEmployee = z.infer<typeof insertEmployeeSchema>;
export type InsertEmployment = z.infer<typeof insertEmploymentSchema>;

export type EmployeeWithEmployment = Employee & {
  employment: Employment;
  company: Company;
};
