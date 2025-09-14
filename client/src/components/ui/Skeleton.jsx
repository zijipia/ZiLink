import * as React from "react";
import { cn } from "@/lib/utils";

const Skeleton = React.forwardRef(({ className, ...props }, ref) => (
	<div
		ref={ref}
		className={cn("animate-pulse rounded-md bg-gray-200 dark:bg-gray-700", className)}
		{...props}
	/>
));
Skeleton.displayName = "Skeleton";

const SkeletonCard = () => (
	<div className='rounded-xl border bg-white dark:bg-gray-800 shadow-sm p-6 space-y-4'>
		<div className='flex items-center justify-between'>
			<Skeleton className='h-6 w-32' />
			<Skeleton className='h-6 w-16 rounded-full' />
		</div>
		<div className='space-y-2'>
			<Skeleton className='h-4 w-full' />
			<Skeleton className='h-4 w-3/4' />
		</div>
		<div className='grid grid-cols-2 gap-4'>
			<Skeleton className='h-20 w-full' />
			<Skeleton className='h-20 w-full' />
		</div>
		<div className='flex space-x-2'>
			<Skeleton className='h-10 flex-1' />
			<Skeleton className='h-10 w-20' />
		</div>
	</div>
);

const SkeletonDashboard = () => (
	<div className='space-y-8'>
		{/* Summary Cards Skeleton */}
		<div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6'>
			{[...Array(4)].map((_, i) => (
				<div
					key={i}
					className='rounded-xl border bg-white dark:bg-gray-800 shadow-sm p-6'>
					<div className='flex items-center justify-between mb-2'>
						<Skeleton className='h-4 w-24' />
						<Skeleton className='h-4 w-4' />
					</div>
					<Skeleton className='h-8 w-16 mb-1' />
					<Skeleton className='h-3 w-20' />
				</div>
			))}
		</div>

		{/* Devices Section Skeleton */}
		<div className='space-y-6'>
			<div className='flex flex-col sm:flex-row sm:items-center justify-between'>
				<Skeleton className='h-8 w-48' />
				<Skeleton className='h-10 w-32' />
			</div>
			<div className='grid grid-cols-1 xl:grid-cols-2 gap-6'>
				{[...Array(2)].map((_, i) => (
					<SkeletonCard key={i} />
				))}
			</div>
		</div>
	</div>
);

export { Skeleton, SkeletonCard, SkeletonDashboard };
