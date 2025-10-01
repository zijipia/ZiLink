# ZiLink Designer Data Flow Guide

## 🔄 Luồng dữ liệu hoàn chỉnh: Designer → ESP32 → Server → Web

### Tổng quan

Luồng dữ liệu này cho phép bạn tạo dashboard trong Designer, generate code ESP32, và xem dữ liệu real-time trên web.

```
Designer → Code Generator → ESP32 → ZiLinkEsp32 → WebSocket/HTTP → Server → WebSocket → Web Dashboard
```

## 📋 Các bước thực hiện

### 1. Tạo Dashboard trong Designer

1. Truy cập `/designer` trên web interface
2. Kéo thả các widgets (temperature, humidity, button, etc.)
3. Gán device ID cho các widgets
4. Click "Generate ESP32 Code" để tạo code

### 2. Cấu hình ESP32

1. Copy code được generate từ Designer
2. Cập nhật các thông tin sau trong code:
   ```cpp
   const char* ssid = "YOUR_WIFI_SSID";
   const char* password = "YOUR_WIFI_PASSWORD";
   const char* serverHost = "YOUR_SERVER_HOST";  // IP hoặc domain của server
   const char* deviceToken = "YOUR_DEVICE_TOKEN"; // Token từ device registration
   ```

### 3. Đăng ký Device trên Server

1. Truy cập `/devices` trên web interface
2. Click "Register New Device"
3. Điền thông tin device và copy `deviceToken` được tạo
4. Paste token vào code ESP32

### 4. Upload và chạy ESP32

1. Upload code lên ESP32
2. Mở Serial Monitor để kiểm tra kết nối
3. ESP32 sẽ tự động kết nối WiFi và WebSocket

### 5. Xem dữ liệu real-time

1. Trong Designer, click "Live Data" button
2. Chọn device để xem dữ liệu
3. Dữ liệu sẽ được hiển thị real-time với charts và gauges

## 🔧 Cấu hình Server

### WebSocket Server

Server tự động khởi động WebSocket trên port 8080 với path `/ws`

### MQTT Server (Optional)

Server cũng hỗ trợ MQTT trên port 1883 với topic pattern:

- `zilink/devices/{deviceId}/data` - Gửi dữ liệu
- `zilink/devices/{deviceId}/commands` - Nhận lệnh

## 📊 Format dữ liệu

### ESP32 gửi dữ liệu

```json
{
	"deviceId": "ESP32_DESIGNER_TEST",
	"timestamp": 1234567890,
	"sensorData": [
		{
			"type": "temperature",
			"value": 25.5,
			"unit": "°C"
		},
		{
			"type": "humidity",
			"value": 60.2,
			"unit": "%"
		},
		{
			"type": "button",
			"value": "pressed",
			"unit": ""
		}
	]
}
```

### Server gửi lệnh đến ESP32

```json
{
	"type": "command",
	"data": {
		"command": {
			"type": "ui_button",
			"action": "press"
		},
		"timestamp": "2024-01-01T00:00:00.000Z"
	}
}
```

## 🛠️ Troubleshooting

### ESP32 không kết nối được WiFi

- Kiểm tra SSID và password
- Đảm bảo WiFi có thể truy cập internet
- Kiểm tra Serial Monitor để xem lỗi

### ESP32 không kết nối được WebSocket

- Kiểm tra serverHost và serverPort
- Đảm bảo server đang chạy
- Kiểm tra deviceToken có đúng không
- Kiểm tra firewall có block port 8080 không

### Không nhận được dữ liệu trên web

- Kiểm tra WebSocket connection status
- Đảm bảo device đã được đăng ký
- Kiểm tra browser console để xem lỗi
- Refresh trang web

### Dữ liệu không hiển thị đúng

- Kiểm tra format JSON từ ESP32
- Đảm bảo sensor type khớp với widget type
- Kiểm tra unit và value format

## 📁 File Structure

```
arduino/ZiLinkEsp32/
├── src/
│   ├── ZiLinkEsp32.h          # Header file với API
│   └── ZiLinkEsp32.cpp        # Implementation
├── examples/
│   ├── DesignerTest/          # Ví dụ test đầy đủ
│   ├── SimpleDesigner/        # Ví dụ đơn giản
│   └── DesignerWidgets/      # Ví dụ với nhiều sensors
└── README_DESIGNER_DATA_FLOW.md
```

## 🚀 Ví dụ sử dụng

### Ví dụ đơn giản với DHT22

```cpp
#include <ZiLinkEsp32.h>
#include <DHT.h>

DHT dht(4, DHT22);
ZiLinkEsp32 zilink;

void setup() {
  WiFi.begin("SSID", "PASSWORD");
  zilink.setupWebSocket("192.168.1.100", 8080, "/ws", "DEVICE_ID", "TOKEN");
}

void loop() {
  float temp = dht.readTemperature();
  float hum = dht.readHumidity();

  DynamicJsonDocument doc(512);
  doc["deviceId"] = "DEVICE_ID";
  JsonArray sensors = doc.createNestedArray("sensorData");

  JsonObject tempObj = sensors.createNestedObject();
  tempObj["type"] = "temperature";
  tempObj["value"] = temp;
  tempObj["unit"] = "°C";

  String jsonString;
  serializeJson(doc, jsonString);
  zilink.sendWebSocketData(jsonString);

  zilink.loop();
  delay(2000);
}
```

## 📞 Hỗ trợ

Nếu gặp vấn đề, hãy kiểm tra:

1. Serial Monitor của ESP32
2. Browser Console
3. Server logs
4. Network connectivity

Để được hỗ trợ thêm, vui lòng tạo issue trên GitHub repository.
