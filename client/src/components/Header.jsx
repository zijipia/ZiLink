"use client";

import Link from "next/link";
import Image from "next/image";
import ThemeToggle from "@/components/ThemeToggle";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";

export default function Header() {
	const { user, isAuthenticated } = useAuth();

	return (
		<header className='sticky top-0 z-50 flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-[var(--background)]'>
			<Link
				href='/'
				className='flex items-center gap-2'>
				<Image
					src='/globe.svg'
					alt='ZiLink logo'
					width={32}
					height={32}
				/>
				<span className='font-bold text-lg'>ZiLink</span>
			</Link>
			<div className='flex items-center gap-4'>
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
							<Button variant='ghost'>Login</Button>
						</Link>
						<Link href='/auth/sign-up'>
							<Button>Sign Up</Button>
						</Link>
					</>
				}
			</div>
		</header>
	);
}
