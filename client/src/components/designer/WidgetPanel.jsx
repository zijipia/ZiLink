"use client";
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
	Search,
} from "lucide-react";
import { useState } from "react";

const WidgetPanel = ({ onAddWidget, compact = false }) => {
	const [searchTerm, setSearchTerm] = useState("");
	const [selectedCategory, setSelectedCategory] = useState("all");

	const sensorWidgets = [
		{ id: "temperature", name: "Temperature", icon: Thermometer, color: "blue", category: "sensor" },
		{ id: "humidity", name: "Humidity", icon: Droplet, color: "green", category: "sensor" },
		{ id: "pressure", name: "Pressure", icon: Gauge, color: "purple", category: "sensor" },
		{ id: "motion", name: "Motion", icon: Activity, color: "orange", category: "sensor" },
		{ id: "light", name: "Light", icon: Sun, color: "yellow", category: "sensor" },
		{ id: "sound", name: "Sound", icon: Volume2, color: "pink", category: "sensor" },
	];

	const controlWidgets = [
		{ id: "button", name: "Button", icon: MousePointer, color: "gray", category: "control" },
		{ id: "toggle", name: "Toggle", icon: ToggleLeft, color: "indigo", category: "control" },
		{ id: "slider", name: "Slider", icon: Settings2, color: "teal", category: "control" },
		{ id: "switch", name: "Switch", icon: Power, color: "red", category: "control" },
		{ id: "progress", name: "Progress", icon: Zap, color: "emerald", category: "control" },
		{ id: "knob", name: "Knob", icon: Settings, color: "amber", category: "control" },
	];

	const displayWidgets = [{ id: "chart", name: "Chart", icon: Monitor, color: "cyan", category: "display" }];

	const allWidgets = [...sensorWidgets, ...controlWidgets, ...displayWidgets];

	const categories = [
		{ id: "all", name: "All", count: allWidgets.length },
		{ id: "sensor", name: "Sensors", count: sensorWidgets.length },
		{ id: "control", name: "Controls", count: controlWidgets.length },
		{ id: "display", name: "Display", count: displayWidgets.length },
	];

	const filteredWidgets = allWidgets.filter((widget) => {
		const matchesSearch = widget.name.toLowerCase().includes(searchTerm.toLowerCase());
		const matchesCategory = selectedCategory === "all" || widget.category === selectedCategory;
		return matchesSearch && matchesCategory;
	});

	const getColorClasses = (color) => {
		const colorMap = {
			blue: "bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400",
			green: "bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400",
			purple: "bg-purple-100 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400",
			orange: "bg-orange-100 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400",
			yellow: "bg-yellow-100 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400",
			pink: "bg-pink-100 dark:bg-pink-900/20 text-pink-600 dark:text-pink-400",
			gray: "bg-gray-100 dark:bg-gray-900/20 text-gray-600 dark:text-gray-400",
			indigo: "bg-indigo-100 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400",
			teal: "bg-teal-100 dark:bg-teal-900/20 text-teal-600 dark:text-teal-400",
			red: "bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400",
			emerald: "bg-emerald-100 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400",
			amber: "bg-amber-100 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400",
			cyan: "bg-cyan-100 dark:bg-cyan-900/20 text-cyan-600 dark:text-cyan-400",
		};
		return colorMap[color] || colorMap.gray;
	};

	if (compact) {
		return (
			<div className='space-y-3'>
				{/* Search */}
				<div className='relative'>
					<Search className='absolute left-2 top-2.5 w-3 h-3 text-gray-400' />
					<input
						type='text'
						placeholder='Search widgets...'
						value={searchTerm}
						onChange={(e) => setSearchTerm(e.target.value)}
						className='w-full pl-7 pr-3 py-1.5 text-xs border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
					/>
				</div>

				{/* Categories */}
				<div className='flex flex-wrap gap-1'>
					{categories.map((category) => (
						<button
							key={category.id}
							onClick={() => setSelectedCategory(category.id)}
							className={`px-2 py-1 text-xs rounded-md transition-colors ${
								selectedCategory === category.id ?
									"bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
								:	"bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600"
							}`}>
							{category.name} ({category.count})
						</button>
					))}
				</div>

				{/* Widgets */}
				<div className='space-y-1'>
					{filteredWidgets.map((widget) => {
						const Icon = widget.icon;
						const colorClasses = getColorClasses(widget.color);
						return (
							<div
								key={widget.id}
								onClick={() => onAddWidget(widget.id)}
								className='flex items-center space-x-2 p-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-all duration-200 hover:shadow-sm group'>
								<div
									className={`w-6 h-6 rounded-lg flex items-center justify-center ${colorClasses.split(" ")[0]} ${colorClasses.split(" ")[1]}`}>
									<Icon className={`w-3 h-3 ${colorClasses.split(" ")[2]} ${colorClasses.split(" ")[3]}`} />
								</div>
								<span className='text-xs font-medium text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors'>
									{widget.name}
								</span>
							</div>
						);
					})}
				</div>
			</div>
		);
	}

	return (
		<div className='w-64 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 p-4'>
			<h3 className='text-lg font-semibold text-gray-900 dark:text-white mb-4'>Widgets</h3>

			{/* Search */}
			<div className='relative mb-4'>
				<Search className='absolute left-3 top-3 w-4 h-4 text-gray-400' />
				<input
					type='text'
					placeholder='Search widgets...'
					value={searchTerm}
					onChange={(e) => setSearchTerm(e.target.value)}
					className='w-full pl-9 pr-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
				/>
			</div>

			{/* Categories */}
			<div className='mb-4'>
				<div className='flex flex-wrap gap-1'>
					{categories.map((category) => (
						<button
							key={category.id}
							onClick={() => setSelectedCategory(category.id)}
							className={`px-3 py-1 text-xs rounded-md transition-colors ${
								selectedCategory === category.id ?
									"bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
								:	"bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600"
							}`}>
							{category.name} ({category.count})
						</button>
					))}
				</div>
			</div>

			{/* Widgets */}
			<div className='space-y-2'>
				{filteredWidgets.map((widget) => {
					const Icon = widget.icon;
					const colorClasses = getColorClasses(widget.color);
					return (
						<div
							key={widget.id}
							onClick={() => onAddWidget(widget.id)}
							className='flex items-center space-x-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-all duration-200 hover:shadow-md group'>
							<div
								className={`w-8 h-8 rounded-lg flex items-center justify-center ${colorClasses.split(" ")[0]} ${colorClasses.split(" ")[1]}`}>
								<Icon className={`w-4 h-4 ${colorClasses.split(" ")[2]} ${colorClasses.split(" ")[3]}`} />
							</div>
							<div className='flex-1'>
								<span className='text-sm font-medium text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors'>
									{widget.name}
								</span>
								<div className='text-xs text-gray-500 dark:text-gray-400 capitalize'>{widget.category}</div>
							</div>
						</div>
					);
				})}
			</div>
		</div>
	);
};

export default WidgetPanel;
