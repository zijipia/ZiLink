"use client";

import React from "react";
import { motion } from "framer-motion";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Card, CardContent } from "@/components/ui/card";

export function LiveChart({ data = [], height = 200, title = "Sensor Data" }) {
	const chartData =
		data.length > 0 ?
			data
		:	[
				{ time: "00:00", value: Math.random() * 100 },
				{ time: "01:00", value: Math.random() * 100 },
				{ time: "02:00", value: Math.random() * 100 },
				{ time: "03:00", value: Math.random() * 100 },
				{ time: "04:00", value: Math.random() * 100 },
			];

	return (
		<motion.div
			initial={{ opacity: 0 }}
			animate={{ opacity: 1 }}
			className='w-full h-full'>
			<Card className='w-full h-full dark:bg-gray-800'>
				<CardContent className='p-4 h-full'>
					<h3 className='text-sm font-medium mb-3 text-gray-700 dark:text-gray-300'>{title}</h3>
					<ResponsiveContainer
						width='100%'
						height={height}>
						<LineChart data={chartData}>
							<CartesianGrid
								strokeDasharray='3 3'
								stroke='#f1f5f9'
								className='dark:stroke-gray-700'
							/>
							<XAxis
								dataKey='time'
								stroke='#64748b'
								className='dark:stroke-gray-400'
								tick={{ fontSize: 10 }}
							/>
							<YAxis
								stroke='#64748b'
								className='dark:stroke-gray-400'
								tick={{ fontSize: 10 }}
							/>
							<Tooltip
								contentStyle={{
									backgroundColor: "rgba(0,0,0,0.8)",
									border: "none",
									color: "white",
								}}
							/>
							<Line
								type='monotone'
								dataKey='value'
								stroke='#3b82f6'
								strokeWidth={2}
								dot={{ fill: "#3b82f6", strokeWidth: 2, r: 4 }}
								activeDot={{ r: 6 }}
							/>
						</LineChart>
					</ResponsiveContainer>
				</CardContent>
			</Card>
		</motion.div>
	);
}
