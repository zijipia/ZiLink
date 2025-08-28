import WebSocket, { WebSocketServer } from "ws";
import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";

class WebSocketManager {
	constructor() {
		this.clients = new Map(); // Map of userId -> WebSocket connections
		this.deviceConnections = new Map(); // Map of deviceId -> WebSocket connections
	}

	initWebSocketServer(server) {
		this.wss = new WebSocketServer({
			server,
			path: "/ws",
			verifyClient: (info) => {
				// You can add authentication logic here if needed
				return true;
			},
		});

		this.wss.on("connection", (ws, req) => {
			const connectionId = uuidv4();
			ws.connectionId = connectionId;

			console.log(`🔌 New WebSocket connection: ${connectionId}`);

			// Handle incoming messages
			ws.on("message", async (data) => {
				try {
					const message = JSON.parse(data.toString());
					await this.handleMessage(ws, message);
				} catch (error) {
					console.error("❌ WebSocket message error:", error);
					this.sendError(ws, "Invalid message format");
				}
			});

			// Handle connection close
			ws.on("close", () => {
				console.log(`🔌 WebSocket connection closed: ${connectionId}`);
				this.removeConnection(ws);
			});

			// Handle errors
			ws.on("error", (error) => {
				console.error("❌ WebSocket error:", error);
				this.removeConnection(ws);
			});

			// Send welcome message
			this.sendMessage(ws, {
				type: "connection",
				data: {
					connectionId,
					message: "Connected to ZiLink WebSocket server",
					timestamp: new Date().toISOString(),
				},
			});
		});

		console.log("🔌 WebSocket server initialized");
		return this.wss;
	}

	async handleMessage(ws, message) {
		const { type, data } = message;

		switch (type) {
			case "auth":
				await this.handleAuth(ws, data);
				break;

			case "device_register":
				await this.handleDeviceRegister(ws, data);
				break;

			case "device_data":
				await this.handleDeviceData(ws, data);
				break;

			case "device_command":
				await this.handleDeviceCommand(ws, data);
				break;

			case "subscribe_device":
				await this.handleSubscribeDevice(ws, data);
				break;

			case "ping":
				this.sendMessage(ws, { type: "pong", data: { timestamp: new Date().toISOString() } });
				break;

			default:
				this.sendError(ws, `Unknown message type: ${type}`);
				break;
		}
	}

	async handleAuth(ws, data) {
		try {
			const { token, clientType } = data; // clientType: 'web' | 'device'

			if (!token) {
				return this.sendError(ws, "Authentication token required");
			}

			// Verify JWT token
			const decoded = jwt.verify(token, process.env.JWT_SECRET);

			ws.userId = decoded.userId;
			ws.clientType = clientType || "web";
			ws.authenticated = true;

			if (clientType === "device") {
				ws.deviceId = decoded.deviceId;
				this.deviceConnections.set(decoded.deviceId, ws);
			} else {
				// Web client
				if (!this.clients.has(decoded.userId)) {
					this.clients.set(decoded.userId, new Set());
				}
				this.clients.get(decoded.userId).add(ws);
			}

			this.sendMessage(ws, {
				type: "auth_success",
				data: {
					userId: decoded.userId,
					clientType: ws.clientType,
					message: "Authentication successful",
				},
			});

			console.log(`✅ WebSocket authenticated: ${ws.clientType} - ${decoded.userId}`);
		} catch (error) {
			console.error("❌ WebSocket auth error:", error);
			this.sendError(ws, "Authentication failed");
		}
	}

	async handleDeviceRegister(ws, data) {
		if (ws.clientType !== "device") {
			return this.sendError(ws, "Only devices can register");
		}

		const { deviceInfo } = data;

		// Here you would typically save device info to database
		console.log(`📱 Device registered: ${ws.deviceId}`, deviceInfo);

		this.sendMessage(ws, {
			type: "device_registered",
			data: {
				deviceId: ws.deviceId,
				message: "Device registered successfully",
			},
		});

		// Notify web clients about new device
		this.broadcastToWebClients({
			type: "device_online",
			data: {
				deviceId: ws.deviceId,
				deviceInfo,
				timestamp: new Date().toISOString(),
			},
		});
	}

