"use client";

import { useEffect, useState } from "react";
import ThemeToggle from "@/components/ThemeToggle";

const renderItem = (item) => {
	switch (item.type) {
		case "button":
			return <button className='px-3 py-1 bg-blue-600 text-white rounded'>Button</button>;
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
		const saved = localStorage.getItem("zilink-layout");
		if (saved) {
			setItems(JSON.parse(saved));
		}
	}, []);

	return (
		<div className='min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 relative'>
			<ThemeToggle />
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
