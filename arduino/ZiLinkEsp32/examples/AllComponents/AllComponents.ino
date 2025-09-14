#include <WiFi.h>
#include <ZiLinkEsp32.h>

// WiFi credentials
const char* ssid = "YOUR_SSID";
const char* password = "YOUR_PASSWORD";

// ZiLink configuration - Replace with real values
const char* deviceId = "your-device-id"; // From device registration
const char* token = "your-device-token"; // From device registration

ZiLinkEsp32 zi;

// Component IDs
const char* buttonId = "btn1";
const char* sliderId = "sld1";
const char* toggleId = "tgl1";
const char* progressId = "prg1";

// State variables for components
bool buttonState = false;
int sliderValue = 50;
bool toggleState = false;
int progressValue = 0;

// LED pin for command demo
const int ledPin = LED_BUILTIN;
unsigned long lastUpdate = 0;
unsigned long updateInterval = 5000; // Update every 5 seconds

void setup() {
  Serial.begin(115200);
  pinMode(ledPin, OUTPUT);

  // Connect to WiFi
  WiFi.begin(ssid, password);
  Serial.print("Connecting to WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println();
  Serial.println("WiFi connected!");
  Serial.print("IP address: ");
  Serial.println(WiFi.localIP());

  // Setup WebSocket (preferred for real-time bidirectional communication)
  zi.setupWebSocket("api.ziji.world", 443, "/ws", deviceId, token); // Use wss://api.ziji.world/ws

  // Alternative: Setup MQTT
  // zi.setupMqtt("broker.ziji.world", 1883, deviceId, token);

  Serial.println("ZiLink setup complete. Starting component demo...");
}

void loop() {
  zi.loop(); // Handle WebSocket/MQTT

  if (millis() - lastUpdate > updateInterval) {
    // Simulate sensor data
    float temperature = 25.0 + random(-5, 5); // Random temp 20-30°C
    float humidity = 60.0 + random(-10, 10); // Random humidity 50-70%

    // Send sensor data via WebSocket
    String sensorData = "{\"sensors\":[{\"type\":\"temperature\",\"value\":" + String(temperature) + "},{\"type\":\"humidity\",\"value\":" + String(humidity) + "}]}";
    zi.sendWebSocketData(sensorData);

    // Alternative: zi.publishMqttData(sensorData);

    // Update and send components
    buttonState = !buttonState; // Toggle button
    zi.createButton(buttonState, buttonId);

    sliderValue = random(0, 101); // Random slider 0-100
    zi.createSlider(sliderValue, sliderId);

    toggleState = !toggleState; // Toggle toggle
    zi.createToggle(toggleState, toggleId);

    progressValue = (progressValue + 10) % 101; // Progress 0-100 cycle
    zi.createProgress(progressValue, progressId);

    // Send status update
    String statusPayload = "{\"isOnline\":true,\"battery\":{\"level\":85},\"lastSeen\":\"" + String(millis()) + "\"}";
    zi.sendWebSocketData("{\"type\":\"device_status\",\"data\":" + statusPayload + "}");

    Serial.println("Components and data sent via WebSocket");

    lastUpdate = millis();
  }

  delay(100); // Small delay to prevent overwhelming
}
