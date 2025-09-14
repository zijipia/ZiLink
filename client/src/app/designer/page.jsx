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
	Palette,
	Layout,
	Square,
	Circle,
	Triangle,
	Type,
	Image,
	BarChart3,
	Menu,
	LogOut,
	Save,
	Undo,
	Redo,
	Grid,
	Maximize,
	Minimize,
	Settings,
	Eye,
	Code,
} from "lucide-react";

const DesignerPage = () => {
	const { user, logout, isAuthenticated, isLoading: authLoading } = useAuth();
	const [isLoading, setIsLoading] = useState(true);
	const [sidebarOpen, setSidebarOpen] = useState(true);
	const [selectedTool, setSelectedTool] = useState("select");
	const [showGrid, setShowGrid] = useState(true);
	const [canvasZoom, setCanvasZoom] = useState(100);
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

	const tools = [
		{ id: "select", name: "Select", icon: Layout },
		{ id: "rectangle", name: "Rectangle", icon: Square },
		{ id: "circle", name: "Circle", icon: Circle },
		{ id: "triangle", name: "Triangle", icon: Triangle },
		{ id: "text", name: "Text", icon: Type },
		{ id: "image", name: "Image", icon: Image },
		{ id: "chart", name: "Chart", icon: BarChart3 },
	];

	const widgets = [
		{ id: "temperature", name: "Temperature", icon: Activity, color: "blue" },
		{ id: "humidity", name: "Humidity", icon: Circle, color: "green" },
		{ id: "pressure", name: "Pressure", icon: Square, color: "purple" },
		{ id: "motion", name: "Motion", icon: Triangle, color: "orange" },
		{ id: "light", name: "Light", icon: Circle, color: "yellow" },
		{ id: "sound", name: "Sound", icon: Type, color: "pink" },
	];

	useEffect(() => {
		if (!authLoading && !isAuthenticated) {
			router.push("/auth/login");
			return;
		}

		if (isAuthenticated) {
			loadDesignerData();
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

	const loadDesignerData = async () => {
		try {
			setIsLoading(true);
			// Mock loading delay
			await new Promise((resolve) => setTimeout(resolve, 1000));
		} catch (error) {
			console.error("Failed to load designer data:", error);
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
										<Palette className='w-6 h-6 text-white' />
									</div>
									<div>
										<h1 className='text-2xl font-bold text-gray-900 dark:text-white'>Designer</h1>
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
									<Palette className='w-6 h-6 text-white' />
								</div>
								<div>
									<h1 className='text-2xl font-bold text-gray-900 dark:text-white'>Dashboard Designer</h1>
									<p className='text-sm text-gray-500 dark:text-gray-400'>Create custom dashboards</p>
								</div>
							</div>
							<div className='flex items-center space-x-2'>
								<button className='flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors'>
									<Undo className='w-4 h-4' />
								</button>
								<button className='flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors'>
									<Redo className='w-4 h-4' />
								</button>
								<button className='flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors'>
									<Save className='w-4 h-4' />
									<span className='hidden sm:inline'>Save</span>
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
					{/* Left Toolbar */}
					<div className='w-16 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col items-center py-4 space-y-2'>
						{tools.map((tool) => {
							const Icon = tool.icon;
							return (
								<button
									key={tool.id}
									onClick={() => setSelectedTool(tool.id)}
									className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
										selectedTool === tool.id ?
											"bg-blue-600 text-white"
										:	"text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
									}`}
									title={tool.name}>
									<Icon className='w-5 h-5' />
								</button>
							);
						})}
					</div>

					{/* Main Canvas Area */}
					<div className='flex-1 flex flex-col'>
						{/* Canvas Toolbar */}
						<div className='bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-2 flex items-center justify-between'>
							<div className='flex items-center space-x-4'>
								<button
									onClick={() => setShowGrid(!showGrid)}
									className={`flex items-center space-x-2 px-3 py-1 rounded-md text-sm ${
										showGrid ?
											"bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300"
										:	"text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
									}`}>
									<Grid className='w-4 h-4' />
									<span>Grid</span>
								</button>
								<div className='flex items-center space-x-2'>
									<button className='p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700'>
										<Minimize className='w-4 h-4' />
									</button>
									<span className='text-sm text-gray-600 dark:text-gray-400'>{canvasZoom}%</span>
									<button className='p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700'>
										<Maximize className='w-4 h-4' />
									</button>
								</div>
							</div>
							<div className='flex items-center space-x-2'>
								<button className='flex items-center space-x-2 px-3 py-1 rounded-md text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'>
									<Eye className='w-4 h-4' />
									<span>Preview</span>
								</button>
								<button className='flex items-center space-x-2 px-3 py-1 rounded-md text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'>
									<Code className='w-4 h-4' />
									<span>Code</span>
								</button>
							</div>
						</div>

						{/* Canvas */}
						<div className='flex-1 bg-gray-100 dark:bg-gray-900 relative overflow-hidden'>
							<div className='absolute inset-0 p-8'>
								<div className='w-full h-full bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 relative'>
									{showGrid && (
										<div
											className='absolute inset-0 opacity-20'
											style={{
												backgroundImage: `
												linear-gradient(to right, #e5e7eb 1px, transparent 1px),
												linear-gradient(to bottom, #e5e7eb 1px, transparent 1px)
											`,
												backgroundSize: "20px 20px",
											}}
										/>
									)}

									{/* Sample Widgets */}
									<div className='absolute top-4 left-4 w-32 h-20 bg-blue-100 dark:bg-blue-900/20 rounded-lg border-2 border-blue-300 dark:border-blue-700 flex items-center justify-center'>
										<div className='text-center'>
											<Activity className='w-6 h-6 text-blue-600 dark:text-blue-400 mx-auto mb-1' />
											<p className='text-xs font-medium text-blue-800 dark:text-blue-300'>Temperature</p>
											<p className='text-lg font-bold text-blue-900 dark:text-blue-200'>24.5°C</p>
										</div>
									</div>

									<div className='absolute top-4 right-4 w-32 h-20 bg-green-100 dark:bg-green-900/20 rounded-lg border-2 border-green-300 dark:border-green-700 flex items-center justify-center'>
										<div className='text-center'>
											<Circle className='w-6 h-6 text-green-600 dark:text-green-400 mx-auto mb-1' />
											<p className='text-xs font-medium text-green-800 dark:text-green-300'>Humidity</p>
											<p className='text-lg font-bold text-green-900 dark:text-green-200'>58%</p>
										</div>
									</div>

									<div className='absolute bottom-4 left-4 w-64 h-32 bg-purple-100 dark:bg-purple-900/20 rounded-lg border-2 border-purple-300 dark:border-purple-700 flex items-center justify-center'>
										<div className='text-center'>
											<BarChart3 className='w-8 h-8 text-purple-600 dark:text-purple-400 mx-auto mb-2' />
											<p className='text-sm font-medium text-purple-800 dark:text-purple-300'>Data Chart</p>
											<p className='text-xs text-purple-600 dark:text-purple-400'>Temperature over time</p>
										</div>
									</div>
								</div>
							</div>
						</div>
					</div>

					{/* Right Widget Panel */}
					<div className='w-64 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 p-4'>
						<h3 className='text-lg font-semibold text-gray-900 dark:text-white mb-4'>Widgets</h3>
						<div className='space-y-2'>
							{widgets.map((widget) => {
								const Icon = widget.icon;
								return (
									<div
										key={widget.id}
										className='p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors'>
										<div className='flex items-center space-x-3'>
											<div
												className={`w-8 h-8 rounded-lg bg-${widget.color}-100 dark:bg-${widget.color}-900/20 flex items-center justify-center`}>
												<Icon className={`w-4 h-4 text-${widget.color}-600 dark:text-${widget.color}-400`} />
											</div>
											<span className='text-sm font-medium text-gray-900 dark:text-white'>{widget.name}</span>
										</div>
									</div>
								);
							})}
						</div>

						<div className='mt-6'>
							<h4 className='text-sm font-medium text-gray-900 dark:text-white mb-2'>Properties</h4>
							<div className='space-y-2'>
								<div>
									<label className='text-xs text-gray-600 dark:text-gray-400'>Width</label>
									<input
										type='number'
										defaultValue={100}
										className='w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white'
									/>
								</div>
								<div>
									<label className='text-xs text-gray-600 dark:text-gray-400'>Height</label>
									<input
										type='number'
										defaultValue={60}
										className='w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white'
									/>
								</div>
								<div>
									<label className='text-xs text-gray-600 dark:text-gray-400'>Color</label>
									<select className='w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white'>
										<option>Blue</option>
										<option>Green</option>
										<option>Purple</option>
										<option>Orange</option>
									</select>
								</div>
							</div>
						</div>
					</div>
				</div>
			</main>
		</div>
	);
};

export default DesignerPage;
