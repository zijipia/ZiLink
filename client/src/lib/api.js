import axios from "axios";
import { toast } from "react-hot-toast";

/**
 * @typedef {Object} User
 * @property {string} id
 * @property {string} email
 * @property {string} name
 * @property {string} [avatar]
 * @property {Object} preferences
 * @property {'light' | 'dark' | 'auto'} preferences.theme
 * @property {Object} preferences.notifications
 * @property {boolean} preferences.notifications.email
 * @property {boolean} preferences.notifications.push
 * @property {boolean} preferences.notifications.deviceAlerts
 * @property {string} preferences.timezone
 * @property {boolean} emailVerified
 * @property {string} [lastLogin]
 * @property {string} createdAt
 */

/**
 * @typedef {Object} Device
 * @property {string} _id
 * @property {string} deviceId
 * @property {string} name
 * @property {string} description
 * @property {string} type
 * @property {string} category
 * @property {string} owner
 * @property {any} specifications
 * @property {Object} capabilities
 * @property {Array<Object>} capabilities.sensors
 * @property {Array<Object>} capabilities.actuators
 * @property {boolean} capabilities.supportsMQTT
 * @property {boolean} capabilities.supportsWebSocket
 * @property {boolean} capabilities.supportsOTA
 * @property {Object} configuration
 * @property {number} configuration.sampleRate
 * @property {number} configuration.reportingInterval
 * @property {number} configuration.dataRetention
 * @property {Map<string, any>} configuration.alertThresholds
 * @property {Object} status
 * @property {boolean} status.isOnline
 * @property {string} [status.lastSeen]
 * @property {Object} [status.battery]
 * @property {Object} status.health
 * @property {'healthy' | 'warning' | 'error' | 'maintenance'} status.health.status
 * @property {string} status.health.lastCheck
 * @property {string[]} status.health.issues
 * @property {Object} network
 * @property {string} [network.ipAddress]
 * @property {string} [network.macAddress]
 * @property {string} network.networkType
 * @property {number} [network.signalStrength]
 * @property {Object} location
 * @property {string} location.name
 * @property {Object} [location.coordinates]
 * @property {number} [location.coordinates.latitude]
 * @property {number} [location.coordinates.longitude]
 * @property {string} [location.room]
 * @property {string} [location.building]
 * @property {string[]} tags
 * @property {boolean} isActive
 * @property {string} createdAt
 * @property {string} updatedAt
 */

/**
 * @typedef {Object} DeviceData
 * @property {string} _id
 * @property {string} device
 * @property {string} deviceId
 * @property {any} data
 * @property {Array<Object>} sensors
 * @property {Object} [deviceStatus]
 * @property {Array<Object>} [alerts]
 * @property {string} timestamp
 * @property {string} receivedAt
 * @property {string} createdAt
 */

/**
 * @typedef {Object} AuthTokens
 * @property {string} accessToken
 * @property {string} refreshToken
 */

/**
 * @typedef {Object} ApiResponse
 * @template T
 * @property {boolean} success
 * @property {string} [message]
 * @property {T} [data]
 * @property {string} [error]
 */

class ApiService {
	constructor() {
		/** @type {import('axios').AxiosInstance} */
		this.api = axios.create({
			baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001",
			timeout: 10000,
			headers: {
				"Content-Type": "application/json",
			},
		});

		/** @type {string | null} */
		this.accessToken = null;
		/** @type {string | null} */
		this.refreshToken = null;

		this.setupInterceptors();
		this.loadTokensFromStorage();
	}

