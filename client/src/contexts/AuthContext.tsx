'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import apiService, { User, AuthTokens } from '@/lib/api';
import websocketService from '@/lib/websocket';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (updates: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    try {
      if (apiService.isAuthenticated()) {
        const currentUser = await apiService.getCurrentUser();
        setUser(currentUser);
        
        // Initialize WebSocket connection
        const token = apiService.getAccessToken();
        if (token) {
          try {
            await websocketService.connect(token);
          } catch (error) {
            console.error('Failed to connect WebSocket:', error);
          }
        }
      }
    } catch (error) {
      console.error('Auth initialization failed:', error);
      // Token might be expired, clear storage
      await apiService.logout();
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      const { user: loggedInUser, tokens } = await apiService.login(email, password);
      setUser(loggedInUser);
      
      // Connect WebSocket
      await websocketService.connect(tokens.accessToken);
      
      router.push('/dashboard');
    } catch (error: any) {
      console.error('Login failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (email: string, password: string, name: string) => {
    try {
      setIsLoading(true);
      const { user: newUser, tokens } = await apiService.register(email, password, name);
      setUser(newUser);
      
      // Connect WebSocket
      await websocketService.connect(tokens.accessToken);
      
      router.push('/dashboard');
    } catch (error: any) {
      console.error('Registration failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      setIsLoading(true);
      await apiService.logout();
      websocketService.disconnect();
      setUser(null);
      router.push('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateUser = async (updates: Partial<User>) => {
    try {
      if (!user) return;
      
      const updatedUser = await apiService.updateUserProfile(updates);
      setUser(updatedUser);
    } catch (error) {
      console.error('Update user failed:', error);
      throw error;
    }
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    updateUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
