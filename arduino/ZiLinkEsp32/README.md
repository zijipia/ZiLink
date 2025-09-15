# ZiLink ESP32 Library

This Arduino library simplifies connecting ESP32 devices to the ZiLink platform using HTTP, WebSocket, or MQTT.

## Usage

\`\`\`cpp #include <ZiLinkEsp32.h>

ZiLinkEsp32 client;

void setup() { client.begin("your-ssid", "your-password");

// HTTP example client.setupHttp("https://api.zilink.io", "DEVICE_ID", "DEVICE_TOKEN"); client.sendStatus("{\"online\":true}");
client.sendData("{\"temp\":25}");

// WebSocket example client.setupWebSocket("ws.zilink.io", 80, "/ws", "DEVICE_ID", "DEVICE_TOKEN");
client.sendWebSocketData("{\"temp\":25}");

// MQTT example client.setupMqtt("mqtt.zilink.io", 1883, "DEVICE_ID", "DEVICE_TOKEN");
client.publishMqttStatus("{\"online\":true}"); client.publishMqttData("{\"temp\":25}"); }

void loop() { client.loop(); } \`\`\`

Provide your device ID and token to authenticate with the platform. The library handles WiFi connection and device-specific HTTP,
WebSocket, or MQTT communication.
