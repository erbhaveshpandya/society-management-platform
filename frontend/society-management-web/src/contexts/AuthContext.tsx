import React, { createContext, useState, useEffect, ReactNode } from 'react';
import axiosClient from '../api/axiosClient';
import { User, LoginResponse, UserRole } from '../types';

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const initializeAuth = () => {
      const storedToken = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');

      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      }
      setLoading(false);
    };

    initializeAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await axiosClient.post<LoginResponse>('auth/login', { email, password });
      const { token: jwtToken, fullName, role, userId, societyId, societyName, permissions } = response.data;

      const loggedInUser: User = {
        id: userId,
        email,
        fullName,
        role: role as UserRole,
        societyId,
        societyName,
        permissions: permissions || [],
      };

      localStorage.setItem('token', jwtToken);
      localStorage.setItem('user', JSON.stringify(loggedInUser));

      setToken(jwtToken);
      setUser(loggedInUser);
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
