#include "ZiLinkEsp32.h"

ZiLinkEsp32::ZiLinkEsp32(const char *baseUrl) : _baseUrl(baseUrl) {}

void ZiLinkEsp32::begin(const char *ssid, const char *password, const char *token) {
        _token = token;
        WiFi.begin(ssid, password);
        while (WiFi.status() != WL_CONNECTED) {
                delay(500);
        }
}

bool ZiLinkEsp32::sendData(const char *endpoint, const String &payload) {
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
