"use client";

import React, { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SkeletonDashboard } from "@/components/ui/Skeleton";
import Sidebar from "@/components/Sidebar";
import {
	Activity,
	Terminal,
	Play,
	Pause,
	Square,
	RotateCcw,
	Download,
	Trash2,
	Filter,
	Search,
	Menu,
	LogOut,
	RefreshCw,
	Settings,
	AlertTriangle,
	Info,
	CheckCircle,
	XCircle,
	Clock,
} from "lucide-react";

const ConsolePage = () => {
	const { user, logout, isAuthenticated, isLoading: authLoading } = useAuth();
	const [isLoading, setIsLoading] = useState(true);
	const [sidebarOpen, setSidebarOpen] = useState(true);
	const [logs, setLogs] = useState([]);
	const [filterLevel, setFilterLevel] = useState("all");
	const [searchTerm, setSearchTerm] = useState("");
	const [isAutoScroll, setIsAutoScroll] = useState(true);
	const [isPaused, setIsPaused] = useState(false);
	const consoleRef = useRef(null);
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

	const logLevels = [
		{ id: "all", name: "All", color: "gray", icon: Activity },
		{ id: "info", name: "Info", color: "blue", icon: Info },
		{ id: "success", name: "Success", color: "green", icon: CheckCircle },
		{ id: "warning", name: "Warning", color: "yellow", icon: AlertTriangle },
		{ id: "error", name: "Error", color: "red", icon: XCircle },
	];

	// Mock log data
	const mockLogs = [
		{ id: 1, timestamp: new Date(), level: "info", message: "Device ESP32-001 connected successfully", source: "device-manager" },
		{
			id: 2,
			timestamp: new Date(Date.now() - 1000),
			level: "success",
			message: "Temperature sensor calibration completed",
			source: "sensor-service",
		},
		{
			id: 3,
			timestamp: new Date(Date.now() - 2000),
			level: "warning",
			message: "High humidity detected in kitchen sensor",
			source: "alert-system",
		},
		{
			id: 4,
			timestamp: new Date(Date.now() - 3000),
			level: "error",
			message: "Failed to connect to MQTT broker",
			source: "mqtt-client",
		},
		{
			id: 5,
			timestamp: new Date(Date.now() - 4000),
			level: "info",
			message: "Dashboard data updated",
			source: "dashboard-service",
		},
		{
			id: 6,
			timestamp: new Date(Date.now() - 5000),
			level: "success",
			message: "User authentication successful",
			source: "auth-service",
		},
		{
			id: 7,
			timestamp: new Date(Date.now() - 6000),
			level: "warning",
			message: "Battery level low on device ESP32-002",
			source: "device-monitor",
		},
		{
			id: 8,
			timestamp: new Date(Date.now() - 7000),
			level: "info",
			message: "WebSocket connection established",
			source: "websocket-service",
		},
		{
			id: 9,
			timestamp: new Date(Date.now() - 8000),
			level: "error",
			message: "Database connection timeout",
			source: "database-service",
		},
		{
			id: 10,
			timestamp: new Date(Date.now() - 9000),
			level: "success",
			message: "Data backup completed successfully",
			source: "backup-service",
		},
	];

	useEffect(() => {
		if (!authLoading && !isAuthenticated) {
			router.push("/auth/login");
			return;
		}

		if (isAuthenticated) {
			loadConsoleData();
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

	// Auto-scroll effect
	useEffect(() => {
		if (isAutoScroll && consoleRef.current) {
			consoleRef.current.scrollTop = consoleRef.current.scrollHeight;
		}
	}, [logs, isAutoScroll]);

	// Simulate real-time logs
	useEffect(() => {
		if (!isPaused) {
			const interval = setInterval(() => {
				const newLog = mockLogs[Math.floor(Math.random() * mockLogs.length)];
				setLogs((prev) => [
					...prev,
					{
						...newLog,
						id: Date.now(),
						timestamp: new Date(),
					},
				]);
			}, 2000);

			return () => clearInterval(interval);
		}
	}, [isPaused]);

	const loadConsoleData = async () => {
		try {
			setIsLoading(true);
			// Initialize with some logs
			setLogs(mockLogs);
			await new Promise((resolve) => setTimeout(resolve, 1000));
		} catch (error) {
			console.error("Failed to load console data:", error);
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

	const clearLogs = () => {
		setLogs([]);
	};

	const exportLogs = () => {
		const logText = logs
			.map((log) => `[${log.timestamp.toISOString()}] [${log.level.toUpperCase()}] [${log.source}] ${log.message}`)
			.join("\n");

		const blob = new Blob([logText], { type: "text/plain" });
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = `console-logs-${new Date().toISOString().split("T")[0]}.txt`;
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(url);
	};

	const filteredLogs = logs.filter((log) => {
		const matchesLevel = filterLevel === "all" || log.level === filterLevel;
		const matchesSearch =
			searchTerm === "" ||
			log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
			log.source.toLowerCase().includes(searchTerm.toLowerCase());
		return matchesLevel && matchesSearch;
	});

	const getLogIcon = (level) => {
		const levelConfig = logLevels.find((l) => l.id === level);
		const Icon = levelConfig?.icon || Activity;
		return Icon;
	};

	const getLogColor = (level) => {
		const levelConfig = logLevels.find((l) => l.id === level);
		return levelConfig?.color || "gray";
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
										<Terminal className='w-6 h-6 text-white' />
									</div>
									<div>
										<h1 className='text-2xl font-bold text-gray-900 dark:text-white'>Console</h1>
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
									<Terminal className='w-6 h-6 text-white' />
								</div>
								<div>
									<h1 className='text-2xl font-bold text-gray-900 dark:text-white'>System Console</h1>
									<p className='text-sm text-gray-500 dark:text-gray-400'>Monitor system logs and events</p>
								</div>
							</div>
							<div className='flex items-center space-x-2'>
								<button
									onClick={() => setIsPaused(!isPaused)}
									className={`flex items-center space-x-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
										isPaused ?
											"bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-300"
										:	"bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300"
									}`}>
									{isPaused ?
										<Play className='w-4 h-4' />
									:	<Pause className='w-4 h-4' />}
									<span className='hidden sm:inline'>{isPaused ? "Resume" : "Pause"}</span>
								</button>
								<button
									onClick={clearLogs}
									className='flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors'>
									<Trash2 className='w-4 h-4' />
									<span className='hidden sm:inline'>Clear</span>
								</button>
								<button
									onClick={exportLogs}
									className='flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors'>
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

				<div className='px-4 sm:px-6 lg:px-8 py-6'>
					<motion.div
						variants={containerVariants}
						initial='hidden'
						animate='visible'
						className='space-y-6'>
						{/* Controls */}
						<motion.div
							variants={itemVariants}
							className='flex flex-col sm:flex-row gap-4'>
							<div className='flex-1 relative'>
								<Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4' />
								<input
									type='text'
									placeholder='Search logs...'
									value={searchTerm}
									onChange={(e) => setSearchTerm(e.target.value)}
									className='w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent'
								/>
							</div>
							<select
								value={filterLevel}
								onChange={(e) => setFilterLevel(e.target.value)}
								className='px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent'>
								{logLevels.map((level) => (
									<option
										key={level.id}
										value={level.id}>
										{level.name}
									</option>
								))}
							</select>
							<label className='flex items-center space-x-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 cursor-pointer'>
								<input
									type='checkbox'
									checked={isAutoScroll}
									onChange={(e) => setIsAutoScroll(e.target.checked)}
									className='rounded'
								/>
								<span className='text-sm text-gray-700 dark:text-gray-300'>Auto-scroll</span>
							</label>
						</motion.div>

						{/* Log Statistics */}
						<motion.div
							variants={itemVariants}
							className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4'>
							{logLevels.map((level) => {
								const count = logs.filter((log) => level.id === "all" || log.level === level.id).length;
								const Icon = level.icon;
								return (
									<Card
										key={level.id}
										className='bg-white dark:bg-gray-800 border-0 shadow-sm hover:shadow-md transition-shadow duration-200'>
										<CardContent className='p-4'>
											<div className='flex items-center justify-between'>
												<div>
													<p className='text-sm font-medium text-gray-600 dark:text-gray-400'>{level.name}</p>
													<p className='text-2xl font-bold text-gray-900 dark:text-white'>{count}</p>
												</div>
												<Icon className={`h-8 w-8 text-${level.color}-600 dark:text-${level.color}-400`} />
											</div>
										</CardContent>
									</Card>
								);
							})}
						</motion.div>

						{/* Console Output */}
						<motion.div variants={itemVariants}>
							<Card className='bg-white dark:bg-gray-800 border-0 shadow-sm'>
								<CardHeader className='border-b border-gray-200 dark:border-gray-700'>
									<div className='flex items-center justify-between'>
										<CardTitle className='text-lg font-semibold text-gray-900 dark:text-white'>Console Output</CardTitle>
										<div className='flex items-center space-x-2'>
											<Badge className='bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'>
												{filteredLogs.length} logs
											</Badge>
											{isPaused && (
												<Badge className='bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'>Paused</Badge>
											)}
										</div>
									</div>
								</CardHeader>
								<CardContent className='p-0'>
									<div
										ref={consoleRef}
										className='h-96 overflow-y-auto bg-gray-900 text-green-400 font-mono text-sm p-4'>
										{filteredLogs.length === 0 ?
											<div className='text-center text-gray-500 py-8'>
												<Terminal className='w-12 h-12 mx-auto mb-2 opacity-50' />
												<p>No logs found</p>
											</div>
										:	filteredLogs.map((log) => {
												const Icon = getLogIcon(log.level);
												const color = getLogColor(log.level);
												return (
													<div
														key={log.id}
														className='flex items-start space-x-3 py-1 hover:bg-gray-800 rounded px-2 -mx-2'>
														<div className='flex-shrink-0 mt-0.5'>
															<Icon className={`w-4 h-4 text-${color}-400`} />
														</div>
														<div className='flex-1 min-w-0'>
															<div className='flex items-center space-x-2 text-xs text-gray-400 mb-1'>
																<span>{log.timestamp.toLocaleTimeString()}</span>
																<span className='text-gray-600'>|</span>
																<span className={`text-${color}-400 font-medium`}>{log.level.toUpperCase()}</span>
																<span className='text-gray-600'>|</span>
																<span className='text-blue-400'>{log.source}</span>
															</div>
															<p className='text-green-400 break-words'>{log.message}</p>
														</div>
													</div>
												);
											})
										}
									</div>
								</CardContent>
							</Card>
						</motion.div>
					</motion.div>
				</div>
			</main>
		</div>
	);
};

export default ConsolePage;
