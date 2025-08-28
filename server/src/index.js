import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import fs from "node:fs";
import { spawn } from "node:child_process";
import { bin, install } from "cloudflared";

import connectDB from "./config/database.js";
import authRoutes from "./routes/auth.js";
import deviceRoutes from "./routes/device.js";
import userRoutes from "./routes/user.js";
import { initWebSocketServer } from "./services/websocket.js";
import { initMQTTClient } from "./services/mqtt.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { notFound } from "./middleware/notFound.js";

const app = express();
const PORT = process.env.PORT || 3001;

// Connect to MongoDB
connectDB();

// Security middleware
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
	windowMs: 15 * 60 * 1000, // 15 minutes
	max: 100, // limit each IP to 100 requests per windowMs
	message: "Too many requests from this IP, please try again later.",
});
app.use(limiter);

// CORS configuration
app.use(
	cors({
		origin: process.env.CLIENT_URL || "http://localhost:3000",
		credentials: true,
		methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
		allowedHeaders: ["Content-Type", "Authorization"],
	}),
);

// Logging
if (process.env.NODE_ENV === "development") {
	app.use(morgan("dev"));
}

// Body parsing middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Health check endpoint
app.get("/health", (req, res) => {
	res.status(200).json({
		status: "OK",
		message: "ZiLink Server is running",
		timestamp: new Date().toISOString(),
		version: "1.0.0",
	});
});

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/devices", deviceRoutes);
app.use("/api/users", userRoutes);

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

// Start the server
const server = app.listen(PORT, () => {
	console.log(`🚀 ZiLink Server is running on port ${PORT}`);
	console.log(`📍 Environment: ${process.env.NODE_ENV}`);
	console.log(`🔗 Client URL: ${process.env.CLIENT_URL}`);
});

// Initialize WebSocket server
initWebSocketServer(server);
console.log(`🔌 WebSocket server initialized on port ${PORT}`);

// Initialize MQTT client
initMQTTClient();
console.log("📡 MQTT client initialized");

// Ensure cloudflared binary is installed
if (!fs.existsSync(bin)) {
	await install(bin);
}

// Start Cloudflare tunnel if token is provided
let cf = null;
if (process.env.cloudflaredtoken) {
	cf = spawn(bin, ["tunnel", "run", "--token", process.env.cloudflaredtoken], {
		stdio: "inherit",
	});
} else {
	console.log("⚠️  No cloudflared token provided, skipping tunnel setup");
}

const shutdown = () => {
	try {
		cf?.kill();
	} catch {}
};

process.on("SIGINT", () => {
	console.log("👋 SIGINT received, shutting down gracefully");
	server.close(() => {
		console.log("💤 Process terminated");
	});
	shutdown();
});

process.on("SIGTERM", () => {
	console.log("👋 SIGTERM received, shutting down gracefully");
	server.close(() => {
		console.log("💤 Process terminated");
	});
	shutdown();
});

export default app;
