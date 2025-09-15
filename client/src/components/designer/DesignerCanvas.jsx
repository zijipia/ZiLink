"use client";

import { useRef } from "react";

const DesignerCanvas = ({
	shapes,
	draft,
	showGrid,
	canvasZoom,
	selectedId,
	selectedTool,
	onPointerDown,
	onPointerMove,
	onPointerUp,
	onContextMenu,
	onShapeClick,
	onDeleteShape,
}) => {
	const canvasRef = useRef(null);
	const scale = canvasZoom / 100;

	// Grid pattern
	const gridPattern =
		showGrid ?
			<defs>
				<pattern
					id='grid'
					width='20'
					height='20'
					patternUnits='userSpaceOnUse'>
					<path
						d='M 20 0 L 0 0 0 20'
						fill='none'
						stroke='#e5e7eb'
						strokeWidth='0.5'
						opacity='0.5'
					/>
				</pattern>
			</defs>
		:	null;

	// Render shape based on type
	const renderShape = (shape) => {
		const isSelected = selectedId === shape.id;
		const commonProps = {
			key: shape.id,
			onPointerDown: (e) => onShapeClick(e, shape.id),
			onContextMenu: (e) => onContextMenu(e, shape.id),
			style: { cursor: selectedTool === "select" ? "move" : "default" },
		};

		switch (shape.type) {
			case "rectangle":
				return (
					<rect
						{...commonProps}
						x={shape.x}
						y={shape.y}
						width={shape.w}
						height={shape.h}
						fill={shape.fill || "rgba(59,130,246,0.3)"}
						stroke={shape.stroke || "#2563eb"}
						strokeWidth={shape.strokeWidth || 2}
						rx={6}
						ry={6}
					/>
				);
			case "circle":
				return (
					<ellipse
						{...commonProps}
						cx={shape.x + shape.w / 2}
						cy={shape.y + shape.h / 2}
						rx={Math.abs(shape.w / 2)}
						ry={Math.abs(shape.h / 2)}
						fill={shape.fill || "rgba(34,197,94,0.3)"}
						stroke={shape.stroke || "#16a34a"}
						strokeWidth={shape.strokeWidth || 2}
					/>
				);
			case "triangle":
				return (
					<polygon
						{...commonProps}
						points={`${shape.x + shape.w / 2},${shape.y} ${shape.x},${shape.y + shape.h} ${shape.x + shape.w},${shape.y + shape.h}`}
						fill={shape.fill || "rgba(234,179,8,0.3)"}
						stroke={shape.stroke || "#d97706"}
						strokeWidth={shape.strokeWidth || 2}
					/>
				);
			case "text":
				return (
					<text
						{...commonProps}
						x={shape.x}
						y={shape.y + (shape.fontSize || 16)}
						fontSize={shape.fontSize || 16}
						fill={shape.color || "#ffffff"}
						fontFamily='Arial, sans-serif'>
						{shape.text || "Text"}
					</text>
				);
			default:
				return null;
		}
	};

	// Render selection handles
	const renderSelectionHandles = (shape) => {
		if (selectedId !== shape.id) return null;

		const bx = shape.x;
		const by = shape.y;
		const bw = shape.w || 100;
		const bh = shape.h || 20;

		return (
			<g key={`selection-${shape.id}`}>
				{/* Selection border */}
				<rect
					x={bx - 2}
					y={by - 2}
					width={bw + 4}
					height={bh + 4}
					fill='none'
					stroke='#2563eb'
					strokeWidth={2 / scale}
					strokeDasharray='4 2'
					rx={4}
					ry={4}
				/>
				{/* Delete button */}
				<g
					onPointerDown={(e) => {
						e.stopPropagation();
						onDeleteShape(shape.id);
					}}
					style={{ cursor: "pointer" }}>
					<rect
						x={bx + bw + 6}
						y={by - 6}
						width={16 / scale}
						height={16 / scale}
						rx={3}
						ry={3}
						fill='#ef4444'
						stroke='#b91c1c'
						strokeWidth={1}
					/>
					<line
						x1={bx + bw + 6 + 4 / scale}
						y1={by - 6 + 4 / scale}
						x2={bx + bw + 6 + 12 / scale}
						y2={by - 6 + 12 / scale}
						stroke='#ffffff'
						strokeWidth={1.5}
					/>
					<line
						x1={bx + bw + 6 + 4 / scale}
						y1={by - 6 + 12 / scale}
						x2={bx + bw + 6 + 12 / scale}
						y2={by - 6 + 4 / scale}
						stroke='#ffffff'
						strokeWidth={1.5}
					/>
				</g>
			</g>
		);
	};

	// Render draft shape while drawing
	const renderDraft = () => {
		if (!draft) return null;

		switch (draft.type) {
			case "rectangle":
				return (
					<rect
						x={draft.x}
						y={draft.y}
						width={draft.w}
						height={draft.h}
						fill='rgba(59,130,246,0.25)'
						stroke='#2563eb'
						strokeDasharray='4 2'
						strokeWidth={1.5}
						rx={6}
						ry={6}
					/>
				);
			case "circle":
				return (
					<ellipse
						cx={draft.x + draft.w / 2}
						cy={draft.y + draft.h / 2}
						rx={Math.abs(draft.w / 2)}
						ry={Math.abs(draft.h / 2)}
						fill='rgba(34,197,94,0.25)'
						stroke='#16a34a'
						strokeDasharray='4 2'
						strokeWidth={1.5}
					/>
				);
			case "triangle":
				return (
					<polygon
						points={`${draft.x + draft.w / 2},${draft.y} ${draft.x},${draft.y + draft.h} ${draft.x + draft.w},${draft.y + draft.h}`}
						fill='rgba(234,179,8,0.25)'
						stroke='#d97706'
						strokeDasharray='4 2'
						strokeWidth={1.5}
					/>
				);
			default:
				return null;
		}
	};

	return (
		<div className='flex-1 bg-gray-100 dark:bg-gray-900 p-4 overflow-auto'>
			<div
				className='w-full h-full min-h-[600px] bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 relative overflow-hidden'
				style={{ transform: `scale(${scale})`, transformOrigin: "top left" }}>
				<svg
					ref={canvasRef}
					className='w-full h-full'
					onPointerDown={onPointerDown}
					onPointerMove={onPointerMove}
					onPointerUp={onPointerUp}
					onContextMenu={onContextMenu}
					style={{ cursor: selectedTool === "select" ? "default" : "crosshair" }}>
					{gridPattern}
					{showGrid && (
						<rect
							width='100%'
							height='100%'
							fill='url(#grid)'
						/>
					)}

					{/* Render all shapes */}
					{shapes.map(renderShape)}

					{/* Render selection handles */}
					{shapes.map(renderSelectionHandles)}

					{/* Render draft shape */}
					{renderDraft()}
				</svg>
			</div>
		</div>
	);
};

export default DesignerCanvas;
