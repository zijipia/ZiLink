import express from "express";
import passport from "../config/passport.js";
import Device from "../models/Device.js";
import DeviceData from "../models/DeviceData.js";
import { generateDeviceToken, verifyToken } from "../utils/jwt.js";
import { wsManager } from "../services/websocket.js";
import crypto from "node:crypto";
import { extractParams } from "../utils/extractParams.js";

const router = express.Router();

const getRequestIp = (req) => req.headers["x-forwarded-for"]?.split(",")[0]?.trim() || req.ip;

const DEVICE_TYPES = ["sensor", "actuator", "gateway", "controller", "display", "camera", "speaker", "other"];

// Device token authentication middleware
const authenticateDevice = async (req, res, next) => {
	const authHeader = req.headers["authorization"] || "";
	const token = authHeader.split(" ")[1];
	if (!token) {
		return res.status(401).json({
			success: false,
			message: "Device token required",
		});
	}
	try {
		const decoded = verifyToken(token);
		const tokenDeviceId = decoded.deviceId;
		const paramDeviceId = req.params.deviceId;
		if (!tokenDeviceId || (paramDeviceId && tokenDeviceId !== paramDeviceId)) {
			return res.status(403).json({
				success: false,
				message: "Invalid device token",
			});
		}
		// Attach user and device info for handlers
		req.user = { _id: decoded.userId };
		req.deviceId = tokenDeviceId;
		next();
	} catch (error) {
		return res.status(401).json({
			success: false,
			message: "Invalid device token",
		});
	}
};

// Routes accessible with DEVICE_TOKEN
router.put(["/:deviceId/status", "/status"], authenticateDevice, async (req, res) => {
	const deviceId = req.params.deviceId || req.deviceId;
	const ip = getRequestIp(req);
	console.log(`📥 Status update from ${deviceId} (${ip}):`, req.body);
	try {
		const device = await Device.findOne({
			deviceId,
			owner: req.user._id,
		});

		if (!device) {
			return res.status(404).json({
				success: false,
				message: "Device not found",
			});
		}

		const { status } = req.body;
		await device.updateStatus(status);

		// Broadcast status update to web clients
		wsManager.broadcastToWebClients({
			type: "device_status_update",
			data: {
				deviceId,
				status: device.status,
				timestamp: new Date().toISOString(),
			},
		});

		res.json({
			success: true,
			message: "Device status updated successfully",
			data: device.status,
		});
	} catch (error) {
		console.error("Update device status error:", error);
		res.status(500).json({
			success: false,
			message: "Internal server error",
		});
	}
});

router.post(["/:deviceId/data", "/data"], authenticateDevice, async (req, res) => {
	const deviceId = req.params.deviceId || req.deviceId;
	const ip = getRequestIp(req);
	console.log(`📥 Data from ${deviceId} (${ip}):`, req.body);
	try {
		const device = await Device.findOne({
			deviceId,
			owner: req.user._id,
		});

		if (!device) {
			return res.status(404).json({
				success: false,
				message: "Device not found",
			});
		}

		const { sensors, data, deviceStatus, location, metadata } = req.body;

		if (!sensors || !Array.isArray(sensors) || sensors.length === 0) {
			return res.status(400).json({
				success: false,
				message: "Sensor data is required",
			});
		}

		// Create device data entry
		const deviceData = new DeviceData({
			device: device._id,
			deviceId,
			data: data || {},
			sensors,
			deviceStatus: deviceStatus || {},
			location: location || {},
			metadata: {
				source: "http",
				...metadata,
			},
		});

		// Validate data
		deviceData.validateData();

		await deviceData.save();

		// Update device last seen
		await device.updateStatus({
			isOnline: true,
			lastSeen: new Date(),
			...deviceStatus,
		});

		// Broadcast to web clients
		wsManager.broadcastToWebClients({
			type: "device_data",
			data: {
				deviceId,
				sensorData: sensors,
				timestamp: deviceData.timestamp,
			},
		});

		res.status(201).json({
			success: true,
			message: "Device data saved successfully",
		});
	} catch (error) {
		console.error("Submit device data error:", error);
		res.status(500).json({
			success: false,
			message: "Internal server error",
		});
	}
});

