'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import apiService from '@/lib/api';
import websocketService from '@/lib/websocket';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';

/**
 * @typedef {Object} AuthContextType
 * @property {import('@/lib/api').User | null} user
 * @property {boolean} isLoading
 * @property {boolean} isAuthenticated
 * @property {function(string, string): Promise<void>} login
 * @property {function(string, string, string): Promise<void>} register
 * @property {function(): Promise<void>} logout
 * @property {function(Partial<import('@/lib/api').User>): Promise<void>} updateUser
 */

/** @type {React.Context<AuthContextType | undefined>} */
const AuthContext = createContext(undefined);

/**
 * Hook to use auth context
 * @returns {AuthContextType}
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

/**
 * @typedef {Object} AuthProviderProps
 * @property {React.ReactNode} children
 */

/**
 * Auth Provider component
 * @param {AuthProviderProps} props
 * @returns {React.JSX.Element}
 */
export const AuthProvider = ({ children }) => {
  /** @type {[import('@/lib/api').User | null, function]} */
  const [user, setUser] = useState(null);
  /** @type {[boolean, function]} */
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

  /**
   * Login user
   * @param {string} email 
   * @param {string} password 
   */
  const login = async (email, password) => {
    try {
      setIsLoading(true);
      const { user: loggedInUser, tokens } = await apiService.login(email, password);
      setUser(loggedInUser);
      
      // Connect WebSocket
      await websocketService.connect(tokens.accessToken);
      
      router.push('/dashboard');
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Register new user
   * @param {string} email 
   * @param {string} password 
   * @param {string} name 
   */
  const register = async (email, password, name) => {
    try {
      setIsLoading(true);
      const { user: newUser, tokens } = await apiService.register(email, password, name);
      setUser(newUser);
      
      // Connect WebSocket
      await websocketService.connect(tokens.accessToken);
      
      router.push('/dashboard');
    } catch (error) {
      console.error('Registration failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Logout user
   */
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

  /**
   * Update user profile
   * @param {Partial<import('@/lib/api').User>} updates 
   */
  const updateUser = async (updates) => {
    try {
      if (!user) return;
      
      const updatedUser = await apiService.updateUserProfile(updates);
      setUser(updatedUser);
    } catch (error) {
      console.error('Update user failed:', error);
      throw error;
    }
  };

  /** @type {AuthContextType} */
  const value = {
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
