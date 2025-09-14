"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import apiService from "@/lib/api";
import websocketService from "@/lib/websocket";
import { toast } from "react-hot-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DeviceCard } from "@/components/ui/DeviceCard";
import { SkeletonDashboard } from "@/components/ui/Skeleton";
import Sidebar from "@/components/Sidebar";
import { Activity, Wifi, Battery, Server, Menu, LogOut, Plus } from "lucide-react";

/**
 * @typedef {Object} DashboardData
 * @property {Object} summary
 * @property {number} summary.totalDevices
 * @property {number} summary.onlineDevices
 * @property {number} summary.offlineDevices
 * @property {number} summary.uptimePercentage
 * @property {Array<{_id: string, count: number}>} deviceTypes
 * @property {any[]} recentDevices
 * @property {Object} user
 * @property {string} user.name
 * @property {string} user.email
 * @property {string} user.memberSince
 */

/**
 * Dashboard page component
 * @returns {React.JSX.Element}
 */
const DashboardPage = () => {
	const { user, logout, isAuthenticated, isLoading: authLoading } = useAuth();
	/** @type {[DashboardData | null, function]} */
	const [dashboardData, setDashboardData] = useState(null);
	const [isLoading, setIsLoading] = useState(true);
	/** @type {['connected' | 'connecting' | 'disconnected', function]} */
	const [wsStatus, setWsStatus] = useState("connecting");
	const [devices, setDevices] = useState([]);
	const [sidebarOpen, setSidebarOpen] = useState(true);
	const router = useRouter();

	const containerVariants = {
		hidden: { opacity: 0 },
		visible: {
			opacity: 1,
			transition: {
				staggerChildren: 0.1,
				delayChildren: 0.2,
			},
		},
	};

	const itemVariants = {
		hidden: { opacity: 0, y: 20 },
		visible: { opacity: 1, y: 0 },
	};

	useEffect(() => {
		if (!authLoading && !isAuthenticated) {
			router.push("/auth/login");
			return;
		}

		if (isAuthenticated) {
			loadDashboardData();
			setupWebSocketListeners();
		}
	}, [isAuthenticated, authLoading, router]);

	// Handle sidebar visibility based on screen size
	useEffect(() => {
		const handleResize = () => {
			if (window.innerWidth >= 1024) {
				setSidebarOpen(true);
			} else {
				setSidebarOpen(false);
			}
		};

		// Set initial state
		handleResize();

		window.addEventListener("resize", handleResize);
		return () => window.removeEventListener("resize", handleResize);
	}, []);

	const loadDashboardData = async () => {
		try {
			setIsLoading(true);
			const data = await apiService.getDashboardData();
			setDashboardData(data);
			// Initialize devices from data
			if (data.recentDevices) {
				setDevices(
					data.recentDevices.map((d) => ({
						id: d._id,
						name: d.name,
						status: d.status || { isOnline: false, lastSeen: new Date().toISOString(), battery: { level: 50 } },
						sensors: d.sensors || { temperature: 25, humidity: 60 },
						network: d.network || { signal: "N/A" },
						recentData: d.recentData || [],
					})),
				);
			}
		} catch (error) {
			console.error("Failed to load dashboard data:", error);
			toast.error("Failed to load dashboard data");
			// Fallback mock data
			setDevices([
				{
					id: "1",
					name: "ESP32 Sensor 1",
					status: { isOnline: true, lastSeen: new Date().toISOString(), battery: { level: 85 } },
					sensors: { temperature: 25.3, humidity: 60 },
					network: { signal: "Strong" },
					recentData: [
						{ time: "09:00", value: 24 },
						{ time: "09:15", value: 25 },
						{ time: "09:30", value: 25.5 },
						{ time: "09:45", value: 25.3 },
						{ time: "10:00", value: 26 },
					],
				},
				{
					id: "2",
					name: "ESP32 Actuator 1",
					status: { isOnline: false, lastSeen: new Date().toISOString(), battery: { level: 20 } },
					sensors: { temperature: 22.1, humidity: 55 },
					network: { signal: "Weak" },
					recentData: [
						{ time: "14:00", value: 21 },
						{ time: "14:15", value: 21.5 },
						{ time: "14:30", value: 22 },
						{ time: "14:45", value: 22.2 },
						{ time: "15:00", value: 22.1 },
					],
				},
			]);
		} finally {
			setIsLoading(false);
		}
	};

	const setupWebSocketListeners = () => {
		// Check WebSocket status
		const checkStatus = () => {
			const status = websocketService.getConnectionStatus();
			setWsStatus(status.isConnected ? "connected" : "disconnected");
		};

		checkStatus();
		const statusInterval = setInterval(checkStatus, 5000);

		// Listen to device events
		/**
		 * Handle device data event
		 * @param {any} data
		 */
		const handleDeviceData = (data) => {
			console.log("Received device data:", data);
			toast.success(`New data from ${data.deviceId}`, { duration: 2000 });
			// Update device state with real-time data
			setDevices((prev) =>
				prev.map((d) =>
					d.id === data.deviceId ?
						{
							...d,
							sensors: { ...d.sensors, ...data.sensorData },
							status: { ...d.status, isOnline: true, lastSeen: new Date().toISOString() },
							recentData: [
								...(d.recentData || []),
								{ time: new Date().toLocaleTimeString(), value: data.sensorData.temperature || 0 },
							].slice(-5),
						}
					:	d,
				),
			);
		};

		/**
		 * Handle device status event
		 * @param {any} data
		 */
		const handleDeviceStatus = (data) => {
			console.log("Device status update:", data);
			setDevices((prev) => prev.map((d) => (d.id === data.deviceId ? { ...d, status: { ...d.status, ...data.status } } : d)));
		};

		/**
		 * Handle device alert event
		 * @param {any} data
		 */
		const handleDeviceAlert = (data) => {
			console.log("Device alert:", data);
			if (data.alert.severity === "critical" || data.alert.severity === "error") {
				toast.error(`Device Alert: ${data.alert.message}`, { duration: 6000 });
			}
		};

		websocketService.on("device_data", handleDeviceData);
		websocketService.on("device_status", handleDeviceStatus);
		websocketService.on("device_alert", handleDeviceAlert);

		return () => {
			clearInterval(statusInterval);
			websocketService.off("device_data", handleDeviceData);
			websocketService.off("device_status", handleDeviceStatus);
			websocketService.off("device_alert", handleDeviceAlert);
		};
	};

	const handleLogout = async () => {
		try {
			await logout();
		} catch (error) {
			console.error("Logout error:", error);
		}
	};

	const handleControl = (deviceId, command) => {
		console.log(`Sending command ${command} to device ${deviceId}`);
		websocketService.send("command", { deviceId, command });
		toast.success(`Command ${command} sent to ${deviceId}`);
	};

	if (authLoading || isLoading) {
		return (
			<div className='flex min-h-screen bg-gray-50 dark:bg-gray-900'>
				{/* Sidebar Navigation */}
				<Sidebar
					isOpen={sidebarOpen}
					onClose={() => setSidebarOpen(false)}
				/>

				{/* Main Content */}
				<main className='flex-1 transition-all'>
					{/* Header */}
					<div className='bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700'>
						<div className='px-4 sm:px-6 lg:px-8'>
							<div className='flex justify-between items-center py-4'>
								<div className='flex items-center'>
									<button
										onClick={() => setSidebarOpen(true)}
										className='lg:hidden mr-4 p-2 rounded-md text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors'>
										<span className='sr-only'>Open sidebar</span>
										<Menu className='h-6 w-6' />
									</button>
									<div className='w-10 h-10 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-lg flex items-center justify-center mr-4'>
										<Activity className='w-6 h-6 text-white' />
									</div>
									<div>
										<h1 className='text-2xl font-bold text-gray-900 dark:text-white'>Dashboard</h1>
										<p className='text-sm text-gray-500 dark:text-gray-400'>Loading...</p>
									</div>
								</div>
							</div>
						</div>
					</div>

					<div className='px-4 sm:px-6 lg:px-8 py-6'>
						<SkeletonDashboard />
					</div>
				</main>
			</div>
		);
	}

	if (!isAuthenticated) {
		return null;
	}

	return (
		<div className='flex min-h-screen bg-gray-50 dark:bg-gray-900'>
			{/* Sidebar Navigation */}
			<Sidebar
				isOpen={sidebarOpen}
				onClose={() => setSidebarOpen(false)}
			/>

			{/* Main Content */}
			<main className='flex-1 transition-all'>
				{/* Header */}
				<div className='bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700'>
					<div className='px-4 sm:px-6 lg:px-8'>
						<div className='flex justify-between items-center py-4'>
							<div className='flex items-center'>
								<button
									onClick={() => setSidebarOpen(true)}
									className='lg:hidden mr-4 p-2 rounded-md text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors'>
									<span className='sr-only'>Open sidebar</span>
									<Menu className='h-6 w-6' />
								</button>
								<div className='w-10 h-10 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-lg flex items-center justify-center mr-4'>
									<Activity className='w-6 h-6 text-white' />
								</div>
								<div>
									<h1 className='text-2xl font-bold text-gray-900 dark:text-white'>Dashboard</h1>
									<p className='text-sm text-gray-500 dark:text-gray-400'>Welcome back, {user?.name}</p>
								</div>
							</div>

							<div className='flex items-center space-x-4'>
								{/* WebSocket Status */}
								<div className='hidden sm:flex items-center space-x-2 px-3 py-2 bg-gray-50 dark:bg-gray-700 rounded-lg'>
									<div
										className={`w-2 h-2 rounded-full ${
											wsStatus === "connected" ? "bg-green-400"
											: wsStatus === "connecting" ? "bg-yellow-400"
											: "bg-red-400"
										}`}></div>
									<span className='text-sm text-gray-600 dark:text-gray-400 capitalize font-medium'>{wsStatus}</span>
								</div>

								<button
									onClick={handleLogout}
									className='flex items-center space-x-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors'>
									<LogOut className='w-4 h-4' />
									<span className='hidden sm:inline'>Logout</span>
								</button>
							</div>
						</div>
					</div>
				</div>

				<div className='px-4 sm:px-6 lg:px-8 py-6'>
					<motion.div
						variants={containerVariants}
						initial='hidden'
						animate='visible'
						className='space-y-8'>
						{/* Summary Cards */}
						<motion.section variants={itemVariants}>
							<div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6'>
								<Card className='bg-white dark:bg-gray-800 border-0 shadow-sm hover:shadow-md transition-shadow duration-200'>
									<CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
										<CardTitle className='text-sm font-medium text-gray-600 dark:text-gray-400'>Total Devices</CardTitle>
										<Activity className='h-4 w-4 text-blue-600 dark:text-blue-400' />
									</CardHeader>
									<CardContent>
										<div className='text-3xl font-bold text-gray-900 dark:text-white'>
											{dashboardData?.summary?.totalDevices || 0}
										</div>
										<p className='text-xs text-gray-500 dark:text-gray-400 mt-1'>All registered devices</p>
									</CardContent>
								</Card>

								<Card className='bg-white dark:bg-gray-800 border-0 shadow-sm hover:shadow-md transition-shadow duration-200'>
									<CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
										<CardTitle className='text-sm font-medium text-gray-600 dark:text-gray-400'>Online Devices</CardTitle>
										<Wifi className='h-4 w-4 text-green-600 dark:text-green-400' />
									</CardHeader>
									<CardContent>
										<div className='text-3xl font-bold text-green-600 dark:text-green-400'>
											{dashboardData?.summary?.onlineDevices || 0}
										</div>
										<p className='text-xs text-gray-500 dark:text-gray-400 mt-1'>Currently connected</p>
									</CardContent>
								</Card>

								<Card className='bg-white dark:bg-gray-800 border-0 shadow-sm hover:shadow-md transition-shadow duration-200'>
									<CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
										<CardTitle className='text-sm font-medium text-gray-600 dark:text-gray-400'>Offline Devices</CardTitle>
										<Battery className='h-4 w-4 text-red-600 dark:text-red-400' />
									</CardHeader>
									<CardContent>
										<div className='text-3xl font-bold text-red-600 dark:text-red-400'>
											{dashboardData?.summary?.offlineDevices || 0}
										</div>
										<p className='text-xs text-gray-500 dark:text-gray-400 mt-1'>Disconnected</p>
									</CardContent>
								</Card>

								<Card className='bg-white dark:bg-gray-800 border-0 shadow-sm hover:shadow-md transition-shadow duration-200'>
									<CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
										<CardTitle className='text-sm font-medium text-gray-600 dark:text-gray-400'>Uptime</CardTitle>
										<Server className='h-4 w-4 text-blue-600 dark:text-blue-400' />
									</CardHeader>
									<CardContent>
										<div className='text-3xl font-bold text-blue-600 dark:text-blue-400'>
											{dashboardData?.summary?.uptimePercentage || 0}%
										</div>
										<p className='text-xs text-gray-500 dark:text-gray-400 mt-1'>System availability</p>
									</CardContent>
								</Card>
							</div>
						</motion.section>

						{/* Devices Section */}
						<motion.section variants={itemVariants}>
							<div className='flex flex-col sm:flex-row sm:items-center justify-between mb-6 space-y-4 sm:space-y-0'>
								<h2 className='text-2xl font-bold text-gray-900 dark:text-white'>Your Devices</h2>
								<Link
									href='/devices/new'
									className='inline-flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-4 py-2 rounded-lg hover:from-blue-700 hover:to-cyan-700 transition-all duration-200 shadow-sm hover:shadow-md'>
									<Plus className='w-4 h-4' />
									<span>Add Device</span>
								</Link>
							</div>
							<div className='grid grid-cols-1 xl:grid-cols-2 gap-6'>
								{devices.map((device) => (
									<motion.div
										key={device.id}
										variants={itemVariants}
										whileHover={{ scale: 1.02 }}
										transition={{ duration: 0.2 }}>
										<DeviceCard
											device={device}
											onControl={handleControl}
										/>
									</motion.div>
								))}
								{devices.length === 0 && (
									<motion.div
										variants={itemVariants}
										className='col-span-full text-center py-16 bg-gray-50 dark:bg-gray-800 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600'>
										<div className='w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4'>
											<Wifi className='w-8 h-8 text-gray-400' />
										</div>
										<h3 className='text-lg font-semibold text-gray-900 dark:text-white mb-2'>No devices yet</h3>
										<p className='text-gray-500 dark:text-gray-400 mb-6 max-w-md mx-auto'>
											Get started by adding your first IoT device to begin monitoring and controlling your smart environment.
										</p>
										<Link
											href='/devices/new'
											className='inline-flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-6 py-3 rounded-lg hover:from-blue-700 hover:to-cyan-700 transition-all duration-200 shadow-sm hover:shadow-md'>
											<Plus className='w-4 h-4' />
											<span>Add First Device</span>
										</Link>
									</motion.div>
								)}
							</div>
						</motion.section>
					</motion.div>
				</div>
			</main>
		</div>
	);
};

export default DashboardPage;
