// ZiLink ESP32 WSS example via Cloudflared
// Connects to ZiLink server over secure WebSocket (wss) at https://api.ziji.world/ws
// Requirements:
// - Create a user and register a device via API/UI to obtain DEVICE_ID and DEVICE_TOKEN
// - DEVICE_TOKEN is a JWT signed by the server used for device authentication
// - Cloudflared/Tunnel on the server side exposes wss://api.ziji.world/ws

#include <WiFi.h>
#include <ZiLinkEsp32.h>

// WiFi credentials
const char *ssid = "Ziji";
const char *password = "1335555777777";

// ZiLink server over Cloudflare Tunnel
const char *WS_HOST = "api.ziji.world"; // Do not include protocol
const uint16_t WS_PORT = 443;           // WSS uses 443
const char *WS_PATH = "/ws";            // WebSocket path

// Fill with values returned by the server when registering a device
// See: POST /api/devices/register (requires user auth)
const char *DEVICE_ID = "de45f6f5-a2ce-43e4-b784-e9c0e5f83a47";
const char *DEVICE_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2OGIwNmIzZDcwODM5MWY4YjczZWVhZWMiLCJpYXQiOjE3NTc4ODIwODEsImV4cCI6MTc1ODQ4Njg4MX0.JpI4-Ul0P3pGqHt3mirWUtM1Rm4eGRv5wSQjwUhIwmQ";

ZiLinkEsp32 zi;

unsigned long lastSend = 0;
const unsigned long SEND_INTERVAL_MS = 5000;

static void connectWifi()
{
  Serial.printf("Connecting WiFi to %s", ssid);
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED)
  {
    Serial.print(".");
    delay(500);
  }
  Serial.printf("\nWiFi connected. IP: %s\n", WiFi.localIP().toString().c_str());
}

void setup()
{
  Serial.begin(115200);
  delay(200);
  // Improve WebSocket ping/pong stability on some ESP32s
  WiFi.setSleep(false);
  connectWifi();

  // Secure WebSocket to ZiLink via Cloudflare (wss)
  // Internally, the library will call beginSSL() when port == 443
  zi.setupWebSocket(WS_HOST, WS_PORT, WS_PATH, DEVICE_ID, DEVICE_TOKEN);

  // Send an initial reading using the WebSocket message shape the server expects:
  // The helper wraps your JSON string under {"type":"device_data","data":{"sensorData": <your_json> }}
  // Provide sensorData as an array of sensor objects
  String sensors = "[{\\\"type\\\":\\\"light\\\",\\\"value\\\":300,\\\"unit\\\":\\\"lux\\\"}]";
  if (zi.sendWebSocketData(sensors))
  {
    Serial.println("Published initial sensor payload over WSS");
  }
  else
  {
    Serial.println("Queued initial payload until WS ready");
  }
}

void loop()
{
  zi.loop();

  // Periodically send sensor data
  if (millis() - lastSend >= SEND_INTERVAL_MS)
  {
    lastSend = millis();
    static int v = 300;
    v = (v >= 400) ? 300 : v + 5;

    String sensors = String("[{\\\"type\\\":\\\"light\\\",\\\"value\\\":") + v + ",\\\"unit\\\":\\\"lux\\\"}]";
    bool ok = zi.sendWebSocketData(sensors);
    Serial.printf("WSS Publish %s: %s\n", ok ? "OK" : "QUEUED", sensors.c_str());
  }

  // Ensure WiFi stays connected
  if (WiFi.status() != WL_CONNECTED)
  {
    connectWifi();
  }
}
