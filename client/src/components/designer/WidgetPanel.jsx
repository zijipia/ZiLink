"use client";
import { Thermometer, Droplet, Gauge, Activity, Sun, Volume2 } from "lucide-react";

const WidgetPanel = ({ onWidgetDrag }) => {
	const widgets = [
		{ id: "temperature", name: "Temperature", icon: Thermometer, color: "blue" },
		{ id: "humidity", name: "Humidity", icon: Droplet, color: "green" },
		{ id: "pressure", name: "Pressure", icon: Gauge, color: "purple" },
		{ id: "motion", name: "Motion", icon: Activity, color: "orange" },
		{ id: "light", name: "Light", icon: Sun, color: "yellow" },
		{ id: "sound", name: "Sound", icon: Volume2, color: "pink" },
	];

	return (
		<div className='w-64 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 p-4'>
			<h3 className='text-lg font-semibold text-gray-900 dark:text-white mb-4'>Widgets</h3>
			<div className='space-y-2'>
				{widgets.map((widget) => {
					const Icon = widget.icon;
					return (
						<div
							key={widget.id}
							draggable
							onDragStart={(e) => onWidgetDrag(e, widget)}
							className='flex items-center space-x-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-move transition-colors'>
							<div
								className={`w-8 h-8 rounded-lg flex items-center justify-center bg-${widget.color}-100 dark:bg-${widget.color}-900/20`}>
								<Icon className={`w-4 h-4 text-${widget.color}-600 dark:text-${widget.color}-400`} />
							</div>
							<span className='text-sm font-medium text-gray-900 dark:text-white'>{widget.name}</span>
						</div>
					);
				})}
			</div>
		</div>
	);
};

export default WidgetPanel;
