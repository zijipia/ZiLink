/*
 * ZiLink ESP32 Designer Widgets Example
 * 
 * This example demonstrates how to connect ESP32 with various sensors
 * and send data to the Designer dashboard widgets.
 * 
 * Supported Widgets:
 * - Temperature (DHT22/BME280)
 * - Humidity (DHT22/BME280)
 * - Pressure (BME280)
 * - Light (LDR/TSL2561)
 * - Sound (Microphone)
 * - Motion (PIR sensor)
 * - Button (Physical button control)
 * 
 * Hardware Connections:
 * - DHT22: Pin 4 (Data)
 * - BME280: SDA=21, SCL=22 (I2C)
 * - LDR: Pin A0 (Analog)
 * - Microphone: Pin A1 (Analog)
 * - PIR: Pin 2 (Digital)
 * - Button: Pin 0 (Digital)
 * - LED: Pin 5 (Digital, for button feedback)
 * 
 * Author: ZiLink Team
 * Version: 1.0
 */

#include <ZiLinkEsp32.h>
#include <WiFi.h>
#include <ArduinoJson.h>
#include <DHT.h>
#include <Wire.h>
#include <Adafruit_Sensor.h>
#include <Adafruit_BME280.h>

// WiFi Configuration
const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";

// ZiLink Configuration
const char* deviceId = "ESP32_DESIGNER_DEMO";
const char* serverHost = "YOUR_SERVER_HOST"; // e.g., "192.168.1.100"
const int serverPort = 8080;

// Sensor Pins
#define DHT_PIN 4
#define LDR_PIN A0
#define MIC_PIN A1
#define PIR_PIN 2
#define BUTTON_PIN 0
#define LED_PIN 5

// Sensor Types
#define DHT_TYPE DHT22

// Initialize sensors
DHT dht(DHT_PIN, DHT_TYPE);
Adafruit_BME280 bme;
ZiLinkEsp32 zilink(deviceId, serverHost, serverPort);

// Sensor data structure
struct SensorData {
  float temperature = 0.0;
  float humidity = 0.0;
  float pressure = 0.0;
  float light = 0.0;
  float sound = 0.0;
  bool motion = false;
  bool buttonPressed = false;
  unsigned long lastUpdate = 0;
};

SensorData sensorData;

// Button state tracking
bool lastButtonState = HIGH;
bool currentButtonState = HIGH;
unsigned long lastDebounceTime = 0;
unsigned long debounceDelay = 50;

// Motion sensor state
bool lastMotionState = false;
unsigned long motionStartTime = 0;
const unsigned long motionTimeout = 5000; // 5 seconds

void setup() {
  Serial.begin(115200);
  Serial.println("ZiLink ESP32 Designer Widgets Demo");
  
  // Initialize pins
  pinMode(PIR_PIN, INPUT);
  pinMode(BUTTON_PIN, INPUT_PULLUP);
  pinMode(LED_PIN, OUTPUT);
  digitalWrite(LED_PIN, LOW);
  
  // Initialize sensors
  dht.begin();
  
  if (!bme.begin(0x76)) {
    Serial.println("Could not find BME280 sensor!");
  }
  
  // Connect to WiFi
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(1000);
    Serial.println("Connecting to WiFi...");
  }
  Serial.println("WiFi connected!");
  Serial.print("IP address: ");
  Serial.println(WiFi.localIP());
  
  // Initialize ZiLink
  zilink.begin();
  Serial.println("ZiLink initialized!");
  
  // Send initial device info
  sendDeviceInfo();
}

void loop() {
  // Update sensor data
  updateSensors();
  
  // Send data to server
  sendSensorData();
  
  // Handle button commands
  handleCommands();
  
  // Small delay
  delay(1000);
}

void updateSensors() {
  unsigned long currentTime = millis();
  
  // Update temperature and humidity from DHT22
  float temp = dht.readTemperature();
  float hum = dht.readHumidity();
  
  if (!isnan(temp) && !isnan(hum)) {
    sensorData.temperature = temp;
    sensorData.humidity = hum;
  }
  
  // Update pressure from BME280
  if (bme.begin(0x76)) {
    sensorData.pressure = bme.readPressure() / 100.0; // Convert to hPa
  }
  
  // Update light sensor (LDR)
  int ldrValue = analogRead(LDR_PIN);
  sensorData.light = map(ldrValue, 0, 4095, 0, 1000); // Map to lux range
  
  // Update sound sensor (Microphone)
  int micValue = analogRead(MIC_PIN);
  sensorData.sound = map(micValue, 0, 4095, 0, 120); // Map to dB range
  
  // Update motion sensor (PIR)
  bool motionDetected = digitalRead(PIR_PIN) == HIGH;
  if (motionDetected && !lastMotionState) {
    sensorData.motion = true;
    motionStartTime = currentTime;
  } else if (motionDetected && (currentTime - motionStartTime) > motionTimeout) {
    sensorData.motion = false;
  }
  lastMotionState = motionDetected;
  
  // Update button state
  int reading = digitalRead(BUTTON_PIN);
  if (reading != lastButtonState) {
    lastDebounceTime = currentTime;
  }
  
  if ((currentTime - lastDebounceTime) > debounceDelay) {
    if (reading != currentButtonState) {
      currentButtonState = reading;
      if (currentButtonState == LOW) {
        sensorData.buttonPressed = true;
        digitalWrite(LED_PIN, HIGH);
        Serial.println("Button pressed!");
      } else {
        sensorData.buttonPressed = false;
        digitalWrite(LED_PIN, LOW);
        Serial.println("Button released!");
      }
    }
  }
  lastButtonState = reading;
  
  sensorData.lastUpdate = currentTime;
}

