"use client";
import { ArrowUp, ArrowDown, ChevronsUp, ChevronsDown } from "lucide-react";

const PropertyPanel = ({
	selectedShape,
	devices,
	defaultDeviceId,
	availableDataKeys,
	onUpdateShape,
	onMoveToFront,
	onMoveToBack,
	fullSize = false,
}) => {
	const panelClass =
		fullSize ?
			"w-full h-full bg-white dark:bg-gray-800 p-6"
		:	"w-64 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 p-4";
	const titleClass =
		fullSize ?
			"text-xl font-semibold text-gray-900 dark:text-white mb-6"
		:	"text-lg font-semibold text-gray-900 dark:text-white mb-4";

	if (!selectedShape) {
		return (
			<div className={panelClass}>
				<h3 className={titleClass}>Properties</h3>
				<p className='text-sm text-gray-500 dark:text-gray-400'>Select an element to edit properties</p>
			</div>
		);
	}

	return (
		<div className={panelClass}>
			<h3 className={titleClass}>Properties</h3>
			<div className='space-y-4'>
				{/* Position */}
				<div className='grid grid-cols-2 gap-2'>
					<div>
						<label className='text-xs text-gray-600 dark:text-gray-400'>X</label>
						<input
							type='number'
							value={Math.round(selectedShape.x || 0)}
							onChange={(e) => onUpdateShape({ x: Number(e.target.value) || 0 })}
							className='w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white'
						/>
					</div>
					<div>
						<label className='text-xs text-gray-600 dark:text-gray-400'>Y</label>
						<input
							type='number'
							value={Math.round(selectedShape.y || 0)}
							onChange={(e) => onUpdateShape({ y: Number(e.target.value) || 0 })}
							className='w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white'
						/>
					</div>
				</div>

				{/* Type-specific properties */}
				{selectedShape.type === "text" ?
					<>
						<div>
							<label className='text-xs text-gray-600 dark:text-gray-400'>Text</label>
							<input
								value={selectedShape.text || ""}
								onChange={(e) => onUpdateShape({ text: e.target.value })}
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
									onChange={(e) => onUpdateShape({ fontSize: Number(e.target.value) || 16 })}
									className='w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white'
								/>
							</div>
							<div>
								<label className='text-xs text-gray-600 dark:text-gray-400'>Color</label>
								<input
									type='color'
									value={selectedShape.color || "#ffffff"}
									onChange={(e) => onUpdateShape({ color: e.target.value })}
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
								onChange={(e) => onUpdateShape({ deviceId: e.target.value })}
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

						{/* Widget-specific properties */}
						{selectedShape.widgetKind === "button" && (
							<>
								<div>
									<label className='text-xs text-gray-600 dark:text-gray-400'>Button Label</label>
									<input
										value={selectedShape.label || "Button"}
										onChange={(e) => onUpdateShape({ label: e.target.value })}
										className='w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white'
									/>
								</div>
								<div>
									<label className='text-xs text-gray-600 dark:text-gray-400'>Button Mode</label>
									<select
										value={selectedShape.buttonMode || "momentary"}
										onChange={(e) => onUpdateShape({ buttonMode: e.target.value })}
										className='w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white'>
										<option value="momentary">Momentary</option>
										<option value="toggle">Toggle</option>
									</select>
								</div>
								<div>
									<label className='text-xs text-gray-600 dark:text-gray-400'>Command</label>
									<input
										value={selectedShape.command || ""}
										onChange={(e) => onUpdateShape({ command: e.target.value })}
										placeholder='ESP32 command'
										className='w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white'
									/>
								</div>
							</>
						)}

						{selectedShape.widgetKind === "toggle" && (
							<>
								<div>
									<label className='text-xs text-gray-600 dark:text-gray-400'>Toggle Label</label>
									<input
										value={selectedShape.label || "Toggle"}
										onChange={(e) => onUpdateShape({ label: e.target.value })}
										className='w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white'
									/>
								</div>
								<div>
									<label className='text-xs text-gray-600 dark:text-gray-400'>On Command</label>
									<input
										value={selectedShape.onCommand || ""}
										onChange={(e) => onUpdateShape({ onCommand: e.target.value })}
										placeholder='ESP32 command when ON'
										className='w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white'
									/>
								</div>
								<div>
									<label className='text-xs text-gray-600 dark:text-gray-400'>Off Command</label>
									<input
										value={selectedShape.offCommand || ""}
										onChange={(e) => onUpdateShape({ offCommand: e.target.value })}
										placeholder='ESP32 command when OFF'
										className='w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white'
									/>
								</div>
							</>
						)}

						{selectedShape.widgetKind === "slider" && (
							<>
								<div>
									<label className='text-xs text-gray-600 dark:text-gray-400'>Slider Label</label>
									<input
										value={selectedShape.label || "Slider"}
										onChange={(e) => onUpdateShape({ label: e.target.value })}
										className='w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white'
									/>
								</div>
								<div className='grid grid-cols-2 gap-2'>
									<div>
										<label className='text-xs text-gray-600 dark:text-gray-400'>Min Value</label>
										<input
											type='number'
											value={selectedShape.minValue || 0}
											onChange={(e) => onUpdateShape({ minValue: Number(e.target.value) || 0 })}
											className='w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white'
										/>
									</div>
									<div>
										<label className='text-xs text-gray-600 dark:text-gray-400'>Max Value</label>
										<input
											type='number'
											value={selectedShape.maxValue || 100}
											onChange={(e) => onUpdateShape({ maxValue: Number(e.target.value) || 100 })}
											className='w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white'
										/>
									</div>
								</div>
								<div>
									<label className='text-xs text-gray-600 dark:text-gray-400'>Command Template</label>
									<input
										value={selectedShape.commandTemplate || ""}
										onChange={(e) => onUpdateShape({ commandTemplate: e.target.value })}
										placeholder='ESP32 command (use {value} for slider value)'
										className='w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white'
									/>
								</div>
								<div>
									<label className='text-xs text-gray-600 dark:text-gray-400'>Current Value</label>
									<input
										type='number'
										min={selectedShape.minValue || 0}
										max={selectedShape.maxValue || 100}
										value={selectedShape.currentValue || 0}
										onChange={(e) => {
											const value = Number(e.target.value);
											onUpdateShape({ currentValue: value });
											// Send command to ESP32
											if (selectedShape.deviceId && selectedShape.commandTemplate) {
												const command = selectedShape.commandTemplate.replace("{value}", value);
												// This would need to be passed from parent component
												// For now, we'll just update the local state
											}
										}}
										className='w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white'
									/>
								</div>
							</>
						)}

						{selectedShape.widgetKind === "switch" && (
							<>
								<div>
									<label className='text-xs text-gray-600 dark:text-gray-400'>Switch Label</label>
									<input
										value={selectedShape.label || "Switch"}
										onChange={(e) => onUpdateShape({ label: e.target.value })}
										className='w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white'
									/>
								</div>
								<div>
									<label className='text-xs text-gray-600 dark:text-gray-400'>On Command</label>
									<input
										value={selectedShape.onCommand || ""}
										onChange={(e) => onUpdateShape({ onCommand: e.target.value })}
										placeholder='ESP32 command when ON'
										className='w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white'
									/>
								</div>
								<div>
									<label className='text-xs text-gray-600 dark:text-gray-400'>Off Command</label>
									<input
										value={selectedShape.offCommand || ""}
										onChange={(e) => onUpdateShape({ offCommand: e.target.value })}
										placeholder='ESP32 command when OFF'
										className='w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white'
									/>
								</div>
							</>
						)}

						{selectedShape.widgetKind === "progress" && (
							<>
								<div>
									<label className='text-xs text-gray-600 dark:text-gray-400'>Progress Label</label>
									<input
										value={selectedShape.label || "Progress"}
										onChange={(e) => onUpdateShape({ label: e.target.value })}
										className='w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white'
									/>
								</div>
								<div>
									<label className='text-xs text-gray-600 dark:text-gray-400'>Data Key</label>
									<select
										value={selectedShape.dataKey || ""}
										onChange={(e) => onUpdateShape({ dataKey: e.target.value })}
										className='w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white'>
										<option value="">Select data key</option>
										{availableDataKeys.map((key) => (
											<option key={key} value={key}>{key}</option>
										))}
									</select>
								</div>
							</>
						)}

						{selectedShape.widgetKind === "knob" && (
							<>
								<div>
									<label className='text-xs text-gray-600 dark:text-gray-400'>Knob Label</label>
									<input
										value={selectedShape.label || "Knob"}
										onChange={(e) => onUpdateShape({ label: e.target.value })}
										className='w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white'
									/>
								</div>
								<div className='grid grid-cols-2 gap-2'>
									<div>
										<label className='text-xs text-gray-600 dark:text-gray-400'>Min Value</label>
										<input
											type='number'
											value={selectedShape.minValue || 0}
											onChange={(e) => onUpdateShape({ minValue: Number(e.target.value) || 0 })}
											className='w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white'
										/>
									</div>
									<div>
										<label className='text-xs text-gray-600 dark:text-gray-400'>Max Value</label>
										<input
											type='number'
											value={selectedShape.maxValue || 100}
											onChange={(e) => onUpdateShape({ maxValue: Number(e.target.value) || 100 })}
											className='w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white'
										/>
									</div>
								</div>
								<div>
									<label className='text-xs text-gray-600 dark:text-gray-400'>Command Template</label>
									<input
										value={selectedShape.commandTemplate || ""}
										onChange={(e) => onUpdateShape({ commandTemplate: e.target.value })}
										placeholder='ESP32 command (use {value} for knob value)'
										className='w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white'
									/>
								</div>
								<div>
									<label className='text-xs text-gray-600 dark:text-gray-400'>Current Value</label>
									<input
										type='number'
										min={selectedShape.minValue || 0}
										max={selectedShape.maxValue || 100}
										value={selectedShape.currentValue || 0}
										onChange={(e) => {
											const value = Number(e.target.value);
											onUpdateShape({ currentValue: value });
											// Send command to ESP32
											if (selectedShape.deviceId && selectedShape.commandTemplate) {
												const command = selectedShape.commandTemplate.replace("{value}", value);
												// This would need to be passed from parent component
												// For now, we'll just update the local state
											}
										}}
										className='w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white'
									/>
								</div>
							</>
						)}

						{selectedShape.widgetKind === "chart" && (
							<div className='flex items-center gap-2'>
								<input
									id='showChart'
									type='checkbox'
									checked={!!selectedShape.showChart}
									onChange={(e) => onUpdateShape({ showChart: e.target.checked })}
									className='w-4 h-4'
								/>
								<label
									htmlFor='showChart'
									className='text-xs text-gray-600 dark:text-gray-400 select-none'>
									Show chart inside
								</label>
							</div>
						)}
					</>
				}

				{/* Layer controls */}
				<div className='flex items-center gap-2'>
					<button
						onClick={onMoveToFront}
						className='px-2 py-1 rounded border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
						title='Bring to front'>
						<ChevronsUp className='w-4 h-4' />
					</button>
					<button
						onClick={onMoveToBack}
						className='px-2 py-1 rounded border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
						title='Send to back'>
						<ChevronsDown className='w-4 h-4' />
					</button>
				</div>

				{/* Size controls */}
				{selectedShape.type !== "text" && (
					<div className='grid grid-cols-2 gap-2'>
						<div>
							<label className='text-xs text-gray-600 dark:text-gray-400'>Width</label>
							<input
								type='number'
								value={Math.round(selectedShape.w || 0)}
								onChange={(e) => onUpdateShape({ w: Number(e.target.value) || 0 })}
								className='w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white'
							/>
						</div>
						<div>
							<label className='text-xs text-gray-600 dark:text-gray-400'>Height</label>
							<input
								type='number'
								value={Math.round(selectedShape.h || 0)}
								onChange={(e) => onUpdateShape({ h: Number(e.target.value) || 0 })}
								className='w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white'
							/>
						</div>
					</div>
				)}
			</div>
		</div>
	);
};

export default PropertyPanel;
