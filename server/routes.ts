import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertCompanySchema, 
  insertEmployeeSchema, 
  insertEmploymentSchema, 
  contractTemplates,
  loginSchema,
  signupSchema,
  users,
  roles,
  companies,
  companySettings,
  departments,
  employees,
  employments,
  refreshTokens,
  type User,
  type Role,
  type Company
} from "@shared/schema";
import { z } from "zod";
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from "docx";
import { db } from "./db";
import { eq, and, or, ilike, count } from "drizzle-orm";
import { 
  authenticateUser, 
  hashPassword, 
  generateAccessToken, 
  generateRefreshToken, 
  storeRefreshToken, 
  removeRefreshToken, 
  validateRefreshToken,
  verifyRefreshToken,
  getUserWithPermissions,
  authenticateToken,
  type AuthenticatedRequest,
  type JWTPayload
} from "./auth";
import { 
  requireSuperuser, 
  requireAdmin, 
  requireManager, 
  requireEmployee,
  ROLE_PERMISSIONS,
  ROLE_LEVELS
} from "./rbac";

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

// User management validation schemas
const userStatusUpdateSchema = z.object({
  isActive: z.boolean({ required_error: "isActive is required" }),
});

const userIdSchema = z.object({
  id: z.string().uuid("Invalid user ID format"),
});

// Helper function to count active admins in a company
async function countActiveAdmins(companyId: string): Promise<number> {
  const result = await db
    .select({ count: count() })
    .from(users)
    .innerJoin(roles, eq(users.roleId, roles.id))
    .where(
      and(
        eq(users.companyId, companyId),
        eq(users.isActive, true),
        or(
          eq(roles.level, ROLE_LEVELS.SUPERUSER),
          eq(roles.level, ROLE_LEVELS.ADMIN)
        )
      )
    );
  
  return result[0]?.count || 0;
}

// Helper function to revoke all refresh tokens for a user
async function revokeUserRefreshTokens(userId: string): Promise<void> {
  await db.delete(refreshTokens).where(eq(refreshTokens.userId, userId));
}

