"use client";

import { useState } from "react";

const palette = [
	{ type: "button", label: "Button" },
	{ type: "text", label: "Text" },
	{ type: "input", label: "Input" },
];

export default function DesignerPage() {
	const [items, setItems] = useState([]);

	const handlePaletteDrag = (type) => (e) => {
		e.dataTransfer.setData("componentType", type);
	};

	const handleItemDrag = (id) => (e) => {
		const rect = e.currentTarget.getBoundingClientRect();
		e.dataTransfer.setData("moveId", id);
		e.dataTransfer.setData("offsetX", e.clientX - rect.left);
		e.dataTransfer.setData("offsetY", e.clientY - rect.top);
	};

	const handleDrop = (e) => {
		e.preventDefault();
		const rect = e.currentTarget.getBoundingClientRect();
		const x = e.clientX - rect.left;
		const y = e.clientY - rect.top;
		const type = e.dataTransfer.getData("componentType");
		const moveId = e.dataTransfer.getData("moveId");

		if (type) {
			setItems((prev) => [...prev, { id: Date.now().toString(), type, x, y }]);
		} else if (moveId) {
			const offsetX = parseInt(e.dataTransfer.getData("offsetX"), 10) || 0;
			const offsetY = parseInt(e.dataTransfer.getData("offsetY"), 10) || 0;
			setItems((prev) => prev.map((it) => (it.id === moveId ? { ...it, x: x - offsetX, y: y - offsetY } : it)));
		}
	};

	const renderItem = (item) => {
		switch (item.type) {
			case "button":
				return <button className='px-3 py-1 bg-blue-600 text-white rounded'>Button</button>;
			case "text":
				return <p className='text-gray-800'>Text</p>;
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

	return (
		<div className='min-h-screen flex'>
			<div className='w-1/4 border-r p-4 space-y-2'>
				<h2 className='font-bold mb-4'>Components</h2>
				{palette.map((p) => (
					<div
						key={p.type}
						draggable
						onDragStart={handlePaletteDrag(p.type)}
						className='p-2 bg-gray-100 rounded cursor-move'>
						{p.label}
					</div>
				))}
			</div>
			<div
				className='flex-1 relative'
				onDrop={handleDrop}
				onDragOver={(e) => e.preventDefault()}>
				{items.map((item) => (
					<div
						key={item.id}
						draggable
						onDragStart={handleItemDrag(item.id)}
						className='absolute'
						style={{ top: item.y, left: item.x }}>
						{renderItem(item)}
					</div>
				))}
			</div>
		</div>
	);
}