	async handleDeviceData(ws, data) {
		if (ws.clientType !== "device") {
			return this.sendError(ws, "Only devices can send data");
		}

		const { sensorData } = data;

		console.log(`📊 Device data received from ${ws.deviceId}:`, sensorData);

		// Here you would typically save the data to database

		// Broadcast to all web clients
		this.broadcastToWebClients({
			type: "device_data",
			data: {
				deviceId: ws.deviceId,
				sensorData,
				timestamp: new Date().toISOString(),
			},
		});
	}

	async handleDeviceCommand(ws, data) {
		if (ws.clientType !== "web") {
			return this.sendError(ws, "Only web clients can send commands");
		}

		const { deviceId, command } = data;

		const deviceWs = this.deviceConnections.get(deviceId);
		if (!deviceWs || deviceWs.readyState !== WebSocket.OPEN) {
			return this.sendError(ws, "Device not connected");
		}

		// Send command to device
		this.sendMessage(deviceWs, {
			type: "command",
			data: {
				command,
				timestamp: new Date().toISOString(),
			},
		});

		// Confirm to web client
		this.sendMessage(ws, {
			type: "command_sent",
			data: {
				deviceId,
				command,
				timestamp: new Date().toISOString(),
			},
		});

		console.log(`📤 Command sent to device ${deviceId}:`, command);
	}

	async handleSubscribeDevice(ws, data) {
		if (ws.clientType !== "web") {
			return this.sendError(ws, "Only web clients can subscribe");
		}

		const { deviceId } = data;

		if (!ws.subscribedDevices) {
			ws.subscribedDevices = new Set();
		}

		ws.subscribedDevices.add(deviceId);

		this.sendMessage(ws, {
			type: "subscribed",
			data: {
				deviceId,
				message: `Subscribed to device ${deviceId}`,
			},
		});

		console.log(`👀 Web client subscribed to device: ${deviceId}`);
	}

	sendMessage(ws, message) {
		if (ws.readyState === WebSocket.OPEN) {
			ws.send(JSON.stringify(message));
		}
	}

	sendError(ws, error) {
		this.sendMessage(ws, {
			type: "error",
			data: {
				error,
				timestamp: new Date().toISOString(),
			},
		});
	}

	broadcastToWebClients(message) {
		this.clients.forEach((connections, userId) => {
			connections.forEach((ws) => {
				if (ws.readyState === WebSocket.OPEN) {
					this.sendMessage(ws, message);
				}
			});
		});
	}

	broadcastToDevice(deviceId, message) {
		const deviceWs = this.deviceConnections.get(deviceId);
		if (deviceWs && deviceWs.readyState === WebSocket.OPEN) {
			this.sendMessage(deviceWs, message);
		}
	}

	removeConnection(ws) {
		if (ws.clientType === "device" && ws.deviceId) {
			this.deviceConnections.delete(ws.deviceId);

			// Notify web clients that device is offline
			this.broadcastToWebClients({
				type: "device_offline",
				data: {
					deviceId: ws.deviceId,
					timestamp: new Date().toISOString(),
				},
			});
		} else if (ws.clientType === "web" && ws.userId) {
			const userConnections = this.clients.get(ws.userId);
			if (userConnections) {
				userConnections.delete(ws);
				if (userConnections.size === 0) {
					this.clients.delete(ws.userId);
				}
			}
		}
	}

	getConnectedDevices() {
		return Array.from(this.deviceConnections.keys());
	}

	getConnectedUsers() {
		return Array.from(this.clients.keys());
	}
}

export const wsManager = new WebSocketManager();

export const initWebSocketServer = (server) => {
	return wsManager.initWebSocketServer(server);
};
