"use client";

import { useAuth } from "@/contexts/AuthContext";

/**
 * Basic settings page showing user info
 * @returns {React.JSX.Element}
 */
export default function SettingsPage() {
	const { user } = useAuth();

	return (
		<div className='min-h-screen p-8'>
			<h1 className='text-2xl font-bold mb-4'>Settings</h1>
			<p className='mb-4'>Manage your account settings here.</p>
			{user && (
				<div className='space-y-2'>
					<p>
						<span className='font-semibold'>Name:</span> {user.name}
					</p>
					<p>
						<span className='font-semibold'>Email:</span> {user.email}
					</p>
				</div>
			)}
		</div>
	);
}
