import { companies, employees, employments, contracts, type Company, type Employee, type Employment, type Contract, type InsertCompany, type InsertEmployee, type InsertEmployment, type InsertContract, type EmployeeWithEmployment, type ContractWithDetails } from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, like, ilike } from "drizzle-orm";

export interface IStorage {
  // Company methods
  getCompany(id: string): Promise<Company | undefined>;
  getCompanies(): Promise<Company[]>;
  createCompany(company: InsertCompany): Promise<Company>;
  updateCompany(id: string, company: Partial<InsertCompany>): Promise<Company>;
  deleteCompany(id: string): Promise<void>;

  // Employee methods
  getEmployee(id: string): Promise<Employee | undefined>;
  getEmployeesByCompany(companyId: string): Promise<EmployeeWithEmployment[]>;
  searchEmployees(companyId: string, query: string): Promise<EmployeeWithEmployment[]>;
  createEmployee(employee: InsertEmployee): Promise<Employee>;
  updateEmployee(id: string, employee: Partial<InsertEmployee>): Promise<Employee>;
  deleteEmployee(id: string): Promise<void>;

  // Employment methods
  getEmployment(id: string): Promise<Employment | undefined>;
  getEmploymentByEmployee(employeeId: string): Promise<Employment | undefined>;
  createEmployment(employment: InsertEmployment): Promise<Employment>;
  updateEmployment(id: string, employment: Partial<InsertEmployment>): Promise<Employment>;
  deleteEmployment(id: string): Promise<void>;

  // Combined methods
  createEmployeeWithEmployment(employee: InsertEmployee, employment: InsertEmployment): Promise<EmployeeWithEmployment>;
  getEmployeeWithEmployment(employeeId: string): Promise<EmployeeWithEmployment | undefined>;

