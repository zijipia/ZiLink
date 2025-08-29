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

  zi.setupHttp("https://api.ziji.world", "device123", "token123");
  zi.createProgress(75, "prg1");
}

void loop() {
}
