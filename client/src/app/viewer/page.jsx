"use client";

import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SkeletonDashboard } from "@/components/ui/Skeleton";
import Sidebar from "@/components/Sidebar";
import {
	Activity,
	Eye,
	Play,
	Pause,
	Square,
	RotateCcw,
	ZoomIn,
	ZoomOut,
	Maximize,
	Download,
	Share,
	Menu,
	LogOut,
	RefreshCw,
	Settings,
	Monitor,
	Smartphone,
	Tablet,
} from "lucide-react";
import apiService from "@/lib/api";
import websocketService from "@/lib/websocket";
import { LiveChart } from "@/components/ui/LiveChart";

const ViewerPage = () => {
	const { logout, isAuthenticated, isLoading: authLoading } = useAuth();
	const [isLoading, setIsLoading] = useState(true);
	const [sidebarOpen, setSidebarOpen] = useState(true);
	const [isPlaying, setIsPlaying] = useState(true);
	const [currentView, setCurrentView] = useState("desktop");
	const [zoomLevel, setZoomLevel] = useState(100);

	// Live data state
	const [devices, setDevices] = useState([]);
	const [selectedDeviceId, setSelectedDeviceId] = useState(null);
	const [latestByDevice, setLatestByDevice] = useState({}); // { [deviceId]: { sensorData: [], timestamp } }
	const [chartData, setChartData] = useState([]); // [{ time, value }]

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

	const viewModes = [
		{ id: "desktop", name: "Desktop", icon: Monitor },
		{ id: "tablet", name: "Tablet", icon: Tablet },
		{ id: "mobile", name: "Mobile", icon: Smartphone },
	];

	// Redirect if not authenticated, otherwise load live data
	useEffect(() => {
		if (!authLoading && !isAuthenticated) {
			router.push("/auth/login");
			return;
		}
		if (isAuthenticated) {
			loadInitial();
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [isAuthenticated, authLoading]);

	// Sidebar responsive behavior
	useEffect(() => {
		const handleResize = () => {
			if (window.innerWidth >= 1024) {
				setSidebarOpen(true);
			} else {
				setSidebarOpen(false);
			}
		};
		handleResize();
		window.addEventListener("resize", handleResize);
		return () => window.removeEventListener("resize", handleResize);
	}, []);

	// Initialize: fetch connected devices and subscribe to websocket events
	const loadInitial = async () => {
		try {
			setIsLoading(true);
			const res = await apiService.getConnectedDevices(); // { connectedCount, devices }
			const list = res?.devices || [];
			setDevices(list);
			if (list.length > 0) {
				setSelectedDeviceId(list[0].deviceId);
				// Optional: subscribe to specific devices (server also broadcasts globally)
				list.forEach((d) => websocketService.subscribeToDevice(d.deviceId));
			}
		} catch (e) {
			console.error("Failed to load connected devices:", e);
		} finally {
			setIsLoading(false);
		}
	};

	// WebSocket handlers
	useEffect(() => {
		const onDeviceData = (msg) => {
			const { deviceId, sensorData, timestamp } = msg || {};
			if (!deviceId || !Array.isArray(sensorData)) return;

			// Update latest cache
			setLatestByDevice((prev) => ({
				...prev,
				[deviceId]: { sensorData, timestamp },
			}));

			if (!isPlaying) return;

			// If selected device, push into chart
			if (deviceId === selectedDeviceId) {
				const firstNumeric = sensorData.find((s) => typeof s?.value === "number");
				if (firstNumeric) {
					const t = timestamp ? new Date(timestamp) : new Date();
					const timeLabel = t.toLocaleTimeString();
					setChartData((prev) => {
						const next = [...prev, { time: timeLabel, value: firstNumeric.value }];
						// Keep last 50 samples
						return next.slice(-50);
					});
				}
			}
		};

		const onDeviceBatchData = (msg) => {
			const { deviceId, batchData } = msg || {};
			if (!deviceId || !Array.isArray(batchData)) return;
			// Update latest with the last item
			const last = batchData[batchData.length - 1];
			if (last) {
				setLatestByDevice((prev) => ({
					...prev,
					[deviceId]: { sensorData: last.sensorData || [], timestamp: last.timestamp },
				}));
			}
			if (!isPlaying || deviceId !== selectedDeviceId) return;
			// Append numeric points found in batch for chart
			const updates = [];
			for (const item of batchData) {
				const n = (item.sensorData || []).find((s) => typeof s?.value === "number");
				if (n) {
					const t = item.timestamp ? new Date(item.timestamp) : new Date();
					updates.push({ time: t.toLocaleTimeString(), value: n.value });
				}
			}
			if (updates.length) {
				setChartData((prev) => {
					const next = [...prev, ...updates];
					return next.slice(-50);
				});
			}
		};

		const onDeviceStatus = ({ deviceId, status }) => {
			if (!deviceId) return;
			setDevices((prev) => prev.map((d) => (d.deviceId === deviceId ? { ...d, status } : d)));
		};

		const refreshConnectedDevices = async () => {
			try {
				const res = await apiService.getConnectedDevices();
				const list = res?.devices || [];
				setDevices(list);
				// Preserve selected device if possible
				if (!list.find((d) => d.deviceId === selectedDeviceId) && list.length > 0) {
					setSelectedDeviceId(list[0].deviceId);
					setChartData([]);
				}
			} catch (e) {
				console.error("Refresh connected devices failed:", e);
			}
		};

		const onDeviceOnline = async () => {
			await refreshConnectedDevices();
		};
		const onDeviceOffline = async () => {
			await refreshConnectedDevices();
		};

		websocketService.on("device_data", onDeviceData);
		websocketService.on("device_batch_data", onDeviceBatchData);
		websocketService.on("device_status", onDeviceStatus);
		websocketService.on("device_online", onDeviceOnline);
		websocketService.on("device_offline", onDeviceOffline);

		return () => {
			websocketService.off("device_data", onDeviceData);
			websocketService.off("device_batch_data", onDeviceBatchData);
			websocketService.off("device_status", onDeviceStatus);
			websocketService.off("device_online", onDeviceOnline);
			websocketService.off("device_offline", onDeviceOffline);
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [isPlaying, selectedDeviceId]);

	// Change selected device clears chart and replays from latest cache
	useEffect(() => {
		setChartData([]);
		const latest = latestByDevice[selectedDeviceId];
		if (latest && Array.isArray(latest.sensorData)) {
			const numeric = latest.sensorData.find((s) => typeof s?.value === "number");
			if (numeric) {
				const t = latest.timestamp ? new Date(latest.timestamp) : new Date();
				setChartData([{ time: t.toLocaleTimeString(), value: numeric.value }]);
			}
		}
	}, [selectedDeviceId, latestByDevice]);

	const getViewportClass = () => {
		switch (currentView) {
			case "mobile":
				return "max-w-sm mx-auto";
			case "tablet":
				return "max-w-2xl mx-auto";
			default:
				return "w-full";
		}
	};

	const formatDeviceValue = (deviceId) => {
		const latest = latestByDevice[deviceId];
		if (!latest || !Array.isArray(latest.sensorData) || latest.sensorData.length === 0) return "—";
		const first = latest.sensorData[0];
		if (typeof first?.value === "undefined" || first?.value === null) return "—";
		return `${first.value}${first.unit ? ` ${first.unit}` : ""}`;
	};

	const lastUpdatedText = useMemo(() => {
		const latest = latestByDevice[selectedDeviceId || ""];
		if (!latest?.timestamp) return "—";
		const d = new Date(latest.timestamp);
		return d.toLocaleTimeString();
	}, [latestByDevice, selectedDeviceId]);

	const handleLogout = async () => {
		try {
			await logout();
		} catch (error) {
			console.error("Logout error:", error);
		}
	};

	if (authLoading || isLoading) {
		return (
			<div className='flex min-h-screen bg-gray-50 dark:bg-gray-900'>
				<Sidebar
					isOpen={sidebarOpen}
					onClose={() => setSidebarOpen(false)}
				/>
				<main className='flex-1 transition-all'>
					<div className='bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700'>
						<div className='px-4 sm:px-6 lg:px-8'>
							<div className='flex justify-between items-center py-4'>
								<div className='flex items-center'>
									<button
										onClick={() => setSidebarOpen(true)}
										className='lg:hidden mr-4 p-2 rounded-md text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors'>
										<Menu className='h-6 w-6' />
									</button>
									<div className='w-10 h-10 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-lg flex items-center justify-center mr-4'>
										<Eye className='w-6 h-6 text-white' />
									</div>
									<div>
										<h1 className='text-2xl font-bold text-gray-900 dark:text-white'>Viewer</h1>
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
			<Sidebar
				isOpen={sidebarOpen}
				onClose={() => setSidebarOpen(false)}
			/>
			<main className='flex-1 transition-all'>
				{/* Header */}
				<div className='bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700'>
					<div className='px-4 sm:px-6 lg:px-8'>
						<div className='flex justify-between items-center py-4'>
							<div className='flex items-center'>
								<button
									onClick={() => setSidebarOpen(true)}
									className='lg:hidden mr-4 p-2 rounded-md text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors'>
									<Menu className='h-6 w-6' />
								</button>
								<div className='w-10 h-10 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-lg flex items-center justify-center mr-4'>
									<Eye className='w-6 h-6 text-white' />
								</div>
								<div>
									<h1 className='text-2xl font-bold text-gray-900 dark:text-white'>Dashboard Viewer</h1>
									<p className='text-sm text-gray-500 dark:text-gray-400'>Live IoT dashboards</p>
								</div>
							</div>
							<div className='flex items-center space-x-2'>
								<button className='flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors'>
									<Share className='w-4 h-4' />
									<span className='hidden sm:inline'>Share</span>
								</button>
								<button className='flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors'>
									<Download className='w-4 h-4' />
									<span className='hidden sm:inline'>Export</span>
								</button>
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

				<div className='flex h-[calc(100vh-80px)]'>
					{/* Left Controls */}
					<div className='w-16 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col items-center py-4 space-y-2'>
						<button
							onClick={() => setIsPlaying((p) => !p)}
							className='w-10 h-10 rounded-lg flex items-center justify-center bg-blue-600 text-white hover:bg-blue-700 transition-colors'
							title={isPlaying ? "Pause" : "Play"}>
							{isPlaying ?
								<Pause className='w-5 h-5' />
							:	<Play className='w-5 h-5' />}
						</button>
						<button
							className='w-10 h-10 rounded-lg flex items-center justify-center text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors'
							title='Stop'
							onClick={() => setChartData([])}>
							<Square className='w-5 h-5' />
						</button>
						<button
							className='w-10 h-10 rounded-lg flex items-center justify-center text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors'
							title='Reset'
							onClick={() => setChartData([])}>
							<RotateCcw className='w-5 h-5' />
						</button>
						<div className='w-8 h-px bg-gray-200 dark:bg-gray-700 my-2' />
						<button
							className='w-10 h-10 rounded-lg flex items-center justify-center text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors'
							title='Zoom In'
							onClick={() => setZoomLevel((z) => Math.min(200, z + 10))}>
							<ZoomIn className='w-5 h-5' />
						</button>
						<button
							className='w-10 h-10 rounded-lg flex items-center justify-center text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors'
							title='Zoom Out'
							onClick={() => setZoomLevel((z) => Math.max(10, z - 10))}>
							<ZoomOut className='w-5 h-5' />
						</button>
						<button
							className='w-10 h-10 rounded-lg flex items-center justify-center text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors'
							title='Fullscreen'>
							<Maximize className='w-5 h-5' />
						</button>
					</div>

					{/* Main Viewer Area */}
					<div className='flex-1 flex flex-col'>
						{/* Viewer Toolbar */}
						<div className='bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-2 flex items-center justify-between'>
							<div className='flex items-center space-x-4'>
								<div className='flex items-center space-x-2'>
									{viewModes.map((mode) => {
										const Icon = mode.icon;
										return (
											<button
												key={mode.id}
												onClick={() => setCurrentView(mode.id)}
												className={`flex items-center space-x-2 px-3 py-1 rounded-md text-sm transition-colors ${
													currentView === mode.id ?
														"bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300"
													:	"text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
												}`}>
												<Icon className='w-4 h-4' />
												<span className='hidden sm:inline'>{mode.name}</span>
											</button>
										);
									})}
								</div>
								<div className='flex items-center space-x-2'>
									<span className='text-sm text-gray-600 dark:text-gray-400'>Zoom:</span>
									<span className='text-sm font-medium text-gray-900 dark:text-white'>{zoomLevel}%</span>
								</div>
							</div>
							<div className='flex items-center space-x-2'>
								<button
									className='flex items-center space-x-2 px-3 py-1 rounded-md text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
									onClick={loadInitial}>
									<RefreshCw className='w-4 h-4' />
									<span>Refresh</span>
								</button>
								<button className='flex items-center space-x-2 px-3 py-1 rounded-md text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'>
									<Settings className='w-4 h-4' />
									<span>Settings</span>
								</button>
							</div>
						</div>

						{/* Dashboard Preview */}
						<div className='flex-1 bg-gray-100 dark:bg-gray-900 p-8 overflow-auto'>
							<div className={`${getViewportClass()} transition-all duration-300`}>
								<Card className='bg-white dark:bg-gray-800 shadow-lg border-0'>
									<CardHeader className='border-b border-gray-200 dark:border-gray-700'>
										<div className='flex items-center justify-between'>
											<div>
												<CardTitle className='text-xl font-bold text-gray-900 dark:text-white'>Live Devices</CardTitle>
												<p className='text-sm text-gray-500 dark:text-gray-400 mt-1'>Last update: {lastUpdatedText}</p>
											</div>
											<Badge className='bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'>Live</Badge>
										</div>
									</CardHeader>
									<CardContent className='p-6'>
										{/* Device selector */}
										<div className='mb-4'>
											<label className='text-xs text-gray-600 dark:text-gray-400 mr-2'>Device:</label>
											<select
												value={selectedDeviceId || ""}
												onChange={(e) => setSelectedDeviceId(e.target.value)}
												className='px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white'>
												{devices.map((d) => (
													<option
														key={d.deviceId}
														value={d.deviceId}>
														{d.name || d.deviceId}
													</option>
												))}
											</select>
										</div>

										<div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4'>
											{devices.map((d) => (
												<Card
													key={d.deviceId}
													className='border-0 shadow-sm hover:shadow-md transition-shadow duration-200'>
													<CardContent className='p-4'>
														<div className='flex items-center justify-between mb-2'>
															<h3 className='text-sm font-medium text-gray-600 dark:text-gray-400'>{d.name || d.deviceId}</h3>
															<Badge
																className={`${
																	d.status?.isOnline ?
																		"bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
																	:	"bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
																}`}>
																{d.status?.isOnline ? "online" : "offline"}
															</Badge>
														</div>
														<div className='flex items-center space-x-2'>
															<div className={`w-3 h-3 rounded-full ${d.status?.isOnline ? "bg-green-500" : "bg-gray-400"}`} />
															<p className='text-2xl font-bold text-gray-900 dark:text-white'>{formatDeviceValue(d.deviceId)}</p>
														</div>
													</CardContent>
												</Card>
											))}
										</div>

										{/* Chart Area */}
										<div className='mt-6'>
											<Card className='border-0 shadow-sm'>
												<CardHeader>
													<CardTitle className='text-lg font-semibold text-gray-900 dark:text-white'>
														Data Trends {selectedDeviceId ? `- ${selectedDeviceId}` : ""}
													</CardTitle>
												</CardHeader>
												<CardContent>
													<div className='h-64 rounded-lg'>
														<LiveChart
															data={chartData}
															height={240}
															title='First numeric sensor'
														/>
													</div>
												</CardContent>
											</Card>
										</div>
									</CardContent>
								</Card>
							</div>
						</div>
					</div>

					{/* Right Info Panel */}
					<div className='w-64 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 p-4'>
						<h3 className='text-lg font-semibold text-gray-900 dark:text-white mb-4'>Dashboard Info</h3>

						<div className='space-y-4'>
							<div>
								<h4 className='text-sm font-medium text-gray-900 dark:text-white mb-2'>Properties</h4>
								<div className='space-y-2 text-sm'>
									<div className='flex justify-between'>
										<span className='text-gray-600 dark:text-gray-400'>Devices:</span>
										<span className='text-gray-900 dark:text-white'>{devices.length}</span>
									</div>
									<div className='flex justify-between'>
										<span className='text-gray-600 dark:text-gray-400'>Selected:</span>
										<span className='text-gray-900 dark:text-white'>{selectedDeviceId || "—"}</span>
									</div>
									<div className='flex justify-between'>
										<span className='text-gray-600 dark:text-gray-400'>Last Update:</span>
										<span className='text-gray-900 dark:text-white'>{lastUpdatedText}</span>
									</div>
								</div>
							</div>

							<div>
								<h4 className='text-sm font-medium text-gray-900 dark:text-white mb-2'>View Settings</h4>
								<div className='space-y-2'>
									<div>
										<label className='text-xs text-gray-600 dark:text-gray-400'>Auto Refresh</label>
										<select
											className='w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white'
											disabled>
											<option>WebSocket Live</option>
										</select>
									</div>
									<div>
										<label className='text-xs text-gray-600 dark:text-gray-400'>Theme</label>
										<select className='w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white'>
											<option>Light</option>
											<option>Dark</option>
											<option>Auto</option>
										</select>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</main>
		</div>
	);
};

export default ViewerPage;
