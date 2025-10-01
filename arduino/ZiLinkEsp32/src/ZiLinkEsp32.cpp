#include "ZiLinkEsp32.h"

ZiLinkEsp32::ZiLinkEsp32() : _mqtt(_wifi) {}

ZiLinkEsp32::ZiLinkEsp32(const char *deviceId, const char *serverHost, int serverPort) : _mqtt(_wifi) {
  _deviceId = String(deviceId);
  _baseUrl = "http://" + String(serverHost) + ":" + String(serverPort);
}

void ZiLinkEsp32::setupHttp(const char *baseUrl, const char *deviceId, const char *token)
{
  _baseUrl = baseUrl;
  _deviceId = deviceId;
  _token = token;
}

bool ZiLinkEsp32::sendHttp(const String &endpoint, const String &payload)
{
  if (WiFi.status() != WL_CONNECTED)
  {
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

bool ZiLinkEsp32::sendStatus(const String &payload)
{
  return sendHttp("/devices/" + _deviceId + "/status", payload);
}

bool ZiLinkEsp32::sendData(const String &payload)
{
  return sendHttp("/devices/" + _deviceId + "/data", payload);
}

void ZiLinkEsp32::setupWebSocket(const char *host, uint16_t port, const char *path, const char *deviceId, const char *token)
{
  _token = token;
  _deviceId = deviceId;
  _wsConnected = false;
  _wsAuthenticated = false;
  _wsQHead = _wsQTail = 0;

  // Use TLS (WSS) automatically when using port 443
  if (port == 443)
  {
    // For ESP32 with WebSocketsClient, beginSSL enables wss://
    // If your environment requires a specific CA, you may need to
    // provide it via WebSocketsClient API (e.g. setCACert) before calling beginSSL.
    _ws.beginSSL(host, port, path);
    // Optional: if your environment uses a certificate chain the device
    // cannot validate, consider enabling insecure mode (not recommended):
    // _ws.setInsecure();
  }
  else
  {
    _ws.begin(host, port, path);
  }
  // Keep the connection alive behind proxies/CDN (e.g., Cloudflare)
  // ping every 5s, expect pong within 3s, allow 2 misses
  _ws.enableHeartbeat(5000, 3000, 2);
  _ws.onEvent([this](WStype_t type, uint8_t *payload, size_t length)
              {
    switch(type) {
      case WStype_DISCONNECTED:
        _wsConnected = false;
        _wsAuthenticated = false;
        Serial.printf("[%s] Disconnected!\n", _deviceId.c_str());
        break;
      case WStype_CONNECTED:
        {
          _wsConnected = true;
          Serial.printf("[%s] Connected to server!\n", _deviceId.c_str());
          String authMsg = "{\"type\":\"auth\",\"data\":{\"token\":\"" + _token + "\",\"clientType\":\"device\",\"deviceId\":\"" + _deviceId + "\"}}";
          _ws.sendTXT(authMsg);
          // Devices do not subscribe via WS; web clients subscribe.
          // Optionally, a device could register its info here using
          // a `device_register` message if supported by the server.
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
          if (msgType && strcmp(msgType, "auth_success") == 0) {
            _wsAuthenticated = true;
            wsFlushQueue();
          } else if (msgType && strcmp(msgType, "error") == 0) {
            const char* err = doc["data"]["error"] | "unknown";
            Serial.printf("[%s] WS error: %s\n", _deviceId.c_str(), err);
          } else if (msgType && strcmp(msgType, "command") == 0) {
            const char* command = doc["data"]["command"];
            Serial.printf("Received command: %s\n", command);
            // Store command for hasCommand()/getCommand()
            _pendingCommand = String(command);
            _hasPendingCommand = true;
          }
        }
        break;
      case WStype_BIN:
        Serial.printf("[%s] Binary message received\n", _deviceId.c_str());
        break;
      case WStype_ERROR:
        Serial.printf("[%s] WS Error!\n", _deviceId.c_str());
        break;
    } });
  _ws.setReconnectInterval(5000);
}

bool ZiLinkEsp32::sendWebSocketData(const String &message)
{
  if (_ws.isConnected() && _wsAuthenticated)
  {
    String msg = "{\"type\":\"device_data\",\"data\":{\"sensorData\":" + message + "}}";
    _ws.sendTXT(msg);
    return true;
  }
  // If not ready, enqueue so it can be sent after auth/connection
  wsEnqueue(message);
  return false;
}

void ZiLinkEsp32::setupMqtt(const char *broker, uint16_t port, const char *deviceId, const char *token)
{
  _token = token;
  _deviceId = deviceId;
  _mqtt.setServer(broker, port);
  _mqtt.setCallback([this](char *topic, byte *payload, unsigned int length)
                    {
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
    } });
  while (!_mqtt.connected())
  {
    if (_mqtt.connect(deviceId, _token.c_str(), ""))
    {
      Serial.printf("[%s] Connected to MQTT broker\n", _deviceId.c_str());
      String subTopic = "zilink/devices/" + String(deviceId) + "/commands";
      _mqtt.subscribe(subTopic.c_str());
    }
    else
    {
      delay(500);
    }
  }
}

bool ZiLinkEsp32::publishMqttData(const String &payload)
{
  if (_mqtt.connected())
  {
    String topic = "zilink/devices/" + _deviceId + "/data";
    return _mqtt.publish(topic.c_str(), payload.c_str());
  }
  return false;
}

bool ZiLinkEsp32::publishMqttStatus(const String &payload)
{
  if (_mqtt.connected())
  {
    String topic = "zilink/devices/" + _deviceId + "/status";
    return _mqtt.publish(topic.c_str(), payload.c_str());
  }
  return false;
}

bool ZiLinkEsp32::sendComponentData(const String &payload)
{
  if (_ws.isConnected())
  {
    String tmp = payload;
    _ws.sendTXT(tmp);
    return true;
  }
  if (_mqtt.connected())
  {
    String topic = "zilink/devices/" + _deviceId + "/components";
    return _mqtt.publish(topic.c_str(), payload.c_str());
  }
  return sendHttp("/devices/" + _deviceId + "/components", payload);
}

void ZiLinkEsp32::createButton(bool value, const char *id)
{
  String payload =
      "{\"type\":\"button\",\"id\":\"" + String(id) + "\",\"value\":" + (value ? "true" : "false") + "}";
  sendComponentData(payload);
}

void ZiLinkEsp32::createSlider(int value, const char *id)
{
  String payload =
      "{\"type\":\"slider\",\"id\":\"" + String(id) + "\",\"value\":" + String(value) + "}";
  sendComponentData(payload);
}

void ZiLinkEsp32::createToggle(bool value, const char *id)
{
  String payload =
      "{\"type\":\"toggle\",\"id\":\"" + String(id) + "\",\"value\":" + (value ? "true" : "false") + "}";
  sendComponentData(payload);
}

void ZiLinkEsp32::createProgress(int value, const char *id)
{
  String payload =
      "{\"type\":\"progress\",\"id\":\"" + String(id) + "\",\"value\":" + String(value) + "}";
  sendComponentData(payload);
}

void ZiLinkEsp32::begin() {
  // Default initialization - setup WebSocket connection
  setupWebSocket(_baseUrl.substring(7).c_str(), 8080, "/ws", _deviceId.c_str(), _token.c_str());
}

void ZiLinkEsp32::begin(const char *deviceId, const char *serverHost, int serverPort) {
  _deviceId = String(deviceId);
  _baseUrl = "http://" + String(serverHost) + ":" + String(serverPort);
  setupWebSocket(serverHost, serverPort, "/ws", deviceId, _token.c_str());
}

bool ZiLinkEsp32::hasCommand() {
  return _hasPendingCommand;
}

String ZiLinkEsp32::getCommand() {
  if (_hasPendingCommand) {
    _hasPendingCommand = false;
    return _pendingCommand;
  }
  return "";
}

void ZiLinkEsp32::loop()
{
  _ws.loop();
  // Try to flush any queued messages when ready
  if (_ws.isConnected() && _wsAuthenticated) {
    wsFlushQueue();
  }
  if (!_mqtt.connected())
  {
    _mqtt.connect(_deviceId.c_str(), _token.c_str(), "");
  }
  _mqtt.loop();
}

void ZiLinkEsp32::wsEnqueue(const String &payload)
{
  size_t nextTail = (_wsQTail + 1) % WS_QUEUE_SIZE;
  if (nextTail == _wsQHead) {
    // Queue full, drop the oldest to make room
    _wsQHead = (_wsQHead + 1) % WS_QUEUE_SIZE;
  }
  _wsQueue[_wsQTail] = payload;
  _wsQTail = nextTail;
}

void ZiLinkEsp32::wsFlushQueue()
{
  while (_wsQHead != _wsQTail && _ws.isConnected() && _wsAuthenticated) {
    String sensors = _wsQueue[_wsQHead];
    String msg = "{\"type\":\"device_data\",\"data\":{\"sensorData\":" + sensors + "}}";
    _ws.sendTXT(msg);
    _wsQueue[_wsQHead] = String();
    _wsQHead = (_wsQHead + 1) % WS_QUEUE_SIZE;
  }
}
