const mqtt = require('mqtt');
const Device = require('../models/Device');
const DeviceData = require('../models/DeviceData');
const { wsManager } = require('./websocket');

class MQTTManager {
  constructor() {
    this.client = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 10;
    this.reconnectInterval = 5000; // 5 seconds
  }

  initMQTTClient() {
    const options = {
      clientId: `zilink-server-${Date.now()}`,
      clean: true,
      connectTimeout: 4000,
      username: process.env.MQTT_USERNAME || '',
      password: process.env.MQTT_PASSWORD || '',
      reconnectPeriod: this.reconnectInterval,
      will: {
        topic: 'zilink/server/status',
        payload: JSON.stringify({
          status: 'offline',
          timestamp: new Date().toISOString()
        }),
        qos: 1,
        retain: true
      }
    };

    try {
      this.client = mqtt.connect(process.env.MQTT_BROKER_URL || 'mqtt://localhost:1883', options);
      this.setupEventHandlers();
      return this.client;
    } catch (error) {
      console.error('❌ MQTT connection failed:', error);
      return null;
    }
  }

  setupEventHandlers() {
    // Connection successful
    this.client.on('connect', () => {
      console.log('📡 MQTT client connected');
      this.isConnected = true;
      this.reconnectAttempts = 0;
      
      // Subscribe to device topics
      this.subscribeToTopics();
      
      // Publish server online status
      this.publishServerStatus('online');
    });

    // Connection error
    this.client.on('error', (error) => {
      console.error('❌ MQTT connection error:', error);
      this.isConnected = false;
    });

    // Connection closed
    this.client.on('close', () => {
      console.log('⚠️  MQTT connection closed');
      this.isConnected = false;
    });

    // Reconnecting
    this.client.on('reconnect', () => {
      this.reconnectAttempts++;
      console.log(`🔄 MQTT reconnecting... attempt ${this.reconnectAttempts}`);
      
      if (this.reconnectAttempts > this.maxReconnectAttempts) {
        console.error('❌ MQTT max reconnection attempts reached');
        this.client.end();
      }
    });

    // Message received
    this.client.on('message', async (topic, message) => {
      try {
        await this.handleMessage(topic, message);
      } catch (error) {
        console.error('❌ MQTT message handling error:', error);
      }
    });

    // Offline
    this.client.on('offline', () => {
      console.log('📡 MQTT client offline');
      this.isConnected = false;
    });
  }

  subscribeToTopics() {
    const topics = [
      'zilink/devices/+/data',        // Device data: zilink/devices/{deviceId}/data
      'zilink/devices/+/status',      // Device status: zilink/devices/{deviceId}/status
      'zilink/devices/+/heartbeat',   // Device heartbeat: zilink/devices/{deviceId}/heartbeat
      'zilink/devices/+/alert',       // Device alerts: zilink/devices/{deviceId}/alert
      'zilink/devices/+/register',    // Device registration: zilink/devices/{deviceId}/register
    ];

    topics.forEach(topic => {
      this.client.subscribe(topic, { qos: 1 }, (err) => {
        if (err) {
          console.error(`❌ Failed to subscribe to ${topic}:`, err);
        } else {
          console.log(`📡 Subscribed to MQTT topic: ${topic}`);
        }
      });
    });
  }

  async handleMessage(topic, message) {
    try {
      const payload = JSON.parse(message.toString());
      const topicParts = topic.split('/');
      
      if (topicParts.length < 3 || topicParts[0] !== 'zilink' || topicParts[1] !== 'devices') {
        return;
      }
      
      const deviceId = topicParts[2];
      const messageType = topicParts[3];
      
      console.log(`📡 MQTT message received: ${topic}`, payload);
      
      switch (messageType) {
        case 'data':
          await this.handleDeviceData(deviceId, payload);
          break;
        case 'status':
          await this.handleDeviceStatus(deviceId, payload);
          break;
        case 'heartbeat':
          await this.handleDeviceHeartbeat(deviceId, payload);
          break;
        case 'alert':
          await this.handleDeviceAlert(deviceId, payload);
          break;
        case 'register':
          await this.handleDeviceRegistration(deviceId, payload);
          break;
        default:
          console.log(`⚠️  Unknown MQTT message type: ${messageType}`);
      }
      
    } catch (error) {
      console.error('❌ MQTT message parsing error:', error);
    }
  }

  async handleDeviceData(deviceId, payload) {
    try {
      // Find device
      const device = await Device.findOne({ deviceId });
      if (!device) {
        console.error(`❌ Device not found: ${deviceId}`);
        return;
      }

      // Create device data entry
      const deviceData = new DeviceData({
        device: device._id,
        deviceId,
        data: payload.data || {},
        sensors: payload.sensors || [],
        deviceStatus: payload.deviceStatus || {},
        location: payload.location || {},
        metadata: {
          source: 'mqtt',
          protocol: 'MQTT',
          messageId: payload.messageId,
          ...payload.metadata
        }
      });

      // Validate and save
      deviceData.validateData();
      await deviceData.save();

      // Update device last seen
      await device.updateStatus({
        isOnline: true,
        lastSeen: new Date(),
        ...payload.deviceStatus
      });

      // Broadcast to WebSocket clients
      wsManager.broadcastToWebClients({
        type: 'device_data',
        data: {
          deviceId,
          sensorData: payload.sensors || [],
          timestamp: deviceData.timestamp
        }
      });

      console.log(`📊 Device data processed: ${deviceId}`);
      
    } catch (error) {
      console.error('❌ Handle device data error:', error);
    }
  }

