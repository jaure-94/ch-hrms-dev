import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { Request, Response, NextFunction } from 'express';
import { eq, and } from 'drizzle-orm';
import { db } from './db';
import { users, refreshTokens, roles, companies } from '../shared/schema';
import type { User, Role, Company } from '../shared/schema';

// JWT Configuration
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key-change-in-production';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret-change-in-production';
const ACCESS_TOKEN_EXPIRY = '15m'; // Short-lived access token
const REFRESH_TOKEN_EXPIRY = '7d'; // Longer-lived refresh token

export interface JWTPayload {
  userId: string;
  companyId: string;
  roleId: string;
  roleName: string;
  roleLevel: number;
  email: string;
}

export interface AuthenticatedRequest extends Request {
  user?: JWTPayload;
}

// Password utilities
export const hashPassword = async (password: string): Promise<string> => {
  const saltRounds = 12;
  return await bcrypt.hash(password, saltRounds);
};

export const verifyPassword = async (password: string, hash: string): Promise<boolean> => {
  return await bcrypt.compare(password, hash);
};

// JWT utilities
export const generateAccessToken = (payload: JWTPayload): string => {
  return jwt.sign(payload, JWT_SECRET, { 
    expiresIn: ACCESS_TOKEN_EXPIRY,
    issuer: 'hr-management-system',
    subject: payload.userId
  });
};

export const generateRefreshToken = (userId: string): string => {
  return jwt.sign({ userId }, JWT_REFRESH_SECRET, { 
    expiresIn: REFRESH_TOKEN_EXPIRY,
    issuer: 'hr-management-system',
    subject: userId
  });
};

export const verifyAccessToken = (token: string): JWTPayload => {
  return jwt.verify(token, JWT_SECRET) as JWTPayload;
};

export const verifyRefreshToken = (token: string): { userId: string } => {
  return jwt.verify(token, JWT_REFRESH_SECRET) as { userId: string };
};

// Token management
export const storeRefreshToken = async (userId: string, token: string): Promise<void> => {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // 7 days from now

  // Remove any existing refresh tokens for this user
  await db.delete(refreshTokens).where(eq(refreshTokens.userId, userId));

  // Store new refresh token
  await db.insert(refreshTokens).values({
    userId,
    token,
    expiresAt,
  });
};

export const removeRefreshToken = async (token: string): Promise<void> => {
  await db.delete(refreshTokens).where(eq(refreshTokens.token, token));
};

export const validateRefreshToken = async (token: string): Promise<string | null> => {
  const result = await db
    .select({ userId: refreshTokens.userId })
    .from(refreshTokens)
    .where(
      and(
        eq(refreshTokens.token, token),
        eq(refreshTokens.expiresAt, new Date()) // Token not expired
      )
    )
    .limit(1);

  return result[0]?.userId || null;
};

// User authentication helpers
export const authenticateUser = async (email: string, password: string): Promise<JWTPayload | null> => {
  console.log('=== AUTHENTICATE USER DEBUG ===');
  console.log('Email:', email);
  console.log('Password provided:', password ? 'YES' : 'NO');
  
  const result = await db
    .select({
      user: users,
      role: roles,
      company: companies,
    })
    .from(users)
    .innerJoin(roles, eq(users.roleId, roles.id))
    .innerJoin(companies, eq(users.companyId, companies.id))
    .where(
      and(
        eq(users.email, email.toLowerCase()),
        eq(users.isActive, true)
      )
    )
    .limit(1);

  console.log('Database query result:', result.length > 0 ? 'USER FOUND' : 'NO USER FOUND');
  
  if (!result[0]) {
    console.log('No user found for email:', email);
    return null;
  }

  const { user, role, company } = result[0];
  console.log('Found user:', user.email, 'with hash:', user.passwordHash.substring(0, 20) + '...');

  // Verify password
  console.log('Verifying password...');
  const isValidPassword = await verifyPassword(password, user.passwordHash);
  console.log('Password valid:', isValidPassword);
  
  if (!isValidPassword) {
    console.log('Password verification failed!');
    return null;
  }

  // Update last login
  await db
    .update(users)
    .set({ lastLoginAt: new Date() })
    .where(eq(users.id, user.id));

  return {
    userId: user.id,
    companyId: user.companyId,
    roleId: user.roleId,
    roleName: role.name,
    roleLevel: role.level,
    email: user.email,
  };
};

export const getUserWithPermissions = async (userId: string): Promise<JWTPayload | null> => {
  const result = await db
    .select({
      user: users,
      role: roles,
      company: companies,
    })
    .from(users)
    .innerJoin(roles, eq(users.roleId, roles.id))
    .innerJoin(companies, eq(users.companyId, companies.id))
    .where(
      and(
        eq(users.id, userId),
        eq(users.isActive, true)
      )
    )
    .limit(1);

  if (!result[0]) {
    return null;
  }

  const { user, role, company } = result[0];

  return {
    userId: user.id,
    companyId: user.companyId,
    roleId: user.roleId,
    roleName: role.name,
    roleLevel: role.level,
    email: user.email,
  };
};

// Authentication middleware
export const authenticateToken = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    res.status(401).json({ error: 'Access token required' });
    return;
  }

  try {
    const payload = verifyAccessToken(token);
    
    // Verify user is still active
    const userExists = await db
      .select({ id: users.id })
      .from(users)
      .where(
        and(
          eq(users.id, payload.userId),
          eq(users.isActive, true)
        )
      )
      .limit(1);

    if (!userExists[0]) {
      res.status(401).json({ error: 'User account not found or inactive' });
      return;
    }

    req.user = payload;
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({ error: 'Access token expired' });
    } else if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({ error: 'Invalid access token' });
    } else {
      res.status(500).json({ error: 'Token verification failed' });
    }
  }
};

// Optional authentication middleware (doesn't fail if no token)
export const optionalAuth = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    next();
    return;
  }

  try {
    const payload = verifyAccessToken(token);
    req.user = payload;
  } catch (error) {
    // Ignore errors for optional auth
  }

  next();
};

// Company context middleware (ensures user belongs to requested company)
export const requireCompanyAccess = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  const companyId = req.params.companyId || req.body.companyId || req.query.companyId;
  
  if (!req.user) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  if (companyId && req.user.companyId !== companyId) {
    res.status(403).json({ error: 'Access denied to this company' });
    return;
  }

  next();
};