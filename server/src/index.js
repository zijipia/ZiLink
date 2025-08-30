import "dotenv/config";
import "./utils/logger.js";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import { bin, install } from "cloudflared";
import mongoose from "mongoose";
import { EventEmitter } from "node:events";
import connectDB from "./config/database.js";
import authRoutes from "./routes/auth.js";
import deviceRoutes from "./routes/device.js";
import userRoutes from "./routes/user.js";
import { initWebSocketServer } from "./services/websocket.js";
import { initMQTTServer, mqttServer } from "./services/mqttServer.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { notFound } from "./middleware/notFound.js";

/**
 * ZiLink server wrapper implemented as an {@link EventEmitter}.
 * The class encapsulates the Express app and related services
 * such as WebSocket, MQTT and Cloudflare tunnel. Consumers can
 * listen to server lifecycle events like `started` and `shutdown`.
 */
class ZiLinkServer extends EventEmitter {
	constructor() {
		super();
		this.app = express();
		this.port = process.env.PORT || 3001;
		this.isTest = process.env.NODE_ENV === "test";
		this.cf = null;

		// Security middleware
		this.app.use(helmet());

		// Rate limiting
		const limiter = rateLimit({
			windowMs: 15 * 60 * 1000, // 15 minutes
			max: 100, // limit each IP to 100 requests per windowMs
			message: "Too many requests from this IP, please try again later.",
		});
		this.app.use(limiter);

		// CORS configuration
		// Allow multiple origins via env (comma-separated) and default local dev
		const rawAllowed = [
			process.env.CLIENT_URLS,
			process.env.CLIENT_URL,
			"http://localhost:3000",
			"http://127.0.0.1:3000",
			"https://ziji.world",
		].filter(Boolean);

		const allowedOrigins = rawAllowed
			.flatMap((v) => v.split(","))
			.map((v) => v.trim())
			.filter((v) => v.length > 0);

		const corsOptions = {
			origin: (origin, callback) => {
				// Allow non-browser or same-origin requests (no Origin header)
				if (!origin) return callback(null, true);

				// Exact match against allowed origins
				if (allowedOrigins.includes(origin)) return callback(null, true);

				// Optionally allow subdomains of ziji.world
				try {
					const url = new URL(origin);
					if (url.hostname.endsWith(".ziji.world")) return callback(null, true);
				} catch (_) {}

				return callback(new Error(`Not allowed by CORS: ${origin}`));
			},
			credentials: true,
			methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
			allowedHeaders: ["Content-Type", "Authorization"],
			optionsSuccessStatus: 204,
		};

		this.app.use(cors(corsOptions));
		this.app.options("*", cors(corsOptions));

		// Logging
		morgan.token("client-ip", (req) => req.headers["x-forwarded-for"]?.split(",")[0]?.trim() || req.ip);
		const logFormat = ":client-ip :method :url :status :res[content-length] - :response-time ms";

		const logsDir = path.resolve("logs");
		if (!fs.existsSync(logsDir)) {
			fs.mkdirSync(logsDir, { recursive: true });
		}
		const accessLogStream = fs.createWriteStream(path.join(logsDir, "access.log"), {
			flags: "a",
		});

		this.app.use(morgan(logFormat));
		this.app.use(morgan(logFormat, { stream: accessLogStream }));

		// Body parsing middleware
		this.app.use(express.json({ limit: "10mb" }));
		this.app.use(express.urlencoded({ extended: true, limit: "10mb" }));

		// Health check endpoint
		this.app.get("/health", (req, res) => {
			res.status(200).json({
				status: "OK",
				message: "ZiLink Server is running",
				timestamp: new Date().toISOString(),
				version: "1.0.0",
			});
		});

		// API Routes
		this.app.use("/api/auth", authRoutes);
		this.app.use("/api/devices", deviceRoutes);
		this.app.use("/devices", deviceRoutes);
		this.app.use("/api/users", userRoutes);

		// Error handling middleware
		this.app.use(notFound);
		this.app.use(errorHandler);
	}

	async start(port = this.port) {
		if (this.server) return this.server;

		// Connect to MongoDB
		if (!this.isTest) {
			connectDB();
		}

		this.server = this.app.listen(port, () => {
			console.log(`🚀 ZiLink Server is running on port ${port}`);
			console.log(`📍 Environment: ${process.env.NODE_ENV}`);
			console.log(`🔗 Client URL: ${process.env.CLIENT_URL}`);
			this.emit("started", port);
		});

		if (!this.isTest) {
			// Initialize WebSocket server
			initWebSocketServer(this.server);
			console.log(`🔌 WebSocket server initialized on port ${port}`);

			// Initialize MQTT server
			initMQTTServer();
			console.log("📡 MQTT server initialized");

			// Ensure cloudflared binary is installed
			if (!fs.existsSync(bin)) {
				await install(bin);
			}

			// Start Cloudflare tunnel if token is provided
			if (process.env.cloudflaredtoken) {
				this.cf = spawn(bin, ["tunnel", "run", "--token", process.env.cloudflaredtoken], { stdio: "inherit" });
			} else {
				console.log("⚠️  No cloudflared token provided, skipping tunnel setup");
			}

			["SIGINT", "SIGTERM"].forEach((signal) => {
				process.once(signal, () => {
					console.log(`👋 ${signal} received, shutting down gracefully`);
					this.shutdown();
				});
			});
		}

		return this.server;
	}

	async shutdown() {
		try {
			this.cf?.kill();
		} catch {}

		try {
			await mongoose.connection.close();
			console.log("🔒 MongoDB connection closed through app termination");
		} catch (err) {
			console.error("❌ Error closing MongoDB connection:", err);
		}

		try {
			mqttServer.close();
			console.log("📡 MQTT server closed");
		} catch {}

		if (this.server) {
			await new Promise((resolve) =>
				this.server.close(() => {
					console.log("💤 Process terminated");
					this.emit("shutdown");
					resolve();
				}),
			);
			this.server = null;
		}
	}
}

const server = new ZiLinkServer();
if (!server.isTest) {
	await server.start();
}

export const app = server.app;
export default server;
