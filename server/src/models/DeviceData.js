import mongoose from "mongoose";

const deviceDataSchema = new mongoose.Schema(
	{
		// Device reference
		device: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Device",
			required: true,
		},
		deviceId: {
			type: String,
			required: true,
			index: true,
		},
		// Data payload
		data: {
			type: Map,
			of: mongoose.Schema.Types.Mixed,
			required: true,
		},
		// Sensor readings with metadata
		sensors: [
			{
				type: {
					type: String,
					required: true,
				},
				value: {
					type: mongoose.Schema.Types.Mixed,
					required: true,
				},
				unit: {
					type: String,
					required: true,
				},
				timestamp: {
					type: Date,
					default: Date.now,
				},
				quality: {
					type: String,
					enum: ["good", "uncertain", "bad"],
					default: "good",
				},
				calibrated: {
					type: Boolean,
					default: true,
				},
			},
		],
		// Device status at time of reading
		deviceStatus: {
			battery: {
				level: Number,
				isCharging: Boolean,
			},
			signalStrength: Number,
			temperature: Number,
			uptime: Number,
		},
		// Data quality and validation
		dataQuality: {
			isValid: {
				type: Boolean,
				default: true,
			},
			validationErrors: [String],
			anomalyScore: {
				type: Number,
				min: 0,
				max: 1,
				default: 0,
			},
			flags: [String],
		},
		// Processing information
		processing: {
			rawData: {
				type: Map,
				of: mongoose.Schema.Types.Mixed,
			},
			processedAt: {
				type: Date,
				default: Date.now,
			},
			processingVersion: {
				type: String,
				default: "1.0.0",
			},
			transformations: [String],
		},
		// Location information (if device is mobile)
		location: {
			coordinates: {
				latitude: {
					type: Number,
					min: -90,
					max: 90,
				},
				longitude: {
					type: Number,
					min: -180,
					max: 180,
				},
			},
			accuracy: Number,
			altitude: Number,
			heading: Number,
			speed: Number,
		},
		// Metadata
		metadata: {
			source: {
				type: String,
				enum: ["mqtt", "websocket", "http", "manual"],
				default: "mqtt",
			},
			protocol: String,
			gateway: String,
			messageId: String,
			retransmission: {
				type: Boolean,
				default: false,
			},
			encryption: {
				enabled: {
					type: Boolean,
					default: false,
				},
				algorithm: String,
			},
		},
		// Alerting
		alerts: [
			{
				type: {
					type: String,
					required: true,
				},
				severity: {
					type: String,
					enum: ["info", "warning", "error", "critical"],
					required: true,
				},
				message: {
					type: String,
					required: true,
				},
				threshold: {
					value: mongoose.Schema.Types.Mixed,
					condition: String,
				},
				acknowledged: {
					type: Boolean,
					default: false,
				},
				acknowledgedAt: Date,
				acknowledgedBy: {
					type: mongoose.Schema.Types.ObjectId,
					ref: "User",
				},
			},
		],
		// Timestamps
		timestamp: {
			type: Date,
			default: Date.now,
			required: true,
		},
		receivedAt: {
			type: Date,
			default: Date.now,
		},
		createdAt: {
			type: Date,
			default: Date.now,
		},
	},
	{
		timestamps: false, // We handle timestamps manually
		toJSON: {
			transform: function (doc, ret) {
				delete ret.__v;
				return ret;
			},
		},
	},
);

// Indexes
deviceDataSchema.index({ deviceId: 1, timestamp: -1 });
deviceDataSchema.index({ device: 1, timestamp: -1 });
deviceDataSchema.index({ timestamp: -1 });
deviceDataSchema.index({ receivedAt: -1 });
deviceDataSchema.index({ "alerts.severity": 1 });
deviceDataSchema.index({ "alerts.acknowledged": 1 });
deviceDataSchema.index({ "dataQuality.isValid": 1 });

