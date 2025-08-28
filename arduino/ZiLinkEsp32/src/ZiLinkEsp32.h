#ifndef ZILINK_ESP32_H
#define ZILINK_ESP32_H

#include <Arduino.h>
#include <WiFi.h>
#include <HTTPClient.h>
#include <WebSocketsClient.h>
#include <PubSubClient.h>

class ZiLinkEsp32 {
public:
        ZiLinkEsp32();
        void begin(const char *ssid, const char *password);

        // HTTP API
        void setupHttp(const char *baseUrl, const char *token);
        bool sendHttp(const char *endpoint, const String &payload);

        // WebSocket
        void setupWebSocket(const char *host, uint16_t port, const char *path, const char *token);
        bool sendWebSocket(const String &message);

        // MQTT
        void setupMqtt(const char *broker, uint16_t port, const char *token);
        bool publishMqtt(const char *topic, const String &payload);

        void loop();

private:
        String _baseUrl;
        String _token;
        WebSocketsClient _ws;
        WiFiClient _wifi;
        PubSubClient _mqtt;
};

#endif
