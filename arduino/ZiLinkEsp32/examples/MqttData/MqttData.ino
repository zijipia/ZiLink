#include <WiFi.h>
#include <ZiLinkEsp32.h>

const char* ssid = "YOUR_SSID";
const char* password = "YOUR_PASSWORD";

ZiLinkEsp32 zi;

void setup() {
  Serial.begin(115200);
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
  }

  zi.setupMqtt("api.ziji.world", 1883, "device123", "token123");
  zi.publishMqttData("{\"light\":300}");
}

void loop() {
  zi.loop();
}
