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
	Settings as SettingsIcon,
	User,
	Bell,
	Shield,
	Database,
	Wifi,
	Palette,
	Globe,
	Menu,
	LogOut,
	Save,
	Download,
	Trash2,
} from "lucide-react";

const SettingsPage = () => {
	const { user, logout, isAuthenticated, isLoading: authLoading } = useAuth();
	const [isLoading, setIsLoading] = useState(true);
	const [sidebarOpen, setSidebarOpen] = useState(true);
	const [activeTab, setActiveTab] = useState("profile");
	const [hasChanges, setHasChanges] = useState(false);
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

	const tabs = [
		{ id: "profile", name: "Profile", icon: User },
		{ id: "notifications", name: "Notifications", icon: Bell },
		{ id: "security", name: "Security", icon: Shield },
		{ id: "appearance", name: "Appearance", icon: Palette },
		{ id: "devices", name: "Devices", icon: Wifi },
		{ id: "integrations", name: "Integrations", icon: Globe },
		{ id: "data", name: "Data & Privacy", icon: Database },
	];

	useEffect(() => {
		if (!authLoading && !isAuthenticated) {
			router.push("/auth/login");
			return;
		}

		if (isAuthenticated) {
			loadSettings();
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

	const loadSettings = async () => {
		try {
			setIsLoading(true);
			await new Promise((resolve) => setTimeout(resolve, 1000));
		} catch (error) {
			console.error("Failed to load settings:", error);
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
										<SettingsIcon className='w-6 h-6 text-white' />
									</div>
									<div>
										<h1 className='text-2xl font-bold text-gray-900 dark:text-white'>Settings</h1>
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
									<SettingsIcon className='w-6 h-6 text-white' />
								</div>
								<div>
									<h1 className='text-2xl font-bold text-gray-900 dark:text-white'>Settings</h1>
									<p className='text-sm text-gray-500 dark:text-gray-400'>Manage your account and preferences</p>
								</div>
							</div>
							<div className='flex items-center space-x-2'>
								{hasChanges && (
									<Badge className='bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'>
										Unsaved changes
									</Badge>
								)}
								<button
									onClick={() => setHasChanges(false)}
									disabled={!hasChanges}
									className='flex items-center space-x-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors'>
									<Save className='w-4 h-4' />
									<span>Save Changes</span>
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
						className='flex gap-6'>
						{/* Settings Navigation */}
						<motion.div
							variants={itemVariants}
							className='w-64 flex-shrink-0'>
							<Card className='bg-white dark:bg-gray-800 border-0 shadow-sm'>
								<CardContent className='p-4'>
									<nav className='space-y-1'>
										{tabs.map((tab) => {
											const Icon = tab.icon;
											return (
												<button
													key={tab.id}
													onClick={() => setActiveTab(tab.id)}
													className={`w-full flex items-center space-x-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
														activeTab === tab.id ?
															"bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300"
														:	"text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
													}`}>
													<Icon className='w-4 h-4' />
													<span>{tab.name}</span>
												</button>
											);
										})}
									</nav>
								</CardContent>
							</Card>
						</motion.div>

						{/* Settings Content */}
						<motion.div
							variants={itemVariants}
							className='flex-1'>
							<Card className='bg-white dark:bg-gray-800 border-0 shadow-sm'>
								<CardHeader>
									<CardTitle className='text-xl font-semibold text-gray-900 dark:text-white'>
										{tabs.find((tab) => tab.id === activeTab)?.name}
									</CardTitle>
								</CardHeader>
								<CardContent className='p-6'>
									{activeTab === "profile" && (
										<div className='space-y-6'>
											<div className='flex items-center space-x-4'>
												<div className='w-16 h-16 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-full flex items-center justify-center'>
													<User className='w-8 h-8 text-white' />
												</div>
												<div>
													<h3 className='text-lg font-medium text-gray-900 dark:text-white'>Ziji</h3>
													<p className='text-sm text-gray-500 dark:text-gray-400'>ziji@example.com</p>
												</div>
											</div>
											<div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
												<div>
													<label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'>Name</label>
													<input
														type='text'
														defaultValue='Ziji'
														onChange={() => setHasChanges(true)}
														className='w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent'
													/>
												</div>
												<div>
													<label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'>Email</label>
													<input
														type='email'
														defaultValue='ziji@example.com'
														onChange={() => setHasChanges(true)}
														className='w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent'
													/>
												</div>
											</div>
										</div>
									)}

									{activeTab === "notifications" && (
										<div className='space-y-6'>
											<div className='text-center py-8'>
												<Bell className='w-12 h-12 text-gray-400 mx-auto mb-4' />
												<h3 className='text-lg font-medium text-gray-900 dark:text-white mb-2'>Notification Settings</h3>
												<p className='text-gray-500 dark:text-gray-400'>Configure your notification preferences</p>
											</div>
										</div>
									)}

									{activeTab === "security" && (
										<div className='space-y-6'>
											<div className='text-center py-8'>
												<Shield className='w-12 h-12 text-gray-400 mx-auto mb-4' />
												<h3 className='text-lg font-medium text-gray-900 dark:text-white mb-2'>Security Settings</h3>
												<p className='text-gray-500 dark:text-gray-400'>Manage your security preferences</p>
											</div>
										</div>
									)}

									{activeTab === "appearance" && (
										<div className='space-y-6'>
											<div className='text-center py-8'>
												<Palette className='w-12 h-12 text-gray-400 mx-auto mb-4' />
												<h3 className='text-lg font-medium text-gray-900 dark:text-white mb-2'>Appearance Settings</h3>
												<p className='text-gray-500 dark:text-gray-400'>Customize the look and feel</p>
											</div>
										</div>
									)}

									{activeTab === "devices" && (
										<div className='space-y-6'>
											<div className='text-center py-8'>
												<Wifi className='w-12 h-12 text-gray-400 mx-auto mb-4' />
												<h3 className='text-lg font-medium text-gray-900 dark:text-white mb-2'>Device Settings</h3>
												<p className='text-gray-500 dark:text-gray-400'>Configure device preferences</p>
											</div>
										</div>
									)}

									{activeTab === "integrations" && (
										<div className='space-y-6'>
											<div className='text-center py-8'>
												<Globe className='w-12 h-12 text-gray-400 mx-auto mb-4' />
												<h3 className='text-lg font-medium text-gray-900 dark:text-white mb-2'>Integration Settings</h3>
												<p className='text-gray-500 dark:text-gray-400'>Manage external integrations</p>
											</div>
										</div>
									)}

									{activeTab === "data" && (
										<div className='space-y-6'>
											<div className='flex items-center justify-between'>
												<div>
													<h3 className='text-sm font-medium text-gray-900 dark:text-white'>Export Data</h3>
													<p className='text-sm text-gray-500 dark:text-gray-400'>Download all your data</p>
												</div>
												<button className='flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors'>
													<Download className='w-4 h-4' />
													<span>Export</span>
												</button>
											</div>
											<div className='flex items-center justify-between'>
												<div>
													<h3 className='text-sm font-medium text-gray-900 dark:text-white'>Delete Account</h3>
													<p className='text-sm text-gray-500 dark:text-gray-400'>Permanently delete your account and data</p>
												</div>
												<button className='flex items-center space-x-2 px-3 py-2 text-sm font-medium text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-300 dark:border-red-700 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors'>
													<Trash2 className='w-4 h-4' />
													<span>Delete</span>
												</button>
											</div>
										</div>
									)}
								</CardContent>
							</Card>
						</motion.div>
					</motion.div>
				</div>
			</main>
		</div>
	);
};

export default SettingsPage;
