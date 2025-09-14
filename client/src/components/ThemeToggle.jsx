"use client";

import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";
import { useTheme } from "next-themes";

/**
 * Theme toggle button that switches between light and dark modes.
 * Applies the chosen theme using the `next-themes` library.
 */
export default function ThemeToggle() {
	const { theme, setTheme } = useTheme();
	const [mounted, setMounted] = useState(false);

	// Ensure the component is mounted before rendering
	useEffect(() => {
		setMounted(true);
	}, []);

	if (!mounted) {
		return <div className='w-10 h-10 rounded-lg bg-gray-200 dark:bg-gray-700 animate-pulse' />;
	}

	return (
		<button
			onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
			aria-label='Toggle theme'
			className='relative p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900'>
			<Sun
				className={`h-5 w-5 transition-all duration-300 text-amber-500 ${
					theme === "dark" ? "rotate-90 scale-0 opacity-0" : "rotate-0 scale-100 opacity-100"
				}`}
			/>
			<Moon
				className={`absolute inset-0 m-auto h-5 w-5 transition-all duration-300 text-blue-600 dark:text-blue-400 ${
					theme === "dark" ? "rotate-0 scale-100 opacity-100" : "-rotate-90 scale-0 opacity-0"
				}`}
			/>
		</button>
	);
}
