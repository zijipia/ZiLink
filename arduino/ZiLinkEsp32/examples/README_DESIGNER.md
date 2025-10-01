# ZiLink ESP32 Designer Integration Guide

Hướng dẫn tích hợp ESP32 với Designer Dashboard của ZiLink.

## Tổng quan

Designer Dashboard cho phép bạn tạo giao diện tương tác với các thiết bị ESP32 thông qua các widget như:

- **Temperature Widget**: Hiển thị nhiệt độ từ cảm biến DHT22/BME280
- **Humidity Widget**: Hiển thị độ ẩm từ cảm biến DHT22/BME280
- **Pressure Widget**: Hiển thị áp suất từ cảm biến BME280
- **Light Widget**: Hiển thị ánh sáng từ cảm biến LDR/TSL2561
- **Sound Widget**: Hiển thị âm thanh từ microphone
- **Motion Widget**: Hiển thị chuyển động từ cảm biến PIR
- **Button Widget**: Điều khiển thiết bị từ dashboard

## Cài đặt

### 1. Cài đặt thư viện

Trong Arduino IDE, cài đặt các thư viện sau:

- **ZiLinkEsp32**: Thư viện chính của ZiLink
- **ArduinoJson**: Để xử lý JSON
- **DHT sensor library**: Cho cảm biến DHT22
- **Adafruit BME280 Library**: Cho cảm biến BME280 (tùy chọn)

### 2. Cấu hình WiFi và Server

Mở file `.ino` và thay đổi các thông tin sau:

```cpp
// WiFi Configuration
const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";

// ZiLink Configuration
const char* deviceId = "ESP32_DESIGNER_DEMO";
const char* serverHost = "YOUR_SERVER_HOST"; // IP hoặc domain của server
const int serverPort = 8080;
```

## Ví dụ sử dụng

### Ví dụ 1: SimpleDesigner (Đơn giản)

**Phần cứng cần thiết:**

- ESP32 Development Board
- DHT22 Temperature & Humidity Sensor
- LED
- Push Button
- Các điện trở

**Kết nối:**

```
DHT22:
- VCC → 3.3V
- GND → GND
- Data → Pin 4
- 10kΩ resistor giữa VCC và Data

LED:
- Anode → Pin 5
- Cathode → GND qua 220Ω resistor

Button:
- Một đầu → Pin 0
- Đầu kia → GND
```

**Tính năng:**

- Gửi dữ liệu nhiệt độ và độ ẩm lên dashboard
- Hiển thị trạng thái button
- Nhận lệnh điều khiển LED từ dashboard

### Ví dụ 2: DesignerWidgets (Đầy đủ)

**Phần cứng cần thiết:**

- ESP32 Development Board
- DHT22 Temperature & Humidity Sensor
- BME280 Pressure Sensor (I2C)
- LDR (Light Dependent Resistor)
- Microphone Module
- PIR Motion Sensor
- Push Button
- LED

**Kết nối:**

```
DHT22:
- VCC → 3.3V
- GND → GND
- Data → Pin 4

BME280 (I2C):
- VCC → 3.3V
- GND → GND
- SDA → Pin 21
- SCL → Pin 22

LDR:
- Một đầu → 3.3V
- Đầu kia → Pin A0 qua 10kΩ resistor

Microphone:
- VCC → 3.3V
- GND → GND
- OUT → Pin A1

PIR:
- VCC → 3.3V
- GND → GND
- OUT → Pin 2

Button:
- Một đầu → Pin 0
- Đầu kia → GND

LED:
- Anode → Pin 5
- Cathode → GND qua 220Ω resistor
```

## Cách sử dụng Designer Dashboard

### 1. Truy cập Designer

1. Mở trình duyệt và truy cập Designer Dashboard
2. Đăng nhập vào tài khoản của bạn
3. Chọn "Designer" từ menu

### 2. Tạo Widget

1. **Chọn công cụ**: Sử dụng toolbar bên trái để chọn loại widget
2. **Vẽ widget**: Click và kéo trên canvas để tạo widget
3. **Cấu hình**: Chọn widget và cấu hình trong Property Panel bên phải:
   - Chọn device ID
   - Chọn loại dữ liệu (temperature, humidity, etc.)
   - Điều chỉnh kích thước và vị trí

### 3. Widget Panel

Sử dụng Widget Panel để thêm các widget có sẵn:

- Kéo thả widget từ panel vào canvas
- Widget sẽ tự động được tạo với cấu hình mặc định

### 4. Lưu và Xuất bản

- Nhấn **Save** để lưu layout
- Sử dụng **Preview** để xem trước dashboard
- **Export** để xuất code ESP32 tương ứng

## Định dạng dữ liệu

### Gửi dữ liệu từ ESP32

```json
{
	"deviceId": "ESP32_DESIGNER_DEMO",
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
			"type": "motion",
			"value": "true",
			"unit": ""
		}
	]
}
```

### Nhận lệnh từ Dashboard

```json
{
	"type": "ui_button",
	"id": "button_1",
	"action": "press",
	"label": "Turn On LED"
}
```

## Troubleshooting

### Lỗi thường gặp

1. **ESP32 không kết nối WiFi**
   - Kiểm tra SSID và password
   - Đảm bảo WiFi 2.4GHz (ESP32 không hỗ trợ 5GHz)

2. **Không nhận được dữ liệu**
   - Kiểm tra serverHost và serverPort
   - Đảm bảo server đang chạy
   - Kiểm tra firewall và network

3. **Widget không hiển thị dữ liệu**
   - Kiểm tra deviceId có khớp không
   - Kiểm tra type của sensor data
   - Xem Serial Monitor để debug

4. **Cảm biến không hoạt động**
   - Kiểm tra kết nối phần cứng
   - Kiểm tra điện áp cung cấp
   - Kiểm tra code pin definitions

### Debug

Sử dụng Serial Monitor để debug:

```cpp
Serial.begin(115200);
Serial.println("Debug message");
```

Kiểm tra dữ liệu JSON:

```cpp
Serial.println("Sent data: " + jsonString);
```

## Mở rộng

### Thêm cảm biến mới

1. **Định nghĩa pin và khởi tạo**:

```cpp
#define NEW_SENSOR_PIN A2
pinMode(NEW_SENSOR_PIN, INPUT);
```

2. **Đọc dữ liệu**:

```cpp
float newSensorValue = analogRead(NEW_SENSOR_PIN);
```

3. **Thêm vào JSON**:

```cpp
JsonObject newSensorObj = sensorArray.createNestedObject();
newSensorObj["type"] = "new_sensor";
newSensorObj["value"] = newSensorValue;
newSensorObj["unit"] = "unit";
```

4. **Tạo widget tương ứng trong Designer**

### Tùy chỉnh widget

Bạn có thể tùy chỉnh giao diện widget bằng cách:

- Thay đổi màu sắc và kích thước
- Thêm label và đơn vị
- Cấu hình hiển thị dữ liệu
- Thêm animation và hiệu ứng

## Hỗ trợ

Nếu gặp vấn đề, hãy:

1. Kiểm tra Serial Monitor để xem lỗi
2. Xem documentation của ZiLinkEsp32
3. Liên hệ team ZiLink để được hỗ trợ

---

**Chúc bạn thành công với ZiLink ESP32 Designer Integration!** 🚀
