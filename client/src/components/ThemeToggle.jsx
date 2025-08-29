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

	if (!mounted) return null; // Avoid rendering mismatched HTML

	return (
		<button
			onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
			aria-label='Toggle theme'
			className='p-2 rounded-full relative'>
			<Sun
				className={`h-5 w-5 transition-all text-black duration-500 ${theme === "dark" ? "rotate-90 scale-0" : "rotate-0 scale-100"}`}
			/>
			<Moon
				className={`absolute inset-0 m-auto h-5 w-5 text-white transition-all duration-500 ${theme === "dark" ? "rotate-0 scale-100" : "-rotate-90 scale-0"}`}
			/>
		</button>
	);
}
