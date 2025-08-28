"use client";

import React, { useState } from "react";

/**
 * Simple drag and drop builder page.
 * Users can drag components from a sidebar into the main canvas area.
 */
const availableComponents = [
	{ type: "button", label: "Button" },
	{ type: "text", label: "Text" },
];

export default function BuilderPage() {
	const [items, setItems] = useState([]);

	/**
	 * Handle dropping a component onto the canvas.
	 * @param {React.DragEvent<HTMLDivElement>} e
	 */
	const handleDrop = (e) => {
		e.preventDefault();
		const type = e.dataTransfer.getData("component-type");
		const comp = availableComponents.find((c) => c.type === type);
		if (comp) {
			setItems((prev) => [...prev, { ...comp, id: Date.now() }]);
		}
	};

	/**
	 * Handle starting a drag for a component.
	 * @param {React.DragEvent<HTMLDivElement>} e
	 * @param {string} type
	 */
	const handleDragStart = (e, type) => {
		e.dataTransfer.setData("component-type", type);
	};

	return (
		<div className='flex h-screen'>
			<aside className='w-64 bg-gray-100 p-4 space-y-2'>
				{availableComponents.map((c) => (
					<div
						key={c.type}
						draggable
						onDragStart={(e) => handleDragStart(e, c.type)}
						className='p-2 bg-white rounded shadow cursor-move'>
						{c.label}
					</div>
				))}
			</aside>
			<main
				className='flex-1 p-4 bg-gray-50'
				onDrop={handleDrop}
				onDragOver={(e) => e.preventDefault()}>
				<div className='h-full border-2 border-dashed border-gray-300 rounded-lg'>
					{items.map((item) => (
						<div
							key={item.id}
							className='m-2'>
							{item.type === "button" && <button className='px-4 py-2 bg-blue-500 text-white rounded'>Button</button>}
							{item.type === "text" && <p className='text-gray-700'>Text</p>}
						</div>
					))}
				</div>
			</main>
		</div>
	);
}
