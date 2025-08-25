import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { toast } from 'react-hot-toast';

// Types
export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  preferences: {
    theme: 'light' | 'dark' | 'auto';
    notifications: {
      email: boolean;
      push: boolean;
      deviceAlerts: boolean;
    };
    timezone: string;
  };
  emailVerified: boolean;
  lastLogin?: string;
  createdAt: string;
}

export interface Device {
  _id: string;
  deviceId: string;
  name: string;
  description: string;
  type: string;
  category: string;
  owner: string;
  specifications: any;
  capabilities: {
    sensors: Array<{
      type: string;
      unit: string;
      range?: { min: number; max: number };
      accuracy?: string;
    }>;
    actuators: Array<{
      type: string;
      commands: string[];
    }>;
    supportsMQTT: boolean;
    supportsWebSocket: boolean;
    supportsOTA: boolean;
  };
  configuration: {
    sampleRate: number;
    reportingInterval: number;
    dataRetention: number;
    alertThresholds: Map<string, any>;
  };
  status: {
    isOnline: boolean;
    lastSeen?: string;
    battery?: {
      level: number;
      isCharging: boolean;
      lastUpdated: string;
    };
    health: {
      status: 'healthy' | 'warning' | 'error' | 'maintenance';
      lastCheck: string;
      issues: string[];
    };
  };
  network: {
    ipAddress?: string;
    macAddress?: string;
    networkType: string;
    signalStrength?: number;
  };
  location: {
    name: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
    room?: string;
    building?: string;
  };
  tags: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DeviceData {
  _id: string;
  device: string;
  deviceId: string;
  data: any;
  sensors: Array<{
    type: string;
    value: any;
    unit: string;
    timestamp: string;
    quality: 'good' | 'uncertain' | 'bad';
    calibrated: boolean;
  }>;
  deviceStatus?: {
    battery?: { level: number; isCharging: boolean };
    signalStrength?: number;
    temperature?: number;
    uptime?: number;
  };
  alerts?: Array<{
    type: string;
    severity: 'info' | 'warning' | 'error' | 'critical';
    message: string;
    acknowledged: boolean;
    acknowledgedAt?: string;
    acknowledgedBy?: string;
  }>;
  timestamp: string;
  receivedAt: string;
  createdAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

class ApiService {
  private api: AxiosInstance;
  private accessToken: string | null = null;
  private refreshToken: string | null = null;

  constructor() {
    this.api = axios.create({
      baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
    this.loadTokensFromStorage();
  }

  private setupInterceptors() {
    // Request interceptor
    this.api.interceptors.request.use(
      (config) => {
        if (this.accessToken) {
          config.headers.Authorization = `Bearer ${this.accessToken}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor
    this.api.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            await this.refreshTokens();
            return this.api(originalRequest);
          } catch (refreshError) {
            this.logout();
            window.location.href = '/login';
            return Promise.reject(refreshError);
          }
        }

        // Handle other errors
        if (error.response?.data?.message) {
          toast.error(error.response.data.message);
        } else if (error.message) {
          toast.error(error.message);
        }

        return Promise.reject(error);
      }
    );
  }

  private loadTokensFromStorage() {
    if (typeof window !== 'undefined') {
      this.accessToken = localStorage.getItem('accessToken');
      this.refreshToken = localStorage.getItem('refreshToken');
    }
  }

  private saveTokensToStorage(tokens: AuthTokens) {
    if (typeof window !== 'undefined') {
      localStorage.setItem('accessToken', tokens.accessToken);
      localStorage.setItem('refreshToken', tokens.refreshToken);
      this.accessToken = tokens.accessToken;
      this.refreshToken = tokens.refreshToken;
    }
  }

  private clearTokensFromStorage() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      this.accessToken = null;
      this.refreshToken = null;
    }
  }

  // Auth methods
  async login(email: string, password: string): Promise<{ user: User; tokens: AuthTokens }> {
    const response = await this.api.post('/api/auth/login', { email, password });
    const { user, tokens } = response.data;
    this.saveTokensToStorage(tokens);
    toast.success('Successfully logged in!');
    return { user, tokens };
  }

  async register(email: string, password: string, name: string): Promise<{ user: User; tokens: AuthTokens }> {
    const response = await this.api.post('/api/auth/register', { email, password, name });
    const { user, tokens } = response.data;
    this.saveTokensToStorage(tokens);
    toast.success('Account created successfully!');
    return { user, tokens };
  }

  async logout(): Promise<void> {
    try {
      await this.api.post('/api/auth/logout');
    } catch (error) {
      // Ignore error, logout anyway
    }
    this.clearTokensFromStorage();
    toast.success('Logged out successfully');
  }

  async refreshTokens(): Promise<AuthTokens> {
    if (!this.refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await this.api.post('/api/auth/refresh', { 
      refreshToken: this.refreshToken 
    });
    const tokens = response.data.tokens;
    this.saveTokensToStorage(tokens);
    return tokens;
  }

  async getCurrentUser(): Promise<User> {
    const response = await this.api.get('/api/auth/me');
    return response.data.user;
  }

  // OAuth methods
  getOAuthUrl(provider: 'google' | 'github' | 'discord'): string {
    return `${process.env.NEXT_PUBLIC_API_URL}/api/auth/${provider}`;
  }

  // Device methods
  async getDevices(params?: { 
    type?: string; 
    status?: 'online' | 'offline'; 
    limit?: number; 
    page?: number; 
  }): Promise<{ devices: Device[]; pagination: any }> {
    const response = await this.api.get('/api/devices', { params });
    return response.data.data;
  }

  async getDevice(deviceId: string): Promise<Device> {
    const response = await this.api.get(`/api/devices/${deviceId}`);
    return response.data.data;
  }

  async registerDevice(deviceData: Partial<Device>): Promise<Device> {
    const response = await this.api.post('/api/devices/register', deviceData);
    toast.success('Device registered successfully!');
    return response.data.data;
  }

  async updateDevice(deviceId: string, updates: Partial<Device>): Promise<Device> {
    const response = await this.api.put(`/api/devices/${deviceId}`, updates);
    toast.success('Device updated successfully!');
    return response.data.data;
  }

  async deleteDevice(deviceId: string): Promise<void> {
    await this.api.delete(`/api/devices/${deviceId}`);
    toast.success('Device deleted successfully!');
  }

  async getDeviceData(deviceId: string, params?: {
    startDate?: string;
    endDate?: string;
    limit?: number;
    interval?: 'hour' | 'day' | 'month';
  }): Promise<{ deviceId: string; data: DeviceData[]; count: number }> {
    const response = await this.api.get(`/api/devices/${deviceId}/data`, { params });
    return response.data.data;
  }

  async sendDeviceCommand(deviceId: string, command: any): Promise<void> {
    const response = await this.api.post(`/api/devices/${deviceId}/command`, { command });
    toast.success('Command sent successfully!');
  }

  async getDeviceStats(deviceId: string, period = '24h'): Promise<any> {
    const response = await this.api.get(`/api/devices/${deviceId}/stats`, { 
      params: { period } 
    });
    return response.data.data;
  }

  async rotateDeviceApiKey(deviceId: string): Promise<{ deviceId: string; newApiKey: string; rotatedAt: string }> {
    const response = await this.api.post(`/api/devices/${deviceId}/rotate-key`);
    toast.success('API key rotated successfully!');
    return response.data.data;
  }

  async getConnectedDevices(): Promise<{ connectedCount: number; devices: Device[] }> {
    const response = await this.api.get('/api/devices/status/connected');
    return response.data.data;
  }

  async getUnacknowledgedAlerts(severity?: string): Promise<DeviceData[]> {
    const response = await this.api.get('/api/devices/alerts/unacknowledged', {
      params: severity ? { severity } : {}
    });
    return response.data.data;
  }

  async acknowledgeAlert(alertId: string, dataId: string, alertIndex: number): Promise<void> {
    await this.api.post(`/api/devices/alerts/${alertId}/acknowledge`, {
      dataId,
      alertIndex
    });
    toast.success('Alert acknowledged');
  }

  // User methods
  async getUserProfile(): Promise<User> {
    const response = await this.api.get('/api/users/profile');
    return response.data.data;
  }

  async updateUserProfile(updates: Partial<User>): Promise<User> {
    const response = await this.api.put('/api/users/profile', updates);
    toast.success('Profile updated successfully!');
    return response.data.data;
  }

  async getDashboardData(): Promise<{
    summary: {
      totalDevices: number;
      onlineDevices: number;
      offlineDevices: number;
      uptimePercentage: number;
    };
    deviceTypes: Array<{ _id: string; count: number }>;
    recentDevices: Device[];
    user: {
      name: string;
      email: string;
      memberSince: string;
    };
  }> {
    const response = await this.api.get('/api/users/dashboard');
    return response.data.data;
  }

  async deleteAccount(confirmPassword?: string): Promise<void> {
    await this.api.delete('/api/users/account', {
      data: confirmPassword ? { confirmPassword } : {}
    });
    this.clearTokensFromStorage();
    toast.success('Account deleted successfully');
  }

  // Utility methods
  isAuthenticated(): boolean {
    return !!this.accessToken;
  }

  getAccessToken(): string | null {
    return this.accessToken;
  }

  // Method to manually set tokens (for OAuth callback)
  setTokens(accessToken: string, refreshToken: string): void {
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
    this.saveTokensToStorage({ accessToken, refreshToken });
  }
}

// Export singleton instance
export const apiService = new ApiService();
export default apiService;