router.post(["/:deviceId/components", "/components"], authenticateDevice, async (req, res) => {
	let deviceId = req.params.deviceId || req.deviceId;
	if (!deviceId) {
		deviceId = extractParams("/:deviceId/components", req.path).deviceId;
	}

	const ip = getRequestIp(req);
	console.log(`📥 Component data from ${deviceId} (${ip}):`, req.body);
	try {
		const device = await Device.findOne({
			deviceId,
			owner: req.user._id,
		});

		if (!device) {
			return res.status(404).json({
				success: false,
				message: "Device not found",
			});
		}

		const { type, id, value } = req.body;
		if (!type || !id) {
			return res.status(400).json({
				success: false,
				message: "Component type and id are required",
			});
		}

		if (!device.components) {
			device.components = [];
		}
		const existing = device.components.find((c) => c.id === id);
		const component = { id, type, value, updatedAt: new Date() };

		if (existing) {
			existing.type = type;
			existing.value = value;
			existing.updatedAt = component.updatedAt;
		} else {
			device.components.push(component);
		}

		await device.save();

		wsManager.broadcastToWebClients({
			type: "device_component_update",
			data: { deviceId, component: { id, type, value } },
		});

		res.status(201).json({
			success: true,
			message: "Component data saved successfully",
			data: { id, type, value },
		});
	} catch (error) {
		console.error("Submit component data error:", error);
		res.status(500).json({
			success: false,
			message: "Internal server error",
		});
	}
});

// Middleware to authenticate user routes
router.use(passport.authenticate("jwt", { session: false }));

// Get all devices for the authenticated user
router.get("/", async (req, res) => {
	try {
		const { type, status, limit = 50, page = 1 } = req.query;

		const options = {};
		if (type) options.type = type;
		if (status === "online") options.isOnline = true;
		if (status === "offline") options.isOnline = false;

		const devices = await Device.findByOwner(req.user._id, {
			...options,
			sort: { createdAt: -1 },
		})
			.limit(parseInt(limit))
			.skip((parseInt(page) - 1) * parseInt(limit))
			.populate("owner", "name email");

		const total = await Device.countDocuments({
			owner: req.user._id,
			...options,
		});

		const devicesWithTokens = devices.map((d) => ({
			...d.toObject(),
			deviceToken: generateDeviceToken(d.deviceId, req.user._id),
		}));

		res.json({
			success: true,
			data: {
				devices: devicesWithTokens,
				pagination: {
					total,
					page: parseInt(page),
					limit: parseInt(limit),
					pages: Math.ceil(total / parseInt(limit)),
				},
			},
		});
	} catch (error) {
		console.error("Get devices error:", error);
		res.status(500).json({
			success: false,
			message: "Internal server error",
		});
	}
});

// Get specific device by ID
router.get("/:deviceId", async (req, res) => {
	try {
		const device = await Device.findOne({
			deviceId: req.params.deviceId,
			owner: req.user._id,
		}).populate("owner", "name email");

		if (!device) {
			return res.status(404).json({
				success: false,
				message: "Device not found",
			});
		}

		const deviceToken = generateDeviceToken(device.deviceId, req.user._id);

		res.json({
			success: true,
			data: {
				device,
				deviceToken,
			},
		});
	} catch (error) {
		console.error("Get device error:", error);
		res.status(500).json({
			success: false,
			message: "Internal server error",
		});
	}
});

// Register a new device
router.post("/register", async (req, res) => {
	try {
		const { name, description, type, category, specifications, capabilities, location } = req.body;

		if (!name || !type) {
			return res.status(400).json({
				success: false,
				message: "Name and type are required",
			});
		}

		if (!DEVICE_TYPES.includes(type)) {
			return res.status(400).json({
				success: false,
				message: "Invalid device type",
			});
		}

		// Generate unique device ID
		const deviceId = crypto.randomUUID();

		// Check if by rare chance ID exists
		const existingDevice = await Device.findOne({ deviceId });
		if (existingDevice) {
			return res.status(409).json({
				success: false,
				message: "Device with this ID already exists",
			});
		}

		// Generate API key for device
		const apiKey = crypto.randomBytes(32).toString("hex");

		// Create new device
		const device = new Device({
			deviceId,
			name,
			description: description || "",
			type,
			category: category || "other",
			owner: req.user._id,
			specifications: specifications || {},
			capabilities: capabilities || { sensors: [], actuators: [] },
			location: location || {},
			security: {
				apiKey,
				lastKeyRotation: new Date(),
			},
		});

		await device.save();

		// Generate device token
		const deviceToken = generateDeviceToken(deviceId, req.user._id);

		res.status(201).json({
			success: true,
			message: "Device registered successfully",
			data: {
				device,
				apiKey, // Return API key only once during registration
				deviceToken,
			},
		});
	} catch (error) {
		console.error("Register device error:", error);

		if (error.code === 11000) {
			return res.status(409).json({
				success: false,
				message: "Device with this ID already exists",
			});
		}

		res.status(500).json({
			success: false,
			message: "Internal server error",
		});
	}
});

