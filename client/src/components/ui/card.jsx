import * as React from "react";
import { cn } from "@/lib/utils";

const Card = React.forwardRef(({ className, ...props }, ref) => (
	<div
		ref={ref}
		className={cn(
			"rounded-xl border bg-white text-gray-900 shadow dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700",
			className,
		)}
		{...props}
	/>
));
Card.displayName = "Card";

const CardContent = React.forwardRef(({ className, ...props }, ref) => (
	<div
		ref={ref}
		className={cn("p-6", className)}
		{...props}
	/>
));
CardContent.displayName = "CardContent";

export { Card, CardContent };
