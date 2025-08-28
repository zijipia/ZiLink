"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import apiService from "@/lib/api";

/**
 * Page for registering a new device
 * @returns {React.JSX.Element}
 */
export default function NewDevicePage() {
	const [name, setName] = useState("");
	const [type, setType] = useState("");
	const router = useRouter();

	/**
	 * Handle form submission
	 * @param {React.FormEvent} e
	 */
	const handleSubmit = async (e) => {
		e.preventDefault();
		try {
			const result = await apiService.registerDevice({ name, type });
			alert(`Registered device ID: ${result.device.deviceId}`);
			router.push("/dashboard");
		} catch (err) {
			// Errors are handled by apiService toast notifications
			console.error("Device registration failed", err);
		}
	};

	return (
		<div className='min-h-screen flex items-center justify-center p-4'>
			<form
				onSubmit={handleSubmit}
				className='w-full max-w-md bg-white dark:bg-gray-800 p-6 rounded shadow'>
				<h1 className='text-2xl font-bold mb-4 text-gray-900 dark:text-gray-100'>Add New Device</h1>
				{/* Device ID is generated automatically on the server */}
				<div className='mb-4'>
					<label
						className='block text-sm mb-1'
						htmlFor='name'>
						Name
					</label>
					<input
						id='name'
						type='text'
						required
						value={name}
						onChange={(e) => setName(e.target.value)}
						className='w-full px-3 py-2 border rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100'
					/>
				</div>
				<div className='mb-6'>
					<label
						className='block text-sm mb-1'
						htmlFor='type'>
						Type
					</label>
					<input
						id='type'
						type='text'
						value={type}
						onChange={(e) => setType(e.target.value)}
						className='w-full px-3 py-2 border rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100'
					/>
				</div>
				<button
					type='submit'
					className='w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded'>
					Register Device
				</button>
			</form>
		</div>
	);
}
