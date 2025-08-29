"use client";

import { useEffect, useState } from "react";
import apiService from "@/lib/api";

const palette = [
	{ type: "button", label: "Button" },
	{ type: "slider", label: "Slider" },
	{ type: "toggle", label: "Toggle" },
	{ type: "progress", label: "Progress" },
	{ type: "text", label: "Text" },
	{ type: "input", label: "Input" },
];

export default function DesignerPage() {
	const [items, setItems] = useState([]);
	const [selectedId, setSelectedId] = useState(null);

	useEffect(() => {
		apiService
			.getLayout()
			.then((data) => setItems(data || []))
			.catch(() => setItems([]));
	}, []);

	useEffect(() => {
		if (items.length >= 0) {
			apiService.saveLayout(items);
		}
	}, [items]);

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
			const deviceId = prompt("Enter device ID to link (optional)") || "";
			const comp = palette.find((p) => p.type === type);
			setItems((prev) => [
				...prev,
				{
					id: Date.now().toString(),
					type,
					x,
					y,
					deviceId,
					label: comp ? comp.label : type,
				},
			]);
		} else if (moveId) {
			const offsetX = parseInt(e.dataTransfer.getData("offsetX"), 10) || 0;
			const offsetY = parseInt(e.dataTransfer.getData("offsetY"), 10) || 0;
			setItems((prev) => prev.map((it) => (it.id === moveId ? { ...it, x: x - offsetX, y: y - offsetY } : it)));
		}
	};

	const renderItem = (item) => {
		switch (item.type) {
			case "button":
				return <button className='px-3 py-1 bg-blue-600 text-white rounded'>{item.label}</button>;
			case "toggle":
				return (
					<label className='flex items-center space-x-2'>
						<input type='checkbox' />
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
			case "text":
				return <p className='text-gray-800 dark:text-gray-200'>{item.label}</p>;
			case "input":
				return (
					<input
						className='border p-1 rounded'
						placeholder={item.label}
					/>
				);
			case "slider":
				return (
					<input
						type='range'
						min='0'
						max='100'
					/>
				);
			default:
				return null;
		}
	};

	return (
		<div className='min-h-screen flex bg-white text-gray-900 dark:bg-[#121212] dark:text-gray-100 transition-colors'>
			<div className='w-1/4 border-r p-4 space-y-2 bg-gray-50 dark:bg-gray-800'>
				<h2 className='font-bold mb-4'>Components</h2>
				{palette.map((p) => (
					<div
						key={p.type}
						draggable
						onDragStart={handlePaletteDrag(p.type)}
						className='p-2 bg-gray-100 dark:bg-gray-700 rounded cursor-move'>
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
						onClick={() => setSelectedId(item.id)}
						onDragStart={handleItemDrag(item.id)}
						onContextMenu={(e) => {
							e.preventDefault();
							alert(`ID: ${item.id}`);
						}}
						className={`absolute ${selectedId === item.id ? "ring-2 ring-blue-500" : ""}`}
						style={{ top: item.y, left: item.x }}>
						{renderItem(item)}
					</div>
				))}
			</div>
			<div className='w-64 border-l p-4 space-y-2 bg-gray-50 dark:bg-gray-800'>
				<h2 className='font-bold mb-4'>Properties</h2>
				{selectedId ?
					<>
						<label className='block text-sm mb-1'>Label</label>
						<input
							className='w-full mb-2 p-1 border rounded'
							value={items.find((it) => it.id === selectedId)?.label || ""}
							onChange={(e) =>
								setItems((prev) => prev.map((it) => (it.id === selectedId ? { ...it, label: e.target.value } : it)))
							}
						/>
						<label className='block text-sm mb-1'>Device ID</label>
						<input
							className='w-full mb-2 p-1 border rounded'
							value={items.find((it) => it.id === selectedId)?.deviceId || ""}
							onChange={(e) =>
								setItems((prev) => prev.map((it) => (it.id === selectedId ? { ...it, deviceId: e.target.value } : it)))
							}
						/>
						<button
							className='px-2 py-1 bg-red-600 text-white rounded'
							onClick={() => {
								setItems((prev) => prev.filter((it) => it.id !== selectedId));
								setSelectedId(null);
							}}>
							Delete
						</button>
					</>
				:	<p className='text-sm text-gray-500'>Select a component</p>}
			</div>
		</div>
	);
}
