import { Toaster } from "react-hot-toast";

/**
 * Global toast provider with modern styling
 */
export default function ToastProvider() {
	return (
		<Toaster
			position='top-right'
			gutter={8}
			toastOptions={{
				duration: 4000,
				className:
					"rounded-xl bg-white/90 dark:bg-[#121212]/90 text-gray-900 dark:text-gray-100 shadow-lg border border-gray-200 dark:border-gray-800 backdrop-blur-md",
				success: {
					className: "border-l-4 border-green-500 bg-green-50 dark:bg-green-900/40 text-green-800 dark:text-green-100", // tailwind
				},
				error: {
					className: "border-l-4 border-red-500 bg-red-50 dark:bg-red-900/40 text-red-800 dark:text-red-100",
				},
			}}
		/>
	);
}
