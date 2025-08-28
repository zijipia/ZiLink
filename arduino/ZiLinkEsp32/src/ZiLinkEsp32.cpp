#include "ZiLinkEsp32.h"

ZiLinkEsp32::ZiLinkEsp32() : _mqtt(_wifi) {}

void ZiLinkEsp32::begin(const char *ssid, const char *password) {
        WiFi.begin(ssid, password);
        while (WiFi.status() != WL_CONNECTED) {
                delay(500);
        }
}

void ZiLinkEsp32::setupHttp(const char *baseUrl, const char *token) {
        _baseUrl = baseUrl;
        _token = token;
}

bool ZiLinkEsp32::sendHttp(const char *endpoint, const String &payload) {
        if (WiFi.status() != WL_CONNECTED) {
                return false;
        }
        HTTPClient http;
        String url = _baseUrl + endpoint;
        http.begin(url);
        http.addHeader("Authorization", "Bearer " + _token);
        int httpCode = http.POST(payload);
        http.end();
        return httpCode > 0;
}

void ZiLinkEsp32::setupWebSocket(const char *host, uint16_t port, const char *path, const char *token) {
        _token = token;
        _ws.begin(host, port, path);
        String header = "Authorization: Bearer " + _token;
        _ws.setExtraHeaders(header.c_str());
        _ws.onEvent([](WStype_t, uint8_t *, size_t) {});
}

bool ZiLinkEsp32::sendWebSocket(const String &message) {
        if (_ws.isConnected()) {
                _ws.sendTXT(message);
                return true;
        }
        return false;
}

void ZiLinkEsp32::setupMqtt(const char *broker, uint16_t port, const char *token) {
        _token = token;
        _mqtt.setServer(broker, port);
        while (!_mqtt.connected()) {
                _mqtt.connect("zilink-client", _token.c_str(), "");
                delay(500);
        }
}

bool ZiLinkEsp32::publishMqtt(const char *topic, const String &payload) {
        if (_mqtt.connected()) {
                return _mqtt.publish(topic, payload.c_str());
        }
        return false;
}

void ZiLinkEsp32::loop() {
        _ws.loop();
        _mqtt.loop();
}
