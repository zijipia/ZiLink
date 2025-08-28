const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const GitHubStrategy = require("passport-github2").Strategy;
const DiscordStrategy = require("passport-discord").Strategy;
const JwtStrategy = require("passport-jwt").Strategy;
const ExtractJwt = require("passport-jwt").ExtractJwt;

const User = require("../models/User");

// JWT Strategy
passport.use(
	new JwtStrategy(
		{
			jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
			secretOrKey: process.env.JWT_SECRET,
		},
		async (payload, done) => {
			try {
				const user = await User.findById(payload.userId);
				if (user && user.isActive) {
					return done(null, user);
				}
				return done(null, false);
			} catch (error) {
				return done(error, false);
			}
		},
	),
);

// Google OAuth Strategy
passport.use(
	new GoogleStrategy(
		{
			clientID: process.env.GOOGLE_CLIENT_ID,
			clientSecret: process.env.GOOGLE_CLIENT_SECRET,
			callbackURL: "/api/auth/google/callback",
		},
		async (accessToken, refreshToken, profile, done) => {
			try {
				// Check if user already exists with this Google ID
				let user = await User.findByOAuth("google", profile.id);

				if (user) {
					// Update user information
					user.name = profile.displayName;
					user.avatar = profile.photos?.[0]?.value;
					await user.updateLastLogin();
					return done(null, user);
				}

				// Check if user exists with same email
				user = await User.findOne({ email: profile.emails?.[0]?.value });

				if (user) {
					// Link Google account to existing user
					user.googleId = profile.id;
					user.name = profile.displayName;
					user.avatar = profile.photos?.[0]?.value;
					user.emailVerified = true;
					await user.updateLastLogin();
					return done(null, user);
				}

				// Create new user
				user = new User({
					googleId: profile.id,
					email: profile.emails?.[0]?.value,
					name: profile.displayName,
					avatar: profile.photos?.[0]?.value,
					emailVerified: true,
				});

				await user.save();
				await user.updateLastLogin();
				return done(null, user);
			} catch (error) {
				return done(error, null);
			}
		},
	),
);

// GitHub OAuth Strategy
passport.use(
	new GitHubStrategy(
		{
			clientID: process.env.GITHUB_CLIENT_ID,
			clientSecret: process.env.GITHUB_CLIENT_SECRET,
			callbackURL: "/api/auth/github/callback",
		},
		async (accessToken, refreshToken, profile, done) => {
			try {
				// Check if user already exists with this GitHub ID
				let user = await User.findByOAuth("github", profile.id);

				if (user) {
					// Update user information
					user.name = profile.displayName || profile.username;
					user.avatar = profile.photos?.[0]?.value;
					await user.updateLastLogin();
					return done(null, user);
				}

				// Check if user exists with same email
				const email = profile.emails?.[0]?.value || `${profile.username}@github.local`;
				user = await User.findOne({ email });

				if (user) {
					// Link GitHub account to existing user
					user.githubId = profile.id;
					user.name = profile.displayName || profile.username;
					user.avatar = profile.photos?.[0]?.value;
					user.emailVerified = true;
					await user.updateLastLogin();
					return done(null, user);
				}

				// Create new user
				user = new User({
					githubId: profile.id,
					email,
					name: profile.displayName || profile.username,
					avatar: profile.photos?.[0]?.value,
					emailVerified: true,
				});

				await user.save();
				await user.updateLastLogin();
				return done(null, user);
			} catch (error) {
				return done(error, null);
			}
		},
	),
);

// Discord OAuth Strategy
passport.use(
	new DiscordStrategy(
		{
			clientID: process.env.DISCORD_CLIENT_ID,
			clientSecret: process.env.DISCORD_CLIENT_SECRET,
			callbackURL: "/api/auth/discord/callback",
			scope: ["identify", "email"],
		},
		async (accessToken, refreshToken, profile, done) => {
			try {
				// Check if user already exists with this Discord ID
				let user = await User.findByOAuth("discord", profile.id);

				if (user) {
					// Update user information
					user.name = profile.username;
					user.avatar = profile.avatar ? `https://cdn.discordapp.com/avatars/${profile.id}/${profile.avatar}.png` : null;
					await user.updateLastLogin();
					return done(null, user);
				}

				// Check if user exists with same email
				user = await User.findOne({ email: profile.email });

				if (user) {
					// Link Discord account to existing user
					user.discordId = profile.id;
					user.name = profile.username;
					user.avatar = profile.avatar ? `https://cdn.discordapp.com/avatars/${profile.id}/${profile.avatar}.png` : null;
					user.emailVerified = true;
					await user.updateLastLogin();
					return done(null, user);
				}

				// Create new user
				user = new User({
					discordId: profile.id,
					email: profile.email,
					name: profile.username,
					avatar: profile.avatar ? `https://cdn.discordapp.com/avatars/${profile.id}/${profile.avatar}.png` : null,
					emailVerified: true,
				});

				await user.save();
				await user.updateLastLogin();
				return done(null, user);
			} catch (error) {
				return done(error, null);
			}
		},
	),
);

// Serialize user for session
passport.serializeUser((user, done) => {
	done(null, user._id);
});

// Deserialize user from session
passport.deserializeUser(async (id, done) => {
	try {
		const user = await User.findById(id);
		done(null, user);
	} catch (error) {
		done(error, null);
	}
});

module.exports = passport;
