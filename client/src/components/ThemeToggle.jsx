"use client";

import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

/**
 * Theme toggle button that switches between light and dark modes.
 * Applies the chosen theme to both the `<html>` and `<body>` elements
 * and persists the user's preference in local storage.
 */
export default function ThemeToggle() {
	const [dark, setDark] = useState(false);

	const applyTheme = (isDark) => {
		setDark(isDark);
		const method = isDark ? "add" : "remove";
		document.documentElement.classList[method]("dark");
		document.body.classList[method]("dark");
		localStorage.setItem("theme", isDark ? "dark" : "light");
	};

	useEffect(() => {
		const stored = localStorage.getItem("theme");
		const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
		applyTheme(stored ? stored === "dark" : prefersDark);
	}, []);

	return (
		<button
			onClick={() => applyTheme(!dark)}
			aria-label='Toggle theme'
			className='p-2 rounded-full bg-gray-200 text-gray-900 dark:bg-gray-800 dark:text-gray-100 relative'>
			<Sun className={`h-5 w-5 transition-all duration-500 ${dark ? "rotate-90 scale-0" : "rotate-0 scale-100"}`} />
			<Moon
				className={`absolute inset-0 m-auto h-5 w-5 transition-all duration-500 ${dark ? "rotate-0 scale-100" : "-rotate-90 scale-0"}`}
			/>
		</button>
	);
}
