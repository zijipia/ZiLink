# ZiLink ESP32 Library

This Arduino library simplifies connecting ESP32 devices to the ZiLink platform.

## Usage

```cpp
#include <ZiLinkEsp32.h>

ZiLinkEsp32 client("https://api.zilink.io");

void setup() {
  client.begin("your-ssid", "your-password", "DEVICE_TOKEN");
  client.sendData("/devices/data", "{\"temp\":25}");
}

void loop() {
  // your code here
}
```

Provide your device token to authenticate with the platform. The library handles WiFi connection and token-based HTTP requests.
