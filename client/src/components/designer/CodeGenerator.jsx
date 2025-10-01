"use client";

import { useState, useRef, useEffect } from "react";
import { Download, Copy, Check, Eye, X, ArrowUp, ArrowDown } from "lucide-react";

const CodeGenerator = ({ shapes, devices, defaultDeviceId, compact = false }) => {
	const [generatedCode, setGeneratedCode] = useState("");
	const [isGenerating, setIsGenerating] = useState(false);
	const [copied, setCopied] = useState(false);
	const [showPreview, setShowPreview] = useState(false);
	const scrollRef = useRef(null);

	const generateESP32Code = () => {
		setIsGenerating(true);

		// Collect all unique device IDs and sensor types
		const deviceSensors = new Map();
		const deviceButtons = new Map();

		shapes.forEach((shape) => {
			if (shape.deviceId && shape.widgetKind) {
				if (!deviceSensors.has(shape.deviceId)) {
					deviceSensors.set(shape.deviceId, new Set());
					deviceButtons.set(shape.deviceId, new Set());
				}

				if (shape.widgetKind === "button") {
					deviceButtons.get(shape.deviceId).add(shape);
				} else {
					deviceSensors.get(shape.deviceId).add(shape.widgetKind);
				}
			}
		});

		// Generate code for each device
		let code = `/*
 * ZiLink ESP32 Code Generated from Designer
 * Generated on: ${new Date().toLocaleString()}
 * 
 * This code was automatically generated based on your Designer dashboard.
 * Modify the hardware connections and WiFi settings as needed.
 */

#include <ZiLinkEsp32.h>
#include <WiFi.h>
#include <ArduinoJson.h>
`;

		// Add sensor libraries based on detected sensors
		const allSensors = new Set();
		deviceSensors.forEach((sensors) => {
			sensors.forEach((sensor) => allSensors.add(sensor));
		});

		if (allSensors.has("temperature") || allSensors.has("humidity")) {
			code += `#include <DHT.h>
`;
		}
		if (allSensors.has("pressure")) {
			code += `#include <Wire.h>
#include <Adafruit_Sensor.h>
#include <Adafruit_BME280.h>
`;
		}

		// WiFi and ZiLink configuration
		code += `
// WiFi Configuration - CHANGE THESE TO YOUR VALUES
const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";

// ZiLink Configuration - CHANGE THESE TO YOUR VALUES
const char* deviceId = "ESP32_DESIGNER_GENERATED";
const char* serverHost = "api.ziji.world";  // ZiLink API server
const int serverPort = 443;  // HTTPS port
const char* deviceToken = "YOUR_DEVICE_TOKEN";  // Get this from your device registration

// Sensor Pins - MODIFY THESE BASED ON YOUR HARDWARE
`;

		// Generate pin definitions
		const pinMap = {
			temperature: "DHT_PIN",
			humidity: "DHT_PIN",
			pressure: "BME280_ADDR",
			light: "LDR_PIN",
			sound: "MIC_PIN",
			motion: "PIR_PIN",
			button: "BUTTON_PIN",
		};

		const usedPins = new Set();
		allSensors.forEach((sensor) => {
			const pin = pinMap[sensor];
			if (pin && !usedPins.has(pin)) {
				usedPins.add(pin);
				if (pin === "DHT_PIN") {
					code += `#define DHT_PIN 4
#define DHT_TYPE DHT22
`;
				} else if (pin === "BME280_ADDR") {
					code += `#define BME280_ADDR 0x76
`;
				} else if (pin === "LDR_PIN") {
					code += `#define LDR_PIN A0
`;
				} else if (pin === "MIC_PIN") {
					code += `#define MIC_PIN A1
`;
				} else if (pin === "PIR_PIN") {
					code += `#define PIR_PIN 2
`;
				} else if (pin === "BUTTON_PIN") {
					code += `#define BUTTON_PIN 0
#define LED_PIN 5
`;
				}
			}
		});

		// Initialize sensors
		code += `
// Initialize sensors
`;
		if (allSensors.has("temperature") || allSensors.has("humidity")) {
			code += `DHT dht(DHT_PIN, DHT_TYPE);
`;
		}
		if (allSensors.has("pressure")) {
			code += `Adafruit_BME280 bme;
`;
		}
		code += `ZiLinkEsp32 zilink;

// Sensor data structure
struct SensorData {
`;

		// Add sensor data fields
		if (allSensors.has("temperature")) {
			code += `  float temperature = 0.0;
`;
		}
		if (allSensors.has("humidity")) {
			code += `  float humidity = 0.0;
`;
		}
		if (allSensors.has("pressure")) {
			code += `  float pressure = 0.0;
`;
		}
		if (allSensors.has("light")) {
			code += `  float light = 0.0;
`;
		}
		if (allSensors.has("sound")) {
			code += `  float sound = 0.0;
`;
		}
		if (allSensors.has("motion")) {
			code += `  bool motion = false;
`;
		}
		if (deviceButtons.size > 0) {
			code += `  bool buttonPressed = false;
`;
		}
		code += `  unsigned long lastUpdate = 0;
};

SensorData sensorData;
`;

		// Add button state tracking if needed
		if (deviceButtons.size > 0) {
			code += `
// Button state tracking
bool lastButtonState = HIGH;
bool currentButtonState = HIGH;
unsigned long lastDebounceTime = 0;
unsigned long debounceDelay = 50;
`;
		}

		// Setup function
		code += `
void setup() {
  Serial.begin(115200);
  Serial.println("ZiLink ESP32 Designer Generated Code");
  
  // Initialize pins
`;
		if (allSensors.has("motion")) {
			code += `  pinMode(PIR_PIN, INPUT);
`;
		}
		if (deviceButtons.size > 0) {
			code += `  pinMode(BUTTON_PIN, INPUT_PULLUP);
  pinMode(LED_PIN, OUTPUT);
  digitalWrite(LED_PIN, LOW);
`;
		}

		code += `
  // Initialize sensors
`;
		if (allSensors.has("temperature") || allSensors.has("humidity")) {
			code += `  dht.begin();
`;
		}
		if (allSensors.has("pressure")) {
			code += `  if (!bme.begin(BME280_ADDR)) {
    Serial.println("Could not find BME280 sensor!");
  }
`;
		}

		code += `
  // Connect to WiFi
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(1000);
    Serial.println("Connecting to WiFi...");
  }
  Serial.println("WiFi connected!");
  Serial.print("IP address: ");
  Serial.println(WiFi.localIP());
  
  // Initialize ZiLink with WebSocket Secure connection
  zilink.setupWebSocket(serverHost, serverPort, "/ws", deviceId, deviceToken, true);  // true for secure WSS
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
  
  // Process ZiLink communication
  zilink.loop();
  
  // Small delay
  delay(1000);
}
`;

		// Update sensors function
		code += `
void updateSensors() {
  unsigned long currentTime = millis();
`;

		if (allSensors.has("temperature") || allSensors.has("humidity")) {
			code += `
  // Update temperature and humidity from DHT22
  float temp = dht.readTemperature();
  float hum = dht.readHumidity();
  
  if (!isnan(temp) && !isnan(hum)) {
`;
			if (allSensors.has("temperature")) {
				code += `    sensorData.temperature = temp;
`;
			}
			if (allSensors.has("humidity")) {
				code += `    sensorData.humidity = hum;
`;
			}
			code += `  }
`;
		}

		if (allSensors.has("pressure")) {
			code += `
  // Update pressure from BME280
  if (bme.begin(BME280_ADDR)) {
    sensorData.pressure = bme.readPressure() / 100.0; // Convert to hPa
  }
`;
		}

		if (allSensors.has("light")) {
			code += `
  // Update light sensor (LDR)
  int ldrValue = analogRead(LDR_PIN);
  sensorData.light = map(ldrValue, 0, 4095, 0, 1000); // Map to lux range
`;
		}

		if (allSensors.has("sound")) {
			code += `
  // Update sound sensor (Microphone)
  int micValue = analogRead(MIC_PIN);
  sensorData.sound = map(micValue, 0, 4095, 0, 120); // Map to dB range
`;
		}

		if (allSensors.has("motion")) {
			code += `
  // Update motion sensor (PIR)
  bool motionDetected = digitalRead(PIR_PIN) == HIGH;
  sensorData.motion = motionDetected;
`;
		}

		if (deviceButtons.size > 0) {
			code += `
  // Update button state
  int reading = digitalRead(BUTTON_PIN);
  if (reading != lastButtonState) {
    lastDebounceTime = currentTime;
  }
  
  if ((currentTime - lastDebounceTime) > debounceDelay) {
    if (reading != currentButtonState) {
      currentButtonState = reading;
      sensorData.buttonPressed = (currentButtonState == LOW);
      if (sensorData.buttonPressed) {
        Serial.println("Button pressed!");
        digitalWrite(LED_PIN, HIGH);
      } else {
        Serial.println("Button released!");
        digitalWrite(LED_PIN, LOW);
      }
    }
  }
  lastButtonState = reading;
`;
		}

		code += `
  sensorData.lastUpdate = currentTime;
}
`;

		// Send sensor data function
		code += `
void sendSensorData() {
  // Create JSON payload
  DynamicJsonDocument doc(1024);
  doc["deviceId"] = deviceId;
  doc["timestamp"] = millis();
  
  JsonArray sensorArray = doc.createNestedArray("sensorData");
`;

		if (allSensors.has("temperature")) {
			code += `
  // Add temperature data
  JsonObject tempObj = sensorArray.createNestedObject();
  tempObj["type"] = "temperature";
  tempObj["value"] = sensorData.temperature;
  tempObj["unit"] = "°C";
`;
		}

		if (allSensors.has("humidity")) {
			code += `
  // Add humidity data
  JsonObject humObj = sensorArray.createNestedObject();
  humObj["type"] = "humidity";
  humObj["value"] = sensorData.humidity;
  humObj["unit"] = "%";
`;
		}

		if (allSensors.has("pressure")) {
			code += `
  // Add pressure data
  JsonObject pressObj = sensorArray.createNestedObject();
  pressObj["type"] = "pressure";
  pressObj["value"] = sensorData.pressure;
  pressObj["unit"] = "hPa";
`;
		}

		if (allSensors.has("light")) {
			code += `
  // Add light data
  JsonObject lightObj = sensorArray.createNestedObject();
  lightObj["type"] = "light";
  lightObj["value"] = sensorData.light;
  lightObj["unit"] = "lx";
`;
		}

		if (allSensors.has("sound")) {
			code += `
  // Add sound data
  JsonObject soundObj = sensorArray.createNestedObject();
  soundObj["type"] = "sound";
  soundObj["value"] = sensorData.sound;
  soundObj["unit"] = "dB";
`;
		}

		if (allSensors.has("motion")) {
			code += `
  // Add motion data
  JsonObject motionObj = sensorArray.createNestedObject();
  motionObj["type"] = "motion";
  motionObj["value"] = sensorData.motion ? "true" : "false";
  motionObj["unit"] = "";
`;
		}

		if (deviceButtons.size > 0) {
			code += `
  // Add button data
  JsonObject buttonObj = sensorArray.createNestedObject();
  buttonObj["type"] = "button";
  buttonObj["value"] = sensorData.buttonPressed ? "pressed" : "released";
  buttonObj["unit"] = "";
`;
		}

		code += `
  // Send data via ZiLink WebSocket
  String jsonString;
  serializeJson(doc, jsonString);
  zilink.sendWebSocketData(jsonString);
  
  Serial.println("Sent sensor data:");
  Serial.println(jsonString);
}
`;

		// Send device info function
		code += `
void sendDeviceInfo() {
  DynamicJsonDocument doc(512);
  doc["deviceId"] = deviceId;
  doc["name"] = "ESP32 Designer Generated";
  doc["type"] = "sensor_node";
  doc["capabilities"] = "${Array.from(allSensors).join(",")}${deviceButtons.size > 0 ? ",button" : ""}";
  doc["status"] = "online";
  doc["timestamp"] = millis();
  
  String jsonString;
  serializeJson(doc, jsonString);
  zilink.sendWebSocketData(jsonString);
  
  Serial.println("Sent device info:");
  Serial.println(jsonString);
}
`;

		// Handle commands function
		if (deviceButtons.size > 0) {
			code += `
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
`;
		}

		setGeneratedCode(code);
		setIsGenerating(false);
	};

	const copyToClipboard = async () => {
		try {
			await navigator.clipboard.writeText(generatedCode);
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		} catch (err) {
			console.error("Failed to copy code:", err);
		}
	};

	const downloadCode = () => {
		const blob = new Blob([generatedCode], { type: "text/plain" });
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = "ESP32_Designer_Generated.ino";
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(url);
	};

	const scrollToTop = () => {
		if (scrollRef.current) {
			scrollRef.current.scrollTo({ top: 0, behavior: "smooth" });
		}
	};

	const scrollToBottom = () => {
		if (scrollRef.current) {
			scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
		}
	};

	// Prevent body scroll when modal is open and handle keyboard navigation
	useEffect(() => {
		if (showPreview) {
			// Prevent body scroll
			document.body.style.overflow = "hidden";
		} else {
			// Restore body scroll
			document.body.style.overflow = "unset";
		}

		const handleKeyDown = (e) => {
			if (!showPreview) return;

			if (e.key === "Home" && e.ctrlKey) {
				e.preventDefault();
				scrollToTop();
			} else if (e.key === "End" && e.ctrlKey) {
				e.preventDefault();
				scrollToBottom();
			}
		};

		document.addEventListener("keydown", handleKeyDown);
		return () => {
			document.removeEventListener("keydown", handleKeyDown);
			// Cleanup: restore body scroll
			document.body.style.overflow = "unset";
		};
	}, [showPreview]);

	if (compact) {
		return (
			<div className='space-y-3'>
				<button
					onClick={generateESP32Code}
					disabled={isGenerating || shapes.length === 0}
					className='w-full px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors text-sm'>
					{isGenerating ? "Generating..." : "Generate Code"}
				</button>

				{generatedCode && (
					<>
						<div className='flex space-x-1'>
							<button
								onClick={copyToClipboard}
								className='flex-1 px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700 transition-colors flex items-center justify-center text-xs'>
								{copied ?
									<Check className='w-3 h-3' />
								:	<Copy className='w-3 h-3' />}
							</button>
							<button
								onClick={() => setShowPreview(true)}
								className='flex-1 px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors flex items-center justify-center text-xs'>
								<Eye className='w-3 h-3' />
							</button>
							<button
								onClick={downloadCode}
								className='flex-1 px-2 py-1 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors flex items-center justify-center text-xs'>
								<Download className='w-3 h-3' />
							</button>
						</div>

						<div className='text-xs text-gray-600 dark:text-gray-400'>
							<p>{shapes.length} widgets</p>
							<p>{Array.from(new Set(shapes.map((s) => s.widgetKind).filter(Boolean))).join(", ")}</p>
						</div>
					</>
				)}

				{shapes.length === 0 && <p className='text-xs text-gray-500 dark:text-gray-400'>Add widgets first</p>}

				{/* Preview Modal for Compact Mode */}
				{showPreview && (
					<div
						className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4'
						onClick={(e) => {
							if (e.target === e.currentTarget) {
								setShowPreview(false);
							}
						}}>
						<div
							className='bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col'
							onClick={(e) => e.stopPropagation()}>
							<div className='flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700'>
								<h3 className='text-lg font-semibold text-gray-900 dark:text-white'>ESP32 Code Preview</h3>
								<button
									onClick={() => setShowPreview(false)}
									className='p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors'>
									<X className='w-5 h-5 text-gray-500 dark:text-gray-400' />
								</button>
							</div>

							<div className='flex-1 overflow-hidden relative'>
								<div
									ref={scrollRef}
									className='h-full overflow-y-auto overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-gray-100 dark:scrollbar-track-gray-800 hover:scrollbar-thumb-gray-400 dark:hover:scrollbar-thumb-gray-500 scroll-smooth'>
									<pre className='text-sm bg-gray-50 dark:bg-gray-900 p-4 font-mono leading-relaxed min-h-full'>
										<code className='text-gray-800 dark:text-gray-200 whitespace-pre'>{generatedCode}</code>
									</pre>
								</div>

								{/* Scroll controls */}
								<div className='absolute top-2 right-2 flex flex-col space-y-1'>
									<button
										onClick={scrollToTop}
										className='p-1 bg-black bg-opacity-50 text-white rounded hover:bg-opacity-70 transition-all'
										title='Scroll to top (Ctrl+Home)'>
										<ArrowUp className='w-3 h-3' />
									</button>
									<button
										onClick={scrollToBottom}
										className='p-1 bg-black bg-opacity-50 text-white rounded hover:bg-opacity-70 transition-all'
										title='Scroll to bottom (Ctrl+End)'>
										<ArrowDown className='w-3 h-3' />
									</button>
								</div>

								{/* Scroll indicator */}
								<div className='absolute bottom-2 left-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded opacity-75'>
									Use mouse wheel or Ctrl+Home/End to navigate
								</div>
							</div>

							<div className='flex items-center justify-between p-4 border-t border-gray-200 dark:border-gray-700'>
								<div className='text-sm text-gray-600 dark:text-gray-400'>
									{generatedCode.split("\n").length} lines • {generatedCode.length} characters
								</div>
								<div className='flex space-x-2'>
									<button
										onClick={copyToClipboard}
										className='px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center'>
										{copied ?
											<Check className='w-4 h-4 mr-2' />
										:	<Copy className='w-4 h-4 mr-2' />}
										{copied ? "Copied!" : "Copy"}
									</button>
									<button
										onClick={downloadCode}
										className='px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center'>
										<Download className='w-4 h-4 mr-2' />
										Download
									</button>
								</div>
							</div>
						</div>
					</div>
				)}
			</div>
		);
	}

	return (
		<div className='w-64 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 p-4'>
			<h3 className='text-lg font-semibold text-gray-900 dark:text-white mb-4'>Code Generator</h3>

			<div className='space-y-3'>
				<button
					onClick={generateESP32Code}
					disabled={isGenerating || shapes.length === 0}
					className='w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors'>
					{isGenerating ? "Generating..." : "Generate ESP32 Code"}
				</button>

				{generatedCode && (
					<>
						<div className='flex space-x-2'>
							<button
								onClick={copyToClipboard}
								className='flex-1 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center'>
								{copied ?
									<Check className='w-4 h-4' />
								:	<Copy className='w-4 h-4' />}
							</button>
							<button
								onClick={() => setShowPreview(true)}
								className='flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center'>
								<Eye className='w-4 h-4' />
							</button>
							<button
								onClick={downloadCode}
								className='flex-1 px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center'>
								<Download className='w-4 h-4' />
							</button>
						</div>

						<div className='text-xs text-gray-600 dark:text-gray-400'>
							<p>Generated code for {shapes.length} widgets</p>
							<p>Sensors: {Array.from(new Set(shapes.map((s) => s.widgetKind).filter(Boolean))).join(", ")}</p>
						</div>
					</>
				)}

				{shapes.length === 0 && <p className='text-sm text-gray-500 dark:text-gray-400'>Add widgets to generate ESP32 code</p>}
			</div>

			{generatedCode && (
				<div className='mt-4'>
					<h4 className='text-sm font-medium text-gray-900 dark:text-white mb-2'>Generated Code Preview:</h4>
					<pre className='text-xs bg-gray-100 dark:bg-gray-900 p-2 rounded overflow-auto max-h-32'>
						{generatedCode.substring(0, 500)}...
					</pre>
				</div>
			)}

			{/* Preview Modal */}
			{showPreview && (
				<div
					className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4'
					onClick={(e) => {
						if (e.target === e.currentTarget) {
							setShowPreview(false);
						}
					}}>
					<div
						className='bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col'
						onClick={(e) => e.stopPropagation()}>
						<div className='flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700'>
							<h3 className='text-lg font-semibold text-gray-900 dark:text-white'>ESP32 Code Preview</h3>
							<button
								onClick={() => setShowPreview(false)}
								className='p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors'>
								<X className='w-5 h-5 text-gray-500 dark:text-gray-400' />
							</button>
						</div>

						<div className='flex-1 overflow-hidden relative'>
							<div
								ref={scrollRef}
								className='h-full overflow-y-auto overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-gray-100 dark:scrollbar-track-gray-800 hover:scrollbar-thumb-gray-400 dark:hover:scrollbar-thumb-gray-500 scroll-smooth'>
								<pre className='text-sm bg-gray-50 dark:bg-gray-900 p-4 font-mono leading-relaxed min-h-full'>
									<code className='text-gray-800 dark:text-gray-200 whitespace-pre'>{generatedCode}</code>
								</pre>
							</div>

							{/* Scroll controls */}
							<div className='absolute top-2 right-2 flex flex-col space-y-1'>
								<button
									onClick={scrollToTop}
									className='p-1 bg-black bg-opacity-50 text-white rounded hover:bg-opacity-70 transition-all'
									title='Scroll to top (Ctrl+Home)'>
									<ArrowUp className='w-3 h-3' />
								</button>
								<button
									onClick={scrollToBottom}
									className='p-1 bg-black bg-opacity-50 text-white rounded hover:bg-opacity-70 transition-all'
									title='Scroll to bottom (Ctrl+End)'>
									<ArrowDown className='w-3 h-3' />
								</button>
							</div>

							{/* Scroll indicator */}
							<div className='absolute bottom-2 left-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded opacity-75'>
								Use mouse wheel or Ctrl+Home/End to navigate
							</div>
						</div>

						<div className='flex items-center justify-between p-4 border-t border-gray-200 dark:border-gray-700'>
							<div className='text-sm text-gray-600 dark:text-gray-400'>
								{generatedCode.split("\n").length} lines • {generatedCode.length} characters
							</div>
							<div className='flex space-x-2'>
								<button
									onClick={copyToClipboard}
									className='px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center'>
									{copied ?
										<Check className='w-4 h-4 mr-2' />
									:	<Copy className='w-4 h-4 mr-2' />}
									{copied ? "Copied!" : "Copy"}
								</button>
								<button
									onClick={downloadCode}
									className='px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center'>
									<Download className='w-4 h-4 mr-2' />
									Download
								</button>
							</div>
						</div>
					</div>
				</div>
			)}
		</div>
	);
};

export default CodeGenerator;
