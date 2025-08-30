import fs from "node:fs";
import path from "node:path";
import util from "node:util";

// Ensure logs directory exists
const logDir = path.resolve("logs");
if (!fs.existsSync(logDir)) {
	fs.mkdirSync(logDir, { recursive: true });
}

const infoStream = fs.createWriteStream(path.join(logDir, "server.log"), {
	flags: "a",
});
const errorStream = fs.createWriteStream(path.join(logDir, "error.log"), {
	flags: "a",
});

function format(args) {
	return util.format(...args);
}

const log = console.log;
const error = console.error;

console.log = (...args) => {
	const message = `[${new Date().toISOString()}] ${format(args)}\n`;
	infoStream.write(message);
	log(message.trimEnd());
};

console.error = (...args) => {
	const message = `[${new Date().toISOString()}] ${format(args)}\n`;
	errorStream.write(message);
	error(message.trimEnd());
};

export {}; // ensure module scope
