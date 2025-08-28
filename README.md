# ZiLink IoT Platform

ZiLink là một platform quản lý thiết bị IoT toàn diện được xây dựng với Node.js, Express, WebSocket, Next.js, và MongoDB. Platform
hỗ trợ real-time data monitoring, device management, và OAuth authentication.

![ZiLink Architecture](![thumnail](https://github.com/user-attachments/assets/0ed2c124-0a40-46f5-b17d-477c22a66d7a)
)

## 🚀 Tính Năng

### Backend (Node.js + Express)

- **RESTful API** cho device management
- **WebSocket Server** cho real-time communication
- **MQTT Broker Integration** cho IoT device communication
- **OAuth Authentication** (Google, GitHub, Discord)
- **JWT-based Authorization**
- **MongoDB Integration** với Mongoose
- **Data Aggregation & Analytics**
- **Real-time Alerts System**
- **Device Command & Control**
- **Device IDs tự động tạo bằng UUID khi đăng ký**

### Frontend (Next.js + TypeScript)

- **Responsive Dashboard** với TailwindCSS
- **Real-time Device Monitoring**
- **Interactive Charts & Graphs**
- **Device Registration & Management**
- **User Profile Management**
- **OAuth Social Login**
- **Real-time Notifications**
- **Mobile-friendly UI**
- **UI Designer với khả năng kéo thả component**
- **Viewer page để hiển thị UI đã thiết kế**
- **Liên kết button/slider với Device ID để gửi lệnh điều khiển**
- **Hỗ trợ giao diện sáng/tối**
- **Raw console page để theo dõi sự kiện và debug**
- **Quick action links cho thêm thiết bị mới, xem analytics và cài đặt**
- **Trang quản lý thiết bị hiển thị Device ID và Device Token**

### IoT Device Support

- **MQTT Protocol** support
- **WebSocket** connections
- **HTTP REST API** endpoints
- **Device registration & authentication**
- **Real-time data streaming**
- **Command & control capabilities**
- **Alert & notification system**
- **Arduino library for ESP32 sử dụng Device ID và token để kết nối HTTP/WebSocket/MQTT**
- **DEVICE_TOKEN authentication cho việc gửi dữ liệu và cập nhật trạng thái thiết bị**
- **Ghi log payload thô của thiết bị để dễ debug**

## 📋 Yêu Cầu Hệ Thống

- **Node.js** >= 18.0.0
- **MongoDB** >= 5.0
- **MQTT Broker** (Mosquitto recommended)
- **npm** hoặc **yarn**

## 🛠️ Cài Đặt

### 1. Clone Repository

```bash
git clone https://github.com/your-username/zilink.git
cd zilink
```

### 2. Cài Đặt Dependencies

```bash
# Root dependencies
npm install

# Server dependencies
cd server
npm install

# Client dependencies
cd ../client
npm install
```

### 3. Cấu Hình Environment

#### Server Configuration

Tạo file `.env` trong thư mục `server/`:

```env
# Server Configuration
PORT=3001
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/zilink
DB_NAME=zilink

# JWT Secret
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# OAuth Credentials
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret

DISCORD_CLIENT_ID=your-discord-client-id
DISCORD_CLIENT_SECRET=your-discord-client-secret

# MQTT Configuration
MQTT_BROKER_URL=mqtt://localhost:1883
MQTT_USERNAME=
MQTT_PASSWORD=

# WebSocket Configuration
WS_PORT=3002

# Client URL
CLIENT_URL=http://localhost:3000

# Session Secret
SESSION_SECRET=your-session-secret-change-this-in-production
```

#### Client Configuration

Tạo file `.env.local` trong thư mục `client/`:

```env
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_WS_URL=ws://localhost:3001

# OAuth Redirect URLs
NEXT_PUBLIC_GOOGLE_REDIRECT_URL=http://localhost:3001/api/auth/google
NEXT_PUBLIC_GITHUB_REDIRECT_URL=http://localhost:3001/api/auth/github
NEXT_PUBLIC_DISCORD_REDIRECT_URL=http://localhost:3001/api/auth/discord

# App Configuration
NEXT_PUBLIC_APP_NAME=ZiLink IoT Platform
NEXT_PUBLIC_APP_VERSION=1.0.0

# Feature Flags
NEXT_PUBLIC_ENABLE_REAL_TIME=true
NEXT_PUBLIC_ENABLE_MQTT_LOGS=true
NEXT_PUBLIC_ENABLE_DEVICE_SIMULATION=true
```

### 4. Cài Đặt MongoDB

#### Sử dụng Docker

```bash
docker run --name mongodb -d -p 27017:27017 mongo:latest
```

#### Hoặc cài đặt local MongoDB

Tham khao: [MongoDB Installation Guide](https://docs.mongodb.com/manual/installation/)

### 5. Cài Đặt MQTT Broker (Mosquitto)

#### Ubuntu/Debian

```bash
sudo apt update
sudo apt install mosquitto mosquitto-clients
sudo systemctl start mosquitto
sudo systemctl enable mosquitto
```

#### macOS

```bash
brew install mosquitto
brew services start mosquitto
```

#### Docker

```bash
docker run -it -p 1883:1883 eclipse-mosquitto
```

## 🚀 Khởi Chạy Ứng Dụng

### Development Mode

Từ thư mục root:

```bash
# Chạy cả server và client
npm run dev

# Hoặc chạy riêng lẻ:
npm run dev:server  # Chỉ server
npm run dev:client  # Chỉ client
```

### Production Mode

```bash
# Build ứng dụng
npm run build

# Chạy production
npm start
```

Ứng dụng sẽ chạy tại:

- **Client**: http://localhost:3000
- **Server**: http://localhost:3001
- **WebSocket**: ws://localhost:3001/ws
- **MQTT**: mqtt://localhost:1883

## 📡 API Documentation

### Authentication Endpoints

#### Login

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password"
}
```

#### Register

```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password",
  "name": "User Name"
}
```

#### OAuth Login

```http
GET /api/auth/google
GET /api/auth/github
GET /api/auth/discord
```

### Device Management Endpoints

#### Get Devices

```http
GET /api/devices
Authorization: Bearer <token>
```

Mỗi thiết bị trong kết quả sẽ bao gồm trường `deviceToken` để sử dụng khi thiết bị kết nối tới nền tảng.

#### Register Device

```http
POST /api/devices/register
Authorization: Bearer <token>
Content-Type: application/json

