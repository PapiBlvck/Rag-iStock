import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { Role } from '@istock/shared';

interface User {
  id: string;
  email: string;
  role: Role;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, role: Role) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEY = 'istock_auth';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load user from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const userData = JSON.parse(stored);
        setUser(userData);
      } catch (error) {
        console.error('Failed to parse stored auth data:', error);
        localStorage.removeItem(STORAGE_KEY);
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    // Mock authentication - in production, this would call Firebase Auth
    await new Promise((resolve) => setTimeout(resolve, 500));

    // For demo purposes, accept any email/password combination
    // In production, this would validate against Firebase Auth
    const mockUser: User = {
      id: `user_${Date.now()}`,
      email,
      role: 'Farmer', // Default role, could be fetched from server
    };

    setUser(mockUser);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(mockUser));
  };

  const signup = async (email: string, password: string, role: Role) => {
    // Mock signup - in production, this would call Firebase Auth
    await new Promise((resolve) => setTimeout(resolve, 500));

    const mockUser: User = {
      id: `user_${Date.now()}`,
      email,
      role,
    };

    setUser(mockUser);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(mockUser));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    login,
    signup,
    logout,
  };

  // Don't render children until we've checked localStorage
  if (isLoading) {
    return null; // Or a loading spinner
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

