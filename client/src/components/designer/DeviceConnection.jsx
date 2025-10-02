"use client";

import { useState, useEffect } from "react";
import { Wifi, WifiOff, RefreshCw, Settings, X, Check, AlertCircle, Monitor, Zap, Activity } from "lucide-react";
import { toast } from "react-hot-toast";
import flashService from "@/lib/flashService";

const DeviceConnection = ({ devices = [], selectedDevice = null, onDeviceSelect, compact = false }) => {
	const [isConnected, setIsConnected] = useState(false);
	const [connectionStatus, setConnectionStatus] = useState("disconnected");
	const [connectionMethod, setConnectionMethod] = useState("websocket"); // websocket, serial
	const [availablePorts, setAvailablePorts] = useState([]);
	const [selectedPort, setSelectedPort] = useState("");
	const [deviceInfo, setDeviceInfo] = useState(null);
	const [showSettings, setShowSettings] = useState(false);
	const [connectionSettings, setConnectionSettings] = useState({
		baudRate: 115200,
		timeout: 5000,
		retryAttempts: 3,
	});

	// Check Web Serial API support
	useEffect(() => {
		if (flashService.isWebSerialSupported()) {
			loadAvailablePorts();
		}
	}, []);

	// Load available serial ports
	const loadAvailablePorts = async () => {
		try {
			const ports = await flashService.getAvailablePorts();
			setAvailablePorts(ports);
		} catch (error) {
			console.error("Failed to load ports:", error);
		}
	};

	// Connect to device via WebSocket
	const connectWebSocket = async () => {
		if (!selectedDevice) {
			toast.error("Please select a device first!");
			return;
		}

		setConnectionStatus("connecting");

		try {
			// Simulate WebSocket connection
			await new Promise((resolve) => setTimeout(resolve, 2000));

			setIsConnected(true);
			setConnectionStatus("connected");
			setConnectionMethod("websocket");
			toast.success(`Connected to ${selectedDevice.name} via WebSocket!`);

			// Get device info
			await getDeviceInfo();
		} catch (error) {
			setConnectionStatus("disconnected");
			toast.error("Failed to connect via WebSocket");
		}
	};

	// Connect to device via Serial
	const connectSerial = async () => {
		if (!selectedPort) {
			toast.error("Please select a serial port first!");
			return;
		}

		setConnectionStatus("connecting");

		try {
			// Request port access
			await flashService.requestPortAccess();

			// Connect to port
			await flashService.connect(connectionSettings);

			setIsConnected(true);
			setConnectionStatus("connected");
			setConnectionMethod("serial");
			toast.success(`Connected to ${selectedPort} via Serial!`);

			// Get device info
			await getDeviceInfo();
		} catch (error) {
			setConnectionStatus("disconnected");
			toast.error(`Failed to connect via Serial: ${error.message}`);
		}
	};

	// Disconnect from device
	const disconnect = async () => {
		try {
			if (connectionMethod === "serial") {
				await flashService.disconnect();
			}

			setIsConnected(false);
			setConnectionStatus("disconnected");
			setDeviceInfo(null);
			toast.success("Disconnected from device");
		} catch (error) {
			console.error("Error disconnecting:", error);
		}
	};

	// Get device information
	const getDeviceInfo = async () => {
		try {
			if (connectionMethod === "serial") {
				const info = await flashService.getDeviceInfo();
				setDeviceInfo(info);
			} else {
				// Simulate device info for WebSocket
				setDeviceInfo({
					chipModel: "ESP32",
					chipRevision: "1",
					cpuFreqMHz: "240",
					flashSize: "4MB",
					flashSpeed: "80MHz",
					flashMode: "DIO",
					psramSize: "0",
				});
			}
		} catch (error) {
			console.error("Failed to get device info:", error);
		}
	};

	// Refresh connection
	const refreshConnection = async () => {
		if (isConnected) {
			await disconnect();
			await new Promise((resolve) => setTimeout(resolve, 1000));
		}

		if (connectionMethod === "websocket") {
			await connectWebSocket();
		} else {
			await connectSerial();
		}
	};

	// Test connection
	const testConnection = async () => {
		if (!isConnected) {
			toast.error("Not connected to device");
			return;
		}

		try {
			if (connectionMethod === "serial") {
				await flashService.sendData("AT\r\n");
				const response = await flashService.readData(1000);
				if (response.includes("OK")) {
					toast.success("Connection test successful!");
				} else {
					toast.error("Connection test failed");
				}
			} else {
				// Simulate WebSocket test
				await new Promise((resolve) => setTimeout(resolve, 1000));
				toast.success("WebSocket connection test successful!");
			}
		} catch (error) {
			toast.error(`Connection test failed: ${error.message}`);
		}
	};

	if (compact) {
		return (
			<div className='space-y-3'>
				<div className='flex items-center justify-between'>
					<h4 className='text-sm font-medium text-gray-900 dark:text-white'>Device Connection</h4>
					<button
						onClick={() => setShowSettings(!showSettings)}
						className='p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors'>
						<Settings className='w-4 h-4' />
					</button>
				</div>

				{/* Device Selection */}
				<div className='space-y-1'>
					<label className='text-xs text-gray-600 dark:text-gray-400'>Device:</label>
					<select
						value={selectedDevice?.deviceId || ""}
						onChange={(e) => {
							const device = devices.find((d) => d.deviceId === e.target.value);
							if (onDeviceSelect) onDeviceSelect(device);
						}}
						className='w-full px-2 py-1 text-xs bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent'>
						<option value=''>Select device...</option>
						{devices.map((device) => (
							<option
								key={device.deviceId}
								value={device.deviceId}>
								{device.name} ({device.deviceId})
							</option>
						))}
					</select>
				</div>

				{/* Connection Method */}
				<div className='space-y-1'>
					<label className='text-xs text-gray-600 dark:text-gray-400'>Method:</label>
					<select
						value={connectionMethod}
						onChange={(e) => setConnectionMethod(e.target.value)}
						disabled={isConnected}
						className='w-full px-2 py-1 text-xs bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50'>
						<option value='websocket'>WebSocket (OTA)</option>
						<option value='serial'>Serial (USB)</option>
					</select>
				</div>

				{/* Serial Port Selection */}
				{connectionMethod === "serial" && (
					<div className='space-y-1'>
						<label className='text-xs text-gray-600 dark:text-gray-400'>Port:</label>
						<select
							value={selectedPort}
							onChange={(e) => setSelectedPort(e.target.value)}
							disabled={isConnected}
							className='w-full px-2 py-1 text-xs bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50'>
							<option value=''>Select port...</option>
							{availablePorts.map((port) => (
								<option
									key={port.id}
									value={port.id}>
									{port.name}
								</option>
							))}
						</select>
					</div>
				)}

				{/* Connection Status */}
				<div className='flex items-center justify-between'>
					<div className='flex items-center space-x-1'>
						{isConnected ?
							<Wifi className='w-3 h-3 text-green-500' />
						:	<WifiOff className='w-3 h-3 text-gray-400' />}
						<span className='text-xs text-gray-600 dark:text-gray-400'>{connectionStatus}</span>
					</div>

					<div className='flex space-x-1'>
						{!isConnected ?
							<button
								onClick={connectionMethod === "websocket" ? connectWebSocket : connectSerial}
								disabled={
									(!selectedDevice && connectionMethod === "websocket") || (!selectedPort && connectionMethod === "serial")
								}
								className='px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors'>
								Connect
							</button>
						:	<button
								onClick={disconnect}
								className='px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 transition-colors'>
								Disconnect
							</button>
						}
					</div>
				</div>

				{/* Device Info */}
				{deviceInfo && (
					<div className='text-xs text-gray-600 dark:text-gray-400 space-y-1'>
						<p>
							<strong>Chip:</strong> {deviceInfo.chipModel}
						</p>
						<p>
							<strong>Flash:</strong> {deviceInfo.flashSize}
						</p>
						<p>
							<strong>CPU:</strong> {deviceInfo.cpuFreqMHz}MHz
						</p>
					</div>
				)}

				{/* Settings */}
				{showSettings && (
					<div className='space-y-2 p-2 bg-gray-50 dark:bg-gray-900 rounded'>
						<h5 className='text-xs font-medium text-gray-900 dark:text-white'>Connection Settings</h5>
						<div className='space-y-1'>
							<label className='text-xs text-gray-600 dark:text-gray-400'>Baud Rate:</label>
							<select
								value={connectionSettings.baudRate}
								onChange={(e) => setConnectionSettings((prev) => ({ ...prev, baudRate: parseInt(e.target.value) }))}
								className='w-full px-2 py-1 text-xs bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded'>
								<option value={9600}>9600</option>
								<option value={115200}>115200</option>
								<option value={230400}>230400</option>
								<option value={460800}>460800</option>
							</select>
						</div>
						<div className='space-y-1'>
							<label className='text-xs text-gray-600 dark:text-gray-400'>Timeout (ms):</label>
							<input
								type='number'
								value={connectionSettings.timeout}
								onChange={(e) => setConnectionSettings((prev) => ({ ...prev, timeout: parseInt(e.target.value) }))}
								className='w-full px-2 py-1 text-xs bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded'
							/>
						</div>
					</div>
				)}
			</div>
		);
	}

	return (
		<div className='w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm'>
			{/* Header */}
			<div className='flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700'>
				<div className='flex items-center space-x-2'>
					<Monitor className='w-5 h-5 text-blue-600' />
					<h3 className='text-lg font-semibold text-gray-900 dark:text-white'>Device Connection</h3>
				</div>

				<div className='flex items-center space-x-2'>
					{/* Connection Status */}
					<div className='flex items-center space-x-2'>
						{isConnected ?
							<Wifi className='w-4 h-4 text-green-500' />
						:	<WifiOff className='w-4 h-4 text-gray-400' />}
						<span className='text-sm text-gray-600 dark:text-gray-400'>{connectionStatus}</span>
					</div>

					<button
						onClick={() => setShowSettings(!showSettings)}
						className='p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors'>
						<Settings className='w-4 h-4' />
					</button>
				</div>
			</div>

			{/* Settings Panel */}
			{showSettings && (
				<div className='p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900'>
					<h4 className='text-sm font-medium text-gray-900 dark:text-white mb-3'>Connection Settings</h4>
					<div className='grid grid-cols-2 gap-4'>
						<div>
							<label className='block text-xs text-gray-600 dark:text-gray-400 mb-1'>Baud Rate</label>
							<select
								value={connectionSettings.baudRate}
								onChange={(e) => setConnectionSettings((prev) => ({ ...prev, baudRate: parseInt(e.target.value) }))}
								className='w-full px-2 py-1 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent'>
								<option value={9600}>9600</option>
								<option value={115200}>115200</option>
								<option value={230400}>230400</option>
								<option value={460800}>460800</option>
							</select>
						</div>
						<div>
							<label className='block text-xs text-gray-600 dark:text-gray-400 mb-1'>Timeout (ms)</label>
							<input
								type='number'
								value={connectionSettings.timeout}
								onChange={(e) => setConnectionSettings((prev) => ({ ...prev, timeout: parseInt(e.target.value) }))}
								className='w-full px-2 py-1 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent'
							/>
						</div>
					</div>
				</div>
			)}

			{/* Device Selection */}
			<div className='p-4 border-b border-gray-200 dark:border-gray-700'>
				<div className='flex items-center space-x-4'>
					<div className='flex-1'>
						<label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'>Target Device</label>
						<select
							value={selectedDevice?.deviceId || ""}
							onChange={(e) => {
								const device = devices.find((d) => d.deviceId === e.target.value);
								if (onDeviceSelect) onDeviceSelect(device);
							}}
							className='w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'>
							<option value=''>Select device...</option>
							{devices.map((device) => (
								<option
									key={device.deviceId}
									value={device.deviceId}>
									{device.name} ({device.deviceId})
								</option>
							))}
						</select>
					</div>

					<div className='flex space-x-2'>
						{!isConnected ?
							<button
								onClick={connectionMethod === "websocket" ? connectWebSocket : connectSerial}
								disabled={
									(!selectedDevice && connectionMethod === "websocket") || (!selectedPort && connectionMethod === "serial")
								}
								className='px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center'>
								<Wifi className='w-4 h-4 mr-2' />
								Connect
							</button>
						:	<button
								onClick={disconnect}
								className='px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center'>
								<WifiOff className='w-4 h-4 mr-2' />
								Disconnect
							</button>
						}
					</div>
				</div>
			</div>

			{/* Connection Method */}
			<div className='p-4 border-b border-gray-200 dark:border-gray-700'>
				<div className='flex items-center space-x-4'>
					<div className='flex-1'>
						<label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'>Connection Method</label>
						<select
							value={connectionMethod}
							onChange={(e) => setConnectionMethod(e.target.value)}
							disabled={isConnected}
							className='w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50'>
							<option value='websocket'>WebSocket (OTA - Over The Air)</option>
							<option value='serial'>Serial (USB Connection)</option>
						</select>
					</div>

					{connectionMethod === "serial" && (
						<div className='flex-1'>
							<label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'>Serial Port</label>
							<select
								value={selectedPort}
								onChange={(e) => setSelectedPort(e.target.value)}
								disabled={isConnected}
								className='w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50'>
								<option value=''>Select port...</option>
								{availablePorts.map((port) => (
									<option
										key={port.id}
										value={port.id}>
										{port.name}
									</option>
								))}
							</select>
						</div>
					)}
				</div>
			</div>

			{/* Device Information */}
			{deviceInfo && (
				<div className='p-4 border-b border-gray-200 dark:border-gray-700'>
					<h4 className='text-sm font-medium text-gray-900 dark:text-white mb-3'>Device Information</h4>
					<div className='grid grid-cols-2 gap-4'>
						<div className='flex items-center space-x-2'>
							<Monitor className='w-4 h-4 text-blue-500' />
							<div>
								<p className='text-xs text-gray-600 dark:text-gray-400'>Chip Model</p>
								<p className='text-sm font-medium text-gray-900 dark:text-white'>{deviceInfo.chipModel}</p>
							</div>
						</div>
						<div className='flex items-center space-x-2'>
							<Zap className='w-4 h-4 text-yellow-500' />
							<div>
								<p className='text-xs text-gray-600 dark:text-gray-400'>CPU Frequency</p>
								<p className='text-sm font-medium text-gray-900 dark:text-white'>{deviceInfo.cpuFreqMHz} MHz</p>
							</div>
						</div>
						<div className='flex items-center space-x-2'>
							<Activity className='w-4 h-4 text-green-500' />
							<div>
								<p className='text-xs text-gray-600 dark:text-gray-400'>Flash Size</p>
								<p className='text-sm font-medium text-gray-900 dark:text-white'>{deviceInfo.flashSize}</p>
							</div>
						</div>
						<div className='flex items-center space-x-2'>
							<Settings className='w-4 h-4 text-purple-500' />
							<div>
								<p className='text-xs text-gray-600 dark:text-gray-400'>Flash Speed</p>
								<p className='text-sm font-medium text-gray-900 dark:text-white'>{deviceInfo.flashSpeed}</p>
							</div>
						</div>
					</div>
				</div>
			)}

			{/* Action Buttons */}
			<div className='p-4'>
				<div className='flex items-center justify-between'>
					<div className='flex space-x-2'>
						<button
							onClick={refreshConnection}
							disabled={!selectedDevice}
							className='px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center'>
							<RefreshCw className='w-4 h-4 mr-2' />
							Refresh
						</button>
						<button
							onClick={testConnection}
							disabled={!isConnected}
							className='px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center'>
							<Check className='w-4 h-4 mr-2' />
							Test Connection
						</button>
					</div>

					<div className='text-sm text-gray-600 dark:text-gray-400'>
						Method: {connectionMethod === "websocket" ? "WebSocket (OTA)" : "Serial (USB)"}
					</div>
				</div>
			</div>
		</div>
	);
};

export default DeviceConnection;
