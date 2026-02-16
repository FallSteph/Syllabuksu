import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import { User, UserRole } from '@/types';
import { MOCK_AUTH_USERS } from '@/mock/authData';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  initialized: boolean;
  login: (email: string, password: string, recaptchaToken: string) => Promise<{ success: boolean; error?: string; user?: User }>;
  signup: (data: SignupData) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;
  loginWithGoogle: (idToken: string) => Promise<{ success: boolean; error?: string }>;
}

interface SignupData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: UserRole;
  college: string;
  department: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const AUTH_USER_KEY = 'auth_user';
  const AUTH_TOKEN_KEY = 'auth_token';
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(AUTH_USER_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as User;
        if (parsed && parsed.email) {
          setUser(parsed);
        }
      }
    } catch {}
    setInitialized(true);
  }, []);

  const login = useCallback(async (email: string, password: string, recaptchaToken: string) => {
    if (!recaptchaToken) {
      return { success: false, error: 'Please complete the reCAPTCHA challenge' };
    }

    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, recaptchaToken }),
      });
      const data = await res.json();
      if (!data.success) {
        return { success: false, error: data.error || 'Login failed' };
      }
      const u = data.user as User;
      setUser(u);
       try {
         localStorage.setItem(AUTH_USER_KEY, JSON.stringify(u));
         if (data.token) {
           localStorage.setItem(AUTH_TOKEN_KEY, String(data.token));
         }
       } catch {}
      return { success: true, user: u };
    } catch {
      return { success: false, error: 'Unable to contact auth server' };
    }
  }, []);

  const loginWithGoogle = useCallback(async (idToken: string) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      });
      const data = await res.json();
      if (!data.success) {
        return { success: false, error: 'Google sign-in failed' };
      }
      const u = data.user as User;
      setUser(u);
      try {
        localStorage.setItem(AUTH_USER_KEY, JSON.stringify(u));
        if (data.token) {
          localStorage.setItem(AUTH_TOKEN_KEY, String(data.token));
        }
      } catch {}
      return { success: true };
    } catch {
      return { success: false, error: 'Unable to contact auth server' };
    }
  }, []);

  const signup = useCallback(async (data: SignupData) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          password: data.password,
          role: data.role,
          college: data.college,
          department: data.department,
        }),
      });
      const result = await res.json();
      if (!result.success) {
        return { success: false, error: result.error || 'Signup failed' };
      }
      return { success: true };
    } catch {
      return { success: false, error: 'Unable to contact auth server' };
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    try {
      localStorage.removeItem(AUTH_USER_KEY);
      localStorage.removeItem(AUTH_TOKEN_KEY);
    } catch {}
  }, []);

  const updateUser = useCallback((updates: Partial<User>) => {
    setUser(prev => {
      const next = prev ? { ...prev, ...updates } : (updates as User);
      try {
        localStorage.setItem(AUTH_USER_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
  }, []);

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated: !!user,
      initialized,
      login,
      loginWithGoogle,
      signup,
      logout,
      updateUser,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
