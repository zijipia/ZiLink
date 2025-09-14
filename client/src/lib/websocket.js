import { toast } from "react-hot-toast";

/**
 * @typedef {Object} WebSocketMessage
 * @property {string} type
 * @property {any} data
 */

/**
 * @typedef {Object} DeviceDataMessage
 * @property {string} deviceId
 * @property {any[]} sensorData
 * @property {string} timestamp
 */

/**
 * @typedef {Object} DeviceStatusMessage
 * @property {string} deviceId
 * @property {any} status
 * @property {string} timestamp
 */

/**
 * @typedef {Object} DeviceAlertMessage
 * @property {string} deviceId
 * @property {Object} alert
 * @property {string} alert.type
 * @property {'info' | 'warning' | 'error' | 'critical'} alert.severity
 * @property {string} alert.message
 * @property {string} timestamp
 */

/**
 * @typedef {function(any): void} EventHandler
 */

class WebSocketService {
	constructor() {
		/** @type {WebSocket | null} */
		this.ws = null;
		/** @type {string} */
		this.wsUrl = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:3001";
		/** @type {string | null} */
		this.accessToken = null;
		/** @type {boolean} */
		this.isConnected = false;
		/** @type {number} */
		this.reconnectAttempts = 0;
		/** @type {number} */
		this.maxReconnectAttempts = 5;
		/** @type {number} */
		this.reconnectInterval = 3000;
		/** @type {NodeJS.Timeout | null} */
		this.reconnectTimer = null;
		/** @type {NodeJS.Timeout | null} */
		this.pingInterval = null;
		/** @type {Map<string, Set<EventHandler>>} */
		this.eventHandlers = new Map();

		this.loadAccessToken();
	}

	loadAccessToken() {
		if (typeof window !== "undefined") {
			this.accessToken = localStorage.getItem("accessToken");
		}
	}

	/**
	 * Connect to WebSocket server
	 * @param {string} [token] - Access token
	 * @returns {Promise<void>}
	 */
	connect(token) {
		return new Promise((resolve, reject) => {
			if (this.ws && this.ws.readyState === WebSocket.OPEN) {
				resolve();
				return;
			}

			if (token) {
				this.accessToken = token;
			}

			if (!this.accessToken) {
				reject(new Error("No access token available"));
				return;
			}

			try {
				this.ws = new WebSocket(`${this.wsUrl}/ws`);

				this.ws.onopen = () => {
					console.log("🔌 WebSocket connected");
					this.isConnected = true;
					this.reconnectAttempts = 0;

					// Authenticate
					this.send({
						type: "auth",
						data: {
							token: this.accessToken,
							clientType: "web",
						},
					});

					// Start ping interval
					this.startPingInterval();

					resolve();
				};

				this.ws.onmessage = (event) => {
					try {
						/** @type {WebSocketMessage} */
						const message = JSON.parse(event.data);
						this.handleMessage(message);
					} catch (error) {
						console.error("❌ WebSocket message parse error:", error);
					}
				};

				this.ws.onclose = (event) => {
					console.log("🔌 WebSocket connection closed", event.code, event.reason);
					this.isConnected = false;
					this.stopPingInterval();

					// Attempt to reconnect if not manually closed
					if (event.code !== 1000 && this.reconnectAttempts < this.maxReconnectAttempts) {
						this.scheduleReconnect();
					}
				};

				this.ws.onerror = (error) => {
					console.error("❌ WebSocket error:", error);
					this.isConnected = false;
					reject(error);
				};
			} catch (error) {
				console.error("❌ WebSocket connection failed:", error);
				reject(error);
			}
		});
	}

	/**
	 * Handle incoming WebSocket message
	 * @param {WebSocketMessage} message
	 */
	handleMessage(message) {
		const { type, data } = message;

		console.log("📨 WebSocket message received:", type, data);

		switch (type) {
			case "connection":
				console.log("✅ WebSocket connection established:", data.message);
				break;

			case "auth_success":
				console.log("✅ WebSocket authentication successful");
				toast.success("Connected to server");
				break;

			case "device_data":
				this.emit("device_data", /** @type {DeviceDataMessage} */ (data));
				break;

			case "device_batch_data":
				this.emit("device_batch_data", data);
				break;

			case "device_status_update":
				this.emit("device_status", /** @type {DeviceStatusMessage} */ (data));
				break;

			case "device_alert":
				this.emit("device_alert", /** @type {DeviceAlertMessage} */ (data));
				if (data.alert.severity === "error" || data.alert.severity === "critical") {
					toast.error(`Device Alert: ${data.alert.message}`);
				} else if (data.alert.severity === "warning") {
					toast.warning(`Device Warning: ${data.alert.message}`);
				}
				break;

			case "device_online":
				this.emit("device_online", data);
				toast.success(`Device ${data.deviceId} came online`);
				break;

			case "device_offline":
				this.emit("device_offline", data);
				toast.error(`Device ${data.deviceId} went offline`);
				break;

			case "command_sent":
				this.emit("command_sent", data);
				break;

			case "subscribed":
				console.log("✅ Subscribed to device:", data.deviceId);
				break;

			case "error":
				console.error("❌ WebSocket server error:", data.error);
				toast.error(data.error);
				break;

			case "pong":
				// Heartbeat response
				break;

			default:
				console.log("⚠️  Unknown WebSocket message type:", type);
		}

		// Emit generic message event
		this.emit("message", message);
	}

