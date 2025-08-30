import test from "node:test";
import assert from "node:assert/strict";

process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "test-secret";
process.env.GOOGLE_CLIENT_ID = "test";
process.env.GOOGLE_CLIENT_SECRET = "test";
process.env.GITHUB_CLIENT_ID = "test";
process.env.GITHUB_CLIENT_SECRET = "test";
process.env.DISCORD_CLIENT_ID = "test";
process.env.DISCORD_CLIENT_SECRET = "test";

const { default: server } = await import("../src/index.js");

const startServer = () => server.start(0);

test("GET /health returns OK", async () => {
	const httpServer = await startServer();
	const port = httpServer.address().port;
	const res = await fetch(`http://127.0.0.1:${port}/health`);
	const body = await res.json();
	assert.equal(res.status, 200);
	assert.equal(body.status, "OK");
	await server.shutdown();
});
