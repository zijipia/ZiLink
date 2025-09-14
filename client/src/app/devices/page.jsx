"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DeviceCard } from "@/components/ui/DeviceCard";
import { SkeletonDashboard } from "@/components/ui/Skeleton";
import Sidebar from "@/components/Sidebar";
import apiService from "@/lib/api";
import websocketService from "@/lib/websocket";
import { toast } from "react-hot-toast";
import {
	Activity,
	Wifi,
	Battery,
	Server,
	Menu,
	LogOut,
	Plus,
	Search,
	Filter,
	MoreVertical,
	Edit,
	Trash2,
	Power,
	RefreshCw,
} from "lucide-react";

const DevicesPage = () => {
	const { user, logout, isAuthenticated, isLoading: authLoading } = useAuth();
	const [devices, setDevices] = useState([]);
	const [isLoading, setIsLoading] = useState(true);
	const [sidebarOpen, setSidebarOpen] = useState(true);
	const [searchTerm, setSearchTerm] = useState("");
	const [filterStatus, setFilterStatus] = useState("all");
	const [detailModal, setDetailModal] = useState({ open: false, loading: false, deviceId: null, device: null, token: null });
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
			loadDevices();
		}
	}, [isAuthenticated, authLoading, router]);

	// Listen for live device data over WebSocket and update UI
	useEffect(() => {
		if (!isAuthenticated) return;

		const onDeviceData = (msg) => {
			const { deviceId, sensorData, timestamp } = msg || {};
			if (!deviceId) return;
			setDevices((prev) =>
				prev.map((d) => {
					if (d.id !== deviceId) return d;
					const sensorMap =
						Array.isArray(sensorData) ?
							sensorData.reduce((acc, s) => {
								if (s && s.type && typeof s.value !== "undefined") {
									acc[s.type] = s.value;
								}
								return acc;
							}, {})
						:	{};
					return {
						...d,
						sensors: {
							...d.sensors,
							temperature: sensorMap.temperature ?? d.sensors?.temperature,
							humidity: sensorMap.humidity ?? d.sensors?.humidity,
						},
						status: {
							...d.status,
							isOnline: true,
							lastSeen: timestamp || new Date().toISOString(),
						},
					};
				}),
			);
		};

		const onDeviceOnline = ({ deviceId, timestamp }) => {
			if (!deviceId) return;
			setDevices((prev) =>
				prev.map((d) =>
					d.id === deviceId ? { ...d, status: { ...d.status, isOnline: true, lastSeen: timestamp || d.status?.lastSeen } } : d,
				),
			);
		};

		const onDeviceOffline = ({ deviceId, timestamp }) => {
			if (!deviceId) return;
			setDevices((prev) =>
				prev.map((d) =>
					d.id === deviceId ? { ...d, status: { ...d.status, isOnline: false, lastSeen: timestamp || d.status?.lastSeen } } : d,
				),
			);
		};

		websocketService.on("device_data", onDeviceData);
		websocketService.on("device_online", onDeviceOnline);
		websocketService.on("device_offline", onDeviceOffline);
		return () => {
			websocketService.off("device_data", onDeviceData);
			websocketService.off("device_online", onDeviceOnline);
			websocketService.off("device_offline", onDeviceOffline);
		};
	}, [isAuthenticated]);

	// Handle sidebar visibility based on screen size
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

	// Map RSSI (dBm) to signal label
	const rssiToSignal = (rssi) => {
		if (typeof rssi !== "number") return "N/A";
		if (rssi >= -60) return "Strong";
		if (rssi >= -75) return "Medium";
		return "Weak";
	};

	const openDetails = async (deviceId) => {
		try {
			setDetailModal({ open: true, loading: true, deviceId, device: null, token: null });
			const { device } = await apiService.getDevice(deviceId);
			// Use current user access token for device auth (user token + deviceId)
			const userToken = apiService.getAccessToken();
			setDetailModal({ open: true, loading: false, deviceId, device, token: userToken });
		} catch (e) {
			console.error("Load device details failed", e);
			toast.error("Failed to load device details");
			setDetailModal((d) => ({ ...d, loading: false }));
		}
	};

	const closeDetails = () => setDetailModal({ open: false, loading: false, deviceId: null, device: null, token: null });

	const deleteCurrentDevice = async () => {
		const id = detailModal.deviceId;
		if (!id) return;
		if (!confirm("Delete this device? This action cannot be undone.")) return;
		try {
			setDetailModal((m) => ({ ...m, loading: true }));
			await apiService.deleteDevice(id);
			toast.success("Device deleted");
			setDevices((prev) => prev.filter((d) => d.id !== id));
			closeDetails();
		} catch (e) {
			console.error("Delete device failed", e);
			const msg = e?.response?.data?.message || e?.message || "Failed to delete device";
			toast.error(msg);
			setDetailModal((m) => ({ ...m, loading: false }));
		}
	};

	const loadDevices = async () => {
		try {
			setIsLoading(true);
			const { devices: apiDevices } = await apiService.getDevices();
			let mapped = (apiDevices || [])
				.filter((d) => d.isActive !== false)
				.map((d) => ({
					id: d.deviceId,
					name: d.name,
					type: d.category || d.type || "device",
					status: {
						isOnline: !!d.status?.isOnline,
						lastSeen: d.status?.lastSeen || d.updatedAt,
						battery: d.status?.battery || {},
					},
					sensors: {},
					network: { signal: rssiToSignal(d.network?.signalStrength) },
					location: d.location?.name || "Unknown",
				}));

			setDevices(mapped);
			// Subscribe to device updates (optional; server currently broadcasts to all web clients)
			try {
				mapped.forEach((dev) => websocketService.subscribeToDevice(dev.id));
			} catch (_) {}

			// Hydrate with latest sensor values (limit=1) for quick snapshot
			try {
				const updates = await Promise.all(
					mapped.map(async (dev) => {
						try {
							const latest = await apiService.getDeviceData(dev.id, { limit: 1 });
							const item = latest?.data?.[0];
							if (!item) return dev;
							const sensorMap =
								Array.isArray(item.sensors) ?
									item.sensors.reduce((acc, s) => {
										if (s && s.type && typeof s.value !== "undefined") acc[s.type] = s.value;
										return acc;
									}, {})
								:	{};
							return {
								...dev,
								sensors: {
									...dev.sensors,
									temperature: sensorMap.temperature ?? dev.sensors?.temperature,
									humidity: sensorMap.humidity ?? dev.sensors?.humidity,
								},
								status: {
									...dev.status,
									lastSeen: item.timestamp || dev.status.lastSeen,
								},
							};
						} catch (_) {
							return dev;
						}
					}),
				);
				setDevices(updates);
			} catch (hydrateErr) {
				console.warn("Hydrate latest sensors failed", hydrateErr);
			}
		} catch (error) {
			console.error("Failed to load devices", error);
			toast.error("Failed to load devices");
		} finally {
			setIsLoading(false);
		}
	};

	const handleLogout = async () => {
		try {
			await logout();
		} catch (error) {
			console.error("Logout error:", error);
		}
	};

	const handleControl = async (deviceId, command) => {
		try {
			const sent = websocketService.sendDeviceCommand(deviceId, command);
			if (!sent) {
				await apiService.sendDeviceCommand(deviceId, command);
			}
			toast.success("Command sent");
		} catch (err) {
			console.error("Send command failed", err);
			toast.error("Failed to send command");
		}
	};

	const filteredDevices = devices.filter((device) => {
		const matchesSearch =
			device.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
			device.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
			device.location.toLowerCase().includes(searchTerm.toLowerCase());

		const matchesFilter =
			filterStatus === "all" ||
			(filterStatus === "online" && device.status.isOnline) ||
			(filterStatus === "offline" && !device.status.isOnline);

		return matchesSearch && matchesFilter;
	});

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
										<Wifi className='w-6 h-6 text-white' />
									</div>
									<div>
										<h1 className='text-2xl font-bold text-gray-900 dark:text-white'>Devices</h1>
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
									<Wifi className='w-6 h-6 text-white' />
								</div>
								<div>
									<h1 className='text-2xl font-bold text-gray-900 dark:text-white'>Devices</h1>
									<p className='text-sm text-gray-500 dark:text-gray-400'>Manage your IoT devices</p>
								</div>
							</div>
							<div className='flex items-center space-x-4'>
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
						className='space-y-6'>
						{/* Search and Filter */}
						<motion.div
							variants={itemVariants}
							className='flex flex-col sm:flex-row gap-4'>
							<div className='flex-1 relative'>
								<Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4' />
								<input
									type='text'
									placeholder='Search devices...'
									value={searchTerm}
									onChange={(e) => setSearchTerm(e.target.value)}
									className='w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent'
								/>
							</div>
							<select
								value={filterStatus}
								onChange={(e) => setFilterStatus(e.target.value)}
								className='px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent'>
								<option value='all'>All Devices</option>
								<option value='online'>Online</option>
								<option value='offline'>Offline</option>
							</select>
							<Link
								href='/devices/new'
								className='inline-flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-4 py-2 rounded-lg hover:from-blue-700 hover:to-cyan-700 transition-all duration-200 shadow-sm hover:shadow-md'>
								<Plus className='w-4 h-4' />
								<span>Add Device</span>
							</Link>
						</motion.div>

						{/* Stats Cards */}
						<motion.div
							variants={itemVariants}
							className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4'>
							<Card className='bg-white dark:bg-gray-800 border-0 shadow-sm hover:shadow-md transition-shadow duration-200'>
								<CardContent className='p-4'>
									<div className='flex items-center justify-between'>
										<div>
											<p className='text-sm font-medium text-gray-600 dark:text-gray-400'>Total Devices</p>
											<p className='text-2xl font-bold text-gray-900 dark:text-white'>{devices.length}</p>
										</div>
										<Activity className='h-8 w-8 text-blue-600 dark:text-blue-400' />
									</div>
								</CardContent>
							</Card>

							<Card className='bg-white dark:bg-gray-800 border-0 shadow-sm hover:shadow-md transition-shadow duration-200'>
								<CardContent className='p-4'>
									<div className='flex items-center justify-between'>
										<div>
											<p className='text-sm font-medium text-gray-600 dark:text-gray-400'>Online</p>
											<p className='text-2xl font-bold text-green-600 dark:text-green-400'>
												{devices.filter((d) => d.status.isOnline).length}
											</p>
										</div>
										<Wifi className='h-8 w-8 text-green-600 dark:text-green-400' />
									</div>
								</CardContent>
							</Card>

							<Card className='bg-white dark:bg-gray-800 border-0 shadow-sm hover:shadow-md transition-shadow duration-200'>
								<CardContent className='p-4'>
									<div className='flex items-center justify-between'>
										<div>
											<p className='text-sm font-medium text-gray-600 dark:text-gray-400'>Offline</p>
											<p className='text-2xl font-bold text-red-600 dark:text-red-400'>
												{devices.filter((d) => !d.status.isOnline).length}
											</p>
										</div>
										<Battery className='h-8 w-8 text-red-600 dark:text-red-400' />
									</div>
								</CardContent>
							</Card>

							<Card className='bg-white dark:bg-gray-800 border-0 shadow-sm hover:shadow-md transition-shadow duration-200'>
								<CardContent className='p-4'>
									<div className='flex items-center justify-between'>
										<div>
											<p className='text-sm font-medium text-gray-600 dark:text-gray-400'>Locations</p>
											<p className='text-2xl font-bold text-blue-600 dark:text-blue-400'>
												{new Set(devices.map((d) => d.location)).size}
											</p>
										</div>
										<Server className='h-8 w-8 text-blue-600 dark:text-blue-400' />
									</div>
								</CardContent>
							</Card>
						</motion.div>

						{/* Devices Grid */}
						<motion.div variants={itemVariants}>
							<div className='grid grid-cols-1 xl:grid-cols-2 gap-6'>
								{filteredDevices.map((device) => (
									<motion.div
										key={device.id}
										variants={itemVariants}
										whileHover={{ scale: 1.02 }}
										transition={{ duration: 0.2 }}>
										<DeviceCard
											device={device}
											onControl={handleControl}
											onDetails={openDetails}
										/>
									</motion.div>
								))}
								{filteredDevices.length === 0 && (
									<motion.div
										variants={itemVariants}
										className='col-span-full text-center py-16 bg-gray-50 dark:bg-gray-800 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600'>
										<div className='w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4'>
											<Wifi className='w-8 h-8 text-gray-400' />
										</div>
										<h3 className='text-lg font-semibold text-gray-900 dark:text-white mb-2'>
											{searchTerm || filterStatus !== "all" ? "No devices found" : "No devices yet"}
										</h3>
										<p className='text-gray-500 dark:text-gray-400 mb-6 max-w-md mx-auto'>
											{searchTerm || filterStatus !== "all" ?
												"Try adjusting your search or filter criteria."
											:	"Get started by adding your first IoT device to begin monitoring and controlling your smart environment."}
										</p>
										{!searchTerm && filterStatus === "all" && (
											<Link
												href='/devices/new'
												className='inline-flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-6 py-3 rounded-lg hover:from-blue-700 hover:to-cyan-700 transition-all duration-200 shadow-sm hover:shadow-md'>
												<Plus className='w-4 h-4' />
												<span>Add First Device</span>
											</Link>
										)}
									</motion.div>
								)}
							</div>
						</motion.div>
					</motion.div>
				</div>
			</main>
			{/* Details Modal */}
			{detailModal.open && (
				<div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4'>
					<div className='w-full max-w-lg bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700'>
						<div className='px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between'>
							<h3 className='text-lg font-semibold text-gray-900 dark:text-white'>Device Details</h3>
							<button
								onClick={closeDetails}
								className='text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white'>
								✕
							</button>
						</div>
						<div className='px-6 py-4 space-y-3'>
							{detailModal.loading ?
								<p className='text-sm text-gray-500 dark:text-gray-400'>Loading...</p>
							:	<>
									<div>
										<p className='text-xs text-gray-500 dark:text-gray-400'>Name</p>
										<p className='text-sm font-medium text-gray-900 dark:text-white'>
											{detailModal.device?.name || detailModal.deviceId}
										</p>
									</div>
									<div>
										<div className='flex items-center justify-between'>
											<p className='text-xs text-gray-500 dark:text-gray-400'>DEVICE_ID</p>
											<button
												onClick={() => navigator.clipboard?.writeText(detailModal.deviceId || "")}
												className='text-xs text-blue-600 dark:text-blue-400 hover:underline'>
												Copy
											</button>
										</div>
										<p className='break-all text-sm font-mono text-gray-800 dark:text-gray-200'>{detailModal.deviceId}</p>
									</div>
									<div>
										<div className='flex items-center justify-between'>
											<p className='text-xs text-gray-500 dark:text-gray-400'>USER_TOKEN</p>
											<button
												onClick={() => navigator.clipboard?.writeText(detailModal.token || "")}
												className='text-xs text-blue-600 dark:text-blue-400 hover:underline'>
												Copy
											</button>
										</div>
										<p className='break-all text-xs font-mono text-gray-800 dark:text-gray-200'>
											{detailModal.token || "(no token)"}
										</p>
									</div>
								</>
							}
						</div>
						<div className='px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between'>
							<button
								onClick={closeDetails}
								className='px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600'>
								Close
							</button>
							<button
								onClick={deleteCurrentDevice}
								className='px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700'>
								Delete Device
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
};

export default DevicesPage;
