"use client";

import React from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, Wifi, Battery, Power, RefreshCw, Thermometer, Droplets } from "lucide-react";
import { Gauge } from "@/components/ui/Gauge"; // Placeholder for Gauge component
import { LiveChart } from "@/components/ui/LiveChart"; // Placeholder for LiveChart component

export function DeviceCard({ device, onControl }) {
	const isOnline = device.status?.isOnline || false;
	const batteryLevel = device.status?.battery?.level || 0;
	const temperature = device.sensors?.temperature || 25;
	const humidity = device.sensors?.humidity || 60;

	const formatLastSeen = (lastSeen) => {
		if (!lastSeen) return "Never";
		const date = new Date(lastSeen);
		const now = new Date();
		const diffInMinutes = Math.floor((now - date) / (1000 * 60));

		if (diffInMinutes < 1) return "Just now";
		if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
		if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
		return `${Math.floor(diffInMinutes / 1440)}d ago`;
	};

	return (
		<motion.div
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			whileHover={{ scale: 1.02 }}
			transition={{ duration: 0.2 }}
			className='w-full'>
			<Card className='w-full border-0 shadow-sm hover:shadow-lg transition-all duration-200 dark:bg-gray-800 dark:border-gray-700 overflow-hidden'>
				<CardHeader className='pb-4'>
					<div className='flex items-center justify-between'>
						<CardTitle className='text-lg font-semibold text-gray-900 dark:text-white truncate'>{device.name}</CardTitle>
						<Badge
							variant={isOnline ? "default" : "secondary"}
							className={`${
								isOnline ?
									"bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
								:	"bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
							} font-medium`}>
							{isOnline ? "Online" : "Offline"}
						</Badge>
					</div>

					<div className='flex flex-wrap items-center gap-4 text-sm text-gray-500 dark:text-gray-400'>
						<div className='flex items-center space-x-1'>
							<Activity className='w-4 h-4' />
							<span className='truncate'>{formatLastSeen(device.status?.lastSeen)}</span>
						</div>
						<div className='flex items-center space-x-1'>
							<Battery
								className={`w-4 h-4 ${
									batteryLevel < 20 ? "text-red-500"
									: batteryLevel < 50 ? "text-yellow-500"
									: "text-green-500"
								}`}
							/>
							<span className='font-medium'>{batteryLevel}%</span>
						</div>
						<div className='flex items-center space-x-1'>
							<Wifi
								className={`w-4 h-4 ${
									device.network?.signal === "Strong" ? "text-green-500"
									: device.network?.signal === "Weak" ? "text-red-500"
									: "text-gray-400"
								}`}
							/>
							<span className='truncate'>{device.network?.signal || "N/A"}</span>
						</div>
					</div>
				</CardHeader>

				<CardContent className='space-y-4'>
					{/* Sensor Data */}
					<div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
						<div className='bg-gray-50 dark:bg-gray-900 rounded-lg p-4'>
							<div className='flex items-center space-x-2 mb-2'>
								<Thermometer className='w-4 h-4 text-blue-500' />
								<p className='text-sm font-medium text-gray-600 dark:text-gray-300'>Temperature</p>
							</div>
							<div className='flex items-baseline space-x-1'>
								<span className='text-2xl font-bold text-gray-900 dark:text-white'>{temperature}</span>
								<span className='text-sm text-gray-500 dark:text-gray-400'>°C</span>
							</div>
						</div>

						<div className='bg-gray-50 dark:bg-gray-900 rounded-lg p-4'>
							<div className='flex items-center space-x-2 mb-2'>
								<Droplets className='w-4 h-4 text-cyan-500' />
								<p className='text-sm font-medium text-gray-600 dark:text-gray-300'>Humidity</p>
							</div>
							<div className='flex items-baseline space-x-1'>
								<span className='text-2xl font-bold text-gray-900 dark:text-white'>{humidity}</span>
								<span className='text-sm text-gray-500 dark:text-gray-400'>%</span>
							</div>
						</div>
					</div>

					{/* Chart Placeholder */}
					<div className='h-32 bg-gray-50 dark:bg-gray-900 rounded-lg p-3 border border-gray-200 dark:border-gray-700'>
						<div className='flex items-center justify-center h-full text-gray-400 dark:text-gray-500'>
							<div className='text-center'>
								<Activity className='w-8 h-8 mx-auto mb-2 opacity-50' />
								<p className='text-sm'>Live data chart</p>
							</div>
						</div>
					</div>

					{/* Control Buttons */}
					<div className='flex space-x-2'>
						<button
							onClick={() => onControl(device.id, "toggle_power")}
							className='flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg hover:from-blue-700 hover:to-cyan-700 transition-all duration-200 shadow-sm hover:shadow-md font-medium'>
							<Power className='w-4 h-4' />
							<span>Toggle Power</span>
						</button>
						<button
							onClick={() => onControl(device.id, "refresh")}
							className='flex items-center justify-center space-x-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-200 font-medium'>
							<RefreshCw className='w-4 h-4' />
							<span className='hidden sm:inline'>Refresh</span>
						</button>
					</div>
				</CardContent>
			</Card>
		</motion.div>
	);
}