  async handleDeviceStatus(deviceId, payload) {
    try {
      const device = await Device.findOne({ deviceId });
      if (!device) {
        console.error(`❌ Device not found: ${deviceId}`);
        return;
      }

      await device.updateStatus({
        isOnline: payload.isOnline !== undefined ? payload.isOnline : true,
        lastSeen: new Date(),
        battery: payload.battery,
        health: payload.health
      });

      // Broadcast to WebSocket clients
      wsManager.broadcastToWebClients({
        type: 'device_status_update',
        data: {
          deviceId,
          status: device.status,
          timestamp: new Date().toISOString()
        }
      });

      console.log(`📱 Device status updated: ${deviceId}`);
      
    } catch (error) {
      console.error('❌ Handle device status error:', error);
    }
  }

  async handleDeviceHeartbeat(deviceId, payload) {
    try {
      const device = await Device.findOne({ deviceId });
      if (!device) {
        console.error(`❌ Device not found: ${deviceId}`);
        return;
      }

      await device.updateStatus({
        isOnline: true,
        lastSeen: new Date(),
        battery: payload.battery,
        health: payload.health
      });

      console.log(`💓 Heartbeat received: ${deviceId}`);
      
    } catch (error) {
      console.error('❌ Handle device heartbeat error:', error);
    }
  }

  async handleDeviceAlert(deviceId, payload) {
    try {
      const device = await Device.findOne({ deviceId });
      if (!device) {
        console.error(`❌ Device not found: ${deviceId}`);
        return;
      }

      // Create alert data entry
      const deviceData = new DeviceData({
        device: device._id,
        deviceId,
        data: {},
        sensors: [],
        alerts: [{
          type: payload.type || 'system',
          severity: payload.severity || 'warning',
          message: payload.message || 'Device alert',
          threshold: payload.threshold
        }],
        metadata: {
          source: 'mqtt',
          protocol: 'MQTT',
          messageId: payload.messageId
        }
      });

      await deviceData.save();

      // Broadcast alert to WebSocket clients
      wsManager.broadcastToWebClients({
        type: 'device_alert',
        data: {
          deviceId,
          alert: deviceData.alerts[0],
          timestamp: deviceData.timestamp
        }
      });

      console.log(`🚨 Device alert processed: ${deviceId} - ${payload.severity}`);
      
    } catch (error) {
      console.error('❌ Handle device alert error:', error);
    }
  }

  async handleDeviceRegistration(deviceId, payload) {
    try {
      // This would typically be handled through the API, but devices can also register via MQTT
      console.log(`📱 Device registration request via MQTT: ${deviceId}`, payload);
      
      // You might want to implement auto-registration logic here
      // or just log the request for manual processing
      
    } catch (error) {
      console.error('❌ Handle device registration error:', error);
    }
  }

  // Publish methods
  publishServerStatus(status) {
    if (!this.isConnected) return;
    
    const payload = {
      status,
      timestamp: new Date().toISOString(),
      version: '1.0.0'
    };
    
    this.publish('zilink/server/status', payload, { retain: true });
  }

  publishDeviceCommand(deviceId, command) {
    if (!this.isConnected) return false;
    
    const topic = `zilink/devices/${deviceId}/command`;
    const payload = {
      command,
      timestamp: new Date().toISOString(),
      commandId: require('crypto').randomUUID()
    };
    
    this.publish(topic, payload);
    return true;
  }

  publishDeviceConfig(deviceId, config) {
    if (!this.isConnected) return false;
    
    const topic = `zilink/devices/${deviceId}/config`;
    const payload = {
      config,
      timestamp: new Date().toISOString()
    };
    
    this.publish(topic, payload, { retain: true });
    return true;
  }

  publish(topic, payload, options = {}) {
    if (!this.isConnected || !this.client) {
      console.warn('⚠️  MQTT not connected, cannot publish message');
      return false;
    }
    
    const message = JSON.stringify(payload);
    const pubOptions = {
      qos: 1,
      ...options
    };
    
    this.client.publish(topic, message, pubOptions, (err) => {
      if (err) {
        console.error(`❌ MQTT publish error to ${topic}:`, err);
      } else {
        console.log(`📤 MQTT message published to ${topic}`);
      }
    });
    
    return true;
  }

  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      reconnectAttempts: this.reconnectAttempts,
      clientId: this.client?.options?.clientId
    };
  }

  disconnect() {
    if (this.client) {
      this.publishServerStatus('offline');
      this.client.end();
      this.isConnected = false;
      console.log('📡 MQTT client disconnected');
    }
  }
}

const mqttManager = new MQTTManager();

const initMQTTClient = () => {
  return mqttManager.initMQTTClient();
};

module.exports = {
  initMQTTClient,
  mqttManager
};