{
  "deviceId": "unique-device-id",
  "name": "Device Name",
  "type": "sensor",
  "category": "temperature"
}
```

#### Send Device Command

```http
POST /api/devices/{deviceId}/command
Authorization: Bearer <token>
Content-Type: application/json

{
  "command": {
    "action": "turn_on",
    "parameters": {}
  }
}
```

#### Get Device Data

```http
GET /api/devices/{deviceId}/data?limit=100&startDate=2023-01-01&endDate=2023-12-31
Authorization: Bearer <token>
```

## 🔌 WebSocket API

### Connection

```javascript
const ws = new WebSocket("ws://localhost:3001/ws");

// Authenticate
ws.send(
	JSON.stringify({
		type: "auth",
		data: {
			token: "your-jwt-token",
			clientType: "web", // or 'device'
		},
	}),
);
```

### Subscribe to Device

```javascript
ws.send(
	JSON.stringify({
		type: "subscribe_device",
		data: {
			deviceId: "your-device-id",
		},
	}),
);
```

### Send Device Command

```javascript
ws.send(
	JSON.stringify({
		type: "device_command",
		data: {
			deviceId: "device-id",
			command: { action: "turn_on" },
		},
	}),
);
```

## 📊 MQTT Topics

### Device Data

```
zilink/devices/{deviceId}/data
```

Payload:

```json
{
	"sensors": [
		{
			"type": "temperature",
			"value": 25.5,
			"unit": "°C"
		}
	],
	"deviceStatus": {
		"battery": { "level": 85, "isCharging": false },
		"signalStrength": -45
	}
}
```

### Device Status

```
zilink/devices/{deviceId}/status
```

### Device Alerts

```
zilink/devices/{deviceId}/alert
```

Payload:

```json
{
	"type": "threshold",
	"severity": "warning",
	"message": "Temperature exceeded threshold",
	"threshold": { "value": 30, "condition": ">" }
}
```

### Device Commands (Subscribe)

```
zilink/devices/{deviceId}/command
```

### Server Status

```
zilink/server/status
```

## 🏗️ Kiến Trúc Hệ Thống

```
┌─────────────────┐    HTTP/WS     ┌─────────────────┐    MQTT      ┌─────────────────┐
│                 │◄──────────────►│                 │◄────────────►│                 │
│   Next.js Web   │                │   Node.js API   │              │   IoT Devices   │
│     Client      │                │     Server      │              │                 │
│                 │                │                 │              │                 │
└─────────────────┘                └─────────────────┘              └─────────────────┘
                                            │
                                            │
                                            ▼
                                   ┌─────────────────┐
                                   │                 │
                                   │    MongoDB      │
                                   │   Database      │
                                   │                 │
                                   └─────────────────┘
