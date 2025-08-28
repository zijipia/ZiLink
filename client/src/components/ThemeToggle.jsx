"use client";

import { useEffect, useState } from "react";

export default function ThemeToggle() {
	const [dark, setDark] = useState(false);

	useEffect(() => {
		const isDark = localStorage.getItem("theme") === "dark";
		setDark(isDark);
		document.documentElement.classList.toggle("dark", isDark);
	}, []);

	const toggle = () => {
		const next = !dark;
		setDark(next);
		document.documentElement.classList.toggle("dark", next);
		localStorage.setItem("theme", next ? "dark" : "light");
	};

	return (
		<button
			onClick={toggle}
			className='absolute top-2 right-2 px-2 py-1 border rounded bg-white dark:bg-gray-800 dark:text-white'>
			{dark ? "Light" : "Dark"}
		</button>
	);
}
