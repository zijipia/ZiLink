"use client";

import { useState, useRef, useEffect } from "react";
import {
	Save,
	Download,
	Upload,
	Play,
	Stop,
	RefreshCw,
	X,
	Check,
	AlertCircle,
	Wifi,
	WifiOff,
	Settings,
	Code,
	Monitor,
} from "lucide-react";
import { toast } from "react-hot-toast";

const CodeEditor = ({
	initialCode = "",
	onCodeChange,
	onSave,
	onFlash,
	devices = [],
	selectedDevice = null,
	compact = false,
}) => {
	const [code, setCode] = useState(initialCode);
	const [isEditing, setIsEditing] = useState(false);
	const [isFlashing, setIsFlashing] = useState(false);
	const [isConnected, setIsConnected] = useState(false);
	const [connectionStatus, setConnectionStatus] = useState("disconnected");
	const [flashProgress, setFlashProgress] = useState(0);
	const [selectedDeviceId, setSelectedDeviceId] = useState(selectedDevice?.deviceId || "");
	const [showSettings, setShowSettings] = useState(false);
	const [flashSettings, setFlashSettings] = useState({
		baudRate: 115200,
		port: "auto",
		board: "esp32",
		eraseFlash: true,
		verifyFlash: true,
	});

	const textareaRef = useRef(null);
	const fileInputRef = useRef(null);

	// Update code when initialCode changes
	useEffect(() => {
		if (initialCode && initialCode !== code) {
			setCode(initialCode);
		}
	}, [initialCode]);

	// Handle code changes
	const handleCodeChange = (e) => {
		const newCode = e.target.value;
		setCode(newCode);
		if (onCodeChange) {
			onCodeChange(newCode);
		}
	};

	// Save code
	const handleSave = () => {
		if (onSave) {
			onSave(code);
		}
		toast.success("Code saved successfully!");
	};

	// Download code as file
	const handleDownload = () => {
		const blob = new Blob([code], { type: "text/plain" });
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = "ESP32_Code.ino";
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(url);
		toast.success("Code downloaded!");
	};

	// Upload code from file
	const handleUpload = () => {
		fileInputRef.current?.click();
	};

	const handleFileUpload = (e) => {
		const file = e.target.files[0];
		if (file) {
			const reader = new FileReader();
			reader.onload = (event) => {
				const fileContent = event.target.result;
				setCode(fileContent);
				if (onCodeChange) {
					onCodeChange(fileContent);
				}
				toast.success("Code uploaded successfully!");
			};
			reader.readAsText(file);
		}
	};

	// Flash code to device
	const handleFlash = async () => {
		if (!selectedDeviceId) {
			toast.error("Please select a device first!");
			return;
		}

		setIsFlashing(true);
		setFlashProgress(0);

		try {
			// Simulate flash progress
			const progressInterval = setInterval(() => {
				setFlashProgress((prev) => {
					if (prev >= 90) {
						clearInterval(progressInterval);
						return prev;
					}
					return prev + Math.random() * 10;
				});
			}, 200);

			// Call flash function
			if (onFlash) {
				await onFlash(code, selectedDeviceId, flashSettings);
			}

			// Complete progress
			setTimeout(() => {
				setFlashProgress(100);
				setIsFlashing(false);
				toast.success("Code flashed successfully!");
			}, 1000);
		} catch (error) {
			setIsFlashing(false);
			setFlashProgress(0);
			toast.error(`Flash failed: ${error.message}`);
		}
	};

	// Connect to device
	const handleConnect = async () => {
		if (!selectedDeviceId) {
			toast.error("Please select a device first!");
			return;
		}

		setConnectionStatus("connecting");

		try {
			// Simulate connection
			await new Promise((resolve) => setTimeout(resolve, 2000));

			setIsConnected(true);
			setConnectionStatus("connected");
			toast.success("Connected to device!");
		} catch (error) {
			setConnectionStatus("disconnected");
			toast.error("Failed to connect to device");
		}
	};

	// Disconnect from device
	const handleDisconnect = () => {
		setIsConnected(false);
		setConnectionStatus("disconnected");
		toast.success("Disconnected from device");
	};

	// Format code
	const formatCode = () => {
		// Simple code formatting - in real implementation, use a proper formatter
		const formatted = code
			.split("\n")
			.map((line) => line.trim())
			.filter((line) => line.length > 0)
			.join("\n");

		setCode(formatted);
		if (onCodeChange) {
			onCodeChange(formatted);
		}
		toast.success("Code formatted!");
	};

	// Reset code
	const handleReset = () => {
		if (confirm("Are you sure you want to reset the code?")) {
			setCode(initialCode);
			if (onCodeChange) {
				onCodeChange(initialCode);
			}
			toast.success("Code reset!");
		}
	};

	if (compact) {
		return (
			<div className='space-y-3'>
				<div className='flex items-center justify-between'>
					<h4 className='text-sm font-medium text-gray-900 dark:text-white'>Code Editor</h4>
					<button
						onClick={() => setIsEditing(!isEditing)}
						className='p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors'>
						<Code className='w-4 h-4' />
					</button>
				</div>

				{isEditing && (
					<div className='space-y-2'>
						<textarea
							ref={textareaRef}
							value={code}
							onChange={handleCodeChange}
							className='w-full h-32 p-2 text-xs font-mono bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
							placeholder='Enter your ESP32 code here...'
						/>

						<div className='flex space-x-1'>
							<button
								onClick={handleSave}
								className='flex-1 px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700 transition-colors flex items-center justify-center text-xs'>
								<Save className='w-3 h-3 mr-1' />
								Save
							</button>
							<button
								onClick={handleDownload}
								className='flex-1 px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors flex items-center justify-center text-xs'>
								<Download className='w-3 h-3 mr-1' />
								Download
							</button>
							<button
								onClick={handleUpload}
								className='flex-1 px-2 py-1 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors flex items-center justify-center text-xs'>
								<Upload className='w-3 h-3 mr-1' />
								Upload
							</button>
						</div>

						{/* Device Selection */}
						<div className='space-y-1'>
							<label className='text-xs text-gray-600 dark:text-gray-400'>Target Device:</label>
							<select
								value={selectedDeviceId}
								onChange={(e) => setSelectedDeviceId(e.target.value)}
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

						{/* Connection Status */}
						<div className='flex items-center justify-between'>
							<div className='flex items-center space-x-1'>
								{isConnected ?
									<Wifi className='w-3 h-3 text-green-500' />
								:	<WifiOff className='w-3 h-3 text-gray-400' />}
								<span className='text-xs text-gray-600 dark:text-gray-400'>{connectionStatus}</span>
							</div>

							{!isConnected ?
								<button
									onClick={handleConnect}
									disabled={!selectedDeviceId}
									className='px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors'>
									Connect
								</button>
							:	<button
									onClick={handleDisconnect}
									className='px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 transition-colors'>
									Disconnect
								</button>
							}
						</div>

						{/* Flash Button */}
						<button
							onClick={handleFlash}
							disabled={!isConnected || isFlashing || !selectedDeviceId}
							className='w-full px-3 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center text-sm'>
							{isFlashing ?
								<>
									<RefreshCw className='w-4 h-4 mr-2 animate-spin' />
									Flashing... {Math.round(flashProgress)}%
								</>
							:	<>
									<Play className='w-4 h-4 mr-2' />
									Flash Code
								</>
							}
						</button>

						{/* Flash Progress */}
						{isFlashing && (
							<div className='w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2'>
								<div
									className='bg-orange-600 h-2 rounded-full transition-all duration-300'
									style={{ width: `${flashProgress}%` }}
								/>
							</div>
						)}
					</div>
				)}

				<input
					ref={fileInputRef}
					type='file'
					accept='.ino,.cpp,.h,.txt'
					onChange={handleFileUpload}
					className='hidden'
				/>
			</div>
		);
	}

	return (
		<div className='w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm'>
			{/* Header */}
			<div className='flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700'>
				<div className='flex items-center space-x-2'>
					<Code className='w-5 h-5 text-blue-600' />
					<h3 className='text-lg font-semibold text-gray-900 dark:text-white'>Code Editor</h3>
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
					<h4 className='text-sm font-medium text-gray-900 dark:text-white mb-3'>Flash Settings</h4>
					<div className='grid grid-cols-2 gap-4'>
						<div>
							<label className='block text-xs text-gray-600 dark:text-gray-400 mb-1'>Baud Rate</label>
							<select
								value={flashSettings.baudRate}
								onChange={(e) => setFlashSettings((prev) => ({ ...prev, baudRate: parseInt(e.target.value) }))}
								className='w-full px-2 py-1 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent'>
								<option value={9600}>9600</option>
								<option value={115200}>115200</option>
								<option value={230400}>230400</option>
								<option value={460800}>460800</option>
							</select>
						</div>
						<div>
							<label className='block text-xs text-gray-600 dark:text-gray-400 mb-1'>Board Type</label>
							<select
								value={flashSettings.board}
								onChange={(e) => setFlashSettings((prev) => ({ ...prev, board: e.target.value }))}
								className='w-full px-2 py-1 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent'>
								<option value='esp32'>ESP32</option>
								<option value='esp32s2'>ESP32-S2</option>
								<option value='esp32s3'>ESP32-S3</option>
								<option value='esp32c3'>ESP32-C3</option>
							</select>
						</div>
					</div>
					<div className='mt-3 flex items-center space-x-4'>
						<label className='flex items-center space-x-2'>
							<input
								type='checkbox'
								checked={flashSettings.eraseFlash}
								onChange={(e) => setFlashSettings((prev) => ({ ...prev, eraseFlash: e.target.checked }))}
								className='rounded border-gray-300 text-blue-600 focus:ring-blue-500'
							/>
							<span className='text-xs text-gray-600 dark:text-gray-400'>Erase Flash</span>
						</label>
						<label className='flex items-center space-x-2'>
							<input
								type='checkbox'
								checked={flashSettings.verifyFlash}
								onChange={(e) => setFlashSettings((prev) => ({ ...prev, verifyFlash: e.target.checked }))}
								className='rounded border-gray-300 text-blue-600 focus:ring-blue-500'
							/>
							<span className='text-xs text-gray-600 dark:text-gray-400'>Verify Flash</span>
						</label>
					</div>
				</div>
			)}

			{/* Device Selection */}
			<div className='p-4 border-b border-gray-200 dark:border-gray-700'>
				<div className='flex items-center space-x-4'>
					<div className='flex-1'>
						<label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'>Target Device</label>
						<select
							value={selectedDeviceId}
							onChange={(e) => setSelectedDeviceId(e.target.value)}
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
								onClick={handleConnect}
								disabled={!selectedDeviceId}
								className='px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center'>
								<Wifi className='w-4 h-4 mr-2' />
								Connect
							</button>
						:	<button
								onClick={handleDisconnect}
								className='px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center'>
								<WifiOff className='w-4 h-4 mr-2' />
								Disconnect
							</button>
						}
					</div>
				</div>
			</div>

			{/* Code Editor */}
			<div className='p-4'>
				<div className='mb-4'>
					<textarea
						ref={textareaRef}
						value={code}
						onChange={handleCodeChange}
						className='w-full h-96 p-4 text-sm font-mono bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
						placeholder='Enter your ESP32 code here...'
					/>
				</div>

				{/* Action Buttons */}
				<div className='flex items-center justify-between'>
					<div className='flex space-x-2'>
						<button
							onClick={handleSave}
							className='px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center'>
							<Save className='w-4 h-4 mr-2' />
							Save
						</button>
						<button
							onClick={handleDownload}
							className='px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center'>
							<Download className='w-4 h-4 mr-2' />
							Download
						</button>
						<button
							onClick={handleUpload}
							className='px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center'>
							<Upload className='w-4 h-4 mr-2' />
							Upload
						</button>
						<button
							onClick={formatCode}
							className='px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center'>
							<RefreshCw className='w-4 h-4 mr-2' />
							Format
						</button>
						<button
							onClick={handleReset}
							className='px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center'>
							<X className='w-4 h-4 mr-2' />
							Reset
						</button>
					</div>

					<button
						onClick={handleFlash}
						disabled={!isConnected || isFlashing || !selectedDeviceId}
						className='px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center'>
						{isFlashing ?
							<>
								<RefreshCw className='w-4 h-4 mr-2 animate-spin' />
								Flashing... {Math.round(flashProgress)}%
							</>
						:	<>
								<Play className='w-4 h-4 mr-2' />
								Flash Code
							</>
						}
					</button>
				</div>

				{/* Flash Progress */}
				{isFlashing && (
					<div className='mt-4'>
						<div className='flex items-center justify-between mb-2'>
							<span className='text-sm text-gray-600 dark:text-gray-400'>Flash Progress</span>
							<span className='text-sm text-gray-600 dark:text-gray-400'>{Math.round(flashProgress)}%</span>
						</div>
						<div className='w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2'>
							<div
								className='bg-orange-600 h-2 rounded-full transition-all duration-300'
								style={{ width: `${flashProgress}%` }}
							/>
						</div>
					</div>
				)}
			</div>

			<input
				ref={fileInputRef}
				type='file'
				accept='.ino,.cpp,.h,.txt'
				onChange={handleFileUpload}
				className='hidden'
			/>
		</div>
	);
};

export default CodeEditor;