// Compound indexes for efficient queries
deviceDataSchema.index({ deviceId: 1, "sensors.type": 1, timestamp: -1 });
deviceDataSchema.index({ device: 1, "alerts.severity": 1, timestamp: -1 });

// TTL index for automatic data cleanup (optional - can be configured per device)
// deviceDataSchema.index({ timestamp: 1 }, { expireAfterSeconds: 2592000 }); // 30 days

// Virtual for age of data
deviceDataSchema.virtual("age").get(function () {
	return Date.now() - this.timestamp.getTime();
});

// Method to add alert
deviceDataSchema.methods.addAlert = function (type, severity, message, threshold = null) {
	this.alerts.push({
		type,
		severity,
		message,
		threshold,
		acknowledged: false,
	});
	return this.save();
};

// Method to acknowledge alert
deviceDataSchema.methods.acknowledgeAlert = function (alertIndex, userId) {
	if (this.alerts[alertIndex]) {
		this.alerts[alertIndex].acknowledged = true;
		this.alerts[alertIndex].acknowledgedAt = new Date();
		this.alerts[alertIndex].acknowledgedBy = userId;
		return this.save();
	}
	throw new Error("Alert not found");
};

// Method to validate sensor data
deviceDataSchema.methods.validateData = function () {
	const errors = [];

	this.sensors.forEach((sensor, index) => {
		if (typeof sensor.value === "undefined" || sensor.value === null) {
			errors.push(`Sensor ${index}: value is required`);
		}
		if (!sensor.type) {
			errors.push(`Sensor ${index}: type is required`);
		}
		if (!sensor.unit) {
			errors.push(`Sensor ${index}: unit is required`);
		}
	});

	this.dataQuality.isValid = errors.length === 0;
	this.dataQuality.validationErrors = errors;

	return this.dataQuality.isValid;
};

// Static method to find latest data for device
deviceDataSchema.statics.findLatestByDevice = function (deviceId, limit = 100) {
	return this.find({ deviceId }).sort({ timestamp: -1 }).limit(limit).populate("device", "name type");
};

// Static method to find data within time range
deviceDataSchema.statics.findByTimeRange = function (deviceId, startDate, endDate) {
	return this.find({
		deviceId,
		timestamp: {
			$gte: startDate,
			$lte: endDate,
		},
	}).sort({ timestamp: 1 });
};

// Static method to aggregate data by time intervals
deviceDataSchema.statics.aggregateByInterval = function (deviceId, interval = "hour", startDate, endDate) {
	const groupBy = {
		hour: {
			year: { $year: "$timestamp" },
			month: { $month: "$timestamp" },
			day: { $dayOfMonth: "$timestamp" },
			hour: { $hour: "$timestamp" },
		},
		day: {
			year: { $year: "$timestamp" },
			month: { $month: "$timestamp" },
			day: { $dayOfMonth: "$timestamp" },
		},
		month: {
			year: { $year: "$timestamp" },
			month: { $month: "$timestamp" },
		},
	};

	const matchStage = { deviceId };
	if (startDate && endDate) {
		matchStage.timestamp = { $gte: startDate, $lte: endDate };
	}

	return this.aggregate([
		{ $match: matchStage },
		{ $unwind: "$sensors" },
		{
			$group: {
				_id: {
					...groupBy[interval],
					sensorType: "$sensors.type",
				},
				avgValue: { $avg: "$sensors.value" },
				minValue: { $min: "$sensors.value" },
				maxValue: { $max: "$sensors.value" },
				count: { $sum: 1 },
				unit: { $first: "$sensors.unit" },
			},
		},
		{ $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1, "_id.hour": 1 } },
	]);
};

// Static method to find devices with unacknowledged alerts
deviceDataSchema.statics.findUnacknowledgedAlerts = function (severity = null) {
	const match = { "alerts.acknowledged": false };
	if (severity) {
		match["alerts.severity"] = severity;
	}

	return this.find(match).populate("device", "name type owner").sort({ timestamp: -1 });
};

const DeviceData = mongoose.model("DeviceData", deviceDataSchema);

export default DeviceData;
