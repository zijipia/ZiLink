"use client";

import React, { useEffect, useState } from "react";
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

const ViewerPage = () => {
	const { user, logout, isAuthenticated, isLoading: authLoading } = useAuth();
	const [isLoading, setIsLoading] = useState(true);
	const [sidebarOpen, setSidebarOpen] = useState(true);
	const [isPlaying, setIsPlaying] = useState(false);
	const [currentView, setCurrentView] = useState("desktop");
	const [zoomLevel, setZoomLevel] = useState(100);
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

	const mockDashboardData = {
		title: "Smart Home Dashboard",
		lastUpdated: "2 minutes ago",
		devices: [
			{ id: 1, name: "Living Room Temp", value: "24.5°C", status: "online", color: "blue" },
			{ id: 2, name: "Kitchen Humidity", value: "58%", status: "online", color: "green" },
			{ id: 3, name: "Bedroom Light", value: "Off", status: "offline", color: "gray" },
			{ id: 4, name: "Garage Door", value: "Closed", status: "online", color: "purple" },
		],
	};

	useEffect(() => {
		if (!authLoading && !isAuthenticated) {
			router.push("/auth/login");
			return;
		}

		if (isAuthenticated) {
			loadViewerData();
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

	const loadViewerData = async () => {
		try {
			setIsLoading(true);
			// Mock loading delay
			await new Promise((resolve) => setTimeout(resolve, 1000));
		} catch (error) {
			console.error("Failed to load viewer data:", error);
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
									<p className='text-sm text-gray-500 dark:text-gray-400'>Preview and share dashboards</p>
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
							onClick={() => setIsPlaying(!isPlaying)}
							className='w-10 h-10 rounded-lg flex items-center justify-center bg-blue-600 text-white hover:bg-blue-700 transition-colors'
							title={isPlaying ? "Pause" : "Play"}>
							{isPlaying ?
								<Pause className='w-5 h-5' />
							:	<Play className='w-5 h-5' />}
						</button>
						<button
							className='w-10 h-10 rounded-lg flex items-center justify-center text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors'
							title='Stop'>
							<Square className='w-5 h-5' />
						</button>
						<button
							className='w-10 h-10 rounded-lg flex items-center justify-center text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors'
							title='Reset'>
							<RotateCcw className='w-5 h-5' />
						</button>
						<div className='w-8 h-px bg-gray-200 dark:bg-gray-700 my-2' />
						<button
							className='w-10 h-10 rounded-lg flex items-center justify-center text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors'
							title='Zoom In'>
							<ZoomIn className='w-5 h-5' />
						</button>
						<button
							className='w-10 h-10 rounded-lg flex items-center justify-center text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors'
							title='Zoom Out'>
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
								<button className='flex items-center space-x-2 px-3 py-1 rounded-md text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'>
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
												<CardTitle className='text-xl font-bold text-gray-900 dark:text-white'>
													{mockDashboardData.title}
												</CardTitle>
												<p className='text-sm text-gray-500 dark:text-gray-400 mt-1'>
													Last updated: {mockDashboardData.lastUpdated}
												</p>
											</div>
											<Badge className='bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'>Live</Badge>
										</div>
									</CardHeader>
									<CardContent className='p-6'>
										<div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4'>
											{mockDashboardData.devices.map((device) => (
												<Card
													key={device.id}
													className='border-0 shadow-sm hover:shadow-md transition-shadow duration-200'>
													<CardContent className='p-4'>
														<div className='flex items-center justify-between mb-2'>
															<h3 className='text-sm font-medium text-gray-600 dark:text-gray-400'>{device.name}</h3>
															<Badge
																className={`${
																	device.status === "online" ?
																		"bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
																	:	"bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
																}`}>
																{device.status}
															</Badge>
														</div>
														<div className='flex items-center space-x-2'>
															<div className={`w-3 h-3 rounded-full bg-${device.color}-500`} />
															<p className='text-2xl font-bold text-gray-900 dark:text-white'>{device.value}</p>
														</div>
													</CardContent>
												</Card>
											))}
										</div>

										{/* Chart Area */}
										<div className='mt-6'>
											<Card className='border-0 shadow-sm'>
												<CardHeader>
													<CardTitle className='text-lg font-semibold text-gray-900 dark:text-white'>Data Trends</CardTitle>
												</CardHeader>
												<CardContent>
													<div className='h-64 bg-gray-50 dark:bg-gray-900 rounded-lg flex items-center justify-center'>
														<div className='text-center text-gray-500 dark:text-gray-400'>
															<Activity className='w-12 h-12 mx-auto mb-2 opacity-50' />
															<p>Real-time data chart will be displayed here</p>
														</div>
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
										<span className='text-gray-600 dark:text-gray-400'>Title:</span>
										<span className='text-gray-900 dark:text-white'>{mockDashboardData.title}</span>
									</div>
									<div className='flex justify-between'>
										<span className='text-gray-600 dark:text-gray-400'>Status:</span>
										<Badge className='bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400 text-xs'>Live</Badge>
									</div>
									<div className='flex justify-between'>
										<span className='text-gray-600 dark:text-gray-400'>Devices:</span>
										<span className='text-gray-900 dark:text-white'>{mockDashboardData.devices.length}</span>
									</div>
									<div className='flex justify-between'>
										<span className='text-gray-600 dark:text-gray-400'>Last Update:</span>
										<span className='text-gray-900 dark:text-white'>{mockDashboardData.lastUpdated}</span>
									</div>
								</div>
							</div>

							<div>
								<h4 className='text-sm font-medium text-gray-900 dark:text-white mb-2'>View Settings</h4>
								<div className='space-y-2'>
									<div>
										<label className='text-xs text-gray-600 dark:text-gray-400'>Auto Refresh</label>
										<select className='w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white'>
											<option>5 seconds</option>
											<option>10 seconds</option>
											<option>30 seconds</option>
											<option>1 minute</option>
											<option>Off</option>
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
