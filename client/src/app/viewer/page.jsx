"use client";

import { useEffect, useState } from "react";
import apiService from "@/lib/api";

const renderItem = (item) => {
	switch (item.type) {
		case "button":
			return (
				<button
					className='px-3 py-1 bg-blue-600 text-white rounded'
					onClick={() => item.deviceId && apiService.sendCommand(item.deviceId, "toggle")}>
					Button
				</button>
			);
		case "slider":
			return (
				<input
					type='range'
					min='0'
					max='100'
					onChange={(e) => item.deviceId && apiService.sendCommand(item.deviceId, e.target.value)}
				/>
			);
		case "text":
			return <p className='text-gray-800 dark:text-gray-200'>Text</p>;
		case "input":
			return (
				<input
					className='border p-1 rounded'
					placeholder='Input'
				/>
			);
		default:
			return null;
	}
};

export default function ViewerPage() {
	const [items, setItems] = useState([]);

	useEffect(() => {
		apiService
			.getLayout()
			.then((data) => setItems(data || []))
			.catch(() => setItems([]));
	}, []);

	return (
		<div className='min-h-screen relative bg-white text-gray-900 dark:bg-[#121212] dark:text-gray-100 transition-colors'>
			<div className='relative h-screen'>
				{items.map((item) => (
					<div
						key={item.id}
						className='absolute'
						style={{ top: item.y, left: item.x }}>
						{renderItem(item)}
					</div>
				))}
			</div>
		</div>
	);
}
