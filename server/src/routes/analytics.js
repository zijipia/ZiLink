import express from "express";
import passport from "../config/passport.js";
import Device from "../models/Device.js";
import DeviceData from "../models/DeviceData.js";

const router = express.Router();

router.use(passport.authenticate("jwt", { session: false }));

const rangeToStart = (range) => {
	const now = Date.now();
	switch (range) {
		case "24h":
			return new Date(now - 24 * 60 * 60 * 1000);
		case "30d":
			return new Date(now - 30 * 24 * 60 * 60 * 1000);
		case "7d":
		default:
			return new Date(now - 7 * 24 * 60 * 60 * 1000);
	}
};

router.get("/overview", async (req, res) => {
	try {
		const range = (req.query.range || "7d").toString();
		const start = rangeToStart(range);
		const end = new Date();

		const devices = await Device.find({ owner: req.user._id, isActive: true }).select("deviceId status");
		const deviceIds = devices.map((d) => d.deviceId);

		let totalDataPoints = 0;
		let avgTemp = null;
		let avgHum = null;

		if (deviceIds.length > 0) {
			totalDataPoints = await DeviceData.countDocuments({ deviceId: { $in: deviceIds }, timestamp: { $gte: start, $lte: end } });

			const tempAgg = await DeviceData.aggregate([
				{ $match: { deviceId: { $in: deviceIds }, timestamp: { $gte: start, $lte: end } } },
				{ $unwind: "$sensors" },
				{ $match: { "sensors.type": "temperature", "sensors.value": { $type: "number" } } },
				{ $group: { _id: null, avg: { $avg: "$sensors.value" } } },
			]);
			const humAgg = await DeviceData.aggregate([
				{ $match: { deviceId: { $in: deviceIds }, timestamp: { $gte: start, $lte: end } } },
				{ $unwind: "$sensors" },
				{ $match: { "sensors.type": "humidity", "sensors.value": { $type: "number" } } },
				{ $group: { _id: null, avg: { $avg: "$sensors.value" } } },
			]);

			avgTemp = tempAgg[0]?.avg ?? null;
			avgHum = humAgg[0]?.avg ?? null;
		}

		const totalDevices = devices.length;
		const onlineDevices = devices.filter((d) => d.status?.isOnline).length;
		const deviceUptime = totalDevices > 0 ? Math.round((onlineDevices / totalDevices) * 100) : 0;

		// Simple hourly aggregation for last 24h across all devices
		let chart = [];
		if (deviceIds.length > 0) {
			const start24 = new Date(Date.now() - 24 * 60 * 60 * 1000);
			const agg = await DeviceData.aggregate([
				{ $match: { deviceId: { $in: deviceIds }, timestamp: { $gte: start24, $lte: new Date() } } },
				{ $unwind: "$sensors" },
				{ $match: { "sensors.type": { $in: ["temperature", "humidity"] }, "sensors.value": { $type: "number" } } },
				{
					$group: {
						_id: {
							year: { $year: "$timestamp" },
							month: { $month: "$timestamp" },
							day: { $dayOfMonth: "$timestamp" },
							hour: { $hour: "$timestamp" },
							type: "$sensors.type",
						},
						avg: { $avg: "$sensors.value" },
					},
				},
				{ $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1, "_id.hour": 1 } },
			]);
			// Map into { time, temperature?, humidity? }
			const buckets = new Map();
			for (const row of agg) {
				const key = `${row._id.year}-${row._id.month}-${row._id.day} ${row._id.hour}:00`;
				const prev = buckets.get(key) || { time: key };
				buckets.set(key, { ...prev, [row._id.type]: row.avg });
			}
			chart = Array.from(buckets.values());
		}

		res.json({
			success: true,
			data: {
				totals: {
					totalDataPoints,
					averageTemperature: avgTemp,
					averageHumidity: avgHum,
					deviceUptime,
				},
				chart,
			},
		});
	} catch (error) {
		console.error("Get analytics overview error:", error);
		res.status(500).json({ success: false, message: "Internal server error" });
	}
});

export default router;