	setupInterceptors() {
		// Request interceptor
		this.api.interceptors.request.use(
			(config) => {
				if (this.accessToken) {
					config.headers.Authorization = `Bearer ${this.accessToken}`;
				}
				return config;
			},
			(error) => Promise.reject(error),
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
						window.location.href = "/login";
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
			},
		);
	}

	loadTokensFromStorage() {
		if (typeof window !== "undefined") {
			this.accessToken = localStorage.getItem("accessToken");
			this.refreshToken = localStorage.getItem("refreshToken");
		}
	}

	/**
	 * Save tokens to storage
	 * @param {AuthTokens} tokens
	 */
	saveTokensToStorage(tokens) {
		if (typeof window !== "undefined") {
			localStorage.setItem("accessToken", tokens.accessToken);
			localStorage.setItem("refreshToken", tokens.refreshToken);
			this.accessToken = tokens.accessToken;
			this.refreshToken = tokens.refreshToken;
		}
	}

	clearTokensFromStorage() {
		if (typeof window !== "undefined") {
			localStorage.removeItem("accessToken");
			localStorage.removeItem("refreshToken");
			this.accessToken = null;
			this.refreshToken = null;
		}
	}

	// Auth methods
	/**
	 * Login user
	 * @param {string} email
	 * @param {string} password
	 * @returns {Promise<{ user: User; tokens: AuthTokens }>}
	 */
	async login(email, password) {
		const response = await this.api.post("/api/auth/login", { email, password });
		const { user, tokens } = response.data;
		this.saveTokensToStorage(tokens);
		toast.success("Successfully logged in!");
		return { user, tokens };
	}

	/**
	 * Register new user
	 * @param {string} email
	 * @param {string} password
	 * @param {string} name
	 * @returns {Promise<{ user: User; tokens: AuthTokens }>}
	 */
	async register(email, password, name) {
		const response = await this.api.post("/api/auth/register", { email, password, name });
		const { user, tokens } = response.data;
		this.saveTokensToStorage(tokens);
		toast.success("Account created successfully!");
		return { user, tokens };
	}

	/**
	 * Logout user
	 * @returns {Promise<void>}
	 */
	async logout() {
		try {
			await this.api.post("/api/auth/logout");
		} catch (error) {
			// Ignore error, logout anyway
		}
		this.clearTokensFromStorage();
		toast.success("Logged out successfully");
	}

	/**
	 * Refresh authentication tokens
	 * @returns {Promise<AuthTokens>}
	 */
	async refreshTokens() {
		if (!this.refreshToken) {
			throw new Error("No refresh token available");
		}

		const response = await this.api.post("/api/auth/refresh", {
			refreshToken: this.refreshToken,
		});
		const tokens = response.data.tokens;
		this.saveTokensToStorage(tokens);
		return tokens;
	}

	/**
	 * Get current user
	 * @returns {Promise<User>}
	 */
	async getCurrentUser() {
		const response = await this.api.get("/api/auth/me");
		return response.data.user;
	}

	// OAuth methods
	/**
	 * Get OAuth URL
	 * @param {'google' | 'github' | 'discord'} provider
	 * @returns {string}
	 */
	getOAuthUrl(provider) {
		return `${process.env.NEXT_PUBLIC_API_URL}/api/auth/${provider}`;
	}

	// Device methods
	/**
	 * Get devices
	 * @param {Object} [params]
	 * @param {string} [params.type]
	 * @param {'online' | 'offline'} [params.status]
	 * @param {number} [params.limit]
	 * @param {number} [params.page]
	 * @returns {Promise<{ devices: Device[]; pagination: any }>}
	 */
	async getDevices(params) {
		const response = await this.api.get("/api/devices", { params });
		return response.data.data;
	}

	/**
	 * Get single device
	 * @param {string} deviceId
	 * @returns {Promise<Device>}
	 */
	async getDevice(deviceId) {
		const response = await this.api.get(`/api/devices/${deviceId}`);
		return response.data.data;
	}

	/**
	 * Register new device (ID auto-generated on server)
	 * @param {Partial<Device>} deviceData
	 * @returns {Promise<{device: Device}>}
	 */
	async registerDevice(deviceData) {
		const response = await this.api.post("/api/devices/register", deviceData);
		toast.success("Device registered successfully!");
		return response.data.data;
	}

	/**
	 * Send command to device
	 * @param {string} deviceId
	 * @param {string} command
	 */
	async sendCommand(deviceId, command) {
		await this.api.post(`/api/devices/${deviceId}/command`, { command });
		toast.success("Command sent");
	}

	/**
	 * Update device
	 * @param {string} deviceId
	 * @param {Partial<Device>} updates
	 * @returns {Promise<Device>}
	 */
	async updateDevice(deviceId, updates) {
		const response = await this.api.put(`/api/devices/${deviceId}`, updates);
		toast.success("Device updated successfully!");
		return response.data.data;
	}

	/**
	 * Delete device
	 * @param {string} deviceId
	 * @returns {Promise<void>}
	 */
	async deleteDevice(deviceId) {
		await this.api.delete(`/api/devices/${deviceId}`);
		toast.success("Device deleted successfully!");
	}

	/**
	 * Get device data
	 * @param {string} deviceId
	 * @param {Object} [params]
	 * @param {string} [params.startDate]
	 * @param {string} [params.endDate]
	 * @param {number} [params.limit]
	 * @param {'hour' | 'day' | 'month'} [params.interval]
	 * @returns {Promise<{ deviceId: string; data: DeviceData[]; count: number }>}
	 */
	async getDeviceData(deviceId, params) {
		const response = await this.api.get(`/api/devices/${deviceId}/data`, { params });
		return response.data.data;
	}

	/**
	 * Send device command
	 * @param {string} deviceId
	 * @param {any} command
	 * @returns {Promise<void>}
	 */
	async sendDeviceCommand(deviceId, command) {
		const response = await this.api.post(`/api/devices/${deviceId}/command`, { command });
		toast.success("Command sent successfully!");
	}

	/**
	 * Get device stats
	 * @param {string} deviceId
	 * @param {string} [period='24h']
	 * @returns {Promise<any>}
	 */
	async getDeviceStats(deviceId, period = "24h") {
		const response = await this.api.get(`/api/devices/${deviceId}/stats`, {
			params: { period },
		});
		return response.data.data;
	}

	/**
	 * Rotate device API key
	 * @param {string} deviceId
	 * @returns {Promise<{ deviceId: string; newApiKey: string; rotatedAt: string }>}
	 */
	async rotateDeviceApiKey(deviceId) {
		const response = await this.api.post(`/api/devices/${deviceId}/rotate-key`);
		toast.success("API key rotated successfully!");
		return response.data.data;
	}

	/**
	 * Get connected devices
	 * @returns {Promise<{ connectedCount: number; devices: Device[] }>}
	 */
	async getConnectedDevices() {
		const response = await this.api.get("/api/devices/status/connected");
		return response.data.data;
	}

	/**
	 * Get unacknowledged alerts
	 * @param {string} [severity]
	 * @returns {Promise<DeviceData[]>}
	 */
	async getUnacknowledgedAlerts(severity) {
		const response = await this.api.get("/api/devices/alerts/unacknowledged", {
			params: severity ? { severity } : {},
		});
		return response.data.data;
	}

	/**
	 * Acknowledge alert
	 * @param {string} alertId
	 * @param {string} dataId
	 * @param {number} alertIndex
	 * @returns {Promise<void>}
	 */
	async acknowledgeAlert(alertId, dataId, alertIndex) {
		await this.api.post(`/api/devices/alerts/${alertId}/acknowledge`, {
			dataId,
			alertIndex,
		});
		toast.success("Alert acknowledged");
	}

	// User methods
	/**
	 * Get user profile
	 * @returns {Promise<User>}
	 */
	async getUserProfile() {
		const response = await this.api.get("/api/users/profile");
		return response.data.data;
	}

	/**
	 * Update user profile
	 * @param {Partial<User>} updates
	 * @returns {Promise<User>}
	 */
	async updateUserProfile(updates) {
		const response = await this.api.put("/api/users/profile", updates);
		toast.success("Profile updated successfully!");
		return response.data.data;
	}

	/**
	 * Get dashboard data
	 * @returns {Promise<Object>}
	 */
	async getDashboardData() {
		const response = await this.api.get("/api/users/dashboard");
		return response.data.data;
	}

	/**
	 * Delete account
	 * @param {string} [confirmPassword]
	 * @returns {Promise<void>}
	 */
	async deleteAccount(confirmPassword) {
		await this.api.delete("/api/users/account", {
			data: confirmPassword ? { confirmPassword } : {},
		});
		this.clearTokensFromStorage();
		toast.success("Account deleted successfully");
	}

	// Utility methods
	/**
	 * Check if user is authenticated
	 * @returns {boolean}
	 */
	isAuthenticated() {
		return !!this.accessToken;
	}

	/**
	 * Get access token
	 * @returns {string | null}
	 */
	getAccessToken() {
		return this.accessToken;
	}

	/**
	 * Manually set tokens (for OAuth callback)
	 * @param {string} accessToken
	 * @param {string} refreshToken
	 */
	setTokens(accessToken, refreshToken) {
		this.accessToken = accessToken;
		this.refreshToken = refreshToken;
		this.saveTokensToStorage({ accessToken, refreshToken });
	}
}

// Export singleton instance
export const apiService = new ApiService();
export default apiService;