  // Contract methods
  getContract(id: string): Promise<Contract | undefined>;
  getContractsByCompany(companyId: string): Promise<ContractWithDetails[]>;
  getContractsByEmployee(employeeId: string): Promise<Contract[]>;
  createContract(contract: InsertContract): Promise<Contract>;
  updateContract(id: string, contract: Partial<InsertContract>): Promise<Contract>;
  deleteContract(id: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // Company methods
  async getCompany(id: string): Promise<Company | undefined> {
    const [company] = await db.select().from(companies).where(eq(companies.id, id));
    return company || undefined;
  }

  async getCompanies(): Promise<Company[]> {
    return await db.select().from(companies).orderBy(desc(companies.createdAt));
  }

  async createCompany(company: InsertCompany): Promise<Company> {
    const [newCompany] = await db
      .insert(companies)
      .values(company)
      .returning();
    return newCompany;
  }

  async updateCompany(id: string, company: Partial<InsertCompany>): Promise<Company> {
    const [updatedCompany] = await db
      .update(companies)
      .set({ ...company, updatedAt: new Date() })
      .where(eq(companies.id, id))
      .returning();
    return updatedCompany;
  }

  async deleteCompany(id: string): Promise<void> {
    await db.delete(companies).where(eq(companies.id, id));
  }

  // Employee methods
  async getEmployee(id: string): Promise<Employee | undefined> {
    const [employee] = await db.select().from(employees).where(eq(employees.id, id));
    return employee || undefined;
  }

  async getEmployeesByCompany(companyId: string): Promise<EmployeeWithEmployment[]> {
    const result = await db
      .select()
      .from(employees)
      .leftJoin(employments, eq(employees.id, employments.employeeId))
      .leftJoin(companies, eq(employees.companyId, companies.id))
      .where(eq(employees.companyId, companyId))
      .orderBy(desc(employees.createdAt));

    return result.map(row => ({
      ...row.employees,
      employment: row.employments!,
      company: row.companies!,
    }));
  }

  async searchEmployees(companyId: string, query: string): Promise<EmployeeWithEmployment[]> {
    const result = await db
      .select()
      .from(employees)
      .leftJoin(employments, eq(employees.id, employments.employeeId))
      .leftJoin(companies, eq(employees.companyId, companies.id))
      .where(
        and(
          eq(employees.companyId, companyId),
          like(employees.firstName, `%${query}%`)
        )
      )
      .orderBy(desc(employees.createdAt));

    return result.map(row => ({
      ...row.employees,
      employment: row.employments!,
      company: row.companies!,
    }));
  }

  async createEmployee(employee: InsertEmployee): Promise<Employee> {
    const [newEmployee] = await db
      .insert(employees)
      .values(employee)
      .returning();
    return newEmployee;
  }

  async updateEmployee(id: string, employee: Partial<InsertEmployee>): Promise<Employee> {
    const [updatedEmployee] = await db
      .update(employees)
      .set({ ...employee, updatedAt: new Date() })
      .where(eq(employees.id, id))
      .returning();
    return updatedEmployee;
  }

  async deleteEmployee(id: string): Promise<void> {
    await db.delete(employees).where(eq(employees.id, id));
  }

  // Employment methods
  async getEmployment(id: string): Promise<Employment | undefined> {
    const [employment] = await db.select().from(employments).where(eq(employments.id, id));
    return employment || undefined;
  }

  async getEmploymentByEmployee(employeeId: string): Promise<Employment | undefined> {
    const [employment] = await db.select().from(employments).where(eq(employments.employeeId, employeeId));
    return employment || undefined;
  }

  async createEmployment(employment: InsertEmployment): Promise<Employment> {
    const [newEmployment] = await db
      .insert(employments)
      .values(employment)
      .returning();
    return newEmployment;
  }

  async updateEmployment(id: string, employment: Partial<InsertEmployment>): Promise<Employment> {
    const [updatedEmployment] = await db
      .update(employments)
      .set({ ...employment, updatedAt: new Date() })
      .where(eq(employments.id, id))
      .returning();
    return updatedEmployment;
  }

  async deleteEmployment(id: string): Promise<void> {
    await db.delete(employments).where(eq(employments.id, id));
  }

  // Combined methods
  async createEmployeeWithEmployment(employee: InsertEmployee, employment: InsertEmployment): Promise<EmployeeWithEmployment> {
    const newEmployee = await this.createEmployee(employee);
    const newEmployment = await this.createEmployment({
      ...employment,
      employeeId: newEmployee.id,
    });
    const company = await this.getCompany(newEmployee.companyId);
    
    return {
      ...newEmployee,
      employment: newEmployment,
      company: company!,
    };
  }

  async getEmployeeWithEmployment(employeeId: string): Promise<EmployeeWithEmployment | undefined> {
    const result = await db
      .select()
      .from(employees)
      .leftJoin(employments, eq(employees.id, employments.employeeId))
      .leftJoin(companies, eq(employees.companyId, companies.id))
      .where(eq(employees.id, employeeId));

    if (result.length === 0) return undefined;

    const row = result[0];
    return {
      ...row.employees,
      employment: row.employments!,
      company: row.companies!,
    };
  }

  // Contract methods
  async getContract(id: string): Promise<Contract | undefined> {
    const [contract] = await db.select().from(contracts).where(eq(contracts.id, id));
    return contract || undefined;
  }

  async getContractsByCompany(companyId: string): Promise<ContractWithDetails[]> {
    const result = await db
      .select()
      .from(contracts)
      .leftJoin(employees, eq(contracts.employeeId, employees.id))
      .leftJoin(companies, eq(contracts.companyId, companies.id))
      .where(eq(contracts.companyId, companyId))
      .orderBy(desc(contracts.generatedAt));

    return result.map(row => ({
      ...row.contracts,
      employee: row.employees!,
      company: row.companies!,
    }));
  }

  async getContractsByEmployee(employeeId: string): Promise<Contract[]> {
    return await db
      .select()
      .from(contracts)
      .where(eq(contracts.employeeId, employeeId))
      .orderBy(desc(contracts.generatedAt));
  }

  async createContract(contract: InsertContract): Promise<Contract> {
    const [newContract] = await db
      .insert(contracts)
      .values(contract)
      .returning();
    return newContract;
  }

  async updateContract(id: string, contract: Partial<InsertContract>): Promise<Contract> {
    const [updatedContract] = await db
      .update(contracts)
      .set(contract)
      .where(eq(contracts.id, id))
      .returning();
    return updatedContract;
  }

  async deleteContract(id: string): Promise<void> {
    await db.delete(contracts).where(eq(contracts.id, id));
  }
}

export const storage = new DatabaseStorage();
