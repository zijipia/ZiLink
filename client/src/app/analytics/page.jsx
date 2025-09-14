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
	BarChart3,
	TrendingUp,
	TrendingDown,
	Menu,
	LogOut,
	Calendar,
	Download,
	Filter,
	RefreshCw,
	Eye,
	EyeOff,
} from "lucide-react";
import apiService from "@/lib/api";

const AnalyticsPage = () => {
	const { user, logout, isAuthenticated, isLoading: authLoading } = useAuth();
	const [isLoading, setIsLoading] = useState(true);
	const [sidebarOpen, setSidebarOpen] = useState(true);
	const [timeRange, setTimeRange] = useState("7d");
	const [showData, setShowData] = useState(true);
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
			loadAnalyticsData();
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

const [overview, setOverview] = useState({ totals: null, chart: [] });

const loadAnalyticsData = async () => {
	try {
		setIsLoading(true);
		const data = await apiService.getAnalyticsOverview(timeRange === "24h" ? "24h" : timeRange === "30d" ? "30d" : "7d");
		setOverview(data);
	} catch (error) {
		console.error("Failed to load analytics data:", error);
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

const analyticsData = overview.totals || { totalDataPoints: 0, averageTemperature: null, averageHumidity: null, deviceUptime: 0 };
const chartData = overview.chart || [];

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
										<BarChart3 className='w-6 h-6 text-white' />
									</div>
									<div>
										<h1 className='text-2xl font-bold text-gray-900 dark:text-white'>Analytics</h1>
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
									<BarChart3 className='w-6 h-6 text-white' />
								</div>
								<div>
									<h1 className='text-2xl font-bold text-gray-900 dark:text-white'>Analytics</h1>
									<p className='text-sm text-gray-500 dark:text-gray-400'>Data insights and trends</p>
								</div>
							</div>
							<div className='flex items-center space-x-4'>
								<button
									onClick={() => setShowData(!showData)}
									className='flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors'>
									{showData ?
										<EyeOff className='w-4 h-4' />
									:	<Eye className='w-4 h-4' />}
									<span className='hidden sm:inline'>{showData ? "Hide" : "Show"} Data</span>
								</button>
								<button
									onClick={loadAnalyticsData}
									className='flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors'>
									<RefreshCw className='w-4 h-4' />
									<span className='hidden sm:inline'>Refresh</span>
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
							className='flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between'>
							<div className='flex flex-col sm:flex-row gap-4'>
								<select
									value={timeRange}
									onChange={(e) => setTimeRange(e.target.value)}
									className='px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent'>
									<option value='24h'>Last 24 Hours</option>
									<option value='7d'>Last 7 Days</option>
									<option value='30d'>Last 30 Days</option>
									<option value='90d'>Last 90 Days</option>
								</select>
								<button className='flex items-center space-x-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors'>
									<Download className='w-4 h-4' />
									<span>Export Data</span>
								</button>
							</div>
							<div className='text-sm text-gray-500 dark:text-gray-400'>Last updated: {new Date().toLocaleString()}</div>
						</motion.div>

						{/* Key Metrics */}
						<motion.div
							variants={itemVariants}
							className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4'>
							<Card className='bg-white dark:bg-gray-800 border-0 shadow-sm hover:shadow-md transition-shadow duration-200'>
								<CardContent className='p-4'>
									<div className='flex items-center justify-between'>
										<div>
											<p className='text-sm font-medium text-gray-600 dark:text-gray-400'>Data Points</p>
											<p className='text-2xl font-bold text-gray-900 dark:text-white'>
												{analyticsData.totalDataPoints.toLocaleString()}
											</p>
											<div className='flex items-center mt-1'>
												<TrendingUp className='w-4 h-4 text-green-500 mr-1' />
												<span className='text-xs text-green-600 dark:text-green-400'>+12.5%</span>
											</div>
										</div>
										<Activity className='h-8 w-8 text-blue-600 dark:text-blue-400' />
									</div>
								</CardContent>
							</Card>

							<Card className='bg-white dark:bg-gray-800 border-0 shadow-sm hover:shadow-md transition-shadow duration-200'>
								<CardContent className='p-4'>
									<div className='flex items-center justify-between'>
										<div>
											<p className='text-sm font-medium text-gray-600 dark:text-gray-400'>Avg Temperature</p>
											<p className='text-2xl font-bold text-gray-900 dark:text-white'>{analyticsData.averageTemperature}°C</p>
											<div className='flex items-center mt-1'>
												<TrendingDown className='w-4 h-4 text-red-500 mr-1' />
												<span className='text-xs text-red-600 dark:text-red-400'>-2.1°C</span>
											</div>
										</div>
										<TrendingUp className='h-8 w-8 text-orange-600 dark:text-orange-400' />
									</div>
								</CardContent>
							</Card>

							<Card className='bg-white dark:bg-gray-800 border-0 shadow-sm hover:shadow-md transition-shadow duration-200'>
								<CardContent className='p-4'>
									<div className='flex items-center justify-between'>
										<div>
											<p className='text-sm font-medium text-gray-600 dark:text-gray-400'>Device Uptime</p>
											<p className='text-2xl font-bold text-gray-900 dark:text-white'>{analyticsData.deviceUptime}%</p>
											<div className='flex items-center mt-1'>
												<TrendingUp className='w-4 h-4 text-green-500 mr-1' />
												<span className='text-xs text-green-600 dark:text-green-400'>+0.8%</span>
											</div>
										</div>
										<BarChart3 className='h-8 w-8 text-green-600 dark:text-green-400' />
									</div>
								</CardContent>
							</Card>

							<Card className='bg-white dark:bg-gray-800 border-0 shadow-sm hover:shadow-md transition-shadow duration-200'>
								<CardContent className='p-4'>
									<div className='flex items-center justify-between'>
										<div>
											<p className='text-sm font-medium text-gray-600 dark:text-gray-400'>Alerts</p>
											<p className='text-2xl font-bold text-gray-900 dark:text-white'>{analyticsData.alertsGenerated}</p>
											<div className='flex items-center mt-1'>
												<TrendingDown className='w-4 h-4 text-green-500 mr-1' />
												<span className='text-xs text-green-600 dark:text-green-400'>-25%</span>
											</div>
										</div>
										<Activity className='h-8 w-8 text-red-600 dark:text-red-400' />
									</div>
								</CardContent>
							</Card>
						</motion.div>

						{/* Charts Section */}
						{showData && (
							<motion.div
								variants={itemVariants}
								className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
								{/* Temperature Chart */}
								<Card className='bg-white dark:bg-gray-800 border-0 shadow-sm hover:shadow-md transition-shadow duration-200'>
									<CardHeader>
										<CardTitle className='text-lg font-semibold text-gray-900 dark:text-white'>Temperature Trends</CardTitle>
									</CardHeader>
									<CardContent>
										<div className='h-64 bg-gray-50 dark:bg-gray-900 rounded-lg p-4 flex items-center justify-center'>
											<div className='text-center text-gray-500 dark:text-gray-400'>
												<BarChart3 className='w-12 h-12 mx-auto mb-2 opacity-50' />
												<p>Temperature chart will be displayed here</p>
											</div>
										</div>
									</CardContent>
								</Card>

								{/* Humidity Chart */}
								<Card className='bg-white dark:bg-gray-800 border-0 shadow-sm hover:shadow-md transition-shadow duration-200'>
									<CardHeader>
										<CardTitle className='text-lg font-semibold text-gray-900 dark:text-white'>Humidity Trends</CardTitle>
									</CardHeader>
									<CardContent>
										<div className='h-64 bg-gray-50 dark:bg-gray-900 rounded-lg p-4 flex items-center justify-center'>
											<div className='text-center text-gray-500 dark:text-gray-400'>
												<BarChart3 className='w-12 h-12 mx-auto mb-2 opacity-50' />
												<p>Humidity chart will be displayed here</p>
											</div>
										</div>
									</CardContent>
								</Card>

								{/* Device Activity */}
								<Card className='bg-white dark:bg-gray-800 border-0 shadow-sm hover:shadow-md transition-shadow duration-200'>
									<CardHeader>
										<CardTitle className='text-lg font-semibold text-gray-900 dark:text-white'>Device Activity</CardTitle>
									</CardHeader>
									<CardContent>
										<div className='h-64 bg-gray-50 dark:bg-gray-900 rounded-lg p-4 flex items-center justify-center'>
											<div className='text-center text-gray-500 dark:text-gray-400'>
												<Activity className='w-12 h-12 mx-auto mb-2 opacity-50' />
												<p>Device activity chart will be displayed here</p>
											</div>
										</div>
									</CardContent>
								</Card>

								{/* Network Performance */}
								<Card className='bg-white dark:bg-gray-800 border-0 shadow-sm hover:shadow-md transition-shadow duration-200'>
									<CardHeader>
										<CardTitle className='text-lg font-semibold text-gray-900 dark:text-white'>Network Performance</CardTitle>
									</CardHeader>
									<CardContent>
										<div className='h-64 bg-gray-50 dark:bg-gray-900 rounded-lg p-4 flex items-center justify-center'>
											<div className='text-center text-gray-500 dark:text-gray-400'>
												<TrendingUp className='w-12 h-12 mx-auto mb-2 opacity-50' />
												<p>Network performance chart will be displayed here</p>
											</div>
										</div>
									</CardContent>
								</Card>
							</motion.div>
						)}

						{/* Data Table */}
						<motion.div variants={itemVariants}>
							<Card className='bg-white dark:bg-gray-800 border-0 shadow-sm hover:shadow-md transition-shadow duration-200'>
								<CardHeader>
									<CardTitle className='text-lg font-semibold text-gray-900 dark:text-white'>Recent Data Points</CardTitle>
								</CardHeader>
								<CardContent>
									<div className='overflow-x-auto'>
										<table className='w-full text-sm'>
											<thead>
												<tr className='border-b border-gray-200 dark:border-gray-700'>
													<th className='text-left py-3 px-4 font-medium text-gray-600 dark:text-gray-400'>Time</th>
													<th className='text-left py-3 px-4 font-medium text-gray-600 dark:text-gray-400'>Temperature</th>
													<th className='text-left py-3 px-4 font-medium text-gray-600 dark:text-gray-400'>Humidity</th>
													<th className='text-left py-3 px-4 font-medium text-gray-600 dark:text-gray-400'>Devices</th>
													<th className='text-left py-3 px-4 font-medium text-gray-600 dark:text-gray-400'>Status</th>
												</tr>
											</thead>
											<tbody>
												{chartData.map((data, index) => (
													<tr
														key={index}
														className='border-b border-gray-100 dark:border-gray-800'>
														<td className='py-3 px-4 text-gray-900 dark:text-white'>{data.time}</td>
														<td className='py-3 px-4 text-gray-900 dark:text-white'>{data.temperature}°C</td>
														<td className='py-3 px-4 text-gray-900 dark:text-white'>{data.humidity}%</td>
														<td className='py-3 px-4 text-gray-900 dark:text-white'>{data.devices}</td>
														<td className='py-3 px-4'>
															<Badge className='bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'>
																Active
															</Badge>
														</td>
													</tr>
												))}
											</tbody>
										</table>
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

export default AnalyticsPage;
