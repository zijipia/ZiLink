# ZiLink ESP32 Library

This Arduino library simplifies connecting ESP32 devices to the ZiLink platform using HTTP, WebSocket, or MQTT.

## Usage

```cpp
#include <ZiLinkEsp32.h>

ZiLinkEsp32 client;

void setup() {
  client.begin("your-ssid", "your-password");

  // HTTP example
  client.setupHttp("https://api.zilink.io", "DEVICE_TOKEN");
  client.sendHttp("/devices/data", "{\"temp\":25}");

  // WebSocket example
  client.setupWebSocket("ws.zilink.io", 80, "/ws", "DEVICE_TOKEN");
  client.sendWebSocket("{\"hello\":true}");

  // MQTT example
  client.setupMqtt("mqtt.zilink.io", 1883, "DEVICE_TOKEN");
  client.publishMqtt("zilink/topic", "{\"temp\":25}");
}

void loop() {
  client.loop();
}
```

Provide your device token to authenticate with the platform. The library handles WiFi connection and token-based HTTP, WebSocket,
or MQTT communication.
