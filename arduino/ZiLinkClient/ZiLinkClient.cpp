#include "ZiLinkClient.h"

ZiLinkClient::ZiLinkClient(const char* host, uint16_t port) : host(host), port(port) {}

void ZiLinkClient::begin(const char* ssid, const char* password) {
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
  }
}

void ZiLinkClient::connect(const String& token) {
  authToken = token;
  ws.begin(host, port, "/");
  ws.onEvent([this](WStype_t type, uint8_t* payload, size_t length) {
    if (type == WStype_CONNECTED) {
      String msg = "{\"type\":\"auth\",\"token\":\"" + authToken + "\"}";
      ws.sendTXT(msg);
    }
  });
}

void ZiLinkClient::loop() {
  ws.loop();
}

void ZiLinkClient::sendSensorData(const String& deviceId, const String& payload) {
  String msg = "{\"type\":\"data\",\"deviceId\":\"" + deviceId + "\",\"payload\":" + payload + "}";
  ws.sendTXT(msg);
}