```

## 🔧 Device SDK & Examples

### Arduino ESP32 Example

```cpp
#include <WiFi.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>

const char* ssid = "your-wifi-ssid";
const char* password = "your-wifi-password";
const char* mqtt_server = "your-mqtt-broker";
const char* device_id = "esp32-sensor-001";

WiFiClient espClient;
PubSubClient client(espClient);

void setup() {
  Serial.begin(115200);
  setup_wifi();
  client.setServer(mqtt_server, 1883);
  client.setCallback(callback);
}

void loop() {
  if (!client.connected()) {
    reconnect();
  }
  client.loop();

  // Send sensor data every 30 seconds
  static unsigned long lastMsg = 0;
  unsigned long now = millis();
  if (now - lastMsg > 30000) {
    lastMsg = now;
    sendSensorData();
  }
}

void sendSensorData() {
  StaticJsonDocument<200> doc;
  JsonArray sensors = doc.createNestedArray("sensors");

  JsonObject temp = sensors.createNestedObject();
  temp["type"] = "temperature";
  temp["value"] = 25.5;
  temp["unit"] = "°C";

  JsonObject humid = sensors.createNestedObject();
  humid["type"] = "humidity";
  humid["value"] = 60.2;
  humid["unit"] = "%";

  String payload;
  serializeJson(doc, payload);

  String topic = "zilink/devices/" + String(device_id) + "/data";
  client.publish(topic.c_str(), payload.c_str());
}

void callback(char* topic, byte* payload, unsigned int length) {
  // Handle incoming commands
  String message;
  for (int i = 0; i < length; i++) {
    message += (char)payload[i];
  }

  // Parse and execute command
  StaticJsonDocument<200> doc;
  deserializeJson(doc, message);

  String action = doc["command"]["action"];
  if (action == "turn_on") {
    // Turn on device
  } else if (action == "turn_off") {
    // Turn off device
  }
}
```

### Python Device Example

```python
import paho.mqtt.client as mqtt
import json
import time
import random
from datetime import datetime

class ZiLinkDevice:
    def __init__(self, device_id, mqtt_host="localhost", mqtt_port=1883):
        self.device_id = device_id
        self.client = mqtt.Client()
        self.client.on_connect = self.on_connect
        self.client.on_message = self.on_message
        self.client.connect(mqtt_host, mqtt_port, 60)

    def on_connect(self, client, userdata, flags, rc):
        print(f"Connected with result code {rc}")
        # Subscribe to command topic
        topic = f"zilink/devices/{self.device_id}/command"
        client.subscribe(topic)

    def on_message(self, client, userdata, msg):
        try:
            command = json.loads(msg.payload.decode())
            self.handle_command(command)
        except Exception as e:
            print(f"Error handling command: {e}")

    def handle_command(self, command):
        action = command.get("command", {}).get("action")
        print(f"Received command: {action}")

    def send_sensor_data(self):
        data = {
            "sensors": [
                {
                    "type": "temperature",
                    "value": round(random.uniform(20, 30), 1),
                    "unit": "°C"
                },
                {
                    "type": "humidity",
                    "value": round(random.uniform(40, 80), 1),
                    "unit": "%"
                }
            ],
            "deviceStatus": {
                "battery": {"level": random.randint(20, 100), "isCharging": False},
                "signalStrength": random.randint(-80, -30)
            },
            "timestamp": datetime.utcnow().isoformat() + "Z"
        }

        topic = f"zilink/devices/{self.device_id}/data"
        self.client.publish(topic, json.dumps(data))
        print(f"Sent data: {data}")

    def run(self):
        self.client.loop_start()
        while True:
            self.send_sensor_data()
            time.sleep(30)  # Send data every 30 seconds

if __name__ == "__main__":
    device = ZiLinkDevice("python-sensor-001")
    device.run()
```

## 🧪 Testing

### Unit Tests

```bash
# Test server
cd server
npm test

# Test client
cd client
npm test
```

### API Testing với cURL

```bash
# Health check
curl http://localhost:3001/health

# Login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}'

