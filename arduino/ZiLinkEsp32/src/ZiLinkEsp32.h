#ifndef ZILINK_ESP32_H
#define ZILINK_ESP32_H

#include <Arduino.h>
#include <WiFi.h>
#include <HTTPClient.h>

class ZiLinkEsp32 {
public:
        explicit ZiLinkEsp32(const char *baseUrl);
        void begin(const char *ssid, const char *password, const char *token);
        bool sendData(const char *endpoint, const String &payload);

private:
        String _baseUrl;
        String _token;
};

#endif
