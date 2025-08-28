import express from "express";
import passport from "../config/passport.js";
import User from "../models/User.js";
import Device from "../models/Device.js";

const router = express.Router();

// Middleware to authenticate all user routes
router.use(passport.authenticate("jwt", { session: false }));

// Get user profile
router.get("/profile", (req, res) => {
	res.json({
		success: true,
		data: {
			id: req.user._id,
			email: req.user.email,
			name: req.user.name,
			avatar: req.user.avatar,
			preferences: req.user.preferences,
			emailVerified: req.user.emailVerified,
			lastLogin: req.user.lastLogin,
			createdAt: req.user.createdAt,
		},
	});
});

// Update user profile
router.put("/profile", async (req, res) => {
	try {
		const allowedUpdates = ["name", "preferences"];
		const updates = {};

		Object.keys(req.body).forEach((key) => {
			if (allowedUpdates.includes(key)) {
				updates[key] = req.body[key];
			}
		});

		Object.assign(req.user, updates);
		await req.user.save();

		res.json({
			success: true,
			message: "Profile updated successfully",
			data: {
				id: req.user._id,
				email: req.user.email,
				name: req.user.name,
				avatar: req.user.avatar,
				preferences: req.user.preferences,
			},
		});
	} catch (error) {
		console.error("Update profile error:", error);
		res.status(500).json({
			success: false,
			message: "Internal server error",
		});
	}
});

// Get user dashboard summary
router.get("/dashboard", async (req, res) => {
	try {
		// Get device counts
		const totalDevices = await Device.countDocuments({
			owner: req.user._id,
			isActive: true,
		});

		const onlineDevices = await Device.countDocuments({
			owner: req.user._id,
			isActive: true,
			"status.isOnline": true,
		});

		const offlineDevices = totalDevices - onlineDevices;

		// Get device types distribution
		const deviceTypes = await Device.aggregate([
			{ $match: { owner: req.user._id, isActive: true } },
			{ $group: { _id: "$type", count: { $sum: 1 } } },
			{ $sort: { count: -1 } },
		]);

		// Get recent devices (last 7 days)
		const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
		const recentDevices = await Device.find({
			owner: req.user._id,
			isActive: true,
			createdAt: { $gte: sevenDaysAgo },
		})
			.select("deviceId name type createdAt")
			.sort({ createdAt: -1 })
			.limit(5);

		res.json({
			success: true,
			data: {
				summary: {
					totalDevices,
					onlineDevices,
					offlineDevices,
					uptimePercentage: totalDevices > 0 ? Math.round((onlineDevices / totalDevices) * 100) : 0,
				},
				deviceTypes,
				recentDevices,
				user: {
					name: req.user.name,
					email: req.user.email,
					memberSince: req.user.createdAt,
				},
			},
		});
	} catch (error) {
		console.error("Get dashboard error:", error);
		res.status(500).json({
			success: false,
			message: "Internal server error",
		});
	}
});

// Delete user account
router.delete("/account", async (req, res) => {
	try {
		const { confirmPassword } = req.body;

		// For OAuth users, confirmPassword might not be provided
		if (req.user.password && !confirmPassword) {
			return res.status(400).json({
				success: false,
				message: "Password confirmation required",
			});
		}

		// Verify password if user has one
		if (req.user.password) {
			const user = await User.findById(req.user._id).select("+password");
			const isMatch = await user.comparePassword(confirmPassword);

			if (!isMatch) {
				return res.status(401).json({
					success: false,
					message: "Invalid password",
				});
			}
		}

		// Soft delete user account
		req.user.isActive = false;
		await req.user.save();

		// Optionally: soft delete all user devices
		await Device.updateMany({ owner: req.user._id }, { isActive: false });

		res.json({
			success: true,
			message: "Account deleted successfully",
		});
	} catch (error) {
		console.error("Delete account error:", error);
		res.status(500).json({
			success: false,
			message: "Internal server error",
		});
	}
});

export default router;
