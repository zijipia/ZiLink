"use client";
import { ArrowUp, ArrowDown, ChevronsUp, ChevronsDown } from "lucide-react";

const PropertyPanel = ({
	selectedShape,
	devices,
	defaultDeviceId,
	availableDataKeys,
	onUpdateShape,
	onMoveZ,
	onMoveToFront,
	onMoveToBack,
}) => {
	if (!selectedShape) {
		return (
			<div className='w-64 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 p-4'>
				<h3 className='text-lg font-semibold text-gray-900 dark:text-white mb-4'>Properties</h3>
				<p className='text-sm text-gray-500 dark:text-gray-400'>Select an element to edit properties</p>
			</div>
		);
	}

	return (
		<div className='w-64 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 p-4'>
			<h3 className='text-lg font-semibold text-gray-900 dark:text-white mb-4'>Properties</h3>
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
						<div className='flex items-center gap-2'>
							<input
								id='showChart'
								type='checkbox'
								checked={!!selectedShape.showChart || selectedShape.widgetKind === "chart"}
								onChange={(e) => onUpdateShape({ showChart: e.target.checked })}
								className='w-4 h-4'
							/>
							<label
								htmlFor='showChart'
								className='text-xs text-gray-600 dark:text-gray-400 select-none'>
								Show chart inside
							</label>
						</div>
					</>
				}

				{/* Layer controls */}
				<div className='flex items-center gap-2'>
					<button
						onClick={() => onMoveZ(1)}
						className='px-2 py-1 rounded border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
						title='Bring forward'>
						<ArrowUp className='w-4 h-4' />
					</button>
					<button
						onClick={() => onMoveZ(-1)}
						className='px-2 py-1 rounded border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
						title='Send backward'>
						<ArrowDown className='w-4 h-4' />
					</button>
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
