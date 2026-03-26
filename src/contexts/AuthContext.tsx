import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import type { AuthUser } from '../types';

interface AuthContextType {
  isLoggedIn: boolean;
  isLoading: boolean;
  user: AuthUser | null;
  login: (username: string, password: string, rememberMe?: boolean) => Promise<{ success: boolean; error?: string; needsSetup?: boolean }>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  isLoggedIn: false,
  isLoading: true,
  user: null,
  login: async () => ({ success: false }),
  logout: () => {},
  refreshUser: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    // Check persistent login (localStorage) first, then session login (sessionStorage)
    const savedPersistent = localStorage.getItem('auth_session');
    const savedSession = sessionStorage.getItem('session_auth');

    if (savedPersistent) {
      try {
        const parsed = JSON.parse(savedPersistent);
        setUser(parsed);
        setIsLoggedIn(true);
      } catch {
        localStorage.removeItem('auth_session');
      }
    } else if (savedSession) {
      try {
        const parsed = JSON.parse(savedSession);
        setUser(parsed);
        setIsLoggedIn(true);
      } catch {
        sessionStorage.removeItem('session_auth');
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (username: string, password: string, rememberMe = false) => {
    try {
      const { data, error } = await supabase
        .from('app_settings')
        .select('*')
        .eq('id', 1)
        .single();

      if (error || !data) {
        return { success: false, error: 'خطأ في الاتصال بالسيرفر' };
      }

      if (data.username !== username || data.password !== password) {
        return { success: false, error: 'اسم المستخدم أو كلمة المرور غلط' };
      }

      const authUser: AuthUser = {
        username: data.username,
        security_setup_done: data.security_setup_done,
      };

      if (rememberMe) {
        // Persistent login: save in localStorage
        localStorage.setItem('auth_session', JSON.stringify(authUser));
        localStorage.setItem('rememberedUsername', username);
      } else {
        // Session-only login: save in sessionStorage, clear any remembered username
        sessionStorage.setItem('session_auth', JSON.stringify(authUser));
        localStorage.removeItem('auth_session');
      }

      setUser(authUser);
      setIsLoggedIn(true);

      return { success: true, needsSetup: !data.security_setup_done };
    } catch {
      return { success: false, error: 'خطأ في الاتصال بالسيرفر' };
    }
  };

  const logout = () => {
    localStorage.removeItem('auth_session');
    sessionStorage.removeItem('session_auth');
    setUser(null);
    setIsLoggedIn(false);
  };

  const refreshUser = async () => {
    try {
      const { data } = await supabase.from('app_settings').select('*').eq('id', 1).single();
      if (data) {
        const authUser: AuthUser = {
          username: data.username,
          security_setup_done: data.security_setup_done,
        };
        // Update whichever storage is currently active
        if (localStorage.getItem('auth_session')) {
          localStorage.setItem('auth_session', JSON.stringify(authUser));
        } else {
          sessionStorage.setItem('session_auth', JSON.stringify(authUser));
        }
        setUser(authUser);
      }
    } catch {}
  };

  return (
    <AuthContext.Provider value={{ isLoggedIn, isLoading, user, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
