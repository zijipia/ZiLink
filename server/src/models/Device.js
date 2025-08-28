import mongoose from "mongoose";
import crypto from "node:crypto";

const deviceSchema = new mongoose.Schema(
	{
		// Device identification
		deviceId: {
			type: String,
			required: true,
			unique: true,
			trim: true,
		},
		name: {
			type: String,
			required: true,
			trim: true,
		},
		description: {
			type: String,
			default: "",
			trim: true,
		},
		type: {
			type: String,
			required: true,
			enum: ["sensor", "actuator", "gateway", "controller", "display", "camera", "speaker", "other"],
			default: "sensor",
		},
		category: {
			type: String,
			enum: [
				"temperature",
				"humidity",
				"light",
				"motion",
				"sound",
				"air_quality",
				"security",
				"automation",
				"monitoring",
				"other",
			],
			default: "other",
		},
		// Owner information
		owner: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			required: true,
		},
		// Device specifications
		specifications: {
			manufacturer: {
				type: String,
				default: "Unknown",
			},
			model: {
				type: String,
				default: "Unknown",
			},
			firmwareVersion: {
				type: String,
				default: "1.0.0",
			},
			hardwareVersion: {
				type: String,
				default: "1.0.0",
			},
			serialNumber: {
				type: String,
				default: null,
			},
		},
		// Network configuration
		network: {
			ipAddress: {
				type: String,
				default: null,
			},
			macAddress: {
				type: String,
				default: null,
			},
			networkType: {
				type: String,
				enum: ["wifi", "ethernet", "cellular", "bluetooth", "zigbee", "lora", "other"],
				default: "wifi",
			},
			signalStrength: {
				type: Number,
				default: null,
				min: -100,
				max: 0,
			},
		},
		// Device capabilities
		capabilities: {
			sensors: [
				{
					type: {
						type: String,
						required: true,
					},
					unit: {
						type: String,
						required: true,
					},
					range: {
						min: Number,
						max: Number,
					},
					accuracy: String,
				},
			],
			actuators: [
				{
					type: {
						type: String,
						required: true,
					},
					commands: [String],
				},
			],
			supportsMQTT: {
				type: Boolean,
				default: true,
			},
			supportsWebSocket: {
				type: Boolean,
				default: true,
			},
			supportsOTA: {
				type: Boolean,
				default: false,
			},
		},
		// Device configuration
		configuration: {
			sampleRate: {
				type: Number,
				default: 60, // seconds
				min: 1,
				max: 3600,
			},
			reportingInterval: {
				type: Number,
				default: 300, // seconds
				min: 10,
				max: 86400,
			},
			dataRetention: {
				type: Number,
				default: 30, // days
				min: 1,
				max: 365,
			},
			alertThresholds: {
				type: Map,
				of: {
					min: Number,
					max: Number,
					enabled: {
						type: Boolean,
						default: false,
					},
				},
			},
		},
		// Device status
		status: {
			isOnline: {
				type: Boolean,
				default: false,
			},
			lastSeen: {
				type: Date,
				default: null,
			},
			battery: {
				level: {
					type: Number,
					min: 0,
					max: 100,
					default: null,
				},
				isCharging: {
					type: Boolean,
					default: null,
				},
				lastUpdated: {
					type: Date,
					default: null,
				},
			},
			health: {
				status: {
					type: String,
					enum: ["healthy", "warning", "error", "maintenance"],
					default: "healthy",
				},
				lastCheck: {
					type: Date,
					default: Date.now,
				},
				issues: [String],
			},
		},
		// Security
		security: {
			apiKey: {
				type: String,
				required: true,
				select: false, // Don't include in queries by default
			},
			lastKeyRotation: {
				type: Date,
				default: Date.now,
			},
			encryptionEnabled: {
				type: Boolean,
				default: false,
			},
		},
		// Location information
		location: {
			name: {
				type: String,
				default: "Unknown Location",
			},
			coordinates: {
				latitude: {
					type: Number,
					min: -90,
					max: 90,
					default: null,
				},
				longitude: {
					type: Number,
					min: -180,
					max: 180,
					default: null,
				},
			},
			room: {
				type: String,
				default: null,
			},
			building: {
				type: String,
				default: null,
			},
		},
		// Tags and metadata
		tags: [String],
		metadata: {
			type: Map,
			of: mongoose.Schema.Types.Mixed,
			default: {},
		},
		// Activity tracking
		isActive: {
			type: Boolean,
			default: true,
		},
		createdAt: {
			type: Date,
			default: Date.now,
		},
		updatedAt: {
			type: Date,
			default: Date.now,
		},
	},
	{
		timestamps: true,
		toJSON: {
			transform: function (doc, ret) {
				delete ret.__v;
				return ret;
			},
		},
	},
);

// Indexes
deviceSchema.index({ deviceId: 1 });
deviceSchema.index({ owner: 1 });
deviceSchema.index({ type: 1 });
deviceSchema.index({ category: 1 });
deviceSchema.index({ "status.isOnline": 1 });
deviceSchema.index({ tags: 1 });
deviceSchema.index({ createdAt: -1 });
deviceSchema.index({ "status.lastSeen": -1 });

// Compound indexes
deviceSchema.index({ owner: 1, type: 1 });
deviceSchema.index({ owner: 1, "status.isOnline": 1 });

// Virtual for device age
deviceSchema.virtual("age").get(function () {
	return Date.now() - this.createdAt.getTime();
});

// Method to update device status
deviceSchema.methods.updateStatus = async function (status) {
	this.status.isOnline = status.isOnline || this.status.isOnline;
	this.status.lastSeen = status.lastSeen || new Date();

	if (status.battery) {
		this.status.battery = { ...this.status.battery, ...status.battery };
		this.status.battery.lastUpdated = new Date();
	}

	if (status.health) {
		this.status.health = { ...this.status.health, ...status.health };
		this.status.health.lastCheck = new Date();
	}

	return this.save();
};

// Method to rotate API key
deviceSchema.methods.rotateApiKey = async function () {
	this.security.apiKey = crypto.randomBytes(32).toString("hex");
	this.security.lastKeyRotation = new Date();
	return this.save();
};

// Static method to find devices by owner
deviceSchema.statics.findByOwner = function (userId, options = {}) {
	const query = { owner: userId };
	if (options.isActive !== undefined) query.isActive = options.isActive;
	if (options.type) query.type = options.type;
	if (options.isOnline !== undefined) query["status.isOnline"] = options.isOnline;

	return this.find(query).sort(options.sort || { createdAt: -1 });
};

// Static method to find online devices
deviceSchema.statics.findOnline = function () {
	return this.find({ "status.isOnline": true });
};

const Device = mongoose.model("Device", deviceSchema);

export default Device;
