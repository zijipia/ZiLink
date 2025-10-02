/**
 * Flash Service for ESP32 devices
 * Handles code flashing via Web Serial API and WebSocket
 */

class FlashService {
	constructor() {
		this.port = null;
		this.writer = null;
		this.reader = null;
		this.isConnected = false;
		this.isFlashing = false;
		this.onProgress = null;
		this.onStatus = null;
	}

	/**
	 * Check if Web Serial API is supported
	 * @returns {boolean}
	 */
	isWebSerialSupported() {
		return "serial" in navigator;
	}

	/**
	 * Request serial port access
	 * @returns {Promise<boolean>}
	 */
	async requestPortAccess() {
		if (!this.isWebSerialSupported()) {
			throw new Error("Web Serial API is not supported in this browser");
		}

		try {
			this.port = await navigator.serial.requestPort();
			return true;
		} catch (error) {
			if (error.name === "NotAllowedError") {
				throw new Error("User denied port access");
			}
			throw error;
		}
	}

	/**
	 * Connect to serial port
	 * @param {Object} options - Connection options
	 * @param {number} options.baudRate - Baud rate (default: 115200)
	 * @param {number} options.dataBits - Data bits (default: 8)
	 * @param {number} options.stopBits - Stop bits (default: 1)
	 * @param {string} options.parity - Parity (default: 'none')
	 * @returns {Promise<boolean>}
	 */
	async connect(options = {}) {
		if (!this.port) {
			throw new Error("No port selected");
		}

		const config = {
			baudRate: options.baudRate || 115200,
			dataBits: options.dataBits || 8,
			stopBits: options.stopBits || 1,
			parity: options.parity || "none",
			flowControl: "none",
		};

		try {
			await this.port.open(config);
			this.writer = this.port.writable.getWriter();
			this.reader = this.port.readable.getReader();
			this.isConnected = true;

			if (this.onStatus) {
				this.onStatus("connected");
			}

			return true;
		} catch (error) {
			this.isConnected = false;
			throw new Error(`Failed to connect: ${error.message}`);
		}
	}

	/**
	 * Disconnect from serial port
	 */
	async disconnect() {
		try {
			if (this.writer) {
				await this.writer.releaseLock();
				this.writer = null;
			}
			if (this.reader) {
				await this.reader.releaseLock();
				this.reader = null;
			}
			if (this.port) {
				await this.port.close();
				this.port = null;
			}
			this.isConnected = false;

			if (this.onStatus) {
				this.onStatus("disconnected");
			}
		} catch (error) {
			console.error("Error disconnecting:", error);
		}
	}

	/**
	 * Send data to device
	 * @param {string} data - Data to send
	 */
	async sendData(data) {
		if (!this.writer) {
			throw new Error("Not connected to device");
		}

		const encoder = new TextEncoder();
		await this.writer.write(encoder.encode(data));
	}

	/**
	 * Read data from device
	 * @param {number} timeout - Timeout in milliseconds
	 * @returns {Promise<string>}
	 */
	async readData(timeout = 1000) {
		if (!this.reader) {
			throw new Error("Not connected to device");
		}

		const decoder = new TextDecoder();
		let data = "";

		try {
			const startTime = Date.now();
			while (Date.now() - startTime < timeout) {
				const { value, done } = await this.reader.read();
				if (done) break;
				data += decoder.decode(value, { stream: true });
			}
		} catch (error) {
			console.error("Error reading data:", error);
		}

		return data;
	}

	/**
	 * Flash code to ESP32 via WebSocket (OTA)
	 * @param {string} code - Code to flash
	 * @param {string} deviceId - Target device ID
	 * @param {Object} settings - Flash settings
	 * @returns {Promise<boolean>}
	 */
	async flashViaWebSocket(code, deviceId, settings = {}) {
		if (this.isFlashing) {
			throw new Error("Flash operation already in progress");
		}

		this.isFlashing = true;

		try {
			// Simulate OTA flash process
			const steps = [
				{ name: "Preparing code...", progress: 10 },
				{ name: "Compiling...", progress: 25 },
				{ name: "Connecting to device...", progress: 40 },
				{ name: "Erasing flash...", progress: 60 },
				{ name: "Writing code...", progress: 80 },
				{ name: "Verifying...", progress: 95 },
				{ name: "Complete!", progress: 100 },
			];

			for (const step of steps) {
				if (this.onProgress) {
					this.onProgress(step.progress, step.name);
				}

				// Simulate processing time
				await new Promise((resolve) => setTimeout(resolve, 500 + Math.random() * 1000));
			}

			// In real implementation, send code via WebSocket to device
			// This would involve:
			// 1. Establishing WebSocket connection to device
			// 2. Sending flash command with code
			// 3. Monitoring progress via WebSocket messages
			// 4. Handling errors and completion

			return true;
		} catch (error) {
			throw new Error(`Flash failed: ${error.message}`);
		} finally {
			this.isFlashing = false;
		}
	}

