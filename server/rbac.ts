import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './auth';

// Role levels (lower number = higher permission level)
export const ROLE_LEVELS = {
  SUPERUSER: 1,
  ADMIN: 2,
  MANAGER: 3,
  EMPLOYEE: 4,
} as const;

// Permission constants
export const PERMISSIONS = {
  // Company management
  MANAGE_COMPANY: 'manage_company',
  VIEW_COMPANY: 'view_company',
  
  // User management
  CREATE_USERS: 'create_users',
  MANAGE_USERS: 'manage_users',
  VIEW_USERS: 'view_users',
  DELETE_USERS: 'delete_users',
  
  // Employee management
  CREATE_EMPLOYEES: 'create_employees',
  MANAGE_EMPLOYEES: 'manage_employees',
  VIEW_EMPLOYEES: 'view_employees',
  DELETE_EMPLOYEES: 'delete_employees',
  
  // Employment status
  CHANGE_EMPLOYMENT_STATUS: 'change_employment_status',
  VIEW_EMPLOYMENT_STATUS: 'view_employment_status',
  
  // Contract management
  GENERATE_CONTRACTS: 'generate_contracts',
  MANAGE_CONTRACTS: 'manage_contracts',
  VIEW_CONTRACTS: 'view_contracts',
  DELETE_CONTRACTS: 'delete_contracts',
  
  // Template management
  MANAGE_TEMPLATES: 'manage_templates',
  VIEW_TEMPLATES: 'view_templates',
  
  // Department management
  MANAGE_DEPARTMENTS: 'manage_departments',
  VIEW_DEPARTMENTS: 'view_departments',
  
  // Company settings
  MANAGE_SETTINGS: 'manage_settings',
  VIEW_SETTINGS: 'view_settings',
  
  // Analytics
  VIEW_ANALYTICS: 'view_analytics',
  VIEW_REPORTS: 'view_reports',
  
  // Own profile
  VIEW_OWN_PROFILE: 'view_own_profile',
  EDIT_OWN_PROFILE: 'edit_own_profile',
} as const;

// Role permissions mapping
export const ROLE_PERMISSIONS = {
  superuser: [
    // Company management
    PERMISSIONS.MANAGE_COMPANY,
    PERMISSIONS.VIEW_COMPANY,
    
    // User management
    PERMISSIONS.CREATE_USERS,
    PERMISSIONS.MANAGE_USERS,
    PERMISSIONS.VIEW_USERS,
    PERMISSIONS.DELETE_USERS,
    
    // Employee management
    PERMISSIONS.CREATE_EMPLOYEES,
    PERMISSIONS.MANAGE_EMPLOYEES,
    PERMISSIONS.VIEW_EMPLOYEES,
    PERMISSIONS.DELETE_EMPLOYEES,
    
    // Employment status
    PERMISSIONS.CHANGE_EMPLOYMENT_STATUS,
    PERMISSIONS.VIEW_EMPLOYMENT_STATUS,
    
    // Contract management
    PERMISSIONS.GENERATE_CONTRACTS,
    PERMISSIONS.MANAGE_CONTRACTS,
    PERMISSIONS.VIEW_CONTRACTS,
    PERMISSIONS.DELETE_CONTRACTS,
    
    // Template management
    PERMISSIONS.MANAGE_TEMPLATES,
    PERMISSIONS.VIEW_TEMPLATES,
    
    // Department management
    PERMISSIONS.MANAGE_DEPARTMENTS,
    PERMISSIONS.VIEW_DEPARTMENTS,
    
    // Company settings
    PERMISSIONS.MANAGE_SETTINGS,
    PERMISSIONS.VIEW_SETTINGS,
    
    // Analytics
    PERMISSIONS.VIEW_ANALYTICS,
    PERMISSIONS.VIEW_REPORTS,
    
    // Own profile
    PERMISSIONS.VIEW_OWN_PROFILE,
    PERMISSIONS.EDIT_OWN_PROFILE,
  ],
  
  admin: [
    // Company management (limited)
    PERMISSIONS.VIEW_COMPANY,
    
    // User management
    PERMISSIONS.CREATE_USERS,
    PERMISSIONS.MANAGE_USERS,
    PERMISSIONS.VIEW_USERS,
    
    // Employee management
    PERMISSIONS.CREATE_EMPLOYEES,
    PERMISSIONS.MANAGE_EMPLOYEES,
    PERMISSIONS.VIEW_EMPLOYEES,
    PERMISSIONS.DELETE_EMPLOYEES,
    
    // Employment status
    PERMISSIONS.CHANGE_EMPLOYMENT_STATUS,
    PERMISSIONS.VIEW_EMPLOYMENT_STATUS,
    
    // Contract management
    PERMISSIONS.GENERATE_CONTRACTS,
    PERMISSIONS.MANAGE_CONTRACTS,
    PERMISSIONS.VIEW_CONTRACTS,
    
    // Template management
    PERMISSIONS.MANAGE_TEMPLATES,
    PERMISSIONS.VIEW_TEMPLATES,
    
    // Department management
    PERMISSIONS.MANAGE_DEPARTMENTS,
    PERMISSIONS.VIEW_DEPARTMENTS,
    
    // Company settings (limited)
    PERMISSIONS.VIEW_SETTINGS,
    
    // Analytics
    PERMISSIONS.VIEW_ANALYTICS,
    PERMISSIONS.VIEW_REPORTS,
    
    // Own profile
    PERMISSIONS.VIEW_OWN_PROFILE,
    PERMISSIONS.EDIT_OWN_PROFILE,
  ],
  
  manager: [
    // Employee management (limited)
    PERMISSIONS.CREATE_EMPLOYEES,
    PERMISSIONS.VIEW_EMPLOYEES,
    
    // Employment status (limited)
    PERMISSIONS.CHANGE_EMPLOYMENT_STATUS,
    PERMISSIONS.VIEW_EMPLOYMENT_STATUS,
    
    // Contract management
    PERMISSIONS.GENERATE_CONTRACTS,
    PERMISSIONS.VIEW_CONTRACTS,
    
    // Template management (view only)
    PERMISSIONS.VIEW_TEMPLATES,
    
    // Department management (view only)
    PERMISSIONS.VIEW_DEPARTMENTS,
    
    // Analytics (limited)
    PERMISSIONS.VIEW_REPORTS,
    
    // Own profile
    PERMISSIONS.VIEW_OWN_PROFILE,
    PERMISSIONS.EDIT_OWN_PROFILE,
  ],
  
  employee: [
    // Own profile only
    PERMISSIONS.VIEW_OWN_PROFILE,
    PERMISSIONS.EDIT_OWN_PROFILE,
    
    // Limited viewing
    PERMISSIONS.VIEW_DEPARTMENTS,
  ],
} as const;