// Update device information
router.put("/:deviceId", async (req, res) => {
	try {
		const device = await Device.findOne({
			deviceId: req.params.deviceId,
			owner: req.user._id,
		});

		if (!device) {
			return res.status(404).json({
				success: false,
				message: "Device not found",
			});
		}

		const allowedUpdates = [
			"name",
			"description",
			"type",
			"category",
			"specifications",
			"capabilities",
			"configuration",
			"location",
			"tags",
			"metadata",
		];

		const updates = {};
		Object.keys(req.body).forEach((key) => {
			if (allowedUpdates.includes(key)) {
				updates[key] = req.body[key];
			}
		});

		if (updates.type && !DEVICE_TYPES.includes(updates.type)) {
			return res.status(400).json({
				success: false,
				message: "Invalid device type",
			});
		}

		Object.assign(device, updates);
		await device.save();

		res.json({
			success: true,
			message: "Device updated successfully",
			data: device,
		});
	} catch (error) {
		console.error("Update device error:", error);
		res.status(500).json({
			success: false,
			message: "Internal server error",
		});
	}
});

// Delete device
router.delete("/:deviceId", async (req, res) => {
	try {
		const device = await Device.findOne({
			deviceId: req.params.deviceId,
			owner: req.user._id,
		});

		if (!device) {
			return res.status(404).json({
				success: false,
				message: "Device not found",
			});
		}

		// Soft delete by setting isActive to false
		device.isActive = false;
		await device.save();

		// Optionally delete all device data
		// await DeviceData.deleteMany({ deviceId: req.params.deviceId });

		res.json({
			success: true,
			message: "Device deleted successfully",
		});
	} catch (error) {
		console.error("Delete device error:", error);
		res.status(500).json({
			success: false,
			message: "Internal server error",
		});
	}
});

// Get device data
router.get("/:deviceId/data", async (req, res) => {
	try {
		const { startDate, endDate, limit = 100, page = 1, interval } = req.query;

		// Verify device ownership
		const device = await Device.findOne({
			deviceId: req.params.deviceId,
			owner: req.user._id,
		});

		if (!device) {
			return res.status(404).json({
				success: false,
				message: "Device not found",
			});
		}

		let data;

		if (interval && startDate && endDate) {
			// Return aggregated data
			data = await DeviceData.aggregateByInterval(req.params.deviceId, interval, new Date(startDate), new Date(endDate));
		} else if (startDate && endDate) {
			// Return raw data within time range
			data = await DeviceData.findByTimeRange(req.params.deviceId, new Date(startDate), new Date(endDate));
		} else {
			// Return latest data
			data = await DeviceData.findLatestByDevice(req.params.deviceId, parseInt(limit));
		}

		res.json({
			success: true,
			data: {
				deviceId: req.params.deviceId,
				data,
				count: Array.isArray(data) ? data.length : 1,
			},
		});
	} catch (error) {
		console.error("Get device data error:", error);
		res.status(500).json({
			success: false,
			message: "Internal server error",
		});
	}
});

// Send command to device
router.post("/:deviceId/command", async (req, res) => {
	try {
		const { command } = req.body;

		if (!command) {
			return res.status(400).json({
				success: false,
				message: "Command is required",
			});
		}

		// Verify device ownership
		const device = await Device.findOne({
			deviceId: req.params.deviceId,
			owner: req.user._id,
		});

		if (!device) {
			return res.status(404).json({
				success: false,
				message: "Device not found",
			});
		}

		// Check if device is online
		if (!device.status.isOnline) {
			return res.status(503).json({
				success: false,
				message: "Device is offline",
			});
		}

		// Send command via WebSocket
		const connectedDevices = wsManager.getConnectedDevices();
		if (!connectedDevices.includes(req.params.deviceId)) {
			return res.status(503).json({
				success: false,
				message: "Device not connected via WebSocket",
			});
		}

		wsManager.broadcastToDevice(req.params.deviceId, {
			type: "command",
			data: {
				command,
				timestamp: new Date().toISOString(),
				commandId: crypto.randomUUID(),
			},
		});

		res.json({
			success: true,
			message: "Command sent successfully",
			data: {
				deviceId: req.params.deviceId,
				command,
				timestamp: new Date().toISOString(),
			},
		});
	} catch (error) {
		console.error("Send command error:", error);
		res.status(500).json({
			success: false,
			message: "Internal server error",
		});
	}
});

