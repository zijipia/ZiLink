"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import apiService from "@/lib/api";
import websocketService from "@/lib/websocket";
import { toast } from "react-hot-toast";

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
	const router = useRouter();

	useEffect(() => {
		if (!authLoading && !isAuthenticated) {
			router.push("/login");
			return;
		}

		if (isAuthenticated) {
			loadDashboardData();
			setupWebSocketListeners();
		}
	}, [isAuthenticated, authLoading, router]);

	const loadDashboardData = async () => {
		try {
			setIsLoading(true);
			const data = await apiService.getDashboardData();
			setDashboardData(data);
		} catch (error) {
			console.error("Failed to load dashboard data:", error);
			toast.error("Failed to load dashboard data");
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
		};

		/**
		 * Handle device status event
		 * @param {any} data
		 */
		const handleDeviceStatus = (data) => {
			console.log("Device status update:", data);
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

	if (authLoading || isLoading) {
		return (
			<div className='min-h-screen flex items-center justify-center bg-gray-50'>
				<div className='animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600'></div>
			</div>
		);
	}

	if (!isAuthenticated) {
		return null;
	}

	return (
		<div className='min-h-screen bg-gray-50'>
			{/* Header */}
			<div className='bg-white shadow'>
				<div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
					<div className='flex justify-between items-center py-6'>
						<div className='flex items-center'>
							<div className='w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center mr-4'>
								<svg
									className='w-6 h-6 text-white'
									fill='none'
									stroke='currentColor'
									viewBox='0 0 24 24'>
									<path
										strokeLinecap='round'
										strokeLinejoin='round'
										strokeWidth={2}
										d='M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z'
									/>
								</svg>
							</div>
							<div>
								<h1 className='text-2xl font-bold text-gray-900'>ZiLink Dashboard</h1>
								<p className='text-sm text-gray-500'>Welcome back, {user?.name}</p>
							</div>
						</div>

						<div className='flex items-center space-x-4'>
							{/* WebSocket Status */}
							<div className='flex items-center space-x-2'>
								<div
									className={`w-3 h-3 rounded-full ${
										wsStatus === "connected" ? "bg-green-400"
										: wsStatus === "connecting" ? "bg-yellow-400"
										: "bg-red-400"
									}`}></div>
								<span className='text-sm text-gray-600 capitalize'>{wsStatus}</span>
							</div>

							<button
								onClick={handleLogout}
								className='px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'>
								Logout
							</button>
						</div>
					</div>
				</div>
			</div>

			{/* Main Content */}
			<div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
				{dashboardData ?
					<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8'>
						{/* Summary Cards */}
						<div className='bg-white p-6 rounded-lg shadow'>
							<div className='flex items-center justify-between'>
								<div>
									<p className='text-sm text-gray-600'>Total Devices</p>
									<p className='text-3xl font-bold text-gray-900'>{dashboardData.summary.totalDevices}</p>
								</div>
								<div className='w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center'>
									<svg
										className='w-6 h-6 text-blue-600'
										fill='none'
										stroke='currentColor'
										viewBox='0 0 24 24'>
										<path
											strokeLinecap='round'
											strokeLinejoin='round'
											strokeWidth={2}
											d='M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z'
										/>
									</svg>
								</div>
							</div>
						</div>

						<div className='bg-white p-6 rounded-lg shadow'>
							<div className='flex items-center justify-between'>
								<div>
									<p className='text-sm text-gray-600'>Online Devices</p>
									<p className='text-3xl font-bold text-green-600'>{dashboardData.summary.onlineDevices}</p>
								</div>
								<div className='w-12 h-12 bg-green-100 rounded-full flex items-center justify-center'>
									<svg
										className='w-6 h-6 text-green-600'
										fill='none'
										stroke='currentColor'
										viewBox='0 0 24 24'>
										<path
											strokeLinecap='round'
											strokeLinejoin='round'
											strokeWidth={2}
											d='M5.636 18.364a9 9 0 010-12.728m12.728 0a9 9 0 010 12.728m-9.9-2.829a5 5 0 010-7.07m7.072 0a5 5 0 010 7.07M13 12a1 1 0 11-2 0 1 1 0 012 0z'
										/>
									</svg>
								</div>
							</div>
						</div>

						<div className='bg-white p-6 rounded-lg shadow'>
							<div className='flex items-center justify-between'>
								<div>
									<p className='text-sm text-gray-600'>Offline Devices</p>
									<p className='text-3xl font-bold text-red-600'>{dashboardData.summary.offlineDevices}</p>
								</div>
								<div className='w-12 h-12 bg-red-100 rounded-full flex items-center justify-center'>
									<svg
										className='w-6 h-6 text-red-600'
										fill='none'
										stroke='currentColor'
										viewBox='0 0 24 24'>
										<path
											strokeLinecap='round'
											strokeLinejoin='round'
											strokeWidth={2}
											d='M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21.192 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3l8.293 8.293'
										/>
									</svg>
								</div>
							</div>
						</div>

						<div className='bg-white p-6 rounded-lg shadow'>
							<div className='flex items-center justify-between'>
								<div>
									<p className='text-sm text-gray-600'>Uptime</p>
									<p className='text-3xl font-bold text-blue-600'>{dashboardData.summary.uptimePercentage}%</p>
								</div>
								<div className='w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center'>
									<svg
										className='w-6 h-6 text-blue-600'
										fill='none'
										stroke='currentColor'
										viewBox='0 0 24 24'>
										<path
											strokeLinecap='round'
											strokeLinejoin='round'
											strokeWidth={2}
											d='M13 7h8m0 0v8m0-8l-8 8-4-4-6 6'
										/>
									</svg>
								</div>
							</div>
						</div>
					</div>
				:	<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8'>
						{[...Array(4)].map((_, i) => (
							<div
								key={i}
								className='bg-white p-6 rounded-lg shadow animate-pulse'>
								<div className='flex items-center justify-between'>
									<div className='space-y-2'>
										<div className='h-4 bg-gray-200 rounded w-24'></div>
										<div className='h-8 bg-gray-200 rounded w-16'></div>
									</div>
									<div className='w-12 h-12 bg-gray-200 rounded-full'></div>
								</div>
							</div>
						))}
					</div>
				}

				{/* Quick Actions */}
				<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
					<div className='bg-white p-6 rounded-lg shadow'>
						<h3 className='text-lg font-semibold text-gray-900 mb-4'>Quick Actions</h3>
						<div className='space-y-3'>
							<button className='w-full text-left px-4 py-2 text-sm text-gray-700 bg-gray-50 rounded-md hover:bg-gray-100 transition duration-200'>
								+ Add New Device
							</button>
							<button className='w-full text-left px-4 py-2 text-sm text-gray-700 bg-gray-50 rounded-md hover:bg-gray-100 transition duration-200'>
								📊 View Analytics
							</button>
							<button className='w-full text-left px-4 py-2 text-sm text-gray-700 bg-gray-50 rounded-md hover:bg-gray-100 transition duration-200'>
								⚙️ Settings
							</button>
							<Link
								href='/designer'
								className='block w-full text-left px-4 py-2 text-sm text-gray-700 bg-gray-50 rounded-md hover:bg-gray-100 transition duration-200'>
								🛠️ UI Designer
							</Link>
							<Link
								href='/viewer'
								className='block w-full text-left px-4 py-2 text-sm text-gray-700 bg-gray-50 rounded-md hover:bg-gray-100 transition duration-200'>
								👁️ Viewer
							</Link>
							<Link
								href='/console'
								className='block w-full text-left px-4 py-2 text-sm text-gray-700 bg-gray-50 rounded-md hover:bg-gray-100 transition duration-200'>
								📝 Raw Console
							</Link>
						</div>
					</div>

					<div className='bg-white p-6 rounded-lg shadow'>
						<h3 className='text-lg font-semibold text-gray-900 mb-4'>Recent Activity</h3>
						<div className='space-y-3'>
							<div className='flex items-center space-x-3'>
								<div className='w-2 h-2 bg-green-400 rounded-full'></div>
								<span className='text-sm text-gray-600'>Device ESP32-001 came online</span>
							</div>
							<div className='flex items-center space-x-3'>
								<div className='w-2 h-2 bg-blue-400 rounded-full'></div>
								<span className='text-sm text-gray-600'>New data from Temp Sensor</span>
							</div>
							<div className='flex items-center space-x-3'>
								<div className='w-2 h-2 bg-yellow-400 rounded-full'></div>
								<span className='text-sm text-gray-600'>Battery low on Device 003</span>
							</div>
						</div>
					</div>

					<div className='bg-white p-6 rounded-lg shadow'>
						<h3 className='text-lg font-semibold text-gray-900 mb-4'>System Status</h3>
						<div className='space-y-3'>
							<div className='flex justify-between items-center'>
								<span className='text-sm text-gray-600'>API Server</span>
								<span className='text-sm text-green-600 font-medium'>Online</span>
							</div>
							<div className='flex justify-between items-center'>
								<span className='text-sm text-gray-600'>WebSocket</span>
								<span
									className={`text-sm font-medium ${
										wsStatus === "connected" ? "text-green-600"
										: wsStatus === "connecting" ? "text-yellow-600"
										: "text-red-600"
									}`}>
									{wsStatus.charAt(0).toUpperCase() + wsStatus.slice(1)}
								</span>
							</div>
							<div className='flex justify-between items-center'>
								<span className='text-sm text-gray-600'>MQTT Broker</span>
								<span className='text-sm text-green-600 font-medium'>Connected</span>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};

export default DashboardPage;
