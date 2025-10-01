"use client";

import { useRef, forwardRef } from "react";
import {
	Thermometer,
	Droplet,
	Gauge,
	Activity,
	Sun,
	Volume2,
	MousePointer,
	ToggleLeft,
	Settings2,
	Power,
	Zap,
	Settings,
	Monitor,
} from "lucide-react";

const DesignerCanvas = forwardRef(
	(
		{
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
			onResize,
			latestByDevice = {},
			formatValue,
			getSeries,
			fullSize = false,
		},
		ref,
	) => {
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

		// Get widget metadata
		const getWidgetMeta = (kindRaw) => {
			const kind = (typeof kindRaw === "string" ? kindRaw : "widget").toLowerCase();
			const map = {
				// Sensor widgets
				temperature: {
					icon: Thermometer,
					stroke: "#2563eb",
					value: "#1e293b",
					accent: "rgba(37,99,235,0.06)",
					unit: "°C",
					type: "sensor",
				},
				humidity: {
					icon: Droplet,
					stroke: "#16a34a",
					value: "#064e3b",
					accent: "rgba(22,163,74,0.08)",
					unit: "%",
					type: "sensor",
				},
				pressure: {
					icon: Gauge,
					stroke: "#7c3aed",
					value: "#2e1065",
					accent: "rgba(124,58,237,0.08)",
					unit: "hPa",
					type: "sensor",
				},
				light: {
					icon: Sun,
					stroke: "#ca8a04",
					value: "#713f12",
					accent: "rgba(202,138,4,0.08)",
					unit: "lx",
					type: "sensor",
				},
				sound: {
					icon: Volume2,
					stroke: "#db2777",
					value: "#831843",
					accent: "rgba(219,39,119,0.08)",
					unit: "dB",
					type: "sensor",
				},
				motion: {
					icon: Activity,
					stroke: "#d97706",
					value: "#7c2d12",
					accent: "rgba(217,119,6,0.08)",
					unit: "",
					type: "sensor",
				},
				// Control widgets
				button: {
					icon: MousePointer,
					stroke: "#6b7280",
					value: "#374151",
					accent: "rgba(107,114,128,0.08)",
					unit: "",
					type: "control",
				},
				toggle: {
					icon: ToggleLeft,
					stroke: "#6366f1",
					value: "#312e81",
					accent: "rgba(99,102,241,0.08)",
					unit: "",
					type: "control",
				},
				slider: {
					icon: Settings2,
					stroke: "#0d9488",
					value: "#134e4a",
					accent: "rgba(13,148,136,0.08)",
					unit: "",
					type: "control",
				},
				switch: {
					icon: Power,
					stroke: "#dc2626",
					value: "#7f1d1d",
					accent: "rgba(220,38,38,0.08)",
					unit: "",
					type: "control",
				},
				progress: {
					icon: Zap,
					stroke: "#059669",
					value: "#064e3b",
					accent: "rgba(5,150,105,0.08)",
					unit: "",
					type: "control",
				},
				knob: {
					icon: Settings,
					stroke: "#d97706",
					value: "#7c2d12",
					accent: "rgba(217,119,6,0.08)",
					unit: "",
					type: "control",
				},
				// Display widgets
				chart: {
					icon: Monitor,
					stroke: "#0891b2",
					value: "#164e63",
					accent: "rgba(8,145,178,0.08)",
					unit: "",
					type: "display",
				},
				widget: {
					icon: Activity,
					stroke: "#2563eb",
					value: "#0f172a",
					accent: "rgba(37,99,235,0.06)",
					unit: "",
					type: "widget",
				},
			};
			return map[kind] || map.widget;
		};

		// Render control widgets
		const renderControlWidget = (shape, meta, Icon, value) => {
			const commonProps = {
				onPointerDown: (e) => {
					e.preventDefault();
					onShapeClick(e, shape.id);
				},
				onContextMenu: (e) => onContextMenu(e, shape.id),
				style: {
					cursor: selectedTool === "select" ? "move" : "default",
					userSelect: "none",
				},
			};

			switch (shape.widgetKind) {
				case "button":
					return (
						<g
							key={shape.id}
							{...commonProps}>
							{/* Button background */}
							<rect
								x={shape.x}
								y={shape.y}
								width={shape.w}
								height={shape.h}
								fill={shape.pressed ? meta.stroke : meta.accent}
								stroke={meta.stroke}
								strokeWidth={2}
								rx={8}
								ry={8}
							/>
							{/* Button icon */}
							<foreignObject
								x={shape.x + 8}
								y={shape.y + 8}
								width={24}
								height={24}>
								<div className='flex items-center justify-center w-6 h-6'>
									<Icon
										className='w-5 h-5'
										style={{ color: shape.pressed ? "#ffffff" : meta.stroke }}
									/>
								</div>
							</foreignObject>
							{/* Button label */}
							<text
								x={shape.x + shape.w / 2}
								y={shape.y + shape.h / 2 + 8}
								textAnchor='middle'
								fontSize='12'
								fontWeight='500'
								fill={shape.pressed ? "#ffffff" : meta.value}
								fontFamily='Arial, sans-serif'>
								{shape.label || "Button"}
							</text>
						</g>
					);

				case "toggle":
					const toggleState = shape.toggled || false;
					return (
						<g
							key={shape.id}
							{...commonProps}>
							{/* Toggle background */}
							<rect
								x={shape.x}
								y={shape.y}
								width={shape.w}
								height={shape.h}
								fill={meta.accent}
								stroke={meta.stroke}
								strokeWidth={2}
								rx={8}
								ry={8}
							/>
							{/* Toggle switch */}
							<rect
								x={shape.x + (toggleState ? shape.w - 40 : 8)}
								y={shape.y + 8}
								width={32}
								height={shape.h - 16}
								fill={toggleState ? meta.stroke : "#e5e7eb"}
								rx={16}
								ry={16}
							/>
							{/* Toggle icon */}
							<foreignObject
								x={shape.x + 8}
								y={shape.y + 8}
								width={24}
								height={24}>
								<div className='flex items-center justify-center w-6 h-6'>
									<Icon
										className='w-5 h-5'
										style={{ color: meta.stroke }}
									/>
								</div>
							</foreignObject>
							{/* Toggle label */}
							<text
								x={shape.x + shape.w / 2}
								y={shape.y + shape.h - 8}
								textAnchor='middle'
								fontSize='10'
								fill={meta.stroke}
								fontFamily='Arial, sans-serif'>
								{toggleState ? "ON" : "OFF"}
							</text>
						</g>
					);

				case "slider":
					const sliderValue = Number(value.text) || 0;
					const sliderPercent = Math.max(0, Math.min(100, sliderValue));
					return (
						<g
							key={shape.id}
							{...commonProps}>
							{/* Slider background */}
							<rect
								x={shape.x}
								y={shape.y}
								width={shape.w}
								height={shape.h}
								fill={meta.accent}
								stroke={meta.stroke}
								strokeWidth={2}
								rx={8}
								ry={8}
							/>
							{/* Slider track */}
							<rect
								x={shape.x + 8}
								y={shape.y + shape.h / 2 - 2}
								width={shape.w - 16}
								height={4}
								fill='#e5e7eb'
								rx={2}
								ry={2}
							/>
							{/* Slider fill */}
							<rect
								x={shape.x + 8}
								y={shape.y + shape.h / 2 - 2}
								width={(shape.w - 16) * (sliderPercent / 100)}
								height={4}
								fill={meta.stroke}
								rx={2}
								ry={2}
							/>
							{/* Slider handle */}
							<circle
								cx={shape.x + 8 + (shape.w - 16) * (sliderPercent / 100)}
								cy={shape.y + shape.h / 2}
								r={8}
								fill={meta.stroke}
								stroke='#ffffff'
								strokeWidth={2}
							/>
							{/* Slider icon */}
							<foreignObject
								x={shape.x + 8}
								y={shape.y + 8}
								width={24}
								height={24}>
								<div className='flex items-center justify-center w-6 h-6'>
									<Icon
										className='w-5 h-5'
										style={{ color: meta.stroke }}
									/>
								</div>
							</foreignObject>
							{/* Slider value */}
							<text
								x={shape.x + shape.w / 2}
								y={shape.y + shape.h - 8}
								textAnchor='middle'
								fontSize='10'
								fill={meta.stroke}
								fontFamily='Arial, sans-serif'>
								{sliderPercent.toFixed(0)}%
							</text>
						</g>
					);

				case "switch":
					const switchState = shape.switched || false;
					return (
						<g
							key={shape.id}
							{...commonProps}>
							{/* Switch background */}
							<rect
								x={shape.x}
								y={shape.y}
								width={shape.w}
								height={shape.h}
								fill={meta.accent}
								stroke={meta.stroke}
								strokeWidth={2}
								rx={8}
								ry={8}
							/>
							{/* Switch track */}
							<rect
								x={shape.x + 8}
								y={shape.y + shape.h / 2 - 8}
								width={shape.w - 16}
								height={16}
								fill={switchState ? meta.stroke : "#e5e7eb"}
								rx={8}
								ry={8}
							/>
							{/* Switch handle */}
							<circle
								cx={shape.x + (switchState ? shape.w - 20 : 20)}
								cy={shape.y + shape.h / 2}
								r={6}
								fill='#ffffff'
								stroke={meta.stroke}
								strokeWidth={1}
							/>
							{/* Switch icon */}
							<foreignObject
								x={shape.x + 8}
								y={shape.y + 8}
								width={24}
								height={24}>
								<div className='flex items-center justify-center w-6 h-6'>
									<Icon
										className='w-5 h-5'
										style={{ color: meta.stroke }}
									/>
								</div>
							</foreignObject>
							{/* Switch label */}
							<text
								x={shape.x + shape.w / 2}
								y={shape.y + shape.h - 8}
								textAnchor='middle'
								fontSize='10'
								fill={meta.stroke}
								fontFamily='Arial, sans-serif'>
								{switchState ? "ON" : "OFF"}
							</text>
						</g>
					);

				case "progress":
					const progressValue = Number(value.text) || 0;
					const progressPercent = Math.max(0, Math.min(100, progressValue));
					return (
						<g
							key={shape.id}
							{...commonProps}>
							{/* Progress background */}
							<rect
								x={shape.x}
								y={shape.y}
								width={shape.w}
								height={shape.h}
								fill={meta.accent}
								stroke={meta.stroke}
								strokeWidth={2}
								rx={8}
								ry={8}
							/>
							{/* Progress bar */}
							<rect
								x={shape.x + 8}
								y={shape.y + 8}
								width={(shape.w - 16) * (progressPercent / 100)}
								height={shape.h - 16}
								fill={meta.stroke}
								rx={4}
								ry={4}
							/>
							{/* Progress icon */}
							<foreignObject
								x={shape.x + 8}
								y={shape.y + 8}
								width={24}
								height={24}>
								<div className='flex items-center justify-center w-6 h-6'>
									<Icon
										className='w-5 h-5'
										style={{ color: meta.stroke }}
									/>
								</div>
							</foreignObject>
							{/* Progress value */}
							<text
								x={shape.x + shape.w / 2}
								y={shape.y + shape.h / 2 + 4}
								textAnchor='middle'
								fontSize='12'
								fontWeight='600'
								fill='#ffffff'
								fontFamily='Arial, sans-serif'>
								{progressPercent.toFixed(0)}%
							</text>
						</g>
					);

				case "knob":
					const knobValue = Number(value.text) || 0;
					const knobAngle = (knobValue / 100) * 270 - 135; // -135 to 135 degrees
					return (
						<g
							key={shape.id}
							{...commonProps}>
							{/* Knob background */}
							<rect
								x={shape.x}
								y={shape.y}
								width={shape.w}
								height={shape.h}
								fill={meta.accent}
								stroke={meta.stroke}
								strokeWidth={2}
								rx={8}
								ry={8}
							/>
							{/* Knob circle */}
							<circle
								cx={shape.x + shape.w / 2}
								cy={shape.y + shape.h / 2}
								r={Math.min(shape.w, shape.h) / 2 - 12}
								fill='#ffffff'
								stroke={meta.stroke}
								strokeWidth={2}
							/>
							{/* Knob indicator */}
							<line
								x1={shape.x + shape.w / 2}
								y1={shape.y + shape.h / 2}
								x2={shape.x + shape.w / 2 + Math.cos((knobAngle * Math.PI) / 180) * (Math.min(shape.w, shape.h) / 2 - 20)}
								y2={shape.y + shape.h / 2 + Math.sin((knobAngle * Math.PI) / 180) * (Math.min(shape.w, shape.h) / 2 - 20)}
								stroke={meta.stroke}
								strokeWidth={3}
								strokeLinecap='round'
							/>
							{/* Knob icon */}
							<foreignObject
								x={shape.x + 8}
								y={shape.y + 8}
								width={24}
								height={24}>
								<div className='flex items-center justify-center w-6 h-6'>
									<Icon
										className='w-5 h-5'
										style={{ color: meta.stroke }}
									/>
								</div>
							</foreignObject>
							{/* Knob value */}
							<text
								x={shape.x + shape.w / 2}
								y={shape.y + shape.h - 8}
								textAnchor='middle'
								fontSize='10'
								fill={meta.stroke}
								fontFamily='Arial, sans-serif'>
								{knobValue.toFixed(0)}%
							</text>
						</g>
					);

				default:
					return null;
			}
		};

		// Render display widgets
		const renderDisplayWidget = (shape, meta, Icon, value) => {
			const commonProps = {
				onPointerDown: (e) => {
					e.preventDefault();
					onShapeClick(e, shape.id);
				},
				onContextMenu: (e) => onContextMenu(e, shape.id),
				style: {
					cursor: selectedTool === "select" ? "move" : "default",
					userSelect: "none",
				},
			};

			switch (shape.widgetKind) {
				case "chart":
					return (
						<g
							key={shape.id}
							{...commonProps}>
							{/* Chart background */}
							<rect
								x={shape.x}
								y={shape.y}
								width={shape.w}
								height={shape.h}
								fill={meta.accent}
								stroke={meta.stroke}
								strokeWidth={2}
								rx={8}
								ry={8}
							/>
							{/* Chart icon */}
							<foreignObject
								x={shape.x + 8}
								y={shape.y + 8}
								width={24}
								height={24}>
								<div className='flex items-center justify-center w-6 h-6'>
									<Icon
										className='w-5 h-5'
										style={{ color: meta.stroke }}
									/>
								</div>
							</foreignObject>
							{/* Chart title */}
							<text
								x={shape.x + shape.w / 2}
								y={shape.y + shape.h / 2 - 8}
								textAnchor='middle'
								fontSize='12'
								fontWeight='500'
								fill={meta.value}
								fontFamily='Arial, sans-serif'>
								Chart
							</text>
							{/* Chart value */}
							<text
								x={shape.x + shape.w / 2}
								y={shape.y + shape.h / 2 + 8}
								textAnchor='middle'
								fontSize='14'
								fontWeight='600'
								fill={meta.value}
								fontFamily='Arial, sans-serif'>
								{value.text}
							</text>
							{/* Chart unit */}
							<text
								x={shape.x + shape.w / 2}
								y={shape.y + shape.h - 8}
								textAnchor='middle'
								fontSize='10'
								fill={meta.stroke}
								fontFamily='Arial, sans-serif'>
								{value.unit}
							</text>
						</g>
					);

				default:
					return null;
			}
		};

		// Render shape based on type
		const renderShape = (shape) => {
			const isSelected = selectedId === shape.id;
			const commonProps = {
				onPointerDown: (e) => {
					e.preventDefault();
					onShapeClick(e, shape.id);
				},
				onContextMenu: (e) => onContextMenu(e, shape.id),
				style: {
					cursor: selectedTool === "select" ? "move" : "default",
					userSelect: "none",
				},
			};

			// Render widget if it has widgetKind
			if (shape.widgetKind) {
				const meta = getWidgetMeta(shape.widgetKind);
				const Icon = meta.icon;
				const value = formatValue ? formatValue(shape.deviceId, shape.dataKey) : { text: "--", unit: "" };

				// Render control widgets differently
				if (meta.type === "control") {
					return renderControlWidget(shape, meta, Icon, value);
				}

				// Render display widgets
				if (meta.type === "display") {
					return renderDisplayWidget(shape, meta, Icon, value);
				}

				// Default sensor widget rendering
				return (
					<g
						key={shape.id}
						{...commonProps}>
						{/* Background */}
						<rect
							x={shape.x}
							y={shape.y}
							width={shape.w}
							height={shape.h}
							fill={meta.accent}
							stroke={meta.stroke}
							strokeWidth={2}
							rx={8}
							ry={8}
						/>
						{/* Icon */}
						<foreignObject
							x={shape.x + 8}
							y={shape.y + 8}
							width={24}
							height={24}>
							<div className='flex items-center justify-center w-6 h-6'>
								<Icon
									className='w-5 h-5'
									style={{ color: meta.stroke }}
								/>
							</div>
						</foreignObject>
						{/* Value */}
						<text
							x={shape.x + shape.w / 2}
							y={shape.y + shape.h / 2 + 8}
							textAnchor='middle'
							fontSize='14'
							fontWeight='600'
							fill={meta.value}
							fontFamily='Arial, sans-serif'>
							{value.text}
						</text>
						{/* Unit */}
						<text
							x={shape.x + shape.w / 2}
							y={shape.y + shape.h - 8}
							textAnchor='middle'
							fontSize='10'
							fill={meta.stroke}
							fontFamily='Arial, sans-serif'>
							{value.unit}
						</text>
					</g>
				);
			}

			switch (shape.type) {
				case "rectangle":
					return (
						<rect
							key={shape.id}
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
							key={shape.id}
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
							key={shape.id}
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
							key={shape.id}
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
			const handleSize = 8 / scale;

			// Resize handles positions
			const handles = [
				{ id: "nw", x: bx - handleSize / 2, y: by - handleSize / 2 },
				{ id: "n", x: bx + bw / 2 - handleSize / 2, y: by - handleSize / 2 },
				{ id: "ne", x: bx + bw - handleSize / 2, y: by - handleSize / 2 },
				{ id: "w", x: bx - handleSize / 2, y: by + bh / 2 - handleSize / 2 },
				{ id: "e", x: bx + bw - handleSize / 2, y: by + bh / 2 - handleSize / 2 },
				{ id: "sw", x: bx - handleSize / 2, y: by + bh - handleSize / 2 },
				{ id: "s", x: bx + bw / 2 - handleSize / 2, y: by + bh - handleSize / 2 },
				{ id: "se", x: bx + bw - handleSize / 2, y: by + bh - handleSize / 2 },
			];

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

					{/* Resize handles */}
					{handles.map((handle) => (
						<rect
							key={handle.id}
							x={handle.x}
							y={handle.y}
							width={handleSize}
							height={handleSize}
							fill='#2563eb'
							stroke='#ffffff'
							strokeWidth={1}
							rx={2}
							ry={2}
							style={{
								cursor: `${handle.id}-resize`,
								userSelect: "none",
							}}
							onPointerDown={(e) => {
								e.preventDefault();
								e.stopPropagation();
								if (onResize) {
									onResize(shape, handle.id, e);
								}
							}}
						/>
					))}

					{/* Delete button */}
					<g
						onPointerDown={(e) => {
							e.preventDefault();
							e.stopPropagation();
							onDeleteShape(shape.id);
						}}
						style={{
							cursor: "pointer",
							userSelect: "none",
						}}>
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

		const containerClass =
			fullSize ?
				"absolute inset-0 bg-gray-100 dark:bg-gray-900 overflow-auto select-none"
			:	"flex-1 bg-gray-100 dark:bg-gray-900 p-4 overflow-auto select-none";
		const canvasClass =
			fullSize ?
				"w-full h-full bg-white dark:bg-gray-800 relative overflow-hidden select-none"
			:	"w-full h-full min-h-[600px] bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 relative overflow-hidden select-none";

		return (
			<div className={containerClass}>
				<div
					className={canvasClass}
					style={{ transform: `scale(${scale})`, transformOrigin: "top left" }}>
					<svg
						ref={ref}
						className='w-full h-full'
						onPointerDown={onPointerDown}
						onPointerMove={onPointerMove}
						onPointerUp={onPointerUp}
						onContextMenu={onContextMenu}
						style={{
							cursor: selectedTool === "select" ? "default" : "crosshair",
							userSelect: "none",
						}}>
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
	},
);

DesignerCanvas.displayName = "DesignerCanvas";

export default DesignerCanvas;
