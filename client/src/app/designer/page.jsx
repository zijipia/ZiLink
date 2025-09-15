"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { SkeletonDashboard } from "@/components/ui/Skeleton";
import Sidebar from "@/components/Sidebar";
import DesignerToolbar from "@/components/designer/DesignerToolbar";
import CanvasToolbar from "@/components/designer/CanvasToolbar";
import DesignerCanvas from "@/components/designer/DesignerCanvas";
import PropertyPanel from "@/components/designer/PropertyPanel";
import { Palette, Menu, LogOut, Undo, Redo, Save, Thermometer, Droplet, Gauge, Sun, Volume2, Activity } from "lucide-react";
import apiService from "@/lib/api";
import websocketService from "@/lib/websocket";
import { toast } from "react-hot-toast";

const DesignerPage = () => {
	const { user, logout, isAuthenticated, isLoading: authLoading } = useAuth();
	const [isLoading, setIsLoading] = useState(true);
	const [sidebarOpen, setSidebarOpen] = useState(true);
	const [selectedTool, setSelectedTool] = useState("select");
	const [showGrid, setShowGrid] = useState(true);
	const [canvasZoom, setCanvasZoom] = useState(100);
	const router = useRouter();

	// Drawing state
	const [shapes, setShapes] = useState([]);
	const [isDrawing, setIsDrawing] = useState(false);
	const [draft, setDraft] = useState(null);
	const [selectedId, setSelectedId] = useState(null);
	const [dragging, setDragging] = useState(null);
	const [pointerDown, setPointerDown] = useState(null);
	const [ctxMenu, setCtxMenu] = useState(null);

	// Device data
	const [devices, setDevices] = useState([]);
	const [defaultDeviceId, setDefaultDeviceId] = useState("");
	const [latestByDevice, setLatestByDevice] = useState({});

	const canvasRef = useRef(null);

	const [layout, setLayout] = useState([]);

	// Devices for data binding
	// const [devices, setDevices] = useState([]);
	// const [defaultDeviceId, setDefaultDeviceId] = useState("");

	// Drawing state and helpers
	// const [shapes, setShapes] = useState([]);
	// const [isDrawing, setIsDrawing] = useState(false);
	// const [draft, setDraft] = useState(null); // { type, startX, startY, x, y, w, h }
	// const canvasRef = useRef(null);
	// const [dragging, setDragging] = useState(null); // { id, offsetX, offsetY }
	const [resizing, setResizing] = useState(null); // { id, handle, startX, startY, x, y, w, h }
	// const [latestByDevice, setLatestByDevice] = useState({}); // { [deviceId]: { sensorData, timestamp } }
	const [seriesByKey, setSeriesByKey] = useState({}); // { `${deviceId}|${key}`: number[] }
	// const [pointerDown, setPointerDown] = useState(null); // { id, x, y, t, moved }
	const canvasBoxRef = useRef(null);
	const [editingTextId, setEditingTextId] = useState(null);
	const [editingValue, setEditingValue] = useState("");
	// const [selectedId, setSelectedId] = useState(null);

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
		// { id: "select", name: "Select", icon: Layout },
		// { id: "rectangle", name: "Rectangle", icon: Square },
		// { id: "circle", name: "Circle", icon: Circle },
		// { id: "triangle", name: "Triangle", icon: Triangle },
		// { id: "text", name: "Text", icon: Type },
		// { id: "image", name: "Image", icon: Image },
		// { id: "chart", name: "Chart", icon: BarChart3 },
		// // Widget tools (can draw directly, not just from right panel)
		// { id: "temperature", name: "Temperature", icon: Thermometer },
		// { id: "humidity", name: "Humidity", icon: Droplet },
		// { id: "pressure", name: "Pressure", icon: Gauge },
		// { id: "light", name: "Light", icon: Sun },
		// { id: "sound", name: "Sound", icon: Volume2 },
		// { id: "motion", name: "Motion", icon: Activity },
		// { id: "button", name: "Button", icon: MousePointer },
	];

	const widgets = [
		// { id: "temperature", name: "Temperature", icon: Thermometer, color: "blue" },
		// { id: "humidity", name: "Humidity", icon: Droplet, color: "green" },
		// { id: "pressure", name: "Pressure", icon: Gauge, color: "purple" },
		// { id: "motion", name: "Motion", icon: Activity, color: "orange" },
		// { id: "light", name: "Light", icon: Sun, color: "yellow" },
		// { id: "sound", name: "Sound", icon: Volume2, color: "pink" },
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
			temperature: {
				icon: Thermometer,
				stroke: "#2563eb",
				value: "#1e293b",
				accent: "rgba(37,99,235,0.06)",
				unit: "Â°C",
			},
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
		const u = unit || meta.unit || "";
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
			// Load saved layout if exists
			const savedLayout = localStorage.getItem("designer-layout");
			if (savedLayout) {
				const parsed = JSON.parse(savedLayout);
				setShapes(parsed.shapes || []);
			}
		} catch (error) {
			console.error("Failed to load designer data:", error);
		} finally {
			setIsLoading(false);
		}
	};

	const loadDevices = async () => {
		try {
			const { devices: apiDevices } = await apiService.getDevices({ limit: 50, page: 1 });
			setDevices(apiDevices || []);
			if (apiDevices && apiDevices.length > 0) {
				setDefaultDeviceId(apiDevices[0].deviceId);
			}
		} catch (error) {
			console.error("Failed to load devices:", error);
		}
	};

	const handleSaveLayout = () => {
		try {
			const layout = { shapes, timestamp: Date.now() };
			localStorage.setItem("designer-layout", JSON.stringify(layout));
			toast.success("Layout saved successfully!");
		} catch (error) {
			console.error("Failed to save layout:", error);
			toast.error("Failed to save layout");
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
			setLatestByDevice((prev) => ({
				...prev,
				[deviceId]: { sensorData: last.sensorData || [], timestamp: last.timestamp },
			}));
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

	// Canvas interaction handlers
	const handlePointerDown = (e) => {
		if (selectedTool === "select") return;

		const rect = canvasRef.current?.getBoundingClientRect();
		if (!rect) return;

		const x = (e.clientX - rect.left) * (100 / canvasZoom);
		const y = (e.clientY - rect.top) * (100 / canvasZoom);

		setIsDrawing(true);
		setDraft({ type: selectedTool, startX: x, startY: y, x, y, w: 0, h: 0 });
	};

	const handlePointerMove = (e) => {
		if (!isDrawing || !draft) return;

		const rect = canvasRef.current?.getBoundingClientRect();
		if (!rect) return;

		const x = (e.clientX - rect.left) * (100 / canvasZoom);
		const y = (e.clientY - rect.top) * (100 / canvasZoom);

		setDraft((prev) => ({
			...prev,
			x: Math.min(prev.startX, x),
			y: Math.min(prev.startY, y),
			w: Math.abs(x - prev.startX),
			h: Math.abs(y - prev.startY),
		}));
	};

	const handlePointerUp = () => {
		if (!isDrawing || !draft) return;

		if (draft.w > 10 && draft.h > 10) {
			const newShape = {
				id: crypto.randomUUID(),
				type: draft.type,
				x: draft.x,
				y: draft.y,
				w: draft.w,
				h: draft.h,
				deviceId: defaultDeviceId,
				zIndex: shapes.length,
			};

			setShapes((prev) => [...prev, newShape]);
		}

		setIsDrawing(false);
		setDraft(null);
		setSelectedTool("select");
	};

	const handleShapeClick = (e, shapeId) => {
		e.stopPropagation();
		setSelectedId(shapeId);
	};

	const handleDeleteShape = (shapeId) => {
		setShapes((prev) => prev.filter((s) => s.id !== shapeId));
		if (selectedId === shapeId) setSelectedId(null);
	};

	const handleContextMenu = (e, shapeId) => {
		e.preventDefault();
		setCtxMenu({ x: e.clientX, y: e.clientY, targetId: shapeId, scope: "shape" });
	};

	// Property panel handlers
	const selectedShape = useMemo(() => shapes.find((s) => s.id === selectedId), [shapes, selectedId]);

	const updateSelectedShape = (updates) => {
		if (!selectedId) return;
		setShapes((prev) => prev.map((s) => (s.id === selectedId ? { ...s, ...updates } : s)));
	};

	const moveSelectedToFront = () => {
		if (!selectedId) return;
		const maxZ = Math.max(...shapes.map((s) => s.zIndex || 0));
		updateSelectedShape({ zIndex: maxZ + 1 });
	};

	const moveSelectedToBack = () => {
		if (!selectedId) return;
		updateSelectedShape({ zIndex: 0 });
	};

	const availableDataKeys = useMemo(() => {
		const keys = new Set();
		Object.values(latestByDevice).forEach((data) => {
			if (Array.isArray(data.sensorData)) {
				data.sensorData.forEach((sensor) => {
					if (sensor.type) keys.add(sensor.type);
				});
			}
		});
		return Array.from(keys);
	}, [latestByDevice]);

	const handleCanvasMouseDown = (e) => {
		// if (ctxMenu) setCtxMenu(null);
		// // Selection mode: click empty space to clear selection
		// if (selectedTool === "select") {
		// 	setSelectedId(null);
		// 	return;
		// }
		// if (selectedTool === "text") {
		// 	const { x, y } = getCanvasPoint(e);
		// 	const newShape = {
		// 		id: crypto.randomUUID(),
		// 		type: "text",
		// 		x,
		// 		y,
		// 		text: "Text",
		// 		color: "#ffffff",
		// 		fontSize: 14,
		// 	};
		// 	setShapes((s) => [...s, newShape]);
		// 	return;
		// }
		// if (["rectangle", "circle", "triangle"].includes(selectedTool) || widgetToolIds.includes(selectedTool)) {
		// 	const { x, y } = getCanvasPoint(e);
		// 	setIsDrawing(true);
		// 	if (widgetToolIds.includes(selectedTool)) {
		// 		const dk = selectedTool === "chart" ? "temperature" : selectedTool;
		// 		setDraft({
		// 			type: "rectangle",
		// 			widgetKind: selectedTool,
		// 			deviceId: defaultDeviceId || devices[0]?.deviceId || "",
		// 			dataKey: dk,
		// 			startX: x,
		// 			startY: y,
		// 			x,
		// 			y,
		// 			w: 0,
		// 			h: 0,
		// 		});
		// 	} else {
		// 		setDraft({ type: selectedTool, startX: x, startY: y, x, y, w: 0, h: 0 });
		// 	}
		// }
	};

	const handleCanvasMouseMove = (e) => {
		// const { x, y } = getCanvasPoint(e);
		// if (pointerDown?.id && !pointerDown.moved) {
		// 	const dx = x - pointerDown.x;
		// 	const dy = y - pointerDown.y;
		// 	if (Math.hypot(dx, dy) > 3) setPointerDown({ ...pointerDown, moved: true });
		// }
		// if (resizing?.id) {
		// 	const dx = x - resizing.startX;
		// 	const dy = y - resizing.startY;
		// 	const minW = 20;
		// 	const minH = 20;
		// 	let nx = resizing.x;
		// 	let ny = resizing.y;
		// 	let nw = resizing.w;
		// 	let nh = resizing.h;
		// 	switch (resizing.handle) {
		// 		case "e":
		// 			nw = resizing.w + dx;
		// 			break;
		// 		case "w":
		// 			nx = resizing.x + dx;
		// 			nw = resizing.w - dx;
		// 			break;
		// 		case "s":
		// 			nh = resizing.h + dy;
		// 			break;
		// 		case "n":
		// 			ny = resizing.y + dy;
		// 			nh = resizing.h - dy;
		// 			break;
		// 		case "se":
		// 			nw = resizing.w + dx;
		// 			nh = resizing.h + dy;
		// 			break;
		// 		case "ne":
		// 			ny = resizing.y + dy;
		// 			nh = resizing.h - dy;
		// 			nw = resizing.w + dx;
		// 			break;
		// 		case "sw":
		// 			nx = resizing.x + dx;
		// 			nw = resizing.w - dx;
		// 			nh = resizing.h + dy;
		// 			break;
		// 		case "nw":
		// 			nx = resizing.x + dx;
		// 			ny = resizing.y + dy;
		// 			nw = resizing.w - dx;
		// 			nh = resizing.h - dy;
		// 			break;
		// 		default:
		// 			break;
		// 	}
		// 	// Clamp to minimums and adjust origin if needed
		// 	if (nw < minW) {
		// 		if (resizing.handle.includes("w")) {
		// 			nx = resizing.x + (resizing.w - minW);
		// 		}
		// 		nw = minW;
		// 	}
		// 	if (nh < minH) {
		// 		if (resizing.handle.includes("n")) {
		// 			ny = resizing.y + (resizing.h - minH);
		// 		}
		// 		nh = minH;
		// 	}
		// 	setShapes((prev) =>
		// 		prev.map((s) => (s.id === resizing.id ? { ...s, x: nx, y: ny, w: Math.max(minW, nw), h: Math.max(minH, nh) } : s)),
		// 	);
		// 	return;
		// }
		// if (dragging?.id) {
		// 	// Move selected shape
		// 	const nx = x - dragging.offsetX;
		// 	const ny = y - dragging.offsetY;
		// 	setShapes((prev) => prev.map((s) => (s.id === dragging.id ? { ...s, x: nx, y: ny } : s)));
		// 	return;
		// }
		// if (isDrawing && draft) {
		// 	const r = rectFromPoints(draft.startX, draft.startY, x, y);
		// 	setDraft({ ...draft, ...r });
		// }
	};

	const handleCanvasMouseUp = () => {
		// Handle button click (no drag)
		// if (pointerDown?.id) {
		// 	const shape = shapes.find((s) => s.id === pointerDown.id);
		// 	if (shape?.widgetKind === "button" && !pointerDown.moved && Date.now() - pointerDown.t < 600) {
		// 		pressButton(shape);
		// 	}
		// 	setPointerDown(null);
		// }
		// if (resizing?.id) {
		// 	setResizing(null);
		// 	return;
		// }
		// if (dragging?.id) {
		// 	setDragging(null);
		// 	return;
		// }
		// if (isDrawing && draft) {
		// 	setIsDrawing(false);
		// 	const { x, y, w, h, type } = draft;
		// 	if (w < 4 && h < 4) {
		// 		setDraft(null);
		// 		return;
		// 	}
		// 	const newShape = {
		// 		id: crypto.randomUUID(),
		// 		type,
		// 		x,
		// 		y,
		// 		w,
		// 		h,
		// 		...(draft.widgetKind ? { widgetKind: draft.widgetKind, deviceId: draft.deviceId, dataKey: draft.dataKey } : {}),
		// 	};
		// 	setShapes((prev) => [...prev, newShape]);
		// 	setDraft(null);
		// }
	};

	const handleCanvasMouseLeave = () => {
		// if (dragging?.id) setDragging(null);
		// if (resizing?.id) setResizing(null);
		// if (isDrawing) setIsDrawing(false);
		// setDraft(null);
	};

	const startResize = (shape, handle, e) => {
		// e.stopPropagation();
		// const p = getCanvasPoint(e);
		// setSelectedId(shape.id);
		// setResizing({ id: shape.id, handle, startX: p.x, startY: p.y, x: shape.x, y: shape.y, w: shape.w, h: shape.h });
	};

	const handleLogout = async () => {
		try {
			await logout();
		} catch (error) {
			console.error("Logout error:", error);
		}
	};

	// Selection + updates
	// const selectedShape = React.useMemo(() => shapes.find((s) => s.id === selectedId) || null, [shapes, selectedId]);

	// const updateSelectedShape = (partial) => {
	// 	if (!selectedId) return;
	// 	setShapes((prev) => prev.map((s) => (s.id === selectedId ? { ...s, ...partial } : s)));
	// };

	const pressButton = (shape) => {
		// const isToggle = (shape.buttonMode || "momentary") === "toggle";
		// if (isToggle) {
		// 	const nextState = !shape.toggled;
		// 	setShapes((prev) => prev.map((s) => (s.id === shape.id ? { ...s, toggled: nextState } : s)));
		// 	try {
		// 		if (shape.deviceId) {
		// 			const payload = shape[nextState ? "onCommand" : "offCommand"] || {
		// 				type: "ui_button",
		// 				id: shape.id,
		// 				action: "toggle",
		// 				state: nextState,
		// 			};
		// 			websocketService.sendDeviceCommand(shape.deviceId, payload);
		// 		}
		// 	} catch (e) {
		// 		console.error("Button toggle command failed", e);
		// 	}
		// 	return;
		// }
		// // Momentary
		// setShapes((prev) => prev.map((s) => (s.id === shape.id ? { ...s, pressed: true } : s)));
		// setTimeout(() => {
		// 	setShapes((prev) => prev.map((s) => (s.id === shape.id ? { ...s, pressed: false } : s)));
		// }, 150);
		// try {
		// 	if (shape.deviceId) {
		// 		const payload = shape.command || { type: "ui_button", id: shape.id, action: "press", label: shape.label || "Button" };
		// 		websocketService.sendDeviceCommand(shape.deviceId, payload);
		// 	}
		// } catch (e) {
		// 	console.error("Button command failed", e);
		// }
	};

	const addWidget = (widgetId) => {
		// const size = { w: 160, h: 90 };
		// const pos = { x: 60 + (shapes.length % 6) * 12, y: 60 + (shapes.length % 6) * 12 };
		// const base = {
		// 	id: crypto.randomUUID(),
		// 	type: "rectangle",
		// 	...pos,
		// 	...size,
		// 	widgetKind: widgetId,
		// 	deviceId: defaultDeviceId || devices[0]?.deviceId || "",
		// 	color: "#93c5fd",
		// };
		// const newShape =
		// 	widgetId === "button" ?
		// 		{ ...base, label: "Button", command: "press", dataKey: undefined, buttonMode: "momentary", toggled: false }
		// 	: widgetId === "chart" ? { ...base, dataKey: "temperature", showChart: true }
		// 	: { ...base, dataKey: widgetId };
		// setShapes((prev) => [...prev, newShape]);
		// setSelectedId(newShape.id);
		// toast.success(`Added widget: ${widgetId}`);
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
					<DesignerToolbar
						selectedTool={selectedTool}
						onToolSelect={setSelectedTool}
					/>

					{/* Main Canvas Area */}
					<div className='flex-1 flex flex-col'>
						{/* Canvas Toolbar */}
						<CanvasToolbar
							showGrid={showGrid}
							onToggleGrid={() => setShowGrid(!showGrid)}
							canvasZoom={canvasZoom}
							onZoomChange={setCanvasZoom}
						/>

						{/* Canvas */}
						<DesignerCanvas
							ref={canvasRef}
							shapes={shapes}
							draft={draft}
							showGrid={showGrid}
							canvasZoom={canvasZoom}
							selectedId={selectedId}
							selectedTool={selectedTool}
							onPointerDown={handlePointerDown}
							onPointerMove={handlePointerMove}
							onPointerUp={handlePointerUp}
							onContextMenu={handleContextMenu}
							onShapeClick={handleShapeClick}
							onDeleteShape={handleDeleteShape}
						/>
					</div>

					{/* Right Property Panel */}
					<PropertyPanel
						selectedShape={selectedShape}
						devices={devices}
						defaultDeviceId={defaultDeviceId}
						availableDataKeys={availableDataKeys}
						onUpdateShape={updateSelectedShape}
						onMoveToFront={moveSelectedToFront}
						onMoveToBack={moveSelectedToBack}
					/>
				</div>
			</main>
		</div>
	);
};

export default DesignerPage;
