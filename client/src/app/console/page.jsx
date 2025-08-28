"use client";

import { useEffect, useState } from "react";
import ThemeToggle from "@/components/ThemeToggle";
import websocketService from "@/lib/websocket";

export default function ConsolePage() {
	const [logs, setLogs] = useState([]);

	useEffect(() => {
		const events = ["device_data", "device_status", "device_alert", "device_online", "device_offline", "command_sent"];

		const handlers = {};
		events.forEach((evt) => {
			const handler = (data) => {
				setLogs((prev) => [
					...prev,
					{
						time: new Date().toISOString(),
						type: evt,
						data,
					},
				]);
			};
			handlers[evt] = handler;
			websocketService.on(evt, handler);
		});

		return () => {
			events.forEach((evt) => websocketService.off(evt, handlers[evt]));
		};
	}, []);

	return (
		<div className='min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-4'>
			<ThemeToggle />
			<h1 className='text-2xl font-bold mb-4'>Raw Console</h1>
			<div className='bg-gray-100 dark:bg-gray-800 rounded p-4 h-[80vh] overflow-y-auto font-mono text-sm'>
				{logs.map((log, idx) => (
					<div
						key={idx}
						className='mb-2'>
						<span className='text-gray-500 mr-2'>{log.time}</span>
						<span className='text-blue-500 mr-2'>{log.type}</span>
						<pre className='inline'>{JSON.stringify(log.data)}</pre>
					</div>
				))}
			</div>
		</div>
	);
}
