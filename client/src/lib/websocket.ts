import { toast } from 'react-hot-toast';

export interface WebSocketMessage {
  type: string;
  data: any;
}

export interface DeviceDataMessage {
  deviceId: string;
  sensorData: any[];
  timestamp: string;
}

export interface DeviceStatusMessage {
  deviceId: string;
  status: any;
  timestamp: string;
}

export interface DeviceAlertMessage {
  deviceId: string;
  alert: {
    type: string;
    severity: 'info' | 'warning' | 'error' | 'critical';
    message: string;
  };
  timestamp: string;
}

type EventHandler = (data: any) => void;

class WebSocketService {
  private ws: WebSocket | null = null;
  private wsUrl: string;
  private accessToken: string | null = null;
  private isConnected: boolean = false;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private reconnectInterval: number = 3000;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private pingInterval: NodeJS.Timeout | null = null;
  private eventHandlers: Map<string, Set<EventHandler>> = new Map();

  constructor() {
    this.wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001';
    this.loadAccessToken();
  }

  private loadAccessToken() {
    if (typeof window !== 'undefined') {
      this.accessToken = localStorage.getItem('accessToken');
    }
  }

  connect(token?: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        resolve();
        return;
      }

      if (token) {
        this.accessToken = token;
      }

      if (!this.accessToken) {
        reject(new Error('No access token available'));
        return;
      }

      try {
        this.ws = new WebSocket(`${this.wsUrl}/ws`);
        
        this.ws.onopen = () => {
          console.log('🔌 WebSocket connected');
          this.isConnected = true;
          this.reconnectAttempts = 0;
          
          // Authenticate
          this.send({
            type: 'auth',
            data: {
              token: this.accessToken,
              clientType: 'web'
            }
          });
          
          // Start ping interval
          this.startPingInterval();
          
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const message: WebSocketMessage = JSON.parse(event.data);
            this.handleMessage(message);
          } catch (error) {
            console.error('❌ WebSocket message parse error:', error);
          }
        };

        this.ws.onclose = (event) => {
          console.log('🔌 WebSocket connection closed', event.code, event.reason);
          this.isConnected = false;
          this.stopPingInterval();
          
          // Attempt to reconnect if not manually closed
          if (event.code !== 1000 && this.reconnectAttempts < this.maxReconnectAttempts) {
            this.scheduleReconnect();
          }
        };

        this.ws.onerror = (error) => {
          console.error('❌ WebSocket error:', error);
          this.isConnected = false;
          reject(error);
        };

      } catch (error) {
        console.error('❌ WebSocket connection failed:', error);
        reject(error);
      }
    });
  }

  private handleMessage(message: WebSocketMessage) {
    const { type, data } = message;
    
    console.log('📨 WebSocket message received:', type, data);
    
    switch (type) {
      case 'connection':
        console.log('✅ WebSocket connection established:', data.message);
        break;
        
      case 'auth_success':
        console.log('✅ WebSocket authentication successful');
        toast.success('Connected to server');
        break;
        
      case 'device_data':
        this.emit('device_data', data as DeviceDataMessage);
        break;
        
      case 'device_status_update':
        this.emit('device_status', data as DeviceStatusMessage);
        break;
        
      case 'device_alert':
        this.emit('device_alert', data as DeviceAlertMessage);
        if (data.alert.severity === 'error' || data.alert.severity === 'critical') {
          toast.error(`Device Alert: ${data.alert.message}`);
        } else if (data.alert.severity === 'warning') {
          toast.warning(`Device Warning: ${data.alert.message}`);
        }
        break;
        
      case 'device_online':
        this.emit('device_online', data);
        toast.success(`Device ${data.deviceId} came online`);
        break;
        
      case 'device_offline':
        this.emit('device_offline', data);
        toast.error(`Device ${data.deviceId} went offline`);
        break;
        
      case 'command_sent':
        this.emit('command_sent', data);
        break;
        
      case 'subscribed':
        console.log('✅ Subscribed to device:', data.deviceId);
        break;
        
      case 'error':
        console.error('❌ WebSocket server error:', data.error);
        toast.error(data.error);
        break;
        
      case 'pong':
        // Heartbeat response
        break;
        
      default:
        console.log('⚠️  Unknown WebSocket message type:', type);
    }
    
    // Emit generic message event
    this.emit('message', message);
  }

  private scheduleReconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }
    
    this.reconnectAttempts++;
    const delay = this.reconnectInterval * Math.pow(2, this.reconnectAttempts - 1); // Exponential backoff
    
    console.log(`🔄 Scheduling reconnection attempt ${this.reconnectAttempts} in ${delay}ms`);
    
    this.reconnectTimer = setTimeout(() => {
      console.log(`🔄 Reconnection attempt ${this.reconnectAttempts}`);
      this.connect().catch((error) => {
        console.error('❌ Reconnection failed:', error);
      });
    }, delay);
  }

  private startPingInterval() {
    this.pingInterval = setInterval(() => {
      if (this.isConnected) {
        this.send({ type: 'ping', data: {} });
      }
    }, 30000); // Send ping every 30 seconds
  }

  private stopPingInterval() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  send(message: WebSocketMessage): boolean {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.warn('⚠️  WebSocket not connected, cannot send message');
      return false;
    }
    
    try {
      this.ws.send(JSON.stringify(message));
      return true;
    } catch (error) {
      console.error('❌ WebSocket send error:', error);
      return false;
    }
  }

  // Device-specific methods
  subscribeToDevice(deviceId: string): boolean {
    return this.send({
      type: 'subscribe_device',
      data: { deviceId }
    });
  }

  sendDeviceCommand(deviceId: string, command: any): boolean {
    return this.send({
      type: 'device_command',
      data: { deviceId, command }
    });
  }

  // Event handling
  on(event: string, handler: EventHandler): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set());
    }
    this.eventHandlers.get(event)!.add(handler);
  }

  off(event: string, handler: EventHandler): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.delete(handler);
      if (handlers.size === 0) {
        this.eventHandlers.delete(event);
      }
    }
  }

  private emit(event: string, data: any): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(data);
        } catch (error) {
          console.error(`❌ Event handler error for ${event}:`, error);
        }
      });
    }
  }

  disconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    
    this.stopPingInterval();
    
    if (this.ws) {
      this.ws.close(1000, 'Manual disconnect');
      this.ws = null;
    }
    
    this.isConnected = false;
    this.reconnectAttempts = 0;
    console.log('🔌 WebSocket disconnected');
  }

  getConnectionStatus(): {
    isConnected: boolean;
    reconnectAttempts: number;
    readyState?: number;
  } {
    return {
      isConnected: this.isConnected,
      reconnectAttempts: this.reconnectAttempts,
      readyState: this.ws?.readyState
    };
  }

  // Cleanup method for React component unmounting
  cleanup(): void {
    this.eventHandlers.clear();
    this.disconnect();
  }
}

// Export singleton instance
export const websocketService = new WebSocketService();
export default websocketService;
