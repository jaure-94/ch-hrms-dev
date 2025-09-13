import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { apiRequest } from './queryClient';

// User and authentication types
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  isActive: boolean;
  emailVerified: boolean;
  lastLoginAt: string | null;
  role: {
    id: string;
    name: string;
    description: string;
    level: number;
    permissions: string[];
  };
  company: {
    id: string;
    name: string;
    setupCompleted: boolean;
  };
}

export interface AuthState {
  user: User | null;
  accessToken: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface SignupData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  company: {
    name: string;
    address?: string | null;
    phone?: string | null;
    email?: string | null;
    website?: string | null;
    industry?: string | null;
    size?: string | null;
    departments?: Array<{
      name: string;
      description?: string | null;
    }>;
  };
}

interface AuthContextType extends AuthState {
  login: (data: LoginData) => Promise<void>;
  signup: (data: SignupData) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<boolean>;
  hasPermission: (permission: string) => boolean;
  hasRole: (roleName: string) => boolean;
  hasRoleLevel: (requiredLevel: number) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Token management utilities
let accessToken: string | null = null;
let tokenRefreshPromise: Promise<boolean> | null = null;

export const setAccessToken = (token: string | null) => {
  accessToken = token;
};

export const getAccessToken = () => accessToken;

export const clearAuth = () => {
  accessToken = null;
  tokenRefreshPromise = null;
};

// Enhanced API request function with automatic token handling
export const authenticatedApiRequest = async (
  method: string,
  url: string,
  data?: unknown
): Promise<Response> => {
  const makeRequest = async (token?: string) => {
    const headers: Record<string, string> = {
      ...(data ? { "Content-Type": "application/json" } : {}),
      ...(token ? { "Authorization": `Bearer ${token}` } : {}),
    };

    const res = await fetch(url, {
      method,
      headers,
      body: data ? JSON.stringify(data) : undefined,
      credentials: "include",
    });

    return res;
  };

  // Try with current token
  let res = await makeRequest(accessToken || undefined);

  // If unauthorized and we have a token, try to refresh
  if (res.status === 401 && accessToken) {
    // Use existing refresh promise or create new one
    if (!tokenRefreshPromise) {
      tokenRefreshPromise = refreshAccessToken();
    }

    const refreshed = await tokenRefreshPromise;
    tokenRefreshPromise = null;

    if (refreshed) {
      // Retry with new token
      res = await makeRequest(accessToken || undefined);
    }
  }

  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }

  return res;
};

// Token refresh utility
const refreshAccessToken = async (): Promise<boolean> => {
  try {
    const res = await apiRequest('POST', '/auth/refresh');
    const data = await res.json();
    
    if (data.accessToken) {
      setAccessToken(data.accessToken);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Token refresh failed:', error);
    clearAuth();
    return false;
  }
};

// AuthProvider component
interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    accessToken: null,
    isLoading: true,
    isAuthenticated: false,
  });

  // Initialize auth state on app load
  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    try {
      // Try to get user info (will use refresh token if needed)
      const res = await authenticatedApiRequest('GET', '/me');
      const userData = await res.json();
      
      setAuthState({
        user: userData,
        accessToken: getAccessToken(),
        isLoading: false,
        isAuthenticated: true,
      });
    } catch (error) {
      // No valid session, user needs to login
      setAuthState({
        user: null,
        accessToken: null,
        isLoading: false,
        isAuthenticated: false,
      });
    }
  };

  const login = async (loginData: LoginData) => {
    try {
      const res = await apiRequest('POST', '/auth/login', loginData);
      const data = await res.json();
      
      setAccessToken(data.accessToken);
      
      setAuthState({
        user: data.user,
        accessToken: data.accessToken,
        isLoading: false,
        isAuthenticated: true,
      });
    } catch (error) {
      throw new Error('Login failed');
    }
  };

  const signup = async (signupData: SignupData) => {
    try {
      const res = await apiRequest('POST', '/auth/signup', signupData);
      const data = await res.json();
      
      setAccessToken(data.accessToken);
      
      setAuthState({
        user: data.user,
        accessToken: data.accessToken,
        isLoading: false,
        isAuthenticated: true,
      });
    } catch (error) {
      throw new Error('Signup failed');
    }
  };

  const logout = async () => {
    try {
      await apiRequest('POST', '/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      clearAuth();
      setAuthState({
        user: null,
        accessToken: null,
        isLoading: false,
        isAuthenticated: false,
      });
    }
  };

  const refreshToken = async (): Promise<boolean> => {
    const success = await refreshAccessToken();
    if (success) {
      // Update auth state with new token
      setAuthState(prev => ({
        ...prev,
        accessToken: getAccessToken(),
      }));
    } else {
      // Refresh failed, clear auth state
      setAuthState({
        user: null,
        accessToken: null,
        isLoading: false,
        isAuthenticated: false,
      });
    }
    return success;
  };

  const hasPermission = (permission: string): boolean => {
    return authState.user?.role.permissions.includes(permission) || false;
  };

  const hasRole = (roleName: string): boolean => {
    return authState.user?.role.name === roleName;
  };

  const hasRoleLevel = (requiredLevel: number): boolean => {
    return (authState.user?.role.level || 999) <= requiredLevel;
  };

  const contextValue: AuthContextType = {
    ...authState,
    login,
    signup,
    logout,
    refreshToken,
    hasPermission,
    hasRole,
    hasRoleLevel,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook to use auth context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// HOC for protected routes
interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: string;
  requiredPermission?: string;
  requiredRoleLevel?: number;
  fallback?: ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRole,
  requiredPermission,
  requiredRoleLevel,
  fallback = <div>Access denied</div>,
}) => {
  const { isAuthenticated, isLoading, hasRole, hasPermission, hasRoleLevel } = useAuth();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return <div>Please log in</div>;
  }

  // Check role requirements
  if (requiredRole && !hasRole(requiredRole)) {
    return <>{fallback}</>;
  }

  if (requiredPermission && !hasPermission(requiredPermission)) {
    return <>{fallback}</>;
  }

  if (requiredRoleLevel && !hasRoleLevel(requiredRoleLevel)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

// Role-based component rendering
interface RoleGuardProps {
  children: ReactNode;
  allowedRoles?: string[];
  requiredPermissions?: string[];
  requiredRoleLevel?: number;
  fallback?: ReactNode;
}

export const RoleGuard: React.FC<RoleGuardProps> = ({
  children,
  allowedRoles,
  requiredPermissions,
  requiredRoleLevel,
  fallback = null,
}) => {
  const { user, hasPermission, hasRoleLevel } = useAuth();

  if (!user) {
    return <>{fallback}</>;
  }

  // Check allowed roles
  if (allowedRoles && !allowedRoles.includes(user.role.name)) {
    return <>{fallback}</>;
  }

  // Check required permissions
  if (requiredPermissions && !requiredPermissions.every(permission => hasPermission(permission))) {
    return <>{fallback}</>;
  }

  // Check role level
  if (requiredRoleLevel && !hasRoleLevel(requiredRoleLevel)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};