import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
	{
		email: {
			type: String,
			required: true,
			unique: true,
			lowercase: true,
			trim: true,
		},
		name: {
			type: String,
			required: true,
			trim: true,
		},
		avatar: {
			type: String,
			default: null,
		},
		password: {
			type: String,
			select: false, // Don't include password in queries by default
		},
		// OAuth providers
		googleId: {
			type: String,
			sparse: true,
		},
		githubId: {
			type: String,
			sparse: true,
		},
		discordId: {
			type: String,
			sparse: true,
		},
		// User preferences
		preferences: {
			theme: {
				type: String,
				enum: ["light", "dark", "auto"],
				default: "auto",
			},
			notifications: {
				email: {
					type: Boolean,
					default: true,
				},
				push: {
					type: Boolean,
					default: true,
				},
				deviceAlerts: {
					type: Boolean,
					default: true,
				},
			},
			timezone: {
				type: String,
				default: "UTC",
			},
		},
		// Account status
		isActive: {
			type: Boolean,
			default: true,
		},
		emailVerified: {
			type: Boolean,
			default: false,
		},
		lastLogin: {
			type: Date,
			default: null,
		},
		// Metadata
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
				delete ret.password;
				delete ret.__v;
				return ret;
			},
		},
	},
);

// Indexes
userSchema.index({ email: 1 });
userSchema.index({ googleId: 1 }, { sparse: true });
userSchema.index({ githubId: 1 }, { sparse: true });
userSchema.index({ discordId: 1 }, { sparse: true });
userSchema.index({ createdAt: -1 });

// Pre-save middleware to hash password
userSchema.pre("save", async function (next) {
	// Only hash the password if it has been modified (or is new)
	if (!this.isModified("password")) return next();

	try {
		// Hash password with cost of 12
		const salt = await bcrypt.genSalt(12);
		this.password = await bcrypt.hash(this.password, salt);
		next();
	} catch (error) {
		next(error);
	}
});

// Instance method to check password
userSchema.methods.comparePassword = async function (candidatePassword) {
	if (!this.password) return false;
	return bcrypt.compare(candidatePassword, this.password);
};

// Static method to find user by OAuth provider
userSchema.statics.findByOAuth = async function (provider, providerId) {
	const query = {};
	query[`${provider}Id`] = providerId;
	return this.findOne(query);
};

// Instance method to update last login
userSchema.methods.updateLastLogin = async function () {
	this.lastLogin = new Date();
	return this.save();
};

const User = mongoose.model("User", userSchema);

export default User;
