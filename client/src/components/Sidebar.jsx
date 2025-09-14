"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity, Wifi, BarChart3, Palette, Eye, Terminal, Settings, X, Menu } from "lucide-react";

const Sidebar = ({ isOpen, onClose }) => {
	const pathname = usePathname();
	const [isDesktop, setIsDesktop] = useState(false);

	const navItems = [
		{ href: "/dashboard", icon: Activity, label: "Dashboard" },
		{ href: "/devices", icon: Wifi, label: "Devices" },
		{ href: "/analytics", icon: BarChart3, label: "Analytics" },
		{ href: "/designer", icon: Palette, label: "Designer" },
		{ href: "/viewer", icon: Eye, label: "Viewer" },
		{ href: "/console", icon: Terminal, label: "Console" },
		{ href: "/settings", icon: Settings, label: "Settings" },
	];

	const sidebarVariants = {
		open: { x: 0, opacity: 1 },
		closed: { x: -250, opacity: 0 },
	};

	useEffect(() => {
		const checkScreenSize = () => {
			setIsDesktop(window.innerWidth >= 1024);
		};

		checkScreenSize();
		window.addEventListener("resize", checkScreenSize);
		return () => window.removeEventListener("resize", checkScreenSize);
	}, []);

	const overlayVariants = {
		open: { opacity: 1, pointerEvents: "auto" },
		closed: { opacity: 0, pointerEvents: "none" },
	};

	return (
		<>
			{/* Mobile Overlay */}
			<AnimatePresence>
				{isOpen && (
					<motion.div
						variants={overlayVariants}
						initial='closed'
						animate='open'
						exit='closed'
						onClick={onClose}
						className='fixed inset-0 bg-black/50 z-40 lg:hidden'
					/>
				)}
			</AnimatePresence>

			{/* Sidebar */}
			<motion.aside
				variants={sidebarVariants}
				initial={isDesktop ? "open" : "closed"}
				animate={
					isDesktop ? "open"
					: isOpen ?
						"open"
					:	"closed"
				}
				className='w-64 bg-white dark:bg-gray-800 shadow-xl border-r border-gray-200 dark:border-gray-700 fixed h-full z-50 lg:relative lg:z-auto lg:translate-x-0 lg:block'>
				<div className='flex flex-col h-full'>
					{/* Header */}
					<div className='flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700'>
						<Link
							href='/'
							className='flex items-center space-x-2 hover:opacity-80 transition-opacity'>
							<div className='w-8 h-8 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-lg flex items-center justify-center'>
								<Activity className='w-5 h-5 text-white' />
							</div>
							<span className='text-xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent'>
								ZiLink
							</span>
						</Link>
						<button
							onClick={onClose}
							className='lg:hidden p-2 rounded-md text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors'>
							<X className='w-5 h-5' />
						</button>
					</div>

					{/* Navigation */}
					<nav className='flex-1 p-4 space-y-1 overflow-y-auto'>
						{navItems.map((item) => {
							const Icon = item.icon;
							const isActive = pathname === item.href;

							return (
								<Link
									key={item.href}
									href={item.href}
									onClick={onClose}
									className={`flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${
										isActive ?
											"bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-l-4 border-blue-600"
										:	"text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white"
									}`}>
									<Icon className={`mr-3 h-5 w-5 ${isActive ? "text-blue-600 dark:text-blue-400" : ""}`} />
									{item.label}
								</Link>
							);
						})}
					</nav>

					{/* Footer */}
					<div className='p-4 border-t border-gray-200 dark:border-gray-700'>
						<div className='text-xs text-gray-500 dark:text-gray-400 text-center'>© 2024 ZiLink IoT Platform</div>
					</div>
				</div>
			</motion.aside>
		</>
	);
};

export default Sidebar;
