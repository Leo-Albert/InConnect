import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api, setAuthToken } from '../services/api';

interface User {
  id: string;
  name: string;
  email: string;
  profileimage?: string;
  bio?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (userData: User) => void;
  logout: () => void;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const checkAuth = async () => {
    console.log('[AuthContext] Starting checkAuth. localStorage token:', localStorage.getItem('token'));
    try {
      const data = await api.auth.me();
      console.log('[AuthContext] checkAuth SUCCESS. User found:', data.user?.email || 'Unknown');
      setUser(data.user);
    } catch (err: any) {
      console.error('[AuthContext] checkAuth FAILED:', err.message || err);
      setUser(null);
    } finally {
      console.log('[AuthContext] checkAuth FINISHED. Setting loading: false');
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const login = (data: any) => {
    if (data.token) {
      setAuthToken(data.token);
    }
    setUser(data.user || data);
  };

  const logout = async () => {
    setAuthToken(null);
    try {
      await api.auth.logout();
    } catch (e) { }
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, checkAuth }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