	scheduleReconnect() {
		if (this.reconnectTimer) {
			clearTimeout(this.reconnectTimer);
		}

		this.reconnectAttempts++;
		const delay = this.reconnectInterval * Math.pow(2, this.reconnectAttempts - 1); // Exponential backoff

		console.log(`🔄 Scheduling reconnection attempt ${this.reconnectAttempts} in ${delay}ms`);

		this.reconnectTimer = setTimeout(() => {
			console.log(`🔄 Reconnection attempt ${this.reconnectAttempts}`);
			this.connect().catch((error) => {
				console.error("❌ Reconnection failed:", error);
			});
		}, delay);
	}

	startPingInterval() {
		this.pingInterval = setInterval(() => {
			if (this.isConnected) {
				this.send({ type: "ping", data: {} });
			}
		}, 30000); // Send ping every 30 seconds
	}

	stopPingInterval() {
		if (this.pingInterval) {
			clearInterval(this.pingInterval);
			this.pingInterval = null;
		}
	}

	/**
	 * Send message via WebSocket
	 * @param {WebSocketMessage} message
	 * @returns {boolean}
	 */
	send(message) {
		if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
			console.warn("⚠️  WebSocket not connected, cannot send message");
			return false;
		}

		try {
			this.ws.send(JSON.stringify(message));
			return true;
		} catch (error) {
			console.error("❌ WebSocket send error:", error);
			return false;
		}
	}

	// Device-specific methods
	/**
	 * Subscribe to device updates
	 * @param {string} deviceId
	 * @returns {boolean}
	 */
	subscribeToDevice(deviceId) {
		return this.send({
			type: "subscribe_device",
			data: { deviceId },
		});
	}

	/**
	 * Send command to device
	 * @param {string} deviceId
	 * @param {any} command
	 * @returns {boolean}
	 */
	sendDeviceCommand(deviceId, command) {
		return this.send({
			type: "device_command",
			data: { deviceId, command },
		});
	}

	// Event handling
	/**
	 * Add event listener
	 * @param {string} event
	 * @param {EventHandler} handler
	 */
	on(event, handler) {
		if (!this.eventHandlers.has(event)) {
			this.eventHandlers.set(event, new Set());
		}
		this.eventHandlers.get(event).add(handler);
	}

	/**
	 * Remove event listener
	 * @param {string} event
	 * @param {EventHandler} handler
	 */
	off(event, handler) {
		const handlers = this.eventHandlers.get(event);
		if (handlers) {
			handlers.delete(handler);
			if (handlers.size === 0) {
				this.eventHandlers.delete(event);
			}
		}
	}

	/**
	 * Emit event to all listeners
	 * @param {string} event
	 * @param {any} data
	 */
	emit(event, data) {
		const handlers = this.eventHandlers.get(event);
		if (handlers) {
			handlers.forEach((handler) => {
				try {
					handler(data);
				} catch (error) {
					console.error(`❌ Event handler error for ${event}:`, error);
				}
			});
		}
	}

	/**
	 * Disconnect from WebSocket
	 */
	disconnect() {
		if (this.reconnectTimer) {
			clearTimeout(this.reconnectTimer);
			this.reconnectTimer = null;
		}

		this.stopPingInterval();

		if (this.ws) {
			this.ws.close(1000, "Manual disconnect");
			this.ws = null;
		}

		this.isConnected = false;
		this.reconnectAttempts = 0;
		console.log("🔌 WebSocket disconnected");
	}

	/**
	 * Get connection status
	 * @returns {Object}
	 */
	getConnectionStatus() {
		return {
			isConnected: this.isConnected,
			reconnectAttempts: this.reconnectAttempts,
			readyState: this.ws?.readyState,
		};
	}

	/**
	 * Cleanup method for React component unmounting
	 */
	cleanup() {
		this.eventHandlers.clear();
		this.disconnect();
	}
}

// Export singleton instance
export const websocketService = new WebSocketService();
export default websocketService;
