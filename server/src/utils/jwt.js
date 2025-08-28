const jwt = require("jsonwebtoken");

const generateToken = (userId, expiresIn = "7d") => {
	return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn });
};

const generateDeviceToken = (deviceId, userId, expiresIn = "30d") => {
	return jwt.sign({ deviceId, userId }, process.env.JWT_SECRET, { expiresIn });
};

const verifyToken = (token) => {
	try {
		return jwt.verify(token, process.env.JWT_SECRET);
	} catch (error) {
		throw new Error("Invalid token");
	}
};

const decodeToken = (token) => {
	try {
		return jwt.decode(token);
	} catch (error) {
		return null;
	}
};

const generateRefreshToken = (userId) => {
	return jwt.sign({ userId, type: "refresh" }, process.env.JWT_SECRET, { expiresIn: "30d" });
};

module.exports = {
	generateToken,
	generateDeviceToken,
	verifyToken,
	decodeToken,
	generateRefreshToken,
};
