"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Gauge } from "@/components/ui/Gauge";
import { LiveChart } from "@/components/ui/LiveChart";
import websocketService from "@/lib/websocket";
import { Activity, Thermometer, Droplets, Gauge as GaugeIcon, Volume2, Eye, Zap } from "lucide-react";

const DesignerDataViewer = ({ shapes, devices, defaultDeviceId }) => {
	const [selectedDeviceId, setSelectedDeviceId] = useState(defaultDeviceId);
	const [deviceData, setDeviceData] = useState({});
	const [chartData, setChartData] = useState([]);
	const [isConnected, setIsConnected] = useState(false);

	// WebSocket connection and data handling
	useEffect(() => {
		const connectWebSocket = async () => {
			try {
				await websocketService.connect();
				setIsConnected(true);
			} catch (error) {
				console.error("Failed to connect to WebSocket:", error);
				setIsConnected(false);
			}
		};

		connectWebSocket();

		// Subscribe to device data
		const handleDeviceData = (data) => {
			const { deviceId, sensorData, timestamp } = data;
			if (!deviceId || !sensorData) return;

			setDeviceData((prev) => ({
				...prev,
				[deviceId]: {
					sensorData,
					timestamp,
					lastUpdate: new Date().toLocaleTimeString(),
				},
			}));

			// Update chart data for selected device
			if (deviceId === selectedDeviceId) {
				const numericSensor = sensorData.find((s) => typeof s.value === "number");
				if (numericSensor) {
					setChartData((prev) => {
						const newData = [
							...prev,
							{
								time: new Date().toLocaleTimeString(),
								value: numericSensor.value,
								type: numericSensor.type,
							},
						];
						return newData.slice(-20); // Keep last 20 data points
					});
				}
			}
		};

		websocketService.on("device_data", handleDeviceData);

		return () => {
			websocketService.off("device_data", handleDeviceData);
		};
	}, [selectedDeviceId]);

	// Get sensor icon based on type
	const getSensorIcon = (type) => {
		switch (type) {
			case "temperature":
				return <Thermometer className='w-4 h-4' />;
			case "humidity":
				return <Droplets className='w-4 h-4' />;
			case "pressure":
				return <GaugeIcon className='w-4 h-4' />;
			case "sound":
				return <Volume2 className='w-4 h-4' />;
			case "motion":
				return <Eye className='w-4 h-4' />;
			case "light":
				return <Zap className='w-4 h-4' />;
			default:
				return <Activity className='w-4 h-4' />;
		}
	};

	// Get sensor color based on type
	const getSensorColor = (type) => {
		switch (type) {
			case "temperature":
				return "#ef4444"; // red
			case "humidity":
				return "#3b82f6"; // blue
			case "pressure":
				return "#8b5cf6"; // purple
			case "sound":
				return "#f59e0b"; // amber
			case "motion":
				return "#10b981"; // emerald
			case "light":
				return "#f59e0b"; // amber
			default:
				return "#6b7280"; // gray
		}
	};

	// Filter shapes for selected device
	const deviceShapes = shapes.filter((shape) => shape.deviceId === selectedDeviceId);
	const currentDeviceData = deviceData[selectedDeviceId];

	return (
		<div className='w-full h-full bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 p-4'>
			<div className='flex items-center justify-between mb-4'>
				<h3 className='text-lg font-semibold text-gray-900 dark:text-white'>Live Data Viewer</h3>
				<div className='flex items-center space-x-2'>
					<div className={`w-2 h-2 rounded-full ${isConnected ? "bg-green-500" : "bg-red-500"}`} />
					<span className='text-xs text-gray-500 dark:text-gray-400'>{isConnected ? "Connected" : "Disconnected"}</span>
				</div>
			</div>

			{/* Device Selector */}
			<div className='mb-4'>
				<label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'>Select Device:</label>
				<select
					value={selectedDeviceId || ""}
					onChange={(e) => setSelectedDeviceId(e.target.value)}
					className='w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white'>
					<option value=''>Select a device...</option>
					{devices.map((device) => (
						<option
							key={device.deviceId}
							value={device.deviceId}>
							{device.name || device.deviceId}
						</option>
					))}
				</select>
			</div>

			{selectedDeviceId && (
				<div className='space-y-4'>
					{/* Device Status */}
					<Card>
						<CardHeader className='pb-2'>
							<CardTitle className='text-sm font-medium text-gray-900 dark:text-white'>Device Status</CardTitle>
						</CardHeader>
						<CardContent>
							<div className='flex items-center justify-between'>
								<span className='text-sm text-gray-600 dark:text-gray-400'>Status:</span>
								<Badge
									className={
										currentDeviceData ?
											"bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
										:	"bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
									}>
									{currentDeviceData ? "Online" : "Offline"}
								</Badge>
							</div>
							{currentDeviceData && (
								<div className='flex items-center justify-between mt-2'>
									<span className='text-sm text-gray-600 dark:text-gray-400'>Last Update:</span>
									<span className='text-sm text-gray-900 dark:text-white'>{currentDeviceData.lastUpdate}</span>
								</div>
							)}
						</CardContent>
					</Card>

					{/* Sensor Data */}
					{currentDeviceData && currentDeviceData.sensorData && (
						<div className='grid grid-cols-1 gap-4'>
							{currentDeviceData.sensorData.map((sensor, index) => (
								<motion.div
									key={index}
									initial={{ opacity: 0, y: 20 }}
									animate={{ opacity: 1, y: 0 }}
									transition={{ delay: index * 0.1 }}>
									<Card>
										<CardContent className='p-4'>
											<div className='flex items-center justify-between mb-3'>
												<div className='flex items-center space-x-2'>
													<div
														className='p-2 rounded-lg'
														style={{ backgroundColor: getSensorColor(sensor.type) + "20" }}>
														{getSensorIcon(sensor.type)}
													</div>
													<div>
														<h4 className='text-sm font-medium text-gray-900 dark:text-white capitalize'>{sensor.type}</h4>
														<p className='text-xs text-gray-500 dark:text-gray-400'>{sensor.unit || "N/A"}</p>
													</div>
												</div>
												<div className='text-right'>
													<p className='text-lg font-bold text-gray-900 dark:text-white'>
														{typeof sensor.value === "number" ? sensor.value.toFixed(1) : sensor.value}
													</p>
												</div>
											</div>

											{/* Gauge for numeric values */}
											{typeof sensor.value === "number" && (
												<div className='flex justify-center'>
													<Gauge
														value={sensor.value}
														max={
															sensor.type === "temperature" ? 50
															: sensor.type === "humidity" ?
																100
															:	1000
														}
														unit={sensor.unit || ""}
														size={80}
														color={getSensorColor(sensor.type)}
													/>
												</div>
											)}

											{/* Boolean values */}
											{typeof sensor.value === "string" && (sensor.value === "true" || sensor.value === "false") && (
												<div className='flex justify-center'>
													<div
														className={`w-12 h-12 rounded-full flex items-center justify-center ${
															sensor.value === "true" ? "bg-green-500" : "bg-gray-400"
														}`}>
														<span className='text-white font-bold'>{sensor.value === "true" ? "ON" : "OFF"}</span>
													</div>
												</div>
											)}
										</CardContent>
									</Card>
								</motion.div>
							))}
						</div>
					)}

					{/* Chart */}
					{chartData.length > 0 && (
						<Card>
							<CardHeader>
								<CardTitle className='text-sm font-medium text-gray-900 dark:text-white'>Data Trends</CardTitle>
							</CardHeader>
							<CardContent>
								<div className='h-48'>
									<LiveChart
										data={chartData}
										height={180}
										title='Sensor Data Over Time'
									/>
								</div>
							</CardContent>
						</Card>
					)}

					{/* No Data Message */}
					{!currentDeviceData && (
						<Card>
							<CardContent className='p-8 text-center'>
								<Activity className='w-12 h-12 text-gray-400 mx-auto mb-4' />
								<p className='text-gray-500 dark:text-gray-400'>No data received from this device yet.</p>
								<p className='text-sm text-gray-400 dark:text-gray-500 mt-2'>
									Make sure the device is connected and sending data.
								</p>
							</CardContent>
						</Card>
					)}
				</div>
			)}

			{!selectedDeviceId && (
				<Card>
					<CardContent className='p-8 text-center'>
						<Eye className='w-12 h-12 text-gray-400 mx-auto mb-4' />
						<p className='text-gray-500 dark:text-gray-400'>Select a device to view live data</p>
					</CardContent>
				</Card>
			)}
		</div>
	);
};

export default DesignerDataViewer;