// Helper functions
export const hasPermission = (roleName: string, permission: string): boolean => {
  const rolePermissions = ROLE_PERMISSIONS[roleName as keyof typeof ROLE_PERMISSIONS];
  return rolePermissions ? rolePermissions.includes(permission as any) : false;
};

export const hasRoleLevel = (userRoleLevel: number, requiredLevel: number): boolean => {
  return userRoleLevel <= requiredLevel;
};

export const canAccessResource = (
  userRoleLevel: number,
  userCompanyId: string,
  resourceCompanyId: string,
  userUserId?: string,
  resourceUserId?: string
): boolean => {
  // Company access check
  if (userCompanyId !== resourceCompanyId) {
    return false;
  }
  
  // If accessing own resource, allow if user is authenticated
  if (userUserId && resourceUserId && userUserId === resourceUserId) {
    return true;
  }
  
  return true; // Company access verified
};

// RBAC Middleware generators
export const requireRole = (requiredRoleLevel: number) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    if (!hasRoleLevel(req.user.roleLevel, requiredRoleLevel)) {
      res.status(403).json({ 
        error: 'Insufficient permissions', 
        required: `Role level ${requiredRoleLevel} or higher`,
        current: `Role level ${req.user.roleLevel}`
      });
      return;
    }

    next();
  };
};

export const requirePermission = (permission: string) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    if (!hasPermission(req.user.roleName, permission)) {
      res.status(403).json({ 
        error: 'Insufficient permissions',
        required: permission,
        role: req.user.roleName
      });
      return;
    }

    next();
  };
};

export const requireOwnResourceOrRole = (requiredRoleLevel: number, userIdParam: string = 'userId') => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const resourceUserId = req.params[userIdParam] || req.body[userIdParam];
    
    // Allow if accessing own resource
    if (resourceUserId && req.user.userId === resourceUserId) {
      next();
      return;
    }

    // Otherwise check role level
    if (!hasRoleLevel(req.user.roleLevel, requiredRoleLevel)) {
      res.status(403).json({ 
        error: 'Can only access own resource or need higher role',
        required: `Role level ${requiredRoleLevel} or higher`,
        current: `Role level ${req.user.roleLevel}`
      });
      return;
    }

    next();
  };
};

export const requireCompanyContext = (companyIdParam: string = 'companyId') => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const resourceCompanyId = req.params[companyIdParam] || req.body[companyIdParam] || req.query[companyIdParam];
    
    if (resourceCompanyId && req.user.companyId !== resourceCompanyId) {
      res.status(403).json({ error: 'Access denied to this company resource' });
      return;
    }

    next();
  };
};

// Convenience middleware combinations
export const requireSuperuser = requireRole(ROLE_LEVELS.SUPERUSER);
export const requireAdmin = requireRole(ROLE_LEVELS.ADMIN);
export const requireManager = requireRole(ROLE_LEVELS.MANAGER);
export const requireEmployee = requireRole(ROLE_LEVELS.EMPLOYEE);

// Permission-based middleware
export const requireUserManagement = requirePermission(PERMISSIONS.MANAGE_USERS);
export const requireEmployeeManagement = requirePermission(PERMISSIONS.MANAGE_EMPLOYEES);
export const requireContractManagement = requirePermission(PERMISSIONS.MANAGE_CONTRACTS);
export const requireTemplateManagement = requirePermission(PERMISSIONS.MANAGE_TEMPLATES);
export const requireDepartmentManagement = requirePermission(PERMISSIONS.MANAGE_DEPARTMENTS);
export const requireSettingsManagement = requirePermission(PERMISSIONS.MANAGE_SETTINGS);

// Resource-specific middleware
export const requireOwnProfileOrAdmin = requireOwnResourceOrRole(ROLE_LEVELS.ADMIN, 'userId');
export const requireOwnEmployeeOrManager = requireOwnResourceOrRole(ROLE_LEVELS.MANAGER, 'employeeId');

// Utility for checking multiple permissions
export const requireAnyPermission = (permissions: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const hasAnyPermission = permissions.some(permission => 
      hasPermission(req.user!.roleName, permission)
    );

    if (!hasAnyPermission) {
      res.status(403).json({ 
        error: 'Insufficient permissions',
        required: `One of: ${permissions.join(', ')}`,
        role: req.user.roleName
      });
      return;
    }

    next();
  };
};

export const requireAllPermissions = (permissions: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const hasAllPermissions = permissions.every(permission => 
      hasPermission(req.user!.roleName, permission)
    );

    if (!hasAllPermissions) {
      res.status(403).json({ 
        error: 'Insufficient permissions',
        required: `All of: ${permissions.join(', ')}`,
        role: req.user.roleName
      });
      return;
    }

    next();
  };
};