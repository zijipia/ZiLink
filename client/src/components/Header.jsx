"use client";

import Link from "next/link";
import { useState } from "react";
import ThemeToggle from "@/components/ThemeToggle";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Zap, Menu, X, User, LogOut } from "lucide-react";

export default function Header() {
	const { user, isAuthenticated, logout } = useAuth();
	const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

	const handleLogout = async () => {
		try {
			await logout();
			setIsMobileMenuOpen(false);
		} catch (error) {
			console.error("Logout error:", error);
		}
	};

	return (
		<nav className='border-b backdrop-blur-sm sticky top-0 z-50 dark:border-gray-700 bg-white/80 dark:bg-gray-900/80'>
			<div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
				<div className='flex justify-between items-center h-16'>
					<Link
						href='/'
						className='flex items-center space-x-2 hover:opacity-80 transition-opacity'>
						<div className='w-8 h-8 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-lg flex items-center justify-center'>
							<Zap className='w-5 h-5 text-white' />
						</div>
						<span className='text-xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent'>
							ZiLink
						</span>
					</Link>

					{/* Desktop Navigation */}
					<div className='hidden md:flex items-center space-x-4'>
						<ThemeToggle />
						{isAuthenticated && user ?
							<div className='flex items-center space-x-3'>
								<Link
									href='/dashboard'
									className='flex items-center space-x-2 px-3 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors'>
									{/* eslint-disable-next-line @next/next/no-img-element */}
									<img
										src={user.avatar || "/globe.svg"}
										alt='User avatar'
										className='w-8 h-8 rounded-full'
									/>
									<span className='text-sm font-medium'>{user.name}</span>
								</Link>
								<Button
									onClick={handleLogout}
									variant='ghost'
									size='sm'
									className='text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400'>
									<LogOut className='w-4 h-4 mr-2' />
									Logout
								</Button>
							</div>
						:	<>
								<Link href='/auth/login'>
									<Button
										variant='ghost'
										size='sm'>
										Sign In
									</Button>
								</Link>
								<Link href='/auth/register'>
									<Button
										className='bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700'
										size='sm'>
										Get Started
									</Button>
								</Link>
							</>
						}
					</div>

					{/* Mobile menu button */}
					<div className='md:hidden flex items-center space-x-2'>
						<ThemeToggle />
						<button
							onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
							className='p-2 rounded-md text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors'>
							{isMobileMenuOpen ?
								<X className='w-6 h-6' />
							:	<Menu className='w-6 h-6' />}
						</button>
					</div>
				</div>

				{/* Mobile Navigation */}
				{isMobileMenuOpen && (
					<div className='md:hidden border-t dark:border-gray-700 py-4'>
						<div className='flex flex-col space-y-3'>
							{isAuthenticated && user ?
								<>
									<Link
										href='/dashboard'
										onClick={() => setIsMobileMenuOpen(false)}
										className='flex items-center space-x-3 px-3 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors'>
										{/* eslint-disable-next-line @next/next/no-img-element */}
										<img
											src={user.avatar || "/globe.svg"}
											alt='User avatar'
											className='w-8 h-8 rounded-full'
										/>
										<div>
											<div className='text-sm font-medium'>{user.name}</div>
											<div className='text-xs text-gray-500 dark:text-gray-400'>{user.email}</div>
										</div>
									</Link>
									<button
										onClick={handleLogout}
										className='flex items-center space-x-3 px-3 py-2 rounded-md text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-left'>
										<LogOut className='w-4 h-4' />
										<span>Logout</span>
									</button>
								</>
							:	<>
									<Link
										href='/auth/login'
										onClick={() => setIsMobileMenuOpen(false)}
										className='px-3 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors'>
										Sign In
									</Link>
									<Link
										href='/auth/register'
										onClick={() => setIsMobileMenuOpen(false)}
										className='px-3 py-2 rounded-md bg-gradient-to-r from-blue-600 to-cyan-600 text-white hover:from-blue-700 hover:to-cyan-700 transition-all'>
										Get Started
									</Link>
								</>
							}
						</div>
					</div>
				)}
			</div>
		</nav>
	);
}
