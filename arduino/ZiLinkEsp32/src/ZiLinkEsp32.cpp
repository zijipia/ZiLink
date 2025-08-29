#include "ZiLinkEsp32.h"

ZiLinkEsp32::ZiLinkEsp32() : _mqtt(_wifi) {}

void ZiLinkEsp32::setupHttp(const char *baseUrl, const char *deviceId, const char *token) {
        _baseUrl = baseUrl;
        _deviceId = deviceId;
        _token = token;
}

bool ZiLinkEsp32::sendHttp(const String &endpoint, const String &payload) {
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

bool ZiLinkEsp32::sendStatus(const String &payload) {
        return sendHttp("/devices/" + _deviceId + "/status", payload);
}

bool ZiLinkEsp32::sendData(const String &payload) {
        return sendHttp("/devices/" + _deviceId + "/data", payload);
}

void ZiLinkEsp32::setupWebSocket(const char *host, uint16_t port, const char *path, const char *deviceId, const char *token) {
        _token = token;
        _deviceId = deviceId;
        _ws.begin(host, port, path);
        _ws.onEvent([this](WStype_t type, uint8_t *, size_t) {
                if (type == WStype_CONNECTED) {
                        String authMsg =
                            "{\"type\":\"auth\",\"data\":{\"token\":\"" + _token + "\",\"clientType\":\"device\"}}";
                        _ws.sendTXT(authMsg);
                }
        });
}

bool ZiLinkEsp32::sendWebSocketData(const String &message) {
        if (_ws.isConnected()) {
                String msg = "{\"type\":\"device_data\",\"data\":{\"sensorData\":" + message + "}}";
                _ws.sendTXT(msg);
                return true;
        }
        return false;
}

void ZiLinkEsp32::setupMqtt(const char *broker, uint16_t port, const char *deviceId, const char *token) {
        _token = token;
        _deviceId = deviceId;
        _mqtt.setServer(broker, port);
        while (!_mqtt.connected()) {
                _mqtt.connect(deviceId, _token.c_str(), "");
                delay(500);
        }
}

bool ZiLinkEsp32::publishMqttData(const String &payload) {
        if (_mqtt.connected()) {
                String topic = "zilink/devices/" + _deviceId + "/data";
                return _mqtt.publish(topic.c_str(), payload.c_str());
        }
        return false;
}

bool ZiLinkEsp32::publishMqttStatus(const String &payload) {
        if (_mqtt.connected()) {
                String topic = "zilink/devices/" + _deviceId + "/status";
                return _mqtt.publish(topic.c_str(), payload.c_str());
        }
        return false;
}

bool ZiLinkEsp32::sendComponentData(const String &payload) {
        if (_ws.isConnected()) {
                _ws.sendTXT(payload);
                return true;
        }
        if (_mqtt.connected()) {
                String topic = "zilink/devices/" + _deviceId + "/components";
                return _mqtt.publish(topic.c_str(), payload.c_str());
        }
        return sendHttp("/devices/" + _deviceId + "/components", payload);
}

void ZiLinkEsp32::createButton(bool value, const char *id) {
        String payload =
            "{\"type\":\"button\",\"id\":\"" + String(id) + "\",\"value\":" + (value ? "true" : "false") + "}";
        sendComponentData(payload);
}

void ZiLinkEsp32::createSlider(int value, const char *id) {
        String payload =
            "{\"type\":\"slider\",\"id\":\"" + String(id) + "\",\"value\":" + String(value) + "}";
        sendComponentData(payload);
}

void ZiLinkEsp32::createToggle(bool value, const char *id) {
        String payload =
            "{\"type\":\"toggle\",\"id\":\"" + String(id) + "\",\"value\":" + (value ? "true" : "false") + "}";
        sendComponentData(payload);
}

void ZiLinkEsp32::createProgress(int value, const char *id) {
        String payload =
            "{\"type\":\"progress\",\"id\":\"" + String(id) + "\",\"value\":" + String(value) + "}";
        sendComponentData(payload);
}

void ZiLinkEsp32::loop() {
        _ws.loop();
        _mqtt.loop();
}
