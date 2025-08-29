#include <WiFi.h>
#include <ZiLinkEsp32.h>

const char* ssid = "YOUR_SSID";
const char* password = "YOUR_PASSWORD";

ZiLinkEsp32 zi;
unsigned long lastSend = 0;

void setup() {
  Serial.begin(115200);
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
  }
  zi.setupMqtt("api.ziji.world", 1883, "device123", "token123");
}

void loop() {
  zi.loop();
  if (millis() - lastSend > 5000) {
    zi.createButton(false, "btn1");
    zi.createSlider(10, "sld1");
    lastSend = millis();
  }
}
