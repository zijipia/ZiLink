import { createServer } from "node:net";
import Device from "../models/Device.js";
import DeviceData from "../models/DeviceData.js";
import { wsManager } from "./websocket.js";

class MQTTServer {
	constructor() {
		this.aedes = null;
		this.server = null;
	}

	async init(port = process.env.MQTT_BROKER_PORT || 1883) {
		const { default: aedes } = await import("aedes");
		this.aedes = aedes();
		this.server = createServer(this.aedes.handle);

		this.aedes.on("client", (client) => {
			console.log(`\uD83D\uDCF1 MQTT client connected: ${client.id}`);
		});

		this.aedes.on("clientDisconnect", (client) => {
			console.log(`\uD83D\uDCF1 MQTT client disconnected: ${client.id}`);
		});

		this.aedes.on("publish", async (packet, client) => {
			if (!client) return;

			try {
				const topicParts = packet.topic.split("/");
				if (topicParts.length < 4 || topicParts[0] !== "zilink" || topicParts[1] !== "devices") {
					return;
				}

				const deviceId = topicParts[2];
				const messageType = topicParts[3];

				if (messageType !== "data") return;

				const payload = JSON.parse(packet.payload.toString());
				await this.handleDeviceData(deviceId, payload);
			} catch (error) {
				console.error("❌ MQTT publish handler error:", error);
			}
		});

		this.server.listen(port, () => {
			console.log(`\uD83D\uDCE1 MQTT server is running on port ${port}`);
		});

		return this.server;
	}

	close() {
		this.server?.close();
		this.aedes?.close();
	}

	async handleDeviceData(deviceId, payload) {
		try {
			const device = await Device.findOne({ deviceId });
			if (!device) {
				console.error(`❌ Device not found: ${deviceId}`);
				return;
			}

			const deviceData = new DeviceData({
				device: device._id,
				deviceId,
				data: payload.data || {},
				sensors: payload.sensors || [],
				deviceStatus: payload.deviceStatus || {},
				location: payload.location || {},
				metadata: {
					source: "mqtt",
					protocol: "MQTT",
					messageId: payload.messageId,
					...payload.metadata,
				},
			});

			deviceData.validateData();
			await deviceData.save();

			await device.updateStatus({
				isOnline: true,
				lastSeen: new Date(),
				...payload.deviceStatus,
			});

			wsManager.broadcastToWebClients({
				type: "device_data",
				data: {
					deviceId,
					sensorData: payload.sensors || [],
					timestamp: deviceData.timestamp,
				},
			});

			console.log(`\uD83D\uDCCA Device data processed: ${deviceId}`);
		} catch (error) {
			console.error("❌ Handle device data error:", error);
		}
	}
}

export const mqttServer = new MQTTServer();
export const initMQTTServer = (port) => mqttServer.init(port);
