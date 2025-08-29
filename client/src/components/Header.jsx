"use client";

import Link from "next/link";
import ThemeToggle from "@/components/ThemeToggle";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Zap } from "lucide-react";

export default function Header() {
	const { user, isAuthenticated } = useAuth();

	return (
		<nav className='border-b backdrop-blur-sm sticky top-0 z-50 dark:border-gray-700'>
			<div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
				<div className='flex justify-between items-center h-16'>
					<Link
						href='/'
						className='flex items-center space-x-2'>
						<div className='w-8 h-8 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-lg flex items-center justify-center'>
							<Zap className='w-5 h-5 text-white' />
						</div>
						<span className='text-xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent'>
							ZiLink
						</span>
					</Link>
					<div className='flex items-center space-x-4'>
						<ThemeToggle />
						{isAuthenticated && user ?
							<Link href='/dashboard'>
								{/* eslint-disable-next-line @next/next/no-img-element */}
								<img
									src={user.avatar || "/globe.svg"}
									alt='User avatar'
									className='w-8 h-8 rounded-full'
								/>
							</Link>
						:	<>
								<Link href='/auth/login'>
									<Button variant='ghost'>Sign In</Button>
								</Link>
								<Link href='/auth/register'>
									<Button className='bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700'>
										Get Started
									</Button>
								</Link>
							</>
						}
					</div>
				</div>
			</div>
		</nav>
	);
}