# Get devices (requires token)
curl -X GET http://localhost:3001/api/devices \
  -H "Authorization: Bearer your-jwt-token"
```

### MQTT Testing

```bash
# Subscribe to all device topics
mosquitto_sub -h localhost -t "zilink/devices/+/data"

# Publish test data
mosquitto_pub -h localhost -t "zilink/devices/test-device/data" \
  -m '{"sensors":[{"type":"temperature","value":25.5,"unit":"°C"}]}'
```

## 📦 Deployment

### Docker Deployment

Tạo file `docker-compose.yml`:

```yaml
version: "3.8"
services:
  mongodb:
    image: mongo:latest
    container_name: zilink-mongodb
    ports:
      - "27017:27017"
    volumes:
      - mongodb_data:/data/db
    environment:
      MONGO_INITDB_ROOT_USERNAME: admin
      MONGO_INITDB_ROOT_PASSWORD: password

  mosquitto:
    image: eclipse-mosquitto:latest
    container_name: zilink-mosquitto
    ports:
      - "1883:1883"
      - "9001:9001"
    volumes:
      - ./mosquitto.conf:/mosquitto/config/mosquitto.conf

  server:
    build: ./server
    container_name: zilink-server
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=production
      - MONGODB_URI=mongodb://admin:password@mongodb:27017/zilink?authSource=admin
      - MQTT_BROKER_URL=mqtt://mosquitto:1883
    depends_on:
      - mongodb
      - mosquitto

  client:
    build: ./client
    container_name: zilink-client
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_API_URL=http://localhost:3001
    depends_on:
      - server

volumes:
  mongodb_data:
```

```bash
# Deploy với Docker Compose
docker-compose up -d
```

### Production Deployment

1. **Server Setup (Ubuntu)**:

```bash
# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2
sudo npm install -g pm2

# Install MongoDB
sudo apt install mongodb

# Install Mosquitto
sudo apt install mosquitto mosquitto-clients
```

2. **Deploy Application**:

```bash
# Clone and build
git clone https://github.com/your-username/zilink.git
cd zilink
npm install
npm run build

# Start with PM2
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

3. **Reverse Proxy (Nginx)**:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /ws {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## 🔒 Bảo Mật

### Best Practices

1. **Environment Variables**: Không commit `.env` files
2. **JWT Secrets**: Sử dụng strong secrets trong production
3. **HTTPS**: Bắt buộc HTTPS trong production
4. **Rate Limiting**: Đã implement trong server
5. **Input Validation**: Sử dụng Joi cho validation
6. **CORS**: Cấu hình CORS properly
7. **MongoDB**: Enable authentication
8. **MQTT**: Sử dụng authentication và TLS

### Security Headers

Server tự động thêm security headers thông qua Helmet.js:

- X-Content-Type-Options
- X-Frame-Options
- X-XSS-Protection
- Strict-Transport-Security

## 🐛 Troubleshooting

### Common Issues

1. **MQTT Connection Failed**:
   - Kiểm tra MQTT broker running
   - Verify MQTT_BROKER_URL trong .env
   - Check firewall settings

2. **MongoDB Connection Error**:
   - Đảm bảo MongoDB service running
   - Check MONGODB_URI format
   - Verify network connectivity

3. **WebSocket Connection Failed**:
   - Check server running
   - Verify WS_URL configuration
   - Check browser console for errors

4. **OAuth Login Not Working**:
   - Verify OAuth credentials
   - Check redirect URLs match
   - Ensure OAuth apps are configured

### Logs

```bash
# Server logs
cd server
npm run dev

# Client logs
cd client
npm run dev

# PM2 logs (production)
pm2 logs zilink-server
pm2 logs zilink-client
```

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Create Pull Request

### Development Guidelines

- Follow TypeScript best practices
- Write unit tests for new features
- Update documentation
- Use conventional commits
- Follow ESLint rules

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 Support

- Email: support@zilink.io
- Documentation: https://docs.zilink.io
- Issues: https://github.com/your-username/zilink/issues

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) - React framework
- [Express.js](https://expressjs.com/) - Web framework
- [MongoDB](https://www.mongodb.com/) - Database
- [Mosquitto](https://mosquitto.org/) - MQTT broker
- [TailwindCSS](https://tailwindcss.com/) - CSS framework
- [Recharts](https://recharts.org/) - Chart library

---

**ZiLink IoT Platform** - Connecting the Internet of Things 🌐
