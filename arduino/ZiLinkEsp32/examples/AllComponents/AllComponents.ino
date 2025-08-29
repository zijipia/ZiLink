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
  zi.setupHttp("https://api.ziji.world", "device123", "token123");
}

void loop() {
  if (millis() - lastSend > 5000) {
    zi.createButton(false, "btn1");
    zi.createSlider(20, "sld1");
    zi.createToggle(true, "tgl1");
    zi.createProgress(40, "prg1");
    lastSend = millis();
  }
}
