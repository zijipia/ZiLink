import * as React from "react";
import { cn } from "@/lib/utils";

const Card = React.forwardRef(({ className, ...props }, ref) => (
	<div
		ref={ref}
		className={cn(
			"rounded-xl border bg-white text-gray-900 shadow-sm hover:shadow-md transition-shadow duration-200 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700",
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

const CardHeader = React.forwardRef(({ className, ...props }, ref) => (
	<div
		ref={ref}
		className={cn("flex flex-col space-y-1.5 p-6", className)}
		{...props}
	/>
));
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef(({ className, children, ...props }, ref) => (
	<h3
		ref={ref}
		className={cn("text-lg font-semibold leading-none tracking-tight text-gray-900 dark:text-white", className)}
		{...props}>
		{children}
	</h3>
));
CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef(({ className, ...props }, ref) => (
	<p
		ref={ref}
		className={cn("text-sm text-gray-500 dark:text-gray-400", className)}
		{...props}
	/>
));
CardDescription.displayName = "CardDescription";

const CardFooter = React.forwardRef(({ className, ...props }, ref) => (
	<div
		ref={ref}
		className={cn("flex items-center p-6 pt-0", className)}
		{...props}
	/>
));
CardFooter.displayName = "CardFooter";

export { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter };
