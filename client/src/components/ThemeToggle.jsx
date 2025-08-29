"use client";

import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

export default function ThemeToggle() {
	const [dark, setDark] = useState(false);

	useEffect(() => {
		const stored = localStorage.getItem("theme");
		const isDark = stored === "dark" || (!stored && window.matchMedia("(prefers-color-scheme: dark)").matches);
		setDark(isDark);
		document.documentElement.classList.toggle("dark", isDark);
		document.body.classList.toggle("dark", isDark);
	}, []);

	const toggle = () => {
		const next = !dark;
		setDark(next);
		document.documentElement.classList.toggle("dark", next);
		document.body.classList.toggle("dark", next);
		localStorage.setItem("theme", next ? "dark" : "light");
	};

	return (
		<button
			onClick={toggle}
			aria-label='Toggle theme'
			className='fixed top-2 right-2 p-2 rounded-full bg-white text-gray-900 dark:bg-gray-800 dark:text-gray-100 relative'>
			<Sun className={`h-5 w-5 transition-all duration-500 ${dark ? "rotate-90 scale-0" : "rotate-0 scale-100"}`} />
			<Moon
				className={`absolute inset-0 m-auto h-5 w-5 transition-all duration-500 ${dark ? "rotate-0 scale-100" : "-rotate-90 scale-0"}`}
			/>
		</button>
	);
}
