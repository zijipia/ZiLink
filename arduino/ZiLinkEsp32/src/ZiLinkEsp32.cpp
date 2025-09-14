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
  _ws.onEvent([this](WStype_t type, uint8_t * payload, size_t length) {
    switch(type) {
      case WStype_DISCONNECTED:
        Serial.printf("[%s] Disconnected!\n", _deviceId.c_str());
        break;
      case WStype_CONNECTED:
        {
          Serial.printf("[%s] Connected to server!\n", _deviceId.c_str());
          String authMsg = "{\"type\":\"auth\",\"data\":{\"token\":\"" + _token + "\",\"clientType\":\"device\"}}";
          _ws.sendTXT(authMsg);
          // Subscribe to device commands
          String subMsg = "{\"type\":\"subscribe_device\",\"data\":{\"deviceId\":\"" + _deviceId + "\"}}";
          _ws.sendTXT(subMsg);
        }
        break;
      case WStype_TEXT:
        {
          String message = String((char*)payload);
          Serial.printf("[%s] Received: %s\n", _deviceId.c_str(), message.c_str());
          // Parse and handle command
          DynamicJsonDocument doc(1024);
          deserializeJson(doc, message);
          const char* msgType = doc["type"];
          if (strcmp(msgType, "command") == 0) {
            const char* command = doc["data"]["command"];
            Serial.printf("Received command: %s\n", command);
            // Call user callback or update local state
            // Example: if (strcmp(command, "toggle") == 0) digitalWrite(LED_BUILTIN, !digitalRead(LED_BUILTIN));
          }
        }
        break;
      case WStype_BIN:
        Serial.printf("[%s] Binary message received\n", _deviceId.c_str());
        break;
      case WStype_ERROR:
        Serial.printf("[%s] Error!\n", _deviceId.c_str());
        break;
    }
  });
  _ws.setReconnectInterval(5000);
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
  _mqtt.setCallback([this](char* topic, byte* payload, unsigned int length) {
    String message;
    for (int i = 0; i < length; i++) {
      message += (char)payload[i];
    }
    Serial.printf("[%s] MQTT message on topic %s: %s\n", _deviceId.c_str(), topic, message.c_str());
    // Parse and handle command
    DynamicJsonDocument doc(1024);
    deserializeJson(doc, message);
    const char* msgType = doc["type"];
    if (strcmp(msgType, "command") == 0) {
      const char* command = doc["data"]["command"];
      Serial.printf("Received MQTT command: %s\n", command);
      // Call user callback or update local state
      // Example: if (strcmp(command, "toggle") == 0) digitalWrite(LED_BUILTIN, !digitalRead(LED_BUILTIN));
    }
  });
  while (!_mqtt.connected()) {
    if (_mqtt.connect(deviceId, _token.c_str(), "")) {
      Serial.printf("[%s] Connected to MQTT broker\n", _deviceId.c_str());
      String subTopic = "zilink/devices/" + String(deviceId) + "/commands";
      _mqtt.subscribe(subTopic.c_str());
    } else {
      delay(500);
    }
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
  if (!_mqtt.connected()) {
    _mqtt.connect(_deviceId.c_str(), _token.c_str(), "");
  }
  _mqtt.loop();
}
