#include <WiFi.h>
#include <ZiLinkEsp32.h>

const char* ssid = "YOUR_SSID";
const char* password = "YOUR_PASSWORD";

// Point this to your server/broker. For local dev, use your PC LAN IP, e.g. "192.168.1.10"
const char* BROKER_HOST = "YOUR_SERVER_HOST_OR_IP";  // e.g. "192.168.1.10" or "api.ziji.world"
const uint16_t BROKER_PORT = 1883;

// Fill with values returned by the server when you register a device
// deviceId comes from POST /api/devices/register response (data.device.deviceId)
// deviceToken comes from the same response (data.deviceToken)
const char* DEVICE_ID = "YOUR_DEVICE_ID";
const char* DEVICE_TOKEN = "YOUR_DEVICE_TOKEN";

ZiLinkEsp32 zi;

unsigned long lastSend = 0;
const unsigned long SEND_INTERVAL_MS = 5000;

void connectWifi() {
  Serial.print("Connecting WiFi");
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    Serial.print(".");
    delay(500);
  }
  Serial.printf("\nWiFi connected. IP: %s\n", WiFi.localIP().toString().c_str());
}

void setup() {
  Serial.begin(115200);
  connectWifi();

  // MQTT to ZiLink broker (server/src/services/mqttServer.js listens on 1883)
  zi.setupMqtt(BROKER_HOST, BROKER_PORT, DEVICE_ID, DEVICE_TOKEN);

  // Send an initial reading with proper payload shape expected by the server:
  // {
  //   "sensors":[{ "type":"light", "value":300, "unit":"lux" }],
  //   "deviceStatus": { "isOnline": true, "battery": { "level": 95 } }
  // }
  String payload = "{\"sensors\":[{\"type\":\"light\",\"value\":300,\"unit\":\"lux\"}],\"deviceStatus\":{\"isOnline\":true,\"battery\":{\"level\":95}}}";
  if (zi.publishMqttData(payload)) {
    Serial.println("Published initial sensor payload");
  } else {
    Serial.println("Failed to publish initial payload");
  }
}

void loop() {
  zi.loop();

  // Periodically send sensor data
  if (millis() - lastSend >= SEND_INTERVAL_MS) {
    lastSend = millis();

    // Fake changing sensor value
    static int v = 300;
    v = (v >= 400) ? 300 : v + 5;

    // Build correct JSON for server processing and WebSocket fan-out
    // See server expectations in server/src/services/mqttServer.js
    String payload = String("{\"sensors\":[{\"type\":\"light\",\"value\":") + v + ",\"unit\":\"lux\"}],\"deviceStatus\":{\"isOnline\":true}}";
    bool ok = zi.publishMqttData(payload);
    Serial.printf("Publish %s: %s\n", ok ? "OK" : "FAIL", payload.c_str());
  }

  // Ensure WiFi stays connected
  if (WiFi.status() != WL_CONNECTED) {
    connectWifi();
  }
}
