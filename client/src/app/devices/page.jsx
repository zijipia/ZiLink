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

	const loadDevices = async () => {
		try {
			setIsLoading(true);
			// Mock data for now
			setDevices([
				{
					id: "1",
					name: "ESP32 Sensor 1",
					type: "Temperature Sensor",
					status: { isOnline: true, lastSeen: new Date().toISOString(), battery: { level: 85 } },
					sensors: { temperature: 25.3, humidity: 60 },
					network: { signal: "Strong" },
					location: "Living Room",
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
					type: "Smart Switch",
					status: { isOnline: false, lastSeen: new Date().toISOString(), battery: { level: 20 } },
					sensors: { temperature: 22.1, humidity: 55 },
					network: { signal: "Weak" },
					location: "Kitchen",
					recentData: [
						{ time: "14:00", value: 21 },
						{ time: "14:15", value: 21.5 },
						{ time: "14:30", value: 22 },
						{ time: "14:45", value: 22.2 },
						{ time: "15:00", value: 22.1 },
					],
				},
				{
					id: "3",
					name: "Arduino Motion Detector",
					type: "Motion Sensor",
					status: { isOnline: true, lastSeen: new Date().toISOString(), battery: { level: 95 } },
					sensors: { temperature: 23.5, humidity: 58 },
					network: { signal: "Strong" },
					location: "Hallway",
					recentData: [
						{ time: "08:00", value: 0 },
						{ time: "08:30", value: 1 },
						{ time: "09:00", value: 0 },
						{ time: "09:30", value: 1 },
						{ time: "10:00", value: 0 },
					],
				},
			]);
		} catch (error) {
			console.error("Failed to load devices:", error);
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

	const handleControl = (deviceId, command) => {
		console.log(`Sending command ${command} to device ${deviceId}`);
		// Implement device control logic
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
		</div>
	);
};

export default DevicesPage;
