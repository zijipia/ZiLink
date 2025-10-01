/*
 * ZiLink ESP32 Simple Designer Example
 * 
 * A simplified example for beginners to connect ESP32 with Designer dashboard.
 * This example uses only basic sensors that are commonly available.
 * 
 * Hardware Required:
 * - ESP32 Development Board
 * - DHT22 Temperature & Humidity Sensor (Pin 4)
 * - LED (Pin 5)
 * - Push Button (Pin 0)
 * - Resistor 10kΩ for DHT22
 * - Resistor 220Ω for LED
 * 
 * Connections:
 * DHT22:
 *   - VCC to 3.3V
 *   - GND to GND
 *   - Data to Pin 4
 *   - Connect 10kΩ resistor between VCC and Data
 * 
 * LED:
 *   - Anode to Pin 5
 *   - Cathode to GND through 220Ω resistor
 * 
 * Button:
 *   - One terminal to Pin 0
 *   - Other terminal to GND
 *   - Enable internal pullup in code
 * 
 * Author: ZiLink Team
 * Version: 1.0
 */

#include <ZiLinkEsp32.h>
#include <WiFi.h>
#include <ArduinoJson.h>
#include <DHT.h>

// WiFi Configuration - CHANGE THESE TO YOUR VALUES
const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";

// ZiLink Configuration - CHANGE THESE TO YOUR VALUES
const char* deviceId = "ESP32_SIMPLE_DEMO";
const char* serverHost = "YOUR_SERVER_HOST"; // e.g., "192.168.1.100" or "yourdomain.com"
const int serverPort = 8080;

// Pin Definitions
#define DHT_PIN 4
#define LED_PIN 5
#define BUTTON_PIN 0

// Sensor Type
#define DHT_TYPE DHT22

// Initialize components
DHT dht(DHT_PIN, DHT_TYPE);
ZiLinkEsp32 zilink(deviceId, serverHost, serverPort);

// Variables
float temperature = 0.0;
float humidity = 0.0;
bool buttonPressed = false;
bool lastButtonState = HIGH;
unsigned long lastDebounceTime = 0;
const unsigned long debounceDelay = 50;

void setup() {
  // Initialize Serial communication
  Serial.begin(115200);
  Serial.println("ZiLink ESP32 Simple Designer Demo");
  Serial.println("================================");
  
  // Initialize pins
  pinMode(LED_PIN, OUTPUT);
  pinMode(BUTTON_PIN, INPUT_PULLUP);
  digitalWrite(LED_PIN, LOW);
  
  // Initialize DHT sensor
  dht.begin();
  Serial.println("DHT22 sensor initialized");
  
  // Connect to WiFi
  Serial.print("Connecting to WiFi: ");
  Serial.println(ssid);
  WiFi.begin(ssid, password);
  
  while (WiFi.status() != WL_CONNECTED) {
    delay(1000);
    Serial.print(".");
  }
  
  Serial.println();
  Serial.println("WiFi connected successfully!");
  Serial.print("IP address: ");
  Serial.println(WiFi.localIP());
  
  // Initialize ZiLink
  zilink.begin();
  Serial.println("ZiLink initialized successfully!");
  
  // Send device information
  sendDeviceInfo();
  
  Serial.println("Setup complete! Starting main loop...");
  Serial.println();
}

void loop() {
  // Read sensor data
  readSensors();
  
  // Send data to Designer dashboard
  sendDataToDesigner();
  
  // Handle incoming commands
  handleCommands();
  
  // Print data to Serial for debugging
  printSensorData();
  
  // Wait before next reading
  delay(2000); // Send data every 2 seconds
}

