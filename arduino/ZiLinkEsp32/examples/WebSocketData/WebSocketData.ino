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

  zi.setupWebSocket("api.ziji.world", 80, "/ws", "device123", "token123");
  zi.sendWebSocketData("{\"humidity\":60}");
}

void loop() {
  zi.loop();
}