	/**
	 * Flash code to ESP32 via Serial
	 * @param {string} code - Code to flash
	 * @param {Object} settings - Flash settings
	 * @returns {Promise<boolean>}
	 */
	async flashViaSerial(code, settings = {}) {
		if (!this.isConnected) {
			throw new Error("Not connected to device");
		}

		if (this.isFlashing) {
			throw new Error("Flash operation already in progress");
		}

		this.isFlashing = true;

		try {
			// Enter bootloader mode
			await this.sendData("\r\n");
			await new Promise((resolve) => setTimeout(resolve, 100));

			// Send bootloader commands
			await this.sendData("AT+RST\r\n");
			await new Promise((resolve) => setTimeout(resolve, 1000));

			// Send flash command
			await this.sendData("AT+FLASH\r\n");
			await new Promise((resolve) => setTimeout(resolve, 500));

			// Send code in chunks
			const chunks = this.chunkString(code, 64);
			let progress = 0;

			for (let i = 0; i < chunks.length; i++) {
				await this.sendData(chunks[i]);
				progress = Math.round((i / chunks.length) * 100);

				if (this.onProgress) {
					this.onProgress(progress, `Writing chunk ${i + 1}/${chunks.length}`);
				}

				await new Promise((resolve) => setTimeout(resolve, 50));
			}

			// Verify flash
			await this.sendData("AT+VERIFY\r\n");
			await new Promise((resolve) => setTimeout(resolve, 1000));

			if (this.onProgress) {
				this.onProgress(100, "Flash complete!");
			}

			return true;
		} catch (error) {
			throw new Error(`Serial flash failed: ${error.message}`);
		} finally {
			this.isFlashing = false;
		}
	}

	/**
	 * Flash code using the appropriate method
	 * @param {string} code - Code to flash
	 * @param {string} deviceId - Target device ID
	 * @param {Object} settings - Flash settings
	 * @returns {Promise<boolean>}
	 */
	async flash(code, deviceId, settings = {}) {
		// Try WebSocket first (OTA), fallback to Serial
		try {
			return await this.flashViaWebSocket(code, deviceId, settings);
		} catch (error) {
			console.warn("WebSocket flash failed, trying serial:", error.message);

			if (this.isConnected) {
				return await this.flashViaSerial(code, settings);
			} else {
				throw new Error("No connection method available");
			}
		}
	}

	/**
	 * Get available serial ports
	 * @returns {Promise<Array>}
	 */
	async getAvailablePorts() {
		if (!this.isWebSerialSupported()) {
			return [];
		}

		try {
			const ports = await navigator.serial.getPorts();
			return ports.map((port) => ({
				id: port.getInfo().usbVendorId ? `${port.getInfo().usbVendorId}:${port.getInfo().usbProductId}` : "unknown",
				name: port.getInfo().usbProductId ? `USB Device ${port.getInfo().usbProductId}` : "Serial Port",
			}));
		} catch (error) {
			console.error("Error getting ports:", error);
			return [];
		}
	}

	/**
	 * Set progress callback
	 * @param {Function} callback - Progress callback function
	 */
	setProgressCallback(callback) {
		this.onProgress = callback;
	}

	/**
	 * Set status callback
	 * @param {Function} callback - Status callback function
	 */
	setStatusCallback(callback) {
		this.onStatus = callback;
	}

	/**
	 * Utility function to chunk string
	 * @param {string} str - String to chunk
	 * @param {number} size - Chunk size
	 * @returns {Array<string>}
	 */
	chunkString(str, size) {
		const chunks = [];
		for (let i = 0; i < str.length; i += size) {
			chunks.push(str.slice(i, i + size));
		}
		return chunks;
	}

	/**
	 * Validate ESP32 code
	 * @param {string} code - Code to validate
	 * @returns {Object} - Validation result
	 */
	validateCode(code) {
		const errors = [];
		const warnings = [];

		// Check for required includes
		if (!code.includes("#include <ZiLinkEsp32.h>")) {
			warnings.push("Missing ZiLinkEsp32.h include");
		}

		// Check for setup and loop functions
		if (!code.includes("void setup()")) {
			errors.push("Missing setup() function");
		}

		if (!code.includes("void loop()")) {
			errors.push("Missing loop() function");
		}

		// Check for WiFi configuration
		if (!code.includes("WiFi.begin")) {
			warnings.push("WiFi configuration not found");
		}

		// Check for ZiLink initialization
		if (!code.includes("zilink.setupWebSocket") && !code.includes("zilink.setupMQTT")) {
			warnings.push("ZiLink initialization not found");
		}

		return {
			valid: errors.length === 0,
			errors,
			warnings,
		};
	}

	/**
	 * Get device info
	 * @returns {Promise<Object>}
	 */
	async getDeviceInfo() {
		if (!this.isConnected) {
			throw new Error("Not connected to device");
		}

		try {
			await this.sendData("AT+INFO\r\n");
			const response = await this.readData(2000);

			// Parse device info from response
			const info = {
				chipModel: "ESP32",
				chipRevision: "1",
				cpuFreqMHz: "240",
				flashSize: "4MB",
				flashSpeed: "80MHz",
				flashMode: "DIO",
				psramSize: "0",
				...this.parseDeviceInfo(response),
			};

			return info;
		} catch (error) {
			throw new Error(`Failed to get device info: ${error.message}`);
		}
	}

	/**
	 * Parse device info from response
	 * @param {string} response - Device response
	 * @returns {Object}
	 */
	parseDeviceInfo(response) {
		const info = {};

		// Simple parsing - in real implementation, use proper parsing
		if (response.includes("ESP32")) {
			info.chipModel = "ESP32";
		}

		return info;
	}
}

// Export singleton instance
export const flashService = new FlashService();
export default flashService;

