import * as React from "react";
import { cn } from "@/lib/utils";

const buttonVariants = {
	default: "bg-blue-600 text-white hover:bg-blue-700",
	outline: "border border-gray-300 text-gray-700 hover:bg-gray-100",
	ghost: "text-gray-700 hover:bg-gray-100",
};

const buttonSizes = {
	default: "h-10 px-4 py-2",
	lg: "h-12 px-6",
	sm: "h-8 px-3",
};

const Button = React.forwardRef(({ className, variant = "default", size = "default", ...props }, ref) => {
	return (
		<button
			ref={ref}
			className={cn(
				"inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none",
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
