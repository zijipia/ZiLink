"use client";

import { useState } from "react";
import {
	HelpCircle,
	X,
	MousePointer,
	Square,
	Circle,
	Triangle,
	Type,
	Thermometer,
	Droplet,
	Gauge,
	Sun,
	Volume2,
	Activity,
} from "lucide-react";

const DesignerGuide = ({ isOpen, onClose }) => {
	const [currentStep, setCurrentStep] = useState(0);

	const steps = [
		{
			title: "Chào mừng đến với Designer!",
			content:
				"Designer cho phép bạn tạo dashboard tương tác với các widget IoT. Hãy làm theo hướng dẫn này để sử dụng hiệu quả.",
			icon: HelpCircle,
		},
		{
			title: "Toolbar bên trái",
			content: "Sử dụng toolbar để chọn công cụ vẽ. Chọn 'Select' để di chuyển và chỉnh sửa widget.",
			icon: MousePointer,
			tools: [
				{ name: "Select", icon: MousePointer, desc: "Chọn và di chuyển widget" },
				{ name: "Rectangle", icon: Square, desc: "Vẽ hình chữ nhật" },
				{ name: "Circle", icon: Circle, desc: "Vẽ hình tròn" },
				{ name: "Triangle", icon: Triangle, desc: "Vẽ hình tam giác" },
				{ name: "Text", icon: Type, desc: "Thêm văn bản" },
			],
		},
		{
			title: "Widget Panel",
			content: "Click vào widget trong panel để thêm vào canvas. Widget sẽ được đặt tự động để tránh chồng lấp.",
			icon: Thermometer,
			widgets: [
				{ name: "Temperature", icon: Thermometer, color: "blue" },
				{ name: "Humidity", icon: Droplet, color: "green" },
				{ name: "Pressure", icon: Gauge, color: "purple" },
				{ name: "Light", icon: Sun, color: "yellow" },
				{ name: "Sound", icon: Volume2, color: "pink" },
				{ name: "Motion", icon: Activity, color: "orange" },
			],
		},
		{
			title: "Property Panel",
			content:
				"Chọn widget để chỉnh sửa thuộc tính trong Property Panel bên phải. Bạn có thể thay đổi vị trí, kích thước, device và data key.",
			icon: Square,
		},
		{
			title: "Code Generator",
			content:
				"Sử dụng Code Generator để tự động tạo code ESP32 từ các widget đã tạo. Code sẽ bao gồm tất cả cảm biến và chức năng cần thiết.",
			icon: HelpCircle,
		},
		{
			title: "Canvas Controls",
			content: "Sử dụng các nút Clear để xóa tất cả widget, Save để lưu layout. Grid giúp căn chỉnh widget dễ dàng hơn.",
			icon: Square,
		},
	];

	const nextStep = () => {
		if (currentStep < steps.length - 1) {
			setCurrentStep(currentStep + 1);
		}
	};

	const prevStep = () => {
		if (currentStep > 0) {
			setCurrentStep(currentStep - 1);
		}
	};

	if (!isOpen) return null;

	const currentStepData = steps[currentStep];
	const Icon = currentStepData.icon;

	return (
		<div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
			<div className='bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto'>
				<div className='flex items-center justify-between mb-4'>
					<div className='flex items-center space-x-3'>
						<Icon className='w-6 h-6 text-blue-600' />
						<h2 className='text-xl font-bold text-gray-900 dark:text-white'>{currentStepData.title}</h2>
					</div>
					<button
						onClick={onClose}
						className='p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors'>
						<X className='w-5 h-5' />
					</button>
				</div>

				<div className='mb-6'>
					<p className='text-gray-600 dark:text-gray-400 mb-4'>{currentStepData.content}</p>

					{currentStepData.tools && (
						<div className='grid grid-cols-2 gap-3'>
							{currentStepData.tools.map((tool, index) => {
								const ToolIcon = tool.icon;
								return (
									<div
										key={index}
										className='flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg'>
										<ToolIcon className='w-5 h-5 text-gray-600 dark:text-gray-400' />
										<div>
											<div className='font-medium text-gray-900 dark:text-white'>{tool.name}</div>
											<div className='text-sm text-gray-500 dark:text-gray-400'>{tool.desc}</div>
										</div>
									</div>
								);
							})}
						</div>
					)}

					{currentStepData.widgets && (
						<div className='grid grid-cols-3 gap-3'>
							{currentStepData.widgets.map((widget, index) => {
								const WidgetIcon = widget.icon;
								return (
									<div
										key={index}
										className='flex items-center space-x-2 p-2 bg-gray-50 dark:bg-gray-700 rounded-lg'>
										<WidgetIcon className={`w-4 h-4 text-${widget.color}-600`} />
										<span className='text-sm font-medium text-gray-900 dark:text-white'>{widget.name}</span>
									</div>
								);
							})}
						</div>
					)}
				</div>

				<div className='flex items-center justify-between'>
					<div className='flex space-x-2'>
						{steps.map((_, index) => (
							<div
								key={index}
								className={`w-2 h-2 rounded-full ${index === currentStep ? "bg-blue-600" : "bg-gray-300 dark:bg-gray-600"}`}
							/>
						))}
					</div>

					<div className='flex space-x-3'>
						{currentStep > 0 && (
							<button
								onClick={prevStep}
								className='px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors'>
								Previous
							</button>
						)}
						{currentStep < steps.length - 1 ?
							<button
								onClick={nextStep}
								className='px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors'>
								Next
							</button>
						:	<button
								onClick={onClose}
								className='px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors'>
								Bắt đầu sử dụng!
							</button>
						}
					</div>
				</div>
			</div>
		</div>
	);
};

export default DesignerGuide;
