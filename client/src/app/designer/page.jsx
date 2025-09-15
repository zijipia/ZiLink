"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { SkeletonDashboard } from "@/components/ui/Skeleton";
import Sidebar from "@/components/Sidebar";
import { toast } from "react-hot-toast";
import {
	Activity,
	Palette,
	Layout,
	Square,
	Circle,
	Triangle,
	Type,
	Image,
	BarChart3,
	Menu,
	LogOut,
	Save,
	Undo,
	Redo,
	Grid,
	Maximize,
	Minimize,
	Settings,
	Eye,
	Code,
	ArrowUp,
	ArrowDown,
	ChevronsUp,
	ChevronsDown,
	Thermometer,
	Droplet,
	Gauge,
	Sun,
	Volume2,
	MousePointer,
} from "lucide-react";
import apiService from "@/lib/api";
import websocketService from "@/lib/websocket";

const DesignerPage = () => {
	const { user, logout, isAuthenticated, isLoading: authLoading } = useAuth();
	const [isLoading, setIsLoading] = useState(true);
	const [sidebarOpen, setSidebarOpen] = useState(true);
	const [selectedTool, setSelectedTool] = useState("select");
	const [showGrid, setShowGrid] = useState(true);
	const [canvasZoom, setCanvasZoom] = useState(100);
	const router = useRouter();

	const [layout, setLayout] = useState([]);

	// Devices for data binding
	const [devices, setDevices] = useState([]);
	const [defaultDeviceId, setDefaultDeviceId] = useState("");

	// Drawing state and helpers
	const [shapes, setShapes] = useState([]);
	const [isDrawing, setIsDrawing] = useState(false);
	const [draft, setDraft] = useState(null); // { type, startX, startY, x, y, w, h }
	const canvasRef = useRef(null);
	const [dragging, setDragging] = useState(null); // { id, offsetX, offsetY }
	const [resizing, setResizing] = useState(null); // { id, handle, startX, startY, x, y, w, h }
	const [latestByDevice, setLatestByDevice] = useState({}); // { [deviceId]: { sensorData, timestamp } }
	const [seriesByKey, setSeriesByKey] = useState({}); // { `${deviceId}|${key}`: number[] }
	const [pointerDown, setPointerDown] = useState(null); // { id, x, y, t, moved }
	const [ctxMenu, setCtxMenu] = useState(null); // { x, y, targetId, scope }
	const canvasBoxRef = useRef(null);
	const [editingTextId, setEditingTextId] = useState(null);
	const [editingValue, setEditingValue] = useState("");
	const [selectedId, setSelectedId] = useState(null);

	const containerVariants = {
		hidden: { opacity: 0 },
		visible: {
			opacity: 1,
			transition: {
				staggerChildren: 0.1,
				delayChildren: 0.2,
			},
		},
	};

	const itemVariants = {
		hidden: { opacity: 0, y: 20 },
		visible: { opacity: 1, y: 0 },
	};

	const tools = [
		{ id: "select", name: "Select", icon: Layout },
		{ id: "rectangle", name: "Rectangle", icon: Square },
		{ id: "circle", name: "Circle", icon: Circle },
		{ id: "triangle", name: "Triangle", icon: Triangle },
		{ id: "text", name: "Text", icon: Type },
		{ id: "image", name: "Image", icon: Image },
		{ id: "chart", name: "Chart", icon: BarChart3 },
		// Widget tools (can draw directly, not just from right panel)
		{ id: "temperature", name: "Temperature", icon: Thermometer },
		{ id: "humidity", name: "Humidity", icon: Droplet },
		{ id: "pressure", name: "Pressure", icon: Gauge },
		{ id: "light", name: "Light", icon: Sun },
		{ id: "sound", name: "Sound", icon: Volume2 },
		{ id: "motion", name: "Motion", icon: Activity },
		{ id: "button", name: "Button", icon: MousePointer },
	];

	const widgets = [
		{ id: "temperature", name: "Temperature", icon: Thermometer, color: "blue" },
		{ id: "humidity", name: "Humidity", icon: Droplet, color: "green" },
		{ id: "pressure", name: "Pressure", icon: Gauge, color: "purple" },
		{ id: "motion", name: "Motion", icon: Activity, color: "orange" },
		{ id: "light", name: "Light", icon: Sun, color: "yellow" },
		{ id: "sound", name: "Sound", icon: Volume2, color: "pink" },
	];

	useEffect(() => {
		if (!authLoading && !isAuthenticated) {
			router.push("/auth/login");
			return;
		}

		if (isAuthenticated) {
			loadDesignerData();
			loadDevices();
		}
	}, [isAuthenticated, authLoading, router]);

	// Handle sidebar visibility based on screen size
	useEffect(() => {
		const handleResize = () => {
			if (window.innerWidth >= 1024) {
				setSidebarOpen(true);
			} else {
				setSidebarOpen(false);
			}
		};

		handleResize();
		window.addEventListener("resize", handleResize);
		return () => window.removeEventListener("resize", handleResize);
	}, []);

	const scale = canvasZoom / 100;

	const titleCase = (txt) => {
		if (!txt || typeof txt !== "string") return "Widget";
		return txt.charAt(0).toUpperCase() + txt.slice(1);
	};

	const widgetToolIds = ["temperature", "humidity", "pressure", "light", "sound", "motion", "chart", "button"];

	const getWidgetMeta = (kindRaw) => {
		const kind = (kindRaw || "widget").toLowerCase();
		const map = {
			temperature: { icon: Thermometer, stroke: "#2563eb", value: "#1e293b", accent: "rgba(37,99,235,0.06)", unit: "Â°C" },
			humidity: { icon: Droplet, stroke: "#16a34a", value: "#064e3b", accent: "rgba(22,163,74,0.08)", unit: "%" },
			pressure: { icon: Gauge, stroke: "#7c3aed", value: "#2e1065", accent: "rgba(124,58,237,0.08)", unit: "hPa" },
			light: { icon: Sun, stroke: "#ca8a04", value: "#713f12", accent: "rgba(202,138,4,0.08)", unit: "lx" },
			sound: { icon: Volume2, stroke: "#db2777", value: "#831843", accent: "rgba(219,39,119,0.08)", unit: "dB" },
			motion: { icon: Activity, stroke: "#d97706", value: "#7c2d12", accent: "rgba(217,119,6,0.08)", unit: "" },
			widget: { icon: Activity, stroke: "#2563eb", value: "#0f172a", accent: "rgba(37,99,235,0.06)", unit: "" },
		};
		return map[kind] || map.widget;
	};

	const formatDisplay = (kind, { text, unit }) => {
		const meta = getWidgetMeta(kind);
		let u = unit || meta.unit || "";
		let t = text;
		// Normalize numeric to fixed decimals for some metrics
		const asNum = Number(t);
		if (!isNaN(asNum) && isFinite(asNum)) {
			if (["temperature", "humidity", "pressure", "light", "sound"].includes((kind || "").toLowerCase())) {
				t = asNum.toFixed(1);
			}
		}
		// Special for motion
		if ((kind || "").toLowerCase() === "motion") {
			const on = String(text).toLowerCase();
			return on === "true" || on === "1" || asNum > 0 ? { text: "Detected", unit: "" } : { text: "Idle", unit: "" };
		}
		return { text: t, unit: u };
	};

	const loadDesignerData = async () => {
		try {
			setIsLoading(true);
			const saved = await apiService.getLayout();
			const list = Array.isArray(saved) ? saved : [];
			setLayout(list);
			setShapes(list);
		} catch (error) {
			console.error("Failed to load designer data:", error);
		} finally {
			setIsLoading(false);
		}
	};

	const loadDevices = async () => {
		try {
			const res = await apiService.getDevices({ limit: 100 });
			const list = res?.devices || [];
			setDevices(list);
			if (list.length && !defaultDeviceId) setDefaultDeviceId(list[0].deviceId);
		} catch (e) {
			console.error("Failed to load devices:", e);
		}
	};

	// WebSocket subscriptions for live values of used devices
	useEffect(() => {
		const onDeviceData = (msg) => {
			const { deviceId, sensorData, timestamp } = msg || {};
			if (!deviceId || !Array.isArray(sensorData)) return;
			setLatestByDevice((prev) => ({ ...prev, [deviceId]: { sensorData, timestamp } }));
			// Update series for each numeric sensor
			setSeriesByKey((prev) => {
				const next = { ...prev };
				sensorData.forEach((s) => {
					const k = `${deviceId}|${(s?.type || "").toLowerCase()}`;
					const v = Number(s?.value);
					if (!isNaN(v) && isFinite(v)) {
						next[k] = [...(next[k] || []), v].slice(-60);
					}
				});
				return next;
			});
		};
		const onDeviceBatchData = (msg) => {
			const { deviceId, batchData } = msg || {};
			if (!deviceId || !Array.isArray(batchData) || batchData.length === 0) return;
			const last = batchData[batchData.length - 1];
			setLatestByDevice((prev) => ({ ...prev, [deviceId]: { sensorData: last.sensorData || [], timestamp: last.timestamp } }));
			setSeriesByKey((prev) => {
				const next = { ...prev };
				batchData.forEach((item) => {
					(item.sensorData || []).forEach((s) => {
						const k = `${deviceId}|${(s?.type || "").toLowerCase()}`;
						const v = Number(s?.value);
						if (!isNaN(v) && isFinite(v)) {
							next[k] = [...(next[k] || []), v].slice(-60);
						}
					});
				});
				return next;
			});
		};

		websocketService.on("device_data", onDeviceData);
		websocketService.on("device_batch_data", onDeviceBatchData);

		// Subscribe to currently used devices
		const ids = new Set();
		shapes.forEach((s) => s.deviceId && ids.add(s.deviceId));
		if (defaultDeviceId) ids.add(defaultDeviceId);
		ids.forEach((id) => websocketService.subscribeToDevice(id));

		return () => {
			websocketService.off("device_data", onDeviceData);
			websocketService.off("device_batch_data", onDeviceBatchData);
		};
	}, [shapes, defaultDeviceId]);
	// Keyboard shortcuts: delete, duplicate, save
	useEffect(() => {
		const onKeyDown = (e) => {
			if (editingTextId) {
				if (e.key === "Escape") setEditingTextId(null);
				return;
			}
			if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
				e.preventDefault();
				handleSaveLayout();
				return;
			}
			if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "d") {
				e.preventDefault();
				if (!selectedId) return;
				const s = shapes.find((x) => x.id === selectedId);
				if (!s) return;
				const clone = { ...s, id: crypto.randomUUID(), x: (s.x || 0) + 12, y: (s.y || 0) + 12 };
				setShapes((prev) => [...prev, clone]);
				setSelectedId(clone.id);
				return;
			}
			if (e.key === "Delete" || e.key === "Backspace") {
				if (!selectedId) return;
				setShapes((prev) => prev.filter((s) => s.id !== selectedId));
				setSelectedId(null);
				return;
			}
			if (e.key === "Escape") {
				setCtxMenu(null);
				setDragging(null);
				setResizing(null);
			}
		};
		window.addEventListener("keydown", onKeyDown);
		return () => window.removeEventListener("keydown", onKeyDown);
	}, [selectedId, shapes, editingTextId]);

	const formatValue = (deviceId, key) => {
		if (!deviceId || !key) return { text: "--", unit: "" };
		const latest = latestByDevice[deviceId];
		const sensors = latest?.sensorData || [];
		const match = sensors.find((s) => (s?.type || "").toLowerCase() === key.toLowerCase());
		if (!match) {
			// fallback to first numeric
			const firstNum = sensors.find((s) => typeof s?.value === "number");
			if (!firstNum) return { text: "--", unit: "" };
			return { text: String(firstNum.value), unit: firstNum.unit || "" };
		}
		const val = match.value;
		const unit = match.unit || "";
		if (typeof val === "number") return { text: String(val), unit };
		if (typeof val === "string") return { text: val, unit };
		return { text: JSON.stringify(val), unit };
	};

	const getSeries = (deviceId, key) => {
		if (!deviceId || !key) return [];
		const arr = seriesByKey[`${deviceId}|${key.toLowerCase()}`] || [];
		return arr;
	};

	const rectFromPoints = (x1, y1, x2, y2) => {
		const x = Math.min(x1, x2);
		const y = Math.min(y1, y2);
		const w = Math.abs(x2 - x1);
		const h = Math.abs(y2 - y1);
		return { x, y, w, h };
	};

	const getCanvasPoint = (e) => {
		const el = canvasRef.current;
		if (!el) return { x: 0, y: 0 };
		const rect = el.getBoundingClientRect();
		const x = (e.clientX - rect.left) / scale;
		const y = (e.clientY - rect.top) / scale;
		return { x, y };
	};

	const handleCanvasMouseDown = (e) => {
		if (ctxMenu) setCtxMenu(null);
		// Selection mode: click empty space to clear selection
		if (selectedTool === "select") {
			setSelectedId(null);
			return;
		}
		if (selectedTool === "text") {
			const { x, y } = getCanvasPoint(e);
			const newShape = {
				id: crypto.randomUUID(),
				type: "text",
				x,
				y,
				text: "Text",
				color: "#ffffff",
				fontSize: 14,
			};
			setShapes((s) => [...s, newShape]);
			return;
		}

		if (["rectangle", "circle", "triangle"].includes(selectedTool) || widgetToolIds.includes(selectedTool)) {
			const { x, y } = getCanvasPoint(e);
			setIsDrawing(true);
			if (widgetToolIds.includes(selectedTool)) {
				const dk = selectedTool === "chart" ? "temperature" : selectedTool;
				setDraft({
					type: "rectangle",
					widgetKind: selectedTool,
					deviceId: defaultDeviceId || devices[0]?.deviceId || "",
					dataKey: dk,
					startX: x,
					startY: y,
					x,
					y,
					w: 0,
					h: 0,
				});
			} else {
				setDraft({ type: selectedTool, startX: x, startY: y, x, y, w: 0, h: 0 });
			}
		}
	};

	const handleCanvasMouseMove = (e) => {
		const { x, y } = getCanvasPoint(e);
		if (pointerDown?.id && !pointerDown.moved) {
			const dx = x - pointerDown.x;
			const dy = y - pointerDown.y;
			if (Math.hypot(dx, dy) > 3) setPointerDown({ ...pointerDown, moved: true });
		}
		if (resizing?.id) {
			const dx = x - resizing.startX;
			const dy = y - resizing.startY;
			const minW = 20;
			const minH = 20;
			let nx = resizing.x;
			let ny = resizing.y;
			let nw = resizing.w;
			let nh = resizing.h;
			switch (resizing.handle) {
				case "e":
					nw = resizing.w + dx;
					break;
				case "w":
					nx = resizing.x + dx;
					nw = resizing.w - dx;
					break;
				case "s":
					nh = resizing.h + dy;
					break;
				case "n":
					ny = resizing.y + dy;
					nh = resizing.h - dy;
					break;
				case "se":
					nw = resizing.w + dx;
					nh = resizing.h + dy;
					break;
				case "ne":
					ny = resizing.y + dy;
					nh = resizing.h - dy;
					nw = resizing.w + dx;
					break;
				case "sw":
					nx = resizing.x + dx;
					nw = resizing.w - dx;
					nh = resizing.h + dy;
					break;
				case "nw":
					nx = resizing.x + dx;
					ny = resizing.y + dy;
					nw = resizing.w - dx;
					nh = resizing.h - dy;
					break;
				default:
					break;
			}
			// Clamp to minimums and adjust origin if needed
			if (nw < minW) {
				if (resizing.handle.includes("w")) {
					nx = resizing.x + (resizing.w - minW);
				}
				nw = minW;
			}
			if (nh < minH) {
				if (resizing.handle.includes("n")) {
					ny = resizing.y + (resizing.h - minH);
				}
				nh = minH;
			}
			setShapes((prev) =>
				prev.map((s) => (s.id === resizing.id ? { ...s, x: nx, y: ny, w: Math.max(minW, nw), h: Math.max(minH, nh) } : s)),
			);
			return;
		}
		if (dragging?.id) {
			// Move selected shape
			const nx = x - dragging.offsetX;
			const ny = y - dragging.offsetY;
			setShapes((prev) => prev.map((s) => (s.id === dragging.id ? { ...s, x: nx, y: ny } : s)));
			return;
		}
		if (isDrawing && draft) {
			const r = rectFromPoints(draft.startX, draft.startY, x, y);
			setDraft({ ...draft, ...r });
		}
	};

	const handleCanvasMouseUp = () => {
		// Handle button click (no drag)
		if (pointerDown?.id) {
			const shape = shapes.find((s) => s.id === pointerDown.id);
			if (shape?.widgetKind === "button" && !pointerDown.moved && Date.now() - pointerDown.t < 600) {
				pressButton(shape);
			}
			setPointerDown(null);
		}
		if (resizing?.id) {
			setResizing(null);
			return;
		}
		if (dragging?.id) {
			setDragging(null);
			return;
		}
		if (isDrawing && draft) {
			setIsDrawing(false);
			const { x, y, w, h, type } = draft;
			if (w < 4 && h < 4) {
				setDraft(null);
				return;
			}
			const newShape = {
				id: crypto.randomUUID(),
				type,
				x,
				y,
				w,
				h,
				...(draft.widgetKind ? { widgetKind: draft.widgetKind, deviceId: draft.deviceId, dataKey: draft.dataKey } : {}),
			};
			setShapes((prev) => [...prev, newShape]);
			setDraft(null);
		}
	};

	const handleCanvasMouseLeave = () => {
		if (dragging?.id) setDragging(null);
		if (resizing?.id) setResizing(null);
		if (isDrawing) setIsDrawing(false);
		setDraft(null);
	};

	const startResize = (shape, handle, e) => {
		e.stopPropagation();
		const p = getCanvasPoint(e);
		setSelectedId(shape.id);
		setResizing({ id: shape.id, handle, startX: p.x, startY: p.y, x: shape.x, y: shape.y, w: shape.w, h: shape.h });
	};

	const handleSaveLayout = async () => {
		try {
			await apiService.saveLayout(shapes);
			toast.success("Layout saved");
		} catch (e) {
			console.error(e);
			toast.error("Failed to save layout");
		}
	};

	// Selection + updates
	const selectedShape = React.useMemo(() => shapes.find((s) => s.id === selectedId) || null, [shapes, selectedId]);

	const updateSelectedShape = (partial) => {
		if (!selectedId) return;
		setShapes((prev) => prev.map((s) => (s.id === selectedId ? { ...s, ...partial } : s)));
	};

	const pressButton = (shape) => {
		const isToggle = (shape.buttonMode || "momentary") === "toggle";
		if (isToggle) {
			const nextState = !shape.toggled;
			setShapes((prev) => prev.map((s) => (s.id === shape.id ? { ...s, toggled: nextState } : s)));
			try {
				if (shape.deviceId) {
					const payload = shape[nextState ? "onCommand" : "offCommand"] || {
						type: "ui_button",
						id: shape.id,
						action: "toggle",
						state: nextState,
					};
					websocketService.sendDeviceCommand(shape.deviceId, payload);
				}
			} catch (e) {
				console.error("Button toggle command failed", e);
			}
			return;
		}
		// Momentary
		setShapes((prev) => prev.map((s) => (s.id === shape.id ? { ...s, pressed: true } : s)));
		setTimeout(() => {
			setShapes((prev) => prev.map((s) => (s.id === shape.id ? { ...s, pressed: false } : s)));
		}, 150);
		try {
			if (shape.deviceId) {
				const payload = shape.command || { type: "ui_button", id: shape.id, action: "press", label: shape.label || "Button" };
				websocketService.sendDeviceCommand(shape.deviceId, payload);
			}
		} catch (e) {
			console.error("Button command failed", e);
		}
	};

	const moveSelectedZ = (delta) => {
		if (!selectedId) return;
		setShapes((prev) => {
			const idx = prev.findIndex((s) => s.id === selectedId);
			if (idx === -1) return prev;
			const newIndex = Math.max(0, Math.min(prev.length - 1, idx + delta));
			if (newIndex === idx) return prev;
			const copy = prev.slice();
			const [item] = copy.splice(idx, 1);
			copy.splice(newIndex, 0, item);
			return copy;
		});
	};

	const moveSelectedToFront = () => moveSelectedZ(9999);
	const moveSelectedToBack = () => moveSelectedZ(-9999);

	const availableDataKeys = React.useMemo(() => {
		if (!selectedShape) return [];
		const device = devices.find((d) => d.deviceId === (selectedShape.deviceId || defaultDeviceId));
		const fromCaps = device?.capabilities?.sensors?.map((s) => s.type)?.filter(Boolean) || [];
		const uniq = Array.from(new Set(fromCaps));
		return uniq.length ? uniq : ["temperature", "humidity", "pressure", "light", "sound", "motion"];
	}, [devices, selectedShape, defaultDeviceId]);

	const addWidget = (widgetId) => {
		const size = { w: 160, h: 90 };
		const pos = { x: 60 + (shapes.length % 6) * 12, y: 60 + (shapes.length % 6) * 12 };
		const base = {
			id: crypto.randomUUID(),
			type: "rectangle",
			...pos,
			...size,
			widgetKind: widgetId,
			deviceId: defaultDeviceId || devices[0]?.deviceId || "",
			color: "#93c5fd",
		};
		const newShape =
			widgetId === "button" ?
				{ ...base, label: "Button", command: "press", dataKey: undefined, buttonMode: "momentary", toggled: false }
			: widgetId === "chart" ? { ...base, dataKey: "temperature", showChart: true }
			: { ...base, dataKey: widgetId };
		setShapes((prev) => [...prev, newShape]);
		setSelectedId(newShape.id);
		toast.success(`Added widget: ${widgetId}`);
	};

	const handleLogout = async () => {
		try {
			await logout();
		} catch (error) {
			console.error("Logout error:", error);
		}
	};

	if (authLoading || isLoading) {
		return (
			<div className='flex min-h-screen bg-gray-50 dark:bg-gray-900'>
				<Sidebar
					isOpen={sidebarOpen}
					onClose={() => setSidebarOpen(false)}
				/>
				<main className='flex-1 transition-all'>
					<div className='bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700'>
						<div className='px-4 sm:px-6 lg:px-8'>
							<div className='flex justify-between items-center py-4'>
								<div className='flex items-center'>
									<button
										onClick={() => setSidebarOpen(true)}
										className='lg:hidden mr-4 p-2 rounded-md text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors'>
										<Menu className='h-6 w-6' />
									</button>
									<div className='w-10 h-10 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-lg flex items-center justify-center mr-4'>
										<Palette className='w-6 h-6 text-white' />
									</div>
									<div>
										<h1 className='text-2xl font-bold text-gray-900 dark:text-white'>Designer</h1>
										<p className='text-sm text-gray-500 dark:text-gray-400'>Loading...</p>
									</div>
								</div>
							</div>
						</div>
					</div>
					<div className='px-4 sm:px-6 lg:px-8 py-6'>
						<SkeletonDashboard />
					</div>
				</main>
			</div>
		);
	}

	if (!isAuthenticated) {
		return null;
	}

	return (
		<div className='flex min-h-screen bg-gray-50 dark:bg-gray-900'>
			<Sidebar
				isOpen={sidebarOpen}
				onClose={() => setSidebarOpen(false)}
			/>
			<main className='flex-1 transition-all'>
				{/* Header */}
				<div className='bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700'>
					<div className='px-4 sm:px-6 lg:px-8'>
						<div className='flex justify-between items-center py-4'>
							<div className='flex items-center'>
								<button
									onClick={() => setSidebarOpen(true)}
									className='lg:hidden mr-4 p-2 rounded-md text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors'>
									<Menu className='h-6 w-6' />
								</button>
								<div className='w-10 h-10 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-lg flex items-center justify-center mr-4'>
									<Palette className='w-6 h-6 text-white' />
								</div>
								<div>
									<h1 className='text-2xl font-bold text-gray-900 dark:text-white'>Dashboard Designer</h1>
									<p className='text-sm text-gray-500 dark:text-gray-400'>Create custom dashboards</p>
								</div>
							</div>
							<div className='flex items-center space-x-2'>
								<button
									onClick={() => window.history.back()}
									className='flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors'>
									<Undo className='w-4 h-4' />
								</button>
								<button
									onClick={() => window.history.forward()}
									className='flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors'>
									<Redo className='w-4 h-4' />
								</button>
								<button
									onClick={handleSaveLayout}
									className='flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors'>
									<Save className='w-4 h-4' />
									<span className='hidden sm:inline'>Save</span>
								</button>
								<button
									onClick={handleLogout}
									className='flex items-center space-x-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors'>
									<LogOut className='w-4 h-4' />
									<span className='hidden sm:inline'>Logout</span>
								</button>
							</div>
						</div>
					</div>
				</div>

				<div className='flex h-[calc(100vh-80px)]'>
					{/* Left Toolbar */}
					<div className='w-16 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col items-center py-4 space-y-2'>
						{tools.map((tool) => {
							const Icon = tool.icon;
							return (
								<button
									key={tool.id}
									onClick={() => setSelectedTool(tool.id)}
									className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
										selectedTool === tool.id ?
											"bg-blue-600 text-white"
										:	"text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
									}`}
									title={tool.name}>
									<Icon className='w-5 h-5' />
								</button>
							);
						})}
					</div>

					{/* Main Canvas Area */}
					<div className='flex-1 flex flex-col'>
						{/* Canvas Toolbar */}
						<div className='bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-2 flex items-center justify-between'>
							<div className='flex items-center space-x-4'>
								<button
									onClick={() => setShowGrid(!showGrid)}
									className={`flex items-center space-x-2 px-3 py-1 rounded-md text-sm ${
										showGrid ?
											"bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300"
										:	"text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
									}`}>
									<Grid className='w-4 h-4' />
									<span>Grid</span>
								</button>
								<div className='flex items-center space-x-2'>
									<button
										onClick={() => setCanvasZoom((z) => Math.max(25, z - 10))}
										className='p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700'>
										<Minimize className='w-4 h-4' />
									</button>
									<span className='text-sm text-gray-600 dark:text-gray-400'>{canvasZoom}%</span>
									<button
										onClick={() => setCanvasZoom((z) => Math.min(200, z + 10))}
										className='p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700'>
										<Maximize className='w-4 h-4' />
									</button>
								</div>
							</div>
							<div className='flex items-center space-x-2'>
								<button className='flex items-center space-x-2 px-3 py-1 rounded-md text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'>
									<Eye className='w-4 h-4' />
									<span>Preview</span>
								</button>
								<button className='flex items-center space-x-2 px-3 py-1 rounded-md text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'>
									<Code className='w-4 h-4' />
									<span>Code</span>
								</button>
							</div>
						</div>

						{/* Canvas */}
						<div className='flex-1 bg-gray-100 dark:bg-gray-900 relative overflow-hidden'>
							<div className='absolute inset-0 p-8'>
								<div
									ref={canvasBoxRef}
									className='w-full h-full bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 relative'
									style={{ transform: `scale(${scale})`, transformOrigin: "top left" }}>
									{showGrid && (
										<div
											className='absolute inset-0 opacity-20'
											style={{
												backgroundImage: `
												linear-gradient(to right, #e5e7eb 1px, transparent 1px),
												linear-gradient(to bottom, #e5e7eb 1px, transparent 1px)
											`,
												backgroundSize: "20px 20px",
											}}
										/>
									)}

									{/* SVG Drawing Layer */}
									<svg
										ref={canvasRef}
										className='absolute inset-0 w-full h-full'
										onMouseDown={handleCanvasMouseDown}
										onMouseMove={handleCanvasMouseMove}
										onMouseUp={handleCanvasMouseUp}
										onMouseLeave={handleCanvasMouseLeave}
										onContextMenu={(e) => {
											e.preventDefault();
											const host = canvasBoxRef.current?.getBoundingClientRect();
											if (!host) return;
											setCtxMenu({ x: e.clientX - host.left, y: e.clientY - host.top, targetId: null, scope: "canvas" });
										}}>
										{shapes.map((s) => {
											const isSel = s.id === selectedId;
											const onSelect = (e) => {
												e.stopPropagation();
												setSelectedId(s.id);
												if (selectedTool === "select") {
													const p = getCanvasPoint(e);
													setPointerDown({ id: s.id, x: p.x, y: p.y, t: Date.now(), moved: false });
													setDragging({ id: s.id, offsetX: p.x - s.x, offsetY: p.y - s.y });
												}
											};
											if (s.type === "rectangle") {
												const kind = s.dataKey || s.widgetKind || "widget";
												const meta = getWidgetMeta(kind);
												const raw = formatValue(s.deviceId || defaultDeviceId, kind);
												const { text: valText, unit } = formatDisplay(kind, raw);
												const label = titleCase(kind);
												const cx = s.x + s.w / 2;
												const top = s.y + 10;
												const valueFont = Math.max(16, Math.min(28, Math.floor(s.h * 0.35)));
												const labelY = top + 24;
												const valueY = Math.min(s.y + s.h - 10, labelY + valueFont + 8);
												const IconComp = meta.icon || Activity;
												return (
													<g
														key={s.id}
														onMouseDown={onSelect}
														onContextMenu={(e) => {
															e.preventDefault();
															const host = canvasBoxRef.current?.getBoundingClientRect();
															if (!host) return;
															setSelectedId(s.id);
															setCtxMenu({ x: e.clientX - host.left, y: e.clientY - host.top, targetId: s.id, scope: "shape" });
														}}>
														{/* Card */}
														<rect
															x={s.x}
															y={s.y}
															width={s.w}
															height={s.h}
															fill={s.customAccent || meta.accent}
															stroke={s.customStroke || meta.stroke}
															strokeWidth={2}
															rx={12}
															ry={12}
														/>
														{/* Optional inline chart */}
														{(() => {
															const show = s.showChart || s.widgetKind === "chart" || kind === "chart";
															if (!show) return null;
															const series = getSeries(s.deviceId || defaultDeviceId, s.dataKey || "temperature");
															if (series.length < 2) return null;
															const margin = 12;
															const gx = s.x + margin;
															const gy = labelY + 6;
															const gw = s.w - margin * 2;
															const gh = Math.max(24, s.h - (gy - s.y) - margin);
															const min = Math.min(...series);
															const max = Math.max(...series);
															const rng = max - min || 1;
															const step = gw / (series.length - 1);
															let d = "";
															series.forEach((v, i) => {
																const x = gx + i * step;
																const y = gy + gh - ((v - min) / rng) * gh;
																d += (i === 0 ? "M" : "L") + x + "," + y + " ";
															});
															return (
																<g>
																	<rect
																		x={gx}
																		y={gy}
																		width={gw}
																		height={gh}
																		fill='rgba(255,255,255,0.06)'
																		stroke='none'
																	/>
																	<path
																		d={d}
																		fill='none'
																		stroke={meta.stroke}
																		strokeWidth={2}
																	/>
																</g>
															);
														})()}
														{/* Icon/Title/Value or Button */}
														{(kind || "").toLowerCase() === "button" ?
															<>
																{(() => {
																	const margin = 10;
																	const bx = s.x + margin;
																	const by = s.y + margin;
																	const bw = s.w - margin * 2;
																	const bh = s.h - margin * 2;
																	const br = 10;
																	const isToggle = (s.buttonMode || "momentary") === "toggle";
																	const fill =
																		s.pressed ? "#0891b2"
																		: isToggle && s.toggled ? "#10b981"
																		: meta.stroke || "#06b6d4";
																	return (
																		<>
																			<rect
																				x={bx}
																				y={by}
																				width={bw}
																				height={bh}
																				rx={br}
																				ry={br}
																				fill={fill}
																				stroke={s.pressed ? "#0e7490" : meta.value || "#0e7490"}
																				strokeWidth={2}
																			/>
																			<text
																				x={bx + bw / 2}
																				y={by + bh / 2 + 5}
																				fill='#ffffff'
																				fontSize={Math.max(12, Math.min(20, bh * 0.45))}
																				fontWeight='700'
																				textAnchor='middle'>
																				{(s.buttonMode || "momentary") === "toggle" ?
																					s.toggled ?
																						s.onLabel || s.label || "On"
																					:	s.offLabel || s.label || "Off"
																				:	s.label || "Button"}
																			</text>
																		</>
																	);
																})()}
															</>
														:	<>
																<IconComp
																	x={cx - 10}
																	y={top}
																	width={20}
																	height={20}
																	color={meta.stroke}
																	stroke={meta.stroke}
																/>
															</>
														}
														{/* Title */}
														<text
															x={cx}
															y={labelY}
															fill={s.textColor || "#ffffff"}
															fontSize={12}
															textAnchor='middle'>
															{label}
														</text>
														{/* Value */}
														{(kind || "").toLowerCase() !== "button" && (
															<text
																x={cx}
																y={valueY}
																fill={s.textColor || "#ffffff"}
																fontSize={valueFont}
																fontWeight='700'
																textAnchor='middle'>
																{valText}
																{unit ? ` ${unit}` : ""}
															</text>
														)}
														{isSel && (
															<>
																<rect
																	x={s.x}
																	y={s.y}
																	width={s.w}
																	height={s.h}
																	fill='none'
																	stroke={meta.stroke}
																	strokeDasharray='4 2'
																	strokeWidth={1.5}
																	rx={12}
																	ry={12}
																/>
																{/* Resize handles */}
																{(() => {
																	const hs = 8 / Math.max(0.5, scale); // keep visual size constant
																	const cxL = s.x;
																	const cxC = s.x + s.w / 2;
																	const cxR = s.x + s.w;
																	const cyT = s.y;
																	const cyM = s.y + s.h / 2;
																	const cyB = s.y + s.h;
																	const H = [];
																	const add = (x, y, cursor, handle) => {
																		H.push(
																			<rect
																				key={`h-${handle}`}
																				x={x - hs / 2}
																				y={y - hs / 2}
																				width={hs}
																				height={hs}
																				fill='#ffffff'
																				stroke={meta.stroke}
																				strokeWidth={1}
																				style={{ cursor }}
																				onMouseDown={(ev) => startResize(s, handle, ev)}
																			/>,
																		);
																	};
																	add(cxL, cyT, "nwse-resize", "nw");
																	add(cxC, cyT, "ns-resize", "n");
																	add(cxR, cyT, "nesw-resize", "ne");
																	add(cxL, cyM, "ew-resize", "w");
																	add(cxR, cyM, "ew-resize", "e");
																	add(cxL, cyB, "nesw-resize", "sw");
																	add(cxC, cyB, "ns-resize", "s");
																	add(cxR, cyB, "nwse-resize", "se");
																	return <g>{H}</g>;
																})()}
																{/* Delete button (X) */}
																{(() => {
																	const size = 16 / Math.max(0.5, scale);
																	const bx = s.x + s.w + 6; // a bit outside top-right
																	const by = s.y - 6;
																	const onDel = (ev) => {
																		ev.stopPropagation();
																		setShapes((prev) => prev.filter((it) => it.id !== s.id));
																		if (selectedId === s.id) setSelectedId(null);
																	};
																	return (
																		<g
																			onMouseDown={onDel}
																			style={{ cursor: "pointer" }}>
																			<rect
																				x={bx - size / 2}
																				y={by - size / 2}
																				width={size}
																				height={size}
																				rx={3}
																				ry={3}
																				fill='#ef4444'
																				stroke='#b91c1c'
																				strokeWidth={1}
																			/>
																			<line
																				x1={bx - size * 0.3}
																				y1={by - size * 0.3}
																				x2={bx + size * 0.3}
																				y2={by + size * 0.3}
																				stroke='#ffffff'
																				strokeWidth={1.5}
																			/>
																			<line
																				x1={bx - size * 0.3}
																				y1={by + size * 0.3}
																				x2={bx + size * 0.3}
																				y2={by - size * 0.3}
																				stroke='#ffffff'
																				strokeWidth={1.5}
																			/>
																		</g>
																	);
																})()}
															</>
														)}
													</g>
												);
											}
											if (s.type === "circle") {
												const cx = s.x + s.w / 2;
												const cy = s.y + s.h / 2;
												return (
													<g
														key={s.id}
														onMouseDown={onSelect}
														onContextMenu={(e) => {
															e.preventDefault();
															const host = canvasBoxRef.current?.getBoundingClientRect();
															if (!host) return;
															setSelectedId(s.id);
															setCtxMenu({ x: e.clientX - host.left, y: e.clientY - host.top, targetId: s.id, scope: "shape" });
														}}>
														<ellipse
															cx={cx}
															cy={cy}
															rx={Math.abs(s.w / 2)}
															ry={Math.abs(s.h / 2)}
															fill={s.fillColor || "#bbf7d0"}
															stroke={s.strokeColor || "#16a34a"}
															strokeWidth={2}
														/>
														{isSel && (
															<>
																<ellipse
																	cx={cx}
																	cy={cy}
																	rx={Math.abs(s.w / 2)}
																	ry={Math.abs(s.h / 2)}
																	fill='none'
																	stroke={s.strokeColor || "#16a34a"}
																	strokeDasharray='4 2'
																	strokeWidth={1.5}
																/>
																{(() => {
																	const hs = 8 / Math.max(0.5, scale);
																	const cxL = s.x;
																	const cxC = s.x + s.w / 2;
																	const cxR = s.x + s.w;
																	const cyT = s.y;
																	const cyM = s.y + s.h / 2;
																	const cyB = s.y + s.h;
																	const H = [];
																	const add = (x, y, cursor, handle) => {
																		H.push(
																			<rect
																				key={`h-${handle}`}
																				x={x - hs / 2}
																				y={y - hs / 2}
																				width={hs}
																				height={hs}
																				fill='#ffffff'
																				stroke='#16a34a'
																				strokeWidth={1}
																				style={{ cursor }}
																				onMouseDown={(ev) => startResize(s, handle, ev)}
																			/>,
																		);
																	};
																	add(cxL, cyT, "nwse-resize", "nw");
																	add(cxC, cyT, "ns-resize", "n");
																	add(cxR, cyT, "nesw-resize", "ne");
																	add(cxL, cyM, "ew-resize", "w");
																	add(cxR, cyM, "ew-resize", "e");
																	add(cxL, cyB, "nesw-resize", "sw");
																	add(cxC, cyB, "ns-resize", "s");
																	add(cxR, cyB, "nwse-resize", "se");
																	return <g>{H}</g>;
																})()}
																{/* Delete button (X) */}
																{(() => {
																	const size = 16 / Math.max(0.5, scale);
																	const bx = cx + Math.abs(s.w / 2) + 6;
																	const by = cy - Math.abs(s.h / 2) - 6;
																	const onDel = (ev) => {
																		ev.stopPropagation();
																		setShapes((prev) => prev.filter((it) => it.id !== s.id));
																		if (selectedId === s.id) setSelectedId(null);
																	};
																	return (
																		<g
																			onMouseDown={onDel}
																			style={{ cursor: "pointer" }}>
																			<rect
																				x={bx - size / 2}
																				y={by - size / 2}
																				width={size}
																				height={size}
																				rx={3}
																				ry={3}
																				fill='#ef4444'
																				stroke='#b91c1c'
																				strokeWidth={1}
																			/>
																			<line
																				x1={bx - size * 0.3}
																				y1={by - size * 0.3}
																				x2={bx + size * 0.3}
																				y2={by + size * 0.3}
																				stroke='#ffffff'
																				strokeWidth={1.5}
																			/>
																			<line
																				x1={bx - size * 0.3}
																				y1={by + size * 0.3}
																				x2={bx + size * 0.3}
																				y2={by - size * 0.3}
																				stroke='#ffffff'
																				strokeWidth={1.5}
																			/>
																		</g>
																	);
																})()}
															</>
														)}
													</g>
												);
											}
											if (s.type === "triangle") {
												const x1 = s.x + s.w / 2;
												const y1 = s.y;
												const x2 = s.x;
												const y2 = s.y + s.h;
												const x3 = s.x + s.w;
												const y3 = s.y + s.h;
												return (
													<g
														key={s.id}
														onMouseDown={onSelect}
														onContextMenu={(e) => {
															e.preventDefault();
															const host = canvasBoxRef.current?.getBoundingClientRect();
															if (!host) return;
															setSelectedId(s.id);
															setCtxMenu({ x: e.clientX - host.left, y: e.clientY - host.top, targetId: s.id, scope: "shape" });
														}}>
														<polygon
															points={`${x1},${y1} ${x2},${y2} ${x3},${y3}`}
															fill={s.fillColor || "#fde68a"}
															stroke={s.strokeColor || "#d97706"}
															strokeWidth={2}
														/>
														{isSel && (
															<>
																<polygon
																	points={`${x1},${y1} ${x2},${y2} ${x3},${y3}`}
																	fill='none'
																	stroke={s.strokeColor || "#d97706"}
																	strokeDasharray='4 2'
																	strokeWidth={1.5}
																/>
																{(() => {
																	const hs = 8 / Math.max(0.5, scale);
																	const cxL = s.x;
																	const cxC = s.x + s.w / 2;
																	const cxR = s.x + s.w;
																	const cyT = s.y;
																	const cyM = s.y + s.h / 2;
																	const cyB = s.y + s.h;
																	const H = [];
																	const add = (x, y, cursor, handle) => {
																		H.push(
																			<rect
																				key={`h-${handle}`}
																				x={x - hs / 2}
																				y={y - hs / 2}
																				width={hs}
																				height={hs}
																				fill='#ffffff'
																				stroke='#d97706'
																				strokeWidth={1}
																				style={{ cursor }}
																				onMouseDown={(ev) => startResize(s, handle, ev)}
																			/>,
																		);
																	};
																	add(cxL, cyT, "nwse-resize", "nw");
																	add(cxC, cyT, "ns-resize", "n");
																	add(cxR, cyT, "nesw-resize", "ne");
																	add(cxL, cyM, "ew-resize", "w");
																	add(cxR, cyM, "ew-resize", "e");
																	add(cxL, cyB, "nesw-resize", "sw");
																	add(cxC, cyB, "ns-resize", "s");
																	add(cxR, cyB, "nwse-resize", "se");
																	return <g>{H}</g>;
																})()}
																{/* Delete button (X) */}
																{(() => {
																	const size = 16 / Math.max(0.5, scale);
																	const bx = x3 + 6;
																	const by = y1 - 6;
																	const onDel = (ev) => {
																		ev.stopPropagation();
																		setShapes((prev) => prev.filter((it) => it.id !== s.id));
																		if (selectedId === s.id) setSelectedId(null);
																	};
																	return (
																		<g
																			onMouseDown={onDel}
																			style={{ cursor: "pointer" }}>
																			<rect
																				x={bx - size / 2}
																				y={by - size / 2}
																				width={size}
																				height={size}
																				rx={3}
																				ry={3}
																				fill='#ef4444'
																				stroke='#b91c1c'
																				strokeWidth={1}
																			/>
																			<line
																				x1={bx - size * 0.3}
																				y1={by - size * 0.3}
																				x2={bx + size * 0.3}
																				y2={by + size * 0.3}
																				stroke='#ffffff'
																				strokeWidth={1.5}
																			/>
																			<line
																				x1={bx - size * 0.3}
																				y1={by + size * 0.3}
																				x2={bx + size * 0.3}
																				y2={by - size * 0.3}
																				stroke='#ffffff'
																				strokeWidth={1.5}
																			/>
																		</g>
																	);
																})()}
															</>
														)}
													</g>
												);
											}
											if (s.type === "text") {
												const fs = s.fontSize || 16;
												const content = s.text ?? "Text";
												const estWidth = Math.max(fs * (content.length * 0.6), fs * 4);
												const pad = 6;
												const bx = s.x - pad;
												const by = s.y - fs - pad / 2;
												const bw = estWidth + pad * 2;
												const bh = fs * 1.2 + pad;
												return (
													<g
														key={s.id}
														onMouseDown={onSelect}
														onContextMenu={(e) => {
															e.preventDefault();
															const host = canvasBoxRef.current?.getBoundingClientRect();
															if (!host) return;
															setSelectedId(s.id);
															setCtxMenu({ x: e.clientX - host.left, y: e.clientY - host.top, targetId: s.id, scope: "shape" });
														}}>
														<text
															x={s.x}
															y={s.y}
															fill={s.color || "#ffffff"}
															fontSize={fs}>
															{content}
														</text>
														{editingTextId === s.id && (
															<foreignObject
																x={bx}
																y={by}
																width={Math.max(120, content.length * (fs * 0.8))}
																height={bh + 8}>
																<input
																	autoFocus
																	value={editingValue}
																	onChange={(e) => setEditingValue(e.target.value)}
																	onBlur={() => {
																		setShapes((prev) => prev.map((sh) => (sh.id === s.id ? { ...sh, text: editingValue } : sh)));
																		setEditingTextId(null);
																	}}
																	onKeyDown={(e) => {
																		if (e.key === "Enter") {
																			e.preventDefault();
																			setShapes((prev) =>
																				prev.map((sh) => (sh.id === s.id ? { ...sh, text: editingValue } : sh)),
																			);
																			setEditingTextId(null);
																		}
																		if (e.key === "Escape") {
																			setEditingTextId(null);
																		}
																	}}
																	style={{
																		width: "100%",
																		height: "100%",
																		background: "#111827",
																		color: "#fff",
																		border: "1px solid #2563eb",
																		borderRadius: 4,
																		padding: "2px 6px",
																		fontSize: fs,
																	}}
																/>
															</foreignObject>
														)}
														{isSel && (
															<>
																<rect
																	x={bx}
																	y={by}
																	width={bw}
																	height={bh}
																	fill='none'
																	stroke='#2563eb'
																	strokeDasharray='4 2'
																	strokeWidth={1.5}
																	rx={4}
																	ry={4}
																/>
																{/* Delete X */}
																{(() => {
																	const size = 16 / Math.max(0.5, scale);
																	const dx = bx + bw + 6;
																	const dy = by - 6;
																	const onDel = (ev) => {
																		ev.stopPropagation();
																		setShapes((prev) => prev.filter((it) => it.id !== s.id));
																		if (selectedId === s.id) setSelectedId(null);
																	};
																	return (
																		<g
																			onMouseDown={onDel}
																			style={{ cursor: "pointer" }}>
																			<rect
																				x={dx - size / 2}
																				y={dy - size / 2}
																				width={size}
																				height={size}
																				rx={3}
																				ry={3}
																				fill='#ef4444'
																				stroke='#b91c1c'
																				strokeWidth={1}
																			/>
																			<line
																				x1={dx - size * 0.3}
																				y1={dy - size * 0.3}
																				x2={dx + size * 0.3}
																				y2={dy + size * 0.3}
																				stroke='#ffffff'
																				strokeWidth={1.5}
																			/>
																			<line
																				x1={dx - size * 0.3}
																				y1={dy + size * 0.3}
																				x2={dx + size * 0.3}
																				y2={dy - size * 0.3}
																				stroke='#ffffff'
																				strokeWidth={1.5}
																			/>
																		</g>
																	);
																})()}
															</>
														)}
													</g>
												);
											}
											return null;
										})}

										{draft && (
											<>
												{draft.type === "rectangle" && (
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
												)}
												{draft.type === "circle" && (
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
												)}
												{draft.type === "triangle" && (
													<polygon
														points={`${draft.x + draft.w / 2},${draft.y} ${draft.x},${draft.y + draft.h} ${draft.x + draft.w},${draft.y + draft.h}`}
														fill='rgba(234,179,8,0.25)'
														stroke='#d97706'
														strokeDasharray='4 2'
														strokeWidth={1.5}
													/>
												)}
											</>
										)}
									</svg>

									{/* Context menu */}
									{ctxMenu && (
										<div
											className='absolute z-50'
											style={{ left: ctxMenu.x, top: ctxMenu.y }}
											onMouseDown={(e) => e.stopPropagation()}>
											<div className='min-w-[180px] rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-xl p-1 text-sm text-gray-800 dark:text-gray-100'>
												{ctxMenu.scope === "shape" ?
													<>
														<button
															className='w-full text-left px-3 py-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700'
															onClick={() => {
																setSelectedId(ctxMenu.targetId);
																moveSelectedZ(1);
																setCtxMenu(null);
															}}>
															Bring forward
														</button>
														<button
															className='w-full text-left px-3 py-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700'
															onClick={() => {
																setSelectedId(ctxMenu.targetId);
																moveSelectedZ(-1);
																setCtxMenu(null);
															}}>
															Send backward
														</button>
														<button
															className='w-full text-left px-3 py-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700'
															onClick={() => {
																setSelectedId(ctxMenu.targetId);
																moveSelectedToFront();
																setCtxMenu(null);
															}}>
															Bring to front
														</button>
														<button
															className='w-full text-left px-3 py-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700'
															onClick={() => {
																setSelectedId(ctxMenu.targetId);
																moveSelectedToBack();
																setCtxMenu(null);
															}}>
															Send to back
														</button>
														<hr className='my-1 border-gray-200 dark:border-gray-700' />
														<button
															className='w-full text-left px-3 py-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700'
															onClick={() => {
																const id = ctxMenu.targetId;
																const s = shapes.find((sh) => sh.id === id);
																if (!s) return;
																const clone = { ...s, id: crypto.randomUUID(), x: s.x + 12, y: s.y + 12 };
																setShapes((prev) => [...prev, clone]);
																setSelectedId(clone.id);
																setCtxMenu(null);
															}}>
															Duplicate
														</button>
														{(() => {
															const s = shapes.find((sh) => sh.id === ctxMenu.targetId);
															if (!s) return null;
															if (s.type === "rectangle")
																return (
																	<button
																		className='w-full text-left px-3 py-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700'
																		onClick={() => {
																			setShapes((prev) =>
																				prev.map((sh) => (sh.id === s.id ? { ...sh, showChart: !sh.showChart } : sh)),
																			);
																			setCtxMenu(null);
																		}}>
																		Toggle chart
																	</button>
																);
															return null;
														})()}
														{(() => {
															const s = shapes.find((sh) => sh.id === ctxMenu.targetId);
															if (!s) return null;
															if ((s.widgetKind || "").toLowerCase() === "button")
																return (
																	<button
																		className='w-full text-left px-3 py-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700'
																		onClick={() => {
																			setShapes((prev) =>
																				prev.map((sh) =>
																					sh.id === s.id ?
																						{
																							...sh,
																							buttonMode: (sh.buttonMode || "momentary") === "momentary" ? "toggle" : "momentary",
																						}
																					:	sh,
																				),
																			);
																			setCtxMenu(null);
																		}}>
																		Toggle mode
																	</button>
																);
															return null;
														})()}
														{/* Color pickers */}
														{(() => {
															const s = shapes.find((sh) => sh.id === ctxMenu.targetId);
															if (!s) return null;
															const stop = (ev) => ev.stopPropagation();
															if (s.type === "rectangle")
																return (
																	<div className='px-2 py-1'>
																		<div className='text-xs text-gray-600 dark:text-gray-300 mb-1'>Colors</div>
																		<div className='flex items-center gap-2 mb-1'>
																			<span className='text-xs w-16'>Text</span>
																			<input
																				type='color'
																				onMouseDown={stop}
																				value={s.textColor || "#ffffff"}
																				onChange={(e) =>
																					setShapes((prev) =>
																						prev.map((sh) => (sh.id === s.id ? { ...sh, textColor: e.target.value } : sh)),
																					)
																				}
																			/>
																		</div>
																		<div className='flex items-center gap-2 mb-1'>
																			<span className='text-xs w-16'>Border</span>
																			<input
																				type='color'
																				onMouseDown={stop}
																				value={s.customStroke || "#2563eb"}
																				onChange={(e) =>
																					setShapes((prev) =>
																						prev.map((sh) => (sh.id === s.id ? { ...sh, customStroke: e.target.value } : sh)),
																					)
																				}
																			/>
																		</div>
																		<div className='flex items-center gap-2'>
																			<span className='text-xs w-16'>Background</span>
																			<input
																				type='color'
																				onMouseDown={stop}
																				value={s.customAccent || "#eaf2ff"}
																				onChange={(e) =>
																					setShapes((prev) =>
																						prev.map((sh) => (sh.id === s.id ? { ...sh, customAccent: e.target.value } : sh)),
																					)
																				}
																			/>
																		</div>
																	</div>
																);
															if (s.type === "circle" || s.type === "triangle")
																return (
																	<div className='px-2 py-1'>
																		<div className='text-xs text-gray-600 dark:text-gray-300 mb-1'>Colors</div>
																		<div className='flex items-center gap-2 mb-1'>
																			<span className='text-xs w-16'>Stroke</span>
																			<input
																				type='color'
																				onMouseDown={stop}
																				value={s.strokeColor || "#16a34a"}
																				onChange={(e) =>
																					setShapes((prev) =>
																						prev.map((sh) => (sh.id === s.id ? { ...sh, strokeColor: e.target.value } : sh)),
																					)
																				}
																			/>
																		</div>
																		<div className='flex items-center gap-2'>
																			<span className='text-xs w-16'>Fill</span>
																			<input
																				type='color'
																				onMouseDown={stop}
																				value={s.fillColor || "#bbf7d0"}
																				onChange={(e) =>
																					setShapes((prev) =>
																						prev.map((sh) => (sh.id === s.id ? { ...sh, fillColor: e.target.value } : sh)),
																					)
																				}
																			/>
																		</div>
																	</div>
																);
															if (s.type === "text")
																return (
																	<div className='px-2 py-1'>
																		<div className='text-xs text-gray-600 dark:text-gray-300 mb-1'>Text color</div>
																		<input
																			type='color'
																			onMouseDown={(ev) => ev.stopPropagation()}
																			value={s.color || "#ffffff"}
																			onChange={(e) =>
																				setShapes((prev) =>
																					prev.map((sh) => (sh.id === s.id ? { ...sh, color: e.target.value } : sh)),
																				)
																			}
																		/>
																	</div>
																);
															return null;
														})()}
														<hr className='my-1 border-gray-200 dark:border-gray-700' />
														<button
															className='w-full text-left px-3 py-1.5 rounded text-red-600 hover:bg-red-50 dark:hover:bg-gray-700'
															onClick={() => {
																const id = ctxMenu.targetId;
																setShapes((prev) => prev.filter((sh) => sh.id !== id));
																if (selectedId === id) setSelectedId(null);
																setCtxMenu(null);
															}}>
															Delete
														</button>
													</>
												:	<>
														<button
															className='w-full text-left px-3 py-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700'
															onClick={() => {
																setShowGrid(!showGrid);
																setCtxMenu(null);
															}}>
															{showGrid ? "Hide grid" : "Show grid"}
														</button>
														<button
															className='w-full text-left px-3 py-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700'
															onClick={() => {
																handleSaveLayout();
																setCtxMenu(null);
															}}>
															Save layout
														</button>
													</>
												}
											</div>
										</div>
									)}
								</div>
							</div>
						</div>
					</div>

					{/* Right Widget Panel */}
					<div className='w-64 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 p-4'>
						<h3 className='text-lg font-semibold text-gray-900 dark:text-white mb-2'>Widgets</h3>
						<div className='mb-3'>
							<label className='block text-xs text-gray-600 dark:text-gray-400 mb-1'>Target device</label>
							<select
								value={defaultDeviceId}
								onChange={(e) => setDefaultDeviceId(e.target.value)}
								className='w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white'>
								{devices.length === 0 ?
									<option value=''>No devices</option>
								:	devices.map((d) => (
										<option
											key={d.deviceId}
											value={d.deviceId}>
											{d.name || d.deviceId}
										</option>
									))
								}
							</select>
						</div>
						<div className='space-y-2'>
							{widgets.map((widget) => {
								const Icon = widget.icon;
								return (
									<div
										onClick={() => addWidget(widget.id)}
										key={widget.id}
										className='p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors'>
										<div className='flex items-center space-x-3'>
											<div
												className={`w-8 h-8 rounded-lg bg-${widget.color}-100 dark:bg-${widget.color}-900/20 flex items-center justify-center`}>
												<Icon className={`w-4 h-4 text-${widget.color}-600 dark:text-${widget.color}-400`} />
											</div>
											<span className='text-sm font-medium text-gray-900 dark:text-white'>{widget.name}</span>
										</div>
									</div>
								);
							})}
						</div>

						<div className='mt-6'>
							<h4 className='text-sm font-medium text-gray-900 dark:text-white mb-2'>Properties</h4>
							{!selectedShape ?
								<p className='text-xs text-gray-500 dark:text-gray-400'>Select a shape to edit properties</p>
							:	<div className='space-y-3'>
									<div className='grid grid-cols-2 gap-2'>
										<div>
											<label className='text-xs text-gray-600 dark:text-gray-400'>X</label>
											<input
												type='number'
												value={Math.round(selectedShape.x || 0)}
												onChange={(e) => updateSelectedShape({ x: Number(e.target.value) || 0 })}
												className='w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white'
											/>
										</div>
										<div>
											<label className='text-xs text-gray-600 dark:text-gray-400'>Y</label>
											<input
												type='number'
												value={Math.round(selectedShape.y || 0)}
												onChange={(e) => updateSelectedShape({ y: Number(e.target.value) || 0 })}
												className='w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white'
											/>
										</div>
									</div>
									{/* Conditional properties */}
									{selectedShape.type === "text" ?
										<>
											<div>
												<label className='text-xs text-gray-600 dark:text-gray-400'>Text</label>
												<input
													value={selectedShape.text || ""}
													onChange={(e) => updateSelectedShape({ text: e.target.value })}
													className='w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white'
												/>
											</div>
											<div className='grid grid-cols-2 gap-2'>
												<div>
													<label className='text-xs text-gray-600 dark:text-gray-400'>Font size</label>
													<input
														type='number'
														min={8}
														max={96}
														value={Math.round(selectedShape.fontSize || 16)}
														onChange={(e) => updateSelectedShape({ fontSize: Number(e.target.value) || 16 })}
														className='w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white'
													/>
												</div>
												<div>
													<label className='text-xs text-gray-600 dark:text-gray-400'>Color</label>
													<input
														type='color'
														value={selectedShape.color || "#ffffff"}
														onChange={(e) => updateSelectedShape({ color: e.target.value })}
														className='w-full h-8 px-1 py-0.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800'
													/>
												</div>
											</div>
										</>
									:	<>
											<div>
												<label className='text-xs text-gray-600 dark:text-gray-400'>Device</label>
												<select
													value={selectedShape.deviceId || defaultDeviceId}
													onChange={(e) => updateSelectedShape({ deviceId: e.target.value })}
													className='w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white'>
													{devices.length === 0 ?
														<option value=''>No devices</option>
													:	devices.map((d) => (
															<option
																key={d.deviceId}
																value={d.deviceId}>
																{d.name || d.deviceId}
															</option>
														))
													}
												</select>
											</div>
											<div className='flex items-center gap-2'>
												<input
													id='showChart'
													type='checkbox'
													checked={!!selectedShape.showChart || selectedShape.widgetKind === "chart"}
													onChange={(e) => updateSelectedShape({ showChart: e.target.checked })}
													className='w-4 h-4'
												/>
												<label
													htmlFor='showChart'
													className='text-xs text-gray-600 dark:text-gray-400 select-none'>
													Show chart inside
												</label>
											</div>
											{(selectedShape.widgetKind || "").toLowerCase() === "button" ?
												<>
													<div>
														<label className='text-xs text-gray-600 dark:text-gray-400'>Mode</label>
														<select
															value={selectedShape.buttonMode || "momentary"}
															onChange={(e) => updateSelectedShape({ buttonMode: e.target.value })}
															className='w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white'>
															<option value='momentary'>Momentary</option>
															<option value='toggle'>Toggle</option>
														</select>
													</div>
													<div>
														<label className='text-xs text-gray-600 dark:text-gray-400'>Label</label>
														<input
															value={selectedShape.label || ""}
															onChange={(e) => updateSelectedShape({ label: e.target.value })}
															className='w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white'
														/>
													</div>
													<div>
														<label className='text-xs text-gray-600 dark:text-gray-400'>Command</label>
														<input
															value={selectedShape.command || ""}
															onChange={(e) => updateSelectedShape({ command: e.target.value })}
															className='w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white'
															placeholder='press/toggle/your-command'
														/>
													</div>
													{(selectedShape.buttonMode || "momentary") === "toggle" && (
														<>
															<div className='grid grid-cols-2 gap-2'>
																<div>
																	<label className='text-xs text-gray-600 dark:text-gray-400'>On Label</label>
																	<input
																		value={selectedShape.onLabel || ""}
																		onChange={(e) => updateSelectedShape({ onLabel: e.target.value })}
																		className='w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white'
																	/>
																</div>
																<div>
																	<label className='text-xs text-gray-600 dark:text-gray-400'>Off Label</label>
																	<input
																		value={selectedShape.offLabel || ""}
																		onChange={(e) => updateSelectedShape({ offLabel: e.target.value })}
																		className='w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white'
																	/>
																</div>
															</div>
															<div className='grid grid-cols-2 gap-2'>
																<div>
																	<label className='text-xs text-gray-600 dark:text-gray-400'>On Command</label>
																	<input
																		value={selectedShape.onCommand || ""}
																		onChange={(e) => updateSelectedShape({ onCommand: e.target.value })}
																		className='w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white'
																		placeholder='e.g., {"relay":1}'
																	/>
																</div>
																<div>
																	<label className='text-xs text-gray-600 dark:text-gray-400'>Off Command</label>
																	<input
																		value={selectedShape.offCommand || ""}
																		onChange={(e) => updateSelectedShape({ offCommand: e.target.value })}
																		className='w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white'
																		placeholder='e.g., {"relay":0}'
																	/>
																</div>
															</div>
														</>
													)}
												</>
											:	<div>
													<label className='text-xs text-gray-600 dark:text-gray-400'>Data</label>
													<select
														value={selectedShape.dataKey || ""}
														onChange={(e) => updateSelectedShape({ dataKey: e.target.value })}
														className='w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white'>
														<option
															value=''
															disabled>
															Select data key
														</option>
														{availableDataKeys.map((k) => (
															<option
																key={k}
																value={k}>
																{k}
															</option>
														))}
													</select>
												</div>
											}
										</>
									}
									<div className='flex items-center gap-2'>
										<button
											onClick={() => moveSelectedZ(1)}
											className='px-2 py-1 rounded border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
											title='Bring forward'>
											<ArrowUp className='w-4 h-4' />
										</button>
										<button
											onClick={() => moveSelectedZ(-1)}
											className='px-2 py-1 rounded border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
											title='Send backward'>
											<ArrowDown className='w-4 h-4' />
										</button>
										<button
											onClick={moveSelectedToFront}
											className='px-2 py-1 rounded border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
											title='Bring to front'>
											<ChevronsUp className='w-4 h-4' />
										</button>
										<button
											onClick={moveSelectedToBack}
											className='px-2 py-1 rounded border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
											title='Send to back'>
											<ChevronsDown className='w-4 h-4' />
										</button>
									</div>
									{selectedShape.type !== "text" && (
										<div className='grid grid-cols-2 gap-2'>
											<div>
												<label className='text-xs text-gray-600 dark:text-gray-400'>Width</label>
												<input
													type='number'
													value={Math.round(selectedShape.w || 0)}
													onChange={(e) => updateSelectedShape({ w: Number(e.target.value) || 0 })}
													className='w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white'
												/>
											</div>
											<div>
												<label className='text-xs text-gray-600 dark:text-gray-400'>Height</label>
												<input
													type='number'
													value={Math.round(selectedShape.h || 0)}
													onChange={(e) => updateSelectedShape({ h: Number(e.target.value) || 0 })}
													className='w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white'
												/>
											</div>
										</div>
									)}
								</div>
							}
						</div>
					</div>
				</div>
			</main>
		</div>
	);
};

export default DesignerPage;
