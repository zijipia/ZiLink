"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import apiService from "@/lib/api";
import { toast } from "react-hot-toast";

export default function DevicesPage() {
	const [devices, setDevices] = useState([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const load = async () => {
			try {
				const data = await apiService.getDevices();
				setDevices(data.devices || []);
			} catch (err) {
				console.error("Failed to load devices", err);
				toast.error("Failed to load devices");
			} finally {
				setLoading(false);
			}
		};
		load();
	}, []);

	if (loading) {
		return (
			<div className='min-h-screen flex items-center justify-center'>
				<div className='animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600' />
			</div>
		);
	}

	return (
		<div className='min-h-screen p-8 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100'>
			<h1 className='text-2xl font-bold mb-6'>My Devices</h1>
			<table className='min-w-full bg-white dark:bg-gray-800 rounded-lg overflow-hidden'>
				<thead>
					<tr>
						<th className='py-2 px-4 border-b text-left'>Name</th>
						<th className='py-2 px-4 border-b text-left'>Type</th>
						<th className='py-2 px-4 border-b text-left'>Device ID</th>
					</tr>
				</thead>
				<tbody>
					{devices.map((d) => (
						<tr
							key={d.deviceId}
							className='hover:bg-gray-50 dark:hover:bg-gray-700'>
							<td className='py-2 px-4 border-b'>{d.name}</td>
							<td className='py-2 px-4 border-b capitalize'>{d.type}</td>
							<td className='py-2 px-4 border-b font-mono text-sm'>
								{d.deviceId}
								<button
									onClick={() => {
										navigator.clipboard.writeText(d.deviceId);
										toast.success("Copied device ID");
									}}
									className='ml-2 text-blue-600 hover:underline'>
									Copy
								</button>
							</td>
						</tr>
					))}
				</tbody>
			</table>
			<div className='mt-4'>
				<Link
					href='/devices/new'
					className='text-blue-600 hover:underline'>
					+ Register new device
				</Link>
			</div>
		</div>
	);
}
