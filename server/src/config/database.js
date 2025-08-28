import mongoose from "mongoose";

const connectDB = async () => {
	try {
		const options = {
			useNewUrlParser: true,
			useUnifiedTopology: true,
			maxPoolSize: 10,
			serverSelectionTimeoutMS: 5000,
			socketTimeoutMS: 45000,
		};

		const conn = await mongoose.connect(process.env.MONGODB_URI, options);

		console.log(`🗄️  MongoDB Connected: ${conn.connection.host}`);
		console.log(`📊 Database: ${conn.connection.name}`);

		// Handle connection events
		mongoose.connection.on("error", (err) => {
			console.error("❌ MongoDB connection error:", err);
		});

		mongoose.connection.on("disconnected", () => {
			console.log("⚠️  MongoDB disconnected");
		});

		mongoose.connection.on("reconnected", () => {
			console.log("🔄 MongoDB reconnected");
		});
	} catch (error) {
		console.error("❌ Database connection failed:", error.message);
		process.exit(1);
	}
};

// Graceful shutdown
process.on("SIGINT", async () => {
	await mongoose.connection.close();
	console.log("🔒 MongoDB connection closed through app termination");
});

export default connectDB;
