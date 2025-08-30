import test, { mock } from "node:test";
import assert from "node:assert/strict";
import jwt from "jsonwebtoken";

process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "test-secret";
process.env.GOOGLE_CLIENT_ID = "test";
process.env.GOOGLE_CLIENT_SECRET = "test";
process.env.GITHUB_CLIENT_ID = "test";
process.env.GITHUB_CLIENT_SECRET = "test";
process.env.DISCORD_CLIENT_ID = "test";
process.env.DISCORD_CLIENT_SECRET = "test";

const { default: server } = await import("../src/index.js");
const { default: Device } = await import("../src/models/Device.js");
const { wsManager } = await import("../src/services/websocket.js");

const startServer = () => server.start(0);

const makeToken = (deviceId, userId = "user1") => jwt.sign({ deviceId, userId }, process.env.JWT_SECRET);

test("POST /api/devices/:id/components returns 404 when device missing", async () => {
        const httpServer = await startServer();
        const port = httpServer.address().port;

	mock.method(Device, "findOne", async () => null);
	mock.method(wsManager, "broadcastToWebClients", () => {});

	const deviceId = "dev1";
	const res = await fetch(`http://127.0.0.1:${port}/api/devices/${deviceId}/components`, {
		method: "POST",
		headers: {
			Authorization: `Bearer ${makeToken(deviceId)}`,
			"Content-Type": "application/json",
		},
		body: JSON.stringify({ type: "sensor", id: "temp", value: 42 }),
	});
	const body = await res.json();

	assert.equal(res.status, 404);
	assert.equal(body.message, "Device not found");

        mock.restoreAll();
        await server.shutdown();
});

test("POST /api/devices/:id/components saves component data", async () => {
        const httpServer = await startServer();
        const port = httpServer.address().port;

	const deviceId = "dev2";
	const fakeDevice = {
		deviceId,
		owner: "user1",
		components: [],
		save: async function () {
			this.saved = true;
		},
	};

	mock.method(Device, "findOne", async () => fakeDevice);
	mock.method(wsManager, "broadcastToWebClients", () => {});

	const res = await fetch(`http://127.0.0.1:${port}/api/devices/${deviceId}/components`, {
		method: "POST",
		headers: {
			Authorization: `Bearer ${makeToken(deviceId)}`,
			"Content-Type": "application/json",
		},
		body: JSON.stringify({ type: "sensor", id: "temp", value: 42 }),
	});
	const body = await res.json();

	assert.equal(res.status, 201);
	assert.equal(body.success, true);
	assert.equal(fakeDevice.components.length, 1);
	const c = fakeDevice.components[0];
	assert.equal(c.id, "temp");
	assert.equal(c.type, "sensor");
	assert.equal(c.value, 42);
	assert.ok(c.updatedAt instanceof Date);
	assert.equal(fakeDevice.saved, true);

        mock.restoreAll();
        await server.shutdown();
});

test("POST /devices/:id/components saves component data", async () => {
        const httpServer = await startServer();
        const port = httpServer.address().port;

	const deviceId = "dev3";
	const fakeDevice = {
		deviceId,
		owner: "user1",
		components: [],
		save: async function () {
			this.saved = true;
		},
	};

	mock.method(Device, "findOne", async () => fakeDevice);
	mock.method(wsManager, "broadcastToWebClients", () => {});

	const res = await fetch(`http://127.0.0.1:${port}/devices/${deviceId}/components`, {
		method: "POST",
		headers: {
			Authorization: `Bearer ${makeToken(deviceId)}`,
			"Content-Type": "application/json",
		},
		body: JSON.stringify({ type: "sensor", id: "temp", value: 42 }),
	});
	const body = await res.json();

	assert.equal(res.status, 201);
	assert.equal(body.success, true);
	assert.equal(fakeDevice.components.length, 1);
	const c = fakeDevice.components[0];
	assert.equal(c.id, "temp");
	assert.equal(c.type, "sensor");
	assert.equal(c.value, 42);
	assert.ok(c.updatedAt instanceof Date);
	assert.equal(fakeDevice.saved, true);

        mock.restoreAll();
        await server.shutdown();
});

test("POST /devices/:id/components works without token", async () => {
        const httpServer = await startServer();
        const port = httpServer.address().port;

	const deviceId = "dev4";
	const fakeDevice = {
		deviceId,
		components: [],
		save: async function () {
			this.saved = true;
		},
	};

	mock.method(Device, "findOne", async () => fakeDevice);
	mock.method(wsManager, "broadcastToWebClients", () => {});

	const res = await fetch(`http://127.0.0.1:${port}/devices/${deviceId}/components`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ type: "sensor", id: "temp", value: 42 }),
	});
	const body = await res.json();

	assert.equal(res.status, 201);
	assert.equal(body.success, true);
	assert.equal(fakeDevice.components.length, 1);
	assert.equal(fakeDevice.saved, true);

        mock.restoreAll();
        await server.shutdown();
});
