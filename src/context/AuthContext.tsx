import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { api } from '../services/api';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
  isOwner: boolean;
  login: (phone: string, pass: string) => Promise<void>;
  register: (params: { phone: string; password: string; name?: string; apelido?: string; birth_date?: string; corda?: string }) => Promise<void>;
  logout: () => void;
  updateUser: (updatedData: Partial<User>) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem('abada_user');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setUser(parsed);
        // refresh in background
        if (parsed.phone) {
          api.getProfile(parsed.phone)
            .then(res => {
              setUser(res.user);
              localStorage.setItem('abada_user', JSON.stringify(res.user));
            })
            .catch(() => {});
        }
      } catch (e) {
        localStorage.removeItem('abada_user');
      }
    }
    setLoading(false);
  }, []);

  const login = async (phone: string, pass: string) => {
    const res = await api.login(phone, pass);
    setUser(res.user);
    localStorage.setItem('abada_user', JSON.stringify(res.user));
  };

  const register = async (params: { phone: string; password: string; name?: string; apelido?: string; birth_date?: string; corda?: string }) => {
    const res = await api.register(params);
    setUser(res.user);
    localStorage.setItem('abada_user', JSON.stringify(res.user));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('abada_user');
  };

  const updateUser = async (updatedData: Partial<User>) => {
    if (!user) return;
    const res = await api.updateProfile({
      phone: user.phone,
      ...updatedData
    });
    setUser(res.user);
    localStorage.setItem('abada_user', JSON.stringify(res.user));
  };

  const refreshProfile = async () => {
    if (!user) return;
    try {
      const res = await api.getProfile(user.phone);
      setUser(res.user);
      localStorage.setItem('abada_user', JSON.stringify(res.user));
    } catch (e) {}
  };

  const cleanPhone = user?.phone ? user.phone.replace(/\D/g, '') : '';
  const isOwner = cleanPhone === '41984842941';
  const isAdmin = user?.role === 'admin' || isOwner;

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      isAdmin,
      isOwner,
      login,
      register,
      logout,
      updateUser,
      refreshProfile
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