void readSensors() {
  // Read temperature and humidity
  float temp = dht.readTemperature();
  float hum = dht.readHumidity();
  
  // Check if readings are valid
  if (!isnan(temp) && !isnan(hum)) {
    temperature = temp;
    humidity = hum;
  } else {
    Serial.println("Failed to read from DHT sensor!");
  }
  
  // Read button state with debouncing
  int reading = digitalRead(BUTTON_PIN);
  
  if (reading != lastButtonState) {
    lastDebounceTime = millis();
  }
  
  if ((millis() - lastDebounceTime) > debounceDelay) {
    if (reading != buttonPressed) {
      buttonPressed = (reading == LOW);
      if (buttonPressed) {
        Serial.println("Button pressed!");
        digitalWrite(LED_PIN, HIGH); // Turn on LED when button is pressed
      } else {
        Serial.println("Button released!");
        digitalWrite(LED_PIN, LOW); // Turn off LED when button is released
      }
    }
  }
  
  lastButtonState = reading;
}

void sendDataToDesigner() {
  // Create JSON document
  DynamicJsonDocument doc(1024);
  
  // Add device information
  doc["deviceId"] = deviceId;
  doc["timestamp"] = millis();
  
  // Create sensor data array
  JsonArray sensorArray = doc.createNestedArray("sensorData");
  
  // Add temperature data
  JsonObject tempData = sensorArray.createNestedObject();
  tempData["type"] = "temperature";
  tempData["value"] = temperature;
  tempData["unit"] = "°C";
  
  // Add humidity data
  JsonObject humData = sensorArray.createNestedObject();
  humData["type"] = "humidity";
  humData["value"] = humidity;
  humData["unit"] = "%";
  
  // Add button data
  JsonObject buttonData = sensorArray.createNestedObject();
  buttonData["type"] = "button";
  buttonData["value"] = buttonPressed ? "pressed" : "released";
  buttonData["unit"] = "";
  
  // Convert to string and send
  String jsonString;
  serializeJson(doc, jsonString);
  
  // Send via ZiLink
  zilink.sendData(jsonString);
  
  Serial.println("Data sent to Designer:");
  Serial.println(jsonString);
}

void sendDeviceInfo() {
  DynamicJsonDocument doc(512);
  doc["deviceId"] = deviceId;
  doc["name"] = "ESP32 Simple Demo";
  doc["type"] = "sensor_node";
  doc["capabilities"] = "temperature,humidity,button";
  doc["status"] = "online";
  doc["timestamp"] = millis();
  
  String jsonString;
  serializeJson(doc, jsonString);
  zilink.sendData(jsonString);
  
  Serial.println("Device info sent:");
  Serial.println(jsonString);
}

void handleCommands() {
  // Check if there are any commands from the Designer dashboard
  if (zilink.hasCommand()) {
    String command = zilink.getCommand();
    Serial.println("Received command: " + command);
    
    // Parse the command
    DynamicJsonDocument doc(512);
    deserializeJson(doc, command);
    
    String commandType = doc["type"];
    String action = doc["action"];
    
    // Handle button commands
    if (commandType == "ui_button") {
      if (action == "press") {
        // Simulate button press by blinking LED
        digitalWrite(LED_PIN, HIGH);
        delay(500);
        digitalWrite(LED_PIN, LOW);
        Serial.println("Button command executed - LED blinked!");
      } else if (action == "toggle") {
        bool state = doc["state"];
        digitalWrite(LED_PIN, state ? HIGH : LOW);
        Serial.println("LED toggled to: " + String(state ? "ON" : "OFF"));
      }
    }
  }
}

void printSensorData() {
  Serial.println("=== Current Sensor Data ===");
  Serial.print("Temperature: ");
  Serial.print(temperature);
  Serial.println(" °C");
  
  Serial.print("Humidity: ");
  Serial.print(humidity);
  Serial.println(" %");
  
  Serial.print("Button: ");
  Serial.println(buttonPressed ? "PRESSED" : "RELEASED");
  
  Serial.print("LED: ");
  Serial.println(digitalRead(LED_PIN) ? "ON" : "OFF");
  
  Serial.println("==========================");
  Serial.println();
}

// Additional utility functions
void blinkLED(int times, int delayMs) {
  for (int i = 0; i < times; i++) {
    digitalWrite(LED_PIN, HIGH);
    delay(delayMs);
    digitalWrite(LED_PIN, LOW);
    delay(delayMs);
  }
}

void indicateConnection() {
  // Blink LED 3 times to indicate successful connection
  blinkLED(3, 200);
}
