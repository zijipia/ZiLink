"use client";

import React from "react";
import { motion, useSpring } from "framer-motion";

export function Gauge({ value, max = 100, unit = "%", size = 100, strokeWidth = 10, color = "#3b82f6" }) {
	const radius = (size - strokeWidth) / 2;
	const circumference = radius * 2 * Math.PI;
	const offset = circumference - (value / max) * circumference;

	const animatedValue = useSpring(value, { stiffness: 100, damping: 10 });

	return (
		<div className='flex flex-col items-center'>
			<svg
				width={size}
				height={size}
				viewBox={`0 0 ${size} ${size}`}
				className='transform -rotate-90'>
				{/* Background circle */}
				<circle
					r={radius}
					cx={size / 2}
					cy={size / 2}
					fill='transparent'
					stroke='#e5e7eb'
					strokeWidth={strokeWidth}
					className='dark:stroke-gray-600'
				/>
				{/* Animated foreground circle */}
				<motion.circle
					r={radius}
					cx={size / 2}
					cy={size / 2}
					fill='transparent'
					stroke={color}
					strokeWidth={strokeWidth}
					strokeDasharray={circumference}
					strokeDashoffset={offset}
					strokeLinecap='round'
					initial={{ strokeDashoffset: circumference }}
					animate={{ strokeDashoffset: animatedValue }}
					transition={{ duration: 1, ease: "easeOut" }}
					className='transition-colors'
				/>
				{/* Center text */}
				<text
					x={size / 2}
					y={size / 2}
					textAnchor='middle'
					dy='.3em'
					className='font-bold text-lg fill-current text-gray-700 dark:text-gray-300'>
					{Math.round(animatedValue.get())}
					{unit}
				</text>
			</svg>
			<p className='text-xs text-gray-500 dark:text-gray-400 mt-1'>
				{value} {unit}
			</p>
		</div>
	);
}
