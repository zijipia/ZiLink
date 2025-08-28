# ZiLink Arduino Library

Simple Arduino library for ESP32 devices to connect to the ZiLink platform using a token.

## Usage

```cpp
#include <ZiLinkClient.h>

ZiLinkClient client("your.server.com", 8080);

void setup() {
  client.begin("WiFiSSID", "WiFiPassword");
  client.connect("YOUR_ACCESS_TOKEN");
}

void loop() {
  client.loop();
  // Example: send sensor data every 10 seconds
  client.sendSensorData("device-1", "{\\"temperature\\":25}");
  delay(10000);
}
```
