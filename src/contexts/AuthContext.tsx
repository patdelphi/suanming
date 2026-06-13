import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { localApi, User, AuthResponse } from '../lib/localApi';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<any>;
  signUp: (email: string, password: string, fullName?: string) => Promise<any>;
  signOut: () => Promise<any>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Load user on mount (one-time check)
  useEffect(() => {
    async function loadUser() {
      setLoading(true);
      try {
        const response = await localApi.auth.getUser();
        if (response.data) {
          setUser(response.data.user);
        } else {
          setUser(null);
        }
      } catch (error) {
        // 静默处理用户信息加载错误
        setUser(null);
      } finally {
        setLoading(false);
      }
    }
    loadUser();
  }, []);

  // Auth methods
  async function signIn(email: string, password: string) {
    try {
      const response = await localApi.auth.signInWithPassword({ email, password });
      if (response.data) {
        setUser(response.data.user);
        return { data: response.data, error: null };
      } else {
        return { data: null, error: response.error };
      }
    } catch (error) {
      return { data: null, error: { message: '登录失败' } };
    }
  }

  async function signUp(email: string, password: string, fullName?: string) {
    try {
      const response = await localApi.auth.signUp(email, password, fullName);
      if (response.data) {
        setUser(response.data.user);
        return { data: response.data, error: null };
      } else {
        return { data: null, error: response.error };
      }
    } catch (error) {
      return { data: null, error: { message: '注册失败' } };
    }
  }

  async function signOut() {
    try {
      const response = await localApi.auth.signOut();
      setUser(null);
      return { error: null };
    } catch (error) {
      return { error: { message: '登出失败' } };
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}