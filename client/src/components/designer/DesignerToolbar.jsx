"use client";
import {
	Layout,
	Square,
	Circle,
	Triangle,
	Type,
	ImageIcon,
	BarChart3,
	Thermometer,
	Droplet,
	Gauge,
	Sun,
	Volume2,
	Activity,
	MousePointer,
} from "lucide-react";

const DesignerToolbar = ({ selectedTool, onToolSelect, horizontal = true }) => {
	const tools = [
		{ id: "select", name: "Select", icon: Layout },
		{ id: "rectangle", name: "Rectangle", icon: Square },
		{ id: "circle", name: "Circle", icon: Circle },
		{ id: "triangle", name: "Triangle", icon: Triangle },
		{ id: "text", name: "Text", icon: Type },
		{ id: "chart", name: "Chart", icon: BarChart3 },
		// Widget tools
		{ id: "temperature", name: "Temperature", icon: Thermometer },
		{ id: "humidity", name: "Humidity", icon: Droplet },
		{ id: "pressure", name: "Pressure", icon: Gauge },
		{ id: "light", name: "Light", icon: Sun },
		{ id: "sound", name: "Sound", icon: Volume2 },
		{ id: "motion", name: "Motion", icon: Activity },
		{ id: "button", name: "Button", icon: MousePointer },
	];

	if (horizontal) {
		return (
			<div className='w-16 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col items-center py-4 space-y-2'>
				{tools.map((tool) => {
					const Icon = tool.icon;
					return (
						<button
							key={tool.id}
							onClick={() => onToolSelect(tool.id)}
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
		);
	}

	return (
		<div className='grid grid-cols-2 gap-2'>
			{tools.map((tool) => {
				const Icon = tool.icon;
				return (
					<button
						key={tool.id}
						onClick={() => onToolSelect(tool.id)}
						className={`flex items-center space-x-2 p-2 rounded-lg transition-colors ${
							selectedTool === tool.id ?
								"bg-blue-600 text-white"
							:	"text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
						}`}>
						<Icon className='w-4 h-4' />
						<span className='text-xs font-medium'>{tool.name}</span>
					</button>
				);
			})}
		</div>
	);
};

export default DesignerToolbar;
