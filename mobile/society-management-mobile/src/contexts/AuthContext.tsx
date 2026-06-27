import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import * as SecureStore from 'expo-secure-store';
import { User, UserRole, LoginResponse } from '../types/auth.types';
import { authService } from '../services/authService';
import { authEvents } from '../utils/authEvents';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Restore session on mount
  useEffect(() => {
    const restoreSession = async () => {
      try {
        const storedToken = await SecureStore.getItemAsync('token');
        const storedUser = await SecureStore.getItemAsync('user');

        if (storedToken && storedUser) {
          setToken(storedToken);
          setUser(JSON.parse(storedUser));
        }
      } catch (error) {
        console.warn('Failed to restore session:', error);
      } finally {
        setIsLoading(false);
      }
    };

    restoreSession();
  }, []);

  // Listen for 401 events from axiosClient
  useEffect(() => {
    const unsubscribe = authEvents.subscribe(() => {
      setToken(null);
      setUser(null);
    });
    return unsubscribe;
  }, []);

  const login = async (email: string, password: string): Promise<void> => {
    const response: LoginResponse = await authService.login(email, password);

    const loggedInUser: User = {
      id: response.userId,
      email,
      fullName: response.fullName,
      role: response.role as UserRole,
      societyId: response.societyId,
      societyName: response.societyName,
      permissions: response.permissions || [],
    };

    await SecureStore.setItemAsync('token', response.token);
    await SecureStore.setItemAsync('user', JSON.stringify(loggedInUser));

    if (response.societyId) {
      await SecureStore.setItemAsync('selectedSocietyId', response.societyId.toString());
    }

    setToken(response.token);
    setUser(loggedInUser);
  };

  const logout = async (): Promise<void> => {
    try {
      await SecureStore.deleteItemAsync('token');
      await SecureStore.deleteItemAsync('user');
      await SecureStore.deleteItemAsync('selectedSocietyId');
    } catch {
      // Ignore cleanup errors
    }
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
