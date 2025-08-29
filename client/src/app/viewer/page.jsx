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
					{item.label}
				</button>
			);
		case "toggle":
			return (
				<label className='flex items-center space-x-2'>
					<input
						type='checkbox'
						onChange={(e) => item.deviceId && apiService.sendCommand(item.deviceId, e.target.checked ? "1" : "0")}
					/>
					<span>{item.label}</span>
				</label>
			);
		case "progress":
			return (
				<progress
					value='50'
					max='100'
					className='w-24'
				/>
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
			return <p className='text-gray-800 dark:text-gray-200'>{item.label}</p>;
		case "input":
			return (
				<input
					className='border p-1 rounded'
					placeholder={item.label}
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
