"use client";

import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";

export default function Home() {
	const { isAuthenticated } = useAuth();

	return (
		<div className='min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 text-white'>
			<div className='text-center space-y-6 px-4'>
				<h1 className='text-5xl font-extrabold tracking-tight sm:text-6xl'>ZiLink IoT Platform</h1>
				<p className='text-xl max-w-2xl mx-auto'>
					Unleash the power of your connected devices with a modern and intuitive dashboard.
				</p>
				<div className='flex justify-center space-x-4'>
					{isAuthenticated ?
						<Link
							href='/dashboard'
							className='px-8 py-3 bg-white text-indigo-600 font-semibold rounded-lg shadow-lg hover:bg-gray-100 transition-colors'>
							Go to Dashboard
						</Link>
					:	<Link
							href='/login'
							className='px-8 py-3 bg-white text-indigo-600 font-semibold rounded-lg shadow-lg hover:bg-gray-100 transition-colors'>
							Login
						</Link>
					}
				</div>
			</div>
		</div>
	);
}