void sendSensorData() {
  // Create JSON payload
  DynamicJsonDocument doc(1024);
  doc["deviceId"] = deviceId;
  doc["timestamp"] = millis();
  
  JsonArray sensorArray = doc.createNestedArray("sensorData");
  
  // Add temperature data
  JsonObject tempObj = sensorArray.createNestedObject();
  tempObj["type"] = "temperature";
  tempObj["value"] = sensorData.temperature;
  tempObj["unit"] = "°C";
  
  // Add humidity data
  JsonObject humObj = sensorArray.createNestedObject();
  humObj["type"] = "humidity";
  humObj["value"] = sensorData.humidity;
  humObj["unit"] = "%";
  
  // Add pressure data
  JsonObject pressObj = sensorArray.createNestedObject();
  pressObj["type"] = "pressure";
  pressObj["value"] = sensorData.pressure;
  pressObj["unit"] = "hPa";
  
  // Add light data
  JsonObject lightObj = sensorArray.createNestedObject();
  lightObj["type"] = "light";
  lightObj["value"] = sensorData.light;
  lightObj["unit"] = "lx";
  
  // Add sound data
  JsonObject soundObj = sensorArray.createNestedObject();
  soundObj["type"] = "sound";
  soundObj["value"] = sensorData.sound;
  soundObj["unit"] = "dB";
  
  // Add motion data
  JsonObject motionObj = sensorArray.createNestedObject();
  motionObj["type"] = "motion";
  motionObj["value"] = sensorData.motion ? "true" : "false";
  motionObj["unit"] = "";
  
  // Send data via ZiLink
  String jsonString;
  serializeJson(doc, jsonString);
  zilink.sendData(jsonString);
  
  // Print to serial for debugging
  Serial.println("Sent sensor data:");
  Serial.println(jsonString);
}

void sendDeviceInfo() {
  DynamicJsonDocument doc(512);
  doc["deviceId"] = deviceId;
  doc["name"] = "ESP32 Designer Demo";
  doc["type"] = "sensor_node";
  doc["capabilities"] = "temperature,humidity,pressure,light,sound,motion,button";
  doc["status"] = "online";
  doc["timestamp"] = millis();
  
  String jsonString;
  serializeJson(doc, jsonString);
  zilink.sendData(jsonString);
  
  Serial.println("Sent device info:");
  Serial.println(jsonString);
}

void handleCommands() {
  // Check for incoming commands
  if (zilink.hasCommand()) {
    String command = zilink.getCommand();
    Serial.println("Received command: " + command);
    
    DynamicJsonDocument doc(512);
    deserializeJson(doc, command);
    
    String commandType = doc["type"];
    String action = doc["action"];
    
    if (commandType == "ui_button") {
      if (action == "press") {
        // Simulate button press
        digitalWrite(LED_PIN, HIGH);
        delay(200);
        digitalWrite(LED_PIN, LOW);
        Serial.println("Button command executed!");
      } else if (action == "toggle") {
        bool state = doc["state"];
        digitalWrite(LED_PIN, state ? HIGH : LOW);
        Serial.println("Button toggled to: " + String(state));
      }
    }
  }
}

// Additional utility functions
void printSensorData() {
  Serial.println("=== Sensor Data ===");
  Serial.println("Temperature: " + String(sensorData.temperature) + "°C");
  Serial.println("Humidity: " + String(sensorData.humidity) + "%");
  Serial.println("Pressure: " + String(sensorData.pressure) + "hPa");
  Serial.println("Light: " + String(sensorData.light) + "lx");
  Serial.println("Sound: " + String(sensorData.sound) + "dB");
  Serial.println("Motion: " + String(sensorData.motion ? "Detected" : "None"));
  Serial.println("Button: " + String(sensorData.buttonPressed ? "Pressed" : "Released"));
  Serial.println("==================");
}
