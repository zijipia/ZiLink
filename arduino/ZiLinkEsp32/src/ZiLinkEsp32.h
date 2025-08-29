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

        // HTTP API
        void setupHttp(const char *baseUrl, const char *deviceId, const char *token);
        bool sendStatus(const String &payload);
        bool sendData(const String &payload);

        // WebSocket
        void setupWebSocket(const char *host, uint16_t port, const char *path, const char *deviceId, const char *token);
        bool sendWebSocketData(const String &message);

        // MQTT
        void setupMqtt(const char *broker, uint16_t port, const char *deviceId, const char *token);
        bool publishMqttData(const String &payload);
        bool publishMqttStatus(const String &payload);

        // Component helpers
        void createButton(bool value, const char *id);
        void createSlider(int value, const char *id);
        void createToggle(bool value, const char *id);
        void createProgress(int value, const char *id);

        void loop();

private:
        bool sendHttp(const String &endpoint, const String &payload);
        bool sendComponentData(const String &payload);

        String _baseUrl;
        String _token;
        String _deviceId;
        WebSocketsClient _ws;
        WiFiClient _wifi;
        PubSubClient _mqtt;
};

#endif