// Helper function to seed initial roles
async function seedRoles(): Promise<void> {
  const existingRoles = await db.select().from(roles).limit(1);
  if (existingRoles.length > 0) return; // Roles already seeded

  const rolesToSeed = [
    {
      name: 'superuser',
      description: 'Full system access and company management',
      level: ROLE_LEVELS.SUPERUSER,
      permissions: ROLE_PERMISSIONS.superuser,
    },
    {
      name: 'admin',
      description: 'Administrative access within company',
      level: ROLE_LEVELS.ADMIN,
      permissions: ROLE_PERMISSIONS.admin,
    },
    {
      name: 'manager',
      description: 'Team management and employee oversight',
      level: ROLE_LEVELS.MANAGER,
      permissions: ROLE_PERMISSIONS.manager,
    },
    {
      name: 'employee',
      description: 'Basic employee access',
      level: ROLE_LEVELS.EMPLOYEE,
      permissions: ROLE_PERMISSIONS.employee,
    },
  ];

  await db.insert(roles).values(rolesToSeed);
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Ensure roles are seeded
  await seedRoles();

  // Authentication routes
  app.post("/auth/signup", async (req, res) => {
    try {
      const validatedData = signupSchema.parse(req.body);
      
      // Check if this is the first company (superuser signup)
      const existingCompanies = await db.select().from(companies).limit(1);
      if (existingCompanies.length > 0) {
        return res.status(400).json({ error: "Company signup is only allowed for the first company" });
      }

      // Check if email already exists
      const existingUser = await db.select().from(users).where(eq(users.email, validatedData.email.toLowerCase())).limit(1);
      if (existingUser.length > 0) {
        return res.status(400).json({ error: "Email already registered" });
      }

      // Get superuser role
      const superuserRole = await db.select().from(roles).where(eq(roles.name, 'superuser')).limit(1);
      if (!superuserRole[0]) {
        return res.status(500).json({ error: "Superuser role not found" });
      }

      // Create company
      const { departments: companyDepartments, ...companyData } = validatedData.company;
      const newCompany = await db.insert(companies).values({
        ...companyData,
        setupCompleted: false,
      }).returning();

      // Create initial departments if provided
      if (companyDepartments && companyDepartments.length > 0) {
        await db.insert(departments).values(
          companyDepartments.map(dept => ({
            companyId: newCompany[0].id,
            name: dept.name,
            description: dept.description || null,
            managerId: null,
          }))
        );
      }

      // Hash password
      const passwordHash = await hashPassword(validatedData.password);

      // Create superuser
      const newUser = await db.insert(users).values({
        email: validatedData.email.toLowerCase(),
        passwordHash,
        firstName: validatedData.firstName,
        lastName: validatedData.lastName,
        companyId: newCompany[0].id,
        roleId: superuserRole[0].id,
        isActive: true,
        emailVerified: true, // Auto-verify for superuser
      }).returning();

      // Generate tokens
      const payload: JWTPayload = {
        userId: newUser[0].id,
        companyId: newCompany[0].id,
        roleId: superuserRole[0].id,
        roleName: 'superuser',
        roleLevel: ROLE_LEVELS.SUPERUSER,
        email: newUser[0].email,
      };

      const accessToken = generateAccessToken(payload);
      const refreshToken = generateRefreshToken(newUser[0].id);
      
      // Store refresh token
      await storeRefreshToken(newUser[0].id, refreshToken);

      // Set refresh token as HTTP-only cookie
      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      // Get full user details with role and company information for response
      const userDetails = await db
        .select({
          user: users,
          role: roles,
          company: companies,
        })
        .from(users)
        .innerJoin(roles, eq(users.roleId, roles.id))
        .innerJoin(companies, eq(users.companyId, companies.id))
        .where(eq(users.id, newUser[0].id))
        .limit(1);

      const { user, role, company } = userDetails[0];

      res.status(201).json({
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          isActive: user.isActive,
          emailVerified: user.emailVerified,
          lastLoginAt: user.lastLoginAt,
          role: {
            id: role.id,
            name: role.name,
            description: role.description,
            level: role.level,
            permissions: role.permissions,
          },
          company: {
            id: company.id,
            name: company.name,
            setupCompleted: company.setupCompleted,
          },
        },
        accessToken,
      });
    } catch (error) {
      console.error('Signup error:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create account" });
    }
  });

  app.post("/auth/login", async (req, res) => {
    try {
      const { email, password } = loginSchema.parse(req.body);
      
      // Authenticate user
      const userPayload = await authenticateUser(email, password);
      if (!userPayload) {
        return res.status(401).json({ error: "Invalid email or password" });
      }

      // Generate tokens
      const accessToken = generateAccessToken(userPayload);
      const refreshToken = generateRefreshToken(userPayload.userId);
      
      // Store refresh token
      await storeRefreshToken(userPayload.userId, refreshToken);

      // Set refresh token as HTTP-only cookie
      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      // Get full user details with role and company information
      const userDetails = await db
        .select({
          user: users,
          role: roles,
          company: companies,
        })
        .from(users)
        .innerJoin(roles, eq(users.roleId, roles.id))
        .innerJoin(companies, eq(users.companyId, companies.id))
        .where(eq(users.id, userPayload.userId))
        .limit(1);

      if (!userDetails[0]) {
        return res.status(404).json({ error: "User not found" });
      }

      const { user, role, company } = userDetails[0];

      res.json({
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          isActive: user.isActive,
          emailVerified: user.emailVerified,
          lastLoginAt: user.lastLoginAt,
          role: {
            id: role.id,
            name: role.name,
            description: role.description,
            level: role.level,
            permissions: role.permissions,
          },
          company: {
            id: company.id,
            name: company.name,
            setupCompleted: company.setupCompleted,
          },
        },
        accessToken,
      });
    } catch (error) {
      console.error('Login error:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid login data" });
      }
      res.status(500).json({ error: "Failed to login" });
    }
  });

  app.post("/auth/refresh", async (req, res) => {
    try {
      const refreshToken = req.cookies.refreshToken;
      if (!refreshToken) {
        return res.status(401).json({ error: "Refresh token required" });
      }

      // Verify refresh token
      const decoded = verifyRefreshToken(refreshToken);
      const userId = await validateRefreshToken(refreshToken);
      
      if (!userId || userId !== decoded.userId) {
        return res.status(401).json({ error: "Invalid refresh token" });
      }

      // Get updated user information
      const userPayload = await getUserWithPermissions(userId);
      if (!userPayload) {
        return res.status(401).json({ error: "User not found" });
      }

      // Generate new access token
      const accessToken = generateAccessToken(userPayload);

      res.json({ accessToken });
    } catch (error) {
      console.error('Refresh error:', error);
      res.status(401).json({ error: "Invalid or expired refresh token" });
    }
  });

  app.post("/auth/logout", async (req, res) => {
    try {
      const refreshToken = req.cookies.refreshToken;
      if (refreshToken) {
        await removeRefreshToken(refreshToken);
      }

      // Clear refresh token cookie
      res.clearCookie('refreshToken');
      res.json({ message: "Logged out successfully" });
    } catch (error) {
      console.error('Logout error:', error);
      res.status(500).json({ error: "Failed to logout" });
    }
  });

  // User management routes
  app.get("/me", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Authentication required" });
      }

      // Get full user details with company and role information
      const userDetails = await db
        .select({
          user: users,
          role: roles,
          company: companies,
        })
        .from(users)
        .innerJoin(roles, eq(users.roleId, roles.id))
        .innerJoin(companies, eq(users.companyId, companies.id))
        .where(eq(users.id, req.user.userId))
        .limit(1);

      if (!userDetails[0]) {
        return res.status(404).json({ error: "User not found" });
      }

      const { user, role, company } = userDetails[0];

      res.json({
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        isActive: user.isActive,
        emailVerified: user.emailVerified,
        lastLoginAt: user.lastLoginAt,
        role: {
          id: role.id,
          name: role.name,
          description: role.description,
          level: role.level,
          permissions: role.permissions,
        },
        company: {
          id: company.id,
          name: company.name,
          setupCompleted: company.setupCompleted,
        },
      });
    } catch (error) {
      console.error('Get user error:', error);
      res.status(500).json({ error: "Failed to get user details" });
    }
  });

  app.get("/users", authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res) => {
    try {
      const companyId = req.user!.companyId;

      const usersList = await db
        .select({
          user: users,
          role: roles,
        })
        .from(users)
        .innerJoin(roles, eq(users.roleId, roles.id))
        .where(eq(users.companyId, companyId))
        .orderBy(users.createdAt);

      const formattedUsers = usersList.map(({ user, role }) => ({
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        isActive: user.isActive,
        emailVerified: user.emailVerified,
        lastLoginAt: user.lastLoginAt,
        createdAt: user.createdAt,
        role: {
          id: role.id,
          name: role.name,
          description: role.description,
          level: role.level,
        },
      }));

      res.json(formattedUsers);
    } catch (error) {
      console.error('Get users error:', error);
      res.status(500).json({ error: "Failed to get users" });
    }
  });

  app.post("/users", authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res) => {
    try {
      const companyId = req.user!.companyId;
      
      const createUserSchema = z.object({
        email: z.string().email("Invalid email format"),
        password: z.string().min(8, "Password must be at least 8 characters"),
        firstName: z.string().min(1, "First name is required"),
        lastName: z.string().min(1, "Last name is required"),
        roleName: z.enum(['admin', 'manager', 'employee'], {
          required_error: "Role is required"
        }),
        employeeId: z.string().uuid().optional(),
      });

      const validatedData = createUserSchema.parse(req.body);

      // Check if email already exists
      const existingUser = await db
        .select()
        .from(users)
        .where(eq(users.email, validatedData.email.toLowerCase()))
        .limit(1);

      if (existingUser.length > 0) {
        return res.status(400).json({ error: "Email already registered" });
      }

      // Get role
      const role = await db
        .select()
        .from(roles)
        .where(eq(roles.name, validatedData.roleName))
        .limit(1);

      if (!role[0]) {
        return res.status(400).json({ error: "Invalid role specified" });
      }

      // Hash password
      const passwordHash = await hashPassword(validatedData.password);

      // Create user
      const newUser = await db.insert(users).values({
        email: validatedData.email.toLowerCase(),
        passwordHash,
        firstName: validatedData.firstName,
        lastName: validatedData.lastName,
        companyId,
        roleId: role[0].id,
        employeeId: validatedData.employeeId || null,
        isActive: true,
        emailVerified: false,
      }).returning();

      res.status(201).json({
        id: newUser[0].id,
        email: newUser[0].email,
        firstName: newUser[0].firstName,
        lastName: newUser[0].lastName,
        isActive: newUser[0].isActive,
        role: {
          name: role[0].name,
          description: role[0].description,
          level: role[0].level,
        },
      });
    } catch (error) {
      console.error('Create user error:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create user" });
    }
  });

  app.post("/companies/setup", authenticateToken, requireSuperuser, async (req: AuthenticatedRequest, res) => {
    try {
      console.log('=== COMPANY SETUP API DEBUG ===');
      console.log('Company ID:', req.user!.companyId);
      console.log('Request body:', req.body);
      
      const companyId = req.user!.companyId;

      const setupSchema = z.object({
        // Company details
        companyNumber: z.string().optional(),
        
        // HR Settings
        defaultNoticePeriodWeeks: z.number().int().min(1).max(52).default(4),
        workingHoursPerWeek: z.number().min(1).max(80).default(37.5),
        workingDaysPerWeek: z.number().int().min(1).max(7).default(5),
        leaveEntitlementDays: z.number().int().min(0).max(365).default(25),
        probationPeriodMonths: z.number().int().min(0).max(24).default(6),
        currency: z.string().default("GBP"),
        timezone: z.string().default("Europe/London"),
        publicHolidays: z.array(z.string()).default([]),
        
        // Initial departments
        departments: z.array(z.object({
          name: z.string().min(1, "Department name is required"),
          description: z.string().optional(),
        })).default([]),
      });

      const validatedData = setupSchema.parse(req.body);
      console.log('Validated data:', validatedData);

      // Check if setup is already completed
      const existingCompany = await db.select().from(companies).where(eq(companies.id, companyId)).limit(1);
      console.log('Existing company:', existingCompany[0]);
      
      if (existingCompany[0]?.setupCompleted) {
        console.log('Setup already completed, returning success');
        return res.json({ message: "Company setup already completed" });
      }

      // Update company setup status and details
      console.log('Updating company...');
      await db
        .update(companies)
        .set({
          companyNumber: validatedData.companyNumber,
          setupCompleted: true,
          updatedAt: new Date(),
        })
        .where(eq(companies.id, companyId));

      // Check if company settings already exist
      const existingSettings = await db.select().from(companySettings).where(eq(companySettings.companyId, companyId)).limit(1);
      console.log('Existing settings:', existingSettings.length > 0 ? 'FOUND' : 'NOT FOUND');

      if (existingSettings.length === 0) {
        console.log('Creating company settings...');
        await db.insert(companySettings).values({
          companyId,
          defaultNoticePeriodWeeks: validatedData.defaultNoticePeriodWeeks,
          workingHoursPerWeek: validatedData.workingHoursPerWeek.toString(),
          workingDaysPerWeek: validatedData.workingDaysPerWeek,
          leaveEntitlementDays: validatedData.leaveEntitlementDays,
          probationPeriodMonths: validatedData.probationPeriodMonths,
          currency: validatedData.currency,
          timezone: validatedData.timezone,
          publicHolidays: validatedData.publicHolidays,
        });
      } else {
        console.log('Updating existing company settings...');
        await db
          .update(companySettings)
          .set({
            defaultNoticePeriodWeeks: validatedData.defaultNoticePeriodWeeks,
            workingHoursPerWeek: validatedData.workingHoursPerWeek.toString(),
            workingDaysPerWeek: validatedData.workingDaysPerWeek,
            leaveEntitlementDays: validatedData.leaveEntitlementDays,
            probationPeriodMonths: validatedData.probationPeriodMonths,
            currency: validatedData.currency,
            timezone: validatedData.timezone,
            publicHolidays: validatedData.publicHolidays,
            updatedAt: new Date(),
          })
          .where(eq(companySettings.companyId, companyId));
      }

      // Create initial departments
      if (validatedData.departments.length > 0) {
        console.log('Creating departments:', validatedData.departments.length);
        await db.insert(departments).values(
          validatedData.departments.map(dept => ({
            companyId,
            name: dept.name,
            description: dept.description || null,
            managerId: null,
            isActive: true,
          }))
        );
      }

      console.log('Setup completed successfully!');
      res.json({ message: "Company setup completed successfully" });
    } catch (error) {
      console.error('=== COMPANY SETUP ERROR ===');
      console.error('Error details:', error);
      console.error('Error message:', error instanceof Error ? error.message : String(error));
      console.error('Error stack:', error instanceof Error ? error.stack : 'No stack');
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid setup data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to complete company setup" });
    }
  });

  app.get("/companies/:id", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const companyId = req.params.id;
      
      // Ensure user can access this company
      if (req.user!.companyId !== companyId) {
        return res.status(403).json({ error: "Access denied to this company" });
      }

      // Get company with settings and departments
      const companyResult = await db
        .select({
          company: companies,
          settings: companySettings,
        })
        .from(companies)
        .leftJoin(companySettings, eq(companies.id, companySettings.companyId))
        .where(eq(companies.id, companyId))
        .limit(1);

      if (!companyResult[0]) {
        return res.status(404).json({ error: "Company not found" });
      }

      const departmentsList = await db
        .select()
        .from(departments)
        .where(eq(departments.companyId, companyId))
        .orderBy(departments.name);

      res.json({
        ...companyResult[0].company,
        settings: companyResult[0].settings,
        departments: departmentsList,
      });
    } catch (error) {
      console.error('Get company error:', error);
      res.status(500).json({ error: "Failed to get company details" });
    }
  });

  app.patch("/companies/:id", authenticateToken, requireSuperuser, async (req: AuthenticatedRequest, res) => {
    try {
      const companyId = req.params.id;
      
      // Ensure user can access this company
      if (req.user!.companyId !== companyId) {
        return res.status(403).json({ error: "Access denied to this company" });
      }

      const updateCompanySchema = insertCompanySchema.partial();
      const validatedData = updateCompanySchema.parse(req.body);

      const updatedCompany = await db
        .update(companies)
        .set({ ...validatedData, updatedAt: new Date() })
        .where(eq(companies.id, companyId))
        .returning();

      if (!updatedCompany[0]) {
        return res.status(404).json({ error: "Company not found" });
      }

      res.json(updatedCompany[0]);
    } catch (error) {
      console.error('Update company error:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid company data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to update company" });
    }
  });

  // Company routes (legacy - will be protected in next iteration)
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

  // Users routes
  app.get("/api/companies/:companyId/users", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const { companyId } = req.params;
      const { search } = req.query;
      
      // Ensure user can access this company (superuser can access any company)
      if (req.user!.roleLevel !== 1 && req.user!.companyId !== companyId) {
        return res.status(403).json({ error: "Access denied to this company" });
      }

      // Require admin level access or higher for user management
      if (req.user!.roleLevel > 2) {
        return res.status(403).json({ error: "Insufficient permissions for user management" });
      }

      // Build the query to get users with their roles and optional employee data
      let query = db
        .select({
          id: users.id,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
          isActive: users.isActive,
          emailVerified: users.emailVerified,
          lastLoginAt: users.lastLoginAt,
          createdAt: users.createdAt,
          role: {
            id: roles.id,
            name: roles.name,
            level: roles.level,
          },
          employee: {
            id: employees.id,
            phone: employees.phone,
          },
          employment: {
            department: employments.department,
            jobTitle: employments.jobTitle,
            status: employments.employmentStatus,
            startDate: employments.startDate,
          },
        })
        .from(users)
        .innerJoin(roles, eq(users.roleId, roles.id))
        .leftJoin(employees, eq(users.employeeId, employees.id))
        .leftJoin(employments, eq(employees.id, employments.employeeId))
        .where(
          search && typeof search === 'string'
            ? and(
                eq(users.companyId, companyId),
                or(
                  ilike(users.firstName, `%${search.toLowerCase()}%`),
                  ilike(users.lastName, `%${search.toLowerCase()}%`),
                  ilike(users.email, `%${search.toLowerCase()}%`),
                )
              )
            : eq(users.companyId, companyId)
        );

      const usersData = await query.orderBy(users.firstName, users.lastName);

      res.json(usersData);
    } catch (error) {
      console.error('Failed to fetch users:', error);
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });

  // Update user status (activate/deactivate)
  app.patch("/api/users/:id/status", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      // Input validation: Validate UUID in path parameter
      const paramValidation = userIdSchema.safeParse({ id: req.params.id });
      if (!paramValidation.success) {
        return res.status(400).json({ 
          error: "Invalid user ID format", 
          details: paramValidation.error.errors 
        });
      }

      // Input validation: Validate request body
      const bodyValidation = userStatusUpdateSchema.safeParse(req.body);
      if (!bodyValidation.success) {
        return res.status(400).json({ 
          error: "Invalid request data", 
          details: bodyValidation.error.errors 
        });
      }

      const { id } = paramValidation.data;
      const { isActive } = bodyValidation.data;

      // Require admin level access or higher for user management
      if (req.user!.roleLevel > ROLE_LEVELS.ADMIN) {
        return res.status(403).json({ error: "Insufficient permissions for user management" });
      }

      // Self-deactivation prevention: Prevent users from deactivating themselves
      if (req.user!.userId === id && !isActive) {
        return res.status(400).json({ 
          error: "Cannot deactivate your own account. Contact another administrator to deactivate your account." 
        });
      }

      // Check if user exists and get their details
      const targetUser = await db
        .select({ 
          companyId: users.companyId, 
          roleId: users.roleId,
          isActive: users.isActive 
        })
        .from(users)
        .where(eq(users.id, id))
        .limit(1);

      if (!targetUser.length) {
        return res.status(404).json({ error: "User not found" });
      }

      // Ensure user can modify this user (superuser can modify any, admins can modify within company)
      if (req.user!.roleLevel !== ROLE_LEVELS.SUPERUSER && req.user!.companyId !== targetUser[0].companyId) {
        return res.status(403).json({ error: "Access denied to this user" });
      }

      // Get target user's role information
      const targetUserRole = await db
        .select({ level: roles.level })
        .from(roles)
        .where(eq(roles.id, targetUser[0].roleId))
        .limit(1);

      if (!targetUserRole.length) {
        return res.status(500).json({ error: "Target user role not found" });
      }

      // Prevent non-superusers from deactivating superusers or equal/higher level users
      if (targetUserRole[0].level <= req.user!.roleLevel && req.user!.roleLevel !== ROLE_LEVELS.SUPERUSER) {
        return res.status(403).json({ error: "Cannot modify user with equal or higher permissions" });
      }

      // Last admin protection: Prevent deactivation of last admin (except by superuser)
      if (!isActive && req.user!.roleLevel !== ROLE_LEVELS.SUPERUSER) {
        const isTargetAdmin = targetUserRole[0].level <= ROLE_LEVELS.ADMIN;
        const isCurrentlyActive = targetUser[0].isActive;
        
        if (isTargetAdmin && isCurrentlyActive) {
          const activeAdminCount = await countActiveAdmins(targetUser[0].companyId);
          
          if (activeAdminCount <= 1) {
            return res.status(400).json({ 
              error: "Cannot deactivate the last active admin in the company. Please ensure at least one admin remains active before deactivating this user." 
            });
          }
        }
      }

      // Update user status
      await db
        .update(users)
        .set({ 
          isActive,
          updatedAt: new Date()
        })
        .where(eq(users.id, id));

      res.json({ message: `User ${isActive ? 'activated' : 'deactivated'} successfully` });
    } catch (error) {
      console.error('Failed to update user status:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to update user status" });
    }
  });

  // Delete user
  app.delete("/api/users/:id", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      // Input validation: Validate UUID in path parameter
      const paramValidation = userIdSchema.safeParse({ id: req.params.id });
      if (!paramValidation.success) {
        return res.status(400).json({ 
          error: "Invalid user ID format", 
          details: paramValidation.error.errors 
        });
      }

      const { id } = paramValidation.data;

      // Require admin level access or higher for user management
      if (req.user!.roleLevel > ROLE_LEVELS.ADMIN) {
        return res.status(403).json({ error: "Insufficient permissions for user management" });
      }

      // Prevent users from deleting themselves
      if (req.user!.userId === id) {
        return res.status(400).json({ error: "Cannot delete your own account" });
      }

      // Check if user exists and get their details
      const targetUser = await db
        .select({ 
          companyId: users.companyId, 
          roleId: users.roleId,
          employeeId: users.employeeId,
          isActive: users.isActive
        })
        .from(users)
        .where(eq(users.id, id))
        .limit(1);

      if (!targetUser.length) {
        return res.status(404).json({ error: "User not found" });
      }

      // Ensure user can modify this user (superuser can modify any, admins can modify within company)
      if (req.user!.roleLevel !== ROLE_LEVELS.SUPERUSER && req.user!.companyId !== targetUser[0].companyId) {
        return res.status(403).json({ error: "Access denied to this user" });
      }

      // Get target user's role information
      const targetUserRole = await db
        .select({ level: roles.level })
        .from(roles)
        .where(eq(roles.id, targetUser[0].roleId))
        .limit(1);

      if (!targetUserRole.length) {
        return res.status(500).json({ error: "Target user role not found" });
      }

      // Prevent non-superusers from deleting superusers or equal/higher level users
      if (targetUserRole[0].level <= req.user!.roleLevel && req.user!.roleLevel !== ROLE_LEVELS.SUPERUSER) {
        return res.status(403).json({ error: "Cannot delete user with equal or higher permissions" });
      }

      // Last admin protection: Prevent deletion of last admin (except by superuser)
      if (req.user!.roleLevel !== ROLE_LEVELS.SUPERUSER) {
        const isTargetAdmin = targetUserRole[0].level <= ROLE_LEVELS.ADMIN;
        const isCurrentlyActive = targetUser[0].isActive;
        
        if (isTargetAdmin && isCurrentlyActive) {
          const activeAdminCount = await countActiveAdmins(targetUser[0].companyId);
          
          if (activeAdminCount <= 1) {
            return res.status(400).json({ 
              error: "Cannot delete the last active admin in the company. Please ensure at least one admin remains active before deleting this user." 
            });
          }
        }
      }

      // Cleanup on deletion: Revoke all refresh tokens for this user
      await revokeUserRefreshTokens(id);

      // Delete user (this will cascade to related records)
      await db.delete(users).where(eq(users.id, id));

      // Return 204 No Content status code for successful deletion
      res.status(204).send();
    } catch (error) {
      console.error('Failed to delete user:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to delete user" });
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
        phone: validatedData.phoneNumber,
        address: validatedData.address,
        dateOfBirth: validatedData.dateOfBirth ? new Date(validatedData.dateOfBirth) : undefined,
        emergencyContact: {
          name: validatedData.emergencyContactName,
          phone: validatedData.emergencyContactPhone,
          relationship: validatedData.emergencyContactRelationship,
        },
      };

      const employee = await storage.updateEmployee(req.params.id, employeeData);
      
      if (validatedData.jobTitle || validatedData.department || validatedData.baseSalary) {
        const employment = await storage.getEmploymentByEmployee(req.params.id);
        if (employment) {
          const employmentData = {
            jobTitle: validatedData.jobTitle,
            department: validatedData.department,
            manager: validatedData.manager,
            employmentStatus: validatedData.employmentStatus,
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

  // Update employee employment status
  app.put("/api/employees/:id/status", async (req, res) => {
    try {
      const { status, statusDate, statusManager, statusReason, statusNotes } = req.body;
      
      const employment = await storage.getEmploymentByEmployee(req.params.id);
      if (!employment) {
        return res.status(404).json({ message: "Employee employment record not found" });
      }

      const updatedEmployment = await storage.updateEmployment(employment.id, {
        status,
        // Store status change details in a JSON field or separate table
        // For now, we'll add these fields to the employment record
        statusChangeDate: statusDate ? new Date(statusDate) : new Date(),
        statusChangeManager: statusManager,
        statusChangeReason: statusReason,
        statusChangeNotes: statusNotes,
      });

      res.json(updatedEmployment);
    } catch (error) {
      console.error('Update employment status error:', error);
      res.status(500).json({ message: "Failed to update employment status" });
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
      
      // Basic validation - check if it's a valid DOCX file (should start with PK)
      if (!templateBuffer || templateBuffer.length < 4) {
        return res.status(400).json({ message: "Invalid template file: file is too small" });
      }
      
      // Check for ZIP/DOCX file signature (PK)
      if (templateBuffer[0] !== 0x50 || templateBuffer[1] !== 0x4B) {
        return res.status(400).json({ message: "Invalid template file: not a valid DOCX file" });
      }

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
        emergencyContactName: (employee.emergencyContact as any)?.name || '',
        emergencyContactPhone: (employee.emergencyContact as any)?.phone || '',
        emergencyContactRelationship: (employee.emergencyContact as any)?.relationship || '',
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
        benefits: employee.employment?.benefits ? (Array.isArray(employee.employment.benefits) ? employee.employment.benefits.join(', ') : employee.employment.benefits) : '',
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
        company_city: 'London',
        company_postcode: 'SW1A 1AA',
        company_country: 'United Kingdom',
        
        // Additional common template variables
        vacationWeeks: '4', // Standard UK vacation weeks
        vacationDays: '20', // Standard UK vacation days (4 weeks x 5 days)
        sickDays: '28 weeks', // UK statutory sick leave (alternative name)
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
        companyMobilePhone: 'Optional',
        companyLaptop: 'Provided',
        parkingSpace: 'Available',
        workFromHome: 'Hybrid',
        
        // Additional variables that templates might expect
        annualLeave: '20 days',
        publicHolidays: '8 days',
        noticePeriod: noticeWeeks ? `${noticeWeeks} weeks` : '4 weeks',
        probationary: probationPeriod || '3 months',
        workingHours: employee.employment?.weeklyHours ? `${employee.employment.weeklyHours} hours per week` : '40 hours per week',
        overtimeRate: '1.5x normal rate',
        trainingAllowance: '£1,000 per year',
        uniformAllowance: 'As required',
        travelAllowance: 'As per company policy',
        
        // Contract specific dates
        contractStartDate: employee.employment?.startDate ? new Date(employee.employment.startDate).toLocaleDateString('en-GB') : '',
        contractEndDate: employee.employment?.endDate ? new Date(employee.employment.endDate).toLocaleDateString('en-GB') : 'Permanent',
        reviewDate: employee.employment?.startDate ? new Date(new Date(employee.employment.startDate).getTime() + 90 * 24 * 60 * 60 * 1000).toLocaleDateString('en-GB') : '',
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
        
        // Create report with proper configuration
        buffer = await createReport({
          template: templateBuffer,
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
        console.log('Output buffer type:', typeof buffer);
        console.log('Output buffer length:', buffer ? buffer.length : 'undefined');
        console.log('Is buffer a Buffer?', Buffer.isBuffer(buffer));
        console.log('Is buffer a Uint8Array?', buffer instanceof Uint8Array);
        
        // Ensure we have a proper Buffer for further processing
        if (!(buffer instanceof Buffer)) {
          if (buffer instanceof Uint8Array) {
            buffer = Buffer.from(buffer);
            console.log('Converted Uint8Array to Buffer');
          } else {
            throw new Error('Unexpected buffer type returned from docx-templates');
          }
        }
        
      } catch (error) {
        console.error('Error using docx-templates:', error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        const errorStack = error instanceof Error ? error.stack : 'No stack trace available';
        console.error('Error details:', errorMessage);
        console.error('Error stack:', errorStack);
        
        // Return error instead of fallback
        throw new Error(`Failed to process contract template: ${errorMessage}`);
      }



      // Validate the generated buffer
      if (!buffer || buffer.length === 0) {
        throw new Error('Generated document is empty');
      }
      
      // Validate that the generated buffer is still a valid DOCX
      if (buffer[0] !== 0x50 || buffer[1] !== 0x4B) {
        throw new Error('Generated document is not a valid DOCX file');
      }
      
      console.log('Final validation passed - buffer is valid DOCX');

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
      
      console.log('Contract saved to database with ID:', contract.id);
      
      // Return success response instead of downloading file
      res.json({ 
        success: true, 
        message: "Contract generated successfully",
        contractId: contract.id,
        fileName: `${employee.firstName}_${employee.lastName}_Contract.docx`
      });
    } catch (error) {
      console.error('Contract generation error:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      res.status(500).json({ message: "Failed to generate contract", error: errorMessage });
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
      
      // Debug logging
      console.log('Download contract debug info:');
      console.log('- Contract ID:', contract.id);
      console.log('- Original base64 length:', contract.fileContent.length);
      console.log('- Decoded buffer length:', buffer.length);
      console.log('- Buffer first 4 bytes:', buffer.slice(0, 4));
      console.log('- Is valid DOCX signature?', buffer[0] === 0x50 && buffer[1] === 0x4B);
      
      // Validate the buffer is a valid DOCX
      if (buffer.length === 0) {
        console.error('Buffer is empty');
        return res.status(500).json({ message: "Contract file is empty" });
      }
      
      if (buffer[0] !== 0x50 || buffer[1] !== 0x4B) {
        console.error('Invalid DOCX signature, first 4 bytes:', buffer.slice(0, 4));
        return res.status(500).json({ message: "Contract file is corrupted" });
      }
      
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
      res.setHeader('Content-Disposition', `attachment; filename="${contract.fileName}"`);
      res.setHeader('Content-Length', buffer.length.toString());
      res.send(buffer);
    } catch (error) {
      console.error('Download contract error:', error);
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
      const errorMessage = error instanceof Error ? error.message : String(error);
      res.status(500).json({ message: "Failed to create contract template", error: errorMessage });
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
