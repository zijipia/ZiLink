#ifndef ZILINKCLIENT_H
#define ZILINKCLIENT_H

#include <Arduino.h>
#include <WiFi.h>
#include <WebSocketsClient.h>

class ZiLinkClient {
public:
  ZiLinkClient(const char* host, uint16_t port);
  void begin(const char* ssid, const char* password);
  void connect(const String& token);
  void loop();
  void sendSensorData(const String& deviceId, const String& payload);

private:
  WebSocketsClient ws;
  const char* host;
  uint16_t port;
  String authToken;
};

#endif // ZILINKCLIENT_H

