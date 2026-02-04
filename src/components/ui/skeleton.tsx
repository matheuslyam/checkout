'use client'

import { cn } from '@/lib/utils'

interface SkeletonProps {
    className?: string
}

// Base shimmer animation component
function Shimmer({ className }: SkeletonProps) {
    return (
        <div
            className={cn(
                'relative overflow-hidden rounded-xl bg-gray-200 dark:bg-gray-800',
                'before:absolute before:inset-0',
                'before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent',
                'before:animate-shimmer',
                className
            )}
        />
    )
}

// Generic skeleton line
export function SkeletonLine({ className }: SkeletonProps) {
    return <Shimmer className={cn('h-4 w-full', className)} />
}

// Input field skeleton
export function SkeletonInput({ className }: SkeletonProps) {
    return (
        <div className={cn('space-y-2', className)}>
            <Shimmer className="h-4 w-24" />
            <Shimmer className="h-12 w-full rounded-xl" />
        </div>
    )
}

// Button skeleton
export function SkeletonButton({ className }: SkeletonProps) {
    return <Shimmer className={cn('h-14 w-full rounded-xl', className)} />
}

// Card skeleton for OrderSummary
export function SkeletonCard({ className }: SkeletonProps) {
    return (
        <div className={cn(
            'bg-white dark:bg-gray-900 rounded-3xl p-6 lg:p-8 shadow-xl shadow-gray-200/50 dark:shadow-none border border-gray-100 dark:border-gray-800',
            className
        )}>
            {/* Header */}
            <div className="flex items-center gap-3 mb-6 pb-6 border-b border-gray-100 dark:border-gray-800">
                <Shimmer className="w-10 h-10 rounded-xl" />
                <Shimmer className="h-5 w-40" />
            </div>

            {/* Product */}
            <div className="flex gap-4 mb-6">
                <Shimmer className="w-20 h-20 rounded-2xl" />
                <div className="flex-1 space-y-2">
                    <Shimmer className="h-5 w-32" />
                    <Shimmer className="h-3 w-24" />
                    <Shimmer className="h-3 w-28" />
                </div>
            </div>

            {/* Prices */}
            <div className="space-y-3 mb-6 pb-6 border-b border-gray-100 dark:border-gray-800">
                <div className="flex justify-between">
                    <Shimmer className="h-4 w-16" />
                    <Shimmer className="h-4 w-24" />
                </div>
                <div className="flex justify-between">
                    <Shimmer className="h-4 w-12" />
                    <Shimmer className="h-4 w-16" />
                </div>
            </div>

            {/* Total */}
            <div className="flex justify-between mb-6">
                <Shimmer className="h-6 w-12" />
                <Shimmer className="h-8 w-32" />
            </div>

            {/* Trust badges */}
            <div className="space-y-2">
                <Shimmer className="h-4 w-48" />
                <Shimmer className="h-4 w-40" />
            </div>
        </div>
    )
}

// Form skeleton for checkout steps
export function CheckoutFormSkeleton() {
    return (
        <div className="animate-pulse space-y-6">
            {/* Title */}
            <div className="space-y-2 mb-8">
                <Shimmer className="h-8 w-48" />
                <Shimmer className="h-4 w-64" />
            </div>

            {/* Form fields */}
            <div className="space-y-5">
                <SkeletonInput />
                <SkeletonInput />
                <div className="grid grid-cols-2 gap-4">
                    <SkeletonInput />
                    <SkeletonInput />
                </div>
                <SkeletonInput />
            </div>

            {/* Button */}
            <div className="pt-4">
                <SkeletonButton />
            </div>
        </div>
    )
}

// Full checkout page skeleton (stepper + form)
export function CheckoutSkeleton() {
    return (
        <div className="animate-pulse space-y-6">
            {/* Stepper skeleton */}
            <div className="flex items-center justify-between mb-10">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center flex-1">
                        <Shimmer className="w-10 h-10 rounded-full" />
                        <Shimmer className="ml-3 h-4 w-20 rounded hidden sm:block" />
                        {i < 3 && <Shimmer className="flex-1 mx-4 h-0.5 rounded-full" />}
                    </div>
                ))}
            </div>

            <CheckoutFormSkeleton />
        </div>
    )
}

// Loading overlay for async operations
export function LoadingOverlay({ message = 'Processando...' }: { message?: string }) {
    return (
        <div className="absolute inset-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-3xl flex items-center justify-center z-10">
            <div className="flex flex-col items-center gap-4">
                <div className="relative w-12 h-12">
                    <div className="absolute inset-0 border-4 border-blue-200 dark:border-blue-900 rounded-full" />
                    <div className="absolute inset-0 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                </div>
                <p className="text-gray-600 dark:text-gray-400 font-medium">{message}</p>
            </div>
        </div>
    )
}

export default CheckoutSkeleton
