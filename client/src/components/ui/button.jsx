import * as React from "react";
import { cn } from "@/lib/utils";

const buttonVariants = {
	default:
		"bg-gradient-to-r from-blue-600 to-cyan-600 text-white hover:from-blue-700 hover:to-cyan-700 shadow-sm hover:shadow-md",
	outline:
		"border border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800 shadow-sm hover:shadow-md",
	ghost: "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800",
	destructive: "bg-red-600 text-white hover:bg-red-700 shadow-sm hover:shadow-md",
	secondary: "bg-gray-100 text-gray-900 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700",
};

const buttonSizes = {
	default: "h-10 px-4 py-2 text-sm",
	lg: "h-12 px-6 text-base",
	sm: "h-8 px-3 text-xs",
	icon: "h-10 w-10",
};

const Button = React.forwardRef(({ className, variant = "default", size = "default", ...props }, ref) => {
	return (
		<button
			ref={ref}
			className={cn(
				"inline-flex items-center justify-center rounded-lg font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none disabled:cursor-not-allowed",
				buttonVariants[variant],
				buttonSizes[size],
				className,
			)}
			{...props}
		/>
	);
});
Button.displayName = "Button";

export { Button };
