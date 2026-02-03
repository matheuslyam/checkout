"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { Check } from "lucide-react"

import { cn } from "@/lib/utils"

interface StepperProps {
    steps: { label: string; description?: string }[]
    currentStep: number
    className?: string
}

export function Stepper({ steps, currentStep, className }: StepperProps) {
    return (
        <div className={cn("relative flex w-full flex-col gap-2", className)}>
            <div className="flex w-full items-center justify-between">
                {steps.map((step, index) => {
                    const isCompleted = index < currentStep
                    const isActive = index === currentStep
                    const isLast = index === steps.length - 1

                    return (
                        <React.Fragment key={step.label}>
                            <div className="flex flex-col items-center gap-2 relative z-10 bg-background/50 backdrop-blur-sm p-2 rounded-lg">
                                <div
                                    className={cn(
                                        "flex h-8 w-8 items-center justify-center rounded-full border-2 transition-colors duration-300",
                                        isActive
                                            ? "border-primary bg-background text-primary"
                                            : isCompleted
                                                ? "border-primary bg-primary text-primary-foreground"
                                                : "border-muted-foreground/30 text-muted-foreground/50"
                                    )}
                                >
                                    {isCompleted ? (
                                        <Check className="h-4 w-4" />
                                    ) : (
                                        <span className="text-xs font-semibold">{index + 1}</span>
                                    )}
                                </div>
                                <span
                                    className={cn(
                                        "text-xs font-medium transition-colors duration-300 hidden sm:inline-block",
                                        isActive || isCompleted
                                            ? "text-foreground"
                                            : "text-muted-foreground"
                                    )}
                                >
                                    {step.label}
                                </span>
                            </div>
                            {!isLast && (
                                <div className="flex-1 px-2 relative -mx-4 top-[-14px] -z-0">
                                    <div className="h-[2px] w-full bg-secondary">
                                        <motion.div
                                            className="h-full bg-primary"
                                            initial={{ width: "0%" }}
                                            animate={{
                                                width: isCompleted ? "100%" : "0%",
                                            }}
                                            transition={{ duration: 0.5, ease: "easeInOut" }}
                                        />
                                    </div>
                                </div>
                            )}
                        </React.Fragment>
                    )
                })}
            </div>
        </div>
    )
}