// Rotate device API key
router.post("/:deviceId/rotate-key", async (req, res) => {
	try {
		const device = await Device.findOne({
			deviceId: req.params.deviceId,
			owner: req.user._id,
		});

		if (!device) {
			return res.status(404).json({
				success: false,
				message: "Device not found",
			});
		}

		await device.rotateApiKey();

		res.json({
			success: true,
			message: "API key rotated successfully",
			data: {
				deviceId: req.params.deviceId,
				newApiKey: device.security.apiKey,
				rotatedAt: device.security.lastKeyRotation,
			},
		});
	} catch (error) {
		console.error("Rotate API key error:", error);
		res.status(500).json({
			success: false,
			message: "Internal server error",
		});
	}
});

// Get device statistics
router.get("/:deviceId/stats", async (req, res) => {
	try {
		const { period = "24h" } = req.query;

		// Verify device ownership
		const device = await Device.findOne({
			deviceId: req.params.deviceId,
			owner: req.user._id,
		});

		if (!device) {
			return res.status(404).json({
				success: false,
				message: "Device not found",
			});
		}

		// Calculate time range based on period
		const now = new Date();
		let startDate;

		switch (period) {
			case "1h":
				startDate = new Date(now.getTime() - 60 * 60 * 1000);
				break;
			case "24h":
				startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
				break;
			case "7d":
				startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
				break;
			case "30d":
				startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
				break;
			default:
				startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
		}

		// Get data count
		const totalDataPoints = await DeviceData.countDocuments({
			deviceId: req.params.deviceId,
			timestamp: { $gte: startDate },
		});

		// Get latest data
		const latestData = await DeviceData.findLatestByDevice(req.params.deviceId, 1);

		// Get alerts count
		const alertsCount = await DeviceData.countDocuments({
			deviceId: req.params.deviceId,
			"alerts.acknowledged": false,
		});

		res.json({
			success: true,
			data: {
				deviceId: req.params.deviceId,
				period,
				stats: {
					totalDataPoints,
					alertsCount,
					uptime: device.status.isOnline ? device.age : 0,
					lastSeen: device.status.lastSeen,
					batteryLevel: device.status.battery?.level,
					signalStrength: device.network.signalStrength,
				},
				latestData: latestData[0] || null,
			},
		});
	} catch (error) {
		console.error("Get device stats error:", error);
		res.status(500).json({
			success: false,
			message: "Internal server error",
		});
	}
});

// Update device status (for devices to report their status)
// Get connected devices status
router.get("/status/connected", async (req, res) => {
	try {
		const connectedDeviceIds = wsManager.getConnectedDevices();

		const devices = await Device.find({
			deviceId: { $in: connectedDeviceIds },
			owner: req.user._id,
		}).select("deviceId name type status");

		res.json({
			success: true,
			data: {
				connectedCount: connectedDeviceIds.length,
				devices,
			},
		});
	} catch (error) {
		console.error("Get connected devices error:", error);
		res.status(500).json({
			success: false,
			message: "Internal server error",
		});
	}
});

// Get alerts for user's devices
router.get("/alerts/unacknowledged", async (req, res) => {
	try {
		const { severity } = req.query;

		// Get user's devices
		const userDevices = await Device.find({ owner: req.user._id }).select("deviceId");
		const deviceIds = userDevices.map((d) => d.deviceId);

		const match = {
			deviceId: { $in: deviceIds },
			"alerts.acknowledged": false,
		};

		if (severity) {
			match["alerts.severity"] = severity;
		}

		const alertData = await DeviceData.find(match).populate("device", "name type").sort({ timestamp: -1 }).limit(100);

		res.json({
			success: true,
			data: alertData,
		});
	} catch (error) {
		console.error("Get alerts error:", error);
		res.status(500).json({
			success: false,
			message: "Internal server error",
		});
	}
});

// Acknowledge alert
router.post("/alerts/:alertId/acknowledge", async (req, res) => {
	try {
		const { alertId } = req.params;
		const { dataId, alertIndex } = req.body;

		const deviceData = await DeviceData.findById(dataId).populate("device", "owner");

		if (!deviceData) {
			return res.status(404).json({
				success: false,
				message: "Alert data not found",
			});
		}

		// Check ownership
		if (deviceData.device.owner.toString() !== req.user._id.toString()) {
			return res.status(403).json({
				success: false,
				message: "Access denied",
			});
		}

		await deviceData.acknowledgeAlert(alertIndex, req.user._id);

		res.json({
			success: true,
			message: "Alert acknowledged successfully",
		});
	} catch (error) {
		console.error("Acknowledge alert error:", error);
		res.status(500).json({
			success: false,
			message: "Internal server error",
		});
	}
});

export default router;
